import messages from './messages';

export const LOCALES = ['es', 'en', 'pt', 'pl', 'it'];
export const STORAGE_KEY = 'nutriflow/locale';

// Each language's own name, so a visitor can find theirs whatever the interface shows.
export const LOCALE_NAMES = { es: 'Español', en: 'English', pt: 'Português', pl: 'Polski', it: 'Italiano' };

// Prices are always Colombian pesos without decimals; each language formats them its own way,
// e.g. "$ 12.900" (es), "COP 12,900" (en), "COP 12.900" (pt), "12 900 COP" (pl), "12.900 COP" (it).
const intlTags = { en: 'en-US', es: 'es-CO', pt: 'pt-BR', pl: 'pl-PL', it: 'it-IT' };

const isLocale = (value) => LOCALES.includes(value);

// The time zone is a coarse, permission-free hint of where the visitor is.
const regionTimeZones = {
  es: [
    'America/Bogota', 'America/Mexico_City', 'America/Monterrey', 'America/Merida', 'America/Cancun',
    'America/Chihuahua', 'America/Ciudad_Juarez', 'America/Hermosillo', 'America/Mazatlan', 'America/Tijuana',
    'America/Bahia_Banderas', 'America/Matamoros', 'America/Buenos_Aires', 'America/Cordoba', 'America/Lima',
    'America/Santiago', 'America/Punta_Arenas', 'America/Caracas', 'America/Guayaquil', 'America/Montevideo',
    'America/Asuncion', 'America/La_Paz', 'America/Panama', 'America/Costa_Rica', 'America/Guatemala',
    'America/El_Salvador', 'America/Tegucigalpa', 'America/Managua', 'America/Havana', 'America/Santo_Domingo',
    'America/Puerto_Rico', 'Pacific/Galapagos', 'Pacific/Easter', 'Europe/Madrid', 'Africa/Ceuta',
    'Atlantic/Canary', 'Africa/Malabo'
  ],
  pt: [
    'America/Sao_Paulo', 'America/Rio_Branco', 'America/Manaus', 'America/Belem', 'America/Fortaleza',
    'America/Recife', 'America/Bahia', 'America/Maceio', 'America/Araguaina', 'America/Cuiaba',
    'America/Campo_Grande', 'America/Porto_Velho', 'America/Boa_Vista', 'America/Santarem', 'America/Noronha',
    'America/Eirunepe', 'Europe/Lisbon', 'Atlantic/Azores', 'Atlantic/Madeira', 'Atlantic/Cape_Verde',
    'Africa/Luanda', 'Africa/Maputo', 'Africa/Bissau', 'Africa/Sao_Tome', 'Asia/Dili'
  ],
  pl: ['Europe/Warsaw'],
  it: ['Europe/Rome', 'Europe/Vatican', 'Europe/San_Marino']
};

const timeZoneLocales = new Map(
  Object.entries(regionTimeZones).flatMap(([locale, zones]) => zones.map((zone) => [zone, locale]))
);

export const localeForTimeZone = (timeZone = '') =>
  timeZoneLocales.get(timeZone) ?? (timeZone.startsWith('America/Argentina/') ? 'es' : undefined);

// "pt-BR" -> "pt"; languages the app does not speak give undefined.
const localeForLanguage = (tag = '') => {
  const base = tag.toLowerCase().split('-')[0];
  return isLocale(base) ? base : undefined;
};

const browserLanguages = () => window.navigator.languages ?? [window.navigator.language];

const browserTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
};

// A language the visitor configured on purpose wins. English is many browsers' default, so it
// does not outrank where the visitor is: an English browser in Warsaw gets Polish.
export const detectLocale = ({ languages = browserLanguages(), timeZone = browserTimeZone() } = {}) => {
  const spoken = languages.map(localeForLanguage).find(Boolean);
  if (spoken && spoken !== 'en') return spoken;
  return localeForTimeZone(timeZone) ?? spoken ?? 'en';
};

// Only an explicit choice is saved, so an untouched visitor is re-detected on every visit.
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
  const priceFormat = new Intl.NumberFormat(tag, { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

  const timeFormat = new Intl.DateTimeFormat(tag, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateFormat = new Intl.DateTimeFormat(tag, { dateStyle: 'medium' });

  const formatNumber = (value) => numberFormat.format(value);
  const formatTime = (timestamp) => timeFormat.format(timestamp);
  const formatDate = (date) => dateFormat.format(date);
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

  // Picks the current language from a { es, en, pt, pl, it } record, e.g. a product name.
  const localize = (record) => record[locale] ?? record.en;

  return { locale, t, localize, formatNumber, formatPrice, formatTime, formatDate };
};
