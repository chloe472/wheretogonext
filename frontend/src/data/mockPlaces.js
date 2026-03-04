/**
 * Place utilities for the "Add Places" flow.
 * All live place data is fetched automatically from the backend discovery API
 * (OpenStreetMap / Overpass) — no hardcoded place lists.
 * This file provides: map-centering helpers, place detail enrichment,
 * and address-suggestion utilities only.
 */

import { CITY_COORDINATES, getCoordinatesForLocation } from './cityCoordinates';

/** Default map center [lat, lng] used when cityCoordinates.js has no match. */
export const DEFAULT_MAP_CENTERS = {
  Paris: [48.8566, 2.3522],
  Tokyo: [35.6762, 139.6503],
  Seattle: [47.6062, -122.3321],
  Bali: [-8.4095, 115.1889],
  Calgary: [51.0447, -114.0719],
  'Kuala Lumpur': [3.139, 101.6869],
  Munich: [48.1351, 11.5820],
  Singapore: [1.3521, 103.8198],
  London: [51.5074, -0.1278],
  Bangkok: [13.7563, 100.5018],
  Dubai: [25.2048, 55.2708],
  Sydney: [-33.8688, 151.2093],
  Istanbul: [41.0082, 28.9784],
  Amsterdam: [52.3676, 4.9041],
  Barcelona: [41.3851, 2.1734],
  Rome: [41.9028, 12.4964],
  'New York': [40.7128, -74.0060],
  'Mexico City': [19.4326, -99.1332],
  Osaka: [34.6937, 135.5023],
};

const PLACE_FILTER_TAGS = ['Hidden gem', 'Must go', 'Seen in 100+ plans'];
const PLACE_SORT_OPTIONS = ['Recommended', 'Rating: Low to High', 'Rating: High to Low'];

/**
 * Normalize a destination string to a known key.
 * e.g. "Munich, Germany" -> "Munich", "7 days to Seattle" -> "Seattle"
 */
export function normalizeDestination(
  destinationOrLocations,
  keys = Object.keys(DEFAULT_MAP_CENTERS),
  fallbackKey = null,
) {
  if (!destinationOrLocations) return fallbackKey;
  const s = String(destinationOrLocations).trim();
  for (const key of keys) {
    if (s.toLowerCase().includes(key.toLowerCase())) return key;
  }
  const first = s.split(/[\s,]+/)[0];
  for (const key of keys) {
    if (key.toLowerCase().includes(first?.toLowerCase() || '')) return key;
  }
  return fallbackKey;
}

/**
 * Places are fetched live from the backend discovery API (OpenStreetMap / Overpass)
 * and work for any city worldwide automatically. This stub returns [] so callers
 * show the correct empty/error state rather than fake generated places.
 */
export function getPlacesForDestination(_destinationOrLocations, _options = {}) {
  return [];
}

/** Get default map center [lat, lng] for a destination string. */
export function getMapCenterForDestination(destinationOrLocations) {
  const coords = getCoordinatesForLocation(destinationOrLocations);
  // coords[0] === 48.8566 is the Paris default fallback in cityCoordinates.js
  if (coords && coords[0] !== 48.8566) {
    return coords;
  }
  const key = normalizeDestination(
    destinationOrLocations,
    Object.keys(DEFAULT_MAP_CENTERS),
    'Paris',
  );
  return DEFAULT_MAP_CENTERS[key] || coords || [48.8566, 2.3522];
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
