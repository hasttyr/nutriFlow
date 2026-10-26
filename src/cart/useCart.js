import { use } from 'react';
import { CartContext } from './CartContext';

export const useCart = () => {
  const cart = use(CartContext);
  if (!cart) {
    throw new Error('useCart must be used inside <CartProvider>');
  }
  return cart;
};
