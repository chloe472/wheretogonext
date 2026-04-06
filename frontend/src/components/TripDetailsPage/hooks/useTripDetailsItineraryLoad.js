import { useCallback, useEffect, useState } from 'react';
import { fetchItineraryById } from '../../../api/itinerariesApi';

function parseDocUpdatedMs(doc) {
  if (!doc) return 0;
  const t = doc.updatedAt ?? doc.updated_at;
  if (!t) return 0;
  const d = new Date(t);
  return Number.isFinite(d.getTime()) ? d.getTime() : 0;
}

const POLL_INTERVAL_MS = 25000;

export function useTripDetailsItineraryLoad(tripId, locationState) {
  const [serverItinerary, setServerItinerary] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripLoadError, setTripLoadError] = useState(null);

  const preloadedItinerary = locationState?.preloadedItinerary ?? null;

  const refetchItineraryIfNewer = useCallback(async () => {
    const id = String(tripId || '').trim();
    if (!id) return;
    try {
      const doc = await fetchItineraryById(id);
      if (!doc) return;
      setServerItinerary((prev) => {
        const prevTs = parseDocUpdatedMs(prev);
        const nextTs = parseDocUpdatedMs(doc);
        if (!prev || nextTs > prevTs) return doc;
        return prev;
      });
    } catch {
      /* ignore transient refetch errors */
    }
  }, [tripId]);

  useEffect(() => {
    let cancelled = false;
    setTripLoadError(null);

    const preloaded = preloadedItinerary || null;
    const preloadedId = preloaded?._id ?? preloaded?.id;
    const hasMatchingPreloaded = preloaded && String(preloadedId || '') === String(tripId || '');

    if (hasMatchingPreloaded) {
      setServerItinerary(preloaded);
      setTripLoading(false);
    } else {
      setTripLoading(true);
      setServerItinerary(null);
    }

    (async () => {
      const maxAttempts = hasMatchingPreloaded ? 3 : 6;
      let lastError = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const shouldRetry = (error) => {
          const msg = String(error?.message || '').toLowerCase();
          return msg.includes('404') || msg.includes('not found');
        };

        if (attempt > 1) {
          await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
          if (cancelled) return;
        }

        try {
          const doc = await fetchItineraryById(tripId);
          if (cancelled) return;
          if (!doc) {
            lastError = new Error('Trip not found.');
            if (attempt < maxAttempts) continue;
            setTripLoadError('Trip not found.');
            setServerItinerary(null);
            setTripLoading(false);
          } else {
            setServerItinerary(doc);
            setTripLoadError(null);
            setTripLoading(false);
          }
          return;
        } catch (e) {
          lastError = e;
          if (attempt < maxAttempts && shouldRetry(e)) {
            continue;
          }
          if (!cancelled) {
            setTripLoadError(e?.message || 'Failed to load trip');
            setServerItinerary(null);
            setTripLoading(false);
          }
          return;
        }
      }

      if (!cancelled && lastError) {
        setTripLoadError(lastError?.message || 'Failed to load trip');
      }
      if (!cancelled) setTripLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, preloadedItinerary]);

  useEffect(() => {
    const id = String(tripId || '').trim();
    if (!id) return undefined;

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refetchItineraryIfNewer();
      }
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [tripId, refetchItineraryIfNewer]);

  useEffect(() => {
    const id = String(tripId || '').trim();
    if (!id) return undefined;

    const tick = () => {
      if (document.visibilityState === 'visible') {
        refetchItineraryIfNewer();
      }
    };

    const intervalId = window.setInterval(tick, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [tripId, refetchItineraryIfNewer]);

  return {
    serverItinerary,
    setServerItinerary,
    tripLoading,
    tripLoadError,
    refetchItineraryIfNewer,
  };
}
