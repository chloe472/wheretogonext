const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function jsonRequest(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function fetchTrips() {
  return jsonRequest('/api/trips');
}

export function fetchTrip(tripId) {
  return jsonRequest(`/api/trips/${encodeURIComponent(tripId)}`);
}

export function createTrip(payload) {
  return jsonRequest('/api/trips', { method: 'POST', body: payload });
}

export function patchTrip(tripId, updates) {
  return jsonRequest(`/api/trips/${encodeURIComponent(tripId)}`, { method: 'PATCH', body: updates });
}

export function deleteTrip(tripId) {
  return jsonRequest(`/api/trips/${encodeURIComponent(tripId)}`, { method: 'DELETE' });
}

