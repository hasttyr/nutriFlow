import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import CartProvider from './cart/CartProvider';
import ListProvider from './list/ListProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { STORAGE_KEY } from './cart/cart';
import { STORAGE_KEY as LIST_KEY } from './list/list';
import { STORAGE_KEY as LOCALE_KEY } from './i18n/i18n';
import { setNodeStatus } from './distributed/cluster';
import { applyLocation, setCountry } from './geo/region';

// Most tests read the interface in English while shopping in Colombia (COP prices, Colombian
// payment methods): a language picked by hand in that country.
beforeEach(() => {
  window.localStorage.setItem(LOCALE_KEY, JSON.stringify({ locale: 'en', country: 'CO' }));
});

const renderApp = (path = '/') => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocaleProvider>
        <CartProvider>
          <ListProvider>
            <App />
          </ListProvider>
        </CartProvider>
      </LocaleProvider>
    </MemoryRouter>
  );
  return { user };
};

// A Colombian price as it reads on screen ("$ 13.500"), whatever the interface language.
const copFormat = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const cop = (amount) => copFormat.format(amount).replace(/\s/g, ' ');

const seedCart = (entries) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

// Opens a glass select by its accessible name and clicks one of its options.
const pick = async (user, name, option) => {
  await user.click(screen.getByRole('combobox', { name }));
  await user.click(screen.getByRole('option', { name: option }));
};

// Shops in another country with the interface still in English.
const shopIn = (country) => {
  setCountry(country);
  window.localStorage.setItem(LOCALE_KEY, JSON.stringify({ locale: 'en', country }));
};

const fillDelivery = async (user, phone = '3001234567') => {
  await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Mobile'), phone);
  await user.type(screen.getByLabelText('Address'), 'Calle 45 # 12-30');
  await user.type(screen.getByLabelText('Neighborhood'), 'Chapinero Alto');
};

describe('Browsing', () => {
  it('renders the home page with the branch network', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: /do your groceries/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nutriFlow' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'System status: 3 of 3 nodes online' })).toHaveAttribute('href', '/status');
  });

  it('loads the catalog from the active branch node', async () => {
    renderApp('/products');
    expect(await screen.findByText('66 products')).toBeInTheDocument();
    expect(screen.getByTestId('data-source')).toHaveTextContent(/Chapinero inventory · \d+ ms/);
    expect(screen.getByRole('button', { name: 'Add Ground coffee to cart' })).toBeDisabled();
  });

  it('searches ignoring accents and filters by category', async () => {
    const { user } = renderApp('/products');
    await screen.findByText('66 products');

    const search = screen.getByLabelText('Search products');
    await user.type(search, 'cafe');
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ground coffee' })).toBeInTheDocument();

    // The Spanish name works too while the interface is in English.
    await user.clear(search);
    await user.type(search, 'LECHE ENTERA');
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Whole milk' })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'pizza');
    expect(screen.getByText('No products match “pizza”.')).toBeInTheDocument();

    await user.clear(search);
    await user.click(screen.getByRole('button', { name: 'Dairy & eggs' }));
    expect(screen.getByRole('button', { name: 'Dairy & eggs' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('9 products')).toBeInTheDocument();
  });

  it('reads a branch through a replica when it is down', async () => {
    setNodeStatus('chapinero', 'offline');
    renderApp('/products');
    expect(await screen.findByTestId('data-source')).toHaveTextContent(/Chapinero data served by the Usaquén replica/);
    expect(screen.getByRole('link', { name: 'System status: 2 of 3 nodes online' })).toBeInTheDocument();
  });

  it('compares every branch and switches to the cheapest', async () => {
    const { user } = renderApp('/product/1');
    const offers = screen.getByTestId('branch-offers');
    // Each branch answers on its own schedule; wait until all three have replied.
    await waitFor(() => expect(within(offers).getAllByText(/\d+ ms/)).toHaveLength(3));
    expect(within(offers).getByText('Best price')).toBeInTheDocument();
    expect(screen.getAllByText(cop(3800)).length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Buy at Kennedy' }));
    expect(screen.getByRole('combobox', { name: 'Branch' })).toHaveTextContent(/^Kennedy · Online/);
    expect(screen.getAllByText(cop(3500)).length).toBeGreaterThan(0);
  });

  it('shows not-found pages for unknown products and routes', () => {
    renderApp('/product/999');
    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });

});

describe('Control views', () => {
  it('shows a 404 page with the requested route and ways out', async () => {
    const { user } = renderApp('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(screen.getByTestId('requested-path')).toHaveTextContent('/does-not-exist');
    expect(screen.getByText('We asked all 3 nodes and none of them knows this route.')).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: 'Browse products' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Products' })).toBeInTheDocument();
  });

  it('shows a 500 page with the incident details', () => {
    renderApp('/500');
    expect(screen.getByRole('heading', { name: 'Something went wrong on our side' })).toBeInTheDocument();
    expect(screen.getByText(/^req_[a-z0-9]+$/)).toBeInTheDocument();
    expect(screen.getByText('Chapinero (CHA)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View system status' })).toHaveAttribute('href', '/status');
  });

  it('shows the 500 page when a screen crashes, and retries it', async () => {
    // React reports the caught error on the console; keep the test output clean.
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let broken = true;
    const Flaky = () => {
      if (broken) throw new Error('boom');
      return <p>Recovered</p>;
    };
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <LocaleProvider>
          <ErrorBoundary>
            <Flaky />
          </ErrorBoundary>
        </LocaleProvider>
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: 'Something went wrong on our side' })).toBeInTheDocument();
    broken = false;
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByText('Recovered')).toBeInTheDocument();
    vi.restoreAllMocks();
  });
});

describe('Account', () => {
  it('logs in to the demo profile', async () => {
    const { user } = renderApp('/login');
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    const password = screen.getByLabelText('Password');
    await user.type(password, 'secret123');
    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: 'Log in' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My profile' })).toBeInTheDocument();
  });

  it('registers and opens the demo profile', async () => {
    const { user } = renderApp('/login');
    await user.click(screen.getByRole('link', { name: 'Create an account' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Create your account' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Mobile'), '3001234567');
    expect(screen.getByLabelText('Mobile')).toHaveAccessibleDescription('E.g. 300 123 4567');
    await user.type(screen.getByLabelText('Password'), 'secret123');
    await user.type(screen.getByLabelText('Confirm password'), 'secret123');
    await user.click(screen.getByLabelText('I accept the terms and privacy policy'));
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(screen.getByRole('heading', { level: 1, name: 'My profile' })).toBeInTheDocument();
  });

  it('shows the demo profile with live session replicas', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('link', { name: 'My account' }));
    expect(screen.getByRole('heading', { level: 2, name: 'Laura Gómez' })).toBeInTheDocument();

    const orders = screen.getByRole('region', { name: 'Recent orders' });
    expect(within(orders).getAllByRole('listitem')).toHaveLength(3);
    expect(within(orders).getByText('Cancelled')).toBeInTheDocument();
    expect(within(orders).getByRole('link', { name: 'Order NF-CHA-01038 again' })).toHaveAttribute('href', '/products');

    const session = screen.getByRole('region', { name: 'Session' });
    expect(session).toHaveTextContent('replicated on 3 of 3 nodes');
    act(() => setNodeStatus('kennedy', 'offline'));
    expect(session).toHaveTextContent('replicated on 2 of 3 nodes');

    const preferences = screen.getByRole('region', { name: 'Preferences' });
    await user.click(within(preferences).getByRole('combobox', { name: 'Preferred branch' }));
    await user.click(screen.getByRole('option', { name: 'Usaquén' }));
    expect(within(preferences).getByRole('combobox', { name: 'Preferred branch' })).toHaveTextContent('Usaquén');
    expect(within(preferences).getByRole('switch', { name: 'Updates about my orders' })).toBeChecked();
    expect(within(preferences).getByRole('switch', { name: 'Weekly deals' })).not.toBeChecked();

    await user.click(screen.getByRole('link', { name: 'Log out' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument();
  });
});

describe('Shopping list and cart', () => {
  it('builds a list and moves what is missing to the cart', async () => {
    const { user } = renderApp('/products');
    await screen.findByText('66 products');
    await user.click(screen.getByRole('button', { name: 'Add Bananas to the list' }));
    await user.click(screen.getByRole('button', { name: 'Add Whole milk to the list' }));
    await user.click(screen.getByRole('link', { name: 'List' }));

    expect(screen.getByTestId('list-progress')).toHaveTextContent('0 of 2 done');
    await user.click(screen.getByRole('checkbox', { name: 'Already have it: Whole milk' }));
    expect(screen.getByTestId('list-progress')).toHaveTextContent('1 of 2 done');
    expect(screen.getByTestId('list-estimate')).toHaveTextContent(cop(3800));

    await user.click(screen.getByRole('button', { name: 'Move 1 missing item to cart' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Your Cart' })).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity of Bananas')).toHaveTextContent('1');
    expect(screen.getByRole('link', { name: 'Cart, 1 item' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(LIST_KEY)).every((entry) => entry.checked)).toBe(true);
  });

  it('updates the cart and warns when the branch has less stock', async () => {
    seedCart([{ id: 2, quantity: 5 }]);
    const { user } = renderApp('/cart');
    expect(screen.getByTestId('stock-warning')).toHaveTextContent('Only 3 at Chapinero');
    await user.click(screen.getByRole('button', { name: 'Decrease quantity of Red apples' }));
    await user.click(screen.getByRole('button', { name: 'Decrease quantity of Red apples' }));
    expect(screen.queryByTestId('stock-warning')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Remove Red apples from cart' }));
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });
});

describe('Checkout across the cluster', () => {
  it('places a delivery order replicated on every node', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/checkout');
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(cop(13500));

    expect(screen.getByTestId('payment-country')).toHaveTextContent('Popular in Colombia');
    expect(screen.getByRole('radio', { name: /Nequi/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /PSE/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Credit or debit card/ })).toBeInTheDocument();

    await fillDelivery(user);
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.getByRole('heading', { name: 'Pay with Nequi' })).toBeInTheDocument();
    expect(screen.getByText(/phone 3001234567/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('heading', { name: 'Order confirmed!' })).toBeInTheDocument();
    expect(screen.getByTestId('order-payment')).toHaveTextContent('Paid with Nequi');
    expect(screen.getByRole('status')).toHaveTextContent(/Order NF-CHA-\d{5}/);
    expect(screen.getByTestId('order-replication')).toHaveTextContent('Replicated on 3 of 3 nodes (quorum 2)');
    expect(within(screen.getByTestId('order-trace')).getAllByRole('listitem')).toHaveLength(7);
    expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
  });

  it('fails a delivery over to another branch when the chosen one is down', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    setNodeStatus('chapinero', 'offline');
    const { user } = renderApp('/checkout');
    await fillDelivery(user);
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByText('Chapinero could not take it; Usaquén did.')).toBeInTheDocument();
    expect(screen.getByTestId('order-replication')).toHaveTextContent('Replicated on 2 of 3 nodes');
  });

  it('explains why a pickup branch cannot take the order', async () => {
    seedCart([{ id: 8, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await user.click(screen.getByRole('radio', { name: /Pick up at a branch/ }));
    await user.click(screen.getByRole('radio', { name: /Kennedy/ }));
    expect(within(screen.getByRole('radiogroup', { name: 'Pickup branch' })).getByText('1 product missing')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Full name'), 'Ada');
    await user.type(screen.getByLabelText('Mobile'), '3001234567');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kennedy does not have the whole order.');
    expect(screen.getByRole('alert')).toHaveTextContent('the charge was reversed');
    await user.click(screen.getByRole('button', { name: 'Retry' }));
    expect(screen.getByRole('button', { name: 'Place Order' })).toBeInTheDocument();
  });

  it('does not submit with an invalid phone', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await user.type(screen.getByLabelText('Mobile'), '12ab');
    expect(screen.getByLabelText('Mobile')).toBeInvalid();
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('stops the order when the shopper rejects the wallet charge', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await fillDelivery(user);
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The payment was declined.');
    expect(screen.queryByTestId('order-trace')).not.toBeInTheDocument();
  });

  it('pays by card, and declines the 0002 test card', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await fillDelivery(user);
    await user.click(screen.getByRole('radio', { name: /Credit or debit card/ }));
    await user.type(screen.getByLabelText('Card number'), '4000000000000002');
    expect(screen.getByLabelText('Card number')).toHaveValue('4000 0000 0000 0002');
    await user.type(screen.getByLabelText('Name on card'), 'Ada Lovelace');
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1299');
    await user.type(screen.getByLabelText('CVC'), '123');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('The payment was declined.');

    await user.click(screen.getByRole('button', { name: 'Retry' }));
    await user.clear(screen.getByLabelText('Card number'));
    await user.type(screen.getByLabelText('Card number'), '4242424242424241');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Check the card number.');

    await user.clear(screen.getByLabelText('Card number'));
    await user.type(screen.getByLabelText('Card number'), '4242424242424242');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(await screen.findByRole('heading', { name: 'Order confirmed!' })).toBeInTheDocument();
    expect(screen.getByTestId('order-payment')).toHaveTextContent('Paid with card •••• 4242');
  });

  it('offers Pix and Boleto in Brazil, priced in reais', async () => {
    shopIn('BR');
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/^R\$\s13,08$/);
    expect(screen.getByRole('radio', { name: /Pix/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Boleto/ })).toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /Nequi/ })).not.toBeInTheDocument();
    await fillDelivery(user, '(11) 91234-5678');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.getByTestId('payment-code')).toHaveTextContent(/^00020126.*BR\.GOV\.BCB\.PIX.*5406\d*13\.08/);
    await user.click(screen.getByRole('button', { name: /paid \(simulate\)/ }));
    expect(await screen.findByTestId('order-payment')).toHaveTextContent('Paid with Pix');
  });

  it('gives a konbini payment number in Japan, priced in yen', async () => {
    shopIn('JP');
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/^[¥￥]498$/);
    await fillDelivery(user, '090-1234-5678');
    await user.click(screen.getByRole('radio', { name: /Convenience store payment/ }));
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(await screen.findByTestId('order-voucher')).toHaveTextContent('Awaiting payment with Convenience store payment');
  });

  it('takes cash on delivery in Colombia', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await fillDelivery(user);
    await user.click(screen.getByRole('radio', { name: /Cash/ }));
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(await screen.findByTestId('order-cash')).toHaveTextContent(`Have ${cop(9700)} ready in cash for the courier.`);
    expect(screen.queryByTestId('order-payment')).not.toBeInTheDocument();
  });

  it('approves Apple Pay in the United States, priced in dollars', async () => {
    shopIn('US');
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    // Groceries pay no New York sales tax; the suggested 18 % tip is preselected.
    expect(screen.queryByTestId('checkout-tax')).not.toBeInTheDocument();
    expect(screen.getByTestId('checkout-tip')).toHaveTextContent('$0.27');
    expect(screen.getByTestId('checkout-total')).toHaveTextContent(/^\$5\.75$/);
    await fillDelivery(user, '(212) 555-0123');
    await user.click(screen.getByRole('radio', { name: /Apple Pay/ }));
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.getByRole('heading', { name: 'Pay with Apple Pay' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Approve' }));
    expect(await screen.findByTestId('order-payment')).toHaveTextContent('Paid with Apple Pay');
  });

  it('rejects a phone number that does not follow the country format', async () => {
    shopIn('FR');
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    await fillDelivery(user, '3001234567');
    expect(screen.getByLabelText('Mobile')).toBeInvalid();
    await user.clear(screen.getByLabelText('Mobile'));
    await user.type(screen.getByLabelText('Mobile'), '06 12 34 56 78');
    expect(screen.getByLabelText('Mobile')).toBeValid();
  });

  it('switches methods and language when the shopper picks another country at checkout', async () => {
    seedCart([{ id: 1, quantity: 1 }]);
    const { user } = renderApp('/checkout');
    const methods = () => [...document.querySelectorAll('input[name="payment"]')].map((input) => input.value);
    expect(methods()).toEqual(['nequi', 'pse', 'card', 'daviplata', 'cash']);

    await user.click(screen.getByRole('combobox', { name: 'Paying from' }));
    await user.click(screen.getByRole('option', { name: /^Brazil/ }));
    expect(methods()).toEqual(['pix', 'card', 'boleto', 'cash']);
    // The language picked by hand belonged to Colombia; Brazil brings its own.
    expect(screen.getByRole('heading', { level: 1, name: 'Finalizar pedido' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'pt');
  });

  it('asks the user to shop first when checking out with an empty cart', () => {
    renderApp('/checkout');
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
  });
});

describe('Countries nutriFlow does not serve', () => {
  it('switches the app off and lets a demo pick a served country', async () => {
    act(() => {
      applyLocation({ lat: 52.52, lon: 13.4, accuracy: 5000, source: 'ip', countryCode: 'DE' });
    });
    const { user } = renderApp('/products');
    expect(screen.getByRole('heading', { name: 'nutriFlow is not available in Germany' })).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Simulate another country (demo)' }));
    await user.click(screen.getByRole('option', { name: 'Colombia' }));
    expect(screen.queryByText(/is not available/)).not.toBeInTheDocument();
  });
});

describe('System status', () => {
  it('simulates a node going down and back', async () => {
    const { user } = renderApp('/status');
    expect(screen.getByTestId('cluster-online')).toHaveTextContent('3 of 3 nodes online');

    const kennedy = screen.getByRole('group', { name: 'Simulate Kennedy state' });
    await user.click(within(kennedy).getByRole('button', { name: 'Down' }));
    expect(screen.getByTestId('cluster-online')).toHaveTextContent('2 of 3 nodes online');
    expect(screen.getByRole('link', { name: 'System status: 2 of 3 nodes online' })).toBeInTheDocument();

    await user.click(within(kennedy).getByRole('button', { name: 'Normal' }));
    expect(screen.getByTestId('cluster-online')).toHaveTextContent('3 of 3 nodes online');
  });
});

describe('Language picker', () => {
  it('follows the language of the country without saving it', () => {
    window.localStorage.removeItem(LOCALE_KEY);
    renderApp('/');
    expect(screen.getByRole('combobox', { name: 'Idioma' })).toHaveTextContent('Español');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    act(() => setCountry('JP'));
    expect(screen.getByRole('combobox', { name: '言語' })).toHaveTextContent('日本語');
    expect(document.documentElement).toHaveAttribute('lang', 'ja');
    expect(window.localStorage.getItem(LOCALE_KEY)).toBeNull();
  });

  it('switches to Spanish with Colombian pesos and remembers the choice for the country', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/cart');

    await pick(user, 'Language', 'Español');
    expect(screen.getByRole('heading', { level: 1, name: 'Tu carrito' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carrito, 2 artículos' })).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent(cop(7600));
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(JSON.parse(window.localStorage.getItem(LOCALE_KEY))).toEqual({ locale: 'es', country: 'CO' });
  });

  it('offers French and Japanese, keeping the country formats', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/cart');

    await pick(user, 'Language', 'Français');
    expect(screen.getByRole('heading', { level: 1, name: 'Votre panier' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Panier, 2 articles' })).toBeInTheDocument();
    expect(screen.getByText('Bananes')).toBeInTheDocument();

    await pick(user, 'Langue', '日本語');
    expect(screen.getByRole('heading', { level: 1, name: 'カート' })).toBeInTheDocument();
    expect(screen.getByText('バナナ')).toBeInTheDocument();
    // Still shopping in Colombia: the money is formatted the Colombian way.
    expect(screen.getByTestId('cart-total')).toHaveTextContent(cop(7600));
    expect(document.documentElement).toHaveAttribute('lang', 'ja');
  });

  it('works from the keyboard', async () => {
    const { user } = renderApp('/');
    const picker = screen.getByRole('combobox', { name: 'Language' });
    picker.focus();

    await user.keyboard('{ArrowDown}');
    expect(picker).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('aria-selected', 'true');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(picker).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: '日本語' }).id);
    await user.keyboard('{Enter}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'ja');
    expect(picker).toHaveFocus();

    // Typing jumps to a language; Escape closes without changing it.
    await user.keyboard('f');
    expect(picker).toHaveAttribute('aria-activedescendant', screen.getByRole('option', { name: 'Français' }).id);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'ja');
  });

  it('closes when clicking elsewhere', async () => {
    const { user } = renderApp('/');
    await user.click(screen.getByRole('combobox', { name: 'Language' }));
    expect(screen.getByRole('listbox', { name: 'Language' })).toBeInTheDocument();
    await user.click(screen.getByRole('heading', { level: 1 }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

describe('Branch picker', () => {
  it('lists every branch with its health and switches the active one', async () => {
    const { user } = renderApp('/products');
    await screen.findByText('66 products');
    setNodeStatus('kennedy', 'slow');

    await user.click(screen.getByRole('combobox', { name: 'Branch' }));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.getByRole('option', { name: /^Kennedy,\s?Slow · \d+ ms$/ })).toBeInTheDocument();
    await user.click(screen.getByRole('option', { name: /^Usaquén/ }));
    expect(screen.getByRole('combobox', { name: 'Branch' })).toHaveTextContent(/^Usaquén · Online/);
    expect(await screen.findByTestId('data-source')).toHaveTextContent(/Usaquén inventory/);
  });
});
