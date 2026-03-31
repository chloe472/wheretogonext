import { useCallback } from 'react';
import toast from 'react-hot-toast';
import { updateItinerary } from '../../../api/itinerariesApi';
import {
  buildWhereDefaultCityDayRanges,
  findExactWhereLocationMatch,
  getTripDayCount,
  getWhereLocationLabel,
  getWhereLocationKey,
  isCityWhereLocation,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsWhereApply({
  tripId,
  whereQuery,
  whereSelectedLocations,
  whereCityDayRanges,
  whereCityDayDrafts,
  getWhereCityDraftKey,
  displayStart,
  displayEnd,
  days,
  showInAppNotice,
  setWhereCityRangeError,
  setWhereModalOpen,
  setLocalDestination,
  setLocalLocations,
  setTitleDisplay,
  setServerItinerary,
  setLocationUpdateKey,
  setFriendlyDialog,
}) {
  return useCallback(() => {
    setWhereCityRangeError('');

    const pending = whereQuery.trim();
    const exactMatch = findExactWhereLocationMatch(pending);
    if (exactMatch && !isCityWhereLocation(exactMatch)) {
      showInAppNotice('Please select a city, not a country or province.', 'warning');
      return;
    }

    const list = pending
      ? [...whereSelectedLocations, { id: `where-new-${Date.now()}`, name: pending, country: undefined }]
      : whereSelectedLocations;
    const locationsStr = list.length > 0
      ? list.map((location) => (location.country ? `${location.name}, ${location.country}` : location.name)).join('; ')
      : '';
    const newDestination = list.length > 0 ? list[0].name : '';
    const newTitle = list.length > 0 ? `Trip to ${locationsStr || newDestination}` : 'Untitled trip';
    const totalDays = Math.max(1, getTripDayCount(displayStart, displayEnd) || days.length || 1);
    const fallbackRanges = buildWhereDefaultCityDayRanges(list, totalDays);
    let citySegments = [];

    if (list.length > 1) {
      citySegments = list.map((loc) => {
        const key = getWhereLocationKey(loc);
        const selected = whereCityDayRanges[key] || fallbackRanges[key] || { startDay: 1, endDay: totalDays };
        const startDraft = whereCityDayDrafts[getWhereCityDraftKey(loc, 'startDay')];
        const endDraft = whereCityDayDrafts[getWhereCityDraftKey(loc, 'endDay')];
        const startSource = startDraft !== undefined && startDraft !== '' ? startDraft : selected.startDay;
        const endSource = endDraft !== undefined && endDraft !== '' ? endDraft : selected.endDay;
        const startDay = Math.max(1, Math.min(totalDays, Number(startSource) || 1));
        const endDay = Math.max(1, Math.min(totalDays, Number(endSource) || totalDays));
        const locationLabel = getWhereLocationLabel(loc);
        return {
          city: String(loc.name || '').trim(),
          locationLabel,
          startDay: Math.min(startDay, endDay),
          endDay: Math.max(startDay, endDay),
        };
      }).sort((a, b) => a.startDay - b.startDay);
    } else if (list.length === 1) {
      citySegments = [{
        city: String(list[0]?.name || '').trim(),
        locationLabel: getWhereLocationLabel(list[0]),
        startDay: 1,
        endDay: totalDays,
      }];
    }

    setWhereModalOpen(false);
    setLocalDestination(newDestination);
    setLocalLocations(locationsStr);
    setTitleDisplay(newTitle);

    (async () => {
      try {
        const updated = await updateItinerary(tripId, {
          title: newTitle,
          destination: newDestination,
          locations: locationsStr,
          citySegments,
        });
        if (updated) setServerItinerary(updated);
        setLocationUpdateKey((prev) => prev + 1);
        toast.success('Changes saved', { id: 'trip-details-saved' });
      } catch (e) {
        console.error(e);
        setFriendlyDialog({
          open: true,
          title: 'Could not update destination',
          message: e?.message || 'Please try again.',
          showCancel: false,
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: null,
        });
      }
    })();
  }, [
    tripId,
    whereQuery,
    whereSelectedLocations,
    whereCityDayRanges,
    whereCityDayDrafts,
    getWhereCityDraftKey,
    displayStart,
    displayEnd,
    days,
    showInAppNotice,
    setWhereCityRangeError,
    setWhereModalOpen,
    setLocalDestination,
    setLocalLocations,
    setTitleDisplay,
    setServerItinerary,
    setLocationUpdateKey,
    setFriendlyDialog,
  ]);
}
