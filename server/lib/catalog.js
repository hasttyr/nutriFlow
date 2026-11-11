import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import products from '../../src/data/products.js';
import { METHODS } from '../../src/payments/methods.js';
import { mergeProfile } from '../../src/region/overrides.js';

// The same data files the web app uses: country profiles and price lists (one code base,
// countries as data).
const dir = (path) => fileURLToPath(new URL(path, import.meta.url));
const load = (folder) =>
  Object.fromEntries(
    readdirSync(dir(folder))
      .filter((file) => file.endsWith('.json'))
      .map((file) => [file.replace('.json', ''), JSON.parse(readFileSync(`${dir(folder)}/${file}`, 'utf8'))])
  );

export const PROFILES = load('../../src/region/profiles/');
const PRICES = load('../../src/region/prices/');

export const profileFor = (country, override) => (override ? mergeProfile(PROFILES[country], override) : PROFILES[country]);
export const listPrice = (country, productId) => PRICES[country]?.[productId] ?? null;
export const productById = (id) => products.find((product) => product.id === id);
export const methodById = (id) => METHODS[id];
