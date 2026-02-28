/**
 * Mock community itineraries for the Explore / Search results page.
 * In production this would come from an API filtered by destination query.
 */
export const MOCK_COMMUNITY_ITINERARIES = [
  { id: 'c1', title: '3-Day Dalat Itinerary: Saigon–Dalat Sightsee and Vibes', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 120, currency: 'SGD', duration: '3 days', type: 'City Life', creator: 'TravelWithMe', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=260&fit=crop', likes: 24 },
  { id: 'c2', title: '5-Day Vibrant City Guide: A Perfect Adventure', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 150, currency: 'SGD', duration: '5 days', type: 'Adventure', creator: 'WanderlustJane', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop', likes: 18 },
  { id: 'c3', title: 'Ho Chi Minh Food & Culture in 4 Days', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 85, currency: 'SGD', duration: '4 days', type: 'Foodie', creator: 'FoodieNomad', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=260&fit=crop', likes: 42 },
  { id: 'c4', title: 'Weekend in Ho Chi Minh: Markets & History', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 60, currency: 'SGD', duration: '2 days', type: 'Culture & Art', creator: 'HistoryBuff', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=260&fit=crop', likes: 31 },
  { id: 'c5', title: '7-Day Tokyo & Kyoto: Temples and Cherry Blossoms', destination: 'Tokyo', destinationSlug: 'tokyo', price: 280, currency: 'SGD', duration: '7 days', type: 'Culture & Art', creator: 'JapanLover', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=260&fit=crop', likes: 56 },
  { id: 'c6', title: '5-Day Hanoi Street Food & Old Quarter', destination: 'Hanoi', destinationSlug: 'hanoi', price: 95, currency: 'SGD', duration: '5 days', type: 'Foodie', creator: 'StreetEats', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop', likes: 38 },
  { id: 'c7', title: 'Bangkok in 3 Days: Temples & Night Markets', destination: 'Bangkok', destinationSlug: 'bangkok', price: 110, currency: 'SGD', duration: '3 days', type: 'City Life', creator: 'BKKLocal', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=260&fit=crop', likes: 29 },
  { id: 'c8', title: 'Seoul K-Culture & Cafes: 4-Day Itinerary', destination: 'Seoul', destinationSlug: 'seoul', price: 200, currency: 'SGD', duration: '4 days', type: 'City Life', creator: 'KwaveFan', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=400&h=260&fit=crop', likes: 44 },
  { id: 'c9', title: 'Bali Wellness & Rice Terraces: 6 Days', destination: 'Bali', destinationSlug: 'bali', price: 180, currency: 'SGD', duration: '6 days', type: 'Wellness', creator: 'BaliSoul', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=260&fit=crop', likes: 62 },
  { id: 'c10', title: 'Paris in a Week: Art, Food & Gardens', destination: 'Paris', destinationSlug: 'paris', price: 320, currency: 'SGD', duration: '7 days', type: 'Culture & Art', creator: 'ParisianDays', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=260&fit=crop', likes: 71 },
];

const ADVENTURE_TYPES = ['All', 'Staycation', 'Hiking & Trekking', 'Adventure', 'Culture & Art', 'Gardens & Museums', 'Foodie', 'Luxury', 'Cruises', 'Relaxation & Spa', 'City Life', 'Wellness', 'Shopping'];
const DURATIONS = ['1-3 days', '3-5 days', '5-7 days', '7-10 days', '10-14 days', '14+ days'];
const SORT_OPTIONS = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Duration'];
const CREATOR_NATIONALITIES = ['Singaporean', 'Vietnamese', 'Thai', 'Indian', 'Cambodian', 'American'];

/** Normalize destination for matching (e.g. "Ho Chi Minh City" -> "ho chi minh") */
function slugify(text) {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/** Get community itineraries matching a destination search query. */
export function getCommunityItineraries(query, filters = {}) {
  const q = (query || '').trim().toLowerCase();
  let list = q
    ? MOCK_COMMUNITY_ITINERARIES.filter(
        (it) =>
          slugify(it.destination).includes(q) ||
          slugify(it.title).includes(q) ||
          (it.destinationSlug && it.destinationSlug.includes(q.replace(/\s+/g, '-')))
      )
    : [...MOCK_COMMUNITY_ITINERARIES];

  if (filters.type && filters.type !== 'All') {
    list = list.filter((it) => it.type === filters.type);
  }
  if (filters.duration) {
    list = list.filter((it) => {
      const days = parseInt(it.duration, 10) || 0;
      if (filters.duration === '1-3 days') return days >= 1 && days <= 3;
      if (filters.duration === '3-5 days') return days >= 3 && days <= 5;
      if (filters.duration === '5-7 days') return days >= 5 && days <= 7;
      if (filters.duration === '7-10 days') return days >= 7 && days <= 10;
      if (filters.duration === '10-14 days') return days >= 10 && days <= 14;
      if (filters.duration === '14+ days') return days >= 14;
      return true;
    });
  }
  if (filters.sort === 'Newest') list = [...list].reverse();
  if (filters.sort === 'Price: Low to High') list = [...list].sort((a, b) => a.price - b.price);
  if (filters.sort === 'Price: High to Low') list = [...list].sort((a, b) => b.price - a.price);
  if (filters.sort === 'Duration') list = [...list].sort((a, b) => (parseInt(a.duration, 10) || 0) - (parseInt(b.duration, 10) || 0));

  return list;
}

export { ADVENTURE_TYPES, DURATIONS, SORT_OPTIONS, CREATOR_NATIONALITIES };
