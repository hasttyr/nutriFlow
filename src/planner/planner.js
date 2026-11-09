import { getProductById, isGlutenFree, isLocalTo, isVegan, isVegetarian } from '../data/products';
import { NODES, isOnline } from '../distributed/cluster';
import { catalogAt, priceAt, quoteBasket, stockAt } from '../distributed/inventory';

// Weekly planner: free text ("light dinners, little meat, cheap") → a 7-day menu and a shopping
// list made only of products that the stores around the shopper actually carry, priced per store.

export const MEALS = ['breakfast', 'lunch', 'dinner'];
// Same-origin proxy (api/ai.js on Vercel, Vite's proxy in development).
const AI_URL = '/api/ai';
const STORAGE_KEY = 'nutriflow/plan';

const LANGUAGE_NAMES = { es: 'Spanish', en: 'English', pt: 'Portuguese', pl: 'Polish', it: 'Italian' };

// Products sold (and in stock) by at least one online store of the current cluster.
export const availableProducts = () => {
  const seen = new Map();
  NODES.filter((node) => isOnline(node.id)).forEach((node) => {
    catalogAt(node.id).forEach(({ product, price, stock }) => {
      if (stock <= 0) return;
      const known = seen.get(product.id);
      if (!known || price < known.price) seen.set(product.id, { product, price });
    });
  });
  return [...seen.values()];
};

// Diet hints in the five languages, used to filter the catalog before asking anyone.
const KEYWORDS = {
  vegan: ['vegan', 'vegano', 'vegana', 'wegan', 'wegańsk', 'vegetalian'],
  vegetarian: ['vegetarian', 'vegetarian', 'vegetarian', 'wegetaria', 'vegetarian', 'sin carne', 'no meat', 'sem carne', 'bez mięsa', 'senza carne', 'vegetariano', 'vegetariana'],
  glutenFree: ['gluten', 'celiac', 'celiaco', 'celíac', 'bezglut', 'senza glutine', 'sem glúten', 'sin gluten'],
  protein: ['protein', 'proteína', 'proteina', 'białk', 'gym', 'músculo', 'muscle', 'keto', 'low carb', 'bajo en carb'],
  cheap: ['barat', 'cheap', 'económic', 'economic', 'presupuesto', 'budget', 'tani', 'tanio', 'economico', 'poco dinero']
};

const fold = (text) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export const detectDiet = (text) => {
  const folded = fold(text);
  const has = (key) => KEYWORDS[key].some((word) => folded.includes(fold(word)));
  const diet = { vegan: has('vegan'), vegetarian: has('vegetarian'), glutenFree: has('glutenFree'), protein: has('protein'), cheap: has('cheap') };
  if (diet.vegan) diet.vegetarian = true;
  return diet;
};

const fits = (product, diet) =>
  (!diet.vegan || isVegan(product)) && (!diet.vegetarian || isVegetarian(product)) && (!diet.glutenFree || isGlutenFree(product));

// ---------- Rule-based planner (works offline, used when the AI does not answer) ----------

const rotate = (items, offset) => (items.length ? items[offset % items.length] : null);

export const rulePlan = (text, { localize, country, people = 1 }) => {
  const diet = detectDiet(text);
  const pool = availableProducts().filter(({ product }) => fits(product, diet));
  const byCheap = (a, b) => a.price - b.price;
  const sortFor = (list) => {
    const local = list.filter(({ product }) => isLocalTo(product, country));
    const rest = list.filter(({ product }) => !isLocalTo(product, country));
    return diet.cheap ? [...local.sort(byCheap), ...rest.sort(byCheap)] : [...local, ...rest];
  };
  const tagged = (tag) => sortFor(pool.filter(({ product }) => product.tags.includes(tag))).map(({ product }) => product);
  const breakfast = tagged('breakfast').filter((product) => !product.tags.includes('fruit'));
  const protein = tagged('protein');
  const carbs = tagged('carb');
  const veg = tagged('veg');
  const fruit = tagged('fruit');

  const used = new Map();
  const use = (product, amount = 1) => {
    if (product) used.set(product.id, (used.get(product.id) ?? 0) + amount);
    return product ? localize(product.name) : null;
  };
  const dish = (...parts) => [...new Set(parts.filter(Boolean))].join(' + ');

  const days = Array.from({ length: 7 }, (_, day) => ({
    breakfast: dish(use(rotate(breakfast, day), 0.4), use(rotate(fruit, day), 0.3)),
    lunch: dish(use(rotate(protein, day), 0.5), use(rotate(carbs, day), 0.4), use(rotate(veg, day), 0.4)),
    dinner: dish(use(rotate(protein, day + 3), 0.4), use(rotate(veg, day + 2), 0.3), use(rotate(carbs, day + 5), 0.3))
  }));

  const items = [...used.entries()].map(([id, amount]) => ({ id, quantity: Math.max(1, Math.ceil(amount * people)) }));
  return { source: 'rules', diet, summary: null, days, items };
};

// ---------- AI planner (Pollinations: free, no key, called from the browser) ----------

// The free model is a small reasoning model with an output budget: a short prompt and a compact
// answer format (arrays instead of objects) keep it fast (~15 s) and inside its token limit.
const buildPrompt = ({ text, locale, country, people, pool }) => {
  const catalog = pool.map(({ product }) => `${product.id} ${product.name.en} (${product.unit.en})`).join('; ');
  return [
    `Grocery meal planner. Country: ${country}. The shopper wrote: "${text.slice(0, 600)}".`,
    `Plan 7 days for ${people} person(s), favouring typical dishes of ${country}, using ONLY these catalog products (id name): ${catalog}`,
    'The shopping list must have at most 25 products, only those the meals use, with realistic quantities in units of each product pack (e.g. 1 tray of 30 eggs lasts a week).',
    `Reply with compact JSON only, in ${LANGUAGE_NAMES[locale]}, each meal under 8 words:`,
    '{"summary":"one sentence","days":[["breakfast","lunch","dinner"], ...exactly 7],"items":[[id, units for the whole week], ...]}'
  ].join('\n');
};

const extractJson = (content) => {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON');
  return JSON.parse(content.slice(start, end + 1));
};

// Keeps only what makes sense: 7 days of strings and items that exist and are sold nearby.
export const sanitizePlan = (raw, allowedIds, people = 1) => {
  const days = Array.isArray(raw?.days) ? raw.days.slice(0, 7) : [];
  if (days.length < 7) throw new Error('Incomplete plan');
  const clean = (value) => (typeof value === 'string' ? value.trim().slice(0, 140) : '');
  const merged = new Map();
  (Array.isArray(raw.items) ? raw.items : []).forEach((entry) => {
    // Items come as [id, quantity] (compact format) or { id, quantity }.
    const [rawId, rawQuantity] = Array.isArray(entry) ? entry : [entry?.id, entry?.quantity];
    const id = Number(rawId);
    const quantity = Math.min(Math.max(Math.round(Number(rawQuantity) || 1), 1), 6 * people);
    if (allowedIds.has(id) && getProductById(id)) merged.set(id, (merged.get(id) ?? 0) + quantity);
  });
  if (merged.size === 0) throw new Error('No items');
  return {
    summary: clean(raw.summary) || null,
    days: days.map((day) => Object.fromEntries(MEALS.map((meal, index) => [meal, clean(Array.isArray(day) ? day[index] : day?.[meal])]))),
    items: [...merged.entries()].slice(0, 30).map(([id, quantity]) => ({ id, quantity }))
  };
};

export const aiPlan = async ({ text, locale, country, people = 1, signal }) => {
  const diet = detectDiet(text);
  const pool = availableProducts().filter(({ product }) => fits(product, diet));
  const response = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai-fast',
      reasoning_effort: 'low',
      max_tokens: 4000,
      messages: [{ role: 'user', content: buildPrompt({ text, locale, country, people, pool }) }]
    }),
    signal: AbortSignal.any([signal ?? new AbortController().signal, AbortSignal.timeout(75000)])
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content ?? '';
  const plan = sanitizePlan(extractJson(content), new Set(pool.map(({ product }) => product.id)), people);
  return { source: 'ai', diet, ...plan };
};

// AI first; on any failure (offline, rate limit, bad JSON) the rule-based planner answers.
export const makePlan = async (options) => {
  try {
    return await aiPlan(options);
  } catch (error) {
    if (options.signal?.aborted) throw error;
    return { ...rulePlan(options.text, options), aiError: true };
  }
};

// ---------- Basket: where is it cheapest? ----------

// Every store quotes the basket in parallel; the best complete store wins, and a split
// (each item at its cheapest store) is offered as the lower bound.
export const priceBasket = async (items) => {
  const quotes = await quoteBasket(items);
  const answered = quotes.filter((quote) => !quote.error);
  const complete = answered.filter((quote) => quote.missing.length === 0).sort((a, b) => a.total - b.total);
  const partial = answered
    .filter((quote) => quote.missing.length > 0)
    .sort((a, b) => a.missing.length - b.missing.length || a.total - b.total);
  // Split: each item at the cheapest answering store that has enough of it.
  const split = { total: 0, stores: new Set(), missing: [] };
  items.forEach((item) => {
    const product = getProductById(item.id);
    const offers = answered
      .filter((quote) => stockAt(quote.nodeId, item.id) >= item.quantity)
      .map((quote) => ({ nodeId: quote.nodeId, price: priceAt(quote.nodeId, product) }))
      .sort((a, b) => a.price - b.price);
    if (!offers.length) {
      split.missing.push(item.id);
      return;
    }
    split.total += offers[0].price * item.quantity;
    split.stores.add(offers[0].nodeId);
  });
  return {
    quotes,
    best: complete[0] ?? partial[0] ?? null,
    complete: complete.length > 0,
    split: { total: split.total, stores: split.stores.size, missing: split.missing.length }
  };
};

export const savePlan = (plan) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
  } catch {
    // Storage can be unavailable.
  }
};

export const loadPlan = () => {
  try {
    const plan = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return plan && Array.isArray(plan.days) && Array.isArray(plan.items) ? plan : null;
  } catch {
    return null;
  }
};
