import { useEffect } from 'react';
import { updateItinerary } from '../../../api/itinerariesApi';
import { getTripDaysFromTrip, mergeItineraryFromApi } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsDatePersist({
  tripId,
  tripData,
  dateRange,
  tripDatePersistKeyRef,
  setServerItinerary,
  showInAppNotice,
}) {
  useEffect(() => {
    const startDate = dateRange?.startDate;
    const endDate = dateRange?.endDate;
    if (!tripId || !tripData || !startDate || !endDate || startDate > endDate) return;

    const persistKey = `${tripId}:${startDate}:${endDate}`;
    if (tripDatePersistKeyRef.current === persistKey) return;
    tripDatePersistKeyRef.current = persistKey;

    let cancelled = false;
    (async () => {
      try {
        const computedDays = Math.max(1, getTripDaysFromTrip({ startDate, endDate }).length);
        const updated = await updateItinerary(tripId, {
          startDate,
          endDate,
          days: computedDays,
        });
        if (cancelled) return;
        if (updated) setServerItinerary((prev) => mergeItineraryFromApi(prev, updated));
      } catch (e) {
        if (cancelled) return;
        console.error('Failed to save trip date range', e);
        tripDatePersistKeyRef.current = '';
        showInAppNotice(e?.message || 'Could not save trip dates. Please try again.', 'warning');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId, tripData, dateRange?.startDate, dateRange?.endDate, tripDatePersistKeyRef, setServerItinerary, showInAppNotice]);
}
