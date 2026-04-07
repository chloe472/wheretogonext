import { apiUrl } from './apiConfig.js';

const RATES_CACHE_KEY = 'wtg.currency.usdRates.v1';
const RATES_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

function readCachedRates() {
  try {
    const raw = localStorage.getItem(RATES_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.rates) return null;
    if (Date.now() - parsed.timestamp > RATES_CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCachedRates(payload) {
  try {
    localStorage.setItem(RATES_CACHE_KEY, JSON.stringify({
      timestamp: Date.now(),
      rates: payload?.rates || {},
      fetchedAt: payload?.fetchedAt || null,
      stale: Boolean(payload?.stale),
    }));
  } catch {
    
  }
}

export async function fetchUsdExchangeRates(signal) {
  try {
    const res = await fetch(`${apiUrl('/api/currency/rates')}?base=USD`, { signal });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data?.error || `Failed to fetch exchange rates (${res.status})`);
    }

    if (!data?.rates || typeof data.rates !== 'object') {
      throw new Error('Currency response is missing rates.');
    }

    writeCachedRates(data);
    return {
      rates: data.rates,
      fetchedAt: data.fetchedAt || null,
      stale: Boolean(data.stale),
      source: data.source || 'openexchangerates',
    };
  } catch (error) {
    const cached = readCachedRates();
    if (cached) {
      return {
        rates: cached.rates,
        fetchedAt: cached.fetchedAt || null,
        stale: true,
        source: 'cache',
      };
    }
    throw error;
  }
}
