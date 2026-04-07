export const GOOGLE_PLACE_TYPES = [
  'tourist_attraction',
  'museum',
  'art_gallery',
  'park',
  'point_of_interest',
  'amusement_park',
  'aquarium',
  'zoo',
  'stadium',
  'shopping_mall',
];

export const GOOGLE_FOOD_TYPES = [
  'restaurant',
  'cafe',
  'bar',
  'bakery',
  'meal_delivery',
  'meal_takeaway',
  'night_club',
  'food',
];

export const GOOGLE_TWO_PAGE_PLACE_TYPES = ['tourist_attraction', 'museum', 'point_of_interest'];
export const GOOGLE_TWO_PAGE_FOOD_TYPES = ['restaurant', 'cafe', 'bar'];
export const GOOGLE_CORE_PLACE_TYPES = ['tourist_attraction', 'point_of_interest', 'museum'];

export const GOOGLE_TEXT_FALLBACK_QUERIES = [
  'tourist attractions',
  'landmarks',
  'best viewpoints',
  'historic sites',
];

export const GOOGLE_TOURIST_TYPE_SET = new Set([
  'tourist_attraction',
  'museum',
  'art_gallery',
  'park',
  'point_of_interest',
  'landmark',
  'amusement_park',
  'aquarium',
  'zoo',
  'stadium',
]);

export const GOOGLE_FOOD_TYPE_SET = new Set([
  'restaurant',
  'cafe',
  'bar',
  'food',
  'bakery',
  'meal_takeaway',
  'meal_delivery',
  'night_club',
]);

export const STAY_ACCOMMODATION_TYPES = ['lodging', 'hotel', 'motel', 'resort_hotel', 'extended_stay_hotel'];

export const STAY_DEFAULT_PRICE_BY_TYPE = {
  Guesthouse: 60,
  Motel: 80,
  Accommodation: 105,
  Hotel: 145,
  'Extended Stay': 165,
  Resort: 220,
};

export const STAY_LEVEL_BASE_PRICE = {
  1: 65,
  2: 110,
  3: 170,
  4: 255,
  5: 380,
};

export const STAY_TYPE_MULTIPLIER = {
  Guesthouse: 0.85,
  Motel: 0.95,
  Accommodation: 1.0,
  Hotel: 1.08,
  'Extended Stay': 1.18,
  Resort: 1.32,
};

export const STAY_SURROUNDING_DISTANCES = {
  airport: '12 km',
  cityCenter: '3.5 km',
  beachResort: '500 m',
  beachDefault: '8 km',
};

export const STAY_DEFAULT_POLICIES = {
  checkIn: 'After 15:00',
  checkOut: 'Before 12:00',
  children: 'Free for children under 12 years old. Extra bed: SGD 50.00 per stay',
  smoking: 'Non-smoking rooms available',
  parking: 'Parking available. Cost: SGD 20.00 per day',
  payment: 'All major credit cards accepted',
};

export const STAY_DYNAMIC_POLICY_DEFAULTS = {
  petsAllowedMinRating: 4.5,
  petsAllowed: 'Pets allowed (fee applies)',
  petsNotAllowed: 'Pets not allowed',
  strictCancellationLevel: 3,
  strictCancellation: 'Free cancellation up to 24 hours before check-in',
  relaxedCancellation: 'Free cancellation up to 48 hours before check-in',
};

export const STAY_DEFAULT_CURRENCY = 'USD';

export const COMMUNITY_PERSONAS = [
  {
    name: 'Jamie Estella',
    travelStyle: 'Culture + city wanderer',
    interests: ['Landmarks', 'Architecture', 'Neighborhood walks'],
    avatar: '',
    titlePattern: 'A Journey Through Time: My Unforgettable {days} Days in {destination}',
    type: 'Culture & Art',
  },
  {
    name: 'Brandi Bartlett',
    travelStyle: 'Food-first explorer',
    interests: ['Street food', 'Local markets', 'Hidden gems'],
    avatar: '',
    titlePattern: '{destination} Between Bites and Views: My {days}-Day Food Trail',
    type: 'Foodie',
  },
  {
    name: 'Noah Chua',
    travelStyle: 'Adventure + photo spots',
    interests: ['Viewpoints', 'Sunset spots', 'Active days'],
    avatar: '',
    titlePattern: '{destination} in Motion: {days} Days of Views, Walks, and Big Energy',
    type: 'Adventure',
  },
];

export const COMMUNITY_DAY_TITLE_PRESETS = [
  'Exploring the iconic core of {destination}',
  'Neighborhood gems and slower moments',
  'Skyline views, local flavors, and a perfect finish',
];

export const COMMUNITY_DAY_TITLE_BY_PERSONA = [
  [
    'Old quarter landmarks and museums in {destination}',
    'Architecture trail and hidden courtyards',
    'Cultural finale with sunset viewpoints',
  ],
  [
    '{destination} breakfast markets and coffee stops',
    'Street food circuit and local kitchens',
    'Signature dinner spots and dessert lanes',
  ],
  [
    'Sunrise viewpoints and high-energy start',
    'Scenic walks, photo points, and action',
    'Golden-hour route and night views',
  ],
];

export const COMMUNITY_DURATIONS = [2, 3, 4];

export const FALLBACK_IMAGE_DEFAULTS = {
  title: 'Image unavailable',
  subtitle: 'Travel photo placeholder',
  errorSubtitle: 'Please try again',
  defaultTopic: 'travel',
  defaultTopicLabel: 'Travel',
};
