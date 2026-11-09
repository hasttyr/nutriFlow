import { afterEach, describe, expect, it, vi } from 'vitest';
import products, { getProductById, isVegan } from '../data/products';
import { DEMO_NODES, getClusterState, getNode, setNodes } from '../distributed/cluster';
import { carries, catalogAt, priceAt, quoteBasket, stockAt } from '../distributed/inventory';
import { placeOrder } from '../distributed/orders';
import { createTranslator } from '../i18n/i18n';
import { detectDiet, priceBasket, rulePlan, sanitizePlan } from '../planner/planner';
import { decodeShare, encodeShare } from '../share/share';
import { currencyFor } from './currency';
import { distanceMeters } from './location';
import { toNode } from './region';
import { findStores, kindOf, syntheticStores } from './stores';

const origin = { lat: 4.6486, lon: -74.0628 };
const store = (id, kind, meters) => ({ id, name: `Store ${id}`, kind, lat: origin.lat + meters / 111320, lon: origin.lon, distance: meters, real: true });
const nearby = () => [store('osm-n1', 'supermarket', 120), store('osm-n2', 'greengrocer', 300), store('osm-n3', 'butcher', 450), store('osm-n4', 'supermarket', 900)].map(toNode);
const localize = (record) => record.en;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('nearby stores as cluster nodes', () => {
  it('replaces the demo branches and keeps the closest store active', () => {
    setNodes(nearby());
    const state = getClusterState();
    expect(Object.keys(state.nodes)).toEqual(['osm-n1', 'osm-n2', 'osm-n3', 'osm-n4']);
    expect(state.activeNodeId).toBe('osm-n1');
    expect(state.members).toBe('stores');
    expect(getNode('osm-n2').zone.es).toBe('Fruver / verdulería · 300 m');
    expect(getNode('chapinero').name).toBe('chapinero');
  });

  it('gives each kind of store its own assortment', () => {
    setNodes(nearby());
    const greengrocer = catalogAt('osm-n2');
    expect(greengrocer.length).toBeGreaterThan(5);
    expect(greengrocer.every(({ product }) => product.category === 'produce')).toBe(true);
    expect(carries('osm-n3', getProductById(31))).toBe(true);
    expect(carries('osm-n3', getProductById(13))).toBe(false);
    expect(stockAt('osm-n3', 13)).toBe(0);
    expect(priceAt('osm-n1', getProductById(1))).toBe(priceAt('osm-n1', getProductById(1)));
  });

  it('replicates orders to the two closest replicas only', async () => {
    setNodes(nearby());
    const product = catalogAt('osm-n1').find((offer) => offer.stock > 2).product;
    const order = await placeOrder({ items: [{ id: product.id, quantity: 1 }], fulfillment: 'delivery', nodeId: 'osm-n1' });
    expect(order.copies).toBe(3);
    expect(order.trace.filter((step) => step.service === 'replication')).toHaveLength(2);
  });

  it('quotes a basket on every store in parallel', async () => {
    setNodes(nearby());
    const quotes = await quoteBasket([{ id: 31, quantity: 1 }]);
    expect(quotes).toHaveLength(4);
    expect(quotes.find((quote) => quote.nodeId === 'osm-n2').missing).toEqual([31]);
  });

  it('labels store kinds from OpenStreetMap tags', () => {
    expect(kindOf({ shop: 'supermarket' })).toBe('supermarket');
    expect(kindOf({ shop: 'grocery' })).toBe('convenience');
    expect(kindOf({ amenity: 'marketplace' })).toBe('marketplace');
    expect(kindOf({ shop: 'florist' })).toBe('convenience');
  });

  it('falls back to deterministic demo stores when OpenStreetMap does not answer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    vi.useFakeTimers();
    const pending = findStores(origin);
    await vi.runAllTimersAsync();
    const { stores, source } = await pending;
    vi.useRealTimers();
    expect(source).toBe('synthetic');
    expect(stores).toEqual(syntheticStores(origin));
    expect(stores.every((entry) => entry.distance < 2000)).toBe(true);
  });

  it('measures distances in meters', () => {
    expect(distanceMeters(origin, { lat: origin.lat + 0.01, lon: origin.lon })).toBeCloseTo(1112, -1);
  });

  it('starts from the demo branches', () => {
    expect(DEMO_NODES.map((node) => node.id)).toEqual(['chapinero', 'usaquen', 'kennedy']);
  });
});

describe('currency', () => {
  it('maps countries to currencies and converts COP prices', () => {
    expect(currencyFor('PL')).toBe('PLN');
    expect(currencyFor('BR')).toBe('BRL');
    expect(currencyFor('ZZ')).toBe('USD');
    expect(createTranslator('en', { currency: 'USD', rate: 0.00025 }).formatPrice(20000)).toBe('$5.00');
    expect(createTranslator('es', { currency: 'CLP', rate: 0.24 }).formatPrice(10000)).toMatch(/2\.400/);
  });
});

describe('weekly planner', () => {
  it('detects diets in several languages', () => {
    expect(detectDiet('Quiero comer vegano y barato')).toMatchObject({ vegan: true, vegetarian: true, cheap: true });
    expect(detectDiet('bez glutenu, dużo białka')).toMatchObject({ glutenFree: true, protein: true });
  });

  it('builds a 7-day rule-based plan with only products sold nearby', () => {
    const plan = rulePlan('vegano', { localize, country: 'CO' });
    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].breakfast).toBeTruthy();
    expect(plan.items.length).toBeGreaterThan(5);
    expect(plan.items.every((item) => isVegan(getProductById(item.id)))).toBe(true);
  });

  it('accepts the compact AI format and drops unknown products', () => {
    const raw = {
      summary: 'Ok',
      days: Array.from({ length: 7 }, () => ['Avena', 'Arroz con pollo', 'Sopa']),
      items: [[31, 2], [999, 1], [46, 50]]
    };
    const plan = sanitizePlan(raw, new Set([31, 46]), 1);
    expect(plan.days[1]).toEqual({ breakfast: 'Avena', lunch: 'Arroz con pollo', dinner: 'Sopa' });
    expect(plan.items).toEqual([{ id: 31, quantity: 2 }, { id: 46, quantity: 6 }]);
    expect(() => sanitizePlan({ days: [] }, new Set(), 1)).toThrow();
  });

  it('finds the cheapest store for the basket', async () => {
    const { best, quotes } = await priceBasket([{ id: 1, quantity: 1 }, { id: 4, quantity: 1 }]);
    expect(quotes).toHaveLength(3);
    expect(best.nodeId).toBe('kennedy');
  });
});

describe('sharing between devices', () => {
  it('round-trips a list and a plan through the link', async () => {
    const plan = { summary: 'Semana', source: 'ai', days: Array.from({ length: 7 }, (_, day) => ({ breakfast: `B${day}`, lunch: 'L', dinner: 'D' })) };
    const code = await encodeShare({ items: [{ id: 1, quantity: 2 }, { id: 46, quantity: 1 }], plan });
    const decoded = await decodeShare(code);
    expect(decoded.items).toEqual([{ id: 1, quantity: 2 }, { id: 46, quantity: 1 }]);
    expect(decoded.plan.days[3].breakfast).toBe('B3');
    expect(decoded.plan.summary).toBe('Semana');
  });

  it('rejects damaged links', async () => {
    await expect(decodeShare('zgarbage')).rejects.toThrow();
  });
});

describe('catalog', () => {
  it('tags every product and gives local products to several countries', () => {
    expect(products.length).toBe(65);
    expect(products.every((product) => Array.isArray(product.tags) && Array.isArray(product.local))).toBe(true);
    expect(products.some((product) => product.local.includes('PL'))).toBe(true);
    expect(products.some((product) => product.local.includes('IT'))).toBe(true);
  });
});
