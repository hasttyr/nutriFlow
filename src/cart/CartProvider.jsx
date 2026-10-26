import { useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './CartContext';
import { cartReducer, getCartItems, getCartTotals, loadCart, saveCart } from './cart';

const CartProvider = ({ children }) => {
  const [entries, dispatch] = useReducer(cartReducer, undefined, loadCart);

  useEffect(() => {
    saveCart(entries);
  }, [entries]);

  const value = useMemo(() => {
    const items = getCartItems(entries);
    return {
      items,
      ...getCartTotals(items),
      addItem: (id, quantity = 1) => dispatch({ type: 'add', id, quantity }),
      updateQuantity: (id, quantity) => dispatch({ type: 'update', id, quantity }),
      removeItem: (id) => dispatch({ type: 'remove', id }),
      clearCart: () => dispatch({ type: 'clear' })
    };
  }, [entries]);

  return <CartContext value={value}>{children}</CartContext>;
};

export default CartProvider;
