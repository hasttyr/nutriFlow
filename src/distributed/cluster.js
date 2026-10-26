// Simulated distributed backend. Every branch (sucursal) is a node that holds an inventory replica.
// Calls travel over a fake network with latency, transient failures and nodes that can go down,
// so the app can show routing, retries, failover and quorum replication without a real server.

export const NODES = [
  { id: 'chapinero', code: 'CHA', name: 'Chapinero', zone: { es: 'Bogotá · norte', en: 'Bogotá · north' }, baseLatency: 38 },
  { id: 'usaquen', code: 'USA', name: 'Usaquén', zone: { es: 'Bogotá · nororiente', en: 'Bogotá · northeast' }, baseLatency: 66 },
  { id: 'kennedy', code: 'KEN', name: 'Kennedy', zone: { es: 'Bogotá · suroccidente', en: 'Bogotá · southwest' }, baseLatency: 94 }
];

export const NODE_STATUSES = ['online', 'slow', 'offline'];
export const STORAGE_KEY = 'nutriflow/node';
const LOG_LIMIT = 40;
const SLOW_FACTOR = 8;

const simulation = { latencyScale: 1, failureRate: 0.04, random: Math.random };

// Tests turn latency and random failures off; the demo keeps the defaults.
export const configureSimulation = (options) => Object.assign(simulation, options);

export class NodeUnavailableError extends Error {
  constructor(nodeId) {
    super(`Node ${nodeId} did not respond`);
    this.nodeId = nodeId;
  }
}

const isNodeId = (value) => NODES.some((node) => node.id === value);

const loadActiveNode = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isNodeId(stored) ? stored : NODES[0].id;
  } catch {
    return NODES[0].id;
  }
};

const initialNodes = () =>
  Object.fromEntries(
    NODES.map((node) => [
      node.id,
      { status: 'online', latency: node.baseLatency, requests: 0, failures: 0, version: 1, lastHeartbeat: Date.now() }
    ])
  );

let state = { activeNodeId: loadActiveNode(), nodes: initialNodes(), log: [] };
let sequence = 0;
const listeners = new Set();

const setState = (update) => {
  state = { ...state, ...update(state) };
  listeners.forEach((listener) => listener());
};

const patchNode = (nodeId, patch) =>
  setState((current) => ({ nodes: { ...current.nodes, [nodeId]: { ...current.nodes[nodeId], ...patch(current.nodes[nodeId]) } } }));

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getClusterState = () => state;

export const resetCluster = () => {
  sequence = 0;
  setState(() => ({ activeNodeId: NODES[0].id, nodes: initialNodes(), log: [] }));
};

export const getNode = (nodeId) => NODES.find((node) => node.id === nodeId);

export const isOnline = (nodeId) => state.nodes[nodeId].status !== 'offline';

export const onlineCount = (current = state) => NODES.filter((node) => current.nodes[node.id].status !== 'offline').length;

// Other nodes ordered by their last measured latency: the failover path.
export const replicasOf = (nodeId) =>
  NODES.map((node) => node.id)
    .filter((id) => id !== nodeId)
    .sort((a, b) => state.nodes[a].latency - state.nodes[b].latency);

export const setActiveNode = (nodeId) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, nodeId);
  } catch {
    // Storage can be unavailable; the choice still applies for this visit.
  }
  setState(() => ({ activeNodeId: nodeId }));
};

export const setNodeStatus = (nodeId, status) => patchNode(nodeId, () => ({ status }));

// A write landed on this node's inventory replica.
export const markWrite = (nodeId) => patchNode(nodeId, (node) => ({ version: node.version + 1 }));

export const record = (entry) =>
  setState((current) => ({ log: [{ id: ++sequence, time: Date.now(), ...entry }, ...current.log].slice(0, LOG_LIMIT) }));

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms * simulation.latencyScale));

// One request/response hop to a service hosted on a node.
export const rpc = async (nodeId, service, op, handler) => {
  const node = state.nodes[nodeId];
  const ms = Math.round((node.status === 'slow' ? node.latency * SLOW_FACTOR : node.latency) * (0.75 + simulation.random() * 0.5));
  await sleep(ms);
  const ok = isOnline(nodeId) && simulation.random() >= simulation.failureRate;
  patchNode(nodeId, (current) => ({ requests: current.requests + 1, failures: current.failures + (ok ? 0 : 1) }));
  record({ kind: 'rpc', nodeId, service, op, ms, ok });
  if (!ok) throw new NodeUnavailableError(nodeId);
  return { value: await handler(), ms, nodeId };
};

// Retries transient failures with exponential backoff. A node the heartbeat already marks as down
// is not retried (circuit breaker), and business errors such as missing stock are never retried.
export const rpcWithRetry = async (nodeId, service, op, handler, retries = 2) => {
  for (let attempt = 0; ; attempt++) {
    try {
      return await rpc(nodeId, service, op, handler);
    } catch (error) {
      if (!(error instanceof NodeUnavailableError) || attempt >= retries || !isOnline(nodeId)) throw error;
      await sleep(80 * 2 ** attempt);
    }
  }
};

// Reads can be answered by any replica: try the preferred node, then the others by latency.
export const readWithFailover = async (preferredId, service, op, handler) => {
  let lastError;
  for (const nodeId of [preferredId, ...replicasOf(preferredId)]) {
    if (nodeId !== preferredId && !isOnline(nodeId)) continue;
    try {
      const result = await rpcWithRetry(nodeId, service, op, handler);
      if (nodeId !== preferredId) record({ kind: 'failover', nodeId, from: preferredId, service, op, ok: true });
      return { ...result, failover: nodeId !== preferredId };
    } catch (error) {
      if (!(error instanceof NodeUnavailableError)) throw error;
      lastError = error;
    }
  }
  throw lastError;
};

// Heartbeats refresh each live node's measured latency, which drives routing and failover order.
export const startHeartbeat = (interval = 2000) => {
  const timer = setInterval(() => {
    setState((current) => ({
      nodes: Object.fromEntries(
        Object.entries(current.nodes).map(([id, node]) => [
          id,
          node.status === 'offline'
            ? node
            : { ...node, latency: Math.round(getNode(id).baseLatency * (0.8 + simulation.random() * 0.45)), lastHeartbeat: Date.now() }
        ])
      )
    }));
  }, interval);
  return () => clearInterval(timer);
};
