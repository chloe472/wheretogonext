import { apiUrl } from './apiConfig';

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function dedupeSuggestions(items) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const name = normalizeText(item?.name);
    if (!name) continue;
    const country = normalizeText(item?.country);
    const key = `${name}::${country}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export async function fetchCitySuggestions(query, { signal, limit = 12 } = {}) {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    query: trimmed,
    limit: String(limit),
  });

  try {
    const response = await fetch(`${apiUrl('/api/discovery/city-suggestions')}?${params.toString()}`, {
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch city suggestions (${response.status})`);
    }

    const data = await response.json();
    const remote = (Array.isArray(data?.suggestions) ? data.suggestions : [])
      .map((item) => ({
        id: item.id || `city-${String(item.name || '').toLowerCase()}`,
        name: String(item.name || '').trim(),
        country: String(item.country || '').trim() || undefined,
        type: 'City',
        placeId: item.placeId || undefined,
      }))
      .filter((item) => item.name);

    return dedupeSuggestions(remote).slice(0, limit);
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return [];
  }
}
