import { getProductById } from '../data/products';
import { MAX_QUANTITY, isValidEntry } from '../cart/cart';

export const STORAGE_KEY = 'nutriflow/list';

// Shopping list entries: { id, quantity, checked }. Checked means "already have it / in the cart".
export const listReducer = (entries, action) => {
  switch (action.type) {
    case 'add': {
      if (!getProductById(action.id)) return entries;
      const existing = entries.find((entry) => entry.id === action.id);
      if (existing) {
        return entries.map((entry) =>
          entry.id === action.id
            ? { ...entry, checked: false, quantity: Math.min(entry.quantity + action.quantity, MAX_QUANTITY) }
            : entry
        );
      }
      return [...entries, { id: action.id, quantity: action.quantity, checked: false }];
    }
    case 'toggle':
      return entries.map((entry) => (entry.id === action.id ? { ...entry, checked: !entry.checked } : entry));
    case 'check':
      return entries.map((entry) => (action.ids.includes(entry.id) ? { ...entry, checked: true } : entry));
    case 'remove':
      return entries.filter((entry) => entry.id !== action.id);
    case 'clearChecked':
      return entries.filter((entry) => !entry.checked);
    default:
      throw new Error(`Unknown list action: ${action.type}`);
  }
};

export const loadList = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored)
      ? stored.filter((entry) => isValidEntry(entry) && typeof entry.checked === 'boolean')
      : [];
  } catch {
    return [];
  }
};

export const saveList = (entries) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Storage can be unavailable; the list still works in memory.
  }
};
