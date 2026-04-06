const SINGAPORE_CENTER = [1.3521, 103.8198];
const DEFAULT_CENTER = [20, 0];

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

  const parts = q.split(',').map((part) => part.trim()).filter(Boolean);
  const name = parts[0] || q;
  const country = parts.length > 1 ? parts.slice(1).join(', ') : undefined;
  return [{
    id: `where-${name.replace(/[^a-z0-9]+/g, '-')}`,
    name,
    country,
    type: 'City',
  }].slice(0, limit);
}
