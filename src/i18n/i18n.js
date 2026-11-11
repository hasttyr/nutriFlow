import { DEFAULT_COUNTRY, profileFor } from '../region/profiles';
import { moneyFormatter } from '../region/money';

// Interface texts live outside the code: one JSON resource catalog per language in ./locales, with
// stable keys. A key missing in a language falls back to English. Adding a language means adding
// its catalog file.
const catalogs = Object.fromEntries(
  Object.entries(import.meta.glob('./locales/*.json', { eager: true })).map(([path, module]) => [
    path.match(/(\w+)\.json$/)[1],
    module.default ?? module
  ])
);

export const FALLBACK_LOCALE = 'en';
// Ordered as the five countries are presented: Colombia, Brazil, United States, France, Japan.
export const LOCALES = ['es', 'pt', 'en', 'fr', 'ja'].filter((code) => catalogs[code]);
export const messages = catalogs;
export const STORAGE_KEY = 'nutriflow/locale';

const isLocale = (value) => LOCALES.includes(value);

// Each language's own name ("español", "日本語"), so a visitor can find theirs whatever the interface shows.
const ownName = (code) => {
  try {
    const name = new Intl.DisplayNames([code], { type: 'language' }).of(code);
    return name.charAt(0).toLocaleUpperCase(code) + name.slice(1);
  } catch {
    return code;
  }
};
export const LOCALE_NAMES = Object.fromEntries(LOCALES.map((code) => [code, ownName(code)]));

// The browser's language, for screens outside any served country.
export const browserLocale = (languages = window.navigator.languages ?? [window.navigator.language]) =>
  languages.map((tag = '') => tag.toLowerCase().split('-')[0]).find(isLocale) ?? FALLBACK_LOCALE;

// The interface language follows the country's profile. A language picked by hand is remembered
// together with the country it was picked in, so it holds there and gives way when the shopper
// changes country.
export const loadLocaleChoice = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    return stored && isLocale(stored.locale) ? stored : null;
  } catch {
    return null;
  }
};

export const saveLocaleChoice = (locale, country) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ locale, country }));
  } catch {
    // Storage can be unavailable; the choice still applies for this visit.
  }
};

export const localeFor = (country, choice = loadLocaleChoice()) => {
  if (choice && choice.country === country) return choice.locale;
  return profileFor(country)?.language ?? choice?.locale ?? browserLocale();
};

// Texts come in the interface language; numbers, money, dates and times follow the country's
// profile (its CLDR locale, currency and time zone), whatever language the texts are in.
export const createTranslator = (locale, profile = profileFor(DEFAULT_COUNTRY)) => {
  const catalog = messages[locale] ?? messages[FALLBACK_LOCALE];
  const pluralRules = new Intl.PluralRules(locale);
  const numberFormat = new Intl.NumberFormat(profile.locale);
  const formatMoney = moneyFormatter(profile);
  const timeFormat = new Intl.DateTimeFormat(profile.locale, {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: profile.hour12, timeZone: profile.timeZone
  });
  const dateFormat = new Intl.DateTimeFormat(profile.locale, {
    year: 'numeric', month: '2-digit', day: '2-digit', timeZone: profile.timeZone
  });

  const formatNumber = (value) => numberFormat.format(value);
  const formatTime = (timestamp) => timeFormat.format(timestamp);
  const formatDate = (date) => dateFormat.format(date);
  // Amounts are integers in the currency's minor unit.
  const formatPrice = (minor) => formatMoney(minor);

  const t = (key, vars = {}) => {
    const entry = catalog[key] ?? messages[FALLBACK_LOCALE][key];
    if (entry === undefined) {
      throw new Error(`Missing translation: ${key}`);
    }
    const template = typeof entry === 'string' ? entry : entry[pluralRules.select(vars.count)] ?? entry.other;
    return template.replace(/\{(\w+)\}/g, (match, name) => {
      const value = vars[name];
      if (value === undefined) return match;
      return typeof value === 'number' ? formatNumber(value) : value;
    });
  };

  // Picks the current language from a { es, en, pt, fr, ja } record, e.g. a product name.
  const localize = (record) => record[locale] ?? record[FALLBACK_LOCALE];

  return { locale, profile, currency: profile.currency, t, localize, formatNumber, formatPrice, formatTime, formatDate };
};
