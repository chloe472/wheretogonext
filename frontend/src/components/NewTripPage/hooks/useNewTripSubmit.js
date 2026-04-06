import { useCallback } from 'react';
import { createItinerary, fetchMyItineraries } from '../../../api/itinerariesApi';
import {
  resolveTypedLocation,
  getLocationKey,
  getLocationLabel,
  getTripDayCount,
  formatTripDates,
  extractItineraryId,
  waitForItineraryReadable,
  buildCitySegmentsForSubmit,
} from '../lib/newTripPageHelpers.js';

/**
 * Validates form state, creates the itinerary, navigates to the new trip, and applies router fallbacks.
 */
export function useNewTripSubmit({
  navigate,
  getPendingWhereQuery,
  selectedLocations,
  startDate,
  endDate,
  invitedEmails,
  cityPlanRows,
  cityDayRanges,
  cityDayDrafts,
  setDatesError,
  setSubmitError,
  setCityRangeError,
  setSubmitting,
}) {
  return useCallback(
    async (e) => {
      e.preventDefault();
      setDatesError('');
      setSubmitError('');
      setCityRangeError('');

      const pendingLocation = resolveTypedLocation(getPendingWhereQuery?.() ?? '');
      const allLocations = [...selectedLocations];
      if (pendingLocation) {
        const pendingKey = getLocationKey(pendingLocation);
        if (!allLocations.some((loc) => getLocationKey(loc) === pendingKey)) {
          allLocations.push(pendingLocation);
        }
      }
      if (allLocations.length === 0) {
        setSubmitError('Please add at least one destination.');
        return;
      }
      if (!startDate || !endDate) {
        setDatesError('Please select start and end dates for your trip.');
        return;
      }
      if (startDate > endDate) {
        setDatesError('End date must be on or after start date.');
        return;
      }
      const start = startDate;
      const end = endDate;
      const dayCount = getTripDayCount(start, end);
      if (dayCount <= 0) {
        setDatesError('Please select a valid date range.');
        return;
      }

      const segmentResult = buildCitySegmentsForSubmit(
        allLocations,
        dayCount,
        cityPlanRows,
        cityDayRanges,
        cityDayDrafts,
      );
      if (!segmentResult.ok) {
        setCityRangeError(segmentResult.error);
        return;
      }
      const citySegments = segmentResult.segments;

      const primaryLocation = allLocations[0];
      const title = getLocationLabel(primaryLocation);
      const locations = citySegments.map((seg) => seg.locationLabel).join('; ');
      const payload = {
        title: `Trip to ${title}`,
        overview: '',
        destination: primaryLocation.name,
        dates: formatTripDates(start, end),
        startDate: start,
        endDate: end,
        locations,
        placesSaved: 0,
        budget: '$0',
        budgetSpent: 0,
        travelers: 1 + (invitedEmails?.length || 0),
        collaborators: invitedEmails,
        status: 'Planning',
        statusClass: 'trip-card__status--planning',
        published: false,
        visibility: 'private',
        citySegments,
      };
      setSubmitting(true);
      try {
        const newItinerary = await createItinerary(payload);
        let id = extractItineraryId(newItinerary);
        if (!id) {
          const mine = await fetchMyItineraries();
          const sorted = [...mine].sort((a, b) => {
            const ta = new Date(a?.createdAt || 0).getTime();
            const tb = new Date(b?.createdAt || 0).getTime();
            return tb - ta;
          });
          id = extractItineraryId(sorted[0]);
        }
        if (!id) {
          throw new Error('Trip was created but could not open it automatically. Please refresh and open your latest trip.');
        }

        const hydrated = await waitForItineraryReadable(id);
        const nextPath = `/trip/${id}`;
        navigate(nextPath, {
          state: { preloadedItinerary: hydrated || newItinerary || null, fromCreateFlow: true },
          flushSync: true,
        });

        setTimeout(() => {
          if (typeof window === 'undefined' || typeof document === 'undefined') return;
          if (window.location.pathname !== nextPath) return;
          const stillOnNewTripView = Boolean(document.querySelector('.new-trip__main'));
          if (stillOnNewTripView) {
            window.location.assign(nextPath);
          }
        }, 220);
      } catch (err) {
        setSubmitError(err?.message || 'Could not create trip. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [
      navigate,
      getPendingWhereQuery,
      selectedLocations,
      startDate,
      endDate,
      invitedEmails,
      cityPlanRows,
      cityDayRanges,
      cityDayDrafts,
      setDatesError,
      setSubmitError,
      setCityRangeError,
      setSubmitting,
    ],
  );
}
