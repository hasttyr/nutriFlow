import { useSyncExternalStore } from 'react';
import { REMOTE, followRegions } from './remote';

// Shared live state of the platform: orders, notifications, couriers, admin overrides of the
// regional profiles.
//
// Local mode (default, also on Vercel): every browser tab is a process of the system. Tabs share
// this state through localStorage, hear each other's writes through the `storage` event and
// serialise their writes with a cross-tab mutex (Web Locks API).
//
// Live mode (`npm run dev:live`): orders, notifications, couriers and overrides come from the
// regional servers (pushed over SSE, see remote.js); only what belongs to this browser — which
// notifications were read and the autopilot switch — stays in localStorage.

const KEY = 'nutriflow/live';
const LOCAL_FIELDS = ['seen', 'autopilot'];
const EMPTY = { orders: [], notifications: [], seen: {}, couriers: {}, overrides: {}, positions: {}, health: {}, autopilot: false };

const read = () => {
  try {
    return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(KEY)) };
  } catch {
    return EMPTY;
  }
};
const persisted = (value) => (REMOTE ? Object.fromEntries(LOCAL_FIELDS.map((field) => [field, value[field]])) : value);

let state = read();
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return;
    state = REMOTE ? { ...state, ...persisted(read()) } : read();
    emit();
  });
}

export const getLive = () => state;
export const subscribeLive = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const useLive = () => useSyncExternalStore(subscribeLive, getLive);

// Mutual exclusion across tabs: only one process at a time reads, changes and writes the state.
export const withLock = (name, work) =>
  typeof navigator !== 'undefined' && navigator.locks?.request ? navigator.locks.request(name, work) : Promise.resolve().then(work);

// Applies `change` to the freshest state (another tab may have written since we last heard).
export const updateLive = (change) =>
  withLock('nutriflow-live', () => {
    const fresh = REMOTE ? { ...state, ...persisted(read()) } : read();
    state = { ...fresh, ...change(fresh) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(persisted(state)));
    } catch {
      // Storage full or blocked: the change still applies to this tab.
    }
    emit();
    return state;
  });

// Live mode: each region pushes { kind, value } updates; the state is their union.
let regions = {};
const compose = () => {
  const all = Object.values(regions);
  const merge = (kind) => Object.assign({}, ...all.map((region) => region[kind] ?? {}));
  state = {
    ...state,
    orders: all.flatMap((region) => region.orders ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    notifications: all.flatMap((region) => region.notifications ?? []).sort((a, b) => b.at.localeCompare(a.at)),
    couriers: merge('couriers'),
    positions: merge('positions'),
    health: merge('health'),
    overrides: Object.fromEntries(Object.entries(regions).filter(([, region]) => region.overrides).map(([country, region]) => [country, region.overrides]))
  };
  emit();
};

export const startLive = () =>
  REMOTE
    ? followRegions((country, { kind, value }) => {
        regions = { ...regions, [country]: { ...regions[country], [kind]: value } };
        compose();
      })
    : () => {};

// Tests and "delete my data" start over.
export const resetLive = (keep = {}) => {
  state = { ...EMPTY, ...keep };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(persisted(state)));
  } catch {
    // Storage can be unavailable.
  }
  emit();
};
