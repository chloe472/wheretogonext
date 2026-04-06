import { apiUrl, getBearerAuthHeaders, TOKEN_STORAGE_KEY } from './apiConfig.js';

function getNotificationStreamBaseUrl() {
  const explicitBase = import.meta.env.VITE_API_BASE_URL;
  if (explicitBase != null && String(explicitBase).trim() !== '') {
    return String(explicitBase).replace(/\/$/, '');
  }

  if (import.meta.env.DEV) {
    const proxyTarget = import.meta.env.VITE_API_PROXY_TARGET;
    if (proxyTarget != null && String(proxyTarget).trim() !== '') {
      return String(proxyTarget).replace(/\/$/, '');
    }
    return 'http://127.0.0.1:5000';
  }

  return '';
}

/** Returns the SSE stream URL with the JWT token as a query param. */
export function getNotificationStreamUrl() {
  const token = typeof localStorage !== 'undefined'
    ? (localStorage.getItem(TOKEN_STORAGE_KEY) || '')
    : '';
  const base = getNotificationStreamBaseUrl();
  const streamPath = '/api/notifications/stream';
  const streamUrl = base ? `${base}${streamPath}` : apiUrl(streamPath);
  return token ? `${streamUrl}?token=${encodeURIComponent(token)}` : null;
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
