import { Routes, Route, useLocation } from 'react-router';
import Backdrop from './components/Backdrop';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import ShoppingList from './pages/ShoppingList';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import SystemStatus from './pages/SystemStatus';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import ServerError from './pages/ServerError';
import NotFound from './pages/NotFound';

function App() {
  const { pathname } = useLocation();

  return (
    <div className="App">
      <Backdrop />
      <Header />
      <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Keyed by route so leaving a crashed screen clears the error. */}
        <ErrorBoundary key={pathname}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/list" element={<ShoppingList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
