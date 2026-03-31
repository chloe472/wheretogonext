import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchUsdExchangeRates } from '../../../api/currencyApi';
import { getCurrencyDisplayName } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsExchangeRates() {
  const [exchangeRates, setExchangeRates] = useState({});

  const loadExchangeRates = useCallback(async (signal) => {
    try {
      const payload = await fetchUsdExchangeRates(signal);
      if (!payload?.rates || typeof payload.rates !== 'object') return false;
      setExchangeRates(payload.rates);
      return true;
    } catch (error) {
      console.warn('Live currency rates unavailable.', error?.message || error);
      return false;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const ok = await loadExchangeRates(controller.signal);
      if (!ok || cancelled) return;
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [loadExchangeRates]);

  const currencyOptions = useMemo(() => {
    const codes = Object.keys(exchangeRates || {})
      .map((c) => String(c || '').toUpperCase())
      .filter((c) => /^[A-Z]{3}$/.test(c));
    const unique = Array.from(new Set(codes));
    unique.sort((a, b) => {
      if (a === 'USD') return -1;
      if (b === 'USD') return 1;
      return a.localeCompare(b);
    });
    return unique.map((code) => ({ code, name: getCurrencyDisplayName(code) }));
  }, [exchangeRates]);

  const currencyOptionsForModal = useMemo(() => {
    if (currencyOptions.length > 0) return currencyOptions;
    return [{ code: 'USD', name: getCurrencyDisplayName('USD') }];
  }, [currencyOptions]);

  return {
    exchangeRates,
    setExchangeRates,
    loadExchangeRates,
    currencyOptions,
    currencyOptionsForModal,
  };
}
