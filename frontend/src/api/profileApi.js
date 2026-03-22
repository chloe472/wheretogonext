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
