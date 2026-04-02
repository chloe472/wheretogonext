/**
 * Place utilities for the "Add Places" flow.
 * All live place data is fetched automatically from the backend discovery API
 * (OpenStreetMap / Overpass) — no hardcoded place lists.
 * This file provides: map-centering helpers, place detail enrichment,
 * and address-suggestion utilities only.
 */

const PLACE_FILTER_TAGS = ['Hidden gem', 'Must go', 'Seen in 100+ plans'];
const PLACE_SORT_OPTIONS = ['Recommended', 'Rating: Low to High', 'Rating: High to Low'];

/**
 * Places are fetched live from the backend discovery API (OpenStreetMap / Overpass)
 * and work for any city worldwide automatically. This stub returns [] so callers
 * show the correct empty/error state rather than fake generated places.
 */
export function getPlacesForDestination(_destinationOrLocations, _options = {}) {
  return [];
}

/** Get default map center [lat, lng] for a destination string. */
export function getMapCenterForDestination(_destinationOrLocations) {
  return [20, 0];
}

function dedupeAddressSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const k = `${item.name || ''}__${item.address || ''}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Address suggestions for the custom-place form.
 * Always returns the typed query as a "Custom location" option at the
 * destination center so users can always pin any address manually.
 */
export function searchAddressSuggestions(destinationOrLocations, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const [fallbackLat, fallbackLng] = getMapCenterForDestination(destinationOrLocations);
  return dedupeAddressSuggestions([
    {
      id: `custom-${query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: query.trim(),
      address: 'Custom location',
      lat: fallbackLat,
      lng: fallbackLng,
      source: 'Custom location',
    },
  ]).slice(0, 8);
}

/**
 * Merge a backend-sourced place object with any locally available enrichment.
 * Works for both OSM-sourced places and manually-added custom places.
 */
export function getPlaceDetails(place) {
  if (!place) return null;
  const placeName = place.name || 'Place';
  return {
    ...place,
    overview:
      place.overview
      ?? place.description
      ?? `${placeName} is a notable destination worth visiting.`,
    address: place.address ?? placeName,
    hours: place.hours ?? place.openingHours ?? {},
    isOpenNow: place.isOpenNow ?? null,
    website: place.website ?? '',
    googleMapsReviewUrl:
      place.googleMapsReviewUrl
      ?? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`,
    nearbyPlaceIds: place.nearbyPlaceIds ?? [],
  };
}

/**
 * Get nearby places for a place from the provided pool (backend-sourced).
 * Falls back to the first 4 other places in the pool.
 */
export function getNearbyPlaces(place, _destinationOrLocations, allPlaces = []) {
  if (!place) return [];
  const nearbyIds = Array.isArray(place.nearbyPlaceIds) ? place.nearbyPlaceIds : [];
  if (nearbyIds.length > 0) {
    return nearbyIds
      .map((id) => allPlaces.find((p) => String(p.id) === String(id)))
      .filter(Boolean)
      .slice(0, 4);
  }
  return allPlaces
    .filter((p) => String(p.id) !== String(place.id))
    .slice(0, 4);
}

export { PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS };
