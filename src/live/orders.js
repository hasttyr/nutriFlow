import { NODES, getNode } from '../distributed/cluster';
import { distanceMeters } from '../geo/location';
import { getRegion } from '../geo/region';
import { profileFor } from '../region/profiles';
import { getLive, updateLive, withLock } from './store';

// Order lifecycle shared by the four apps:
//   placed → accepted → ready → assigned → onTheWay → delivered     (delivery)
//   placed → accepted → ready → delivered                            (pickup at the store)
//   placed | accepted | ready | assigned → cancelled                 (customer cancels / store rejects)
// Every transition is one atomic write under the cross-tab lock and notifies whoever it concerns.

export const ACTIVE = ['placed', 'accepted', 'ready', 'assigned', 'onTheWay'];
export const CANCELLABLE = ['placed', 'accepted', 'ready', 'assigned'];
export const TRIP_MS = 60_000; // demo ride: a minute from the store to the door
const MAX_LOAD = 2; // deliveries a courier can carry at once

const now = () => new Date().toISOString();
const hash = (text) => [...text].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);
// A point `meters` away from `origin` in a direction derived from `seed`.
const around = (origin, seed, meters) => {
  const angle = (hash(seed) % 360) * (Math.PI / 180);
  return {
    lat: origin.lat + (Math.sin(angle) * meters) / 111320,
    lon: origin.lon + (Math.cos(angle) * meters) / (111320 * Math.cos((origin.lat * Math.PI) / 180))
  };
};

const regionCenter = (country) => getRegion().location ?? profileFor(country).pilotCity;

// Real nearby stores carry their coordinates; the demo branches are placed around the shopper.
export const storePosition = (nodeId, country) => {
  const node = getNode(nodeId);
  if (Number.isFinite(node.lat)) return { lat: node.lat, lon: node.lon };
  return around(regionCenter(country), nodeId, 600 + (NODES.findIndex((entry) => entry.id === nodeId) + 1) * 400);
};

// The courier fleet of a country (names from its profile), with live status and position.
export const fleet = (country, live = getLive()) =>
  (profileFor(country)?.couriers ?? []).map((name, index) => {
    const id = `${country}-courier-${index + 1}`;
    const stored = live.couriers[id] ?? {};
    const load = live.orders.filter((order) => order.courierId === id && (order.status === 'assigned' || order.status === 'onTheWay')).length;
    return { id, name, country, status: stored.status ?? 'available', position: stored.position ?? null, load };
  });

// Where the courier is now: riding from the store to the door, or waiting where they last were.
export const courierPosition = (order, courier, at = Date.now()) => {
  if (order?.status === 'onTheWay') {
    const progress = Math.min(1, (at - Date.parse(order.pickedUpAt)) / TRIP_MS);
    return {
      lat: order.storePosition.lat + (order.destination.lat - order.storePosition.lat) * progress,
      lon: order.storePosition.lon + (order.destination.lon - order.storePosition.lon) * progress
    };
  }
  // Before their first ride, couriers wait somewhere within 3 km of the store.
  const seed = courier?.id ?? 'courier';
  return courier?.position ?? (order ? around(order.storePosition, seed, 600 + (hash(seed) % 2400)) : null);
};

export const tripProgress = (order, at = Date.now()) =>
  order.status === 'onTheWay' ? Math.min(1, (at - Date.parse(order.pickedUpAt)) / TRIP_MS) : order.status === 'delivered' ? 1 : 0;

const notify = (to, order, key, vars = {}) => ({
  id: `${order.id}-${key}-${to.role}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  to,
  orderId: order.id,
  country: order.country,
  key,
  vars: { id: order.id, store: order.storeName, ...vars },
  at: now()
});
const toCustomer = { role: 'customer' };
const toStore = (order) => ({ role: 'merchant', id: order.nodeId });
const toCourier = (order) => ({ role: 'courier', id: order.courierId });

// Replaces one order and appends notifications, in a single write.
const change = (id, update) =>
  updateLive((live) => {
    const order = live.orders.find((entry) => entry.id === id);
    if (!order) return {};
    const result = update(order, live);
    if (!result) return {};
    const { order: next, notifications = [], couriers } = result;
    return {
      orders: live.orders.map((entry) => (entry.id === id ? next : entry)),
      notifications: [...notifications, ...live.notifications].slice(0, 200),
      ...(couriers ? { couriers: { ...live.couriers, ...couriers } } : {})
    };
  });

const step = (order, status, extra = {}) => ({ ...order, ...extra, status, history: [...order.history, { status, at: now() }] });

export const createOrder = ({ id, country, nodeId, customer, lines, totals, payment, fulfillment }) => {
  const storePos = storePosition(nodeId, country);
  const order = {
    id,
    country,
    nodeId,
    storeName: getNode(nodeId).name,
    storePosition: storePos,
    destination: fulfillment === 'delivery' ? getRegion().location ?? around(storePos, id, 1800) : storePos,
    customer,
    lines: lines.map(({ id: productId, quantity, price }) => ({ id: productId, quantity, price })),
    totals,
    payment: { id: payment.method.id, kind: payment.method.kind, last4: payment.card?.number.slice(-4) ?? null, paid: !['voucher', 'cash'].includes(payment.method.kind) },
    fulfillment,
    status: 'placed',
    history: [{ status: 'placed', at: now() }],
    createdAt: now(),
    courierId: null,
    declinedBy: [],
    refund: null,
    rating: null
  };
  return updateLive((live) => ({
    orders: [order, ...live.orders.filter((entry) => entry.id !== id)],
    notifications: [
      notify(toCustomer, order, 'notify.placed.customer'),
      notify(toStore(order), order, 'notify.placed.merchant', { total: totals.total }),
      ...live.notifications
    ]
  }));
};

export const acceptOrder = (id) =>
  change(id, (order) => order.status === 'placed' && { order: step(order, 'accepted'), notifications: [notify(toCustomer, order, 'notify.accepted.customer')] });

// Cancelling before the courier picks the order up; whatever was charged goes back.
const cancel = (reason) => (order) => {
  if (!CANCELLABLE.includes(order.status)) return null;
  const refund = order.payment.paid ? { amount: order.totals.total, at: now() } : null;
  const next = step(order, 'cancelled', { reason, refund });
  const notifications = [notify(toCustomer, order, reason === 'rejected' ? 'notify.rejected.customer' : 'notify.cancelled.customer')];
  if (reason !== 'rejected') notifications.push(notify(toStore(order), order, 'notify.cancelled.merchant'));
  if (order.courierId) notifications.push(notify(toCourier(order), order, 'notify.cancelled.courier'));
  if (refund) notifications.push(notify(toCustomer, order, 'notify.refund.customer', { amount: refund.amount }));
  return { order: next, notifications };
};
export const cancelOrder = (id) => change(id, cancel('customer'));
export const rejectOrder = (id) => change(id, cancel('rejected'));

// Assignment by proximity and availability, balancing load: the nearest available courier wins,
// and every delivery already carried counts as if they were farther away.
export const pickCourier = (order, couriers) =>
  couriers
    .filter((courier) => courier.status === 'available' && courier.load < MAX_LOAD && !order.declinedBy.includes(courier.id))
    .map((courier) => ({ courier, score: distanceMeters(courierPosition(order, courier), order.storePosition) * (1 + courier.load) }))
    .sort((a, b) => a.score - b.score)[0]?.courier ?? null;

const assign = (order, live) => {
  if (order.status !== 'ready' || order.fulfillment !== 'delivery') return null;
  const courier = pickCourier(order, fleet(order.country, live));
  if (!courier) return null;
  const next = step(order, 'assigned', { courierId: courier.id, courierName: courier.name });
  return {
    order: next,
    notifications: [
      notify(toCustomer, next, 'notify.assigned.customer', { courier: courier.name }),
      notify(toStore(next), next, 'notify.assigned.merchant', { courier: courier.name }),
      notify(toCourier(next), next, 'notify.assigned.courier')
    ]
  };
};

export const markReady = (id) =>
  change(id, (order, live) => {
    if (order.status !== 'accepted') return null;
    const ready = step(order, 'ready');
    const assigned = assign(ready, live);
    if (assigned) return { ...assigned, notifications: [notify(toCustomer, order, 'notify.ready.customer'), ...assigned.notifications] };
    return { order: ready, notifications: [notify(toCustomer, order, 'notify.ready.customer')] };
  });

// Orders waiting for a courier try again (a courier came online, or another one declined).
export const assignWaiting = async (country) => {
  for (const order of getLive().orders.filter((entry) => entry.country === country && entry.status === 'ready' && entry.fulfillment === 'delivery')) {
    await change(order.id, assign);
  }
};

export const declineDelivery = async (id) => {
  const order = getLive().orders.find((entry) => entry.id === id);
  await change(id, (current) =>
    current.status === 'assigned' && { order: step(current, 'ready', { courierId: null, courierName: null, declinedBy: [...current.declinedBy, current.courierId] }) }
  );
  if (order) await assignWaiting(order.country);
};

export const pickUp = (id) =>
  change(id, (order) => order.status === 'assigned' && {
    order: step(order, 'onTheWay', { pickedUpAt: now() }),
    notifications: [notify(toCustomer, order, 'notify.onTheWay.customer', { courier: order.courierName })]
  });

// Delivered at the door, or handed over at the counter for pickups.
export const deliver = async (id) => {
  const order = getLive().orders.find((entry) => entry.id === id);
  const ok = order && (order.status === 'onTheWay' || (order.status === 'ready' && order.fulfillment === 'pickup'));
  if (!ok) return;
  await change(id, (current, live) => ({
    order: step(current, 'delivered'),
    notifications: [notify(toCustomer, current, 'notify.delivered.customer'), notify(toStore(current), current, 'notify.delivered.merchant')],
    ...(current.courierId ? { couriers: { [current.courierId]: { ...live.couriers[current.courierId], position: current.destination } } } : {})
  }));
  if (order.courierId) await assignWaiting(order.country);
};

export const rateOrder = (id, rating) =>
  change(id, (order) => order.status === 'delivered' && !order.rating && { order: { ...order, rating: { ...rating, at: now() } } });

export const setCourierStatus = async (courierId, status, country) => {
  await updateLive((live) => ({ couriers: { ...live.couriers, [courierId]: { ...live.couriers[courierId], status } } }));
  if (status === 'available') await assignWaiting(country);
};

export const markSeen = (key) => updateLive((live) => ({ seen: { ...live.seen, [key]: now() } }));

// Average rating of a store or a courier, from the orders customers rated.
export const averageRating = (orders, field, matches) => {
  const scores = orders.filter((order) => order.rating && matches(order)).map((order) => order.rating[field]).filter(Boolean);
  return { count: scores.length, value: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null };
};

// Autopilot for demos: stores accept and prepare, couriers ride, with a few seconds per step.
// Only the tab elected leader (it holds the 'nutriflow-autopilot' lock) moves the orders.
const STEP_MS = 4000;
export const autopilotTick = async (at = Date.now()) => {
  for (const order of getLive().orders) {
    const last = Date.parse(order.history.at(-1).at);
    if (at - last < STEP_MS) continue;
    if (order.status === 'placed') await acceptOrder(order.id);
    else if (order.status === 'accepted') await markReady(order.id);
    else if (order.status === 'ready' && order.fulfillment === 'delivery') await assignWaiting(order.country);
    else if (order.status === 'ready') await deliver(order.id);
    else if (order.status === 'assigned') await pickUp(order.id);
    else if (order.status === 'onTheWay' && tripProgress(order, at) >= 1) await deliver(order.id);
  }
};

export const startAutopilotLeader = () => {
  let stopped = false;
  let release = () => {};
  const held = new Promise((resolve) => {
    release = resolve;
  });
  // Every tab queues for the same lock: the holder is the leader, and when its tab closes the
  // next one in line takes over (leader election with failover).
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

export const setAutopilot = (on) => updateLive(() => ({ autopilot: on }));

// Each app reads its own inbox: the store its store's, a courier their own, the admin everything.
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
