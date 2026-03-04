import express from 'express';

const router = express.Router();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/api.php';
const WIKIDATA_ENTITY_URL = 'https://www.wikidata.org/w/api.php';

const headers = {
  'User-Agent': 'WhereToGoNext/1.0 (travel-planner)',
  'Accept-Language': 'en',
};

const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_CACHE = new Map();
const IMAGE_RESOLVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const IMAGE_RESOLVE_CACHE = new Map();
const WIKI_SUMMARY_CACHE = new Map();

function getTimedCache(map, key, ttlMs) {
  const hit = map.get(key);
  if (!hit) return null;
  if (Date.now() - hit.createdAt > ttlMs) {
    map.delete(key);
    return null;
  }
  return hit.value;
}

function setTimedCache(map, key, value) {
  map.set(key, { value, createdAt: Date.now() });
}

function slugifyTitle(value = '') {
  return String(value)
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[?#]/g, '');
}

function parseDestination(input = '') {
  const raw = String(input).trim();
  if (!raw) return '';
  const pieces = raw.split(';').map((s) => s.trim()).filter(Boolean);
  const first = pieces[0] || raw;
  return first.split(',')[0].trim();
}

function cacheKey(destination, limit) {
  return `${String(destination || '').toLowerCase()}::${Number(limit) || 24}`;
}

function getCached(key) {
  const hit = DISCOVERY_CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.createdAt > DISCOVERY_CACHE_TTL_MS) {
    DISCOVERY_CACHE.delete(key);
    return null;
  }
  return hit.value;
}

function setCached(key, value) {
  DISCOVERY_CACHE.set(key, { value, createdAt: Date.now() });
}

function getStaleByDestination(destination) {
  const prefix = `${String(destination || '').toLowerCase()}::`;
  for (const [key, entry] of DISCOVERY_CACHE.entries()) {
    if (key.startsWith(prefix)) return entry.value;
  }
  return null;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLowQualityName(name = '') {
  const normalized = String(name || '').trim();
  if (!normalized) return true;
  if (normalized.length < 3) return true;
  if (/^[:;,.()\-\s]+$/.test(normalized)) return true;
  if (/^\(.+\)$/.test(normalized)) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (/abandoned\s+car/i.test(normalized)) return true;
  if (/^unknown$/i.test(normalized)) return true;
  return false;
}

function isDisambiguationText(text = '') {
  const value = String(text || '').toLowerCase();
  return value.includes('may refer to:') || value.includes('may refer to');
}

function scoreElement(item, centerLat, centerLon) {
  let score = 0;
  if (!isLowQualityName(item.name)) score += 10;
  if (item.website) score += 3;
  if (item.phone) score += 2;
  if (item.address && item.address.length > 8) score += 2;

  const distanceKm = haversineKm(centerLat, centerLon, item.lat, item.lng);
  if (distanceKm < 3) score += 7;
  else if (distanceKm < 8) score += 5;
  else if (distanceKm < 15) score += 3;
  else if (distanceKm < 25) score += 1;

  if (item.category === 'place') {
    if (item.tourismType === 'museum' || item.tourismType === 'attraction') score += 3;
    if (item.tourismType === 'viewpoint' || item.tourismType === 'monument') score += 2;
  }

  if (item.category === 'food') {
    if (item.amenityType === 'restaurant' || item.amenityType === 'cafe') score += 3;
    if (item.tags?.opening_hours) score += 2;
  }

  return score;
}

async function geocodeDestination(destination) {
  const query = new URLSearchParams({
    q: destination,
    format: 'jsonv2',
    addressdetails: '1',
    limit: '1',
  });

  const res = await fetch(`${NOMINATIM_URL}?${query.toString()}`, { headers });
  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`No geocoding result for ${destination}`);
  }

  const hit = data[0];
  return {
    lat: Number(hit.lat),
    lon: Number(hit.lon),
    name: hit.display_name,
    osmId: hit.osm_id,
  };
}

async function fetchOverpassAround(lat, lon, radius = 18000) {
  const query = `
[out:json][timeout:25];
(
  node(around:${radius},${lat},${lon})["tourism"~"attraction|museum|gallery|theme_park|zoo|viewpoint|monument"];
  way(around:${radius},${lat},${lon})["tourism"~"attraction|museum|gallery|theme_park|zoo|viewpoint|monument"];
  node(around:${radius},${lat},${lon})["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court"];
  way(around:${radius},${lat},${lon})["amenity"~"restaurant|cafe|bar|pub|fast_food|food_court"];
);
out center tags;
`;

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'text/plain',
    },
    body: query,
  });

  if (!res.ok) {
    throw new Error(`Overpass failed: ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data.elements) ? data.elements : [];
}

function normalizeElement(el, destinationName) {
  const tags = el.tags || {};
  const lat = Number(el.lat ?? el.center?.lat);
  const lng = Number(el.lon ?? el.center?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const tourismType = tags.tourism;
  const amenityType = tags.amenity;
  const category = tourismType ? 'place' : amenityType ? 'food' : 'other';

  const hasNonLatin = (value = '') => /[^\u0000-\u024f\s0-9.,'’&()\-/:]/.test(String(value || ''));

  const name = (
    tags['name:en']
    || tags['official_name:en']
    || tags['name:latin']
    || tags.int_name
    || tags['alt_name:en']
    || tags.name
    || tags.official_name
  );
  if (!name) return null;
  if (isLowQualityName(name)) return null;

  const rawAddress = [
    tags['addr:housenumber'],
    tags['addr:street:en'] || tags['addr:street'],
    tags['addr:city:en'] || tags['addr:city'] || destinationName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const address = (!rawAddress || hasNonLatin(rawAddress))
    ? destinationName
    : rawAddress;

  const website = tags.website || tags['contact:website'] || '';
  const phone = tags.phone || tags['contact:phone'] || '';

  return {
    id: `osm-${el.type}-${el.id}`,
    osmType: el.type,
    osmId: el.id,
    name,
    lat,
    lng,
    address: address || destinationName,
    website,
    phone,
    tourismType: tourismType || null,
    amenityType: amenityType || null,
    category,
    tags,
  };
}

function sortByName(a, b) {
  return a.name.localeCompare(b.name);
}

function uniqueByName(items = []) {
  const seen = new Set();
  const out = [];
  for (const it of items) {
    const k = `${it.name.toLowerCase()}|${Math.round(it.lat * 1000)}|${Math.round(it.lng * 1000)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function toPriceLevel(amenityType) {
  if (amenityType === 'fast_food' || amenityType === 'food_court') return '$';
  if (amenityType === 'cafe' || amenityType === 'pub' || amenityType === 'bar') return '$$';
  return '$$$';
}

function toDietary(tags = {}) {
  const values = [];
  if (tags['diet:vegetarian'] === 'yes') values.push('Vegetarian');
  if (tags['diet:vegan'] === 'yes') values.push('Vegan');
  if (tags['diet:gluten_free'] === 'yes') values.push('Gluten-free');
  if (tags['diet:halal'] === 'yes') values.push('Halal');
  if (tags['diet:kosher'] === 'yes') values.push('Kosher');
  return values;
}

function inferPlaceType(tourismType) {
  const map = {
    museum: 'Museum',
    gallery: 'Gallery',
    viewpoint: 'Scenic Spot',
    theme_park: 'Theme Park',
    zoo: 'Zoo',
    monument: 'Landmark',
    attraction: 'Attraction',
  };
  return map[tourismType] || 'Attraction';
}

function inferExperienceType(tourismType) {
  if (tourismType === 'museum' || tourismType === 'gallery') return 'Cultural Tours';
  if (tourismType === 'theme_park' || tourismType === 'zoo') return 'Attraction Tickets';
  if (tourismType === 'viewpoint' || tourismType === 'monument') return 'Guided Tours';
  return 'Day Trips';
}

function inferDurationHours(tourismType) {
  const normalized = String(tourismType || '').toLowerCase();
  if (normalized.includes('theme') || normalized.includes('zoo')) return 6;
  if (normalized.includes('museum') || normalized.includes('gallery')) return 3;
  if (normalized.includes('view') || normalized.includes('scenic')) return 2;
  return 4;
}

function parseOpeningHours(raw = '') {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (value === '24/7') {
    return {
      Monday: 'Open 24 hours',
      Tuesday: 'Open 24 hours',
      Wednesday: 'Open 24 hours',
      Thursday: 'Open 24 hours',
      Friday: 'Open 24 hours',
      Saturday: 'Open 24 hours',
      Sunday: 'Open 24 hours',
    };
  }

  const dayMap = {
    Mo: 'Monday',
    Tu: 'Tuesday',
    We: 'Wednesday',
    Th: 'Thursday',
    Fr: 'Friday',
    Sa: 'Saturday',
    Su: 'Sunday',
  };
  const order = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const result = {};

  value.split(';').map((part) => part.trim()).filter(Boolean).forEach((entry) => {
    const match = entry.match(/^([A-Za-z]{2})(?:-([A-Za-z]{2}))?\s+(.+)$/);
    if (!match) return;
    const [, startDay, endDay, hours] = match;
    if (!dayMap[startDay]) return;
    const startIndex = order.indexOf(startDay);
    const endIndex = endDay ? order.indexOf(endDay) : startIndex;
    if (startIndex === -1 || endIndex === -1) return;

    if (startIndex <= endIndex) {
      for (let idx = startIndex; idx <= endIndex; idx += 1) {
        result[dayMap[order[idx]]] = hours;
      }
    } else {
      for (let idx = startIndex; idx < order.length; idx += 1) {
        result[dayMap[order[idx]]] = hours;
      }
      for (let idx = 0; idx <= endIndex; idx += 1) {
        result[dayMap[order[idx]]] = hours;
      }
    }
  });

  return Object.keys(result).length > 0 ? result : { Hours: value };
}

function buildWhyVisit(place = {}, destination = '') {
  const reasons = [];
  if (place.type) reasons.push(`${place.type} experience in ${destination}`.trim());
  if (place.website) reasons.push('Official website available for up-to-date visitor information');
  if (place.rating >= 4.5) reasons.push('Strong visitor ratings from recent travelers');
  if (place.estimatedDuration) reasons.push(`Easy to fit into your day (${place.estimatedDuration})`);
  if (place.tags?.length) reasons.push(`Highlights include ${place.tags.slice(0, 2).join(' and ')}`);
  return reasons.slice(0, 4);
}

function buildWhySkip(place = {}) {
  const reasons = [];
  if (!place.website) reasons.push('Limited official visitor information online');
  if (!place.phone) reasons.push('No public phone contact listed');
  if (!place.openingHoursRaw) reasons.push('Opening hours may vary and should be verified before visiting');
  if (!place.reviewCount || place.reviewCount < 80) reasons.push('Fewer public reviews than top attractions nearby');
  return reasons.slice(0, 3);
}

function fallbackImage(seed, topic = 'travel') {
  const normalizedSeed = encodeURIComponent(`${topic}-${String(seed || 'place').toLowerCase()}`);
  return `https://picsum.photos/seed/${normalizedSeed}/800/520`;
}

function commonsFileUrl(fileName, width = 900) {
  if (!fileName) return '';
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName)}?width=${width}`;
}

function parseWikipediaTag(value = '') {
  const tag = String(value || '').trim();
  if (!tag) return '';

  if (tag.startsWith('http://') || tag.startsWith('https://')) {
    const marker = '/wiki/';
    const idx = tag.indexOf(marker);
    if (idx >= 0) return decodeURIComponent(tag.slice(idx + marker.length)).trim();
    return '';
  }

  const colonIndex = tag.indexOf(':');
  if (colonIndex > 0) {
    return tag.slice(colonIndex + 1).trim();
  }
  return tag;
}

function parseWikidataTag(value = '') {
  const raw = String(value || '').trim();
  const match = raw.match(/Q\d+/i);
  return match ? match[0].toUpperCase() : '';
}

function parseCommonsFileTag(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const normalized = raw.replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\//i, '').trim();
  if (/^File:/i.test(normalized)) return normalized.replace(/^File:/i, '').trim();
  return '';
}

function tokenizeForMatch(value = '') {
  const stopwords = new Set(['the', 'a', 'an', 'of', 'in', 'at', 'de', 'la', 'le', 'du', 'des', 'and', 'for']);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2 && !stopwords.has(t));
}

function computeNameMatchScore(placeName = '', candidateTitle = '', candidateSnippet = '') {
  const placeTokens = tokenizeForMatch(placeName);
  const titleTokens = tokenizeForMatch(candidateTitle);
  const snippetTokens = tokenizeForMatch(candidateSnippet);
  if (placeTokens.length === 0 || (titleTokens.length === 0 && snippetTokens.length === 0)) return 0;

  const titleSet = new Set(titleTokens);
  const snippetSet = new Set(snippetTokens);
  let titleHits = 0;
  let snippetHits = 0;

  placeTokens.forEach((token) => {
    if (titleSet.has(token)) titleHits += 1;
    if (snippetSet.has(token)) snippetHits += 1;
  });

  const titleRatio = titleHits / placeTokens.length;
  const snippetRatio = snippetHits / placeTokens.length;

  const normalizedPlace = placeTokens.join(' ');
  const normalizedTitle = titleTokens.join(' ');
  const fullContainmentBoost = normalizedTitle.includes(normalizedPlace) || normalizedPlace.includes(normalizedTitle)
    ? 0.2
    : 0;

  return Math.min(1, titleRatio * 0.75 + snippetRatio * 0.25 + fullContainmentBoost);
}

async function fetchWikipediaSummary(title = '', expectedName = '') {
  const normalizedTitle = String(title || '').trim().replace(/\s+/g, '_');
  if (!normalizedTitle) return null;

  const cacheKey = normalizedTitle.toLowerCase();
  const cached = getTimedCache(WIKI_SUMMARY_CACHE, cacheKey, IMAGE_RESOLVE_CACHE_TTL_MS);
  if (cached) return cached;

  try {
    const res = await fetch(`${WIKI_SUMMARY_URL}/${encodeURIComponent(normalizedTitle)}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    if (isDisambiguationText(data?.extract)) return null;
    const result = {
      image: data?.thumbnail?.source || '',
      extract: data?.extract || '',
      wikiUrl: data?.content_urls?.desktop?.page || '',
      title: data?.title || normalizedTitle,
    };
    if (expectedName) {
      const score = computeNameMatchScore(expectedName, result.title, result.extract);
      if (score < 0.45) return null;
    }
    setTimedCache(WIKI_SUMMARY_CACHE, cacheKey, result);
    return result;
  } catch {
    return null;
  }
}

async function fetchWikipediaSummaryBySearch(name = '', destinationHint = '') {
  const queryText = [String(name || '').trim(), String(destinationHint || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (!queryText) return null;

  const cacheKey = `search::${queryText.toLowerCase()}`;
  const cached = getTimedCache(WIKI_SUMMARY_CACHE, cacheKey, IMAGE_RESOLVE_CACHE_TTL_MS);
  if (cached) return cached;

  try {
    const query = new URLSearchParams({
      action: 'query',
      format: 'json',
      list: 'search',
      srsearch: queryText,
      srlimit: '6',
      srnamespace: '0',
      origin: '*',
    });
    const res = await fetch(`${WIKI_SEARCH_URL}?${query.toString()}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const candidates = Array.isArray(data?.query?.search) ? data.query.search : [];
    if (candidates.length === 0) return null;

    const ranked = candidates
      .map((candidate) => ({
        title: candidate?.title || '',
        snippet: String(candidate?.snippet || '').replace(/<[^>]*>/g, ' '),
        score: computeNameMatchScore(name, candidate?.title || '', candidate?.snippet || ''),
      }))
      .sort((a, b) => b.score - a.score);

    const best = ranked[0];
    if (!best?.title || best.score < 0.5) return null;

    const summary = await fetchWikipediaSummary(best.title, name);
    if (!summary?.image) return null;
    setTimedCache(WIKI_SUMMARY_CACHE, cacheKey, summary);
    return summary;
  } catch {
    return null;
  }
}

async function fetchWikidataImageByQid(qid = '') {
  const id = parseWikidataTag(qid);
  if (!id) return null;

  try {
    const query = new URLSearchParams({
      action: 'wbgetentities',
      format: 'json',
      ids: id,
      props: 'claims|sitelinks',
      languages: 'en',
    });
    const res = await fetch(`${WIKIDATA_ENTITY_URL}?${query.toString()}`, { headers });
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data?.entities?.[id];
    if (!entity) return null;

    const imageFile = entity?.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
    const enwikiTitle = entity?.sitelinks?.enwiki?.title;

    return {
      image: imageFile ? commonsFileUrl(imageFile) : '',
      wikiTitle: enwikiTitle || '',
      wikiUrl: enwikiTitle ? `https://en.wikipedia.org/wiki/${encodeURIComponent(enwikiTitle.replace(/\s+/g, '_'))}` : '',
    };
  } catch {
    return null;
  }
}

async function resolveOpenDataPhoto(item = {}) {
  const cacheKey = `${item.osmType || 'x'}:${item.osmId || item.id || item.name || ''}`;
  const cached = getTimedCache(IMAGE_RESOLVE_CACHE, cacheKey, IMAGE_RESOLVE_CACHE_TTL_MS);
  if (cached) return cached;

  const tags = item.tags || {};
  let image = '';
  let wikiUrl = '';
  let extract = '';

  const directTagImage = String(tags.image || '').trim();
  if (/^https?:\/\//i.test(directTagImage)) {
    image = directTagImage;
  }

  if (!image) {
    const commonsFile = parseCommonsFileTag(tags.wikimedia_commons || tags.wikimedia || '');
    if (commonsFile) {
      image = commonsFileUrl(commonsFile);
    }
  }

  let wikiTitle = parseWikipediaTag(tags.wikipedia || item.wikipediaTag || '');
  if (!image) {
    const wikidata = parseWikidataTag(tags.wikidata || item.wikidataTag || '');
    if (wikidata) {
      const wikidataHit = await fetchWikidataImageByQid(wikidata);
      if (wikidataHit?.image) image = wikidataHit.image;
      if (!wikiTitle && wikidataHit?.wikiTitle) wikiTitle = wikidataHit.wikiTitle;
      if (!wikiUrl && wikidataHit?.wikiUrl) wikiUrl = wikidataHit.wikiUrl;
    }
  }

  const summary = wikiTitle
    ? await fetchWikipediaSummary(wikiTitle)
    : await fetchWikipediaSummaryBySearch(item.name || '', item.address || '');
  if (!image && summary?.image) image = summary.image;
  if (!wikiUrl && summary?.wikiUrl) wikiUrl = summary.wikiUrl;
  if (summary?.extract) extract = summary.extract;

  if (!image) {
    const searchSummary = await fetchWikipediaSummaryBySearch(item.name || '', item.address || '');
    if (searchSummary?.image) image = searchSummary.image;
    if (!wikiUrl && searchSummary?.wikiUrl) wikiUrl = searchSummary.wikiUrl;
    if (!extract && searchSummary?.extract) extract = searchSummary.extract;
  }

  const value = { image, wikiUrl, extract };
  setTimedCache(IMAGE_RESOLVE_CACHE, cacheKey, value);
  return value;
}

async function enrichWithWikipedia(items, max = 8, topic = 'travel') {
  const subset = items.slice(0, max);
  const enriched = await Promise.all(
    subset.map(async (item) => {
      try {
        const resolved = await resolveOpenDataPhoto(item);
        return {
          ...item,
          description: resolved.extract || item.description,
          image: resolved.image || item.image || fallbackImage(item.name, topic),
          wikiUrl: resolved.wikiUrl || item.wikiUrl || '',
        };
      } catch {
        return {
          ...item,
          image: item.image || fallbackImage(item.name, topic),
        };
      }
    }),
  );

  return [
    ...enriched,
    ...items.slice(max).map((item) => ({
      ...item,
      image: item.image || fallbackImage(item.name, topic),
    })),
  ];
}

function buildCommunityItineraries(destination, places) {
  const top = places.slice(0, 15);
  if (top.length === 0) return [];

  const itineraries = [
    {
      id: `community-${destination.toLowerCase().replace(/\s+/g, '-')}-1`,
      title: `${destination} Highlights in 3 Days`,
      creator: 'Local Explorer',
      type: 'City Highlights',
      duration: '3 days',
      image: top[0]?.image || fallbackImage(destination, 'city'),
      price: 0,
      currency: 'USD',
      likes: 120,
      places: top.slice(0, 9).map((p) => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
      })),
    },
    {
      id: `community-${destination.toLowerCase().replace(/\s+/g, '-')}-2`,
      title: `${destination} Culture & Food Route`,
      creator: 'Food + Culture Crew',
      type: 'Foodie',
      duration: '2 days',
      image: top[1]?.image || fallbackImage(destination, 'food'),
      price: 0,
      currency: 'USD',
      likes: 84,
      places: top.slice(3, 10).map((p) => ({
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        address: p.address,
      })),
    },
  ];

  return itineraries;
}

router.get('/destination', async (req, res) => {
  try {
    const destinationRaw = req.query.destination;
    const limitRaw = Number(req.query.limit || 24);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 6), 50) : 24;

    const destination = parseDestination(destinationRaw);
    if (!destination) {
      return res.status(400).json({ error: 'destination query is required' });
    }

    const key = cacheKey(destination, limit);
    const cached = getCached(key);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const geo = await geocodeDestination(destination);
    const overpassElements = await fetchOverpassAround(geo.lat, geo.lon, 18000);
    const normalized = uniqueByName(
      overpassElements
        .map((el) => normalizeElement(el, destination))
        .filter(Boolean),
    );

    const ranked = normalized
      .map((item) => ({
        ...item,
        score: scoreElement(item, geo.lat, geo.lon),
      }))
      .filter((item) => item.score >= 9)
      .sort((a, b) => b.score - a.score);

    const placeBase = ranked
      .filter((it) => it.category === 'place')
      .slice(0, limit)
      .map((it, idx) => ({
        id: it.id,
        osmType: it.osmType,
        osmId: it.osmId,
        name: it.name,
        type: inferPlaceType(it.tourismType),
        rating: Number((4 + ((idx % 8) * 0.1)).toFixed(1)),
        reviewCount: 120 + idx * 17,
        lat: it.lat,
        lng: it.lng,
        address: it.address,
        description: `${it.name} in ${destination}`,
        image: '',
        website: it.website,
        phone: it.phone,
        openingHoursRaw: it.tags?.opening_hours || '',
        openingHours: it.tags?.opening_hours || 'Check official website',
        estimatedDuration: inferDurationHours(it.tourismType) >= 4 ? 'Half day' : '2-3 hours',
        tags: [inferPlaceType(it.tourismType), destination],
        wikipediaTag: it.tags?.wikipedia || '',
        wikidataTag: it.tags?.wikidata || '',
        rawTags: it.tags || {},
      }));

    const foodBase = ranked
      .filter((it) => it.category === 'food')
      .slice(0, limit)
      .map((it, idx) => ({
        id: it.id,
        osmType: it.osmType,
        osmId: it.osmId,
        name: it.name,
        rating: Number((4 + ((idx % 7) * 0.1)).toFixed(1)),
        reviewCount: 70 + idx * 11,
        lat: it.lat,
        lng: it.lng,
        address: it.address,
        image: '',
        cuisine: it.tags?.cuisine || 'Local cuisine',
        priceLevel: toPriceLevel(it.amenityType),
        dietaryTags: toDietary(it.tags),
        openingHours: it.tags?.opening_hours || 'Check venue listing',
        description: `${it.name} in ${destination}`,
        website: it.website,
        phone: it.phone,
        wikipediaTag: it.tags?.wikipedia || '',
        wikidataTag: it.tags?.wikidata || '',
        rawTags: it.tags || {},
      }));

    const places = (await enrichWithWikipedia(placeBase.map((place) => ({
      ...place,
      tags: place.rawTags || {},
    })), 14, 'landmark')).map((place) => {
      const hours = parseOpeningHours(place.openingHoursRaw);
      const overview = place.description || `${place.name} is a notable attraction in ${destination}.`;
      return {
        ...place,
        image: place.image || fallbackImage(place.name, 'landmark'),
        description: overview,
        overview,
        hours,
        isOpenNow: place.openingHoursRaw === '24/7' ? true : null,
        whyVisit: buildWhyVisit(place, destination),
        whySkip: buildWhySkip(place),
        googleMapsReviewUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${place.name} ${place.address || destination}`)}`,
        rawTags: undefined,
      };
    });
    const foods = (await enrichWithWikipedia(foodBase.map((food) => ({
      ...food,
      tags: food.rawTags || {},
    })), 12, 'restaurant')).map((food) => ({
      ...food,
      image: food.image || fallbackImage(food.name, 'restaurant'),
      rawTags: undefined,
    }));

    const experiences = places.slice(0, Math.min(10, places.length)).map((p, idx) => {
      const durationHours = inferDurationHours(p.type);
      const basePrice = 25 + idx * 12;
      return {
        id: `exp-${p.id}`,
        name: `${p.name} Experience`,
        type: inferExperienceType((p.type || '').toLowerCase()),
        duration: `${durationHours} hours`,
        durationHours,
        rating: p.rating,
        reviewCount: p.reviewCount,
        price: basePrice,
        currency: 'USD',
        lat: p.lat,
        lng: p.lng,
        image: p.image,
        address: p.address,
        description: p.description || `Experience ${p.name}`,
        highlights: [
          `Visit ${p.name}`,
          'Local guide insights',
          'Flexible schedule options',
        ],
        included: ['Guide', 'Entry assistance'],
        excluded: ['Meals', 'Personal expenses'],
        bookingOptions: [
          {
            id: `opt-${p.id}-group`,
            name: 'Standard Package',
            type: 'Group Tour',
            option: 'Standard',
            price: basePrice,
            maxTravellers: 12,
            description: 'Shared experience with local host',
          },
          {
            id: `opt-${p.id}-private`,
            name: 'Private Package',
            type: 'Private Tour',
            option: 'Premium',
            price: basePrice + 35,
            maxTravellers: 6,
            description: 'Private customized experience',
          },
        ],
        cancellationPolicy: 'Free cancellation up to 24 hours before start time',
        confirmation: 'Instant confirmation',
        importantInfo: 'Bring valid ID and comfortable shoes',
      };
    });

    const communityItineraries = buildCommunityItineraries(destination, places);

    const payload = {
      destination,
      center: [geo.lat, geo.lon],
      sources: {
        geocode: 'OpenStreetMap Nominatim',
        places: 'OpenStreetMap Overpass',
        enrichment: 'Wikipedia',
      },
      places,
      foods,
      experiences,
      communityItineraries,
      cached: false,
      generatedAt: new Date().toISOString(),
    };

    setCached(key, payload);
    return res.json(payload);
  } catch (error) {
    console.error('Discovery route error:', error);
    const destination = parseDestination(req.query.destination);
    const stale = getStaleByDestination(destination);
    if (stale) {
      return res.json({
        ...stale,
        stale: true,
        warning: 'Live providers are temporarily unavailable. Showing recently cached results.',
      });
    }
    return res.status(500).json({ error: 'Failed to fetch destination discovery data', details: error.message });
  }
});

export default router;
