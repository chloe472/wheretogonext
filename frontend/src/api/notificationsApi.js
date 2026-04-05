import { apiUrl, getBearerAuthHeaders, TOKEN_STORAGE_KEY } from './apiConfig.js';

/** Returns the SSE stream URL with the JWT token as a query param. */
export function getNotificationStreamUrl() {
  const token = typeof localStorage !== 'undefined'
    ? (localStorage.getItem(TOKEN_STORAGE_KEY) || '')
    : '';
  const base = apiUrl('/api/notifications/stream');
  return token ? `${base}?token=${encodeURIComponent(token)}` : null;
}

function authHeaders() {
  return getBearerAuthHeaders();
}

export async function fetchNotifications({ limit = 20, unreadOnly = false } = {}, signal) {
  const query = new URLSearchParams();
  if (limit != null) query.set('limit', String(limit));
  if (unreadOnly) query.set('unreadOnly', 'true');

  const res = await fetch(`${apiUrl('/api/notifications')}?${query.toString()}`, {
    headers: authHeaders(),
    signal,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load notifications');
  }
  return {
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    unreadCount: Number(data.unreadCount) || 0,
  };
}

export async function markNotificationRead(id) {
  const res = await fetch(`${apiUrl('/api/notifications')}/${encodeURIComponent(id)}/read`, {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark notification as read');
  }
  return {
    unreadCount: Number(data.unreadCount) || 0,
    notification: data.notification || null,
  };
}

export async function markAllNotificationsRead() {
  const res = await fetch(apiUrl('/api/notifications/read-all'), {
    method: 'POST',
    headers: authHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to mark notifications as read');
  }
  return {
    unreadCount: Number(data.unreadCount) || 0,
  };
}
