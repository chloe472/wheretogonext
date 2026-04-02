import countriesData from '../../../data/countries.json';
import { CITIES } from '../../../data/cities';

const SINGAPORE_CENTER = [1.3521, 103.8198];
const DEFAULT_CENTER = [20, 0];

const WHERE_LOCATIONS = [
  ...countriesData.map((country) => ({ ...country, country: undefined })),
  ...CITIES,
];

export function getMapCenterForDestination(destinationOrLocations, options = {}) {
  if (options.loading) {
    return SINGAPORE_CENTER;
  }
  return DEFAULT_CENTER;
}

export function searchAddressSuggestions(destinationOrLocations, query, idPrefix = 'custom-location') {
  const q = (query || '').trim();
  if (!q) return [];

  const [lat, lng] = getMapCenterForDestination(destinationOrLocations);
  return [
    {
      id: `${idPrefix}-${q.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: q,
      address: 'Custom location',
      lat,
      lng,
      source: 'Custom location',
    },
  ];
}

export function searchLocations(query, limit = 12) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const matches = WHERE_LOCATIONS.filter((loc) => {
    const nameMatch = String(loc?.name || '').toLowerCase().includes(q);
    const countryMatch = String(loc?.country || '').toLowerCase().includes(q);
    return nameMatch || countryMatch;
  });

  const countriesFirst = matches.filter((entry) => entry.type === 'Country');
  const others = matches.filter((entry) => entry.type !== 'Country');
  return [...countriesFirst, ...others].slice(0, limit);
}
