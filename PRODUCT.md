# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Academic evaluators of the Práctica IV project in the SD (Sistemas Distribuidos) course, plus anyone the student shows it to. They plan a grocery run, compare branches, build a cart, and check out, while judging whether the app behaves like a distributed system.

## Product Purpose

nutriFlow helps people do their groceries ("hacer mercado") in Bogotá: build a shopping list, compare price and stock across branches, and get delivery or pick up at a branch. Success means the evaluator completes the flow and clearly sees distributed-systems behaviour: branch nodes, replicas, latency, failover, quorum replication and saga compensation.

## Positioning

Every branch is a visible node with its own inventory replica; the shopper sees which node answered, and the order's path across the cluster.

## Capabilities and Constraints

- Routes: `/`, `/map`, `/planner`, `/share`, `/products`, `/product/:id`, `/list`, `/cart`, `/checkout`, `/status`, `/login`, `/register`, `/profile`, `/500`, 404.
- Location from the most precise source available (GPS → IP → time zone → manual pick on the map). Nearby stores are real (OpenStreetMap); their products, prices and stock are simulated, and the UI says so.
- Currency follows the selected country; catalog prices are stored in COP and converted with live rates.
- Weekly planner: free AI (Pollinations via the `api/ai.js` proxy) with a rule-based fallback; it is not medical or nutrition advice.
- Multi-device through share links and QR codes (data in the URL fragment), no sync server.
- The distributed backend is simulated in the browser (`src/distributed/`), never a real server. It must look and behave distributed; it must also say plainly that it is a simulation.
- Nodes are the nearby stores (up to 12; the three Bogotá branches are the demo cluster before they load) with per-store prices and stock; nodes can be set to normal, slow or down from `/status`.
- Prices stored in Colombian pesos (COP), VAT included, shown in the selected country's currency; delivery fee COP 5.900, free from COP 90.000.
- Payment is on delivery and only registered; nothing is charged and nothing is delivered. This must stay visible to users.
- Five languages (Spanish, English, Portuguese, Polish, Italian), detected from browser language and location, with a user-facing picker.
- Fully responsive and mobile-first: touch targets of at least 44px, safe areas, thumb-reachable navigation.
- Stack: React 19, React Router 8, Vite 8, Tailwind CSS 4 (styling is Tailwind only), Vitest. Deployed on Vercel from `main`.

## Brand Commitments

- Name: nutriFlow.
- Visual material pinned by the user: "liquid glass" (Apple-style translucent glass), built entirely with Tailwind CSS.
- Products are shown with line icons on category-tinted tiles, not photos.

## Evidence on Hand

- Eighteen catalog products with base prices in `src/data/products.js`; the backdrop photo is CC0 (see README).
- No real customers, reviews, sales figures or delivery times exist; delivery estimates are labelled as demo estimates.

## Product Principles

1. The distributed behaviour is shown, not claimed: every claim on screen comes from the simulation's real state.
2. The demo is honest: it says it is a simulation and never implies real payments or deliveries.
3. Every flow works in every language and on a phone.
