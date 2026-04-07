import { apiUrl, getBearerAuthHeaders, TOKEN_STORAGE_KEY } from './apiConfig.js';

/** Inclusive trip length for Explore sort/filter (aligns with backend computeDaysFromDateRange / places). */
export function computeExploreDayCount(it) {
  const start = String(it?.startDate || '').trim().slice(0, 10);
  const end = String(it?.endDate || '').trim().slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end)) {
    const a = new Date(`${start}T12:00:00`);
    const b = new Date(`${end}T12:00:00`);
    if (Number.isFinite(a.getTime()) && Number.isFinite(b.getTime())) {
      const diff = Math.round((b - a) / 86400000) + 1;
      return Math.max(1, diff);
    }
  }
  const places = Array.isArray(it?.places) ? it.places : [];
  const nums = places.map((p) => Number(p?.dayNumber)).filter((n) => Number.isFinite(n) && n >= 1);
  if (nums.length > 0) return Math.max(1, ...nums);
  const d = Number(it?.days);
  return Number.isFinite(d) && d >= 1 ? d : 1;
}

/**
 * Maps GET /api/itineraries response items to the shape SearchResultsPage cards expect.
 */
export function mapItineraryToCard(it) {
  const creator = it.creator && typeof it.creator === 'object' ? it.creator : {};
  const creatorName = creator.name || creator.username || creator.email || 'Traveler';
  const creatorPicture = creator.picture || null;
  const creatorId = creator._id || creator.id || '';
  const days = computeExploreDayCount(it);
  const categories = Array.isArray(it.categories) ? it.categories : [];
  const coverImages = Array.isArray(it.coverImages) ? it.coverImages.filter(Boolean) : [];
  const cover = coverImages[0] || '';
  const placesCount = Array.isArray(it.places) ? it.places.length : 0;

  const publishedAt = it.publishedAt || it.createdAt || null;

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
    publishedAt,
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

/** Client-side sorts; Most Popular is by view count (matches API intent if order was lost). */
export function applyClientSort(cards, sortBy) {
  const list = [...cards];
  switch (sortBy) {
    case 'Most Popular':
      return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'Duration: Short to long':
      return list.sort((a, b) => (a.days ?? 0) - (b.days ?? 0));
    case 'Newest': {
      const t = (c) => {
        const d = new Date(c.publishedAt || 0);
        return Number.isFinite(d.getTime()) ? d.getTime() : 0;
      };
      return list.sort((a, b) => t(b) - t(a));
    }
    default:
      return list;
  }
}

/**
 * Explore / community list: when the user has profile interests (same labels as itinerary.categories),
 * rank itineraries with more overlapping categories first; then apply the selected sort as tie-breaker.
 * When filtersActive (search / adventure / duration), skips interest boost and sorts by sortBy only.
 */
export function applyExploreOrdering(cards, sortBy, profileInterests, filtersActive = false) {
  if (filtersActive) {
    return applyClientSort([...cards], sortBy);
  }

  const raw = Array.isArray(profileInterests) ? profileInterests : [];
  const interestSet = new Set(
    raw.map((s) => String(s || '').trim().toLowerCase()).filter(Boolean),
  );
  const useInterestBoost = interestSet.size > 0;

  const matchScore = (card) => {
    if (!useInterestBoost) return 0;
    const tags = Array.isArray(card.tags) ? card.tags : [];
    let n = 0;
    tags.forEach((t) => {
      if (interestSet.has(String(t).trim().toLowerCase())) n += 1;
    });
    return n;
  };

  const secondaryCompare = (a, b) => {
    switch (sortBy) {
      case 'Duration: Short to long':
        return (a.days ?? 0) - (b.days ?? 0);
      case 'Newest': {
        const ta = new Date(a.publishedAt || 0).getTime();
        const tb = new Date(b.publishedAt || 0).getTime();
        const aOk = Number.isFinite(ta);
        const bOk = Number.isFinite(tb);
        if (aOk && bOk) return tb - ta;
        return (b.views ?? 0) - (a.views ?? 0);
      }
      case 'Most Popular':
      default:
        return (b.views ?? 0) - (a.views ?? 0);
    }
  };

  if (!useInterestBoost) {
    return applyClientSort([...cards], sortBy);
  }

  // Most Popular must rank by views globally; use interest overlap only as a tie-breaker.
  if (sortBy === 'Most Popular') {
    const list = [...cards];
    list.sort((a, b) => {
      const v = (b.views ?? 0) - (a.views ?? 0);
      if (v !== 0) return v;
      return matchScore(b) - matchScore(a);
    });
    return list;
  }

  // Duration: shortest trips first globally; interest overlap only breaks ties.
  if (sortBy === 'Duration: Short to long') {
    const list = [...cards];
    list.sort((a, b) => {
      const d = (a.days ?? 0) - (b.days ?? 0);
      if (d !== 0) return d;
      return matchScore(b) - matchScore(a);
    });
    return list;
  }

  const list = [...cards];
  list.sort((a, b) => {
    const sa = matchScore(a);
    const sb = matchScore(b);
    if (sb !== sa) return sb - sa;
    return secondaryCompare(a, b);
  });
  return list;
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

/** PUT /api/itineraries/:id — partial update (creator or collaborator with edit access; server-enforced) */
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

/** POST /api/itineraries/:id/share — notify friends, no collaborator change */
export async function shareItineraryWithFriends(id, friendIds) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}/share`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ friendIds }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to share itinerary');
  return data;
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

/** GET /api/itineraries/shared-with-me */
export async function fetchSharedWithMeItineraries(signal) {
  const res = await fetch(apiUrl('/api/itineraries/shared-with-me'), { signal, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load shared itineraries');
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
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(apiUrl('/api/itineraries'), {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Failed to create itinerary');
    return data.itinerary;
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('Create trip request timed out. Please check that the backend server is running and try again.');
    }
    if (error instanceof TypeError) {
      throw new Error('Could not reach the backend server. Start the backend on port 5000 and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
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
