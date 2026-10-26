import { NODES, NodeUnavailableError, getNode, isOnline, replicasOf, rpcWithRetry } from './cluster';
import { OutOfStockError, releaseAt, reserveAt } from './inventory';

// The primary plus at least one replica must store the order before it is confirmed.
export const QUORUM = 2;

export class OrderError extends Error {
  constructor(reason, nodeId) {
    super(reason);
    this.reason = reason;
    this.nodeId = nodeId;
  }
}

let orderSequence = 0;

// Order saga: route → reserve stock → register payment → create order → replicate → notify.
// Every step reports progress through onTrace so the UI can draw the request crossing the cluster.
export const placeOrder = async ({ items, fulfillment, nodeId }, onTrace = () => {}) => {
  const trace = [];
  const publish = () => onTrace(trace.map((step) => ({ ...step })));
  const step = async (service, stepNodeId, work) => {
    const entry = { id: trace.length, service, nodeId: stepNodeId, status: 'running' };
    trace.push(entry);
    publish();
    try {
      const result = await work();
      Object.assign(entry, { status: 'ok', ms: result?.ms });
      return result;
    } catch (error) {
      Object.assign(entry, { status: 'failed', error: error instanceof OutOfStockError ? 'outOfStock' : 'unavailable' });
      throw error;
    } finally {
      publish();
    }
  };

  // 1. Gateway: pickup orders must be served by the chosen branch; deliveries can fail over.
  const route = fulfillment === 'pickup' ? [nodeId] : [nodeId, ...replicasOf(nodeId).filter(isOnline)];
  await step('gateway', null, async () => ({ ms: 4 }));

  // 2. Reserve stock on the first branch that answers and has every item.
  let primary = null;
  for (const candidate of route) {
    try {
      await step('inventory', candidate, () => reserveAt(candidate, items));
      primary = candidate;
      break;
    } catch (error) {
      if (fulfillment === 'pickup') {
        throw new OrderError(error instanceof OutOfStockError ? 'outOfStock' : 'nodeDown', candidate);
      }
    }
  }
  if (!primary) throw new OrderError('noBranch', nodeId);

  try {
    // 3. Payment on delivery is only registered, never charged.
    await step('payments', primary, () => rpcWithRetry(primary, 'payments', 'register', () => 'cash-on-delivery'));

    // 4. The primary creates the order with a branch-prefixed id.
    orderSequence += 1;
    const id = `NF-${getNode(primary).code}-${String(1040 + orderSequence).padStart(5, '0')}`;
    await step('orders', primary, () => rpcWithRetry(primary, 'orders', 'create', () => id));

    // 5. Replicate to the other branches in parallel; confirm on quorum.
    const replicas = NODES.map((node) => node.id).filter((id) => id !== primary);
    const results = await Promise.allSettled(
      replicas.map((replica) => step('replication', replica, () => rpcWithRetry(replica, 'orders', `replicate ${id}`, () => id, 1)))
    );
    const copies = 1 + results.filter((result) => result.status === 'fulfilled').length;
    if (copies < QUORUM) throw new OrderError('noQuorum', primary);

    // 6. Notify the customer from the primary.
    await step('notifications', primary, () => rpcWithRetry(primary, 'notifications', 'send', () => id));

    return { id, nodeId: primary, copies, failover: primary !== nodeId, trace: trace.map((entry) => ({ ...entry })) };
  } catch (error) {
    // Compensate: the reservation must not outlive a failed order.
    await step('compensation', primary, () => releaseAt(primary, items)).catch(() => {});
    if (error instanceof OrderError) throw error;
    throw new OrderError(error instanceof NodeUnavailableError ? 'nodeDown' : 'unknown', primary);
  }
};
