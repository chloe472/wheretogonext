import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import {
  analyzeScreenshot,
  extractPlaceNamesFromSocialCaption,
  inferLandmarkNameFromImage,
} from '../services/gemini.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';

const PLACES_SEARCH_TEXT_URL = 'https://places.googleapis.com/v1/places:searchText';
const NOMINATIM_SEARCH_URL = 'https://nominatim.openstreetmap.org/search';

const router = express.Router();

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'my', 'our', 'your',
  'this', 'that', 'these', 'those', 'video', 'reel', 'tiktok', 'instagram', 'youtube', 'pinterest', 'watch',
  'full', 'part', 'day', 'trip', 'travel', 'best', 'top',
]);

function capitalizeWords(str) {
  return String(str || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Extract up to ~8 place-name candidates from oEmbed text: hashtags, quotes, title-case phrases.
 */
function extractPlaceCandidatesFromLinkText(text) {
  const raw = String(text || '');
  const out = [];
  const seen = new Set();

  const add = (s) => {
    const t = String(s || '').trim();
    if (t.length < 2 || t.length > 120) return;
    const key = t.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  const hashtagMatches = raw.match(/#[\p{L}\d_]+/gu) || [];
  for (const h of hashtagMatches) {
    const inner = h.slice(1).replace(/_/g, ' ').trim();
    if (inner.length >= 2) add(capitalizeWords(inner));
  }

  const doubleQuoted = [...raw.matchAll(/"([^"]{2,120})"/g)];
  for (const m of doubleQuoted) add(capitalizeWords(m[1].trim()));

  const singleQuoted = [...raw.matchAll(/'([^']{2,120})'/g)];
  for (const m of singleQuoted) add(capitalizeWords(m[1].trim()));

  const tokens = raw.split(/[\s\n|•·,;]+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i += 1) {
    const cleaned = tokens[i].replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '');
    if (cleaned.length < 2) continue;
    const lower = cleaned.toLowerCase();
    if (STOP_WORDS.has(lower)) continue;

    const looksTitleCase = /^[\p{Lu}][\p{Ll}]{1,}$/u.test(cleaned) || /^[\p{Lu}]{2,}$/u.test(cleaned);
    if (looksTitleCase && cleaned.length >= 2) {
      add(cleaned);
      const next = tokens[i + 1]?.replace(/^[^\p{L}\d]+|[^\p{L}\d]+$/gu, '') || '';
      if (next.length >= 2 && /^[\p{Lu}]/.test(next) && !STOP_WORDS.has(next.toLowerCase())) {
        add(`${cleaned} ${next}`);
        i += 1;
      }
    }
  }

  return out.slice(0, 8);
}

function normalizeNameForDedupe(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function arePlaceNamesSimilar(a, b) {
  const x = normalizeNameForDedupe(a);
  const y = normalizeNameForDedupe(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.length >= 4 && y.length >= 4 && (x.includes(y) || y.includes(x))) return true;
  return false;
}

function photoMediaUrl(photoResourceName, apiKey) {
  if (!photoResourceName || !apiKey) return '';
  const base = `https://places.googleapis.com/v1/${photoResourceName}/media`;
  const q = new URLSearchParams({ maxHeightPx: '400', key: apiKey });
  return `${base}?${q.toString()}`;
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
function computeLocationInsight(places, tripDestination) {
  const tripCity = primaryCityFromTripDestination(tripDestination);
  if (!tripCity || !Array.isArray(places) || places.length === 0) return null;

  const mismatchLabels = [];
  for (const p of places) {
    const placeCity =
      String(p.locality || '').trim()
      || inferCityFromFormattedAddress(p.address || '');
    if (!placeCity) continue;
    if (citiesRoughlyMatch(tripCity, placeCity)) continue;
    mismatchLabels.push(placeCity);
  }

  if (mismatchLabels.length === 0) return null;

  const detectedLabel = mismatchLabels[0];
  const tripDisplay = tripCity;
  const plural = mismatchLabels.length > 1;

  return {
    mismatch: true,
    tripDestination: tripDestination,
    detectedLabel,
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

function mapGooglePlaceToRow(place, apiKey, idx) {
  const resourceName = place.name || '';
  const display = place.displayName?.text || place.displayName || '';
  const lat = place.location?.latitude ?? place.location?.lat;
  const lng = place.location?.longitude ?? place.location?.lng;
  const photoName = Array.isArray(place.photos) && place.photos[0]?.name ? place.photos[0].name : '';
  const image = photoMediaUrl(photoName, apiKey);
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
    _source: 'link',
  };
}

/**
 * For each candidate: Google Places Text Search, then Nominatim if Places misses or key missing.
 */
async function placesFromLinkText(linkText, destination, apiKey) {
  let candidates = extractPlaceCandidatesFromLinkText(linkText);
  if (!candidates.length && linkText.trim()) {
    const geminiPlaces = await extractPlaceNamesFromSocialCaption(linkText);
    candidates = geminiPlaces.slice(0, 8);
  }
  if (!candidates.length) return [];

  const seenIds = new Set();
  const rows = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const c = candidates[i];
    let row = null;

    if (apiKey) {
      const resolved = await searchTextTopPlaceWithDestinationFallback(c, apiKey, destination);
      if (resolved?.place?.name && !seenIds.has(resolved.place.name)) {
        seenIds.add(resolved.place.name);
        row = mapGooglePlaceToRow(resolved.place, apiKey, rows.length);
      }
    }

    if (!row) {
      const nom = await nominatimSearchTop(c);
      if (nom) {
        const dedupeKey = `nom-${nom.lat}-${nom.lng}`;
        if (!seenIds.has(dedupeKey)) {
          seenIds.add(dedupeKey);
          row = mapNominatimToPlaceRow(nom, rows.length);
        }
      }
    }

    if (row) rows.push(row);
  }

  return rows;
}

/**
 * Prefer link rows first (richer metadata), then screenshots; drop screenshot row if name similar to an existing row.
 */
function mergeLinkAndScreenshotPlaces(linkRows, screenshotRows) {
  const merged = [...linkRows.map((p) => {
    const { _source, ...rest } = p;
    void _source;
    return rest;
  })];

  for (const sp of screenshotRows) {
    if (merged.some((m) => arePlaceNamesSimilar(m.name, sp.name))) continue;
    merged.push(sp);
  }

  return merged;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 8 },
});

const headers = {
  'User-Agent': 'WhereToGoNext/1.0 (travel-planner; social-import)',
  Accept: 'application/json',
};

const BROWSER_FETCH_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function isTikTokCanonicalVideoOrPhotoUrl(u) {
  return /tiktok\.com\/@[^/]+\/(video|photo)\/\d+/i.test(String(u || ''));
}

function needsTikTokRedirectResolution(urlStr) {
  try {
    const u = new URL(String(urlStr).trim());
    const host = u.hostname.toLowerCase();
    if (host === 'vm.tiktok.com' || host === 'vt.tiktok.com') return true;
    if (host.endsWith('tiktok.com') && /^\/t\//i.test(u.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

async function resolveTikTokUrlForOembed(urlStr) {
  const trimmed = String(urlStr || '').trim().split('#')[0];
  if (!trimmed) return trimmed;
  if (isTikTokCanonicalVideoOrPhotoUrl(trimmed)) return trimmed;
  if (!trimmed.toLowerCase().includes('tiktok.com')) return trimmed;
  if (!needsTikTokRedirectResolution(trimmed)) return trimmed;

  let current = trimmed;
  for (let hop = 0; hop < 12; hop += 1) {
    try {
      const res = await fetch(current, {
        method: 'HEAD',
        redirect: 'manual',
        headers: BROWSER_FETCH_HEADERS,
        signal: AbortSignal.timeout(12000),
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) break;
        current = new URL(loc, current).href;
        if (isTikTokCanonicalVideoOrPhotoUrl(current)) return current.split('#')[0];
        continue;
      }
      if (res.status === 200) {
        const finalUrl = res.url || current;
        if (isTikTokCanonicalVideoOrPhotoUrl(finalUrl)) return finalUrl.split('#')[0];
        break;
      }
      break;
    } catch {
      break;
    }
  }
  return trimmed;
}

function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function oembedHtmlToPlainText(html) {
  return stripHtml(html);
}

async function fetchTiktokOembed(url) {
  const resolved = await resolveTikTokUrlForOembed(url);
  const u = `https://www.tiktok.com/oembed?url=${encodeURIComponent(resolved)}`;
  const res = await fetch(u, {
    headers: { ...headers, ...BROWSER_FETCH_HEADERS, Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchYoutubeOembed(url) {
  const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
  const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return null;
  return res.json();
}

async function fetchNoembed(url) {
  const u = `https://noembed.com/embed?url=${encodeURIComponent(url)}`;
  const res = await fetch(u, { headers, signal: AbortSignal.timeout(12000) });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Step A — oEmbed / noembed plain text for social URLs.
 */
async function collectLinkText(url) {
  if (!url || !/^https?:\/\//i.test(url)) return '';
  const lower = url.toLowerCase();
  let raw = null;

  if (lower.includes('tiktok.com')) {
    raw = await fetchTiktokOembed(url);
  } else if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    raw = await fetchYoutubeOembed(url);
  } else if (lower.includes('instagram.com') || lower.includes('pinterest.')) {
    raw = await fetchNoembed(url);
  } else {
    raw = await fetchNoembed(url);
  }

  if (!raw) return '';

  const title = String(raw.title || raw.html_title || '').trim();
  const author = String(raw.author_name || '').trim();
  const desc = stripHtml(String(raw.description || ''));
  const htmlFromEmbed = oembedHtmlToPlainText(raw.html);

  const parts = [title, author, desc, htmlFromEmbed].filter(Boolean);
  return parts.join(' \n ');
}

function locationToPlaceRow(loc, idx) {
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
  };
}

router.post('/analyze', upload.array('images', 8), async (req, res) => {
  try {
    const destination = String(req.body.destination || '').trim();
    const url = String(req.body.url || '').trim();
    const files = Array.isArray(req.files) ? req.files : [];

    if (!url && files.length === 0) {
      return res.status(400).json({ error: 'Provide a link or at least one image' });
    }

    if (files.length > 0 && !GEMINI_API_KEY) {
      return res.status(422).json({
        error: 'Image analysis requires GEMINI_API_KEY on the server.',
        code: 'LLM_REQUIRED',
      });
    }

    let linkText = '';
    if (url) {
      linkText = await collectLinkText(url);
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
                const enriched = mapGooglePlaceToRow(
                  resolved.place,
                  GOOGLE_PLACES_API_KEY,
                  screenshotPlaces.length,
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
              row = mapGooglePlaceToRow(place, GOOGLE_PLACES_API_KEY, screenshotPlaces.length);
              usedDestinationBias = bias;
              resolvedViaPlaces = true;
            }
          }

          if (!row) {
            const nom = await nominatimSearchTop(textSignal);
            if (nom) {
              row = mapNominatimToPlaceRow(nom, screenshotPlaces.length);
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

    let linkPlaces = [];
    const warningParts = [];

    if (url && linkText.trim()) {
      try {
        linkPlaces = await placesFromLinkText(linkText, destination, GOOGLE_PLACES_API_KEY || '');
      } catch (e) {
        console.warn('[social-import] link place search failed:', e?.message || e);
      }
      if (!GOOGLE_PLACES_API_KEY && linkPlaces.length === 0) {
        warningParts.push('Add GOOGLE_PLACES_API_KEY to .env for Google place suggestions from links.');
      }
    }

    const places = mergeLinkAndScreenshotPlaces(linkPlaces, screenshotPlacesClean);

    if (files.length > 0 && locations.length === 0) {
      warningParts.push(
        'No locations could be detected from screenshots. Check GEMINI_API_KEY and Generative Language API in Google Cloud; verify GOOGLE_PLACES_API_KEY and Places API (New) if using Google search; the server must be able to reach Google APIs and nominatim.openstreetmap.org.',
      );
    }
    if (url && files.length === 0 && places.length === 0 && linkText.trim() && destination && GOOGLE_PLACES_API_KEY) {
      warningParts.push('No locations matched from this link. Try hashtags or a clearer title in the post, or add screenshots.');
    }
    if (url && files.length === 0 && places.length === 0 && !linkText.trim()) {
      warningParts.push(
        'This link did not return caption text. Open the post in a browser and copy the full URL from the address bar (Share → Copy link).',
      );
    }

    const warning = warningParts.length ? warningParts.join(' ') : undefined;

    const locationInsight = computeLocationInsight(places, destination);

    return res.json({
      locations,
      linkText,
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
