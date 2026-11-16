import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import CartProvider from './cart/CartProvider';
import ListProvider from './list/ListProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { startHeartbeat } from './distributed/cluster';
import { getRegion, startRegion, subscribeRegion } from './geo/region';
import { startAutopilotLeader } from './live/orders';
import { getSession, subscribeSession } from './live/session';
import { followCountries } from './live/store';
import { COUNTRIES } from './region/profiles';
import './index.css';

startHeartbeat();
startRegion();
startAutopilotLeader();
// Live mode: this tab connects to its own country's region; the admin console to all of them.
const follow = () => {
  const { role } = getSession();
  followCountries(role === 'admin' ? COUNTRIES : [getRegion().country], role);
};
follow();
subscribeSession(follow);
subscribeRegion(follow);

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
