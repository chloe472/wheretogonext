import { apiUrl } from './apiConfig';
import { CITIES } from '../data/cities';

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

function getLocalCitySuggestions(query, limit = 12) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  const scored = CITIES
    .map((city) => {
      const name = String(city?.name || '').trim();
      const country = String(city?.country || '').trim();
      const normalizedName = normalizeText(name);
      const normalizedCountry = normalizeText(country);
      if (!normalizedName || !normalizedCountry) return null;

      const nameStarts = normalizedName.startsWith(normalizedQuery);
      const countryStarts = normalizedCountry.startsWith(normalizedQuery);
      const nameIncludes = normalizedName.includes(normalizedQuery);
      const countryIncludes = normalizedCountry.includes(normalizedQuery);
      if (!nameIncludes && !countryIncludes) return null;

      let score = 0;
      if (countryStarts) score += 120;
      if (nameStarts) score += 100;
      if (countryIncludes) score += 80;
      if (nameIncludes) score += 60;
      if (normalizedCountry === normalizedQuery) score += 40;

      return {
        ...city,
        type: 'City',
        score,
      };
    })
    .filter(Boolean)
    .sort((a, b) => (b.score - a.score) || String(a.name || '').localeCompare(String(b.name || '')));

  return scored.slice(0, limit).map(({ score, ...city }) => city);
}

export async function fetchCitySuggestions(query, { signal, limit = 12 } = {}) {
  const trimmed = String(query || '').trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    query: trimmed,
    limit: String(limit),
  });

  const localFallback = getLocalCitySuggestions(trimmed, limit);

  try {
    const response = await fetch(`${apiUrl('/api/discovery/city-suggestions')}?${params.toString()}`, {
      signal,
    });

    if (!response.ok) {
      if (localFallback.length > 0) return localFallback;
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

    return dedupeSuggestions([...remote, ...localFallback]).slice(0, limit);
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    if (localFallback.length > 0) return localFallback;
    throw error;
  }
}
