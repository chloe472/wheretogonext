import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  analyzeScreenshot,
  inferLandmarkNameFromImage,
} from '../services/gemini.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const PLACES_SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

const router = express.Router();

async function photoMediaUrl(photoResourceName, apiKey) {
  if (!photoResourceName || !apiKey) return '';
  const base = `https://places.googleapis.com/v1/${photoResourceName}/media`;
  const q = new URLSearchParams({ maxHeightPx: '400', key: apiKey });
  const mediaUrl = `${base}?${q.toString()}`;

  try {
    const res = await fetch(mediaUrl, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return '';
    return res.url || '';
  } catch (error) {
    console.warn('[social-import] photo resolve failed:', error?.message || error);
    return '';
  }
}

function extractLocalityFromAddressComponents(place) {
  const comps = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
  for (const c of comps) {
    const types = c.types || [];
    if (types.includes('locality')) {
      return String(c.longText || c.shortText || '').trim();
    }
  }
  return '';
}

/**
 * Fallback when addressComponents missing: guess city segment from Google's formatted address.
 */
function inferCityFromFormattedAddress(formattedAddress) {
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

function parseTripDestinations(rawTripDestinations, fallbackDestination) {
  try {
    const parsed = JSON.parse(String(rawTripDestinations || '[]'));
    const list = Array.isArray(parsed) ? parsed : [];
    const cleaned = list
      .map((entry) => String(entry || '').trim())
      .filter(Boolean);
    if (cleaned.length > 0) return cleaned;
  } catch {
    // fall through to destination fallback
  }
  const fallback = String(fallbackDestination || '').trim();
  return fallback ? [fallback] : [];
}

function normalizeCityKey(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function citiesRoughlyMatch(tripCity, placeCity) {
  const a = normalizeCityKey(tripCity);
  const b = normalizeCityKey(placeCity);
  if (!a || !b) return true;
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

/**
 * When resolved places are in a different city than the trip destination, surface a banner + CTA.
 */
function computeLocationInsight(places, tripDestinations) {
  const knownTripCities = (Array.isArray(tripDestinations) ? tripDestinations : [])
    .map((destination) => primaryCityFromTripDestination(destination))
    .filter(Boolean);
  if (knownTripCities.length === 0 || !Array.isArray(places) || places.length === 0) return null;

  const mismatchLabels = [];
  for (const p of places) {
    const placeCity =
      String(p.locality || '').trim()
      || inferCityFromFormattedAddress(p.address || '');
    if (!placeCity) continue;
    if (knownTripCities.some((tripCity) => citiesRoughlyMatch(tripCity, placeCity))) continue;
    mismatchLabels.push(placeCity);
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

/**
 * One Text Search call; returns first place or null.
 */
async function searchTextTopPlace(textQuery, apiKey) {
  const res = await fetch(PLACES_SEARCH_TEXT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.displayName,places.formattedAddress,places.addressComponents,places.location,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify({
      textQuery,
      languageCode: 'en',
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn('[social-import] places:searchText failed', res.status, errText.slice(0, 200));
    return null;
  }

  const data = await res.json();
  if (data.error) {
    console.warn('[social-import] Places API error:', data.error?.message || data.error);
    return null;
  }
  const places = Array.isArray(data.places) ? data.places : [];
  return places[0] || null;
}

/**
 * Free geocoding fallback when Google Places Text Search returns nothing (wrong key, API not enabled, or no match).
 */
async function nominatimSearchTop(query) {
  const q = String(query || '').trim();
  if (q.length < 2) return null;
  const params = new URLSearchParams({ q, format: 'json', limit: '1' });
  try {
    const res = await fetch(`${NOMINATIM_SEARCH_URL}?${params}`, {
      headers: {
        'User-Agent': 'WhereToGoNext/1.0 (travel-planner; social-import)',
        Accept: 'application/json',
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) {
      console.warn('[social-import] Nominatim HTTP', res.status);
      return null;
    }
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;
    const hit = data[0];
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return {
      lat,
      lng,
      displayName: hit.display_name || q,
      address: String(hit.display_name || '').trim(),
    };
  } catch (e) {
    console.warn('[social-import] Nominatim error:', e?.message || e);
    return null;
  }
}

function mapNominatimToPlaceRow(hit, idx) {
  const addr = String(hit.address || '').trim();
  const name = String(hit.displayName || '').split(',')[0].trim().slice(0, 120) || 'Place';
  const locality = inferCityFromFormattedAddress(addr);
  return {
    id: `nominatim-${idx}-${hit.lat}-${hit.lng}`,
    name,
    address: addr,
    locality,
    lat: hit.lat,
    lng: hit.lng,
    rating: 0,
    reviewCount: 0,
    image: '',
  };
}

/**
 * Prefer unbiased search (place name / signal only). If no result, optionally
 * disambiguate with trip destination — avoids forcing e.g. "Moraine Lake" into Vancouver.
 */
async function searchTextTopPlaceWithDestinationFallback(textSignal, apiKey, destination) {
  const trimmed = String(textSignal || '').trim();
  if (!trimmed || !apiKey) return null;
  let place = await searchTextTopPlace(trimmed, apiKey);
  if (place?.name) return { place, usedDestinationBias: false };
  const dest = String(destination || '').trim();
  if (!dest) return null;
  place = await searchTextTopPlace(`${trimmed} ${dest}`.trim(), apiKey);
  if (place?.name) return { place, usedDestinationBias: true };
  return null;
}

async function mapGooglePlaceToRow(place, apiKey, idx, imageIndex = null) {
  const resourceName = place.name || '';
  const display = place.displayName?.text || place.displayName || '';
  const lat = place.location?.latitude ?? place.location?.lat;
  const lng = place.location?.longitude ?? place.location?.lng;
  const photoName = Array.isArray(place.photos) && place.photos[0]?.name ? place.photos[0].name : '';
  const image = await photoMediaUrl(photoName, apiKey);
  const reviewCount = place.userRatingCount ?? place.user_rating_count;
  const formatted = String(place.formattedAddress || place.formatted_address || '').trim();
  const locality =
    extractLocalityFromAddressComponents(place) || inferCityFromFormattedAddress(formatted);

  return {
    id: resourceName || `places-text-${idx}`,
    name: String(display || 'Unknown place').trim(),
    address: formatted,
    locality,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    rating: Number(place.rating || 0),
    reviewCount: Number(reviewCount ?? 0),
    image,
    imageIndex,
    _source: 'link',
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

function locationToPlaceRow(loc, idx, imageIndex = null) {
  const name = loc.location_name || `Place ${idx + 1}`;
  const lat = loc.latitude;
  const lng = loc.longitude;
  const idSuffix = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat}-${lng}` : `nocoord-${idx}`;
  const addr = loc.address || '';
  const locality =
    String(loc.city || '').trim() || inferCityFromFormattedAddress(addr);
  return {
    id: `social-import-${idx}-${idSuffix}`,
    name,
    address: addr,
    locality,
    lat,
    lng,
    rating: 0,
    reviewCount: 0,
    image: '',
    imageIndex,
  };
}

router.post('/analyze', upload.array('images', 8), async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const tripDestinations = parseTripDestinations(req.body.tripDestinations, destination);
    const files = Array.isArray(req.files) ? req.files : [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'Upload at least one image' });
    }

    if (files.length > 0 && !GEMINI_API_KEY) {
      return res.status(422).json({
        error: 'Image analysis requires GEMINI_API_KEY on the server.',
        code: 'LLM_REQUIRED',
      });
    }

    const locations = [];
    let skippedImages = 0;
    const tmpDir = os.tmpdir();

    const screenshotPlaces = [];

    for (let i = 0; i < files.length; i += 1) {
      const f = files[i];
      const ext = path.extname(f.originalname || '') || '.jpg';
      const safeExt = /^\.(jpe?g|png|gif|webp)$/i.test(ext) ? ext : '.jpg';
      const tempPath = path.join(tmpDir, `social-import-${randomUUID()}${safeExt}`);

      try {
        await fs.writeFile(tempPath, f.buffer);
        let result = await analyzeScreenshot(tempPath);

        let hasCoords =
          !result.has_error
          && result.latitude != null
          && result.longitude != null
          && Number.isFinite(Number(result.latitude))
          && Number.isFinite(Number(result.longitude));

        let primaryName = String(result.location_name || '').trim();
        let primaryAddr = String(result.address || '').trim();
        let textSignal = primaryName.length >= 2 ? primaryName : primaryAddr.length >= 3 ? primaryAddr : '';

        let landmarkSupplement = false;
        if (result.has_error || (!hasCoords && !textSignal)) {
          const guess = await inferLandmarkNameFromImage(tempPath);
          if (guess) {
            result = {
              ...result,
              has_error: false,
              location_name: guess,
              confidence: result.confidence || 'medium',
            };
            landmarkSupplement = true;
          }
        }

        if (result.has_error) {
          skippedImages += 1;
          continue;
        }

        hasCoords =
          result.latitude != null
          && result.longitude != null
          && Number.isFinite(Number(result.latitude))
          && Number.isFinite(Number(result.longitude));
        primaryName = String(result.location_name || '').trim();
        primaryAddr = String(result.address || '').trim();
        textSignal = primaryName.length >= 2 ? primaryName : primaryAddr.length >= 3 ? primaryAddr : '';

        if (hasCoords) {
          locations.push({
            location_name: result.location_name,
            address: result.address,
            latitude: result.latitude,
            longitude: result.longitude,
            confidence: result.confidence,
            imageIndex: i,
            google_maps_url: result.google_maps_url,
            street_view_url: result.street_view_url,
            city: result.city,
            country: result.country,
            resolvedViaPlaces: false,
            landmarkSupplement,
          });

          let uiRow = locationToPlaceRow(
            {
              location_name: result.location_name,
              address: result.address,
              latitude: result.latitude,
              longitude: result.longitude,
              city: result.city,
            },
            screenshotPlaces.length,
            i,
          );

          // Gemini coords path used to skip Places entirely → no photo URL. Enrich with Text Search for thumbnail.
          if (GOOGLE_PLACES_API_KEY && textSignal) {
            try {
              const resolved = await searchTextTopPlaceWithDestinationFallback(
                textSignal,
                GOOGLE_PLACES_API_KEY,
                destination,
              );
              if (resolved?.place?.name) {
                const enriched = await mapGooglePlaceToRow(
                  resolved.place,
                  GOOGLE_PLACES_API_KEY,
                  screenshotPlaces.length,
                  i,
                );
                const gLat = Number(result.latitude);
                const gLng = Number(result.longitude);
                uiRow = {
                  ...enriched,
                  lat: Number.isFinite(gLat) ? gLat : enriched.lat,
                  lng: Number.isFinite(gLng) ? gLng : enriched.lng,
                };
              }
            } catch (e) {
              console.warn('[social-import] hasCoords Places photo enrich failed:', e?.message || e);
            }
          }

          screenshotPlaces.push(uiRow);
          continue;
        }

        if (textSignal) {
          let row = null;
          let usedDestinationBias = false;
          let resolvedViaPlaces = false;
          let resolvedViaNominatim = false;

          if (GOOGLE_PLACES_API_KEY) {
            const resolved = await searchTextTopPlaceWithDestinationFallback(
              textSignal,
              GOOGLE_PLACES_API_KEY,
              destination,
            );
            if (resolved?.place?.name) {
              const { place, usedDestinationBias: bias } = resolved;
              row = await mapGooglePlaceToRow(place, GOOGLE_PLACES_API_KEY, screenshotPlaces.length, i);
              usedDestinationBias = bias;
              resolvedViaPlaces = true;
            }
          }

          if (!row) {
            const nom = await nominatimSearchTop(textSignal);
            if (nom) {
              row = { ...mapNominatimToPlaceRow(nom, screenshotPlaces.length), imageIndex: i };
              resolvedViaNominatim = true;
            }
          }

          if (row) {
            const lat = row.lat;
            const lng = row.lng;
            locations.push({
              location_name: primaryName || row.name,
              address: row.address || result.address,
              latitude: Number.isFinite(lat) ? lat : null,
              longitude: Number.isFinite(lng) ? lng : null,
              confidence: result.confidence,
              imageIndex: i,
              google_maps_url: result.google_maps_url,
              street_view_url: result.street_view_url,
              city: result.city,
              country: result.country,
              resolvedViaPlaces,
              resolvedViaPlacesDestinationBias: usedDestinationBias,
              resolvedViaNominatim,
              landmarkSupplement,
            });
            screenshotPlaces.push({ ...row, _source: 'screenshot-places' });
          } else {
            skippedImages += 1;
          }
        } else {
          skippedImages += 1;
        }
      } finally {
        try {
          await fs.unlink(tempPath);
        } catch {
          /* ignore */
        }
      }
    }

    const screenshotPlacesClean = screenshotPlaces.map((p) => {
      const { _source, ...rest } = p;
      void _source;
      return rest;
    });

    const warningParts = [];

    const places = screenshotPlacesClean;

    if (files.length > 0 && locations.length === 0) {
      warningParts.push(
        'No locations could be detected from screenshots. Check GEMINI_API_KEY and Generative Language API in Google Cloud; verify GOOGLE_PLACES_API_KEY and Places API (New) if using Google search; the server must be able to reach Google APIs and nominatim.openstreetmap.org.',
      );
    }
    const warning = warningParts.length ? warningParts.join(' ') : undefined;

    const locationInsight = computeLocationInsight(places, tripDestinations);

    return res.json({
      locations,
      skippedImages,
      destination: destination || undefined,
      places,
      locationInsight,
      warning,
    });
  } catch (error) {
    console.error('[social-import] analyze error:', error);
    return res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

export default router;
