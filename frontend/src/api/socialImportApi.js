import { apiUrl } from './apiConfig';

/**
 * Analyze uploaded social screenshots and return ranked places for the trip destination.
 */
export async function analyzeSocialImport({ destination, tripDestinations, imageFiles }) {
  const fd = new FormData();
  fd.append('destination', destination || '');
  fd.append('tripDestinations', JSON.stringify(Array.isArray(tripDestinations) ? tripDestinations : []));
  for (const f of imageFiles || []) {
    fd.append('images', f);
  }

  const res = await fetch(apiUrl('/api/social-import/analyze'), {
    method: 'POST',
    body: fd,
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(body.error || `Social import failed (${res.status})`);
    err.code = body.code;
    err.status = res.status;
    throw err;
  }

  return body;
}
