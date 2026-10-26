import { Routes, Route } from 'react-router';
import Backdrop from './components/Backdrop';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ShoppingList from './pages/ShoppingList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import SystemStatus from './pages/SystemStatus';
import NotFound from './pages/NotFound';

function App() {
  return (
    <div className="App">
      <Backdrop />
      <Header />
      <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/list" element={<ShoppingList />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/status" element={<SystemStatus />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
