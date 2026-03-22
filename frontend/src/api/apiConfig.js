/**
 * Central API URL + auth headers — matches AuthModal pattern:
 * - Dev: same-origin `/api/...` (Vite proxy → backend)
 * - Prod / custom: set VITE_API_BASE_URL to full origin (no trailing slash)
 */
export const TOKEN_STORAGE_KEY = 'wheretogonext_token';

export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env != null && String(env).trim() !== '') {
    return String(env).replace(/\/$/, '');
  }
  return '';
}

/** @param {string} path Must start with `/api/` */
export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}

/**
 * JSON request headers with Bearer JWT from localStorage (same key as App.jsx / AuthModal).
 */
export function getBearerAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
