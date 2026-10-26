# nutriFlow

nutriFlow is a React marketplace with built-in calorie tracking, bilingual (ES/EN) and mobile-first.

## Features

- Browse products with detailed information
- View and track calories for each product
- Add items to a shared cart (persisted in `localStorage`, live badge in the header)
- Proceed through checkout with validated shipping and payment fields
- Responsive design for all devices

## Technologies Used

- React 19
- React Router 8 (declarative mode)
- Vite 8
- Tailwind CSS 4
- Vitest 5 + Testing Library
- ESLint 10 (flat config, `react-hooks` and `react-refresh` rules)

## Requirements

- Node.js `^22.22.2 || >=24.15.0`

## Setup Instructions

1. Clone the repository
2. Navigate to the project directory: `cd market-app`
3. Install dependencies: `npm install`
4. Start the development server: `npm run dev` (or `npm start`)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run check` | Lint + tests + build (use before delivering) |

## Application Structure

- `src/main.jsx` - Entry point (router + cart provider)
- `src/App.jsx` - Layout and routes
- `src/components/Header.jsx` - Navigation header with live cart count
- `src/data/products.js` - Product catalog (single source of truth)
- `src/cart/` - Cart state: reducer, totals, persistence (`cart.js`), provider and `useCart` hook
- `src/pages/HomePage.jsx` - Homepage component
- `src/pages/ProductList.jsx` - Product listing page
- `src/pages/ProductDetail.jsx` - Individual product details with calorie tracking
- `src/pages/Cart.jsx` - Shopping cart
- `src/pages/Checkout.jsx` - Checkout page with form
- `src/pages/NotFound.jsx` - 404 page
- `public/images/` - Product images

## Navigation

The app includes routes for:
- `/` - Home Page
- `/products` - Product Listing
- `/product/:id` - Individual Product Details (with calorific information)
- `/cart` - Shopping Cart
- `/checkout` - Checkout Process
- `*` - Not Found

## Calorie Tracking

The product detail page allows users to:
- Select quantity of items
- See real-time calorie calculation for selected quantity
- View calorie information per serving and total calories

The cart and checkout show the total calories of the whole order.

> Checkout is a demo: no payment is processed and card data is never stored.
