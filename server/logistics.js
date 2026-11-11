import * as rules from '../src/live/rules.js';
import { createBus } from './lib/bus.js';
import { PROFILES } from './lib/catalog.js';
import { openDb } from './lib/db.js';

// Logistics: the courier fleet of every country. It follows each region's retained order list
// (state, not events), so after a restart it simply sees which orders wait for a courier and
// assigns them: nothing is lost while it is down. Assignment is by proximity and availability
// with load balancing (rules.pickCourier). One assignment at a time per process, and the region
// accepts it only if the order is still waiting (its transaction), so no order gets two couriers.
// While a courier rides, their position is published every second with QoS 0: a lost update is
// simply replaced by the next one (the UDP-like part of the system).

const db = openDb('logistics', `
  CREATE TABLE IF NOT EXISTS couriers (id TEXT PRIMARY KEY, region TEXT NOT NULL, status TEXT NOT NULL, lat REAL, lon REAL);
`);
const bus = createBus('logistics');
const orders = {}; // region → latest order list
const proposed = new Map(); // orderId → { courierId, at }: offered, waiting for the region to confirm
const delivered = new Set(); // rides already finished (the courier now waits at that door)

const stored = (region) =>
  Object.fromEntries(
    db
      .prepare('SELECT * FROM couriers WHERE region = ?')
      .all(region)
      .map((row) => [row.id, { status: row.status, position: row.lat === null ? null : { lat: row.lat, lon: row.lon } }])
  );
const fleet = (region) => rules.fleetOf(region.toUpperCase(), PROFILES[region.toUpperCase()]?.couriers ?? [], stored(region), orders[region] ?? []);
const publishFleet = (region) => bus.publish(`nf/${region}/fleet`, stored(region), { retain: true });

const save = (id, region, patch) => {
  const current = stored(region)[id] ?? { status: 'available', position: null };
  const next = { ...current, ...patch };
  db.prepare('INSERT INTO couriers VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET status = excluded.status, lat = excluded.lat, lon = excluded.lon').run(
    id, region, next.status, next.position?.lat ?? null, next.position?.lon ?? null
  );
};

const assignWaiting = async (region) => {
  const list = orders[region] ?? [];
  for (const order of list.filter((entry) => entry.status === 'ready' && entry.fulfillment === 'delivery' && !entry.courierId)) {
    const offer = proposed.get(order.id);
    if (offer && Date.now() - offer.at < 5000) continue; // already offered; give the region a moment
    // Offers not yet confirmed count as load, so two waiting orders do not pile onto one courier.
    const pending = [...proposed.values()].filter((entry) => Date.now() - entry.at < 5000);
    const couriers = fleet(region).map((courier) => ({ ...courier, load: courier.load + pending.filter((entry) => entry.courierId === courier.id).length }));
    const courier = rules.pickCourier(order, couriers);
    if (!courier) continue;
    proposed.set(order.id, { courierId: courier.id, at: Date.now() });
    console.log(`[logistics] ${order.id} → ${courier.name}`);
    await bus.publish(`nf/${region}/logistics/assigned`, { orderId: order.id, courierId: courier.id, courierName: courier.name });
  }
};

// Each region's retained order list: new waiting orders, finished rides.
bus.on('nf/+/orders', async (list, topic) => {
  const region = topic.split('/')[1];
  orders[region] = list ?? [];
  for (const order of orders[region]) {
    if (order.status !== 'ready') proposed.delete(order.id);
    // After a delivery the courier waits at the customer's door.
    if (order.status === 'delivered' && order.courierId && !delivered.has(order.id)) {
      delivered.add(order.id);
      save(order.courierId, region, { position: order.destination });
    }
  }
  await assignWaiting(region);
  await publishFleet(region);
});

bus.on('nf/+/logistics/status', async ({ courierId, status }, topic) => {
  const region = topic.split('/')[1];
  save(courierId, region, { status });
  console.log(`[logistics] ${courierId} ${status}`);
  await publishFleet(region);
  await assignWaiting(region);
});

await bus.start();
for (const country of Object.keys(PROFILES)) await publishFleet(country.toLowerCase());

// Live positions of the couriers on a ride, once a second, fire-and-forget (QoS 0).
setInterval(() => {
  for (const [region, list] of Object.entries(orders)) {
    const riding = list.filter((order) => order.status === 'onTheWay');
    if (!riding.length) continue;
    const positions = Object.fromEntries(riding.map((order) => [order.courierId, rules.courierPosition(order, null)]));
    bus.publish(`nf/${region}/positions`, positions, { qos: 0 });
  }
}, 1000);
console.log('[logistics] ready');
