import { apiUrl } from './apiConfig';

/**
 * Analyze a social post URL and/or screenshots; returns ranked places for the trip destination.
 * Backend uses oEmbed/noembed + optional OpenAI vision + Google Places text search (when configured).
 */
export async function analyzeSocialImport({ destination, url, imageFiles }) {
  const fd = new FormData();
  fd.append('destination', destination || '');
  if (url?.trim()) fd.append('url', url.trim());
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
