/**
 * Mock places by destination for "Add Places" flow.
 * In production this would be an API (e.g. Google Places / custom backend).
 * See docs/PLACES_INTEGRATION.md for how to switch to real places.
 */

import { CITY_COORDINATES, getCoordinatesForLocation } from './cityCoordinates';

/** Default map center [lat, lng] per destination (for map and custom places without coords). */
 export const DEFAULT_MAP_CENTERS = {
  Paris: [48.8566, 2.3522],
  Tokyo: [35.6762, 139.6503],
  Seattle: [47.6062, -122.3321],
  Bali: [-8.4095, 115.1889],
  Calgary: [51.0447, -114.0719],
  'Kuala Lumpur': [3.139, 101.6869],
  Munich: [48.1351, 11.5820],
};

const PLACES_BY_DESTINATION = {
  // Asia
  Tokyo: [
    { id: 't1', name: 'Senso-ji Temple', lat: 35.7148, lng: 139.7967, image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 89000, tags: ['Must go'], saved: false, overview: 'Ancient Buddhist temple in Asakusa, Tokyo\'s oldest temple.' },
    { id: 't2', name: 'Shibuya Crossing', lat: 35.6595, lng: 139.7004, image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 76000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'The world\'s busiest pedestrian crossing, iconic Tokyo experience.' },
    { id: 't3', name: 'teamLab Borderless', lat: 35.6252, lng: 139.7753, image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 34000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Immersive digital art museum with interactive installations.' },
    { id: 't4', name: 'Meiji Shrine', lat: 35.6764, lng: 139.6993, image: 'https://images.unsplash.com/photo-1548048026-5a1a941d93d3?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 52000, tags: ['Must go'], saved: false, overview: 'Serene Shinto shrine surrounded by forests in central Tokyo.' },
    { id: 't5', name: 'Tokyo Skytree', lat: 35.7101, lng: 139.8107, image: 'https://images.unsplash.com/photo-1554797589-7241bb691973?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 65000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Tallest structure in Japan with observation decks.' },
    { id: 't6', name: 'Tsukiji Outer Market', lat: 35.6654, lng: 139.7707, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 41000, tags: ['Hidden gem'], saved: false, overview: 'Famous fish market with fresh seafood and street food.' },
  ],
  Osaka: [
    { id: 'os1', name: 'Osaka Castle', lat: 34.6873, lng: 135.5262, image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 72000, tags: ['Must go'], saved: false, overview: 'Historic 16th-century castle with museum and beautiful grounds.' },
    { id: 'os2', name: 'Dotonbori', lat: 34.6687, lng: 135.5020, image: 'https://images.unsplash.com/photo-1590559899607-ba7e0b5f4d20?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 58000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Vibrant entertainment district famous for neon lights and street food.' },
    { id: 'os3', name: 'Shitennoji Temple', lat: 34.6544, lng: 135.5169, image: 'https://images.unsplash.com/photo-1478436127897-769e1b3f0f36?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 12000, tags: ['Seen in 100+ plans'], saved: false, overview: 'One of Japan\'s oldest Buddhist temples, founded in 593 AD.' },
    { id: 'os4', name: 'Kuromon Ichiba Market', lat: 34.6658, lng: 135.5060, image: 'https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 28000, tags: ['Hidden gem'], saved: false, overview: 'Bustling food market known as "Osaka\'s Kitchen".' },
    { id: 'os5', name: 'Umeda Sky Building', lat: 34.7054, lng: 135.4903, image: 'https://images.unsplash.com/photo-1480796927426-f609979314bd?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 19000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Futuristic skyscraper with floating garden observatory.' },
    { id: 'os6', name: 'Sumiyoshi Taisha', lat: 34.6179, lng: 135.4985, image: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 9800, tags: ['Hidden gem'], saved: false, overview: 'Ancient Shinto shrine with unique architectural style.' },
  ],
  'Kuala Lumpur': [
    { id: 'kl1', name: 'Petronas Twin Towers', lat: 3.1579, lng: 101.7116, image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 125000, tags: ['Must go'], saved: false, overview: 'Iconic twin skyscrapers, tallest twin towers in the world.' },
    { id: 'kl2', name: 'Batu Caves', lat: 3.2379, lng: 101.6841, image: 'https://images.unsplash.com/photo-1565968139413-be25a1a86d8e?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 98000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Hindu shrine in limestone caves with giant golden statue.' },
    { id: 'kl3', name: 'KL Tower', lat: 3.1529, lng: 101.7013, image: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 45000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Communications tower with observation deck and revolving restaurant.' },
    { id: 'kl4', name: 'Jalan Alor Food Street', lat: 3.1466, lng: 101.7072, image: 'https://images.unsplash.com/photo-1555243896-c709bfa0b564?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 38000, tags: ['Hidden gem'], saved: false, overview: 'Famous street food hub with Malaysian and Chinese delicacies.' },
    { id: 'kl5', name: 'Merdeka Square', lat: 3.1478, lng: 101.6952, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 28000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Historic square where Malaysian independence was declared.' },
    { id: 'kl6', name: 'Central Market', lat: 3.1445, lng: 101.6953, image: 'https://images.unsplash.com/photo-1567696153798-9196c9c43365?w=400&h=280&fit=crop', rating: 4.3, reviewCount: 22000, tags: ['Hidden gem'], saved: false, overview: 'Cultural landmark with local arts, crafts, and food.' },
  ],
  // Europe
  Paris: [
    { id: 'p1', name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, image: 'https://images.unsplash.com/photo-1511739001486-6deeccf9e30e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 125000, tags: ['Must go'], saved: false, overview: 'Iconic iron lattice tower, symbol of Paris.' },
    { id: 'p2', name: 'Louvre Museum', lat: 48.8606, lng: 2.3376, image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=280&fit=crop', rating: 4.9, reviewCount: 98000, tags: ['Must go'], saved: false, overview: 'World\'s largest art museum, home to the Mona Lisa.' },
    { id: 'p3', name: 'Montmartre', lat: 48.8867, lng: 2.3431, image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 45000, tags: ['Hidden gem'], saved: false, overview: 'Historic hilltop district with artists and the Sacré-Cœur.' },
    { id: 'p4', name: 'Sainte-Chapelle', lat: 48.8559, lng: 2.3452, image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 32000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Gothic chapel with stunning stained glass windows.' },
    { id: 'p5', name: 'Versailles Palace', lat: 48.8048, lng: 2.1204, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 112000, tags: ['Must go'], saved: false, overview: 'Opulent royal palace with magnificent gardens.' },
    { id: 'p6', name: 'Canal Saint-Martin', lat: 48.8689, lng: 2.3653, image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 12000, tags: ['Hidden gem'], saved: false, overview: 'Charming waterway with bridges and trendy cafés.' },
  ],
  Munich: [
    { id: 'm1', name: 'Marienplatz', lat: 48.1374, lng: 11.5755, image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 82000, tags: ['Must go'], saved: false, overview: 'Central square with the famous Glockenspiel clock tower.' },
    { id: 'm2', name: 'Neuschwanstein Castle', lat: 47.5576, lng: 10.7498, image: 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 156000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Fairytale castle nestled in Bavarian Alps, inspired Disney.' },
    { id: 'm3', name: 'English Garden', lat: 48.1641, lng: 11.6049, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 48000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Large public park with beer gardens and surfing river.' },
    { id: 'm4', name: 'Viktualienmarkt', lat: 48.1351, lng: 11.5763, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 32000, tags: ['Hidden gem'], saved: false, overview: 'Daily food market with Bavarian specialties and beer garden.' },
    { id: 'm5', name: 'BMW Museum', lat: 48.1769, lng: 11.5587, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 28000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Museum showcasing BMW\'s automotive history and innovations.' },
    { id: 'm6', name: 'Hofbräuhaus', lat: 48.1375, lng: 11.5797, image: 'https://images.unsplash.com/photo-1617395645257-2a9b8bf1c1e9?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 92000, tags: ['Must go'], saved: false, overview: 'Historic beer hall, Munich\'s most famous brewery.' },
  ],
  Seattle: [
    { id: 's1', name: 'Space Needle', lat: 47.6205, lng: -122.3493, image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 52000, tags: ['Must go'], saved: false, overview: 'Iconic observation tower with 360-degree city views.' },
    { id: 's2', name: 'Pike Place Market', lat: 47.6097, lng: -122.3425, image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 68000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Historic market with fresh seafood, produce, and crafts.' },
    { id: 's3', name: 'Chihuly Garden and Glass', lat: 47.6204, lng: -122.3491, image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 22000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Stunning glass art exhibition by Dale Chihuly.' },
    { id: 's4', name: 'Discovery Park', lat: 47.6607, lng: -122.4155, image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 15000, tags: ['Hidden gem'], saved: false, overview: 'Seattle\'s largest park with beaches and lighthouse.' },
    { id: 's5', name: 'Museum of Pop Culture', lat: 47.6215, lng: -122.3481, image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=280&fit=crop', rating: 4.4, reviewCount: 18000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Music, sci-fi, and pop culture museum in striking building.' },
    { id: 's6', name: 'Kerry Park', lat: 47.6295, lng: -122.3599, image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 12000, tags: ['Hidden gem'], saved: false, overview: 'Best viewpoint for classic Seattle skyline photos.' },
  ],
  Bali: [
    { id: 'b1', name: 'Tegallalang Rice Terraces', lat: -8.4284, lng: 115.2764, image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 42000, tags: ['Must go'], saved: false, overview: 'Stunning terraced rice fields in Ubud.' },
    { id: 'b2', name: 'Tanah Lot', lat: -8.6211, lng: 115.0868, image: 'https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 38000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Ancient Hindu temple on a rock in the ocean.' },
    { id: 'b3', name: 'Ubud Monkey Forest', lat: -8.5183, lng: 115.2593, image: 'https://images.unsplash.com/photo-1580104816385-0c1d70e2b47a?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 31000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Sacred forest sanctuary home to hundreds of monkeys.' },
    { id: 'b4', name: 'Campuhan Ridge Walk', lat: -8.5069, lng: 115.2625, image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 12000, tags: ['Hidden gem'], saved: false, overview: 'Scenic walking trail through lush jungle landscape.' },
    { id: 'b5', name: 'Uluwatu Temple', lat: -8.8290, lng: 115.0857, image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 52000, tags: ['Must go'], saved: false, overview: 'Clifftop temple famous for sunset views and Kecak dance.' },
    { id: 'b6', name: 'Tirta Empul Temple', lat: -8.4149, lng: 115.3151, image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 24000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Sacred water temple with purification pools.' },
  ],
  'New York': [
    { id: 'ny1', name: 'Statue of Liberty', lat: 40.6892, lng: -74.0445, image: 'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 145000, tags: ['Must go'], saved: false, overview: 'Iconic symbol of freedom and democracy.' },
    { id: 'ny2', name: 'Central Park', lat: 40.7829, lng: -73.9654, image: 'https://images.unsplash.com/photo-1568515387631-8b650bbcdb90?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 112000, tags: ['Must go'], saved: false, overview: 'Massive urban park in the heart of Manhattan.' },
    { id: 'ny3', name: 'Empire State Building', lat: 40.7484, lng: -73.9857, image: 'https://images.unsplash.com/photo-1564868498149-c386c488d25c?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 98000, tags: ['Seen in 100+ plans'], saved: false, overview: 'Art Deco skyscraper with observation decks.' },
    { id: 'ny4', name: 'Brooklyn Bridge', lat: 40.7061, lng: -73.9969, image: 'https://images.unsplash.com/photo-1546436836-07a91091f160?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 72000, tags: ['Must go'], saved: false, overview: 'Historic suspension bridge connecting Manhattan and Brooklyn.' },
    { id: 'ny5', name: 'The High Line', lat: 40.7480, lng: -74.0048, image: 'https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 42000, tags: ['Hidden gem'], saved: false, overview: 'Elevated park built on historic freight rail line.' },
    { id: 'ny6', name: 'Museum of Modern Art', lat: 40.7614, lng: -73.9776, image: 'https://images.unsplash.com/photo-1576675466853-f2b0a85d8f96?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 52000, tags: ['Seen in 100+ plans'], saved: false, overview: 'World-renowned modern and contemporary art museum.' },
  ],
  'Mexico City': [
    { id: 'mx1', name: 'Zócalo', lat: 19.4326, lng: -99.1332, image: 'https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 62000, tags: ['Must go'], saved: false, overview: 'Main square and heart of Mexico City, one of the largest plazas in the world.' },
    { id: 'mx2', name: 'Teotihuacán', lat: 19.6925, lng: -98.8438, image: 'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?w=400&h=280&fit=crop', rating: 4.8, reviewCount: 85000, tags: ['Must go', 'Seen in 100+ plans'], saved: false, overview: 'Ancient Mesoamerican city with massive pyramids.' },
    { id: 'mx3', name: 'Frida Kahlo Museum', lat: 19.3551, lng: -99.1625, image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=280&fit=crop', rating: 4.7, reviewCount: 38000, tags: ['Seen in 100+ plans'], saved: false, overview: 'The Blue House where Frida Kahlo lived and worked.' },
    { id: 'mx4', name: 'Chapultepec Park', lat: 19.4204, lng: -99.1833, image: 'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 28000, tags: ['Hidden gem'], saved: false, overview: 'One of the largest city parks in the world with museums and castle.' },
    { id: 'mx5', name: 'Xochimilco', lat: 19.2586, lng: -99.1029, image: 'https://images.unsplash.com/photo-1512813498716-3e640fed3f39?w=400&h=280&fit=crop', rating: 4.6, reviewCount: 42000, tags: ['Must go'], saved: false, overview: 'Ancient canals with colorful trajinera boats.' },
    { id: 'mx6', name: 'Coyoacán', lat: 19.3500, lng: -99.1622, image: 'https://images.unsplash.com/photo-1566442806814-1a7b8b4a79f2?w=400&h=280&fit=crop', rating: 4.5, reviewCount: 22000, tags: ['Hidden gem'], saved: false, overview: 'Charming colonial neighborhood with cobblestone streets.' },
  ],
};

/**
 * Generate generic places for cities that don't have specific hardcoded places.
 * This provides a better experience than showing no places at all.
 */
function generateGenericPlaces(cityName, center) {
  const [lat, lng] = center;
  const city = cityName || 'this city';
  
  // Generate 24 diverse place categories with offsets from center
  return [
    // Major landmarks
    { 
      id: `${city}-historic-1`, 
      name: `Historic Center of ${city}`, 
      lat: lat + 0.003, 
      lng: lng + 0.003, 
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=280&fit=crop', 
      rating: 4.6, 
      reviewCount: 12500, 
      tags: ['Must go'], 
      saved: false 
    },
    { 
      id: `${city}-cathedral-1`, 
      name: `${city} Cathedral`, 
      lat: lat - 0.010, 
      lng: lng + 0.015, 
      image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', 
      rating: 4.6, 
      reviewCount: 7800, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-square-1`, 
      name: `Main Square`, 
      lat: lat + 0.003, 
      lng: lng - 0.005, 
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 9100, 
      tags: ['Must go'], 
      saved: false 
    },
    { 
      id: `${city}-castle-1`, 
      name: `${city} Castle`, 
      lat: lat + 0.018, 
      lng: lng + 0.012, 
      image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=400&h=280&fit=crop', 
      rating: 4.7, 
      reviewCount: 11200, 
      tags: ['Must go', 'Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-viewpoint-1`, 
      name: `${city} Viewpoint`, 
      lat: lat + 0.015, 
      lng: lng + 0.015, 
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=280&fit=crop', 
      rating: 4.8, 
      reviewCount: 4200, 
      tags: ['Must go', 'Seen in 100+ plans'], 
      saved: false 
    },
    
    // Museums and culture
    { 
      id: `${city}-museum-1`, 
      name: `${city} National Museum`, 
      lat: lat - 0.008, 
      lng: lng + 0.010, 
      image: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 8900, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-art-museum-1`, 
      name: `${city} Art Gallery`, 
      lat: lat + 0.009, 
      lng: lng - 0.011, 
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=400&h=280&fit=crop', 
      rating: 4.4, 
      reviewCount: 5600, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-history-museum-1`, 
      name: `${city} History Center`, 
      lat: lat - 0.013, 
      lng: lng + 0.008, 
      image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', 
      rating: 4.3, 
      reviewCount: 4800, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    
    // Parks and gardens
    { 
      id: `${city}-park-1`, 
      name: `Central Park`, 
      lat: lat + 0.012, 
      lng: lng - 0.008, 
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=280&fit=crop', 
      rating: 4.4, 
      reviewCount: 6700, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-garden-1`, 
      name: `${city} Botanical Garden`, 
      lat: lat - 0.015, 
      lng: lng - 0.010, 
      image: 'https://images.unsplash.com/photo-1578894381163-e72c17f2d45f?w=400&h=280&fit=crop', 
      rating: 4.4, 
      reviewCount: 3600, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-riverside-1`, 
      name: `${city} Riverside Walk`, 
      lat: lat + 0.008, 
      lng: lng + 0.020, 
      image: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 5200, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    
    // Markets and shopping
    { 
      id: `${city}-market-1`, 
      name: `${city} Central Market`, 
      lat: lat - 0.006, 
      lng: lng - 0.012, 
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop', 
      rating: 4.7, 
      reviewCount: 5400, 
      tags: ['Must go', 'Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-shopping-1`, 
      name: `${city} Shopping District`, 
      lat: lat + 0.007, 
      lng: lng - 0.014, 
      image: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=400&h=280&fit=crop', 
      rating: 4.3, 
      reviewCount: 7100, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-flea-market-1`, 
      name: `${city} Flea Market`, 
      lat: lat - 0.020, 
      lng: lng + 0.018, 
      image: 'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 2900, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    
    // Religious sites
    { 
      id: `${city}-temple-1`, 
      name: `${city} Historic Temple`, 
      lat: lat + 0.011, 
      lng: lng + 0.009, 
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop', 
      rating: 4.7, 
      reviewCount: 8300, 
      tags: ['Must go'], 
      saved: false 
    },
    { 
      id: `${city}-church-1`, 
      name: `Old Church of ${city}`, 
      lat: lat - 0.009, 
      lng: lng - 0.016, 
      image: 'https://images.unsplash.com/photo-1569949230765-0b0cbd80b59e?w=400&h=280&fit=crop', 
      rating: 4.4, 
      reviewCount: 4500, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    
    // Entertainment and nightlife
    { 
      id: `${city}-theater-1`, 
      name: `${city} Opera House`, 
      lat: lat + 0.006, 
      lng: lng + 0.013, 
      image: 'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=400&h=280&fit=crop', 
      rating: 4.6, 
      reviewCount: 6800, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-entertainment-1`, 
      name: `${city} Entertainment District`, 
      lat: lat - 0.011, 
      lng: lng + 0.021, 
      image: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 9800, 
      tags: ['Must go'], 
      saved: false 
    },
    
    // Food and restaurants
    { 
      id: `${city}-food-street-1`, 
      name: `${city} Food Street`, 
      lat: lat + 0.014, 
      lng: lng - 0.017, 
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=280&fit=crop', 
      rating: 4.8, 
      reviewCount: 12100, 
      tags: ['Must go', 'Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-restaurant-1`, 
      name: `Traditional ${city} Restaurant`, 
      lat: lat - 0.007, 
      lng: lng + 0.006, 
      image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=280&fit=crop', 
      rating: 4.6, 
      reviewCount: 3400, 
      tags: ['Hidden gem'], 
      saved: false 
    },
    
    // Architecture and landmarks
    { 
      id: `${city}-bridge-1`, 
      name: `${city} Historic Bridge`, 
      lat: lat + 0.019, 
      lng: lng - 0.013, 
      image: 'https://images.unsplash.com/photo-1511739001486-6deeccf9e30e?w=400&h=280&fit=crop', 
      rating: 4.5, 
      reviewCount: 5900, 
      tags: ['Seen in 100+ plans'], 
      saved: false 
    },
    { 
      id: `${city}-tower-1`, 
      name: `${city} Tower`, 
      lat: lat - 0.016, 
      lng: lng - 0.022, 
      image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=280&fit=crop', 
      rating: 4.7, 
      reviewCount: 10500, 
      tags: ['Must go', 'Seen in 100+ plans'], 
      saved: false 
    },
    
    // Local experiences
    { 
      id: `${city}-neighborhood-1`, 
      name: `Old Town ${city}`, 
      lat: lat + 0.005, 
      lng: lng + 0.008, 
      image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=280&fit=crop', 
      rating: 4.6, 
      reviewCount: 7800, 
      tags: ['Must go', 'Hidden gem'], 
      saved: false 
    },
    { 
      id: `${city}-waterfront-1`, 
      name: `${city} Waterfront`, 
      lat: lat - 0.014, 
      lng: lng + 0.024, 
      image: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=280&fit=crop', 
      rating: 4.4, 
      reviewCount: 4100, 
      tags: ['Hidden gem'], 
      saved: false 
    },
  ];
}

const PLACE_FILTER_TAGS = ['Hidden gem', 'Must go', 'Seen in 100+ plans'];
const PLACE_SORT_OPTIONS = ['Recommended', 'Rating', 'Reviews', 'Name'];

/** Extract city name from destination string (e.g. "Munich, Germany" -> "Munich") */
function extractCityName(destinationOrLocations) {
  if (!destinationOrLocations) return 'this city';
  const str = String(destinationOrLocations).trim();
  
  // Remove common prefixes
  const cleaned = str
    .replace(/^(Trip to|Visit|Explore)\s+/i, '')
    .trim();
  
  // Get first part before comma or take whole string
  const parts = cleaned.split(',');
  return parts[0].trim() || 'this city';
}

/** Normalize destination for lookup (e.g. "Alberta, Calgary, Canada" -> "Calgary", "7 days to Seattle" -> "Seattle") */
function normalizeDestination(destinationOrLocations, keys = Object.keys(PLACES_BY_DESTINATION), fallbackKey = null) {
  if (!destinationOrLocations) return fallbackKey;
  const s = String(destinationOrLocations).trim();
  // Try known keys first
  for (const key of keys) {
    if (s.toLowerCase().includes(key.toLowerCase())) return key;
  }
  // Use first word or segment as fallback and match any key that contains it
  const first = s.split(/[\s,]+/)[0];
  for (const key of keys) {
    if (key.toLowerCase().includes(first?.toLowerCase() || '')) return key;
  }
  return fallbackKey;
}

/**
 * Get places for a trip destination. Optionally filter by search query, tag, and sort.
 */
export function getPlacesForDestination(destinationOrLocations, options = {}) {
  const { searchQuery = '', filterTag = '', sortBy = 'Recommended' } = options;
  const key = normalizeDestination(destinationOrLocations, Object.keys(PLACES_BY_DESTINATION));
  let list = [...(key ? (PLACES_BY_DESTINATION[key] || []) : [])];
  
  // If no hardcoded places exist for this destination, generate generic ones
  if (list.length === 0 && destinationOrLocations) {
    const center = getMapCenterForDestination(destinationOrLocations);
    const cityName = extractCityName(destinationOrLocations);
    list = generateGenericPlaces(cityName, center);
  }

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
  // First try the comprehensive coordinates database
  const coords = getCoordinatesForLocation(destinationOrLocations);
  if (coords && coords[0] !== 48.8566) { // If it's not the default Paris fallback
    return coords;
  }
  
  // Fallback to the hardcoded centers for known destinations
  const key = normalizeDestination(destinationOrLocations, Object.keys(DEFAULT_MAP_CENTERS), 'Paris');
  return DEFAULT_MAP_CENTERS[key] || coords || [48.8566, 2.3522];
}

function dedupeAddressSuggestions(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.name || ''}__${item.address || ''}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Build local address suggestions for the custom-place form.
 * This is intentionally local/mock data only, not real geocoding.
 */
export function searchAddressSuggestions(destinationOrLocations, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const [fallbackLat, fallbackLng] = getMapCenterForDestination(destinationOrLocations);
  const places = getPlacesForDestination(destinationOrLocations)
    .map((place) => getPlaceDetails(place))
    .filter((place) =>
      (place.name && place.name.toLowerCase().includes(q)) ||
      (place.address && place.address.toLowerCase().includes(q))
    )
    .map((place) => ({
      id: `place-${place.id}`,
      name: place.name,
      address: place.address || place.name,
      lat: place.lat ?? fallbackLat,
      lng: place.lng ?? fallbackLng,
      source: 'Known place',
    }));

  return dedupeAddressSuggestions([
    {
      id: `custom-${query.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: query.trim(),
      address: 'Custom location',
      lat: fallbackLat,
      lng: fallbackLng,
      source: 'Custom location',
    },
    ...places,
  ]).slice(0, 8);
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
  
  // For generic places without hardcoded details, create reasonable defaults
  const hasDetails = !!PLACE_DETAILS[place.id];
  const placeName = place.name || 'Place';
  
  return {
    ...place,
    overview: details.overview ?? (hasDetails ? '' : `${placeName} is a popular destination worth visiting. Explore local culture, architecture, and attractions in the area.`),
    address: details.address ?? (hasDetails ? '' : placeName),
    hours: details.hours ?? {},
    isOpenNow: details.isOpenNow ?? null,
    website: details.website ?? '',
    googleMapsReviewUrl: details.googleMapsReviewUrl ?? (hasDetails ? '' : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName)}`),
    nearbyPlaceIds: details.nearbyPlaceIds ?? [],
  };
}

/** Get nearby places for a place (by id) within the same destination. */
export function getNearbyPlaces(place, destinationOrLocations) {
  const key = normalizeDestination(destinationOrLocations);
  let allPlaces = PLACES_BY_DESTINATION[key];
  
  // If no hardcoded places exist, get the generic ones
  if (!allPlaces || allPlaces.length === 0) {
    allPlaces = getPlacesForDestination(destinationOrLocations);
  }
  
  const details = place && place.id ? (PLACE_DETAILS[place.id] || {}) : {};
  const ids = details.nearbyPlaceIds && details.nearbyPlaceIds.length > 0
    ? details.nearbyPlaceIds
    : allPlaces.filter((p) => p.id !== (place && place.id)).map((p) => p.id).slice(0, 4);
  return ids.map((id) => allPlaces.find((p) => p.id === id)).filter(Boolean);
}

export { PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS, PLACES_BY_DESTINATION, normalizeDestination };
