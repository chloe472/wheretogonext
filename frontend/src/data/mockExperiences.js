import { getMapCenterForDestination } from './mockPlaces';

export const EXPERIENCE_TYPES = ['All', 'Day Trips', 'Guided Tours', 'Attraction', 'Outdoor Activities', 'Cultural Tours', 'Food Tours'];
export const EXPERIENCE_PRICE_RANGES = ['All', 'US$0 - 50', 'US$50 - 100', 'US$100 - 200', 'US$200+'];
export const EXPERIENCE_DURATIONS = ['All', 'Less than 4 hours', '4-8 hours', '8-12 hours', 'Full day (12+ hours)'];
export const EXPERIENCE_SORT_OPTIONS = ['Most reviewed', 'Recently added', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Duration'];

const EXPERIENCES_BY_DESTINATION = {
  Tokyo: [
    {
      id: 'tokyo-exp-1',
      name: 'Private Mt. Fuji Day Tour By Car With Guide',
      type: 'Day Trips',
      duration: '12 hours',
      durationHours: 12,
      rating: 4.55,
      reviewCount: 11,
      price: 272.25,
      originalPrice: 544.50,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 35.3606,
      lng: 138.7274,
      image: 'https://images.unsplash.com/photo-1570459027562-4a916cc6113f?w=400&h=280&fit=crop',
      address: 'Mount Fuji, Kitayama, Fujinomiya, Shizuoka, Japan',
      description: 'Embark on an unforgettable private day tour of majestic Mt. Fuji, featuring breathtaking views and serene landscapes! Your personalized itinerary includes visits to Lake Kawaguchi, the stunning Chureito Pagoda with its iconic five-story vermillion structure framing Mt. Fuji, the picturesque Fuji-Q Highland, the serene Oshino Hakkai with its eight spring-fed ponds, and the traditional Saiko Iyashi-no-Sato Nenba village.',
      highlights: [
        'Private tour with English-speaking guide',
        'Visit Lake Kawaguchi with stunning Mt. Fuji views',
        'Explore Chureito Pagoda',
        'Stop at Oshino Hakkai traditional village',
        'Entrance fees included'
      ],
      included: [
        'Hotel pick up and drop off',
        'Air-conditioned private vehicle',
        'English-speaking guide',
        'Fuel surcharge',
        'Parking fees'
      ],
      excluded: [
        'Entrance fees',
        'Food and drinks',
        'Gratuities',
        'Personal expenses'
      ],
      bookingOptions: [
        {
          id: 'private-standard',
          name: 'Private Tour',
          type: 'Private Tour',
          option: 'Standard',
          price: 272.25,
          originalPrice: 544.50,
          maxTravellers: 7,
          description: 'Private tour with dedicated guide and vehicle'
        },
        {
          id: 'private-premium',
          name: 'Private Tour',
          type: 'Private Tour',
          option: 'Premium',
          price: 350.00,
          originalPrice: 700.00,
          maxTravellers: 7,
          description: 'Premium private tour with luxury vehicle and experienced guide'
        }
      ],
      cancellationPolicy: 'To receive a full refund, travellers may cancel up to 24 hours before the experience start time in the local timezone. No refunds will be given after that time period.',
      confirmation: 'You\'ll get confirmation within minutes. If you don\'t get any confirmation, reach out to customer support',
      importantInfo: 'We will reach out to you to confirm your itinerary. Itineraries must be confirmed 3 days prior departure date, any changes in the itinerary is subject to approval by our reservations team. Never travel alone - our 24/7 help desk is always here for you!'
    },
    {
      id: 'tokyo-exp-2',
      name: 'Shirakawa-Go Village & Takayama UNESCO Day Trip',
      type: 'Day Trips',
      duration: '10 hours',
      durationHours: 10,
      rating: 4.5,
      reviewCount: 8,
      price: 145.20,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 36.2579,
      lng: 136.9093,
      image: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=400&h=280&fit=crop',
      address: 'Shirakawa, Ono District, Gifu, Japan',
      description: 'Visit the UNESCO World Heritage Site of Shirakawa-go and the charming town of Takayama on this full-day tour from Tokyo. Marvel at the traditional gassho-zukuri farmhouses, explore Takayama\'s old town, and enjoy the scenic beauty of the Japanese countryside.',
      highlights: [
        'UNESCO World Heritage Site visit',
        'Traditional gassho-zukuri farmhouses',
        'Takayama old town exploration',
        'Scenic countryside views',
        'English-speaking guide'
      ],
      included: [
        'Round-trip transportation',
        'English-speaking guide',
        'Entrance fees to main attractions'
      ],
      excluded: [
        'Lunch',
        'Personal expenses',
        'Travel insurance'
      ],
      bookingOptions: [
        {
          id: 'group-standard',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Standard',
          price: 145.20,
          maxTravellers: 20,
          description: 'Join a group tour with other travelers'
        }
      ],
      cancellationPolicy: 'Cancel up to 48 hours before for full refund',
      confirmation: 'Instant confirmation upon booking',
      importantInfo: 'Tour operates in all weather conditions. Please dress appropriately.'
    },
    {
      id: 'tokyo-exp-3',
      name: 'Private 100% Customizable Tour: Tokyo In A Day',
      type: 'Guided Tours',
      duration: '12 hours',
      durationHours: 12,
      rating: 4.6,
      reviewCount: 10,
      price: 82.48,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 35.6762,
      lng: 139.6503,
      image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=280&fit=crop',
      address: 'Tokyo, Japan',
      description: 'Experience Tokyo your way with this fully customizable private tour. Work with your guide to create the perfect itinerary based on your interests. Visit iconic landmarks, hidden gems, trendy neighborhoods, or traditional areas - it\'s all up to you!',
      highlights: [
        '100% customizable itinerary',
        'Private guide and transportation',
        'Flexible start time',
        'Visit up to 8 locations',
        'Local insider knowledge'
      ],
      included: [
        'Private English-speaking guide',
        'Hotel pickup',
        'Transportation costs',
        'Guide\'s entrance fees'
      ],
      excluded: [
        'Your entrance fees',
        'Food and drinks',
        'Gratuities'
      ],
      bookingOptions: [
        {
          id: 'private-8h',
          name: 'Private Tour',
          type: 'Private Tour',
          option: '8 Hours',
          price: 82.48,
          maxTravellers: 6,
          description: '8-hour customizable private tour'
        },
        {
          id: 'private-12h',
          name: 'Private Tour',
          type: 'Private Tour',
          option: '12 Hours',
          price: 120.00,
          maxTravellers: 6,
          description: '12-hour customizable private tour'
        }
      ],
      cancellationPolicy: 'Free cancellation up to 24 hours before start time',
      confirmation: 'Instant confirmation. Guide will contact you to plan itinerary',
      importantInfo: 'Please provide your interests and preferences at booking to help plan your day'
    },
    {
      id: 'tokyo-exp-4',
      name: 'Nikko UNESCO Shrine And Nature View Day Tour',
      type: 'Day Trips',
      duration: '12 hours',
      durationHours: 12,
      rating: 4.6,
      reviewCount: 10,
      price: 68.74,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 36.7581,
      lng: 139.5986,
      image: 'https://images.unsplash.com/photo-1624253321-ce2fa642f025?w=400&h=280&fit=crop',
      address: 'Nikko, Tochigi, Japan',
      description: 'Explore the UNESCO World Heritage shrines and temples of Nikko on this day trip from Tokyo. Visit Toshogu Shrine, Lake Chuzenji, and Kegon Falls while learning about Japanese history and culture from your knowledgeable guide.',
      highlights: [
        'UNESCO World Heritage sites',
        'Toshogu Shrine complex',
        'Lake Chuzenji scenic views',
        'Kegon Falls waterfall',
        'English-speaking guide'
      ],
      included: [
        'Round-trip transportation',
        'English-speaking guide',
        'Shrine entrance fees'
      ],
      excluded: [
        'Lunch',
        'Optional activities',
        'Personal expenses'
      ],
      bookingOptions: [
        {
          id: 'group-standard',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Standard',
          price: 68.74,
          maxTravellers: 25,
          description: 'Group tour with English-speaking guide'
        }
      ],
      cancellationPolicy: 'Cancel up to 24 hours before for full refund',
      confirmation: 'Confirmation received within 48 hours, subject to availability',
      importantInfo: 'Moderate walking involved. Comfortable shoes recommended.'
    },
    {
      id: 'tokyo-exp-5',
      name: 'Momotaro\'s Karakuri Museum',
      type: 'Attraction',
      duration: '30 minutes',
      durationHours: 0.5,
      rating: 4.2,
      reviewCount: 156,
      price: 1.31,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 35.6804,
      lng: 139.7690,
      image: 'https://images.unsplash.com/photo-1528164344705-47542687000d?w=400&h=280&fit=crop',
      address: 'Tokyo, Japan',
      description: 'Discover traditional Japanese mechanical puppets (karakuri) at this unique museum. Learn about the history and craftsmanship of these intricate automated dolls through interactive exhibits and demonstrations.',
      highlights: [
        'Traditional karakuri demonstrations',
        'Interactive exhibits',
        'Learn about Japanese craftsmanship',
        'Family-friendly'
      ],
      included: [
        'Museum entrance',
        'Guided demonstrations'
      ],
      excluded: [
        'Transportation',
        'Souvenirs'
      ],
      bookingOptions: [
        {
          id: 'standard-ticket',
          name: 'Standard Entry',
          type: 'General Admission',
          option: 'Standard',
          price: 1.31,
          maxTravellers: 100,
          description: 'General admission ticket'
        }
      ],
      cancellationPolicy: 'Non-refundable',
      confirmation: 'Instant confirmation',
      importantInfo: 'Open daily 10:00-17:00. Last entry 16:30.'
    }
  ],
  Singapore: [
    {
      id: 'singapore-exp-1',
      name: 'Singapore in 4 Days: Gardens, Food & Future',
      type: 'Cultural Tours',
      duration: '4 days',
      durationHours: 96,
      rating: 4.7,
      reviewCount: 24,
      price: 890.00,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 1.3521,
      lng: 103.8198,
      image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&h=280&fit=crop',
      address: 'Singapore',
      description: 'Experience the best of Singapore on this comprehensive 4-day tour. Explore Gardens by the Bay, Marina Bay Sands, Sentosa Island, and vibrant neighborhoods like Chinatown and Little India. Includes hawker center food tours and cultural experiences.',
      highlights: [
        'Gardens by the Bay and Supertrees',
        'Marina Bay Sands SkyPark',
        'Sentosa Island attractions',
        'Hawker center food tour',
        'Chinatown and Little India exploration'
      ],
      included: [
        'Hotel accommodation (3 nights)',
        'Daily breakfast',
        'Entrance fees to all attractions',
        'English-speaking guide',
        'Airport transfers'
      ],
      excluded: [
        'Lunch and dinner',
        'Personal expenses',
        'Optional activities'
      ],
      bookingOptions: [
        {
          id: 'standard-4day',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Standard',
          price: 890.00,
          maxTravellers: 15,
          description: '4-day package with 3-star hotel'
        },
        {
          id: 'premium-4day',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Premium',
          price: 1250.00,
          maxTravellers: 15,
          description: '4-day package with 5-star hotel'
        }
      ],
      cancellationPolicy: 'Cancel up to 7 days before for 50% refund. No refund within 7 days.',
      confirmation: 'Confirmation within 24 hours',
      importantInfo: 'Valid passport required. Moderate fitness level required.'
    },
    {
      id: 'singapore-exp-2',
      name: 'Singapore Zoo Morning Tour with Tram Ride',
      type: 'Day Trips',
      duration: '4 hours',
      durationHours: 4,
      rating: 4.8,
      reviewCount: 142,
      price: 45.00,
      pricePerTraveller: true,
      currency: 'US$',
      lat: 1.4043,
      lng: 103.7930,
      image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=400&h=280&fit=crop',
      address: '80 Mandai Lake Rd, Singapore 729826',
      description: 'Visit one of the world\'s best zoos with this morning tour. See over 2,800 animals in open, naturalistic habitats. Includes tram ride and breakfast with orangutans experience.',
      highlights: [
        'Award-winning Singapore Zoo',
        'Breakfast with orangutans',
        'Unlimited tram rides',
        'See over 2,800 animals'
      ],
      included: [
        'Zoo entrance ticket',
        'Hotel pickup and drop-off',
        'Breakfast',
        'Tram rides'
      ],
      excluded: [
        'Lunch',
        'Animal shows (available but optional)'
      ],
      bookingOptions: [
        {
          id: 'morning-tour',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Standard',
          price: 45.00,
          maxTravellers: 30,
          description: 'Morning tour with breakfast'
        }
      ],
      cancellationPolicy: 'Free cancellation up to 24 hours before',
      confirmation: 'Instant confirmation',
      importantInfo: 'Tour starts at 8:00 AM. Comfortable walking shoes recommended.'
    }
  ]
};

function extractCityName(destinationOrLocations) {
  if (!destinationOrLocations) return '';
  return String(destinationOrLocations).split(',')[0].trim();
}

function generateGenericExperiences(cityName, center) {
  const [lat, lng] = center;
  const city = cityName || 'City';
  return [
    {
      id: `${city}-exp-1`,
      name: `Private ${city} Day Tour`,
      type: 'Day Trips',
      duration: '8 hours',
      durationHours: 8,
      rating: 4.5,
      reviewCount: 20,
      price: 120.00,
      pricePerTraveller: true,
      currency: 'US$',
      lat: lat + 0.01,
      lng: lng - 0.01,
      image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=280&fit=crop',
      address: `${city}`,
      description: `Explore the best of ${city} on this comprehensive day tour. Visit iconic landmarks, local markets, and hidden gems with a knowledgeable guide.`,
      highlights: [
        `Major ${city} attractions`,
        'Local guide',
        'Hotel pickup included',
        'Flexible itinerary'
      ],
      included: ['Private guide', 'Transportation', 'Hotel pickup'],
      excluded: ['Entrance fees', 'Meals', 'Gratuities'],
      bookingOptions: [
        {
          id: 'private-standard',
          name: 'Private Tour',
          type: 'Private Tour',
          option: 'Standard',
          price: 120.00,
          maxTravellers: 6,
          description: 'Private tour with guide'
        }
      ],
      cancellationPolicy: 'Cancel up to 24 hours before for full refund',
      confirmation: 'Instant confirmation',
      importantInfo: 'Comfortable walking shoes recommended.'
    },
    {
      id: `${city}-exp-2`,
      name: `${city} Food Walking Tour`,
      type: 'Food Tours',
      duration: '3 hours',
      durationHours: 3,
      rating: 4.7,
      reviewCount: 45,
      price: 65.00,
      pricePerTraveller: true,
      currency: 'US$',
      lat: lat - 0.005,
      lng: lng + 0.008,
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=280&fit=crop',
      address: `${city}`,
      description: `Taste your way through ${city} on this guided food tour. Sample local delicacies, street food, and traditional dishes while learning about culinary history.`,
      highlights: [
        'Multiple food tastings',
        'Local cuisine insights',
        'Small group experience',
        'Expert foodie guide'
      ],
      included: ['Food tastings', 'Guide', 'Drinks'],
      excluded: ['Hotel pickup', 'Additional food'],
      bookingOptions: [
        {
          id: 'group-standard',
          name: 'Group Tour',
          type: 'Group Tour',
          option: 'Standard',
          price: 65.00,
          maxTravellers: 12,
          description: 'Small group food tour'
        }
      ],
      cancellationPolicy: 'Cancel up to 48 hours before for full refund',
      confirmation: 'Confirmation within 24 hours',
      importantInfo: 'May not be suitable for people with dietary restrictions.'
    }
  ];
}

function getBaseExperienceList(destinationOrLocations) {
  const city = extractCityName(destinationOrLocations);
  if (EXPERIENCES_BY_DESTINATION[city]) {
    return [...EXPERIENCES_BY_DESTINATION[city]];
  }
  return generateGenericExperiences(city, getMapCenterForDestination(destinationOrLocations));
}

export function getExperiencesForDestination(destinationOrLocations, options = {}) {
  const { searchQuery = '', typeFilter = 'All', priceRange = 'All', durationFilter = 'All', sortBy = 'Recently added' } = options;
  let list = getBaseExperienceList(destinationOrLocations);

  // Search filter
  if (searchQuery.trim()) {
    const q = searchQuery.trim().toLowerCase();
    list = list.filter((item) =>
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.type.toLowerCase().includes(q)
    );
  }

  // Type filter
  if (typeFilter && typeFilter !== 'All') {
    list = list.filter((item) => item.type === typeFilter);
  }

  // Price range filter
  if (priceRange && priceRange !== 'All') {
    list = list.filter((item) => {
      if (priceRange === 'US$0 - 50') return item.price < 50;
      if (priceRange === 'US$50 - 100') return item.price >= 50 && item.price < 100;
      if (priceRange === 'US$100 - 200') return item.price >= 100 && item.price < 200;
      if (priceRange === 'US$200+') return item.price >= 200;
      return true;
    });
  }

  // Duration filter
  if (durationFilter && durationFilter !== 'All') {
    list = list.filter((item) => {
      if (durationFilter === 'Less than 4 hours') return item.durationHours < 4;
      if (durationFilter === '4-8 hours') return item.durationHours >= 4 && item.durationHours < 8;
      if (durationFilter === '8-12 hours') return item.durationHours >= 8 && item.durationHours < 12;
      if (durationFilter === 'Full day (12+ hours)') return item.durationHours >= 12;
      return true;
    });
  }

  // Sort
  if (sortBy === 'Most reviewed') {
    list.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (sortBy === 'Price: Low to High') {
    list.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'Price: High to Low') {
    list.sort((a, b) => b.price - a.price);
  } else if (sortBy === 'Rating') {
    list.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'Duration') {
    list.sort((a, b) => a.durationHours - b.durationHours);
  }

  return list;
}

export function getExperienceDetails(experienceId) {
  const allExperiences = Object.values(EXPERIENCES_BY_DESTINATION).flat();
  return allExperiences.find((exp) => exp.id === experienceId) || null;
}
