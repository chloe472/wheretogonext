


export const DEFAULT_TRIP_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=480&fit=crop&q=80';


export const LEGACY_DEFAULT_TRIP_COVER =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=240&fit=crop';

function normalizeLocationText(value = '') {
  return String(value || '')
    .toLowerCase()
    .trim()
    
    .replace(/['’`"]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


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


export function getCoverImageForDestination(destination = '', locations = '') {
  const h = haystack(destination, locations);
  if (!h) return DEFAULT_TRIP_COVER_FALLBACK;
  return DEFAULT_TRIP_COVER_FALLBACK;
}


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


export function isGenericDefaultCoverUrl(url) {
  if (!url || typeof url !== 'string') return true;
  const u = url.trim().toLowerCase();
  return (
    u === DEFAULT_TRIP_COVER_FALLBACK.toLowerCase()
    || u === LEGACY_DEFAULT_TRIP_COVER.toLowerCase()
    || u.includes('photo-1488646953014') 
  );
}


export function resolveTripCardCoverImage(raw) {
  const coverImages = Array.isArray(raw.coverImages) ? raw.coverImages.filter(Boolean) : [];
  const image = raw.image && String(raw.image).trim();
  const primary = coverImages[0] || image || '';
  const destination = String(raw?.destination || '').trim();
  const locations = String(raw?.locations || '').trim();
  
  
  if (raw?.customizedFromItineraryId) {
    return primary;
  }
  if (!primary || isGenericDefaultCoverUrl(primary)) {
    return getCoverImageForDestination(destination, locations);
  }
  return primary;
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


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
