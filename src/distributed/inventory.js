import products from '../data/products';
import { NODES, markWrite, readWithFailover, rpcWithRetry } from './cluster';

// Each branch prices and stocks the catalog on its own; these seeds make the differences visible.
const PRICE_FACTOR = { chapinero: 1.05, usaquen: 1.08, kennedy: 0.96 };
const OUT_OF_STOCK = { chapinero: [13], usaquen: [4, 11], kennedy: [8, 17] };
const LOW_STOCK = { chapinero: [2, 16], usaquen: [7], kennedy: [1] };
export const LOW_STOCK_THRESHOLD = 5;

const seedStock = () =>
  Object.fromEntries(
    NODES.map((node, index) => [
      node.id,
      Object.fromEntries(
        products.map((product) => {
          if (OUT_OF_STOCK[node.id].includes(product.id)) return [product.id, 0];
          if (LOW_STOCK[node.id].includes(product.id)) return [product.id, 3];
          return [product.id, 10 + ((product.id * 7 + index * 11) % 35)];
        })
      )
    ])
  );

let stock = seedStock();

export const resetInventory = () => {
  stock = seedStock();
};

export class OutOfStockError extends Error {
  constructor(nodeId, missing) {
    super(`Not enough stock at ${nodeId}`);
    this.nodeId = nodeId;
    this.missing = missing;
  }
}

export const priceAt = (nodeId, product) => Math.round((product.basePrice * PRICE_FACTOR[nodeId]) / 100) * 100;

export const stockAt = (nodeId, productId) => stock[nodeId][productId];

export const missingAt = (nodeId, items) => items.filter((item) => stockAt(nodeId, item.id) < item.quantity).map((item) => item.id);

// The branch's catalog view. Every node replicates every branch's inventory, so if the branch
// does not answer, a replica serves the same data.
export const fetchCatalog = (nodeId) =>
  readWithFailover(nodeId, 'inventory', 'list', () =>
    products.map((product) => ({ product, price: priceAt(nodeId, product), stock: stockAt(nodeId, product.id) }))
  );

// Asks every branch for its own offer on one product; each answer arrives on its own schedule.
export const fetchOffers = (product, onOffer) =>
  Promise.all(
    NODES.map(async (node) => {
      try {
        const { ms } = await rpcWithRetry(node.id, 'inventory', `get #${product.id}`, () => null, 1);
        onOffer(node.id, { price: priceAt(node.id, product), stock: stockAt(node.id, product.id), ms });
      } catch {
        onOffer(node.id, { error: true });
      }
    })
  );

export const reserveAt = (nodeId, items) =>
  rpcWithRetry(nodeId, 'inventory', 'reserve', () => {
    const missing = missingAt(nodeId, items);
    if (missing.length) throw new OutOfStockError(nodeId, missing);
    stock = { ...stock, [nodeId]: { ...stock[nodeId] } };
    items.forEach((item) => {
      stock[nodeId][item.id] -= item.quantity;
    });
    markWrite(nodeId);
    return items.length;
  });

// Saga compensation: give reserved units back when a later step fails.
export const releaseAt = (nodeId, items) =>
  rpcWithRetry(nodeId, 'inventory', 'release', () => {
    stock = { ...stock, [nodeId]: { ...stock[nodeId] } };
    items.forEach((item) => {
      stock[nodeId][item.id] += item.quantity;
    });
    markWrite(nodeId);
    return items.length;
  });
