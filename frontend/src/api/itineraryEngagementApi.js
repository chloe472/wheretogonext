const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

async function jsonRequest(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
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

export function fetchItineraryEngagement(itineraryId) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/engagement`);
}

export function recordItineraryView(itineraryId, destination) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/view`, {
    method: 'POST',
    body: { destination },
  });
}

export function fetchItineraryComments(itineraryId) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/comments`);
}

export async function fetchItinerariesEngagementBatch(itineraryIds = []) {
  const ids = Array.isArray(itineraryIds) ? itineraryIds.map((x) => String(x)).filter(Boolean) : [];
  const query = new URLSearchParams({ ids: ids.join(',') });
  return jsonRequest(`/api/itineraries/engagement/batch?${query.toString()}`);
}

export function postItineraryComment(itineraryId, destination, body) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/comments`, {
    method: 'POST',
    body: { destination, body },
  });
}

export function toggleItineraryCommentLike(itineraryId, commentId) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/comments/${encodeURIComponent(commentId)}/like`, {
    method: 'POST',
  });
}

export function postItineraryReply(itineraryId, commentId, destination, body) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/comments/${encodeURIComponent(commentId)}/replies`, {
    method: 'POST',
    body: { destination, body },
  });
}

export function toggleItineraryReplyLike(itineraryId, commentId, replyId) {
  return jsonRequest(`/api/itineraries/${encodeURIComponent(itineraryId)}/comments/${encodeURIComponent(commentId)}/replies/${encodeURIComponent(replyId)}/like`, {
    method: 'POST',
  });
}

