import { distanceMeters } from './location';
import { seeded } from '../region/pricing';

// Real shops near the shopper, from OpenStreetMap through the Overpass API. Only their name, kind
// and position are real: assortment, prices and stock are simulated per store (see inventory.js).

export const MAX_STORES = 12;

const KINDS = {
  supermarket: { categories: null, label: ['Supermercado', 'Supermarket', 'Supermercado', 'Supermarché', 'スーパー'] },
  convenience: { categories: ['meals', 'produce', 'dairy', 'bakery', 'pantry', 'drinks'], label: ['Tienda de barrio', 'Corner shop', 'Mercearia', 'Épicerie de quartier', 'コンビニ'] },
  greengrocer: { categories: ['produce'], label: ['Fruver / verdulería', 'Greengrocer', 'Hortifruti', 'Primeur', '八百屋'] },
  butcher: { categories: ['meat'], label: ['Carnicería', 'Butcher', 'Açougue', 'Boucherie', '精肉店'] },
  bakery: { categories: ['bakery', 'dairy', 'drinks'], label: ['Panadería', 'Bakery', 'Padaria', 'Boulangerie', 'パン屋'] },
  marketplace: { categories: ['produce', 'meat', 'pantry'], label: ['Plaza de mercado', 'Market hall', 'Feira / mercado', 'Marché', '市場'] },
  deli: { categories: ['meals', 'meat', 'dairy', 'bakery'], label: ['Charcutería', 'Deli', 'Delicatessen', 'Charcuterie', '惣菜店'] },
  seafood: { categories: ['meat'], label: ['Pescadería', 'Fishmonger', 'Peixaria', 'Poissonnerie', '鮮魚店'] }
};
const ALIASES = { grocery: 'convenience', general: 'convenience', farm: 'greengrocer', dairy: 'deli', department_store: 'supermarket' };

const LOCALES = ['es', 'en', 'pt', 'fr', 'ja'];
const record = (values) => Object.fromEntries(LOCALES.map((locale, index) => [locale, values[index]]));

export const kindOf = (tags = {}) => {
  if (tags.amenity === 'marketplace') return 'marketplace';
  const shop = ALIASES[tags.shop] ?? tags.shop;
  return KINDS[shop] ? shop : 'convenience';
};
export const kindLabel = (kind) => record(KINDS[kind].label);
export const kindCategories = (kind) => KINDS[kind].categories;

const MIRRORS = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter'
];

const query = (lat, lon, radius) => `[out:json][timeout:20];(
nwr["shop"~"^(supermarket|convenience|greengrocer|butcher|bakery|deli|seafood|grocery|general|farm|dairy)$"](around:${radius},${lat},${lon});
nwr["amenity"="marketplace"](around:${radius},${lat},${lon});
);out center 80;`;

// Nominatim (OpenStreetMap's search) with special phrases like "[supermarket]" inside a bounding box.
// Its usage policy allows about one request per second, so the kinds are asked one after another.
const NOMINATIM_KINDS = ['supermarket', 'greengrocer', 'butcher', 'bakery', 'convenience', 'marketplace'];
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const askNominatim = async (lat, lon, radius) => {
  const dLat = radius / 111320;
  const dLon = radius / (111320 * Math.cos((lat * Math.PI) / 180));
  const viewbox = [lon - dLon, lat + dLat, lon + dLon, lat - dLat].map((value) => value.toFixed(5)).join(',');
  const elements = [];
  let answered = false;
  for (const [index, kind] of NOMINATIM_KINDS.entries()) {
    if (index > 0) await wait(1100);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&bounded=1&limit=15&q=${encodeURIComponent(`[${kind}]`)}&viewbox=${viewbox}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!response.ok) continue;
      answered = true;
      (await response.json()).forEach((place) => {
        elements.push({
          type: place.osm_type,
          id: place.osm_id,
          lat: Number(place.lat),
          lon: Number(place.lon),
          tags: {
            [place.category === 'amenity' ? 'amenity' : 'shop']: place.type,
            name: place.name || undefined,
            'addr:street': place.address?.road,
            'addr:housenumber': place.address?.house_number
          }
        });
      });
    } catch {
      // Try the next kind.
    }
  }
  if (!answered) throw new Error('Nominatim did not answer');
  return elements;
};

const askOverpass = async (lat, lon, radius) => {
  let lastError;
  for (const url of MIRRORS) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: query(lat, lon, radius) }),
        signal: AbortSignal.timeout(9000)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.elements ?? [];
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
};

const codeFor = (name) => {
  const letters = name.normalize('NFD').replace(/[^A-Za-z]/g, '').toUpperCase();
  return (letters + 'XXX').slice(0, 3);
};

const toStore = (element, origin) => {
  const tags = element.tags ?? {};
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const kind = kindOf(tags);
  const name = tags.name || tags.brand || null;
  const street = [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' ');
  return {
    id: `osm-${element.type[0]}${element.id}`,
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    name,
    kind,
    lat,
    lon,
    address: street || null,
    distance: distanceMeters(origin, { lat, lon }),
    real: true
  };
};

// Prefer named stores and variety of kinds among the closest ones.
const pick = (stores) => {
  const sorted = stores.filter((store) => Number.isFinite(store.lat)).sort((a, b) => a.distance - b.distance);
  const named = sorted.filter((store) => store.name);
  const pool = named.length >= 4 ? named : sorted;
  return pool.slice(0, MAX_STORES);
};

// Deterministic pseudo-random numbers so a synthetic store stays the same on every visit.
export { seeded };

// Used when no Overpass mirror answers: clearly labelled demo stores around the shopper.
export const syntheticStores = (origin) => {
  const random = seeded(`${origin.lat.toFixed(2)},${origin.lon.toFixed(2)}`);
  const kinds = ['supermarket', 'greengrocer', 'convenience', 'butcher', 'bakery', 'marketplace'];
  return kinds.map((kind, index) => {
    const angle = random() * Math.PI * 2;
    const meters = 250 + random() * 1600;
    const lat = origin.lat + (meters * Math.cos(angle)) / 111320;
    const lon = origin.lon + (meters * Math.sin(angle)) / (111320 * Math.cos((origin.lat * Math.PI) / 180));
    return { id: `demo-${index}`, name: null, kind, lat, lon, address: null, distance: distanceMeters(origin, { lat, lon }), real: false };
  }).sort((a, b) => a.distance - b.distance);
};

const CACHE_KEY = 'nutriflow/stores';
const cacheKey = (lat, lon) => `${lat.toFixed(3)},${lon.toFixed(3)}`;

const readCache = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY))?.[key] ?? null;
  } catch {
    return null;
  }
};

const writeCache = (key, stores) => {
  try {
    const all = JSON.parse(window.localStorage.getItem(CACHE_KEY)) ?? {};
    const entries = Object.entries({ ...all, [key]: stores }).slice(-8);
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    // Storage can be unavailable or full.
  }
};

// Nearby stores: cache → Overpass (widening the radius when the area is sparse) → synthetic.
export const findStores = async (origin) => {
  const key = cacheKey(origin.lat, origin.lon);
  const cached = readCache(key);
  if (cached) return { stores: cached, source: 'cache' };
  const dedupe = (elements) => [...new Map(elements.map((element) => [`${element.type}${element.id}`, element])).values()];
  for (const ask of [askNominatim, askOverpass]) {
    try {
      let stores = [];
      for (const radius of [1500, 4000]) {
        stores = pick(dedupe(await ask(origin.lat, origin.lon, radius)).map((element) => toStore(element, origin)));
        if (stores.length >= 4) break;
      }
      if (stores.length === 0) continue;
      writeCache(key, stores);
      return { stores, source: 'osm' };
    } catch {
      // Try the next source.
    }
  }
  return { stores: syntheticStores(origin), source: 'synthetic' };
};

export const storeCode = codeFor;
