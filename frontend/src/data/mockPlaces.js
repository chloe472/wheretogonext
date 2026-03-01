/**
 * Mock places by destination for "Add Places" flow.
 * In production this would be an API (e.g. Google Places / custom backend).
 * See docs/PLACES_INTEGRATION.md for how to switch to real places.
 */

/** Default map center [lat, lng] per destination (for map and custom places without coords). */
export const DEFAULT_MAP_CENTERS = {
  Paris: [48.8566, 2.3522],
  Tokyo: [35.6762, 139.6503],
  Seattle: [47.6062, -122.3321],
  Bali: [-8.4095, 115.1889],
  Calgary: [51.0447, -114.0719],
};

const PLACES_BY_DESTINATION = {
  Paris: [
    { id: 'p1', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, image: 'https://images.unsplash.com/photo-1511739001486-6deeccf9e30e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 125000, tags: ['Must go'], saved: false },
    { id: 'p2', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=280&fit=crop', rating: 4.9, reviewCount: 98000, tags: ['Must go'], saved: false },
    { id: 'p3', name: 'Montmartre', lat: 48.8867, lng: 2.3431, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 45000, tags: ['Hidden gem'], saved: false },
    { id: 'p4', name: 'Sainte-Chapelle', lat: 48.8559, lng: 2.3452, image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 32000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 'p5', name: 'Canal Saint-Martin', lat: 48.8689, lng: 2.3653, image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 12000, tags: ['Hidden gem'], saved: false },
  ],
  Tokyo: [
    { id: 't1', name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 89000, tags: ['Must go'], saved: false },
    { id: 't2', name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 76000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 't3', name: 'teamLab Borderless', lat: 35.6252, lng: 139.7753, image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 34000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 't4', name: 'Yoyogi Park', lat: 35.6692, lng: 139.6989, image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 28000, tags: ['Hidden gem'], saved: false },
  ],
  Seattle: [
    { id: 's1', name: 'Space Needle', lat: 47.6205, lng: -122.3493, image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 52000, tags: ['Must go'], saved: false },
    { id: 's2', name: 'Pike Place Market', lat: 47.6097, lng: -122.3425, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 68000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 's3', name: 'Chihuly Garden and Glass', lat: 47.6204, lng: -122.3491, image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 22000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 's4', name: 'Discovery Park', lat: 47.6607, lng: -122.4155, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 15000, tags: ['Hidden gem'], saved: false },
  ],
  Bali: [
    { id: 'b1', name: 'Tegallalang Rice Terraces', lat: -8.4284, lng: 115.2764, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 42000, tags: ['Must go'], saved: false },
    { id: 'b2', name: 'Tanah Lot', lat: -8.6211, lng: 115.0868, image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 38000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 'b3', name: 'Ubud Monkey Forest', lat: -8.5183, lng: 115.2593, image: 'https://images.unsplash.com/photo-1580104816385-0c1d70e2b47a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 31000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 'b4', name: 'Campuhan Ridge Walk', lat: -8.5069, lng: 115.2625, image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 12000, tags: ['Hidden gem'], saved: false },
  ],
  Calgary: [
    { id: 'c1', name: 'Heritage Park', lat: 51.0397, lng: -114.1114, image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 7884, tags: ['Must go'], saved: false },
    { id: 'c2', name: 'Peace Bridge', lat: 51.0456, lng: -114.0711, image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 5200, tags: ['Hidden gem'], saved: false },
    { id: 'c3', name: 'Olympic Plaza', lat: 51.0447, lng: -114.0559, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 4100, tags: ['Must go'], saved: false },
    { id: 'c4', name: 'Devonian Gardens', lat: 51.0474, lng: -114.0591, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 3200, tags: ['Hidden gem'], saved: false },
    { id: 'c5', name: 'Prairie Winds Park', lat: 51.0912, lng: -113.9586, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 2100, tags: ['Seen in 100+ plans'], saved: false },
  ],
};

const PLACE_FILTER_TAGS = ['Hidden gem', 'Must go', 'Seen in 100+ plans'];
const PLACE_SORT_OPTIONS = ['Recommended', 'Rating', 'Reviews', 'Name'];

/** Normalize destination for lookup (e.g. "Alberta, Calgary, Canada" -> "Calgary", "7 days to Seattle" -> "Seattle") */
function normalizeDestination(destinationOrLocations) {
  if (!destinationOrLocations) return 'Paris';
  const s = String(destinationOrLocations).trim();
  // Try known keys first
  for (const key of Object.keys(PLACES_BY_DESTINATION)) {
    if (s.toLowerCase().includes(key.toLowerCase())) return key;
  }
  // Use first word or segment as fallback and match any key that contains it
  const first = s.split(/[\s,]+/)[0];
  for (const key of Object.keys(PLACES_BY_DESTINATION)) {
    if (key.toLowerCase().includes(first?.toLowerCase() || '')) return key;
  }
  return 'Paris';
}

/**
 * Get places for a trip destination. Optionally filter by search query, tag, and sort.
 */
export function getPlacesForDestination(destinationOrLocations, options = {}) {
  const { searchQuery = '', filterTag = '', sortBy = 'Recommended' } = options;
  const key = normalizeDestination(destinationOrLocations);
  let list = [...(PLACES_BY_DESTINATION[key] || PLACES_BY_DESTINATION.Paris)];

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((p) => p.name.toLowerCase().includes(q));
  }
  if (filterTag) {
    list = list.filter((p) => p.tags.includes(filterTag));
  }
  if (sortBy === 'Rating') list.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'Reviews') list.sort((a, b) => b.reviewCount - a.reviewCount);
  else if (sortBy === 'Name') list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

/** Get default map center [lat, lng] for a destination string (e.g. trip.destination). */
export function getMapCenterForDestination(destinationOrLocations) {
  const key = normalizeDestination(destinationOrLocations);
  return DEFAULT_MAP_CENTERS[key] || DEFAULT_MAP_CENTERS.Paris;
}

/**
 * Full details per place id (overview, address, hours, website, etc.).
 * In production would come from Places API or backend.
 */
const PLACE_DETAILS = {
  s1: {
    overview: 'The Space Needle is an observation tower in Seattle, Washington. Built for the 1962 World\'s Fair, it offers stunning 360° views of the city, Puget Sound, and mountains.',
    address: '400 Broad St, Seattle, WA 98109, United States',
    hours: { Monday: '10 AM–9 PM', Tuesday: '10 AM–9 PM', Wednesday: '10 AM–9 PM', Thursday: '10 AM–9 PM', Friday: '10 AM–9 PM', Saturday: '9 AM–10 PM', Sunday: '9 AM–9 PM' },
    isOpenNow: true,
    website: 'https://www.spaceneedle.com/',
    googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Space+Needle+Seattle',
    nearbyPlaceIds: ['s2', 's3'],
  },
  s2: {
    overview: 'Pike Place Market is a public market in Seattle. It opened in 1907 and is one of the oldest continuously operated public farmers\' markets in the United States.',
    address: '85 Pike St, Seattle, WA 98101, United States',
    hours: { Monday: '9 AM–6 PM', Tuesday: '9 AM–6 PM', Wednesday: '9 AM–6 PM', Thursday: '9 AM–6 PM', Friday: '9 AM–6 PM', Saturday: '9 AM–6 PM', Sunday: '9 AM–5 PM' },
    isOpenNow: false,
    website: 'https://www.pikeplacemarket.org/',
    googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Pike+Place+Market+Seattle',
    nearbyPlaceIds: ['s1', 's3'],
  },
  s3: {
    overview: 'Chihuly Garden and Glass is a breathtaking exhibition located in the heart of Seattle, showcasing the extraordinary glass art of Dale Chihuly. This stunning venue combines a lush garden with intricate glass sculptures, offering visitors a unique blend of nature and artistry.',
    address: '305 Harrison St, Seattle, WA 98109, United States',
    hours: { Monday: '11 AM–5 PM', Tuesday: '11 AM–5 PM', Wednesday: '11 AM–5 PM', Thursday: '11 AM–5 PM', Friday: '11 AM–6 PM', Saturday: '10 AM–5 PM', Sunday: '10 AM–5:30 PM' },
    isOpenNow: false,
    website: 'https://www.chihulygardenandglass.com/',
    googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Chihuly+Garden+and+Glass+Seattle',
    nearbyPlaceIds: ['s1', 's2', 's4'],
  },
  s4: {
    overview: 'Discovery Park is a 534-acre park on the shores of Puget Sound. It is the largest city park in Seattle and offers miles of trails, beaches, and stunning views.',
    address: '3801 Discovery Park Blvd, Seattle, WA 98199, United States',
    hours: { Monday: '4 AM–11:30 PM', Tuesday: '4 AM–11:30 PM', Wednesday: '4 AM–11:30 PM', Thursday: '4 AM–11:30 PM', Friday: '4 AM–11:30 PM', Saturday: '4 AM–11:30 PM', Sunday: '4 AM–11:30 PM' },
    isOpenNow: true,
    website: 'https://www.seattle.gov/parks/find/parks/discovery-park',
    googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Discovery+Park+Seattle',
    nearbyPlaceIds: ['s1', 's2', 's3'],
  },
  p1: { overview: 'The Eiffel Tower is a wrought-iron lattice tower on the Champ de Mars in Paris. It is named after engineer Gustave Eiffel.', address: 'Champ de Mars, 5 Avenue Anatole France, 75007 Paris, France', hours: { Monday: '9:30 AM–11:45 PM', Tuesday: '9:30 AM–11:45 PM', Wednesday: '9:30 AM–11:45 PM', Thursday: '9:30 AM–11:45 PM', Friday: '9:30 AM–11:45 PM', Saturday: '9:30 AM–11:45 PM', Sunday: '9:30 AM–11:45 PM' }, isOpenNow: true, website: 'https://www.toureiffel.paris/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Eiffel+Tower+Paris', nearbyPlaceIds: ['p2', 'p3'] },
  p2: { overview: 'The Louvre is the world\'s largest art museum and a historic monument in Paris.', address: 'Rue de Rivoli, 75001 Paris, France', hours: { Monday: 'Closed', Tuesday: '9 AM–6 PM', Wednesday: '9 AM–9:45 PM', Thursday: '9 AM–6 PM', Friday: '9 AM–9:45 PM', Saturday: '9 AM–6 PM', Sunday: '9 AM–6 PM' }, isOpenNow: false, website: 'https://www.louvre.fr/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Louvre+Museum+Paris', nearbyPlaceIds: ['p1', 'p4'] },
  p3: { overview: 'Montmartre is a large hill in Paris\'s north and the name of the surrounding district.', address: 'Montmartre, 75018 Paris, France', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Montmartre+Paris', nearbyPlaceIds: ['p1', 'p5'] },
  p4: { overview: 'Sainte-Chapelle is a royal chapel in the Gothic style, within the Palais de la Cité in Paris.', address: '8 Boulevard du Palais, 75001 Paris, France', hours: { Monday: '9 AM–5 PM', Tuesday: '9 AM–5 PM', Wednesday: '9 AM–5 PM', Thursday: '9 AM–5 PM', Friday: '9 AM–5 PM', Saturday: '9 AM–5 PM', Sunday: '9 AM–5 PM' }, isOpenNow: false, website: 'https://www.sainte-chapelle.fr/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Sainte-Chapelle+Paris', nearbyPlaceIds: ['p2', 'p1'] },
  p5: { overview: 'Canal Saint-Martin is a 4.5 km canal in Paris, connecting the Canal de l\'Ourcq to the Seine.', address: 'Quai de Valmy, 75010 Paris, France', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Canal+Saint-Martin+Paris', nearbyPlaceIds: ['p3', 'p4'] },
  t1: { overview: 'Senso-ji is an ancient Buddhist temple in Asakusa, Tokyo, and one of the city\'s most significant temples.', address: '2 Chome-3-1 Asakusa, Taito City, Tokyo, Japan', hours: { Monday: '6 AM–5 PM', Tuesday: '6 AM–5 PM', Wednesday: '6 AM–5 PM', Thursday: '6 AM–5 PM', Friday: '6 AM–5 PM', Saturday: '6 AM–5 PM', Sunday: '6 AM–5 PM' }, isOpenNow: false, website: 'https://www.senso-ji.jp/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Senso-ji+Tokyo', nearbyPlaceIds: ['t2', 't3'] },
  t2: { overview: 'Shibuya Crossing is one of the busiest pedestrian crossings in the world, in front of Shibuya Station.', address: 'Shibuya City, Tokyo, Japan', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Shibuya+Crossing+Tokyo', nearbyPlaceIds: ['t1', 't4'] },
  t3: { overview: 'teamLab Borderless is a group of artworks that form one borderless world.', address: '1-3-8 Aomi, Koto City, Tokyo, Japan', hours: { Monday: '10 AM–7 PM', Tuesday: '10 AM–7 PM', Wednesday: '10 AM–7 PM', Thursday: '10 AM–7 PM', Friday: '10 AM–7 PM', Saturday: '10 AM–7 PM', Sunday: '10 AM–7 PM' }, isOpenNow: false, website: 'https://borderless.teamlab.art/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=teamLab+Borderless+Tokyo', nearbyPlaceIds: ['t1', 't2'] },
  t4: { overview: 'Yoyogi Park is one of Tokyo\'s largest parks, adjacent to Harajuku and Meiji Shrine.', address: '2-1 Yoyogikamizonocho, Shibuya City, Tokyo, Japan', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Yoyogi+Park+Tokyo', nearbyPlaceIds: ['t2', 't3'] },
  b1: { overview: 'Tegallalang Rice Terraces are iconic rice paddies in Ubud, Bali, with stunning tiered landscapes.', address: 'Tegallalang, Gianyar, Bali, Indonesia', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Tegallalang+Rice+Terraces+Bali', nearbyPlaceIds: ['b3', 'b4'] },
  b2: { overview: 'Tanah Lot is a famous sea temple and one of Bali\'s most important landmarks.', address: 'Beraban, Kediri, Tabanan, Bali, Indonesia', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Tanah+Lot+Bali', nearbyPlaceIds: ['b1', 'b3'] },
  b3: { overview: 'Ubud Monkey Forest is a nature reserve and temple complex in Ubud, home to the Balinese long-tailed macaque.', address: 'Jl. Monkey Forest, Ubud, Bali, Indonesia', hours: { Monday: '9 AM–6 PM', Tuesday: '9 AM–6 PM', Wednesday: '9 AM–6 PM', Thursday: '9 AM–6 PM', Friday: '9 AM–6 PM', Saturday: '9 AM–6 PM', Sunday: '9 AM–6 PM' }, isOpenNow: false, website: 'https://monkeyforestubud.com/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Ubud+Monkey+Forest+Bali', nearbyPlaceIds: ['b1', 'b4'] },
  b4: { overview: 'Campuhan Ridge Walk is a scenic trail in Ubud with lush greenery and valley views.', address: 'Keliki, Tegallalang, Gianyar, Bali, Indonesia', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Campuhan+Ridge+Walk+Bali', nearbyPlaceIds: ['b1', 'b3'] },
  c1: { overview: 'Heritage Park is a living history museum in Calgary featuring historical buildings and exhibits.', address: '1900 Heritage Dr SW, Calgary, AB, Canada', hours: { Monday: '10 AM–5 PM', Tuesday: '10 AM–5 PM', Wednesday: '10 AM–5 PM', Thursday: '10 AM–5 PM', Friday: '10 AM–5 PM', Saturday: '10 AM–5 PM', Sunday: '10 AM–5 PM' }, isOpenNow: false, website: 'https://www.heritagepark.ca/', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Heritage+Park+Calgary', nearbyPlaceIds: ['c2', 'c3'] },
  c2: { overview: 'The Peace Bridge is a pedestrian and cycle bridge across the Bow River in Calgary.', address: 'Peace Bridge, Calgary, AB, Canada', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Peace+Bridge+Calgary', nearbyPlaceIds: ['c3', 'c4'] },
  c3: { overview: 'Olympic Plaza is a public square in downtown Calgary, built for the 1988 Winter Olympics.', address: '228 8 Ave SE, Calgary, AB, Canada', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Olympic+Plaza+Calgary', nearbyPlaceIds: ['c2', 'c4'] },
  c4: { overview: 'Devonian Gardens is an indoor public park and botanical garden in downtown Calgary.', address: '317 7 Ave SW, Calgary, AB, Canada', hours: { Monday: '9 AM–9 PM', Tuesday: '9 AM–9 PM', Wednesday: '9 AM–9 PM', Thursday: '9 AM–9 PM', Friday: '9 AM–9 PM', Saturday: '9 AM–6 PM', Sunday: '11 AM–6 PM' }, isOpenNow: false, website: 'https://www.calgary.ca/parks/devonian-gardens.html', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Devonian+Gardens+Calgary', nearbyPlaceIds: ['c2', 'c3'] },
  c5: { overview: 'Prairie Winds Park is a large community park in northeast Calgary with playgrounds and sports facilities.', address: '223 Castleridge Blvd NE, Calgary, AB, Canada', hours: {}, isOpenNow: true, website: '', googleMapsReviewUrl: 'https://www.google.com/maps/search/?api=1&query=Prairie+Winds+Park+Calgary', nearbyPlaceIds: ['c1', 'c3'] },
};

/** Get full details for a place (merge base place + PLACE_DETAILS). */
export function getPlaceDetails(place) {
  if (!place || !place.id) return null;
  const details = PLACE_DETAILS[place.id] || {};
  return {
    ...place,
    overview: details.overview ?? '',
    address: details.address ?? '',
    hours: details.hours ?? {},
    isOpenNow: details.isOpenNow ?? null,
    website: details.website ?? '',
    googleMapsReviewUrl: details.googleMapsReviewUrl ?? '',
    nearbyPlaceIds: details.nearbyPlaceIds ?? [],
  };
}

/** Get nearby places for a place (by id) within the same destination. */
export function getNearbyPlaces(place, destinationOrLocations) {
  const key = normalizeDestination(destinationOrLocations);
  const allPlaces = PLACES_BY_DESTINATION[key] || PLACES_BY_DESTINATION.Paris;
  const details = place && place.id ? (PLACE_DETAILS[place.id] || {}) : {};
  const ids = details.nearbyPlaceIds && details.nearbyPlaceIds.length > 0
    ? details.nearbyPlaceIds
    : allPlaces.filter((p) => p.id !== (place && place.id)).map((p) => p.id).slice(0, 4);
  return ids.map((id) => allPlaces.find((p) => p.id === id)).filter(Boolean);
}

export { PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS, PLACES_BY_DESTINATION, normalizeDestination };
