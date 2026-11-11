import { roundPrice } from './money.js';

// Store prices, shared by the browser and the regional servers (explicit .js imports so Node
// can load this file as is). The server recomputes every order total with these rules and never
// trusts amounts sent by a client.

// Deterministic pseudo-random numbers from a seed: the same store always gets the same values.
export const seeded = (seed) => {
  let value = 0;
  for (const char of String(seed)) value = (value * 31 + char.charCodeAt(0)) >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 2 ** 32;
  };
};

// The demo branches have fixed factors (tests rely on them); every other store gets its own.
const DEMO_PRICE_FACTOR = { chapinero: 1.05, usaquen: 1.08, kennedy: 0.96 };
export const storeFactor = (nodeId) => DEMO_PRICE_FACTOR[nodeId] ?? 0.9 + seeded(`${nodeId}#price`)() * 0.25;

// A product's price at one store: the country's list price, the store factor, local endings.
export const storePrice = (listPrice, nodeId, pricing) => roundPrice(listPrice * storeFactor(nodeId), pricing);
