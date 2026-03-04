const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const DISCOVERY_CACHE_TTL_MS = 15 * 60 * 1000;
const DISCOVERY_CACHE_VERSION = 'v6';

function cacheStorageKey(destination = '') {
  return `wtg.discovery.${DISCOVERY_CACHE_VERSION}.${String(destination || '').trim().toLowerCase()}`;
}

function readCachedDiscovery(destination) {
  try {
    const raw = localStorage.getItem(cacheStorageKey(destination));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || !parsed?.data) return null;
    if (Date.now() - parsed.timestamp > DISCOVERY_CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCachedDiscovery(destination, data) {
  try {
    localStorage.setItem(
      cacheStorageKey(destination),
      JSON.stringify({ timestamp: Date.now(), data }),
    );
  } catch {
    // ignore storage issues
  }
}

async function requestDiscovery(destination, limit, timeoutMs) {
  const query = new URLSearchParams({ destination: destination || '', limit: String(limit) });
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}/api/discovery/destination?${query.toString()}`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({}));
      const message = errorBody.error || `Discovery request failed (${res.status})`;
      const err = new Error(message);
      err.status = res.status;
      throw err;
    }

    return res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchDiscoveryData(destination, limit = 24) {
  try {
    let data;
    try {
      data = await requestDiscovery(destination, limit, 18000);
    } catch (firstError) {
      const shouldRetry = firstError?.name === 'AbortError' || firstError?.status === 429;
      if (!shouldRetry) throw firstError;
      const reducedLimit = Math.max(8, Math.min(16, Math.floor(limit / 2)));
      data = await requestDiscovery(destination, reducedLimit, 20000);
    }

    writeCachedDiscovery(destination, data);
    return data;
  } catch (error) {
    const cached = readCachedDiscovery(destination);
    if (cached) {
      return {
        ...cached,
        stale: true,
        warning: 'Showing cached results while live data is temporarily unavailable.',
      };
    }
    if (error?.name === 'AbortError') {
      throw new Error('Discovery request timed out. Please try again.');
    }
    if (error?.status === 429) {
      throw new Error('Live travel data is busy right now. Please retry in a moment.');
    }
    throw error;
  }
}