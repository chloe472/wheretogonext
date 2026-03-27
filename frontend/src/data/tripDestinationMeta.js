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
function normalizeLocationText(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    // Normalize separators/punctuation to spaces.
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Valid, fixed Unsplash images used for broad fallback coverage.
const UNSPLASH_FALLBACK_POOL = [
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&h=480&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=800&h=480&fit=crop&q=80',
];

function hashText(value = '') {
  const s = String(value || '').trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < s.length; i += 1) {
    hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function unsplashQueryUrl(query = '') {
  const q = String(query || '').trim();
  // source.unsplash.com query endpoints now frequently return 503.
  // Use deterministic selection from known-good Unsplash CDN image URLs.
  const idx = hashText(q || 'travel') % UNSPLASH_FALLBACK_POOL.length;
  return UNSPLASH_FALLBACK_POOL[idx];
}

/**
 * Curated high-quality, stable images for common destinations.
 * (These use fixed photo IDs for consistency.)
 */
const COVER_LOOKUP_CURATED = [
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
const COVER_ALIASES = [
  // Vietnam / Ho Chi Minh variants
  ['ho chi minh', unsplashQueryUrl('Ho Chi Minh City Vietnam skyline')],
  ['hcmc', unsplashQueryUrl('Ho Chi Minh City Vietnam skyline')],
  ['saigon', unsplashQueryUrl('Ho Chi Minh City Vietnam skyline')],
  // New York variants
  ['nyc', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=480&fit=crop&q=80'],
  ['manhattan', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=480&fit=crop&q=80'],
  // UAE variants
  ['united arab emirates', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=480&fit=crop&q=80'],
  ['uae', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=480&fit=crop&q=80'],
  // Regional names
  ['southeast asia', unsplashQueryUrl('Southeast Asia travel')],
  ['south east asia', unsplashQueryUrl('Southeast Asia travel')],
  ['se asia', unsplashQueryUrl('Southeast Asia travel')],
  ['europe', unsplashQueryUrl('Europe travel')],
  ['middle east', unsplashQueryUrl('Middle East travel')],
  ['north africa', unsplashQueryUrl('North Africa travel')],
  ['south america', unsplashQueryUrl('South America travel')],
  ['central america', unsplashQueryUrl('Central America travel')],
  ['caribbean', unsplashQueryUrl('Caribbean beach')],
  ['scandinavia', unsplashQueryUrl('Scandinavia fjords')],
  ['balkans', unsplashQueryUrl('Balkans travel')],
];

// All countries (at minimum).
const COUNTRY_NAMES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina','Armenia','Australia','Austria',
  'Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia',
  'Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia',
  'Cameroon','Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros','Congo','Costa Rica',
  "Cote d'Ivoire",'Croatia','Cuba','Cyprus','Czech Republic','Democratic Republic of the Congo','Denmark','Djibouti',
  'Dominica','Dominican Republic','Ecuador','Egypt','El Salvador','Equatorial Guinea','Eritrea','Estonia','Eswatini',
  'Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala',
  'Guinea','Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland',
  'Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati','Kuwait','Kyrgyzstan','Laos','Latvia',
  'Lebanon','Lesotho','Liberia','Libya','Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia',
  'Maldives','Mali','Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal','Netherlands','New Zealand',
  'Nicaragua','Niger','Nigeria','North Korea','North Macedonia','Norway','Oman','Pakistan','Palau','Panama',
  'Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda',
  'Saint Kitts and Nevis','Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia','Slovenia','Solomon Islands',
  'Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Suriname','Sweden','Switzerland',
  'Syria','Taiwan','Tajikistan','Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia',
  'Turkey','Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay',
  'Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe',
];

// Final lookup used by matching logic.
const COVER_LOOKUP = [
  ...COVER_LOOKUP_CURATED,
  ...COVER_ALIASES,
  ...COUNTRY_NAMES.map((name) => [normalizeLocationText(name), unsplashQueryUrl(`${name} travel`)]),
];

/** Keys sorted longest-first for substring matching */
const COVER_KEYS_SORTED = [...COVER_LOOKUP].sort((a, b) => b[0].length - a[0].length);

/**
 * Country / city / region names → ISO 3166-1 alpha-2 country code + display name.
 * Rendered via FlagCDN for consistent cross-platform appearance.
 */
const FLAG_LOOKUP = [
  ['united states', 'us', 'United States'],
  ['new york', 'us', 'United States'],
  ['nyc', 'us', 'United States'],
  ['manhattan', 'us', 'United States'],
  ['los angeles', 'us', 'United States'],
  ['san francisco', 'us', 'United States'],
  ['miami', 'us', 'United States'],
  ['hawaii', 'us', 'United States'],
  ['united kingdom', 'gb', 'United Kingdom'],
  ['london', 'gb', 'United Kingdom'],
  ['england', 'gb', 'United Kingdom'],
  ['scotland', 'gb', 'United Kingdom'],
  ['paris', 'fr', 'France'],
  ['france', 'fr', 'France'],
  ['tokyo', 'jp', 'Japan'],
  ['kyoto', 'jp', 'Japan'],
  ['osaka', 'jp', 'Japan'],
  ['japan', 'jp', 'Japan'],
  ['seoul', 'kr', 'South Korea'],
  ['korea', 'kr', 'South Korea'],
  ['singapore', 'sg', 'Singapore'],
  ['bangkok', 'th', 'Thailand'],
  ['thailand', 'th', 'Thailand'],
  ['bali', 'id', 'Indonesia'],
  ['indonesia', 'id', 'Indonesia'],
  ['maldives', 'mv', 'Maldives'],
  ['dubai', 'ae', 'United Arab Emirates'],
  ['uae', 'ae', 'United Arab Emirates'],
  ['abu dhabi', 'ae', 'United Arab Emirates'],
  ['sydney', 'au', 'Australia'],
  ['melbourne', 'au', 'Australia'],
  ['australia', 'au', 'Australia'],
  ['rome', 'it', 'Italy'],
  ['italy', 'it', 'Italy'],
  ['venice', 'it', 'Italy'],
  ['florence', 'it', 'Italy'],
  ['spain', 'es', 'Spain'],
  ['barcelona', 'es', 'Spain'],
  ['madrid', 'es', 'Spain'],
  ['vietnam', 'vn', 'Vietnam'],
  ['hanoi', 'vn', 'Vietnam'],
  ['ho chi minh', 'vn', 'Vietnam'],
  ['philippines', 'ph', 'Philippines'],
  ['manila', 'ph', 'Philippines'],
  ['india', 'in', 'India'],
  ['mumbai', 'in', 'India'],
  ['delhi', 'in', 'India'],
  ['portugal', 'pt', 'Portugal'],
  ['lisbon', 'pt', 'Portugal'],
  ['greece', 'gr', 'Greece'],
  ['santorini', 'gr', 'Greece'],
  ['athens', 'gr', 'Greece'],
  ['iceland', 'is', 'Iceland'],
  ['reykjavik', 'is', 'Iceland'],
  ['mexico', 'mx', 'Mexico'],
  ['cancun', 'mx', 'Mexico'],
  ['brazil', 'br', 'Brazil'],
  ['canada', 'ca', 'Canada'],
  ['toronto', 'ca', 'Canada'],
  ['vancouver', 'ca', 'Canada'],
  ['germany', 'de', 'Germany'],
  ['berlin', 'de', 'Germany'],
  ['munich', 'de', 'Germany'],
  ['netherlands', 'nl', 'Netherlands'],
  ['amsterdam', 'nl', 'Netherlands'],
  ['switzerland', 'ch', 'Switzerland'],
  ['zurich', 'ch', 'Switzerland'],
  ['austria', 'at', 'Austria'],
  ['vienna', 'at', 'Austria'],
  ['turkey', 'tr', 'Turkey'],
  ['istanbul', 'tr', 'Turkey'],
  ['egypt', 'eg', 'Egypt'],
  ['cairo', 'eg', 'Egypt'],
  ['south africa', 'za', 'South Africa'],
  ['cape town', 'za', 'South Africa'],
  ['morocco', 'ma', 'Morocco'],
  ['marrakech', 'ma', 'Morocco'],
  ['peru', 'pe', 'Peru'],
  ['cusco', 'pe', 'Peru'],
  ['argentina', 'ar', 'Argentina'],
  ['buenos aires', 'ar', 'Argentina'],
  ['chile', 'cl', 'Chile'],
  ['colombia', 'co', 'Colombia'],
  ['new zealand', 'nz', 'New Zealand'],
  ['auckland', 'nz', 'New Zealand'],
  ['sweden', 'se', 'Sweden'],
  ['stockholm', 'se', 'Sweden'],
  ['norway', 'no', 'Norway'],
  ['oslo', 'no', 'Norway'],
  ['denmark', 'dk', 'Denmark'],
  ['copenhagen', 'dk', 'Denmark'],
  ['finland', 'fi', 'Finland'],
  ['helsinki', 'fi', 'Finland'],
  ['ireland', 'ie', 'Ireland'],
  ['dublin', 'ie', 'Ireland'],
  ['poland', 'pl', 'Poland'],
  ['warsaw', 'pl', 'Poland'],
  ['czech', 'cz', 'Czech Republic'],
  ['prague', 'cz', 'Czech Republic'],
  ['hungary', 'hu', 'Hungary'],
  ['budapest', 'hu', 'Hungary'],
  ['croatia', 'hr', 'Croatia'],
  ['dubrovnik', 'hr', 'Croatia'],
  ['malaysia', 'my', 'Malaysia'],
  ['kuala lumpur', 'my', 'Malaysia'],
  ['china', 'cn', 'China'],
  ['beijing', 'cn', 'China'],
  ['shanghai', 'cn', 'China'],
  ['hong kong', 'hk', 'Hong Kong'],
  ['macau', 'mo', 'Macau'],
  ['taiwan', 'tw', 'Taiwan'],
  ['taipei', 'tw', 'Taiwan'],
];

const FLAG_KEYS_SORTED = [...FLAG_LOOKUP].sort((a, b) => b[0].length - a[0].length);

function haystack(destination = '', locations = '') {
  return normalizeLocationText(`${destination} ${locations}`);
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
  // Broad fallback: query Unsplash by the user's destination text so nearly anything yields a relevant cover.
  return unsplashQueryUrl(`${h} travel`);
}

/**
 * @param {string} [destination]
 * @param {string} [locations]
 * @returns {{code: string, countryName: string, url: string} | null}
 */
export function getFlagImageForDestination(destination = '', locations = '') {
  const h = haystack(destination, locations);
  if (!h) return null;
  for (const [key, code, countryName] of FLAG_KEYS_SORTED) {
    if (h.includes(key)) {
      return {
        code,
        countryName,
        url: `https://flagcdn.com/24x18/${code}.png`,
      };
    }
  }
  return null;
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
  const image = raw.image && String(raw.image).trim();
  const primary = image || coverImages[0] || '';
  const dest = String(raw.destination || '').trim();
  const loc = String(raw.locations || '').trim();
  // When a user duplicates a public itinerary ("Customize trip"), keep the source cover exactly.
  // Do not replace "generic defaults" with destination-based images — the copy should look identical.
  if (raw?.customizedFromItineraryId) {
    const copiedCover = coverImages[0] || image || '';
    return copiedCover;
  }
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
