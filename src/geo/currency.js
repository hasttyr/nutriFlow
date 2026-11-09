// Country → currency, plus COP exchange rates. Catalog prices are stored in Colombian pesos and
// converted for display, so every number on screen follows the country the shopper picks.

export const COUNTRY_CURRENCY = {
  CO: 'COP', MX: 'MXN', AR: 'ARS', CL: 'CLP', PE: 'PEN', EC: 'USD', VE: 'VES', UY: 'UYU', PY: 'PYG', BO: 'BOB',
  BR: 'BRL', PA: 'USD', CR: 'CRC', GT: 'GTQ', HN: 'HNL', NI: 'NIO', SV: 'USD', DO: 'DOP', PR: 'USD', CU: 'CUP',
  US: 'USD', CA: 'CAD', ES: 'EUR', PT: 'EUR', IT: 'EUR', FR: 'EUR', DE: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  IE: 'EUR', PL: 'PLN', GB: 'GBP', CH: 'CHF'
};

export const COUNTRIES = Object.keys(COUNTRY_CURRENCY);
export const DEFAULT_COUNTRY = 'CO';

export const currencyFor = (country) => COUNTRY_CURRENCY[country] ?? 'USD';

// Units of each currency per 1 COP. Used when the live rates service does not answer.
export const FALLBACK_RATES = {
  COP: 1, USD: 0.00025, EUR: 0.00022, MXN: 0.0046, ARS: 0.29, CLP: 0.24, PEN: 0.00094, VES: 0.034, UYU: 0.0103,
  PYG: 1.98, BOB: 0.00173, BRL: 0.0014, CRC: 0.126, GTQ: 0.00192, HNL: 0.0065, NIO: 0.0092, DOP: 0.0157, CUP: 0.006,
  CAD: 0.00035, PLN: 0.00096, GBP: 0.00019, CHF: 0.00021
};

// Currencies written without decimals.
const WHOLE = new Set(['COP', 'CLP', 'PYG', 'ARS', 'CRC', 'VES']);
export const fractionDigits = (currency) => (WHOLE.has(currency) ? 0 : 2);

const RATES_URL = 'https://open.er-api.com/v6/latest/COP';
const RATES_KEY = 'nutriflow/rates';
const DAY = 24 * 60 * 60 * 1000;

const readCache = () => {
  try {
    const cached = JSON.parse(window.localStorage.getItem(RATES_KEY));
    return cached && Date.now() - cached.time < DAY ? cached.rates : null;
  } catch {
    return null;
  }
};

// Live rates, cached for a day; falls back to the fixed table.
export const loadRates = async () => {
  const cached = readCache();
  if (cached) return cached;
  try {
    const response = await fetch(RATES_URL, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (data.result !== 'success') throw new Error('rates');
    try {
      window.localStorage.setItem(RATES_KEY, JSON.stringify({ time: Date.now(), rates: data.rates }));
    } catch {
      // Storage can be unavailable.
    }
    return data.rates;
  } catch {
    return FALLBACK_RATES;
  }
};
