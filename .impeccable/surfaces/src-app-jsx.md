---
version: 1
slug: "src-app-jsx"
primary_target: "src/App.jsx"
related_targets: ["src/pages/HomePage.jsx","src/pages/ProductList.jsx","src/pages/ProductDetail.jsx","src/pages/Cart.jsx","src/pages/Checkout.jsx","src/components/Header.jsx"]
---

Scope: whole app shell and all routes (home, products, product detail, cart, checkout, 404). Visitor mode: Operate (home hero is light Persuade inside the same shell).

Audience and job: academic evaluator walking the full shopping flow and checking that calories and price agree everywhere, in Spanish or English.

Constraints: page structure stays as today (user chose "skin only"); styling 100% Tailwind; demo checkout must say no payment is processed; product photos come last (user-ordered), sourced CC0 and stored locally.

## Direction contract

THESIS: nutriFlow as liquid glass laid over a fresh-produce market: every surface is clear glass that bends the colour behind it, and calories glow citrus beside price. Refuses the category default of flat white cards on a pastel ground.

OWN-WORLD: Ground is a full-bleed produce scene (citrus, leaf, berry) washed with soft light. Glass: white 35–65% fill, heavy backdrop blur with boosted saturation, bright top specular rim, darker lower edge, soft offset shadow. Ink is green-black; citrus orange marks calories, focus and active state; primary actions are dark ink glass with white text. System UI type (SF on Apple), tight heading tracking, tabular numerals for money and kcal. Lucide icons, one stroke weight.

STORY: the visitor sees products with price and kcal, adds to cart, watches price and calorie totals agree, checks out with an honest demo notice, and can switch ES/EN anywhere.

FIRST VIEWPORT: floating glass capsule navigation (wordmark, links, ES/EN segmented toggle, cart with citrus badge); home hero heading centred over the produce ground with an ink-glass primary button and a clear-glass secondary; every other route keeps its current layout re-cut in glass.

FORM: user-pinned Apple-style Liquid Glass on the existing structure; signature move: specular light that follows the pointer across glass panels (off under reduced motion). seed: none (direction pinned by user; no roll).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
