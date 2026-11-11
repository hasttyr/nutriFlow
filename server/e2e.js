import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import mqtt from 'mqtt';
import directory from './directory.json' with { type: 'json' };

// Failure and localization tests against the real processes (assignment 7.5 and 7.6):
// the whole platform is started, services are killed on purpose, and the system must retry,
// fail over to a replica or catch up, without losing an order. Run: npm run test:backend

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const [CO_1, CO_2] = directory.regions.CO;
let platform;

const send = (command) => platform.stdin.write(`${command}\n`);
const until = async (check, timeout = 8000) => {
  const end = Date.now() + timeout;
  for (;;) {
    const value = await check().catch(() => null);
    if (value) return value;
    if (Date.now() > end) throw new Error('timed out');
    await wait(150);
  }
};

const tokens = new Map();
const token = async (url, role) => {
  if (!tokens.has(url + role)) {
    const response = await fetch(`${url}/session`, { method: 'POST', body: JSON.stringify({ role }) });
    tokens.set(url + role, (await response.json()).token);
  }
  return tokens.get(url + role);
};
const request = async (url, role, path, { body, method = body ? 'POST' : 'GET' } = {}) => {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: { authorization: `Bearer ${await token(url, role)}`, 'content-type': 'application/json' },
    body: body && JSON.stringify(body)
  });
  return { status: response.status, body: await response.json() };
};
// The web app's failover: try the primary, then each replica of the region.
const withFailover = async (urls, role, path, options) => {
  for (const url of urls) {
    try {
      return { url, ...(await request(url, role, path, options)) };
    } catch {
      // instance down: next one
    }
  }
  throw new Error('no instance answered');
};

const order = (overrides = {}) => ({
  nodeId: 'chapinero',
  storeName: 'Chapinero',
  storePosition: { lat: 4.65, lon: -74.06 },
  destination: { lat: 4.66, lon: -74.05 },
  customer: { givenName: 'Ada', familyName: 'Lovelace', street: 'Calle 72 # 10-34', city: 'Bogotá' },
  lines: [{ id: 66, quantity: 2 }],
  fulfillment: 'delivery',
  tipPercent: 10,
  payment: { id: 'card', last4: '4242', token: 'tok_test_4242' },
  ...overrides
});
const place = async (url, body = order()) => (await request(url, 'customer', '/orders', { body })).body.order;
const read = async (id, url = CO_1) => (await request(url, 'customer', `/orders/${id}`)).body;

before(async () => {
  platform = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'server/start.js'], {
    env: { ...process.env, DATA_DIR: mkdtempSync(join(tmpdir(), 'nutriflow-')), LATENCY_MS: '100' },
    stdio: ['pipe', 'ignore', 'inherit']
  });
  const urls = Object.values(directory.regions).flat();
  await until(async () => (await Promise.all(urls.map((url) => fetch(`${url}/health`)))).every((response) => response.ok), 15000);
  await wait(800); // services subscribed
});

after(() => {
  send('quit');
  platform.kill();
});

describe('five regions, one code base', () => {
  it('each region serves its own country profile and charges in its own currency', async () => {
    const currencies = {};
    for (const [country, [url]] of Object.entries(directory.regions)) currencies[country] = (await (await fetch(`${url}/profile`)).json()).currency;
    assert.deepEqual(currencies, { CO: 'COP', BR: 'BRL', US: 'USD', FR: 'EUR', JP: 'JPY' });

    const jp = await place(directory.regions.JP[0], order({ payment: { id: 'paypay', token: 'tok_test_none' }, tipPercent: 10 }));
    assert.equal(jp.country, 'JP');
    assert.ok(Number.isInteger(jp.totals.total));
    assert.equal(jp.totals.tip, 0, 'Japan asks for no tip');
  });

  it('the admin changes a country profile as data, and only the admin can', async () => {
    const [FR] = directory.regions.FR;
    const override = { tax: { rates: { standard: 20000, reduced: 5500, prepared: 10000 } }, delivery: { fee: 199, freeFrom: 2500 }, tip: { mode: 'optional', defaultPercent: 0 }, revenue: { commission: 15000 } };
    assert.equal((await request(FR, 'customer', '/overrides', { method: 'PUT', body: override })).status, 403);
    assert.equal((await request(FR, 'admin', '/overrides', { method: 'PUT', body: override })).status, 200);
    assert.equal((await (await fetch(`${FR}/profile`)).json()).delivery.fee, 199);
    await request(FR, 'admin', '/overrides', { method: 'DELETE' });
    assert.equal((await (await fetch(`${FR}/profile`)).json()).delivery.fee, 299);
  });

  it('never trusts prices from the client and checks roles', async () => {
    const created = await place(CO_1, order({ lines: [{ id: 66, quantity: 2, price: 1 }] }));
    assert.equal(created.lines[0].price, 19800);
    const refused = await request(CO_1, 'customer', `/orders/${created.id}/accept`, { body: {} });
    assert.equal(refused.status, 403);
  });
});

describe('failures', () => {
  it('a payment waits in the broker while the payment service is down, and goes through when it is back', async () => {
    send('stop payments');
    await wait(400);
    const created = await place(CO_1);
    await wait(1200);
    assert.equal((await read(created.id)).payment.status, 'pending');
    const early = await request(CO_1, 'merchant', `/orders/${created.id}/accept`, { body: {} });
    assert.equal(early.status, 409, 'the store cannot accept an unpaid order');

    send('start payments');
    await until(async () => (await read(created.id)).payment.status === 'captured');
    assert.equal((await request(CO_1, 'merchant', `/orders/${created.id}/accept`, { body: {} })).body.status, 'accepted');
  });

  it('a declined payment undoes the order (compensation)', async () => {
    const created = await place(CO_1, order({ payment: { id: 'card', last4: '0002', token: 'tok_test_0002' } }));
    const done = await until(async () => {
      const current = await read(created.id);
      return current.status === 'cancelled' && current;
    });
    assert.equal(done.reason, 'paymentFailed');
  });

  it('when the region primary crashes, its replica takes the next command', async () => {
    const created = await place(CO_1, order({ payment: { id: 'cash' } }));
    send('stop co-1');
    await wait(400);
    const accepted = await withFailover([CO_1, CO_2], 'merchant', `/orders/${created.id}/accept`, { body: {} });
    assert.equal(accepted.url, CO_2);
    assert.equal(accepted.body.status, 'accepted');
    send('start co-1');
    await until(async () => (await fetch(`${CO_1}/health`)).ok);
  });

  it('orders wait for a courier while logistics is down, and get one when it is back', async () => {
    send('stop logistics');
    await wait(400);
    const created = await place(CO_1, order({ payment: { id: 'cash' } }));
    await request(CO_1, 'merchant', `/orders/${created.id}/accept`, { body: {} });
    await request(CO_1, 'merchant', `/orders/${created.id}/ready`, { body: {} });
    await wait(1000);
    assert.equal((await read(created.id)).status, 'ready');

    send('start logistics');
    const assigned = await until(async () => {
      const current = await read(created.id);
      return current.status === 'assigned' && current;
    });
    assert.match(assigned.courierId, /^CO-courier-\d$/);
  });

  it('the broker announces a crashed service through its Last Will', async () => {
    const client = await mqtt.connectAsync(directory.broker);
    const states = [];
    client.on('message', (topic, payload) => states.push(JSON.parse(payload.toString()).status));
    await client.subscribeAsync('nf/system/health/notifications');
    await until(async () => states.at(-1) === 'online');
    send('stop notifications');
    await until(async () => states.at(-1) === 'offline');
    send('start notifications');
    await until(async () => states.at(-1) === 'online');
    await client.endAsync();
  });
});

describe('a whole order', () => {
  it('goes from the store to a courier to the door, notifying each actor once, and can be rated', async () => {
    const created = await place(CO_1);
    await until(async () => (await read(created.id)).payment.status === 'captured');
    for (const [role, action] of [['merchant', 'accept'], ['merchant', 'ready']]) await request(CO_1, role, `/orders/${created.id}/${action}`, { body: {} });
    await until(async () => (await read(created.id)).status === 'assigned');
    for (const action of ['pickup', 'deliver']) await request(CO_1, 'courier', `/orders/${created.id}/${action}`, { body: {} });
    const rated = await request(CO_1, 'customer', `/orders/${created.id}/rate`, { body: { store: 5, courier: 4 } });
    assert.equal(rated.body.rating.store, 5);

    const client = await mqtt.connectAsync(directory.broker);
    const notes = await new Promise((resolve) => {
      client.on('message', (topic, payload) => {
        const list = JSON.parse(payload.toString()).filter((note) => note.orderId === created.id);
        if (list.some((note) => note.key === 'notify.delivered.customer')) resolve(list);
      });
      client.subscribe('nf/co/notifications');
    });
    await client.endAsync();
    const keys = notes.map((note) => note.key);
    assert.equal(new Set(keys).size, keys.length, 'no duplicate notification');
    assert.ok(keys.includes('notify.assigned.courier') && keys.includes('notify.placed.merchant'));
  });

  it('a cancelled card order is refunded', async () => {
    const created = await place(CO_1);
    await until(async () => (await read(created.id)).payment.status === 'captured');
    const cancelled = await request(CO_1, 'customer', `/orders/${created.id}/cancel`, { body: {} });
    assert.equal(cancelled.body.payment.status, 'refunded');
    assert.equal(cancelled.body.refund.amount, created.totals.total);
  });
});
