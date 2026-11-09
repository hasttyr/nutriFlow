# nutriFlow

nutriFlow helps you do your groceries ("hacer mercado") wherever you are: it finds the real stores around you, plans your week's meals with a free AI, builds the shopping list, and tells you which nearby store is cheapest. It is the Práctica IV project for the Distributed Systems (SD) course, so the app **looks and behaves like a distributed system**: every nearby store is a node of a cluster simulated in the browser. There is no backend of our own (only a one-file proxy for the AI, see below).

## Features

- **Location, most precise method first**: device GPS (with permission) → IP lookup → time zone → a point picked on the map. City and country come from reverse geocoding.
- **Store map** (`/map`): real supermarkets, greengrocers, butchers, bakeries and markets near you from OpenStreetMap (Nominatim, with Overpass as backup, cached per area). Tap a store to see what it sells. Store names and positions are real; products, prices and stock are simulated, and each kind of store sells only its categories (a greengrocer has no coffee). If OpenStreetMap does not answer, clearly labelled demo stores appear around you.
- **Currency by country**: pick any of 34 countries and every price is converted from COP with the day's rate (open.er-api.com, fixed fallback table).
- **Weekly planner** (`/planner`): write what you want to eat ("healthy, little red meat, cheap"); a free AI (Pollinations) returns a 7-day menu and a shopping list made only of products sold nearby, favouring typical dishes of your country. Every nearby store then quotes the basket in parallel (scatter-gather): cheapest complete store, best split across stores, and one tap to buy or move it to your list. If the AI does not answer, a rule-based planner (diet keywords in all five languages) builds the plan.
- **Multi-device by link/QR**: the list and the plan are compressed into the URL fragment (`/share#…`) and shown as a QR code; open it on another device and import it. No server stores anything.
- **Local products**: the 65-product catalog has diet tags (vegan, vegetarian, gluten, protein) and the countries where each product is typical; the home page shows the ones from your area.
- **Catalog** with search (accent-insensitive, in any of the five languages) and categories.
- **Shopping list**: plan, check off what you already have, and move what is missing to the cart.
- **Compare branches**: every branch answers with its own price and stock, each at its own latency.
- **Delivery or pickup**, paid on delivery (demo: nothing is charged).
- **System status** (`/status`): node health, latency, inventory version, requests, failures, a live call log, and controls to make any node slow or bring it down.
- **Account screens (demo, not functional)**: `/login`, `/register` and `/profile` (orders, addresses, preferences and a session replicated across the nodes). Any details "log in" and open the same demo profile.
- **Control views**: a 404 page for unknown routes and a 500 page at `/500`, which also replaces any screen that crashes while rendering.
- **Five languages** (Spanish, English, Portuguese, Polish, Italian), picked automatically from the browser language or, for English browsers, from the visitor's time zone (e.g. Warsaw → Polish); a manual choice is remembered. Prices in Colombian pesos, liquid-glass UI built 100% with Tailwind, mobile-first.

## Simulated distributed system

Everything lives in `src/distributed/`:

| Concept | Where it shows |
| --- | --- |
| **Nodes**: the real stores near you (up to 12) join the cluster, latency grows with distance; the three Bogotá branches are the demo cluster until they load | Map, branch picker, `/status` |
| **Membership change**: when you move, the old nodes leave and the new stores join | `/status` call log |
| **Scatter-gather**: every store quotes the planner's basket in parallel | Planner budget |
| **Network**: every call has latency and can fail (4 % transient failure rate) | "served by" badge, call log |
| **Retries with exponential backoff** and a **circuit breaker** for nodes known to be down | Call log |
| **Heartbeats** refresh each node's latency every 2 s | `/status`, branch picker |
| **Failover reads**: if a branch does not answer, a replica serves its data | Products page ("served by the … replica") |
| **Order saga**: route → reserve stock → register payment → create order → replicate → notify | Live order trace at checkout |
| **Quorum replication**: each order is stored on the primary and its 2 closest replicas (factor 3, quorum 2), with **compensation** (stock is released if quorum fails) | Order confirmation / error |
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

Pushing to `main` deploys on Vercel. `vercel.json` rewrites every route except `/api/*` to `index.html` so deep links such as `/products` work on reload.

### AI proxy

Pollinations rejects anonymous calls made from a browser (it asks for a Turnstile token) but answers server-to-server ones, so the planner calls `/api/ai`, a single Vercel Function (`api/ai.js`) that forwards only the chat messages. In development Vite's proxy does the same (`vite.config.js`). No key is needed; if you create one at enter.pollinations.ai, set `POLLINATIONS_KEY` in the Vercel project and the proxy uses it. The free model takes ~15–30 s and the anonymous tier allows **one reply every ~45 s per IP**, shared by every visitor because all calls leave from the proxy; the planner waits and retries once, and otherwise the rule-based planner answers. For a smoother demo, create a free key and set `POLLINATIONS_KEY`.

### External services (all free, no key)

| Service | Used for |
| --- | --- |
| get.geojs.io | Position from IP |
| api.bigdatacloud.net (client endpoint) | City and country for a point |
| nominatim.openstreetmap.org, Overpass mirrors | Nearby stores |
| tile.openstreetmap.org | Map tiles (Leaflet) |
| open.er-api.com | Exchange rates (cached a day) |
| text.pollinations.ai (via `/api/ai`) | Weekly planner AI |

## Application structure

- `src/distributed/` - simulated cluster (`cluster.js`, dynamic membership), store inventories (`inventory.js`), order saga (`orders.js`), React hooks (`hooks.js`)
- `src/geo/` - location (`location.js`), nearby stores (`stores.js`), currency (`currency.js`) and the region store that ties them together (`region.js`)
- `src/planner/` - AI and rule-based weekly planner, basket pricing
- `src/share/` - list/plan encoding for links and QR codes
- `api/ai.js` - Vercel Function proxying the planner to Pollinations
- `src/data/products.js` - catalog with base prices and icons
- `src/cart/`, `src/list/` - cart and shopping list state (persisted in `localStorage`)
- `src/i18n/` - language detection, formatting, and one message file per language in `locales/`
- `src/ui/` - liquid-glass primitives and shared Tailwind class sets
- `src/components/`, `src/pages/` - layout and routes

## Image credits

`public/images/backdrop-produce.jpg` is StockSnap "Fruit Vegetables" (F8B73CPSBK), CC0 / public domain, found via [Openverse](https://openverse.org).
