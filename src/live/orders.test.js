import { describe, expect, it } from 'vitest';
import { acceptOrder, averageRating, autopilotTick, cancelOrder, createOrder, declineDelivery, deliver, fleet, markReady, pickCourier, pickUp, rateOrder, rejectOrder, setCourierStatus, TRIP_MS } from './orders';
import { getLive } from './store';

const card = { method: { id: 'card', kind: 'card' }, card: { number: '4242424242424242' } };
const cash = { method: { id: 'cash', kind: 'cash' } };
const place = (id, payment = card, fulfillment = 'delivery') =>
  createOrder({
    id, country: 'CO', nodeId: 'chapinero', fulfillment, payment,
    customer: { givenName: 'Ada', familyName: 'Lovelace' },
    lines: [{ id: 66, quantity: 2, price: 18900 }],
    totals: { subtotal: 37800, delivery: 5900, taxes: [], taxIncluded: true, tip: 0, total: 43700 }
  });
const order = (id) => getLive().orders.find((entry) => entry.id === id);
const inbox = (role, id) => getLive().notifications.filter((note) => note.to.role === role && (id === undefined || note.to.id === id)).map((note) => note.key);

describe('order lifecycle across the four apps', () => {
  it('goes from the store to a courier to the door, notifying each actor', async () => {
    await place('NF-1');
    expect(inbox('merchant', 'chapinero')).toEqual(['notify.placed.merchant']);
    await acceptOrder('NF-1');
    await markReady('NF-1');
    const assigned = order('NF-1');
    expect(assigned.status).toBe('assigned');
    expect(inbox('courier', assigned.courierId)).toEqual(['notify.assigned.courier']);

    await pickUp('NF-1');
    expect(order('NF-1').status).toBe('onTheWay');
    await deliver('NF-1');
    expect(order('NF-1').history.map((entry) => entry.status)).toEqual(['placed', 'accepted', 'ready', 'assigned', 'onTheWay', 'delivered']);
    expect(order('NF-1').history.every((entry) => entry.at.endsWith('Z'))).toBe(true);
    expect(inbox('customer')).toContain('notify.delivered.customer');

    await rateOrder('NF-1', { store: 5, courier: 4 });
    await rateOrder('NF-1', { store: 1, courier: 1 });
    expect(order('NF-1').rating).toMatchObject({ store: 5, courier: 4 });
    expect(averageRating(getLive().orders, 'courier', (entry) => entry.courierId === assigned.courierId)).toEqual({ count: 1, value: 4 });
  });

  it('refunds what was charged when the customer cancels, and nothing for cash', async () => {
    await place('NF-2');
    await cancelOrder('NF-2');
    expect(order('NF-2')).toMatchObject({ status: 'cancelled', refund: { amount: 43700 } });
    expect(inbox('customer')).toContain('notify.refund.customer');

    await place('NF-3', cash);
    await rejectOrder('NF-3');
    expect(order('NF-3')).toMatchObject({ status: 'cancelled', reason: 'rejected', refund: null });
  });

  it('cannot cancel once the courier has the order', async () => {
    await place('NF-4');
    await acceptOrder('NF-4');
    await markReady('NF-4');
    await pickUp('NF-4');
    await cancelOrder('NF-4');
    expect(order('NF-4').status).toBe('onTheWay');
  });

  it('balances load: a busier courier counts as farther away, and a decline goes to the next one', async () => {
    const live = getLive();
    const target = { storePosition: { lat: 4.65, lon: -74.06 }, declinedBy: [] };
    const [first, second] = fleet('CO', live);
    const near = { ...first, position: { lat: 4.651, lon: -74.06 }, load: 1 };
    const far = { ...second, position: { lat: 4.6519, lon: -74.06 }, load: 0 };
    expect(pickCourier(target, [near, far]).id).toBe(far.id);
    expect(pickCourier(target, [{ ...near, load: 0 }, far]).id).toBe(near.id);
    expect(pickCourier(target, [{ ...near, status: 'offline' }, { ...far, load: 2 }])).toBeNull();

    await place('NF-5');
    await acceptOrder('NF-5');
    await markReady('NF-5');
    const before = order('NF-5').courierId;
    await declineDelivery('NF-5');
    expect(order('NF-5').courierId).not.toBe(before);
    expect(order('NF-5').declinedBy).toEqual([before]);
  });

  it('waits for a courier when none is available, and assigns when one comes online', async () => {
    for (const courier of fleet('CO')) await setCourierStatus(courier.id, 'offline', 'CO');
    await place('NF-6');
    await acceptOrder('NF-6');
    await markReady('NF-6');
    expect(order('NF-6')).toMatchObject({ status: 'ready', courierId: null });
    await setCourierStatus('CO-courier-3', 'available', 'CO');
    expect(order('NF-6')).toMatchObject({ status: 'assigned', courierId: 'CO-courier-3' });
  });

  it('moves orders on its own in autopilot, one step every few seconds', async () => {
    await place('NF-7', card, 'pickup');
    const start = Date.parse(order('NF-7').createdAt);
    await autopilotTick(start + 1000);
    expect(order('NF-7').status).toBe('placed');
    for (let tick = 1; tick <= 3; tick += 1) await autopilotTick(Date.parse(order('NF-7').history.at(-1).at) + 5000);
    expect(order('NF-7').status).toBe('delivered');
    expect(TRIP_MS).toBeGreaterThan(0);
  });
});
