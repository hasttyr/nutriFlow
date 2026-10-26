# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Academic evaluators (Práctica IV, SD course) reviewing a working demo store, plus anyone the student shows it to. They browse products, compare calories, build a cart, and walk through checkout to judge that the whole flow works.

## Product Purpose

nutriFlow is a demo grocery marketplace that shows calorie information alongside price at every step: product list, product detail (calories scale with quantity), cart, and checkout totals. Success means the evaluator can complete the full flow without errors and clearly see the calorie tracking.

## Positioning

Calories are a first-class number next to price everywhere, including per-quantity and whole-order totals.

## Capabilities and Constraints

- Routes: `/`, `/products`, `/product/:id`, `/cart`, `/checkout`, 404.
- Shared cart persisted in `localStorage`; prices always come from the catalog.
- Checkout is a demo: no payment is processed and card data is never stored. This must stay visible to users.
- Interface is bilingual (Spanish and English) with a user-facing language toggle.
- Stack: React 19, React Router 8, Vite 8, Tailwind CSS 4 (styling is Tailwind only), Vitest.
- Fully responsive and mobile-first: phones are a primary target (touch targets of at least 44px, safe areas, thumb-reachable navigation).
- Page content and flows stay as they are; visual changes are skin-level unless the user asks otherwise.

## Brand Commitments

- Name: nutriFlow.
- Visual material pinned by the user: "liquid glass" (Apple-style translucent glass), built entirely with Tailwind CSS.

## Evidence on Hand

- Six catalog products with price and calories in `src/data/products.js`.
- Product photography: free-license stock photos stored locally with recorded origin. No real customers, reviews, or sales figures exist; do not invent them.

## Product Principles

1. Calories and price are always shown together and always agree with the cart totals.
2. The demo must be honest: no fake claims, no implied real payments.
3. Every flow works in both languages.
