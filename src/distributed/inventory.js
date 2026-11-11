import products from '../data/products';
import { activeProfile } from '../geo/region';
import { seeded } from '../geo/stores';
import { roundPrice } from '../region/money';
import { listPrice } from '../region/profiles';
import { NODES, getNode, markWrite, readWithFailover, rpcWithRetry } from './cluster';

// Each branch prices and stocks the catalog on its own. The demo branches use fixed seeds (tests
// rely on them); real nearby stores get a deterministic assortment from their id and kind, so the
// same store always shows the same products, and a greengrocer never sells coffee.
const DEMO_PRICE_FACTOR = { chapinero: 1.05, usaquen: 1.08, kennedy: 0.96 };
const OUT_OF_STOCK = { chapinero: [13], usaquen: [4, 11], kennedy: [8, 17] };
const LOW_STOCK = { chapinero: [2, 16], usaquen: [7], kennedy: [1] };
export const LOW_STOCK_THRESHOLD = 5;

const demoIndex = (nodeId) => Object.keys(DEMO_PRICE_FACTOR).indexOf(nodeId);

// Whether the store sells this product's category at all.
export const carries = (nodeId, product) => {
  const categories = getNode(nodeId).categories;
  return !categories || categories.includes(product.category);
};

const seedNode = (nodeId) => {
  const index = demoIndex(nodeId);
  if (index >= 0) {
    return Object.fromEntries(
      products.map((product) => {
        if (OUT_OF_STOCK[nodeId].includes(product.id)) return [product.id, 0];
        if (LOW_STOCK[nodeId].includes(product.id)) return [product.id, 3];
        return [product.id, 10 + ((product.id * 7 + index * 11) % 35)];
      })
    );
  }
  const random = seeded(nodeId);
  return Object.fromEntries(
    products.map((product) => {
      if (!carries(nodeId, product)) return [product.id, 0];
      const roll = random();
      if (roll < 0.08) return [product.id, 0];
      if (roll < 0.16) return [product.id, 2 + Math.floor(random() * 3)];
      return [product.id, 8 + Math.floor(random() * 40)];
    })
  );
};

let stock = {};

const stockOf = (nodeId) => {
  if (!stock[nodeId]) stock = { ...stock, [nodeId]: seedNode(nodeId) };
  return stock[nodeId];
};

export const resetInventory = () => {
  stock = {};
};

export class OutOfStockError extends Error {
  constructor(nodeId, missing) {
    super(`Not enough stock at ${nodeId}`);
    this.nodeId = nodeId;
    this.missing = missing;
  }
}

const priceFactor = (nodeId) => DEMO_PRICE_FACTOR[nodeId] ?? 0.9 + seeded(`${nodeId}#price`)() * 0.25;

// The country's list price (minor units) with the store's own factor, rounded to local price endings.
export const priceAt = (nodeId, product) => {
  const profile = activeProfile();
  if (!profile) return 0;
  return roundPrice(listPrice(profile.country, product.id) * priceFactor(nodeId), profile.pricing);
};

export const stockAt = (nodeId, productId) => stockOf(nodeId)[productId] ?? 0;

export const missingAt = (nodeId, items) => items.filter((item) => stockAt(nodeId, item.id) < item.quantity).map((item) => item.id);

// The products a store lists right now (its kind decides the categories).
export const catalogAt = (nodeId) =>
  products.filter((product) => carries(nodeId, product)).map((product) => ({ product, price: priceAt(nodeId, product), stock: stockAt(nodeId, product.id) }));

// The branch's catalog view. Every node replicates every branch's inventory, so if the branch
// does not answer, a replica serves the same data.
export const fetchCatalog = (nodeId) => readWithFailover(nodeId, 'inventory', 'list', () => catalogAt(nodeId));

// Asks every branch for its own offer on one product; each answer arrives on its own schedule.
export const fetchOffers = (product, onOffer) =>
  Promise.all(
    NODES.map(async (node) => {
      try {
        const { ms } = await rpcWithRetry(node.id, 'inventory', `get #${product.id}`, () => null, 1);
        onOffer(node.id, { price: priceAt(node.id, product), stock: stockAt(node.id, product.id), ms, carried: carries(node.id, product) });
      } catch {
        onOffer(node.id, { error: true });
      }
    })
  );

// Scatter-gather: every store quotes a whole basket in parallel. Stores that do not answer are
// reported as such; the rest say what the basket costs there and what they are missing.
export const quoteBasket = (items) =>
  Promise.all(
    NODES.map(async (node) => {
      try {
        const { value, ms } = await rpcWithRetry(node.id, 'inventory', `quote ${items.length} items`, () => {
          const missing = missingAt(node.id, items);
          const total = items
            .filter((item) => !missing.includes(item.id))
            .reduce((sum, item) => sum + priceAt(node.id, products.find((product) => product.id === item.id)) * item.quantity, 0);
          return { missing, total };
        }, 1);
        return { nodeId: node.id, ms, ...value };
      } catch {
        return { nodeId: node.id, error: true };
      }
    })
  );

export const reserveAt = (nodeId, items) =>
  rpcWithRetry(nodeId, 'inventory', 'reserve', () => {
    const missing = missingAt(nodeId, items);
    if (missing.length) throw new OutOfStockError(nodeId, missing);
    const next = { ...stockOf(nodeId) };
    items.forEach((item) => {
      next[item.id] -= item.quantity;
    });
    stock = { ...stock, [nodeId]: next };
    markWrite(nodeId);
    return items.length;
  });

// Saga compensation: give reserved units back when a later step fails.
export const releaseAt = (nodeId, items) =>
  rpcWithRetry(nodeId, 'inventory', 'release', () => {
    const next = { ...stockOf(nodeId) };
    items.forEach((item) => {
      next[item.id] += item.quantity;
    });
    stock = { ...stock, [nodeId]: next };
    markWrite(nodeId);
    return items.length;
  });
