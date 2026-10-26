import { describe, expect, it } from 'vitest';
import {
  DELIVERY_FEE,
  MAX_QUANTITY,
  STORAGE_KEY,
  cartReducer,
  deliveryFee,
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

describe('prices per branch', () => {
  it('prices the same cart differently at each branch', () => {
    const entries = [{ id: 1, quantity: 2 }, { id: 7, quantity: 1 }];
    // Bananas 3.600 and milk 4.500 base; Chapinero +5 %, Kennedy -4 %, rounded to 100 pesos.
    expect(getCartTotals(getCartItems(entries, 'chapinero'))).toEqual({ itemCount: 3, subtotal: 2 * 3800 + 4700 });
    expect(getCartTotals(getCartItems(entries, 'kennedy'))).toEqual({ itemCount: 3, subtotal: 2 * 3500 + 4300 });
  });

  it('charges delivery below the free-delivery threshold only', () => {
    expect(deliveryFee(20000, 'delivery')).toBe(DELIVERY_FEE);
    expect(deliveryFee(95000, 'delivery')).toBe(0);
    expect(deliveryFee(20000, 'pickup')).toBe(0);
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
