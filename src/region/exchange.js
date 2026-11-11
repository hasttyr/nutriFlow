import { toMajor } from './money';

// Exchange rates, only for the admin's consolidated reports: customers are always charged in
// their local currency. Each answer carries its source and date, as the assignment asks (4.1.6).
const SOURCE = 'ExchangeRate-API (open.er-api.com)';
const URL = 'https://open.er-api.com/v6/latest/USD';
// Units per US dollar; used when the service does not answer.
export const REFERENCE_RATES = {
  rates: { USD: 1, COP: 3900, BRL: 5.4, EUR: 0.92, JPY: 152 },
  source: 'Reference table (offline)',
  date: '2026-11-01'
};

let cache = null;

export const loadRates = async () => {
  if (cache) return cache;
  try {
    const response = await fetch(URL, { signal: AbortSignal.timeout(8000) });
    const data = await response.json();
    if (data.result !== 'success') throw new Error('rates');
    cache = { rates: data.rates, source: SOURCE, date: data.time_last_update_utc };
  } catch {
    cache = REFERENCE_RATES;
  }
  return cache;
};

export const toUsd = (minor, profile, { rates }) => toMajor(minor, profile) / (rates[profile.currency] ?? REFERENCE_RATES.rates[profile.currency]);
