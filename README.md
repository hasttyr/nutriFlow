# nutriFlow

nutriFlow helps you do your groceries ("hacer mercado") wherever you are: it finds the real stores around you, plans your week's meals with a free AI, builds the shopping list, and tells you which nearby store is cheapest. It is the Práctica IV project for the Distributed Systems (SD) course, so the app **looks and behaves like a distributed system**: every nearby store is a node of a cluster simulated in the browser. There is no backend of our own (only a one-file proxy for the AI, see below).

## Features

- **Location, most precise method first**: device GPS (with permission) → IP lookup → time zone → a point picked on the map. City and country come from reverse geocoding.
- **Store map** (`/map`): real supermarkets, greengrocers, butchers, bakeries and markets near you from OpenStreetMap (Nominatim, with Overpass as backup, cached per area). Tap a store to see what it sells. Store names and positions are real; products, prices and stock are simulated, and each kind of store sells only its categories (a greengrocer has no coffee). If OpenStreetMap does not answer, clearly labelled demo stores appear around you.
- **Five countries, configured as data** (Colombia, Brazil, United States, France, Japan): each one is a `RegionProfile` JSON in `src/region/profiles/` (language, CLDR locale, currency and its decimals, time zone, 12/24 h clock, phone and postal-code formats, name order, delivery fee, tax, tip, receipt type, fiscal IDs, payment methods, data-protection law) plus its own price list in `src/region/prices/`. There are no per-country branches in the code: adding a sixth country means adding those two files.
- **Money as integers**: every amount is an integer in the minor unit of the local currency (centavos, cents, yen). COP and JPY are quoted without decimals, so their minor unit is the whole peso or yen. Intl (CLDR) formats them per country: `$ 25.900`, `R$ 25,90`, `$25.90`, `25,90 €`, `￥2,590`.
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
- **Five languages** (Spanish, Portuguese, English, French, Japanese), one JSON resource catalog per language in `src/i18n/locales/` with stable keys and English fallback. The language follows the country; a language picked by hand is remembered for that country. Numbers, money, dates and times always follow the country's profile. Japanese uses CJK fonts and strict line breaking. Liquid-glass UI built 100% with Tailwind, mobile-first.

## The four apps, live

The platform serves four actors, each with its own app. Sign in at `/login` and pick the role; every browser tab keeps its own session, so the four apps can run side by side:

| Route | Actor | What it does |
| --- | --- | --- |
| `/checkout` → `/orders/:id` | Customer | Order, then follow it live: map with store, courier and door; timeline in local time; cancel with refund; rate store and courier; the country's receipt |
| `/merchant` | Store | Incoming orders by stage: accept or reject, mark ready, hand over pickups |
| `/courier` | Courier | Go online/offline, pick up and deliver; the fleet with each courier's load |
| `/admin` | Admin | Sales per country consolidated in USD (exchange rates with source and date), platform revenue, regional profiles editable as data (tax rates, delivery fee, tip, commission), monitoring and an autopilot |
| `/notifications` | Everyone | Each actor's inbox, in their language and time zone |

**How the tabs talk:** the shared state (`src/live/store.js`) lives in `localStorage`, every tab hears the others' writes through the `storage` event, and writes are serialised across tabs with the Web Locks API (a real mutex between processes). Couriers are assigned by proximity and availability with load balancing (`pickCourier`: distance × (1 + deliveries in progress), at most 2 at a time). The autopilot runs only in the tab that holds the leader lock; when that tab closes, the next one in line takes over (leader election with failover).

Demo: open `/orders/<id>` in one tab, `/merchant` and `/courier` in two others, and watch the order move; or turn on the autopilot in `/admin`.

## Backend (live mode)

The same web app runs against real regional servers. Two terminals:

```bash
npm run backend      # broker + 5 regional APIs (+ Colombia's replica) + payments, logistics, notifications
npm run dev:live     # the web app talking to them (http://localhost:5173)
```

No Docker needed for development: every subsystem is a Node process on this machine, with SQLite built into Node. For the delivery, `docker compose up --build` runs the same processes as containers (one image, one container per process, one volume per region) and serves the web app on http://localhost:4173.

| Process | Port | Role |
| --- | --- | --- |
| `broker` | tcp/1883 (MQTT) | Middleware: publish/subscribe, persistent queues (QoS 1), retained state, Last Will |
| `co-1` `br-1` `us-1` `fr-1` `jp-1` | http/4101–4105 | Regional API, one per country, same code (`REGION=…`); owns its country's orders in its own SQLite file |
| `co-2` | http/4111 | Replica of Colombia on the same data; the web app fails over to it |
| `payments` | — | Payment gateway mock: idempotent charges and refunds |
| `logistics` | — | Courier fleet, assignment by proximity/availability/load, live positions (QoS 0, once a second) |
| `notifications` | — | One message per actor and step, rendered by each app in its own language and time zone |

`server/directory.json` is the naming service (country → region URLs, primary first, then replicas). Order rules (`src/live/rules.js`), prices (`src/region/pricing.js`, `money.js`) and the country data are the same files the browser uses: one code base.

**How a command travels:** the browser sends it by HTTP to its country's region (`POST /orders/:id/accept`, with a signed role token); the region applies the rule in an ACID transaction on its SQLite file, publishes the change on the broker, and every interested process reacts (payments charges, logistics assigns, notifications writes). Each region pushes its live state back to the browsers with Server-Sent Events. Prices and totals are always recomputed by the region, never taken from the browser, and cards never leave the browser (the gateway gets a token).

**Breaking it on purpose** (type in the `npm run backend` terminal): `ps`, `stop payments` / `start payments` (payments wait in the broker and go through when it is back), `stop co-1` (the replica takes over), `stop logistics` (orders wait for a courier and get one when it returns). The admin console's Monitoring tab shows each process going down and up. `npm run test:backend` runs these failure scenarios automatically against the real processes.

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
| text.pollinations.ai (via `/api/ai`) | Weekly planner AI |

## Application structure

- `src/distributed/` - simulated cluster (`cluster.js`, dynamic membership), store inventories (`inventory.js`), order saga (`orders.js`), React hooks (`hooks.js`)
- `src/region/` - RegionProfiles (`profiles/*.json`), price lists (`prices/*.json`), the loader (`profiles.js`) and integer money helpers (`money.js`)
- `src/geo/` - location (`location.js`), nearby stores (`stores.js`) and the region store that ties them together (`region.js`)
- `src/planner/` - AI and rule-based weekly planner, basket pricing
- `src/share/` - list/plan encoding for links and QR codes
- `api/ai.js` - Vercel Function proxying the planner to Pollinations
- `src/data/products.js` - catalog with base prices and icons
- `src/cart/`, `src/list/` - cart and shopping list state (persisted in `localStorage`)
- `src/i18n/` - translator and formatting (`i18n.js`), and one JSON catalog per language in `locales/`
- `src/ui/` - liquid-glass primitives and shared Tailwind class sets
- `src/components/`, `src/pages/` - layout and routes

## Image credits

`public/images/backdrop-produce.jpg` is StockSnap "Fruit Vegetables" (F8B73CPSBK), CC0 / public domain, found via [Openverse](https://openverse.org).
