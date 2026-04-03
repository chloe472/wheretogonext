/**
 * Client-side location mismatch detection (aligned with backend socialImport.js).
 * Used when adding a place from Explore (or similar) to a trip with fixed destinations.
 */
import { splitRouteLocationLabel } from './tripDetailsPageHelpers';

export function inferCityFromFormattedAddress(formattedAddress) {
  const raw = String(formattedAddress || '').trim();
  if (!raw) return '';
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length < 2) return '';
  const first = parts[0];
  if (/^\d/.test(first)) return parts[1] || '';
  return parts[1] || '';
}

function primaryCityFromTripDestination(destination) {
  return String(destination || '').split(',')[0].trim();
}

function normalizeLocationKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function citiesRoughlyMatch(tripCity, placeCity) {
  const a = normalizeLocationKey(tripCity);
  const b = normalizeLocationKey(placeCity);
  if (!a || !b) return true;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

function tripCountryLabels(tripDestinations) {
  const out = [];
  const seen = new Set();
  (Array.isArray(tripDestinations) ? tripDestinations : []).forEach((entry) => {
    const label = String(entry || '').trim();
    if (!label) return;
    const { country } = splitRouteLocationLabel(label);
    const c = String(country || '').trim();
    if (!c) return;
    const key = normalizeLocationKey(c);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  });
  return out;
}

/**
 * One string to compare against trip cities/countries (city, country, or single region like "Japan").
 */
export function inferPlaceLocationLabel(locality, address) {
  const loc = String(locality || '').trim();
  if (loc) return loc;
  const addr = String(address || '').trim();
  if (!addr) return '';
  const parts = addr.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const fromFmt = inferCityFromFormattedAddress(addr);
  if (fromFmt) return fromFmt;
  return parts[parts.length - 1] || parts[0] || '';
}

/**
 * @param {Array<{ locality?: string, address?: string }>} places
 * @param {string[]} tripDestinationLabels full labels from getDestinationList(destination, locations)
 * @returns {object|null} same shape as backend locationInsight or null
 */
export function computeLocationInsight(places, tripDestinationLabels) {
  const tripDestinations = Array.isArray(tripDestinationLabels) ? tripDestinationLabels : [];
  const knownTripCities = tripDestinations
    .map((destination) => primaryCityFromTripDestination(destination))
    .filter(Boolean);
  if (knownTripCities.length === 0 || !Array.isArray(places) || places.length === 0) return null;

  const tripCountries = tripCountryLabels(tripDestinations);
  const mismatchLabels = [];

  for (const p of places) {
    const label = inferPlaceLocationLabel(p?.locality, p?.address);
    if (!label) continue;
    const matchesCity = knownTripCities.some((tc) => citiesRoughlyMatch(tc, label));
    const matchesCountry = tripCountries.length > 0 && tripCountries.some((c) => citiesRoughlyMatch(c, label));
    if (matchesCity || matchesCountry) continue;
    mismatchLabels.push(label);
  }

  if (mismatchLabels.length === 0) return null;

  const detectedLabel = mismatchLabels[0];
  const tripDisplay = knownTripCities.join(', ');
  const plural = mismatchLabels.length > 1;

  return {
    mismatch: true,
    tripDestinations: knownTripCities,
    detectedLabel,
    canAddDetectedDestination: true,
    message: plural
      ? `These places look like they're in ${detectedLabel}, not ${tripDisplay}. You can still add them to your itinerary below, or add ${detectedLabel} to your trip destinations if you're visiting both.`
      : `This place looks like it's in ${detectedLabel}, not ${tripDisplay}. You can still add it to your itinerary below, or add ${detectedLabel} to your trip destinations if you're visiting both.`,
  };
}
