import { getProductById } from '../data/products';

export const TAX_RATE = 0.08;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 100;
export const STORAGE_KEY = 'nutriflow/cart';

const clampQuantity = (quantity) => Math.min(Math.max(quantity, MIN_QUANTITY), MAX_QUANTITY);

const roundToCents = (amount) => Math.round(amount * 100) / 100;

const isValidEntry = (entry) =>
  entry !== null &&
  typeof entry === 'object' &&
  getProductById(entry.id) !== undefined &&
  Number.isInteger(entry.quantity) &&
  entry.quantity >= MIN_QUANTITY &&
  entry.quantity <= MAX_QUANTITY;

// The cart only stores { id, quantity }; product details always come from the catalog,
// so stale or tampered prices in localStorage can never reach the totals.
export const cartReducer = (entries, action) => {
  switch (action.type) {
    case 'add': {
      if (!getProductById(action.id)) return entries;
      const existing = entries.find((entry) => entry.id === action.id);
      if (existing) {
        return entries.map((entry) =>
          entry.id === action.id
            ? { ...entry, quantity: clampQuantity(entry.quantity + action.quantity) }
            : entry
        );
      }
      return [...entries, { id: action.id, quantity: clampQuantity(action.quantity) }];
    }
    case 'update':
      return entries.map((entry) =>
        entry.id === action.id ? { ...entry, quantity: clampQuantity(action.quantity) } : entry
      );
    case 'remove':
      return entries.filter((entry) => entry.id !== action.id);
    case 'clear':
      return [];
    default:
      throw new Error(`Unknown cart action: ${action.type}`);
  }
};

export const getCartItems = (entries) =>
  entries
    .map((entry) => {
      const product = getProductById(entry.id);
      return product ? { ...product, quantity: entry.quantity } : null;
    })
    .filter(Boolean);

export const getCartTotals = (items) => {
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const totalCalories = items.reduce((total, item) => total + (item.calories * item.quantity), 0);
  const subtotal = roundToCents(items.reduce((total, item) => total + (item.price * item.quantity), 0));
  const tax = roundToCents(subtotal * TAX_RATE);
  return { itemCount, totalCalories, subtotal, tax, total: roundToCents(subtotal + tax) };
};

export const loadCart = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored.filter(isValidEntry) : [];
  } catch {
    return [];
  }
};

export const saveCart = (entries) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable (private mode, quota); the cart still works in memory.
  }
};
