import { getLive } from '../live/store';
import { mergeProfile } from './overrides';

// RegionProfile: everything that differs between countries lives in data, never in code.
// Each country is one JSON file in ./profiles (the configuration contract of the assignment,
// section 3) plus its price list in ./prices. Adding a sixth country means adding those two files.

const byFile = (modules) =>
  Object.fromEntries(Object.entries(modules).map(([path, module]) => [path.match(/(\w+)\.json$/)[1], module.default ?? module]));

export const PROFILES = byFile(import.meta.glob('./profiles/*.json', { eager: true }));
const PRICE_LISTS = byFile(import.meta.glob('./prices/*.json', { eager: true }));

export const COUNTRIES = Object.keys(PROFILES);
export const DEFAULT_COUNTRY = 'CO';

// The admin console can change rates, fees, tip and commission at run time; those overrides
// live in the shared state and are merged over the file. Merged profiles are cached so screens
// keep a stable object until an override changes.
const merged = new Map();

export const profileFor = (country) => {
  const base = PROFILES[country];
  const override = getLive().overrides[country];
  if (!base || !override) return base ?? null;
  const cached = merged.get(country);
  if (cached?.override === override) return cached.profile;
  const profile = mergeProfile(base, override);
  merged.set(country, { override, profile });
  return profile;
};
export const isSupported = (country) => Boolean(PROFILES[country]);

// A product's list price in the country, in minor units of its currency.
export const listPrice = (country, productId) => PRICE_LISTS[country]?.[productId] ?? 0;

// A country's name in the interface language, e.g. ("fr", "JP") → "Japon".
export const countryName = (locale, code) => {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code);
  } catch {
    return code;
  }
};
