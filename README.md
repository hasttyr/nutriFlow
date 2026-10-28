# nutriFlow

nutriFlow helps you do your groceries ("hacer mercado") in Bogotá: build a shopping list, compare branches, and get delivery or pick up at a store. It is the Práctica IV project for the Distributed Systems (SD) course, so the app **looks and behaves like a distributed system**. The backend is simulated in the browser; it is not a real server.

## Features

- **Catalog** with search (accent-insensitive, in any of the five languages) and categories.
- **Shopping list**: plan, check off what you already have, and move what is missing to the cart.
- **Compare branches**: every branch answers with its own price and stock, each at its own latency.
- **Delivery or pickup**, paid on delivery (demo: nothing is charged).
- **System status** (`/status`): node health, latency, inventory version, requests, failures, a live call log, and controls to make any node slow or bring it down.
- **Five languages** (Spanish, English, Portuguese, Polish, Italian), picked automatically from the browser language or, for English browsers, from the visitor's time zone (e.g. Warsaw → Polish); a manual choice is remembered. Prices in Colombian pesos, liquid-glass UI built 100% with Tailwind, mobile-first.

## Simulated distributed system

Everything lives in `src/distributed/`:

| Concept | Where it shows |
| --- | --- |
| **Nodes**: three branches (Chapinero, Usaquén, Kennedy), each with its own inventory replica | Branch picker, `/status` |
| **Network**: every call has latency and can fail (4 % transient failure rate) | "served by" badge, call log |
| **Retries with exponential backoff** and a **circuit breaker** for nodes known to be down | Call log |
| **Heartbeats** refresh each node's latency every 2 s | `/status`, branch picker |
| **Failover reads**: if a branch does not answer, a replica serves its data | Products page ("served by the … replica") |
| **Order saga**: route → reserve stock → register payment → create order → replicate → notify | Live order trace at checkout |
| **Quorum replication** (2 of 3) and **compensation** (stock is released if quorum fails) | Order confirmation / error |
| **Delivery failover**: a down branch hands the order to the next one | Order confirmation |

Try it: open `/status`, set Chapinero to **Down**, then browse products and place a delivery order.

## Requirements

- Node.js 24 (React Router 8 needs Node ≥ 22.22)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the test suite once |
| `npm run check` | Lint + tests + build (use before pushing) |

## Deployment

Pushing to `main` deploys on Vercel. `vercel.json` rewrites every route to `index.html` so deep links such as `/products` work on reload.

## Application structure

- `src/distributed/` - simulated cluster (`cluster.js`), branch inventories (`inventory.js`), order saga (`orders.js`), React hooks (`hooks.js`)
- `src/data/products.js` - catalog with base prices and icons
- `src/cart/`, `src/list/` - cart and shopping list state (persisted in `localStorage`)
- `src/i18n/` - language detection, formatting, and one message file per language in `locales/`
- `src/ui/` - liquid-glass primitives and shared Tailwind class sets
- `src/components/`, `src/pages/` - layout and routes

## Image credits

`public/images/backdrop-produce.jpg` is StockSnap "Fruit Vegetables" (F8B73CPSBK), CC0 / public domain, found via [Openverse](https://openverse.org).
