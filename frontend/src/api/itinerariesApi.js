import { apiUrl, getBearerAuthHeaders, TOKEN_STORAGE_KEY } from './apiConfig.js';

/**
 * Maps GET /api/itineraries response items to the shape SearchResultsPage cards expect.
 */
export function mapItineraryToCard(it) {
  const creator = it.creator && typeof it.creator === 'object' ? it.creator : {};
  const creatorName = creator.name || creator.username || creator.email || 'Traveler';
  const creatorPicture = creator.picture || null;
  const creatorId = creator._id || creator.id || '';
  const days = Math.max(1, Number(it.days) || 1);
  const categories = Array.isArray(it.categories) ? it.categories : [];
  const coverImages = Array.isArray(it.coverImages) ? it.coverImages.filter(Boolean) : [];
  const cover = coverImages[0] || '';
  const placesCount = Array.isArray(it.places) ? it.places.length : 0;

  return {
    id: String(it._id ?? it.id ?? ''),
    title: it.title || '',
    destination: it.destination || '',
    locations: it.locations || '',
    image: cover,
    coverImages,
    views: Number(it.viewCount) || 0,
    placesCount,
    duration: `${days} ${days === 1 ? 'day' : 'days'}`,
    days,
    creator: creatorName,
    creatorAvatar: creatorPicture,
    creatorId,
    tags: categories,
    type: categories.length ? categories.slice(0, 2).join(' · ') : '—',
    /** Legacy mock fields — omit in UI when absent */
    currency: it.currency ?? null,
    price: it.price ?? null,
  };
}

/**
 * Maps sidebar sort label to API `sort` query (server supports most-popular | newest).
 * Other options are applied client-side after fetch.
 */
export function mapSortToApiParam(sortBy) {
  if (sortBy === 'Most Popular') return 'most-popular';
  if (sortBy === 'Newest') return 'newest';
  return 'newest';
}

/** Apply sorts not supported by the API (no price on model — use views as proxy). */
export function applyClientSort(cards, sortBy) {
  const list = [...cards];
  switch (sortBy) {
    case 'Price: Low to High':
      return list.sort((a, b) => (a.views ?? 0) - (b.views ?? 0));
    case 'Price: High to Low':
      return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'Duration':
      return list.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    default:
      return list;
  }
}

/**
 * GET /api/itineraries — public published itineraries.
 * @param {{ search?: string, sort?: string, categories?: string, duration?: string }} params
 * @param {AbortSignal} [signal]
 */
function authHeaders() {
  return getBearerAuthHeaders();
}

export async function fetchPublicItineraries(params = {}, signal) {
  const query = new URLSearchParams();
  const search = (params.search || '').trim();
  if (search) query.set('search', search);
  if (params.sort) query.set('sort', params.sort);
  if (params.categories) query.set('categories', params.categories);
  if (params.duration) query.set('duration', params.duration);
  if (params.exclude) query.set('exclude', params.exclude);
  if (params.limit != null) query.set('limit', String(params.limit));

  const qs = query.toString();
  const url = `${apiUrl('/api/itineraries')}${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, { signal, headers: authHeaders() });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to load itineraries (${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data.itineraries) ? data.itineraries : [];
}

/** GET /api/itineraries/:id (increments views server-side) */
export async function fetchItineraryById(id, signal) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}`, {
    signal,
    headers: authHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Failed to load itinerary (${res.status})`);
  }
  const data = await res.json();
  return data.itinerary || null;
}

/** PUT /api/itineraries/:id — partial update (creator only; server-enforced) */
export async function updateItinerary(id, body) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body ?? {}),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update itinerary');
  return data.itinerary;
}

/** GET /api/itineraries/:id/comments */
export async function fetchItineraryComments(itineraryId, signal) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(itineraryId)}/comments`, {
    signal,
    headers: authHeaders(),
  });
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || 'Failed to load comments');
  }
  const data = await res.json();
  return Array.isArray(data.comments) ? data.comments : [];
}

/** POST /api/itineraries/:id/comments */
export async function postItineraryComment(itineraryId, body, parentId = null) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(itineraryId)}/comments`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ body, parentId: parentId || undefined }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to post comment');
  return data.comment;
}

/** POST /api/itineraries/:id/comments/:commentId/like */
export async function toggleCommentLike(itineraryId, commentId) {
  const res = await fetch(
    `${apiUrl('/api/itineraries')}/${encodeURIComponent(itineraryId)}/comments/${encodeURIComponent(commentId)}/like`,
    { method: 'POST', headers: authHeaders() }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update like');
  return data;
}

/** GET /api/itineraries/mine */
export async function fetchMyItineraries(signal) {
  const res = await fetch(apiUrl('/api/itineraries/mine'), { signal, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load your itineraries');
  return Array.isArray(data.itineraries) ? data.itineraries : [];
}

/** GET /api/itineraries/:id/customized-copy — whether user already duplicated from this source (auth) */
export async function fetchCustomizedCopyExists(sourceItineraryId) {
  const res = await fetch(
    `${apiUrl('/api/itineraries')}/${encodeURIComponent(sourceItineraryId)}/customized-copy`,
    { headers: authHeaders() }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to check existing copy');
  return {
    hasCopy: Boolean(data.hasCopy),
    copyId: data.copyId != null ? String(data.copyId) : null,
  };
}

/** POST /api/itineraries/:id/duplicate — copy into current user's trips (auth) */
export async function duplicateItinerary(id) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to copy itinerary');
  return data.itinerary;
}

/** POST /api/itineraries — create (used for duplicate) */
export async function createItinerary(body) {
  const res = await fetch(apiUrl('/api/itineraries'), {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to create itinerary');
  return data.itinerary;
}

/** DELETE /api/itineraries/:id */
export async function deleteItinerary(id) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 204) return true;
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Failed to delete');
}

/** POST multipart /api/itineraries/upload */
export async function uploadItineraryImage(file) {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl('/api/itineraries/upload'), {
    method: 'POST',
    headers,
    body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Upload failed');
  return data.url;
}

/**
 * POST /api/itineraries/:id/publish
 * @param {object} payload — visibility, title?, overview?, categories?, coverImages?
 */
export async function publishItinerary(id, payload) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}/publish`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to publish');
  return data.itinerary;
}
