import { useSyncExternalStore } from 'react';

// Who is using this tab: customer, merchant (store), courier or admin. Kept per tab
// (sessionStorage), so one browser can run the four apps side by side in different tabs.
// shortcut: demo sign-in without passwords; increment 7 adds real authentication with roles.
export const ROLES = ['customer', 'merchant', 'courier', 'admin'];
const KEY = 'nutriflow/session';
const GUEST = { role: 'customer', name: '' };

const read = () => {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(KEY));
    return stored && ROLES.includes(stored.role) ? stored : GUEST;
  } catch {
    return GUEST;
  }
};

let session = read();
const listeners = new Set();

export const getSession = () => session;
export const useSession = () =>
  useSyncExternalStore((listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, getSession);

export const signIn = (next) => {
  session = { ...GUEST, ...next };
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable; the session lasts for this page.
  }
  listeners.forEach((listener) => listener());
};

export const signOut = () => signIn(GUEST);

// Where each role lands after signing in.
export const HOME = { customer: '/profile', merchant: '/merchant', courier: '/courier', admin: '/admin' };
