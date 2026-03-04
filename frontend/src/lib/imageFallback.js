function normalizeHint(value = '') {
  return String(value || '').trim();
}

function isKnownPlaceholderUrl(url = '') {
  const value = String(url || '').toLowerCase();
  if (!value) return false;
  return value.includes('no_image_available')
    || value.includes('no-image-available')
    || value.includes('placeholder.com')
    || value.includes('/placeholder')
    || value.includes('placehold.co')
    || value.includes('picsum.photos')
    || value.includes('source.unsplash.com')
    || value.includes('images.unsplash.com');
}

function escapeSvgText(value = '') {
  return String(value || '').replace(/[<>&"']/g, '');
}

export function buildInlinePlaceholderUrl(hint = '', topic = 'travel') {
  const title = escapeSvgText(normalizeHint(hint) || 'Image unavailable');
  const subtitle = escapeSvgText(normalizeHint(topic) || 'travel');
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" role="img" aria-label="${title}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fafc"/><stop offset="100%" stop-color="#e2e8f0"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><rect x="36" y="36" width="728" height="528" rx="28" fill="#ffffff" fill-opacity="0.72" stroke="#cbd5e1"/><text x="400" y="284" fill="#0f172a" font-size="28" font-family="Arial, sans-serif" font-weight="700" text-anchor="middle">${title}</text><text x="400" y="326" fill="#475569" font-size="18" font-family="Arial, sans-serif" text-anchor="middle">${subtitle}</text></svg>`,
  )}`;
}

export function resolveImageUrl(imageUrl, hint = '', topic = 'travel') {
  const raw = String(imageUrl || '').trim();
  if (raw && raw.startsWith('data:image/')) {
    return raw;
  }
  if (raw && /^(https?:)?\/\//i.test(raw) && !isKnownPlaceholderUrl(raw)) {
    return raw;
  }
  return buildInlinePlaceholderUrl(hint, topic);
}

export function applyImageFallback(event, hint = '', topic = 'travel') {
  if (!event?.currentTarget) return;
  const img = event.currentTarget;
  const resolvedHint = normalizeHint(hint || img.dataset.imageHint || img.alt || 'Image unavailable');
  const resolvedTopic = normalizeHint(topic || img.dataset.imageTopic || 'travel');
  img.dataset.fallbackStage = 'done';
  img.src = buildInlinePlaceholderUrl(resolvedHint, resolvedTopic);
}
