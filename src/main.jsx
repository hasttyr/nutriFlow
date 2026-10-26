import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import CartProvider from './cart/CartProvider';
import ListProvider from './list/ListProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { startHeartbeat } from './distributed/cluster';
import './index.css';

startHeartbeat();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LocaleProvider>
        <CartProvider>
          <ListProvider>
            <App />
          </ListProvider>
        </CartProvider>
      </LocaleProvider>
    </BrowserRouter>
  </StrictMode>
);
