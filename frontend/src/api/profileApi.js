import { apiUrl, getBearerAuthHeaders } from './apiConfig.js';

async function handleJsonResponse(res) {
  if (!res.ok) {
    let message = 'Request failed';
    try {
      const data = await res.json();
      if (data?.error) message = data.error;
    } catch {
      // ignore
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchMyProfile({ signal } = {}) {
  const res = await fetch(apiUrl('/api/profile/me'), {
    method: 'GET',
    headers: getBearerAuthHeaders(),
    signal,
  });
  return handleJsonResponse(res);
}

export async function fetchProfile(userId, { signal } = {}) {
  const res = await fetch(`${apiUrl('/api/profile')}/${encodeURIComponent(userId)}`, {
    method: 'GET',
    headers: getBearerAuthHeaders(),
    signal,
  });
  return handleJsonResponse(res);
}

export async function updateMyProfile(payload) {
  const res = await fetch(apiUrl('/api/profile/me'), {
    method: 'PUT',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify(payload || {}),
  });
  return handleJsonResponse(res);
}

export async function uploadProfilePhoto(file) {
  const form = new FormData();
  form.append('photo', file);
  const headers = getBearerAuthHeaders();
  delete headers['Content-Type'];
  const res = await fetch(apiUrl('/api/profile/me/photo'), {
    method: 'POST',
    headers,
    body: form,
  });
  return handleJsonResponse(res);
}

export async function deleteProfilePhoto() {
  const res = await fetch(apiUrl('/api/profile/me/photo'), {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function addFriend(userId) {
  const res = await fetch(`${apiUrl('/api/profile')}/${encodeURIComponent(userId)}/friends`, {
    method: 'POST',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function removeFriend(userId) {
  const res = await fetch(`${apiUrl('/api/profile')}/${encodeURIComponent(userId)}/friends`, {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function fetchFriendRequests() {
  const res = await fetch(apiUrl('/api/profile/requests'), {
    method: 'GET',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function fetchOutgoingFriendRequests() {
  const res = await fetch(apiUrl('/api/profile/requests/outgoing'), {
    method: 'GET',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function lookupUserByEmail(email, { signal } = {}) {
  const query = new URLSearchParams();
  query.set('email', String(email || '').trim());
  const res = await fetch(`${apiUrl('/api/profile/lookup')}?${query.toString()}`, {
    method: 'GET',
    headers: getBearerAuthHeaders(),
    signal,
  });
  return handleJsonResponse(res);
}

export async function searchUsers(q, { signal } = {}) {
  const query = new URLSearchParams();
  query.set('q', String(q || '').trim());
  const res = await fetch(`${apiUrl('/api/profile/search')}?${query.toString()}`, {
    method: 'GET',
    headers: getBearerAuthHeaders(),
    signal,
  });
  return handleJsonResponse(res);
}

export async function acceptFriendRequest(requestId) {
  const res = await fetch(`${apiUrl('/api/profile/requests')}/${encodeURIComponent(requestId)}/accept`, {
    method: 'POST',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function declineFriendRequest(requestId) {
  const res = await fetch(`${apiUrl('/api/profile/requests')}/${encodeURIComponent(requestId)}`, {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function searchUserByIdentifier(q) {
  const res = await fetch(`${apiUrl('/api/profile/search')}?q=${encodeURIComponent(q)}`, {
    method: 'GET',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}

export async function sendFriendRequestByIdentifier(identifier) {
  const res = await fetch(apiUrl('/api/profile/requests/by-identifier'), {
    method: 'POST',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify({ identifier }),
  });
  return handleJsonResponse(res);
}

export async function shareProfileWithFriends(friendIds) {
  const res = await fetch(apiUrl('/api/profile/me/share'), {
    method: 'POST',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify({ friendIds }),
  });
  return handleJsonResponse(res);
}

export async function addMapDestination(payload) {
  const res = await fetch(apiUrl('/api/profile/me/map-destinations'), {
    method: 'POST',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify(payload || {}),
  });
  return handleJsonResponse(res);
}

export async function deleteMapDestination(destId) {
  const res = await fetch(`${apiUrl('/api/profile/me/map-destinations')}/${encodeURIComponent(destId)}`, {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  return handleJsonResponse(res);
}
