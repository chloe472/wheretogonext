import { useEffect, useState } from 'react';
import { fetchItineraryById } from '../../../api/itinerariesApi';

export function useTripDetailsItineraryLoad(tripId, locationState) {
  const [serverItinerary, setServerItinerary] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripLoadError, setTripLoadError] = useState(null);

  const preloadedItinerary = locationState?.preloadedItinerary ?? null;

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

  return { serverItinerary, setServerItinerary, tripLoading, tripLoadError };
}
