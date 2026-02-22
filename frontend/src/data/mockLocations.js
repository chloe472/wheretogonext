/**
 * Mock geographic locations for "Where to?" autocomplete.
 * Each has a name and type (City, Country, Province) so users can disambiguate.
 * In production this would come from a places/geocoding API.
 */
export const MOCK_LOCATIONS = [
  { id: 'paris-fr', name: 'Paris', type: 'City', country: 'France' },
  { id: 'paris-on', name: 'Paris', type: 'Province', country: 'Canada' },
  { id: 'paris-tx', name: 'Paris', type: 'City', country: 'United States' },
  { id: 'france', name: 'France', type: 'Country' },
  { id: 'hawaii', name: 'Hawaii', type: 'Province', country: 'United States' },
  { id: 'japan', name: 'Japan', type: 'Country' },
  { id: 'tokyo', name: 'Tokyo', type: 'City', country: 'Japan' },
  { id: 'london', name: 'London', type: 'City', country: 'United Kingdom' },
  { id: 'london-on', name: 'London', type: 'City', country: 'Canada' },
  { id: 'ontario', name: 'Ontario', type: 'Province', country: 'Canada' },
  { id: 'california', name: 'California', type: 'Province', country: 'United States' },
  { id: 'seattle', name: 'Seattle', type: 'City', country: 'United States' },
  { id: 'vancouver', name: 'Vancouver', type: 'City', country: 'Canada' },
  { id: 'british-columbia', name: 'British Columbia', type: 'Province', country: 'Canada' },
  { id: 'italy', name: 'Italy', type: 'Country' },
  { id: 'rome', name: 'Rome', type: 'City', country: 'Italy' },
  { id: 'barcelona', name: 'Barcelona', type: 'City', country: 'Spain' },
  { id: 'spain', name: 'Spain', type: 'Country' },
  { id: 'bali', name: 'Bali', type: 'Province', country: 'Indonesia' },
  { id: 'indonesia', name: 'Indonesia', type: 'Country' },
  { id: 'sydney', name: 'Sydney', type: 'City', country: 'Australia' },
  { id: 'australia', name: 'Australia', type: 'Country' },
  { id: 'new-york', name: 'New York', type: 'City', country: 'United States' },
  { id: 'new-york-state', name: 'New York', type: 'Province', country: 'United States' },
  { id: 'calgary', name: 'Calgary', type: 'City', country: 'Canada' },
  { id: 'alberta', name: 'Alberta', type: 'Province', country: 'Canada' },
];

export function searchLocations(query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return MOCK_LOCATIONS.filter(
    (loc) =>
      loc.name.toLowerCase().includes(q) ||
      (loc.country && loc.country.toLowerCase().includes(q))
  ).slice(0, 8);
}
