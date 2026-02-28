/**
 * Mock places by destination for "Add Places" flow.
 * In production this would be an API (e.g. Google Places / custom backend).
 */

const PLACES_BY_DESTINATION = {
  Paris: [
    { id: 'p1', name: 'Eiffel Tower', image: 'https://images.unsplash.com/photo-1511739001486-6deeccf9e30e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 125000, tags: ['Must go'], saved: false },
    { id: 'p2', name: 'Louvre Museum', image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=280&fit=crop', rating: 4.9, reviewCount: 98000, tags: ['Must go'], saved: false },
    { id: 'p3', name: 'Montmartre', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 45000, tags: ['Hidden gem'], saved: false },
    { id: 'p4', name: 'Sainte-Chapelle', image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 32000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 'p5', name: 'Canal Saint-Martin', image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 12000, tags: ['Hidden gem'], saved: false },
  ],
  Tokyo: [
    { id: 't1', name: 'Senso-ji Temple', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 89000, tags: ['Must go'], saved: false },
    { id: 't2', name: 'Shibuya Crossing', image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 76000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 't3', name: 'teamLab Borderless', image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 34000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 't4', name: 'Yoyogi Park', image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 28000, tags: ['Hidden gem'], saved: false },
  ],
  Seattle: [
    { id: 's1', name: 'Space Needle', image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 52000, tags: ['Must go'], saved: false },
    { id: 's2', name: 'Pike Place Market', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 68000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 's3', name: 'Chihuly Garden and Glass', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 22000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 's4', name: 'Discovery Park', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 15000, tags: ['Hidden gem'], saved: false },
  ],
  Bali: [
    { id: 'b1', name: 'Tegallalang Rice Terraces', image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 42000, tags: ['Must go'], saved: false },
    { id: 'b2', name: 'Tanah Lot', image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 38000, tags: ['Must go', 'Seen in 100+ plans'], saved: false },
    { id: 'b3', name: 'Ubud Monkey Forest', image: 'https://images.unsplash.com/photo-1580104816385-0c1d70e2b47a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 31000, tags: ['Seen in 100+ plans'], saved: false },
    { id: 'b4', name: 'Campuhan Ridge Walk', image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 12000, tags: ['Hidden gem'], saved: false },
  ],
  Calgary: [
    { id: 'c1', name: 'Heritage Park', image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 7884, tags: ['Must go'], saved: false },
    { id: 'c2', name: 'Peace Bridge', image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 5200, tags: ['Hidden gem'], saved: false },
    { id: 'c3', name: 'Olympic Plaza', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 4100, tags: ['Must go'], saved: false },
    { id: 'c4', name: 'Devonian Gardens', image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 3200, tags: ['Hidden gem'], saved: false },
    { id: 'c5', name: 'Prairie Winds Park', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 2100, tags: ['Seen in 100+ plans'], saved: false },
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

export { PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS, PLACES_BY_DESTINATION, normalizeDestination };
