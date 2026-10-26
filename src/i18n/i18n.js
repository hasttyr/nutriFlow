import messages from './messages';

export const LOCALES = ['es', 'en'];
export const STORAGE_KEY = 'nutriflow/locale';

// Prices are in US dollars; es-MX spells that out ("USD 5.99") so it never reads as pesos.
const intlTags = { en: 'en-US', es: 'es-MX' };

const isLocale = (value) => LOCALES.includes(value);

export const detectLocale = () => {
  const preferred = window.navigator.languages?.[0] ?? window.navigator.language ?? '';
  return preferred.toLowerCase().startsWith('es') ? 'es' : 'en';
};

export const loadLocale = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : detectLocale();
  } catch {
    return detectLocale();
  }
};

export const saveLocale = (locale) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable; the choice still applies for this visit.
  }
};

export const createTranslator = (locale) => {
  const tag = intlTags[locale];
  const pluralRules = new Intl.PluralRules(tag);
  const numberFormat = new Intl.NumberFormat(tag);
  const priceFormat = new Intl.NumberFormat(tag, { style: 'currency', currency: 'USD' });

  const formatNumber = (value) => numberFormat.format(value);
  const formatPrice = (amount) => priceFormat.format(amount);

  const t = (key, vars = {}) => {
    const entry = messages[locale][key] ?? messages.en[key];
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

  // Picks the current language from a { en, es } record, e.g. a product name.
  const localize = (record) => record[locale] ?? record.en;

  return { locale, t, localize, formatNumber, formatPrice };
};
