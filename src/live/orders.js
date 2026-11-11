import { NODES, getNode } from '../distributed/cluster';
import { getRegion } from '../geo/region';
import { profileFor } from '../region/profiles';
import * as rules from './rules';
import { REMOTE, call } from './remote';
import { getLive, updateLive, withLock } from './store';

// The order actions every app uses. The rules (lifecycle, notifications, courier choice) live in
// rules.js and are the same code the regional servers run. Here each action either applies them
// to the shared browser state (local mode) or sends the command to the order's region (live mode).

export { ACTIVE, CANCELLABLE, TRIP_MS, averageRating, courierPosition, pickCourier, tripProgress } from './rules';

const regionCenter = (country) => getRegion().location ?? profileFor(country).pilotCity;

// Real nearby stores carry their coordinates; the demo branches are placed around the shopper.
export const storePosition = (nodeId, country) => {
  const node = getNode(nodeId);
  if (Number.isFinite(node.lat)) return { lat: node.lat, lon: node.lon };
  return rules.around(regionCenter(country), nodeId, 600 + (NODES.findIndex((entry) => entry.id === nodeId) + 1) * 400);
};

// The courier fleet of a country (names from its profile), with live status, position and load.
export const fleet = (country, live = getLive()) => rules.fleetOf(country, profileFor(country)?.couriers ?? [], live.couriers, live.orders);

// ---------- Local mode: one atomic write per transition, notifications derived from it ----------

const change = (id, transition) =>
  updateLive((live) => {
    const order = live.orders.find((entry) => entry.id === id);
    const next = order && transition(order, live);
    if (!next) return {};
    return {
      orders: live.orders.map((entry) => (entry.id === id ? next : entry)),
      notifications: [...rules.notices(order, next), ...live.notifications].slice(0, 200)
    };
  });

const assignLocal = (order, live) => rules.assign(order, rules.pickCourier(order, fleet(order.country, live)));

// ---------- Live mode: the command goes to the region of the order's country ----------

// Which actor sends each command; the region checks the role (access control by role).
const ROLE = { accept: 'merchant', reject: 'merchant', ready: 'merchant', handover: 'merchant', pickup: 'courier', deliver: 'courier', decline: 'courier', cancel: 'customer', rate: 'customer' };
const countryOf = (id) => getLive().orders.find((order) => order.id === id)?.country ?? getRegion().country;
const command = (id, action, body) => call(countryOf(id), `/orders/${encodeURIComponent(id)}/${action}`, { body, role: ROLE[action] });

// ---------- Actions ----------

// Returns the order's final id (the region may rename a duplicate).
export const createOrder = async ({ id, country, nodeId, customer, lines, totals, payment, fulfillment, tipPercent = null }) => {
  const storePos = storePosition(nodeId, country);
  const input = {
    id,
    country,
    nodeId,
    storeName: getNode(nodeId).name,
    storePosition: storePos,
    destination: fulfillment === 'delivery' ? getRegion().location ?? rules.around(storePos, id, 1800) : storePos,
    customer,
    lines: lines.map(({ id: productId, quantity, price }) => ({ id: productId, quantity, price })),
    totals,
    payment: { id: payment.method.id, kind: payment.method.kind, last4: payment.card?.number.slice(-4) ?? null },
    fulfillment
  };
  if (REMOTE) {
    // The region recomputes prices and totals itself: amounts from the browser are not trusted.
    // A card never leaves the browser either: the gateway mock gets a token, as a real one would.
    const created = await call(country, '/orders', {
      role: 'customer',
      body: {
        ...input,
        totals: undefined,
        tipPercent,
        lines: input.lines.map(({ id: productId, quantity }) => ({ id: productId, quantity })),
        payment: { ...input.payment, token: `tok_test_${input.payment.last4 ?? 'none'}` }
      }
    });
    return created.id;
  }
  const order = rules.newOrder(input);
  await updateLive((live) => ({
    orders: [order, ...live.orders.filter((entry) => entry.id !== id)],
    notifications: [...rules.notices(null, order), ...live.notifications]
  }));
  return order.id;
};

export const acceptOrder = (id) => (REMOTE ? command(id, 'accept') : change(id, rules.accept));
export const cancelOrder = (id) => (REMOTE ? command(id, 'cancel') : change(id, rules.cancel('customer')));
export const rejectOrder = (id) => (REMOTE ? command(id, 'reject') : change(id, rules.cancel('rejected')));
export const rateOrder = (id, rating) => (REMOTE ? command(id, 'rate', rating) : change(id, (order) => rules.rate(order, rating)));
export const pickUp = (id) => (REMOTE ? command(id, 'pickup') : change(id, rules.pickUp));

// Ready: for deliveries the nearest available courier is assigned at once when there is one.
export const markReady = (id) =>
  REMOTE
    ? command(id, 'ready')
    : change(id, (order, live) => {
        const ready = rules.markReady(order);
        return ready && (assignLocal(ready, live) ?? ready);
      });

// Orders waiting for a courier try again (a courier came online, or another one declined).
// In live mode the logistics service does this on its own.
export const assignWaiting = async (country) => {
  if (REMOTE) return;
  for (const order of getLive().orders.filter((entry) => entry.country === country && entry.status === 'ready' && entry.fulfillment === 'delivery')) {
    await change(order.id, assignLocal);
  }
};

export const declineDelivery = async (id) => {
  if (REMOTE) return command(id, 'decline');
  const country = countryOf(id);
  await change(id, rules.decline);
  await assignWaiting(country);
};

// Delivered at the door, or handed over at the counter for pickups.
export const deliver = async (id) => {
  const order = getLive().orders.find((entry) => entry.id === id);
  if (REMOTE) return command(id, order?.fulfillment === 'pickup' ? 'handover' : 'deliver');
  await change(id, rules.deliver);
  if (order?.courierId) {
    await updateLive((live) => ({ couriers: { ...live.couriers, [order.courierId]: { ...live.couriers[order.courierId], position: order.destination } } }));
    await assignWaiting(order.country);
  }
};

export const setCourierStatus = async (courierId, status, country) => {
  if (REMOTE) return call(country, `/couriers/${encodeURIComponent(courierId)}/status`, { body: { status }, role: 'courier' });
  await updateLive((live) => ({ couriers: { ...live.couriers, [courierId]: { ...live.couriers[courierId], status } } }));
  if (status === 'available') await assignWaiting(country);
};

export const markSeen = (key) => updateLive((live) => ({ seen: { ...live.seen, [key]: rules.now() } }));
export const setAutopilot = (on) => updateLive(() => ({ autopilot: on }));

// ---------- Autopilot: stores accept and prepare, couriers ride, a few seconds per step ----------

const STEP_MS = 4000;
export const autopilotTick = async (at = Date.now()) => {
  for (const order of getLive().orders) {
    const last = Date.parse(order.history.at(-1).at);
    if (at - last < STEP_MS) continue;
    try {
      if (order.status === 'placed') await acceptOrder(order.id);
      else if (order.status === 'accepted') await markReady(order.id);
      else if (order.status === 'ready' && order.fulfillment === 'delivery') await assignWaiting(order.country);
      else if (order.status === 'ready') await deliver(order.id);
      else if (order.status === 'assigned') await pickUp(order.id);
      else if (order.status === 'onTheWay' && rules.tripProgress(order, at) >= 1) await deliver(order.id);
    } catch {
      // A refused step (payment still pending, region down) is tried again on the next tick.
    }
  }
};

// Only the tab elected leader moves the orders: every tab queues for the same lock, the holder is
// the leader, and when its tab closes the next one in line takes over (leader election with failover).
export const startAutopilotLeader = () => {
  let stopped = false;
  let release = () => {};
  const held = new Promise((resolve) => {
    release = resolve;
  });
  withLock('nutriflow-autopilot-leader', async () => {
    while (!stopped) {
      if (getLive().autopilot) await autopilotTick();
      await Promise.race([held, new Promise((resolve) => setTimeout(resolve, 1000))]);
    }
  });
  return () => {
    stopped = true;
    release();
  };
};

// ---------- Inboxes: the store reads its store's, a courier their own, the admin everything ----------

export const inboxOf = (live, session) =>
  live.notifications.filter((note) => {
    if (session.role === 'admin') return true;
    if (note.to.role !== session.role) return false;
    if (session.role === 'merchant') return note.to.id === session.storeId;
    if (session.role === 'courier') return note.to.id === session.courierId;
    return true;
  });
export const seenKey = (session) => `${session.role}:${session.storeId ?? session.courierId ?? ''}`;
export const unreadCount = (live, session) => {
  const seen = live.seen[seenKey(session)] ?? '';
  return inboxOf(live, session).filter((note) => note.at > seen).length;
};
