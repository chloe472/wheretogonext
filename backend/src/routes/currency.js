import { Router } from 'express';

const router = Router();

const OPEN_EXCHANGE_RATES_APP_ID = String(process.env.OPEN_EXCHANGE_RATES_APP_ID || '').trim();
const OPEN_EXCHANGE_RATES_URL = 'https://openexchangerates.org/api/latest.json';
const CACHE_TTL_SECONDS = Math.max(60, Number(process.env.OPEN_EXCHANGE_RATES_CACHE_SECONDS || 43200));
const CACHE_TTL_MS = CACHE_TTL_SECONDS * 1000;
const REQUEST_TIMEOUT_MS = 10000;

let ratesCache = {
  ratesUsdBase: null,
  fetchedAt: 0,
  expiresAt: 0,
};

function pickSupportedRates(rates = {}) {
  const out = { USD: 1 };
  Object.entries(rates).forEach(([code, value]) => {
    const normalized = String(code || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(normalized) || normalized === 'USD') return;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) out[normalized] = numeric;
  });
  return out;
}

function convertFromUsdBase(ratesUsdBase, baseCode = 'USD') {
  const base = String(baseCode || 'USD').toUpperCase();
  if (!ratesUsdBase || typeof ratesUsdBase !== 'object') return null;
  if (base === 'USD') return ratesUsdBase;

  const baseRate = Number(ratesUsdBase[base]);
  if (!Number.isFinite(baseRate) || baseRate <= 0) return null;

  const converted = {};
  Object.entries(ratesUsdBase).forEach(([code, value]) => {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) {
      converted[code] = n / baseRate;
    }
  });
  converted[base] = 1;
  return converted;
}

async function fetchUsdBaseRatesFromOpenExchangeRates() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const url = `${OPEN_EXCHANGE_RATES_URL}?app_id=${encodeURIComponent(OPEN_EXCHANGE_RATES_APP_ID)}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Open Exchange Rates request failed (${response.status})`);
    }

    const payload = await response.json();
    const supportedRates = pickSupportedRates(payload?.rates || {});
    if (Object.keys(supportedRates).length < 2) {
      throw new Error('Open Exchange Rates response did not include expected currency data.');
    }

    const fetchedAtMs = Number(payload?.timestamp) ? Number(payload.timestamp) * 1000 : Date.now();
    return {
      ratesUsdBase: supportedRates,
      fetchedAt: fetchedAtMs,
      expiresAt: Date.now() + CACHE_TTL_MS,
    };
  } finally {
    clearTimeout(timeout);
  }
}

router.get('/rates', async (req, res) => {
  const requestedBase = String(req.query.base || 'USD').trim().toUpperCase() || 'USD';
  const now = Date.now();

  const sendRates = (cache, stale = false) => {
    const rates = convertFromUsdBase(cache.ratesUsdBase, requestedBase);
    if (!rates) {
      return res.status(400).json({ error: `Unsupported base currency: ${requestedBase}` });
    }
    return res.json({
      base: requestedBase,
      rates,
      source: 'openexchangerates',
      fetchedAt: cache.fetchedAt,
      stale,
      ttlSeconds: CACHE_TTL_SECONDS,
    });
  };

  if (ratesCache.ratesUsdBase && now < ratesCache.expiresAt) {
    return sendRates(ratesCache, false);
  }

  if (!OPEN_EXCHANGE_RATES_APP_ID) {
    if (ratesCache.ratesUsdBase) return sendRates(ratesCache, true);
    return res.status(503).json({
      error: 'Open Exchange Rates is not configured on the server.',
      code: 'OPEN_EXCHANGE_RATES_NOT_CONFIGURED',
    });
  }

  try {
    ratesCache = await fetchUsdBaseRatesFromOpenExchangeRates();
    return sendRates(ratesCache, false);
  } catch (error) {
    console.error('Currency rates fetch error:', error?.message || error);
    if (ratesCache.ratesUsdBase) {
      return sendRates(ratesCache, true);
    }
    return res.status(502).json({
      error: 'Failed to fetch exchange rates from Open Exchange Rates.',
      code: 'OPEN_EXCHANGE_RATES_FETCH_FAILED',
    });
  }
});

export default router;