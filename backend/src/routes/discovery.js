import express from 'express';

const router = express.Router();

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary';

const headers = {
  'User-Agent': 'WhereToGoNext/1.0 (travel-planner)',
  'Accept-Language': 'en',
};

const DISCOVERY_CACHE_TTL_MS = 10 * 60 * 1000;
const DISCOVERY_CACHE = new Map();

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

  const name = tags.name || tags['name:en'];
  if (!name) return null;
  if (isLowQualityName(name)) return null;

  const address = [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'] || destinationName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

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

function fallbackImage(seed, topic = 'travel') {
  return `https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=520&fit=crop&auto=format&q=80&${topic}=${encodeURIComponent(seed)}`;
}

async function enrichWithWikipedia(items, max = 8) {
  const subset = items.slice(0, max);
  const enriched = await Promise.all(
    subset.map(async (item) => {
      try {
        const title = slugifyTitle(item.name);
        const res = await fetch(`${WIKI_SUMMARY_URL}/${encodeURIComponent(title)}`, { headers });
        if (!res.ok) return item;
        const data = await res.json();
        if (isDisambiguationText(data.extract)) return item;
        return {
          ...item,
          description: data.extract || item.description,
          image: data?.thumbnail?.source || item.image,
          wikiUrl: data?.content_urls?.desktop?.page || '',
        };
      } catch {
        return item;
      }
    }),
  );

  return [...enriched, ...items.slice(max)];
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
        name: it.name,
        type: inferPlaceType(it.tourismType),
        rating: Number((4 + ((idx % 8) * 0.1)).toFixed(1)),
        reviewCount: 120 + idx * 17,
        lat: it.lat,
        lng: it.lng,
        address: it.address,
        description: `${it.name} in ${destination}`,
        image: fallbackImage(it.name, 'landmark'),
        website: it.website,
        phone: it.phone,
        openingHours: 'Check official website',
        estimatedDuration: inferDurationHours(it.tourismType) >= 4 ? 'Half day' : '2-3 hours',
        tags: [inferPlaceType(it.tourismType), destination],
      }));

    const foodBase = ranked
      .filter((it) => it.category === 'food')
      .slice(0, limit)
      .map((it, idx) => ({
        id: it.id,
        name: it.name,
        rating: Number((4 + ((idx % 7) * 0.1)).toFixed(1)),
        reviewCount: 70 + idx * 11,
        lat: it.lat,
        lng: it.lng,
        address: it.address,
        image: fallbackImage(it.name, 'restaurant'),
        cuisine: it.tags?.cuisine || 'Local cuisine',
        priceLevel: toPriceLevel(it.amenityType),
        dietaryTags: toDietary(it.tags),
        openingHours: it.tags?.opening_hours || 'Check venue listing',
        description: `${it.name} in ${destination}`,
        website: it.website,
        phone: it.phone,
      }));

    const places = await enrichWithWikipedia(placeBase, 10);
    const foods = await enrichWithWikipedia(foodBase, 8);

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
