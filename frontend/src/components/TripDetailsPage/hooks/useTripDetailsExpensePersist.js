import { useEffect } from 'react';
import { updateItinerary } from '../../../api/itinerariesApi';

export function useTripDetailsExpensePersist({
  tripId,
  tripData,
  tripExpenseItems,
  tripLoading,
  hydratedTripItemsForIdRef,
  expensePersistCountByTripRef,
}) {
  useEffect(() => {
    if (tripLoading || !tripData) return;
    if (hydratedTripItemsForIdRef.current !== tripId) return;

    const meta = expensePersistCountByTripRef.current;
    if (meta.tripId !== tripId) {
      expensePersistCountByTripRef.current = { tripId, count: 0 };
    }

    let cancelled = false;
    (async () => {
      try {
        await updateItinerary(tripId, { tripExpenseItems });
        if (cancelled) return;

        const currentMeta = expensePersistCountByTripRef.current;
        if (currentMeta.tripId !== tripId) return;
        currentMeta.count += 1;
      } catch (e) {
        if (!cancelled) console.error('Failed to save trip items', e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    tripId,
    tripData,
    tripExpenseItems,
    tripLoading,
    hydratedTripItemsForIdRef,
    expensePersistCountByTripRef,
  ]);
}
