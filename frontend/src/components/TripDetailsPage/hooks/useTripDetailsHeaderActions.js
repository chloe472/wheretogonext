import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { deleteItinerary, updateItinerary } from '../../../api/itinerariesApi';
import {
  buildWhereDefaultCityDayRanges,
  getTripDayCount,
  getWhereLocationKey,
  mergeItineraryFromApi,
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
  setWhereCityPlanRows,
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
        if (updated) setServerItinerary((prev) => mergeItineraryFromApi(prev, updated));
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
      const [name, ...rest] = str.split(',').map((s) => s.trim());
      const locName = name || str;
      const locCountry = rest.length > 0 ? rest.join(', ') : undefined;
      return { id: `where-${i}-${locName}`, name: locName, country: locCountry };
    });

    const resolvedUnique = [];
    const seenLocationKeys = new Set();
    resolved.forEach((loc) => {
      const key = getWhereLocationKey(loc);
      if (seenLocationKeys.has(key)) return;
      seenLocationKeys.add(key);
      resolvedUnique.push(loc);
    });

    const totalDays = Math.max(1, getTripDayCount(displayStart, displayEnd) || days.length || 1);
    const defaults = buildWhereDefaultCityDayRanges(resolvedUnique, totalDays);
    const nextRows = [];
    const nextRanges = {};
    if (Array.isArray(trip.citySegments)) {
      trip.citySegments.forEach((seg, idx) => {
        const label = String(seg?.locationLabel || '').trim();
        const city = String(seg?.city || '').trim();
        const keySource = label || city;
        if (!keySource) return;
        let matchLoc = resolvedUnique.find((loc) => getWhereLocationKey(loc) === keySource.toLowerCase());
        if (!matchLoc) {
          const [name, ...rest] = keySource.split(',').map((s) => s.trim());
          matchLoc = {
            id: `where-seg-${idx}-${name}`,
            name: name || keySource,
            country: rest.length > 0 ? rest.join(', ') : undefined,
          };
          resolvedUnique.push(matchLoc);
        }
        const locationKey = getWhereLocationKey(matchLoc);
        const rowId = `where-row-${idx}-${locationKey}`;
        const fallback = defaults[locationKey] || { startDay: Math.min(totalDays, idx + 1), endDay: Math.min(totalDays, idx + 1) };
        const startDay = Math.max(1, Math.min(totalDays, Number(seg?.startDay) || fallback.startDay));
        const endDay = Math.max(1, Math.min(totalDays, Number(seg?.endDay) || fallback.endDay));
        nextRows.push({ id: rowId, locationKey });
        nextRanges[rowId] = {
          startDay: Math.min(startDay, endDay),
          endDay: Math.max(startDay, endDay),
        };
      });
    }

    if (nextRows.length === 0) {
      resolvedUnique.forEach((loc, idx) => {
        const key = getWhereLocationKey(loc);
        const rowId = `where-row-${idx}-${key}`;
        nextRows.push({ id: rowId, locationKey: key });
        nextRanges[rowId] = defaults[key] || { startDay: 1, endDay: totalDays };
      });
    } else {
      resolvedUnique.forEach((loc) => {
        const key = getWhereLocationKey(loc);
        if (!nextRows.some((row) => row.locationKey === key)) {
          const rowId = `where-row-${nextRows.length}-${key}`;
          nextRows.push({ id: rowId, locationKey: key });
          nextRanges[rowId] = defaults[key] || { startDay: 1, endDay: totalDays };
        }
      });
    }

    nextRows.forEach((row) => {
      if (!nextRanges[row.id]) {
        nextRanges[row.id] = defaults[row.locationKey] || { startDay: 1, endDay: totalDays };
      }
    });

    setWhereSelectedLocations(resolvedUnique);
    setWhereCityPlanRows(nextRows);
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
    setWhereCityPlanRows,
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
