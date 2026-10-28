import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import CartProvider from './cart/CartProvider';
import ListProvider from './list/ListProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { STORAGE_KEY } from './cart/cart';
import { STORAGE_KEY as LIST_KEY } from './list/list';
import { STORAGE_KEY as LOCALE_KEY } from './i18n/i18n';
import { setNodeStatus } from './distributed/cluster';

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

const seedCart = (entries) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

const fillDelivery = async (user) => {
  await user.type(screen.getByLabelText('Full name'), 'Ada Lovelace');
  await user.type(screen.getByLabelText('Mobile'), '3001234567');
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
    expect(await screen.findByText('18 products')).toBeInTheDocument();
    expect(screen.getByTestId('data-source')).toHaveTextContent(/Chapinero inventory · \d+ ms/);
    expect(screen.getByRole('button', { name: 'Add Ground coffee to cart' })).toBeDisabled();
  });

  it('searches ignoring accents and filters by category', async () => {
    const { user } = renderApp('/products');
    await screen.findByText('18 products');

    const search = screen.getByLabelText('Search products');
    await user.type(search, 'cafe');
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ground coffee' })).toBeInTheDocument();

    // The Spanish name works too while the interface is in English.
    await user.clear(search);
    await user.type(search, 'LECHE');
    expect(screen.getByText('1 product')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Whole milk' })).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'pizza');
    expect(screen.getByText('No products match “pizza”.')).toBeInTheDocument();

    await user.clear(search);
    await user.click(screen.getByRole('button', { name: 'Dairy & eggs' }));
    expect(screen.getByRole('button', { name: 'Dairy & eggs' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('3 products')).toBeInTheDocument();
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
    expect(screen.getAllByText('COP 3,800').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Buy at Kennedy' }));
    expect(screen.getByLabelText('Branch')).toHaveValue('kennedy');
    expect(screen.getAllByText('COP 3,500').length).toBeGreaterThan(0);
  });

  it('shows not-found pages for unknown products and routes', () => {
    renderApp('/product/999');
    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });

  it('shows a 404 page for unknown routes', () => {
    renderApp('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });
});

describe('Shopping list and cart', () => {
  it('builds a list and moves what is missing to the cart', async () => {
    const { user } = renderApp('/products');
    await screen.findByText('18 products');
    await user.click(screen.getByRole('button', { name: 'Add Bananas to the list' }));
    await user.click(screen.getByRole('button', { name: 'Add Whole milk to the list' }));
    await user.click(screen.getByRole('link', { name: 'List' }));

    expect(screen.getByTestId('list-progress')).toHaveTextContent('0 of 2 done');
    await user.click(screen.getByRole('checkbox', { name: 'Already have it: Whole milk' }));
    expect(screen.getByTestId('list-progress')).toHaveTextContent('1 of 2 done');
    expect(screen.getByTestId('list-estimate')).toHaveTextContent('COP 3,800');

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
    expect(screen.getByTestId('checkout-total')).toHaveTextContent('COP 13,500');

    await fillDelivery(user);
    await user.click(screen.getByRole('button', { name: 'Place Order' }));

    expect(await screen.findByRole('heading', { name: 'Order confirmed!' })).toBeInTheDocument();
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

    expect(await screen.findByRole('alert')).toHaveTextContent('Kennedy does not have the whole order.');
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

  it('asks the user to shop first when checking out with an empty cart', () => {
    renderApp('/checkout');
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
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
  it('detects the language without saving it', () => {
    renderApp('/');
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveValue('en');
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(window.localStorage.getItem(LOCALE_KEY)).toBeNull();
  });

  it('switches to Spanish with Colombian pesos and remembers the choice', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/cart');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Español');
    expect(screen.getByRole('heading', { level: 1, name: 'Tu carrito' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carrito, 2 artículos' })).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent(/^\$\s7\.600$/);
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(window.localStorage.getItem(LOCALE_KEY)).toBe('es');
  });

  it('offers Portuguese, Polish and Italian', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/cart');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Language' }), 'Polski');
    expect(screen.getByRole('heading', { level: 1, name: 'Twój koszyk' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Koszyk, 2 produkty' })).toBeInTheDocument();
    expect(screen.getByText('Banany')).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Język' }), 'Português');
    expect(screen.getByRole('heading', { level: 1, name: 'Seu carrinho' })).toBeInTheDocument();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Idioma' }), 'Italiano');
    expect(screen.getByRole('heading', { level: 1, name: 'Il tuo carrello' })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute('lang', 'it');
  });
});
