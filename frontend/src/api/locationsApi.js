import { apiUrl } from './apiConfig';

export async function fetchCitySuggestions(query, { signal, limit = 12 } = {}) {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    query: trimmed,
    limit: String(limit),
  });

  const response = await fetch(`${apiUrl('/api/discovery/city-suggestions')}?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch city suggestions (${response.status})`);
  }

  const data = await response.json();
  if (!Array.isArray(data?.suggestions)) return [];

  return data.suggestions
    .map((item) => ({
      id: item.id || `city-${String(item.name || '').toLowerCase()}`,
      name: String(item.name || '').trim(),
      country: String(item.country || '').trim() || undefined,
      type: 'City',
      placeId: item.placeId || undefined,
    }))
    .filter((item) => item.name);
}
