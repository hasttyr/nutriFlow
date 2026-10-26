import { afterEach, describe, expect, it } from 'vitest';
import {
  NodeUnavailableError,
  configureSimulation,
  getClusterState,
  readWithFailover,
  rpcWithRetry,
  setNodeStatus
} from './cluster';
import { OutOfStockError, fetchCatalog, reserveAt, stockAt } from './inventory';
import { OrderError, placeOrder } from './orders';

const lastLog = () => getClusterState().log[0];

describe('cluster network', () => {
  afterEach(() => configureSimulation({ failureRate: 0, random: () => 0.5 }));

  it('retries a transient failure and then succeeds', async () => {
    const rolls = [0.5, 0.01, 0.5, 0.5];
    configureSimulation({ failureRate: 0.04, random: () => rolls.shift() ?? 0.5 });
    const result = await rpcWithRetry('chapinero', 'inventory', 'ping', () => 'pong');
    expect(result.value).toBe('pong');
    expect(getClusterState().nodes.chapinero).toMatchObject({ requests: 2, failures: 1 });
  });

  it('does not retry a node the heartbeat marks as down', async () => {
    setNodeStatus('kennedy', 'offline');
    await expect(rpcWithRetry('kennedy', 'inventory', 'ping', () => 'pong')).rejects.toBeInstanceOf(NodeUnavailableError);
    expect(getClusterState().nodes.kennedy.requests).toBe(1);
  });

  it('serves reads from a replica when the preferred node is down', async () => {
    setNodeStatus('chapinero', 'offline');
    const result = await readWithFailover('chapinero', 'inventory', 'list', () => 'data');
    expect(result).toMatchObject({ value: 'data', nodeId: 'usaquen', failover: true });
    expect(lastLog()).toMatchObject({ kind: 'failover', nodeId: 'usaquen', from: 'chapinero' });
  });

  it('returns the branch prices even when a replica answers', async () => {
    setNodeStatus('kennedy', 'offline');
    const { value, failover } = await fetchCatalog('kennedy');
    expect(failover).toBe(true);
    expect(value.find((offer) => offer.product.id === 1).price).toBe(3500);
  });
});

describe('inventory', () => {
  it('reserves stock and bumps the replica version', async () => {
    const before = stockAt('chapinero', 1);
    await reserveAt('chapinero', [{ id: 1, quantity: 2 }]);
    expect(stockAt('chapinero', 1)).toBe(before - 2);
    expect(getClusterState().nodes.chapinero.version).toBe(2);
  });

  it('refuses a reservation without enough stock and is not retried', async () => {
    await expect(reserveAt('chapinero', [{ id: 13, quantity: 1 }])).rejects.toBeInstanceOf(OutOfStockError);
    expect(getClusterState().nodes.chapinero.requests).toBe(1);
  });
});

describe('order saga', () => {
  it('confirms an order replicated on every node', async () => {
    const order = await placeOrder({ items: [{ id: 1, quantity: 2 }], fulfillment: 'delivery', nodeId: 'chapinero' });
    expect(order).toMatchObject({ id: 'NF-CHA-01041', nodeId: 'chapinero', copies: 3, failover: false });
    expect(order.trace.map((step) => step.service)).toEqual([
      'gateway', 'inventory', 'payments', 'orders', 'replication', 'replication', 'notifications'
    ]);
  });

  it('fails a delivery over to the next branch when the chosen one is down', async () => {
    setNodeStatus('chapinero', 'offline');
    const order = await placeOrder({ items: [{ id: 1, quantity: 1 }], fulfillment: 'delivery', nodeId: 'chapinero' });
    expect(order).toMatchObject({ nodeId: 'usaquen', failover: true, copies: 2 });
  });

  it('does not move a pickup order away from the chosen branch', async () => {
    await expect(
      placeOrder({ items: [{ id: 8, quantity: 1 }], fulfillment: 'pickup', nodeId: 'kennedy' })
    ).rejects.toMatchObject({ reason: 'outOfStock', nodeId: 'kennedy' });
  });

  it('cancels and releases stock when replica quorum is not reached', async () => {
    const before = stockAt('chapinero', 1);
    setNodeStatus('usaquen', 'offline');
    setNodeStatus('kennedy', 'offline');
    const error = await placeOrder({ items: [{ id: 1, quantity: 2 }], fulfillment: 'delivery', nodeId: 'chapinero' }).catch((e) => e);
    expect(error).toBeInstanceOf(OrderError);
    expect(error.reason).toBe('noQuorum');
    expect(stockAt('chapinero', 1)).toBe(before);
  });
});
