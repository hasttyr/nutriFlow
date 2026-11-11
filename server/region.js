import * as rules from '../src/live/rules.js';
import { quote } from '../src/region/money.js';
import { storePrice } from '../src/region/pricing.js';
import { issueToken, requireRole, verifyToken } from './lib/auth.js';
import { createBus } from './lib/bus.js';
import { listPrice, methodById, productById, profileFor } from './lib/catalog.js';
import { openDb, transaction } from './lib/db.js';
import { HttpError, serve } from './lib/http.js';

// Regional API, one per country (REGION=CO …), same code everywhere: the country is data.
// It owns its country's orders (SQLite file per region: data residency) and applies the order
// rules in ACID transactions. It talks to the other subsystems only through the broker:
//   publishes  nf/<r>/events (every change), nf/<r>/orders and nf/<r>/overrides (retained state),
//              nf/<r>/payments/request|refund, nf/<r>/logistics/status
//   listens    nf/<r>/payments/result, nf/<r>/logistics/assigned, and the retained state of the
//              other services, which it forwards to browsers over Server-Sent Events.
// Several instances of one region (primary and replica) can share the file: each change is a
// transaction, and every message they both receive is idempotent.

const REGION = (process.env.REGION ?? 'CO').toUpperCase();
const INSTANCE = process.env.INSTANCE ?? `${REGION.toLowerCase()}-1`;
const PORT = Number(process.env.PORT ?? 4101);
const base = `nf/${REGION.toLowerCase()}`;

const db = openDb(`region-${REGION.toLowerCase()}`, `
  CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT NOT NULL, created_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
`);
const bus = createBus(`region-${INSTANCE}`);

const readOrder = (id) => {
  const row = db.prepare('SELECT data FROM orders WHERE id = ?').get(id);
  return row ? JSON.parse(row.data) : null;
};
const writeOrder = (order) =>
  db.prepare('INSERT INTO orders (id, data, created_at) VALUES (?, ?, ?) ON CONFLICT(id) DO UPDATE SET data = excluded.data').run(order.id, JSON.stringify(order), order.createdAt);
const recentOrders = () => db.prepare('SELECT data FROM orders ORDER BY created_at DESC LIMIT 200').all().map((row) => JSON.parse(row.data));
const overrides = () => {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'overrides'").get();
  return row ? JSON.parse(row.value) : null;
};
const profile = () => profileFor(REGION, overrides());

const publishOrders = () => bus.publish(`${base}/orders`, recentOrders(), { retain: true });

// One transition, atomically; then everyone who cares hears about it.
const apply = async (id, transition) => {
  let previous;
  const next = transaction(db, () => {
    previous = readOrder(id);
    if (!previous) throw new HttpError(404, 'Unknown order');
    const result = transition(previous);
    if (result) writeOrder(result);
    return result;
  });
  if (!next) throw new HttpError(409, `Not allowed while ${previous.status}`);
  await bus.publish(`${base}/events`, { previous, order: next });
  if (next.payment.status === 'refunded' && previous.payment.status !== 'refunded') {
    await bus.publish(`${base}/payments/refund`, { orderId: id, amount: next.refund.amount, currency: profile().currency });
  }
  await publishOrders();
  return next;
};

// ---------- Validation at the trust boundary ----------

const text = (value, max = 120) => (typeof value === 'string' && value.length <= max ? value.trim() : null);
const point = (value) =>
  value && Number.isFinite(value.lat) && Number.isFinite(value.lon) && Math.abs(value.lat) <= 90 && Math.abs(value.lon) <= 180 ? { lat: value.lat, lon: value.lon } : null;

const parseOrder = (body) => {
  const settings = profile();
  const fail = (message) => {
    throw new HttpError(400, message);
  };
  const nodeId = text(body.nodeId, 80) || fail('nodeId');
  const fulfillment = ['delivery', 'pickup'].includes(body.fulfillment) ? body.fulfillment : fail('fulfillment');
  const storePosition = point(body.storePosition) ?? fail('storePosition');
  const destination = point(body.destination) ?? fail('destination');
  if (!body.customer || typeof body.customer !== 'object' || Object.keys(body.customer).length > 16) fail('customer');
  const customer = Object.fromEntries(Object.entries(body.customer).map(([key, value]) => [text(key, 30) ?? fail('customer'), text(value) ?? fail(`customer.${key}`)]));
  if (!Array.isArray(body.lines) || body.lines.length === 0 || body.lines.length > 50) fail('lines');
  // Prices come from this region's price list and rules, never from the client.
  const lines = body.lines.map((line) => {
    const product = productById(line.id) ?? fail(`product ${line.id}`);
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 100) fail('quantity');
    return { id: product.id, quantity: line.quantity, category: product.category, price: storePrice(listPrice(REGION, product.id), nodeId, settings.pricing) };
  });
  const method = methodById(body.payment?.id);
  if (!method || !settings.payments.includes(method.id)) fail('payment method');
  const options = settings.tip.mode === 'none' ? [0] : [0, ...settings.tip.suggestedPercents, settings.tip.defaultPercent];
  const tipPercent = options.includes(body.tipPercent) ? body.tipPercent : settings.tip.defaultPercent;
  const totals = quote(lines, { fulfillment, tipPercent }, settings);
  const last4 = /^\d{4}$/.test(body.payment.last4 ?? '') ? body.payment.last4 : null;
  return {
    id: /^NF-[A-Z0-9?]{1,6}-\d{5}$/.test(body.id ?? '') ? body.id : `NF-${REGION}-${String(Date.now()).slice(-5)}`,
    country: REGION,
    nodeId,
    storeName: text(body.storeName) ?? nodeId,
    storePosition,
    destination,
    customer,
    lines: lines.map(({ id, quantity, price }) => ({ id, quantity, price })),
    totals,
    fulfillment,
    payment: { id: method.id, kind: method.kind, last4, token: text(body.payment.token, 40) }
  };
};

// ---------- Live state for browsers (Server-Sent Events) ----------

const streams = new Set();
const latest = { orders: [], notifications: [], couriers: {}, positions: {}, health: {}, overrides: null };
const push = (kind, value) => {
  latest[kind] = value;
  const frame = `data: ${JSON.stringify({ kind, value })}\n\n`;
  for (const res of streams) res.write(frame);
};

bus.on(`${base}/orders`, (orders) => push('orders', orders));
bus.on(`${base}/notifications`, (notes) => push('notifications', notes));
bus.on(`${base}/fleet`, (fleet) => push('couriers', fleet));
bus.on(`${base}/overrides`, (value) => push('overrides', value));
bus.on(`${base}/positions`, (positions) => push('positions', positions), 0);
bus.on('nf/system/health/+', (health, topic) => push('health', { ...latest.health, [topic.split('/').at(-1)]: health }));

// Answers from the other subsystems. Both are idempotent: a replica that also hears them, or a
// message delivered twice, finds the order already moved and leaves it alone.
const ignoreConflict = (error) => {
  if (error.status !== 409 && error.status !== 404) throw error;
};
bus.on(`${base}/payments/result`, ({ orderId, approved }) => apply(orderId, (order) => rules.paymentResult(order, approved)).catch(ignoreConflict));
bus.on(`${base}/logistics/assigned`, ({ orderId, courierId, courierName }) =>
  apply(orderId, (order) => rules.assign(order, { id: courierId, name: courierName })).catch(ignoreConflict)
);

// ---------- HTTP API ----------

const ACTIONS = {
  accept: [['merchant'], rules.accept],
  reject: [['merchant'], rules.cancel('rejected')],
  ready: [['merchant'], rules.markReady],
  handover: [['merchant'], rules.deliver],
  pickup: [['courier'], rules.pickUp],
  deliver: [['courier'], rules.deliver],
  decline: [['courier'], rules.decline],
  cancel: [['customer'], rules.cancel('customer')]
};

const routes = [
  ['GET', /^\/health$/, () => ({ body: { region: REGION, instance: INSTANCE, status: 'online' } })],
  ['POST', /^\/session$/, ({ body }) => ({ body: { token: issueToken(body.role) } })],
  ['GET', /^\/profile$/, () => ({ body: profile() })],
  ['GET', /^\/orders\/([^/]+)$/, ({ params: [id], req }) => {
    requireRole(req, 'customer', 'merchant', 'courier');
    return { body: readOrder(id) ?? (() => { throw new HttpError(404, 'Unknown order'); })() };
  }],
  ['POST', /^\/orders$/, async ({ body, req }) => {
    requireRole(req, 'customer');
    const input = parseOrder(body);
    const order = transaction(db, () => {
      // A duplicate number (two devices, same counter) gets a suffix instead of overwriting.
      let id = input.id;
      while (readOrder(id)) id = `${input.id}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
      const created = rules.newOrder({ ...input, id }, { capture: 'later' });
      writeOrder(created);
      return created;
    });
    await bus.publish(`${base}/events`, { previous: null, order });
    if (order.payment.status === 'pending') {
      await bus.publish(`${base}/payments/request`, { orderId: order.id, amount: order.totals.total, currency: profile().currency, method: order.payment.id, token: order.payment.token });
    }
    await publishOrders();
    return { status: 201, body: { id: order.id, order } };
  }],
  ['POST', /^\/orders\/([^/]+)\/rate$/, async ({ params: [id], body, req }) => {
    requireRole(req, 'customer');
    const score = (value) => (Number.isInteger(value) && value >= 1 && value <= 5 ? value : null);
    const rating = { store: score(body.store), courier: score(body.courier), comment: text(body.comment, 280) ?? '' };
    if (!rating.store) throw new HttpError(400, 'store rating');
    return { body: await apply(id, (order) => rules.rate(order, rating)) };
  }],
  ['POST', /^\/orders\/([^/]+)\/(\w+)$/, async ({ params: [id, action], req }) => {
    const [roles, transition] = ACTIONS[action] ?? [];
    if (!transition) throw new HttpError(404, 'Unknown action');
    requireRole(req, ...roles);
    return { body: await apply(id, transition) };
  }],
  ['POST', /^\/couriers\/([^/]+)\/status$/, async ({ params: [courierId], body, req }) => {
    requireRole(req, 'courier');
    if (!['available', 'offline'].includes(body.status) || !courierId.startsWith(`${REGION}-courier-`)) throw new HttpError(400, 'status');
    await bus.publish(`${base}/logistics/status`, { courierId, status: body.status });
    return { status: 202, body: { courierId, status: body.status } };
  }],
  ['PUT', /^\/overrides$/, async ({ body, req }) => {
    requireRole(req, 'admin');
    const percent = (value) => (Number.isInteger(value) && value >= 0 && value <= 100000 ? value : null);
    const minor = (value) => (Number.isInteger(value) && value >= 0 ? value : null);
    const rates = body.tax?.rates ?? {};
    const value = {
      tax: { rates: { standard: percent(rates.standard), reduced: percent(rates.reduced), prepared: percent(rates.prepared) } },
      delivery: { fee: minor(body.delivery?.fee), freeFrom: minor(body.delivery?.freeFrom) },
      tip: { mode: ['suggested', 'optional', 'none'].includes(body.tip?.mode) ? body.tip.mode : null, defaultPercent: percent(body.tip?.defaultPercent) },
      revenue: { commission: percent(body.revenue?.commission) }
    };
    const invalid = JSON.stringify(value).includes('null');
    if (invalid) throw new HttpError(400, 'overrides');
    db.prepare("INSERT INTO settings (key, value) VALUES ('overrides', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(JSON.stringify(value));
    await bus.publish(`${base}/overrides`, value, { retain: true });
    return { body: value };
  }],
  ['DELETE', /^\/overrides$/, async ({ req }) => {
    requireRole(req, 'admin');
    db.prepare("DELETE FROM settings WHERE key = 'overrides'").run();
    await bus.publish(`${base}/overrides`, null, { retain: true });
    return { body: null };
  }],
  // Live state for one browser: a full picture first, then every change as it happens.
  ['GET', /^\/stream$/, ({ query, req, res }) => {
    verifyToken(query.get('token'));
    res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
    for (const [kind, value] of Object.entries(latest)) res.write(`data: ${JSON.stringify({ kind, value })}\n\n`);
    streams.add(res);
    const ping = setInterval(() => res.write(': ping\n\n'), 15000);
    req.on('close', () => {
      clearInterval(ping);
      streams.delete(res);
    });
    return undefined;
  }]
];

await bus.start();
await serve(PORT, routes, INSTANCE);
latest.orders = recentOrders();
latest.overrides = overrides();
await publishOrders();
await bus.publish(`${base}/overrides`, latest.overrides, { retain: true });
console.log(`[${INSTANCE}] region ${REGION} on http/${PORT}`);
