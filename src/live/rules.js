import { distanceMeters } from '../geo/location.js';

// Order rules shared by the browser (local mode) and the regional servers: the lifecycle,
// who gets notified at each step and how a courier is chosen. Pure functions with explicit .js
// imports, so Node runs this file as is.
//
//   placed → accepted → ready → assigned → onTheWay → delivered     (delivery)
//   placed → accepted → ready → delivered                            (pickup at the store)
//   placed | accepted | ready | assigned → cancelled                 (customer, store or failed payment)
//
// Payment status: captured (charged), pending (the payment service has not answered yet),
// onDelivery (cash or voucher), refunded, failed.

export const ACTIVE = ['placed', 'accepted', 'ready', 'assigned', 'onTheWay'];
export const CANCELLABLE = ['placed', 'accepted', 'ready', 'assigned'];
export const TRIP_MS = 60_000; // demo ride: a minute from the store to the door
export const MAX_LOAD = 2; // deliveries a courier can carry at once
const PREPAID = ['card', 'wallet', 'bank', 'instant'];

export const now = () => new Date().toISOString();
export const hash = (text) => [...text].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 7);

// A point `meters` away from `origin` in a direction derived from `seed`.
export const around = (origin, seed, meters) => {
  const angle = (hash(seed) % 360) * (Math.PI / 180);
  return {
    lat: origin.lat + (Math.sin(angle) * meters) / 111320,
    lon: origin.lon + (Math.cos(angle) * meters) / (111320 * Math.cos((origin.lat * Math.PI) / 180))
  };
};

export const step = (order, status, extra = {}) => ({ ...order, ...extra, status, history: [...order.history, { status, at: now() }] });

// `capture`: 'now' when the charge is confirmed at once (local mode), 'later' when a payment
// service confirms it asynchronously.
export const newOrder = (input, { capture = 'now' } = {}) => {
  const prepaid = PREPAID.includes(input.payment.kind);
  return {
    ...input,
    payment: { ...input.payment, status: prepaid ? (capture === 'now' ? 'captured' : 'pending') : 'onDelivery' },
    status: 'placed',
    history: [{ status: 'placed', at: now() }],
    createdAt: now(),
    courierId: null,
    courierName: null,
    declinedBy: [],
    refund: null,
    rating: null
  };
};

// Transitions return the next order, or null when the step is not allowed from where it is.
export const accept = (order) =>
  order.status === 'placed' && !['pending', 'failed'].includes(order.payment.status) ? step(order, 'accepted') : null;

export const cancel = (reason) => (order) => {
  if (!CANCELLABLE.includes(order.status)) return null;
  const captured = order.payment.status === 'captured';
  return step(order, 'cancelled', {
    reason,
    refund: captured ? { amount: order.totals.total, at: now() } : null,
    payment: { ...order.payment, status: captured ? 'refunded' : order.payment.status }
  });
};

export const markReady = (order) => (order.status === 'accepted' ? step(order, 'ready') : null);

export const assign = (order, courier) =>
  order.status === 'ready' && order.fulfillment === 'delivery' && courier ? step(order, 'assigned', { courierId: courier.id, courierName: courier.name }) : null;

export const decline = (order) =>
  order.status === 'assigned' ? step(order, 'ready', { courierId: null, courierName: null, declinedBy: [...order.declinedBy, order.courierId] }) : null;

export const pickUp = (order) => (order.status === 'assigned' ? step(order, 'onTheWay', { pickedUpAt: now() }) : null);

export const deliver = (order) =>
  order.status === 'onTheWay' || (order.status === 'ready' && order.fulfillment === 'pickup') ? step(order, 'delivered') : null;

export const rate = (order, rating) => (order.status === 'delivered' && !order.rating ? { ...order, rating: { ...rating, at: now() } } : null);

// The payment service answered: the charge went through, or it failed and the order is undone.
export const paymentResult = (order, approved) => {
  if (order.payment.status !== 'pending') return null;
  if (approved) return { ...order, payment: { ...order.payment, status: 'captured' } };
  return step(order, 'cancelled', { reason: 'paymentFailed', payment: { ...order.payment, status: 'failed' } });
};

// ---------- Notifications: who hears about each new step ----------

const note = (to, order, key, vars = {}) => ({
  id: `${order.id}-${key}-${to.role}-${to.id ?? ''}`,
  to,
  orderId: order.id,
  country: order.country,
  key,
  vars: { id: order.id, store: order.storeName, ...vars },
  at: order.history.at(-1).at
});

const forStatus = (order, status, previous) => {
  const customer = { role: 'customer' };
  const store = { role: 'merchant', id: order.nodeId };
  const courier = { role: 'courier', id: order.courierId };
  switch (status) {
    case 'placed':
      return [note(customer, order, 'notify.placed.customer'), note(store, order, 'notify.placed.merchant', { total: order.totals.total })];
    case 'accepted':
      return [note(customer, order, 'notify.accepted.customer')];
    case 'ready':
      // Back to ready after a courier declined: nothing new for the customer.
      return previous === 'assigned' ? [] : [note(customer, order, 'notify.ready.customer')];
    case 'assigned':
      return [
        note(customer, order, 'notify.assigned.customer', { courier: order.courierName }),
        note(store, order, 'notify.assigned.merchant', { courier: order.courierName }),
        note(courier, order, 'notify.assigned.courier')
      ];
    case 'onTheWay':
      return [note(customer, order, 'notify.onTheWay.customer', { courier: order.courierName })];
    case 'delivered':
      return [note(customer, order, 'notify.delivered.customer'), note(store, order, 'notify.delivered.merchant')];
    case 'cancelled': {
      const notes =
        order.reason === 'rejected'
          ? [note(customer, order, 'notify.rejected.customer')]
          : order.reason === 'paymentFailed'
            ? [note(customer, order, 'notify.paymentFailed.customer'), note(store, order, 'notify.cancelled.merchant')]
            : [note(customer, order, 'notify.cancelled.customer'), note(store, order, 'notify.cancelled.merchant')];
      if (order.courierId) notes.push(note(courier, order, 'notify.cancelled.courier'));
      if (order.refund) notes.push(note(customer, order, 'notify.refund.customer', { amount: order.refund.amount }));
      return notes;
    }
    default:
      return [];
  }
};

// Notifications for every step `next` took since `previous` (null for a new order).
export const notices = (previous, next) =>
  next.history
    .slice(previous ? previous.history.length : 0)
    .flatMap((entry, index, steps) => {
      const before = index > 0 ? steps[index - 1].status : previous?.status;
      return forStatus({ ...next, history: next.history.slice(0, next.history.indexOf(entry) + 1) }, entry.status, before);
    });

// ---------- Couriers ----------

// Where the courier is: riding from the store to the door, or waiting where they last were
// (before their first ride, somewhere within 3 km of the store).
export const courierPosition = (order, courier, at = Date.now()) => {
  if (order?.status === 'onTheWay') {
    const progress = Math.min(1, (at - Date.parse(order.pickedUpAt)) / TRIP_MS);
    return {
      lat: order.storePosition.lat + (order.destination.lat - order.storePosition.lat) * progress,
      lon: order.storePosition.lon + (order.destination.lon - order.storePosition.lon) * progress
    };
  }
  const seed = courier?.id ?? 'courier';
  return courier?.position ?? (order ? around(order.storePosition, seed, 600 + (hash(seed) % 2400)) : null);
};

export const tripProgress = (order, at = Date.now()) =>
  order.status === 'onTheWay' ? Math.min(1, (at - Date.parse(order.pickedUpAt)) / TRIP_MS) : order.status === 'delivered' ? 1 : 0;

// Deliveries each courier carries right now.
export const loads = (orders) =>
  orders.reduce((count, order) => (order.courierId && (order.status === 'assigned' || order.status === 'onTheWay') ? { ...count, [order.courierId]: (count[order.courierId] ?? 0) + 1 } : count), {});

// The fleet of a country: names from its profile, status and position from `stored`.
export const fleetOf = (country, names, stored, orders) => {
  const load = loads(orders);
  return names.map((name, index) => {
    const id = `${country}-courier-${index + 1}`;
    return { id, name, country, status: stored[id]?.status ?? 'available', position: stored[id]?.position ?? null, load: load[id] ?? 0 };
  });
};

// Assignment by proximity and availability, balancing load: the nearest available courier wins,
// and every delivery already carried counts as if they were farther away.
export const pickCourier = (order, couriers) =>
  couriers
    .filter((courier) => courier.status === 'available' && courier.load < MAX_LOAD && !order.declinedBy.includes(courier.id))
    .map((courier) => ({ courier, score: distanceMeters(courierPosition(order, courier), order.storePosition) * (1 + courier.load) }))
    .sort((a, b) => a.score - b.score)[0]?.courier ?? null;

export const averageRating = (orders, field, matches) => {
  const scores = orders.filter((order) => order.rating && matches(order)).map((order) => order.rating[field]).filter(Boolean);
  return { count: scores.length, value: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null };
};
