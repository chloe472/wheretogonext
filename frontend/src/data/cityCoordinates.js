/**
 * City coordinates for map centering.
 * Format: { cityName: [lat, lng] }
 * This allows any city to show the correct map location.
 */
export const CITY_COORDINATES = {
  // Europe
  'Athens': [37.9838, 23.7275],
  'Thessaloniki': [40.6401, 22.9444],
  'Santorini': [36.3932, 25.4615],
  'Mykonos': [37.4467, 25.3289],
  'Paris': [48.8566, 2.3522],
  'Lyon': [45.7640, 4.8357],
  'Marseille': [43.2965, 5.3698],
  'London': [51.5074, -0.1278],
  'Manchester': [53.4808, -2.2426],
  'Edinburgh': [55.9533, -3.1883],
  'Birmingham': [52.4862, -1.8904],
  'Rome': [41.9028, 12.4964],
  'Milan': [45.4642, 9.1900],
  'Venice': [45.4408, 12.3155],
  'Florence': [43.7696, 11.2558],
  'Naples': [40.8518, 14.2681],
  'Barcelona': [41.3851, 2.1734],
  'Madrid': [40.4168, -3.7038],
  'Seville': [37.3891, -5.9845],
  'Valencia': [39.4699, -0.3763],
  'Berlin': [52.5200, 13.4050],
  'Munich': [48.1351, 11.5820],
  'Hamburg': [53.5511, 9.9937],
  'Cologne': [50.9375, 6.9603],
  'Frankfurt': [50.1109, 8.6821],
  'Amsterdam': [52.3676, 4.9041],
  'Rotterdam': [51.9225, 4.4792],
  'Brussels': [50.8503, 4.3517],
  'Vienna': [48.2082, 16.3738],
  'Zurich': [47.3769, 8.5417],
  'Geneva': [46.2044, 6.1432],
  'Lisbon': [38.7223, -9.1393],
  'Porto': [41.1579, -8.6291],
  'Dublin': [53.3498, -6.2603],
  'Copenhagen': [55.6761, 12.5683],
  'Stockholm': [59.3293, 18.0686],
  'Oslo': [59.9139, 10.7522],
  'Helsinki': [60.1699, 24.9384],
  'Reykjavik': [64.1466, -21.9426],
  'Warsaw': [52.2297, 21.0122],
  'Kraków': [50.0647, 19.9450],
  'Prague': [50.0755, 14.4378],
  'Budapest': [47.4979, 19.0402],
  'Bucharest': [44.4268, 26.1025],
  'Sofia': [42.6977, 23.3219],
  'Moscow': [55.7558, 37.6173],
  'Saint Petersburg': [59.9343, 30.3351],
  'Istanbul': [41.0082, 28.9784],
  'Ankara': [39.9334, 32.8597],
  'Antalya': [36.8969, 30.7133],
  
  // Middle East & Africa
  'Dubai': [25.2048, 55.2708],
  'Abu Dhabi': [24.4539, 54.3773],
  'Tel Aviv': [32.0853, 34.7818],
  'Jerusalem': [31.7683, 35.2137],
  'Cairo': [30.0444, 31.2357],
  'Marrakech': [31.6295, -7.9811],
  'Cape Town': [-33.9249, 18.4241],
  'Johannesburg': [-26.2041, 28.0473],
  'Nairobi': [-1.2864, 36.8172],
  'Zanzibar': [-6.1659, 39.2026],
  
  // Asia
  'Tokyo': [35.6762, 139.6503],
  'Osaka': [34.6937, 135.5023],
  'Kyoto': [35.0116, 135.7681],
  'Seoul': [37.5665, 126.9780],
  'Busan': [35.1796, 129.0756],
  'Beijing': [39.9042, 116.4074],
  'Shanghai': [31.2304, 121.4737],
  'Hong Kong': [22.3193, 114.1694],
  'Singapore': [1.3521, 103.8198],
  'Bangkok': [13.7563, 100.5018],
  'Phuket': [7.8804, 98.3923],
  'Ho Chi Minh City': [10.8231, 106.6297],
  'Hanoi': [21.0285, 105.8542],
  'Kuala Lumpur': [3.1390, 101.6869],
  'Bali': [-8.4095, 115.1889],
  'Jakarta': [-6.2088, 106.8456],
  'Manila': [14.5995, 120.9842],
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Goa': [15.2993, 74.1240],
  
  // Oceania
  'Sydney': [-33.8688, 151.2093],
  'Melbourne': [-37.8136, 144.9631],
  'Brisbane': [-27.4698, 153.0251],
  'Auckland': [-36.8485, 174.7633],
  'Queenstown': [-45.0312, 168.6626],
  
  // North America
  'New York': [40.7128, -74.0060],
  'Los Angeles': [34.0522, -118.2437],
  'San Francisco': [37.7749, -122.4194],
  'Miami': [25.7617, -80.1918],
  'Las Vegas': [36.1699, -115.1398],
  'Chicago': [41.8781, -87.6298],
  'Boston': [42.3601, -71.0589],
  'Seattle': [47.6062, -122.3321],
  'Washington': [38.9072, -77.0369],
  'Toronto': [43.6532, -79.3832],
  'Vancouver': [49.2827, -123.1207],
  'Montreal': [45.5017, -73.5673],
  'Calgary': [51.0447, -114.0719],
  'Quebec City': [46.8139, -71.2080],
  'Mexico City': [19.4326, -99.1332],
  'Cancún': [21.1619, -86.8515],
  'Tulum': [20.2114, -87.4654],
  'Havana': [23.1136, -82.3666],
  
  // South America
  'Santiago': [-33.4489, -70.6693],
  'Buenos Aires': [-34.6037, -58.3816],
  'Rio de Janeiro': [-22.9068, -43.1729],
  'São Paulo': [-23.5505, -46.6333],
  'Lima': [-12.0464, -77.0428],
  'Cusco': [-13.5319, -71.9675],
  'Bogotá': [4.7110, -74.0721],
  'Cartagena': [10.3910, -75.4794],
  'Quito': [-0.1807, -78.4678],
};

/**
 * Get coordinates for a city/location name.
 * Returns [lat, lng] or a default center if not found.
 */
export function getCoordinatesForLocation(locationName) {
  if (!locationName) return [48.8566, 2.3522]; // Default to Paris
  
  const name = String(locationName).trim();
  
  // Try exact match first
  if (CITY_COORDINATES[name]) {
    return CITY_COORDINATES[name];
  }
  
  // Try to find a city name within the location string
  // e.g., "Trip to Munich, Germany" or "Munich, Germany"
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (name.toLowerCase().includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  // Default to Paris if no match found
  return [48.8566, 2.3522];
}
