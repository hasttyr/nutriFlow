import { describe, expect, it } from 'vitest';
import {
  MAX_QUANTITY,
  STORAGE_KEY,
  cartReducer,
  getCartItems,
  getCartTotals,
  loadCart,
  saveCart
} from './cart';

describe('cartReducer', () => {
  it('adds a new product', () => {
    expect(cartReducer([], { type: 'add', id: 1, quantity: 2 })).toEqual([{ id: 1, quantity: 2 }]);
  });

  it('merges quantities when the product is already in the cart', () => {
    const state = [{ id: 1, quantity: 2 }];
    expect(cartReducer(state, { type: 'add', id: 1, quantity: 3 })).toEqual([{ id: 1, quantity: 5 }]);
  });

  it('never exceeds the maximum quantity', () => {
    const state = [{ id: 1, quantity: MAX_QUANTITY - 1 }];
    expect(cartReducer(state, { type: 'add', id: 1, quantity: 5 })).toEqual([{ id: 1, quantity: MAX_QUANTITY }]);
  });

  it('ignores products that are not in the catalog', () => {
    expect(cartReducer([], { type: 'add', id: 999, quantity: 1 })).toEqual([]);
  });

  it('clamps updated quantities to at least one', () => {
    const state = [{ id: 1, quantity: 2 }];
    expect(cartReducer(state, { type: 'update', id: 1, quantity: 0 })).toEqual([{ id: 1, quantity: 1 }]);
  });

  it('removes and clears products', () => {
    const state = [{ id: 1, quantity: 2 }, { id: 2, quantity: 1 }];
    expect(cartReducer(state, { type: 'remove', id: 1 })).toEqual([{ id: 2, quantity: 1 }]);
    expect(cartReducer(state, { type: 'clear' })).toEqual([]);
  });

  it('throws on unknown actions', () => {
    expect(() => cartReducer([], { type: 'nope' })).toThrow('Unknown cart action: nope');
  });
});

describe('getCartTotals', () => {
  it('computes count, calories and money rounded to cents', () => {
    // Organic Granola (5.99, 450 kcal) x2 + Protein Bar (2.99, 220 kcal) x1
    const items = getCartItems([{ id: 1, quantity: 2 }, { id: 2, quantity: 1 }]);
    expect(getCartTotals(items)).toEqual({
      itemCount: 3,
      totalCalories: 1120,
      subtotal: 14.97,
      tax: 1.2,
      total: 16.17
    });
  });

  it('returns zeros for an empty cart', () => {
    expect(getCartTotals([])).toEqual({ itemCount: 0, totalCalories: 0, subtotal: 0, tax: 0, total: 0 });
  });
});

describe('cart persistence', () => {
  it('round-trips through localStorage', () => {
    saveCart([{ id: 3, quantity: 4 }]);
    expect(loadCart()).toEqual([{ id: 3, quantity: 4 }]);
  });

  it('drops invalid or tampered entries', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([
      { id: 1, quantity: 2 },
      { id: 999, quantity: 1 },
      { id: 2, quantity: -5 },
      { id: 3, quantity: 1.5 },
      null
    ]));
    expect(loadCart()).toEqual([{ id: 1, quantity: 2 }]);
  });

  it('recovers from corrupted storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    expect(loadCart()).toEqual([]);
  });
});
