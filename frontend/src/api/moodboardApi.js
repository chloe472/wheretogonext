import { apiUrl, getBearerAuthHeaders } from './apiConfig.js';

function normalizeImage(image) {
  if (!image || typeof image !== 'object') return { id: '', url: '', reactions: {} };
  return {
    id: String(image._id ?? image.id ?? ''),
    url: String(image.url ?? ''),
    reactions: image.reactions && typeof image.reactions === 'object'
      ? { ...image.reactions }
      : {},
  };
}

function normalizeFolder(folder) {
  if (!folder || typeof folder !== 'object') return { id: '', name: '', images: [] };
  return {
    ...folder,
    id: String(folder._id ?? folder.id ?? ''),
    name: String(folder.name ?? ''),
    images: Array.isArray(folder.images) ? folder.images.map(normalizeImage) : [],
  };
}

async function parseResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.error || `Moodboard request failed (${res.status})`);
  return data;
}

export async function fetchMoodboardFolders(tripId) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}`), {
    headers: getBearerAuthHeaders(),
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data.map(normalizeFolder) : [];
}

export async function fetchMoodboardFolder(tripId, folderId) {
  const folders = await fetchMoodboardFolders(tripId);
  return folders.find(f => f.id === folderId) || null;
}

export async function createMoodboardFolder(tripId, name) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder`), {
    method: 'POST',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await parseResponse(res);

  if (!Array.isArray(data)) return [];
  return data.map(normalizeFolder);
}

export async function updateMoodboardFolder(tripId, folderId, name) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder/${encodeURIComponent(folderId)}`), {
    method: 'PUT',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify({ name }),
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data.map(normalizeFolder) : [];
}

export async function deleteMoodboardFolder(tripId, folderId) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder/${encodeURIComponent(folderId)}`), {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data.map(normalizeFolder) : [];
}

// --- IMAGES ---
export async function addMoodboardImage(tripId, folderId, url) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder/${encodeURIComponent(folderId)}/image`), {
    method: 'POST',
    headers: getBearerAuthHeaders(),
    body: JSON.stringify({ url }),
  });
  const data = await parseResponse(res);
  return normalizeImage(data);
}

export async function deleteMoodboardImage(tripId, folderId, imageId) {
  const res = await fetch(apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder/${encodeURIComponent(folderId)}/image/${encodeURIComponent(imageId)}`), {
    method: 'DELETE',
    headers: getBearerAuthHeaders(),
  });
  const data = await parseResponse(res);
  return Array.isArray(data) ? data.map(normalizeImage) : [];
}

export async function reactToMoodboardImage(tripId, folderId, imageId, emoji, username) {
  const res = await fetch(
    apiUrl(`/api/moodboard/trip/${encodeURIComponent(tripId)}/folder/${encodeURIComponent(folderId)}/image/${encodeURIComponent(imageId)}/reaction`),
    {
      method: 'POST',
      headers: getBearerAuthHeaders(),
      body: JSON.stringify({ emoji, user: username }),
    }
  );
  return await parseResponse(res);
}