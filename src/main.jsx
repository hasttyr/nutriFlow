import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import CartProvider from './cart/CartProvider';
import ListProvider from './list/ListProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { startHeartbeat } from './distributed/cluster';
import { startRegion } from './geo/region';
import { startAutopilotLeader } from './live/orders';
import { startLive } from './live/store';
import './index.css';

startHeartbeat();
startRegion();
startAutopilotLeader();
startLive();

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
