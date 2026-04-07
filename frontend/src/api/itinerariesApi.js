import { apiUrl, getBearerAuthHeaders, TOKEN_STORAGE_KEY } from './apiConfig.js';


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
    
    currency: it.currency ?? null,
    price: it.price ?? null,
  };
}


export function mapSortToApiParam(sortBy) {
  if (sortBy === 'Most Popular') return 'most-popular';
  if (sortBy === 'Newest') return 'newest';
  return 'newest';
}


export function applyClientSort(cards, sortBy) {
  const list = [...cards];
  switch (sortBy) {
    case 'Price: Low to High':
      return list.sort((a, b) => (a.views ?? 0) - (b.views ?? 0));
    case 'Price: High to Low':
      return list.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));
    case 'Duration':
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


export function applyExploreOrdering(cards, sortBy, profileInterests) {
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
      case 'Price: Low to High':
        return (a.views ?? 0) - (b.views ?? 0);
      case 'Price: High to Low':
        return (b.views ?? 0) - (a.views ?? 0);
      case 'Duration':
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

  const list = [...cards];
  list.sort((a, b) => {
    const sa = matchScore(a);
    const sb = matchScore(b);
    if (sb !== sa) return sb - sa;
    return secondaryCompare(a, b);
  });
  return list;
}


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


export async function toggleCommentLike(itineraryId, commentId) {
  const res = await fetch(
    `${apiUrl('/api/itineraries')}/${encodeURIComponent(itineraryId)}/comments/${encodeURIComponent(commentId)}/like`,
    { method: 'POST', headers: authHeaders() }
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to update like');
  return data;
}


export async function fetchMyItineraries(signal) {
  const res = await fetch(apiUrl('/api/itineraries/mine'), { signal, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load your itineraries');
  return Array.isArray(data.itineraries) ? data.itineraries : [];
}


export async function fetchSharedWithMeItineraries(signal) {
  const res = await fetch(apiUrl('/api/itineraries/shared-with-me'), { signal, headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to load shared itineraries');
  return Array.isArray(data.itineraries) ? data.itineraries : [];
}


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


export async function duplicateItinerary(id) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}/duplicate`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to copy itinerary');
  return data.itinerary;
}


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


export async function deleteItinerary(id) {
  const res = await fetch(`${apiUrl('/api/itineraries')}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (res.status === 204) return true;
  const data = await res.json().catch(() => ({}));
  throw new Error(data.error || 'Failed to delete');
}


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
