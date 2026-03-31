import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { deleteItinerary, updateItinerary } from '../../../api/itinerariesApi';
import { searchLocations } from '../lib/tripDetailsLocationData';
import {
  buildWhereDefaultCityDayRanges,
  getTripDayCount,
  getWhereLocationKey,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsHeaderActions({
  tripId,
  trip,
  navigate,
  setServerItinerary,
  setTitleDisplay,
  setFriendlyDialog,
  displayStart,
  displayEnd,
  days,
  setWhereQuery,
  setWhereSelectedLocations,
  setWhereCityDayRanges,
  setWhereCityDayDrafts,
  setWhereCityRangeError,
  setWhereModalOpen,
  setWhereSuggestionsOpen,
}) {
  const commitTripTitle = useCallback(
    async (trimmedTitle) => {
      try {
        const updated = await updateItinerary(tripId, { title: trimmedTitle });
        if (updated) setServerItinerary(updated);
        setTitleDisplay(trimmedTitle);
        toast.success('Changes saved', { id: 'trip-details-saved' });
      } catch (e) {
        console.error(e);
      }
    },
    [tripId, setServerItinerary, setTitleDisplay],
  );

  const requestDeleteTrip = useCallback(() => {
    setFriendlyDialog({
      open: true,
      title: 'Delete trip',
      message: 'Delete this trip? This cannot be undone.',
      showCancel: true,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await deleteItinerary(tripId);
          toast.success('Trip deleted');
          navigate('/');
        } catch (e) {
          setFriendlyDialog({
            open: true,
            title: 'Could not delete trip',
            message: e?.message || 'Please try again.',
            showCancel: false,
            confirmText: 'OK',
            cancelText: 'Cancel',
            onConfirm: null,
          });
        }
      },
    });
  }, [tripId, navigate, setFriendlyDialog]);

  const openWhereFromHeader = useCallback(() => {
    if (!trip) return;

    setWhereQuery('');
    const locationsStr = trip.locations || trip.destination || '';
    const parts = locationsStr.split(';').map((s) => s.trim()).filter(Boolean);
    const initial = parts.length > 0 ? parts : (trip.destination ? [trip.destination] : []);
    const resolved = initial.map((str, i) => {
      const match = searchLocations(str).find(
        (loc) => loc.name === str || (loc.country && `${loc.name}, ${loc.country}` === str),
      );
      if (match) return match;

      const [name, ...rest] = str.split(',').map((s) => s.trim());
      const locName = name || str;
      const locCountry = rest.length > 0 ? rest.join(', ') : undefined;
      const byName = searchLocations(locName).find((loc) => !locCountry || loc.country === locCountry);
      if (byName) return byName;
      return { id: `where-${i}-${locName}`, name: locName, country: locCountry };
    });

    const totalDays = Math.max(1, getTripDayCount(displayStart, displayEnd) || days.length || 1);
    const defaults = buildWhereDefaultCityDayRanges(resolved, totalDays);
    const rangesFromTrip = {};
    if (Array.isArray(trip.citySegments)) {
      trip.citySegments.forEach((seg, idx) => {
        const label = String(seg?.locationLabel || '').trim();
        const city = String(seg?.city || '').trim();
        const keySource = label || city;
        if (!keySource) return;
        const key = keySource.toLowerCase();
        const fallback = defaults[key] || { startDay: Math.min(totalDays, idx + 1), endDay: Math.min(totalDays, idx + 1) };
        const startDay = Math.max(1, Math.min(totalDays, Number(seg?.startDay) || fallback.startDay));
        const endDay = Math.max(1, Math.min(totalDays, Number(seg?.endDay) || fallback.endDay));
        rangesFromTrip[key] = {
          startDay: Math.min(startDay, endDay),
          endDay: Math.max(startDay, endDay),
        };
      });
    }

    const nextRanges = {};
    resolved.forEach((loc) => {
      const key = getWhereLocationKey(loc);
      nextRanges[key] = rangesFromTrip[key] || defaults[key] || { startDay: 1, endDay: totalDays };
    });

    setWhereSelectedLocations(resolved);
    setWhereCityDayRanges(nextRanges);
    setWhereCityDayDrafts({});
    setWhereCityRangeError('');
    setWhereModalOpen(true);
    setWhereSuggestionsOpen(false);
  }, [
    trip,
    displayStart,
    displayEnd,
    days,
    setWhereQuery,
    setWhereSelectedLocations,
    setWhereCityDayRanges,
    setWhereCityDayDrafts,
    setWhereCityRangeError,
    setWhereModalOpen,
    setWhereSuggestionsOpen,
  ]);

  return {
    commitTripTitle,
    requestDeleteTrip,
    openWhereFromHeader,
  };
}
