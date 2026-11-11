import { useSyncExternalStore } from 'react';

// Shared live state of the platform: orders, notifications, couriers, admin overrides of the
// regional profiles. Every browser tab is a process of the system (customer, store, courier,
// admin): they share this state through localStorage, hear each other's writes through the
// `storage` event, and serialise their writes with a cross-tab mutex (Web Locks API).
// shortcut: the state lives in the browser; increment 4 moves it behind the regional APIs
// (HTTP + WebSocket) and only this file changes.

const KEY = 'nutriflow/live';
const EMPTY = { orders: [], notifications: [], seen: {}, couriers: {}, overrides: {}, autopilot: false };

const read = () => {
  try {
    return { ...EMPTY, ...JSON.parse(window.localStorage.getItem(KEY)) };
  } catch {
    return EMPTY;
  }
};

let state = read();
const listeners = new Set();
const emit = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== KEY && event.key !== null) return;
    state = read();
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
    const fresh = read();
    state = { ...fresh, ...change(fresh) };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked: the change still applies to this tab.
    }
    emit();
    return state;
  });

// Tests and "delete my data" start over.
export const resetLive = (keep = {}) => {
  state = { ...EMPTY, ...keep };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable.
  }
  emit();
};
