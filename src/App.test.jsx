import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import App from './App';
import CartProvider from './cart/CartProvider';
import LocaleProvider from './i18n/LocaleProvider';
import { STORAGE_KEY } from './cart/cart';
import { STORAGE_KEY as LOCALE_KEY } from './i18n/i18n';

const renderApp = (path = '/') => {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <LocaleProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </LocaleProvider>
    </MemoryRouter>
  );
  return { user };
};

const seedCart = (entries) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));

describe('App', () => {
  it('renders the home page with featured products', () => {
    renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: /track your calories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'nutriFlow' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: 'View details for Organic Granola' })).toHaveAttribute('href', '/product/1');
  });

  it('lists every product with a formatted price', () => {
    renderApp('/products');
    expect(screen.getAllByRole('link', { name: /view details for/i })).toHaveLength(6);
    expect(screen.getByText('$5.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Almond Butter' })).toHaveAttribute('src', '/images/almond-butter.svg');
  });

  it('adds a product to the cart from its detail page', async () => {
    const { user } = renderApp('/product/1');

    expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(screen.getByTestId('quantity')).toHaveTextContent('2');
    expect(screen.getByText('900 calories')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Add to Cart' }));

    expect(screen.getByRole('heading', { level: 1, name: 'Your Shopping Cart' })).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity of Organic Granola')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-count')).toHaveTextContent('2');
    expect(screen.getByRole('link', { name: 'Cart, 2 items' })).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual([{ id: 1, quantity: 2 }]);
  });

  it('shows a not-found message for unknown products and routes', () => {
    renderApp('/product/999');
    expect(screen.getByRole('heading', { name: 'Product not found' })).toBeInTheDocument();
  });

  it('shows a 404 page for unknown routes', () => {
    renderApp('/does-not-exist');
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
  });

  it('updates totals when quantities change and items are removed', async () => {
    seedCart([{ id: 1, quantity: 2 }, { id: 2, quantity: 1 }]);
    const { user } = renderApp('/cart');

    expect(screen.getByTestId('cart-total')).toHaveTextContent('$16.17');
    expect(screen.getByTestId('cart-calories')).toHaveTextContent('1,120 calories');

    await user.click(screen.getByRole('button', { name: 'Decrease quantity of Organic Granola' }));
    expect(screen.getByRole('button', { name: 'Decrease quantity of Organic Granola' })).toBeDisabled();
    expect(screen.getByTestId('cart-calories')).toHaveTextContent('670 calories');

    await user.click(screen.getByRole('button', { name: 'Remove Organic Granola from cart' }));
    await user.click(screen.getByRole('button', { name: 'Remove Protein Bar from cart' }));
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
  });

  it('places an order, shows a confirmation and empties the cart', async () => {
    seedCart([{ id: 3, quantity: 1 }]);
    const { user } = renderApp('/checkout');

    const summary = screen.getByRole('complementary');
    expect(within(summary).getByText('Fresh Juice Blend')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-total')).toHaveTextContent('$4.85 · 180 calories');

    await user.type(screen.getByLabelText('First Name'), 'Ada');
    await user.type(screen.getByLabelText('Last Name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Address'), '12 Analytical St');
    await user.type(screen.getByLabelText('City'), 'London');
    await user.type(screen.getByLabelText('ZIP Code'), '10001');
    await user.type(screen.getByLabelText('Card Number'), '4242 4242 4242 4242');
    await user.type(screen.getByLabelText('Expiry Date'), '12/30');
    await user.type(screen.getByLabelText('CVV'), '123');
    await user.click(screen.getByRole('button', { name: 'Place Order' }));

    const confirmation = screen.getByRole('status');
    expect(within(confirmation).getByRole('heading', { name: 'Order placed successfully!' })).toBeInTheDocument();
    expect(confirmation).toHaveTextContent('ada@example.com');
    expect(confirmation).toHaveTextContent('$4.85');
    expect(screen.queryByTestId('cart-count')).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY))).toEqual([]);
  });

  it('does not submit the checkout with an invalid card', async () => {
    seedCart([{ id: 3, quantity: 1 }]);
    const { user } = renderApp('/checkout');

    await user.type(screen.getByLabelText('Card Number'), '12ab');
    expect(screen.getByLabelText('Card Number')).toBeInvalid();
    await user.click(screen.getByRole('button', { name: 'Place Order' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('asks the user to shop first when checking out with an empty cart', () => {
    renderApp('/checkout');
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Place Order' })).not.toBeInTheDocument();
  });
});

describe('Language toggle', () => {
  it('switches the whole interface to Spanish and remembers the choice', async () => {
    seedCart([{ id: 1, quantity: 2 }]);
    const { user } = renderApp('/cart');

    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Español' }));

    expect(screen.getByRole('button', { name: 'Español' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('heading', { level: 1, name: 'Tu carrito' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Carrito, 2 artículos' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Granola orgánica' })).toBeInTheDocument();
    expect(screen.getByTestId('cart-total')).toHaveTextContent('USD 12.94');
    expect(screen.getByTestId('cart-calories')).toHaveTextContent('900 calorías');
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(window.localStorage.getItem(LOCALE_KEY)).toBe('es');
  });

  it('starts in the saved language', () => {
    window.localStorage.setItem(LOCALE_KEY, 'es');
    renderApp('/products');
    expect(screen.getByRole('heading', { level: 1, name: 'Nuestros productos' })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Mantequilla de almendra' })).toBeInTheDocument();
  });

  it('runs checkout in Spanish', async () => {
    window.localStorage.setItem(LOCALE_KEY, 'es');
    seedCart([{ id: 2, quantity: 1 }]);
    const { user } = renderApp('/checkout');

    await user.type(screen.getByLabelText('Nombre'), 'Ada');
    await user.type(screen.getByLabelText('Apellido'), 'Lovelace');
    await user.type(screen.getByLabelText('Correo electrónico'), 'ada@example.com');
    await user.type(screen.getByLabelText('Dirección'), 'Calle 12');
    await user.type(screen.getByLabelText('Ciudad'), 'Monterrey');
    await user.type(screen.getByLabelText('Código postal'), '64000');
    await user.type(screen.getByLabelText('Número de tarjeta'), '4242424242424242');
    await user.type(screen.getByLabelText('Vencimiento'), '01/31');
    await user.type(screen.getByLabelText('CVV'), '999');
    await user.click(screen.getByRole('button', { name: 'Realizar pedido' }));

    expect(screen.getByRole('status')).toHaveTextContent('¡Pedido realizado con éxito!');
    expect(screen.getByRole('status')).toHaveTextContent('220 calorías');
  });
});
