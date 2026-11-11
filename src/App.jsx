import { Suspense, lazy } from 'react';
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
import Unavailable from './pages/Unavailable';
import { useRegion } from './geo/region';
import { isSupported } from './region/profiles';
// The map (Leaflet), the planner and the QR code load on demand.
const StoreMap = lazy(() => import('./pages/StoreMap'));
const Planner = lazy(() => import('./pages/Planner'));
const SharedImport = lazy(() => import('./pages/SharedImport'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Merchant = lazy(() => import('./pages/Merchant'));
const Courier = lazy(() => import('./pages/Courier'));
const Admin = lazy(() => import('./pages/Admin'));
import NotFound from './pages/NotFound';

function App() {
  const { pathname } = useLocation();
  const { country } = useRegion();

  // Outside the countries nutriFlow serves, the whole app is switched off.
  if (!isSupported(country)) {
    return (
      <div className="App">
        <Backdrop />
        <Unavailable country={country} />
      </div>
    );
  }

  return (
    <div className="App">
      <Backdrop />
      <Header />
      <main className="pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {/* Keyed by route so leaving a crashed screen clears the error. */}
        <ErrorBoundary key={pathname}>
          <Suspense fallback={<p className="px-4 py-12 text-center text-ink/60">…</p>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductList />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/list" element={<ShoppingList />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/status" element={<SystemStatus />} />
            <Route path="/map" element={<StoreMap />} />
            <Route path="/planner" element={<Planner />} />
            <Route path="/share" element={<SharedImport />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<OrderTracking />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/merchant" element={<Merchant />} />
            <Route path="/courier" element={<Courier />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/500" element={<ServerError />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
