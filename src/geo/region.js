import { useSyncExternalStore } from 'react';
import { DEMO_NODES, setNodes } from '../distributed/cluster';
import { DEFAULT_COUNTRY, FALLBACK_RATES, COUNTRY_CURRENCY, currencyFor, loadRates } from './currency';
import { distanceMeters, locateByGps, locateByIp, locateByTimeZone, reverseGeocode, watchGps } from './location';
import { findStores, kindCategories, kindLabel, storeCode } from './stores';

// The shopper's region: where they are, which country (and so currency) they shop in, and the
// real stores around them, which join the simulated cluster as its nodes.

const LOCATION_KEY = 'nutriflow/location';
const COUNTRY_KEY = 'nutriflow/country';
const PRECISION = { gps: 4, manual: 3, ip: 2, timezone: 1, default: 0 };

const read = (key) => {
  try {
    return JSON.parse(window.localStorage.getItem(key));
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable.
  }
};

const pinnedCountry = () => {
  const stored = read(COUNTRY_KEY);
  return COUNTRY_CURRENCY[stored] ? stored : null;
};

let state = {
  location: null, // { lat, lon, accuracy, source, city, countryCode }
  country: pinnedCountry() ?? DEFAULT_COUNTRY,
  countryPinned: pinnedCountry() !== null,
  rates: FALLBACK_RATES,
  locating: false,
  gpsError: null,
  stores: [],
  storesStatus: 'idle', // idle | loading | osm | cache | synthetic
  storesCenter: null
};
const listeners = new Set();

const setState = (patch) => {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
};

export const subscribeRegion = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getRegion = () => state;
export const useRegion = () => useSyncExternalStore(subscribeRegion, getRegion);

// Money settings for formatting: every catalog price is COP and gets converted.
export const moneyOf = (region = state) => {
  const currency = currencyFor(region.country);
  return { currency, rate: region.rates[currency] ?? FALLBACK_RATES[currency] ?? 1 };
};

// The app only operates in the countries it has a currency (and payment methods) for.
export const isSupported = (country) => Boolean(COUNTRY_CURRENCY[country]);

export const setCountry = (country) => {
  write(COUNTRY_KEY, country);
  setState({ country, countryPinned: true });
};

const formatDistance = (meters) => (meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`);

// A nearby store as a cluster node: latency grows with distance.
export const toNode = (store) => {
  const label = kindLabel(store.kind);
  const name = store.name ?? `${label.es} ${store.id.slice(-3)}`;
  return {
    ...store,
    name,
    code: storeCode(name),
    zone: Object.fromEntries(Object.entries(label).map(([locale, text]) => [locale, `${text} · ${formatDistance(store.distance)}`])),
    categories: kindCategories(store.kind),
    baseLatency: Math.round(18 + store.distance / 35)
  };
};

let storesRequest = 0;
const refreshStores = async (location) => {
  if (state.storesCenter && distanceMeters(state.storesCenter, location) < 250) return;
  const request = ++storesRequest;
  setState({ storesStatus: 'loading', storesCenter: { lat: location.lat, lon: location.lon } });
  const { stores, source } = await findStores(location);
  if (request !== storesRequest) return;
  setNodes(stores.map(toNode), source === 'synthetic' ? 'synthetic' : 'stores');
  setState({ stores, storesStatus: source });
};

// Keeps the most precise fix: an IP answer never replaces GPS or a point the shopper chose.
// A detected country the app does not serve is kept too, so the app can say it is unavailable there.
// A country picked by hand wins over detection, until the shopper is detected in another country:
// then the app follows them there (currency, payment methods, availability).
export const applyLocation = (location, { force = false } = {}) => {
  const current = state.location;
  if (!force && current && PRECISION[current.source] > PRECISION[location.source]) return false;
  const merged = { ...location, city: location.city ?? current?.city, countryCode: location.countryCode?.toUpperCase() ?? current?.countryCode };
  const moved = Boolean(current?.countryCode && merged.countryCode && merged.countryCode !== current.countryCode);
  if (moved && state.countryPinned) {
    try {
      window.localStorage.removeItem(COUNTRY_KEY);
    } catch {
      // Storage can be unavailable.
    }
  }
  const follow = merged.countryCode && (!state.countryPinned || moved);
  setState({
    location: merged,
    ...(follow ? { country: merged.countryCode, countryPinned: false } : {})
  });
  if (merged.source !== 'timezone' && merged.source !== 'default') write(LOCATION_KEY, merged);
  return true;
};

const placeFor = async (location) => {
  try {
    const place = await reverseGeocode(location.lat, location.lon, document.documentElement.lang || 'es');
    return { ...location, ...place };
  } catch {
    return location;
  }
};

// A GPS fix becomes the location; city and country follow once the point is reverse-geocoded.
let lastGps = null;
const applyGps = async (fix) => {
  lastGps = fix;
  applyLocation(fix, { force: true });
  refreshStores(fix);
  const placed = await placeFor(fix);
  if (state.location?.source === 'gps' && state.location.lat === fix.lat) applyLocation(placed, { force: true });
};

export const locatePrecisely = async () => {
  setState({ locating: true, gpsError: null });
  try {
    await applyGps(await locateByGps());
  } catch (error) {
    setState({ gpsError: error.message });
  } finally {
    setState({ locating: false });
  }
};

export const setManualLocation = async (lat, lon) => {
  const point = { lat, lon, accuracy: 50, source: 'manual' };
  applyLocation(point, { force: true });
  refreshStores(point);
  const placed = await placeFor(point);
  if (state.location?.source === 'manual' && state.location.lat === lat) applyLocation(placed, { force: true });
};

let started = false;
let stopWatch = () => {};

// Boot sequence: saved fix → time-zone guess → IP → GPS. Each later step only wins if more precise.
export const startRegion = () => {
  if (started) return;
  started = true;
  loadRates().then((rates) => setState({ rates }));

  const saved = read(LOCATION_KEY);
  if (saved && Number.isFinite(saved.lat)) {
    applyLocation(saved, { force: true });
    refreshStores(saved);
  } else {
    applyLocation(locateByTimeZone(), { force: true });
  }

  locateByIp()
    .then((fix) => {
      if (applyLocation(fix)) refreshStores(fix);
    })
    .catch(() => {
      if (state.storesStatus === 'idle') refreshStores(state.location);
    });

  if (saved?.source !== 'manual') locatePrecisely();

  // Later moves of the device. Tiny GPS jitter is ignored; a point picked on the map only gives
  // way when the device itself really moves (over 1 km).
  stopWatch = watchGps((fix) => {
    if (lastGps && distanceMeters(lastGps, fix) < 100) return;
    if (state.location?.source === 'manual' && (!lastGps || distanceMeters(lastGps, fix) < 1000)) {
      lastGps = fix;
      return;
    }
    applyGps(fix);
  });
};

// Tests and the "reset" control go back to the demo branches.
export const resetRegion = () => {
  started = false;
  stopWatch();
  stopWatch = () => {};
  lastGps = null;
  storesRequest += 1;
  setNodes(DEMO_NODES, 'demo');
  setState({
    location: null,
    country: pinnedCountry() ?? DEFAULT_COUNTRY,
    countryPinned: pinnedCountry() !== null,
    stores: [],
    storesStatus: 'idle',
    storesCenter: null
  });
};
