import { useEffect, useMemo, useReducer } from 'react';
import { CartContext } from './CartContext';
import { cartReducer, getCartItems, getCartTotals, loadCart, saveCart } from './cart';
import { useCluster } from '../distributed/hooks';

const CartProvider = ({ children }) => {
  const [entries, dispatch] = useReducer(cartReducer, undefined, loadCart);
  // Prices and stock follow the active branch and change when its inventory replica is written.
  const { activeNodeId, nodes } = useCluster();
  const inventoryVersion = nodes[activeNodeId].version;

  useEffect(() => {
    saveCart(entries);
  }, [entries]);

  const value = useMemo(() => {
    const items = getCartItems(entries, activeNodeId);
    return {
      items,
      inventoryVersion,
      ...getCartTotals(items),
      addItem: (id, quantity = 1) => dispatch({ type: 'add', id, quantity }),
      updateQuantity: (id, quantity) => dispatch({ type: 'update', id, quantity }),
      removeItem: (id) => dispatch({ type: 'remove', id }),
      clearCart: () => dispatch({ type: 'clear' })
    };
  }, [entries, activeNodeId, inventoryVersion]);

  return <CartContext value={value}>{children}</CartContext>;
};

export default CartProvider;
