import { useMemo } from 'react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import { getMapCenterForDestination } from '../lib/tripDetailsLocationData';
import { DAY_COLOR_OPTIONS } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsMapData({
  discoveryData,
  tripExpenseItems,
  trip,
  days,
  locationUpdateKey,
  mapFilter,
  cityQuery,
  dayColors,
  selectedDestinations,
}) {
  const mapCenter = useMemo(() => {
    if (Array.isArray(discoveryData?.center) && discoveryData.center.length === 2) {
      return discoveryData.center;
    }
    const firstItem = tripExpenseItems.find((i) => i.lat != null && i.lng != null);
    if (firstItem) return [firstItem.lat, firstItem.lng];
    return getMapCenterForDestination(trip?.destination || trip?.locations);
  }, [discoveryData?.center, tripExpenseItems, locationUpdateKey, trip?.destination, trip?.locations]);

  const mapMarkers = useMemo(() => {
    const colorForDay = (dNum) => (
      dayColors[dNum]
      || DAY_COLOR_OPTIONS[((Number(dNum) - 1) % DAY_COLOR_OPTIONS.length + DAY_COLOR_OPTIONS.length) % DAY_COLOR_OPTIONS.length]
    );

    const tripItemMarkers = tripExpenseItems
      .filter((i) => i.lat != null && i.lng != null)
      .map((i) => {
        const day = days.find((d) => d.date === i.date);
        const dayNum = day?.dayNum ?? 1;
        return {
          id: i.id,
          name: i.name,
          lat: i.lat,
          lng: i.lng,
          dayNum,
          address: i.detail || '',
          color: colorForDay(dayNum),
          markerType: 'trip',
          website: i.externalLink || '',
        };
      });

    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const sourceFoods = Array.isArray(discoveryData?.foods) ? discoveryData.foods : [];
    const sourceExperiences = Array.isArray(discoveryData?.experiences) ? discoveryData.experiences : [];

    const toDiscoveryMarkers = (items, markerType, limit = 24) => items
      .filter((item) => item.lat != null && item.lng != null)
      .slice(0, limit)
      .map((item, idx) => ({
        id: `discovery-${markerType}-${item.id || idx}`,
        sourceId: item.id,
        markerType,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        dayNum: 1,
        color: colorForDay(1),
        address: item.address || cityQuery,
        rating: item.rating,
        reviewCount: item.reviewCount,
        overview: item.overview || item.description || '',
        image: resolveImageUrl(
          item.image,
          item.name,
          markerType === 'food' ? 'restaurant' : markerType === 'experience' ? 'activity' : 'landmark',
        ),
        website: item.website || '',
        originalData: item,
      }));

    const toBalancedDiscoveryMarkers = (items, markerType, limit = 36) => {
      const valid = items.filter((item) => item.lat != null && item.lng != null);
      if (selectedDestinations.length <= 1) {
        return toDiscoveryMarkers(valid, markerType, limit);
      }

      const groups = new Map();
      valid.forEach((item) => {
        const source = String(item?._sourceDestination || '').trim().toLowerCase();
        const key = source || '__unknown__';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      });

      const orderedKeys = selectedDestinations
        .map((name) => String(name || '').trim().toLowerCase())
        .filter((key, idx, arr) => key && arr.indexOf(key) === idx)
        .filter((key) => groups.has(key));

      groups.forEach((_, key) => {
        if (!orderedKeys.includes(key)) orderedKeys.push(key);
      });

      const merged = [];
      let cursor = 0;
      while (merged.length < limit) {
        let progressed = false;
        for (let i = 0; i < orderedKeys.length; i += 1) {
          const bucket = groups.get(orderedKeys[i]) || [];
          if (cursor < bucket.length) {
            merged.push(bucket[cursor]);
            progressed = true;
            if (merged.length >= limit) break;
          }
        }
        if (!progressed) break;
        cursor += 1;
      }

      return merged.map((item, idx) => ({
        id: `discovery-${markerType}-${item.id || idx}`,
        sourceId: item.id,
        markerType,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        dayNum: 1,
        color: colorForDay(1),
        address: item.address || cityQuery,
        rating: item.rating,
        reviewCount: item.reviewCount,
        overview: item.overview || item.description || '',
        image: resolveImageUrl(
          item.image,
          item.name,
          markerType === 'food' ? 'restaurant' : markerType === 'experience' ? 'activity' : 'landmark',
        ),
        website: item.website || '',
        originalData: item,
      }));
    };

    const placeMarkers = toBalancedDiscoveryMarkers(sourcePlaces, 'place', 48);
    const foodMarkers = toDiscoveryMarkers(sourceFoods, 'food', 24);
    const experienceMarkers = toDiscoveryMarkers(sourceExperiences, 'experience', 30);

    const destinationMarkers = selectedDestinations
      .map((label, idx) => {
        const [lat, lng] = getMapCenterForDestination(label);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        return {
          id: `destination-${String(label).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${idx}`,
          markerType: 'trip',
          name: label,
          lat,
          lng,
          dayNum: 1,
          color: colorForDay(1),
          address: label,
          website: '',
        };
      })
      .filter(Boolean);

    const destinationMarkerByCoord = new Map();
    destinationMarkers.forEach((marker) => {
      const key = `${Number(marker.lat).toFixed(4)},${Number(marker.lng).toFixed(4)}`;
      if (!destinationMarkerByCoord.has(key)) destinationMarkerByCoord.set(key, marker);
    });
    const dedupedDestinationMarkers = Array.from(destinationMarkerByCoord.values());

    if (mapFilter === 'Food & Beverages') return foodMarkers;
    if (mapFilter === 'Experiences') return experienceMarkers;
    if (mapFilter === 'My Trip') return tripItemMarkers.length > 0 ? tripItemMarkers : dedupedDestinationMarkers;

    const baseDefaultMarkers = placeMarkers.length > 0 ? placeMarkers : tripItemMarkers;
    if (dedupedDestinationMarkers.length === 0) return baseDefaultMarkers;

    const seenCoords = new Set(baseDefaultMarkers.map((marker) => `${Number(marker.lat).toFixed(4)},${Number(marker.lng).toFixed(4)}`));
    const missingDestinationMarkers = dedupedDestinationMarkers.filter(
      (marker) => !seenCoords.has(`${Number(marker.lat).toFixed(4)},${Number(marker.lng).toFixed(4)}`),
    );
    return [...baseDefaultMarkers, ...missingDestinationMarkers];
  }, [
    tripExpenseItems,
    days,
    discoveryData?.places,
    discoveryData?.foods,
    discoveryData?.experiences,
    mapFilter,
    cityQuery,
    dayColors,
    selectedDestinations,
  ]);

  return { mapCenter, mapMarkers };
}
