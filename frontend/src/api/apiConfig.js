
export const TOKEN_STORAGE_KEY = 'wheretogonext_token';

export function getApiBaseUrl() {
  const env = import.meta.env.VITE_API_BASE_URL;
  if (env != null && String(env).trim() !== '') {
    return String(env).replace(/\/$/, '');
  }
  return '';
}


export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = getApiBaseUrl();
  return base ? `${base}${p}` : p;
}


export function getBearerAuthHeaders() {
  const headers = { 'Content-Type': 'application/json' };
  if (typeof localStorage !== 'undefined') {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}
