/**
 * Location data for "Where to?" autocomplete.
 * Countries: exhaustive list (250). Cities: major world cities.
 * In production you could also call a places/geocoding API for more coverage.
 */
import countriesData from './countries.json';
import { CITIES } from './cities.js';

const COUNTRIES = countriesData.map((c) => ({
  ...c,
  country: undefined,
}));

const PROVINCES = [
  { id: 'california-us', name: 'California', type: 'Province', country: 'United States' },
  { id: 'new-york-state-us', name: 'New York', type: 'Province', country: 'United States' },
  { id: 'hawaii-us', name: 'Hawaii', type: 'Province', country: 'United States' },
  { id: 'florida-us', name: 'Florida', type: 'Province', country: 'United States' },
  { id: 'texas-us', name: 'Texas', type: 'Province', country: 'United States' },
  { id: 'ontario-ca', name: 'Ontario', type: 'Province', country: 'Canada' },
  { id: 'british-columbia-ca', name: 'British Columbia', type: 'Province', country: 'Canada' },
  { id: 'quebec-ca', name: 'Quebec', type: 'Province', country: 'Canada' },
  { id: 'alberta-ca', name: 'Alberta', type: 'Province', country: 'Canada' },
  { id: 'new-south-wales-au', name: 'New South Wales', type: 'Province', country: 'Australia' },
  { id: 'queensland-au', name: 'Queensland', type: 'Province', country: 'Australia' },
  { id: 'victoria-au', name: 'Victoria', type: 'Province', country: 'Australia' },
  { id: 'bali-province-id', name: 'Bali', type: 'Province', country: 'Indonesia' },
  { id: 'tuscany-it', name: 'Tuscany', type: 'Province', country: 'Italy' },
  { id: 'provence-fr', name: 'Provence', type: 'Province', country: 'France' },
  { id: 'cote-azur-fr', name: 'French Riviera', type: 'Province', country: 'France' },
];

const ALL_LOCATIONS = [...COUNTRIES, ...CITIES, ...PROVINCES];

/**
 * Search locations by name or country. Matches query against name and country (case-insensitive).
 * Returns up to 12 results: countries first, then cities/provinces.
 */
export function searchLocations(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  const matches = ALL_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      (loc.country && loc.country.toLowerCase().includes(q))
  );

  const countriesFirst = matches.filter((l) => l.type === 'Country');
  const rest = matches.filter((l) => l.type !== 'Country');
  return [...countriesFirst, ...rest].slice(0, 12);
}

/** @deprecated Use searchLocations; kept for any legacy imports of the raw list */
export const MOCK_LOCATIONS = ALL_LOCATIONS;
