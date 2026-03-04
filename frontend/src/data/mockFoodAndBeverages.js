import { getMapCenterForDestination } from './mockPlaces';

export const FOOD_DIETARY_FILTERS = ['All', 'Muslim-Friendly', 'Vegetarian', 'Vegan', 'Late Night', 'Cafe'];
export const FOOD_SORT_OPTIONS = ['Recommended', 'Rating', 'Reviews', 'Name'];

const FOOD_BY_DESTINATION = {
  Tokyo: [
    { id: 'tokyo-food-1', name: 'Age.3', address: '2-6-4 Ebisu, Shibuya City, Tokyo, Japan', lat: 35.6463, lng: 139.7101, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 19046, dietaryTags: ['Cafe'], priceLevel: '$$', tags: ['Must eat'] },
    { id: 'tokyo-food-2', name: 'Halal Wagyu & Vegan Ramen Shibuya', address: '1-15-12 Jinnan, Shibuya City, Tokyo, Japan', lat: 35.6628, lng: 139.7002, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop', rating: 4.9, reviewCount: 18228, dietaryTags: ['Muslim-Friendly', 'Vegan'], priceLevel: '$$', tags: ['Trending'] },
    { id: 'tokyo-food-3', name: 'Ichiran Shibuya', address: '1-22-7 Jinnan, Shibuya City, Tokyo, Japan', lat: 35.6618, lng: 139.7017, image: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 25430, dietaryTags: ['Late Night'], priceLevel: '$', tags: ['Seen in 100+ plans'] },
    { id: 'tokyo-food-4', name: 'Sushi Dai', address: '6-5-1 Toyosu, Koto City, Tokyo, Japan', lat: 35.6452, lng: 139.7843, image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 8750, dietaryTags: [], priceLevel: '$$$', tags: ['Must eat'] },
    { id: 'tokyo-food-5', name: 'Streamer Coffee Company', address: '1-20-28 Shibuya, Tokyo, Japan', lat: 35.6591, lng: 139.7037, image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 6340, dietaryTags: ['Cafe', 'Vegetarian'], priceLevel: '$$', tags: ['Hidden gem'] },
  ],
  'Kuala Lumpur': [
    { id: 'kl-food-1', name: 'Jalan Alor Night Food Court', address: 'Jalan Alor, Bukit Bintang, Kuala Lumpur, Malaysia', lat: 3.1467, lng: 101.7075, image: 'https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 28400, dietaryTags: ['Late Night', 'Muslim-Friendly'], priceLevel: '$', tags: ['Must eat'] },
    { id: 'kl-food-2', name: 'Bijan Bar & Restaurant', address: '3 Jalan Ceylon, Kuala Lumpur, Malaysia', lat: 3.1496, lng: 101.7058, image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 8240, dietaryTags: ['Muslim-Friendly'], priceLevel: '$$$', tags: ['Seen in 100+ plans'] },
    { id: 'kl-food-3', name: 'Merchant’s Lane', address: '150 Jalan Petaling, Kuala Lumpur, Malaysia', lat: 3.1458, lng: 101.6978, image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 11830, dietaryTags: ['Cafe', 'Vegetarian'], priceLevel: '$$', tags: ['Trending'] },
    { id: 'kl-food-4', name: 'Lot 10 Hutong', address: '50 Jalan Sultan Ismail, Kuala Lumpur, Malaysia', lat: 3.1475, lng: 101.7132, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 13220, dietaryTags: ['Muslim-Friendly'], priceLevel: '$$', tags: ['Must eat'] },
    { id: 'kl-food-5', name: 'Feeka Coffee Roasters', address: '19 Jalan Mesui, Kuala Lumpur, Malaysia', lat: 3.1508, lng: 101.7053, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 6950, dietaryTags: ['Cafe', 'Vegetarian'], priceLevel: '$$', tags: ['Hidden gem'] },
  ],
  Paris: [
    { id: 'paris-food-1', name: 'Bouillon Chartier', address: '7 Rue du Faubourg Montmartre, Paris, France', lat: 48.8719, lng: 2.3431, image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 30110, dietaryTags: [], priceLevel: '$$', tags: ['Seen in 100+ plans'] },
    { id: 'paris-food-2', name: 'Du Pain et des Idées', address: '34 Rue Yves Toudic, Paris, France', lat: 48.8724, lng: 2.3636, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 9640, dietaryTags: ['Cafe', 'Vegetarian'], priceLevel: '$', tags: ['Must eat'] },
    { id: 'paris-food-3', name: 'Septime', address: '80 Rue de Charonne, Paris, France', lat: 48.8538, lng: 2.3809, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 5810, dietaryTags: ['Vegetarian'], priceLevel: '$$$', tags: ['Trending'] },
  ],
  Seattle: [
    { id: 'sea-food-1', name: 'Piroshky Piroshky', address: '1908 Pike Pl, Seattle, WA, United States', lat: 47.6103, lng: -122.3421, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 17500, dietaryTags: ['Cafe'], priceLevel: '$', tags: ['Must eat'] },
    { id: 'sea-food-2', name: 'The Pink Door', address: '1919 Post Alley, Seattle, WA, United States', lat: 47.6104, lng: -122.3427, image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 12200, dietaryTags: ['Vegetarian'], priceLevel: '$$$', tags: ['Seen in 100+ plans'] },
    { id: 'sea-food-3', name: 'Storyville Coffee', address: '94 Pike St #34, Seattle, WA, United States', lat: 47.6098, lng: -122.3404, image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 8640, dietaryTags: ['Cafe', 'Vegetarian'], priceLevel: '$$', tags: ['Hidden gem'] },
  ],
};

function extractCityName(destinationOrLocations) {
  if (!destinationOrLocations) return '';
  return String(destinationOrLocations).split(',')[0].trim();
}

function generateGenericFood(cityName, center) {
  const [lat, lng] = center;
  const city = cityName || 'City';
  return [
    { id: `${city}-food-1`, name: `${city} Food Market`, address: `${city} Central District`, lat: lat + 0.008, lng: lng - 0.006, image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 8300, dietaryTags: ['Muslim-Friendly'], priceLevel: '$$', tags: ['Must eat'] },
    { id: `${city}-food-2`, name: `Traditional ${city} Kitchen`, address: `${city} Old Town`, lat: lat - 0.004, lng: lng + 0.005, image: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 4200, dietaryTags: ['Vegetarian'], priceLevel: '$$', tags: ['Hidden gem'] },
    { id: `${city}-food-3`, name: `${city} Roastery`, address: `${city} Arts Quarter`, lat: lat + 0.011, lng: lng + 0.009, image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 3180, dietaryTags: ['Cafe'], priceLevel: '$$', tags: ['Trending'] },
    { id: `${city}-food-4`, name: `${city} Night Bites`, address: `${city} Riverside`, lat: lat - 0.009, lng: lng - 0.008, image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 2670, dietaryTags: ['Late Night'], priceLevel: '$', tags: ['Seen in 100+ plans'] },
  ];
}

function getBaseFoodList(destinationOrLocations) {
  const city = extractCityName(destinationOrLocations);
  if (FOOD_BY_DESTINATION[city]) return [...FOOD_BY_DESTINATION[city]];
  return generateGenericFood(city, getMapCenterForDestination(destinationOrLocations));
}

export function getFoodAndBeveragesForDestination(destinationOrLocations, options = {}) {
  const { searchQuery = '', dietaryFilter = 'All', sortBy = 'Recommended' } = options;
  let list = getBaseFoodList(destinationOrLocations);

  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q)
    );
  }

  if (dietaryFilter && dietaryFilter !== 'All') {
    list = list.filter((item) => item.dietaryTags.includes(dietaryFilter));
  }

  if (sortBy === 'Rating') list.sort((a, b) => b.rating - a.rating);
  else if (sortBy === 'Reviews') list.sort((a, b) => b.reviewCount - a.reviewCount);
  else if (sortBy === 'Name') list.sort((a, b) => a.name.localeCompare(b.name));

  return list;
}

export function searchFoodAddressSuggestions(destinationOrLocations, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  const [lat, lng] = getMapCenterForDestination(destinationOrLocations);
  const matches = getBaseFoodList(destinationOrLocations)
    .filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.address.toLowerCase().includes(q)
    )
    .map((item) => ({
      id: item.id,
      name: item.name,
      address: item.address,
      lat: item.lat,
      lng: item.lng,
    }));

  return [
    {
      id: `custom-food-${query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: query.trim(),
      address: 'Custom location',
      lat,
      lng,
    },
    ...matches,
  ].slice(0, 8);
}
