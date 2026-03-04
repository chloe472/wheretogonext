/**
 * Mock community itineraries for the Explore / Search results page.
 * In production this would come from an API filtered by destination query.
 */
export const MOCK_COMMUNITY_ITINERARIES = [
  // Asia
  { id: 'c1', title: '3-Day Dalat Itinerary: Saigon–Dalat Sightsee and Vibes', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 120, currency: 'SGD', duration: '3 days', type: 'City Life', creator: 'TravelWithMe', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=260&fit=crop', likes: 24 },
  { id: 'c2', title: '5-Day Vibrant City Guide: A Perfect Adventure', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 150, currency: 'SGD', duration: '5 days', type: 'Adventure', creator: 'WanderlustJane', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop', likes: 18 },
  { id: 'c3', title: 'Ho Chi Minh Food & Culture in 4 Days', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 85, currency: 'SGD', duration: '4 days', type: 'Foodie', creator: 'FoodieNomad', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&h=260&fit=crop', likes: 42 },
  { id: 'c4', title: 'Weekend in Ho Chi Minh: Markets & History', destination: 'Ho Chi Minh City', destinationSlug: 'ho-chi-minh', price: 60, currency: 'SGD', duration: '2 days', type: 'Culture & Art', creator: 'HistoryBuff', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=260&fit=crop', likes: 31 },
  { id: 'c5', title: '7-Day Tokyo & Kyoto: Temples and Cherry Blossoms', destination: 'Tokyo', destinationSlug: 'tokyo', price: 280, currency: 'SGD', duration: '7 days', type: 'Culture & Art', creator: 'JapanLover', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=260&fit=crop', likes: 56 },
  { id: 'c51', title: '48 Hours in Tokyo: Temples, Tech, and Ramen', destination: 'Tokyo', destinationSlug: 'tokyo', price: 180, currency: 'SGD', duration: '2 days', type: 'Foodie', creator: 'TokyoFoodie', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=260&fit=crop', likes: 89 },
  { id: 'c52', title: '5 Days in Tokyo: An Unforgettable Journey', destination: 'Tokyo', destinationSlug: 'tokyo', price: 220, currency: 'SGD', duration: '5 days', type: 'City Life', creator: 'UrbanExplorer', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=260&fit=crop', likes: 67 },
  { id: 'c6', title: '5-Day Hanoi Street Food & Old Quarter', destination: 'Hanoi', destinationSlug: 'hanoi', price: 95, currency: 'SGD', duration: '5 days', type: 'Foodie', creator: 'StreetEats', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=400&h=260&fit=crop', likes: 38 },
  { id: 'c7', title: 'Bangkok in 3 Days: Temples & Night Markets', destination: 'Bangkok', destinationSlug: 'bangkok', price: 110, currency: 'SGD', duration: '3 days', type: 'City Life', creator: 'BKKLocal', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=260&fit=crop', likes: 29 },
  { id: 'c8', title: 'Seoul K-Culture & Cafes: 4-Day Itinerary', destination: 'Seoul', destinationSlug: 'seoul', price: 200, currency: 'SGD', duration: '4 days', type: 'City Life', creator: 'KwaveFan', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1534274867514-d5b47ef89ed7?w=400&h=260&fit=crop', likes: 44 },
  { id: 'c9', title: 'Bali Wellness & Rice Terraces: 6 Days', destination: 'Bali', destinationSlug: 'bali', price: 180, currency: 'SGD', duration: '6 days', type: 'Wellness', creator: 'BaliSoul', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=260&fit=crop', likes: 62 },
  { id: 'c53', title: 'Kuala Lumpur 3-Day Explorer: Food, Culture & Shopping', destination: 'Kuala Lumpur', destinationSlug: 'kuala-lumpur', price: 95, currency: 'SGD', duration: '3 days', type: 'City Life', creator: 'KLLocal', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=260&fit=crop', likes: 41 },
  { id: 'c54', title: 'Ultimate Kuala Lumpur Food Guide: 5 Days', destination: 'Kuala Lumpur', destinationSlug: 'kuala-lumpur', price: 120, currency: 'SGD', duration: '5 days', type: 'Foodie', creator: 'MalaysiaEats', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1605190331155-c6d0e6e2e7a5?w=400&h=260&fit=crop', likes: 58 },
  { id: 'c55', title: 'Singapore in 4 Days: Gardens, Food & Future', destination: 'Singapore', destinationSlug: 'singapore', price: 240, currency: 'SGD', duration: '4 days', type: 'City Life', creator: 'SGTraveller', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=260&fit=crop', likes: 76 },
  
  // Europe
  { id: 'c10', title: 'Paris in a Week: Art, Food & Gardens', destination: 'Paris', destinationSlug: 'paris', price: 320, currency: 'SGD', duration: '7 days', type: 'Culture & Art', creator: 'ParisianDays', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=260&fit=crop', likes: 71 },
  { id: 'c56', title: 'Munich Beer Gardens & Castles: 4-Day Guide', destination: 'Munich', destinationSlug: 'munich', price: 195, currency: 'EUR', duration: '4 days', type: 'Culture & Art', creator: 'BavarianTravels', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=260&fit=crop', likes: 52 },
  { id: 'c57', title: 'Best of Munich: Oktoberfest & Beyond - 5 Days', destination: 'Munich', destinationSlug: 'munich', price: 210, currency: 'EUR', duration: '5 days', type: 'City Life', creator: 'GermanExplorer', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1577717903315-1691ae25ab3f?w=400&h=260&fit=crop', likes: 64 },
  { id: 'c58', title: 'Munich Art & History: A Cultural 3-Day Journey', destination: 'Munich', destinationSlug: 'munich', price: 165, currency: 'EUR', duration: '3 days', type: 'Culture & Art', creator: 'ArtLover88', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1573833268251-bd78952ed5ca?w=400&h=260&fit=crop', likes: 38 },
  { id: 'c59', title: 'London in 5 Days: Royalty, Museums & Markets', destination: 'London', destinationSlug: 'london', price: 290, currency: 'GBP', duration: '5 days', type: 'Culture & Art', creator: 'BritishTraveller', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=260&fit=crop', likes: 82 },
  { id: 'c60', title: 'Rome: Ancient Ruins & Gelato - 6 Days', destination: 'Rome', destinationSlug: 'rome', price: 245, currency: 'EUR', duration: '6 days', type: 'Culture & Art', creator: 'ItalianAdventure', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&h=260&fit=crop', likes: 91 },
  { id: 'c61', title: 'Barcelona Beach & Gaudí: 4-Day Explorer', destination: 'Barcelona', destinationSlug: 'barcelona', price: 185, currency: 'EUR', duration: '4 days', type: 'City Life', creator: 'SpainTravels', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=400&h=260&fit=crop', likes: 68 },
  { id: 'c62', title: 'Amsterdam Canals & Culture: 3-Day Guide', destination: 'Amsterdam', destinationSlug: 'amsterdam', price: 175, currency: 'EUR', duration: '3 days', type: 'City Life', creator: 'DutchWanderer', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=400&h=260&fit=crop', likes: 54 },
  { id: 'c63', title: 'Berlin History & Nightlife: 5 Days', destination: 'Berlin', destinationSlug: 'berlin', price: 160, currency: 'EUR', duration: '5 days', type: 'City Life', creator: 'BerlinNights', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1560930950-5cc20e80e392?w=400&h=260&fit=crop', likes: 47 },
  
  // Americas
  { id: 'c64', title: 'Mexico City Tacos & Temples: 5-Day Adventure', destination: 'Mexico City', destinationSlug: 'mexico-city', price: 145, currency: 'USD', duration: '5 days', type: 'Foodie', creator: 'MexicoTravels', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=260&fit=crop', likes: 73 },
  { id: 'c65', title: 'Best of Mexico City: Art, Food & Culture - 4 Days', destination: 'Mexico City', destinationSlug: 'mexico-city', price: 130, currency: 'USD', duration: '4 days', type: 'Culture & Art', creator: 'CDMXGuide', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&h=260&fit=crop', likes: 61 },
  { id: 'c66', title: 'Mexico City Markets & Museums: 3-Day Explorer', destination: 'Mexico City', destinationSlug: 'mexico-city', price: 95, currency: 'USD', duration: '3 days', type: 'City Life', creator: 'LatinAmericaLove', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1566442806814-1a7b8b4a79f2?w=400&h=260&fit=crop', likes: 49 },
  { id: 'c67', title: 'New York City: Broadway & Beyond - 5 Days', destination: 'New York', destinationSlug: 'new-york', price: 380, currency: 'USD', duration: '5 days', type: 'City Life', creator: 'NYCExplorer', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=400&h=260&fit=crop', likes: 112 },
  { id: 'c68', title: 'San Francisco: Golden Gate to Alcatraz - 4 Days', destination: 'San Francisco', destinationSlug: 'san-francisco', price: 340, currency: 'USD', duration: '4 days', type: 'City Life', creator: 'BayAreaGuide', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=260&fit=crop', likes: 87 },
  { id: 'c69', title: 'Buenos Aires Tango & Steaks: 6-Day Journey', destination: 'Buenos Aires', destinationSlug: 'buenos-aires', price: 155, currency: 'USD', duration: '6 days', type: 'Culture & Art', creator: 'ArgentinaLover', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1589909202802-8f4aadce1849?w=400&h=260&fit=crop', likes: 59 },
  
  // Others
  { id: 'c70', title: 'Dubai Luxury & Desert: 5-Day Experience', destination: 'Dubai', destinationSlug: 'dubai', price: 420, currency: 'USD', duration: '5 days', type: 'Luxury', creator: 'DesertDreams', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&h=260&fit=crop', likes: 95 },
  { id: 'c71', title: 'Sydney Harbour & Beaches: 4-Day Guide', destination: 'Sydney', destinationSlug: 'sydney', price: 285, currency: 'AUD', duration: '4 days', type: 'City Life', creator: 'AussieAdventures', creatorAvatar: null, image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&h=260&fit=crop', likes: 78 },
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
