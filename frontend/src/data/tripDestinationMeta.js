/**
 * Destination-based cover images & flag emojis for trip cards.
 * Match keys are lowercase; matching is substring-based on destination + locations (case-insensitive).
 * Longer keys are checked first so e.g. "new york" wins over "york".
 */

/** Generic travel photo when no destination matches. */
export const DEFAULT_TRIP_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=480&fit=crop&q=80';

/** Legacy default used before per-destination images — treat as generic for display upgrade. */
export const LEGACY_DEFAULT_TRIP_COVER =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=240&fit=crop';

/**
 * Popular destinations → Unsplash cover URLs (optimize with w/h/fit).
 * Keys: lowercase phrases to match inside destination/locations strings.
 */
const COVER_LOOKUP = [
  ['new york', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=480&fit=crop&q=80'],
  ['maldives', 'https://images.unsplash.com/photo-1514282401047-d79a71a374e8?w=800&h=480&fit=crop&q=80'],
  ['singapore', 'https://images.unsplash.com/photo-1525625293380-5161e7bbcba0?w=800&h=480&fit=crop&q=80'],
  ['barcelona', 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=480&fit=crop&q=80'],
  ['bangkok', 'https://images.unsplash.com/photo-1563492065599-3520f7757ed0?w=800&h=480&fit=crop&q=80'],
  ['sydney', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=480&fit=crop&q=80'],
  ['kyoto', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=480&fit=crop&q=80'],
  ['tokyo', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=480&fit=crop&q=80'],
  ['seoul', 'https://images.unsplash.com/photo-1538485399081-7194717c824a?w=800&h=480&fit=crop&q=80'],
  ['dubai', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=480&fit=crop&q=80'],
  ['bali', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800&h=480&fit=crop&q=80'],
  ['paris', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=480&fit=crop&q=80'],
  ['london', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=480&fit=crop&q=80'],
  ['rome', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=480&fit=crop&q=80'],
  ['france', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=480&fit=crop&q=80'],
  ['japan', 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&h=480&fit=crop&q=80'],
  ['vietnam', 'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&h=480&fit=crop&q=80'],
  ['hawaii', 'https://images.unsplash.com/photo-1542256836392-6f5c1a3dce15?w=800&h=480&fit=crop&q=80'],
  ['iceland', 'https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=800&h=480&fit=crop&q=80'],
  ['santorini', 'https://images.unsplash.com/photo-1613395877344-13d61c79b8e0?w=800&h=480&fit=crop&q=80'],
];

/** Keys sorted longest-first for substring matching */
const COVER_KEYS_SORTED = [...COVER_LOOKUP].sort((a, b) => b[0].length - a[0].length);

/**
 * Country / city / region names → flag emoji (Unicode). Longer keys first.
 */
const FLAG_LOOKUP = [
  ['united states', '🇺🇸'],
  ['new york', '🇺🇸'],
  ['nyc', '🇺🇸'],
  ['manhattan', '🇺🇸'],
  ['los angeles', '🇺🇸'],
  ['san francisco', '🇺🇸'],
  ['miami', '🇺🇸'],
  ['united kingdom', '🇬🇧'],
  ['london', '🇬🇧'],
  ['england', '🇬🇧'],
  ['scotland', '🇬🇧'],
  ['paris', '🇫🇷'],
  ['france', '🇫🇷'],
  ['tokyo', '🇯🇵'],
  ['kyoto', '🇯🇵'],
  ['osaka', '🇯🇵'],
  ['japan', '🇯🇵'],
  ['seoul', '🇰🇷'],
  ['korea', '🇰🇷'],
  ['singapore', '🇸🇬'],
  ['bangkok', '🇹🇭'],
  ['thailand', '🇹🇭'],
  ['bali', '🇮🇩'],
  ['indonesia', '🇮🇩'],
  ['maldives', '🇲🇻'],
  ['dubai', '🇦🇪'],
  ['uae', '🇦🇪'],
  ['abu dhabi', '🇦🇪'],
  ['sydney', '🇦🇺'],
  ['melbourne', '🇦🇺'],
  ['australia', '🇦🇺'],
  ['rome', '🇮🇹'],
  ['italy', '🇮🇹'],
  ['venice', '🇮🇹'],
  ['florence', '🇮🇹'],
  ['spain', '🇪🇸'],
  ['barcelona', '🇪🇸'],
  ['madrid', '🇪🇸'],
  ['vietnam', '🇻🇳'],
  ['hanoi', '🇻🇳'],
  ['ho chi minh', '🇻🇳'],
  ['philippines', '🇵🇭'],
  ['manila', '🇵🇭'],
  ['india', '🇮🇳'],
  ['mumbai', '🇮🇳'],
  ['delhi', '🇮🇳'],
  ['portugal', '🇵🇹'],
  ['lisbon', '🇵🇹'],
  ['greece', '🇬🇷'],
  ['santorini', '🇬🇷'],
  ['athens', '🇬🇷'],
  ['iceland', '🇮🇸'],
  ['reykjavik', '🇮🇸'],
  ['hawaii', '🇺🇸'],
  ['mexico', '🇲🇽'],
  ['cancun', '🇲🇽'],
  ['brazil', '🇧🇷'],
  ['canada', '🇨🇦'],
  ['toronto', '🇨🇦'],
  ['vancouver', '🇨🇦'],
  ['germany', '🇩🇪'],
  ['berlin', '🇩🇪'],
  ['munich', '🇩🇪'],
  ['netherlands', '🇳🇱'],
  ['amsterdam', '🇳🇱'],
  ['switzerland', '🇨🇭'],
  ['zurich', '🇨🇭'],
  ['austria', '🇦🇹'],
  ['vienna', '🇦🇹'],
  ['turkey', '🇹🇷'],
  ['istanbul', '🇹🇷'],
  ['egypt', '🇪🇬'],
  ['cairo', '🇪🇬'],
  ['south africa', '🇿🇦'],
  ['cape town', '🇿🇦'],
  ['morocco', '🇲🇦'],
  ['marrakech', '🇲🇦'],
  ['peru', '🇵🇪'],
  ['cusco', '🇵🇪'],
  ['argentina', '🇦🇷'],
  ['buenos aires', '🇦🇷'],
  ['chile', '🇨🇱'],
  ['colombia', '🇨🇴'],
  ['new zealand', '🇳🇿'],
  ['auckland', '🇳🇿'],
  ['sweden', '🇸🇪'],
  ['stockholm', '🇸🇪'],
  ['norway', '🇳🇴'],
  ['oslo', '🇳🇴'],
  ['denmark', '🇩🇰'],
  ['copenhagen', '🇩🇰'],
  ['finland', '🇫🇮'],
  ['helsinki', '🇫🇮'],
  ['ireland', '🇮🇪'],
  ['dublin', '🇮🇪'],
  ['poland', '🇵🇱'],
  ['warsaw', '🇵🇱'],
  ['czech', '🇨🇿'],
  ['prague', '🇨🇿'],
  ['hungary', '🇭🇺'],
  ['budapest', '🇭🇺'],
  ['croatia', '🇭🇷'],
  ['dubrovnik', '🇭🇷'],
  ['malaysia', '🇲🇾'],
  ['kuala lumpur', '🇲🇾'],
  ['china', '🇨🇳'],
  ['beijing', '🇨🇳'],
  ['shanghai', '🇨🇳'],
  ['hong kong', '🇭🇰'],
  ['macau', '🇲🇴'],
  ['taiwan', '🇹🇼'],
  ['taipei', '🇹🇼'],
];

const FLAG_KEYS_SORTED = [...FLAG_LOOKUP].sort((a, b) => b[0].length - a[0].length);

function haystack(destination = '', locations = '') {
  return `${destination} ${locations}`.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * @param {string} [destination]
 * @param {string} [locations]
 * @returns {string} image URL
 */
export function getCoverImageForDestination(destination = '', locations = '') {
  const h = haystack(destination, locations);
  if (!h) return DEFAULT_TRIP_COVER_FALLBACK;
  for (const [key, url] of COVER_KEYS_SORTED) {
    if (h.includes(key)) return url;
  }
  return DEFAULT_TRIP_COVER_FALLBACK;
}

/**
 * @param {string} [destination]
 * @param {string} [locations]
 * @returns {string} flag emoji or empty string
 */
export function getFlagEmojiForDestination(destination = '', locations = '') {
  const h = haystack(destination, locations);
  if (!h) return '';
  for (const [key, emoji] of FLAG_KEYS_SORTED) {
    if (h.includes(key)) return emoji;
  }
  return '';
}

/**
 * True if the stored URL is our generic legacy default (safe to replace display with destination-based cover).
 */
export function isGenericDefaultCoverUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const u = url.trim().toLowerCase();
  return (
    u === DEFAULT_TRIP_COVER_FALLBACK.toLowerCase()
    || u === LEGACY_DEFAULT_TRIP_COVER.toLowerCase()
    || u.includes('photo-1488646953014') // same Unsplash photo id as legacy default
  );
}

/**
 * Resolve image shown on dashboard: prefer real uploads, else destination-based default.
 * @param {object} raw itinerary API doc
 */
export function resolveTripCardCoverImage(raw) {
  const coverImages = Array.isArray(raw.coverImages) ? raw.coverImages.filter(Boolean) : [];
  const primary = (raw.image && String(raw.image).trim()) || coverImages[0] || '';
  const dest = String(raw.destination || '').trim();
  const loc = String(raw.locations || '').trim();
  if (!primary || isGenericDefaultCoverUrl(primary)) {
    return getCoverImageForDestination(dest, loc);
  }
  return primary;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * @param {string} [startDate] YYYY-MM-DD
 * @param {string} [endDate] YYYY-MM-DD
 * @param {string} [datesFallback] e.g. legacy human-readable dates string
 */
export function formatTripCardDateRange(startDate = '', endDate = '', datesFallback = '') {
  const s = String(startDate).trim();
  const e = String(endDate).trim();
  if (!s || !e) {
    const fb = String(datesFallback || '').trim();
    return fb || '—';
  }
  const ds = new Date(`${s}T12:00:00`);
  const de = new Date(`${e}T12:00:00`);
  if (Number.isNaN(ds.getTime()) || Number.isNaN(de.getTime())) {
    const fb = String(datesFallback || '').trim();
    return fb || '—';
  }
  const sd = ds.getDate();
  const sm = MONTH_SHORT[ds.getMonth()];
  const sy = ds.getFullYear();
  const ed = de.getDate();
  const em = MONTH_SHORT[de.getMonth()];
  const ey = de.getFullYear();
  if (sy === ey) {
    return `${sd} ${sm} - ${ed} ${em}, ${ey}`;
  }
  return `${sd} ${sm}, ${sy} - ${ed} ${em}, ${ey}`;
}
