import { Footprints, Bike, Car, Train } from 'lucide-react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import { loadGoogleMapsScript } from '../../../lib/loadGoogleMaps';

export const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];


export function getTripDaysFromTrip(trip) {
  if (!trip?.startDate || !trip?.endDate) return [];
  const s = String(trip.startDate).slice(0, 10);
  const e = String(trip.endDate).slice(0, 10);
  const start = new Date(`${s}T12:00:00`);
  const end = new Date(`${e}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return [];
  const days = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      dayNum: days.length + 1,
      date: d.toISOString().slice(0, 10),
      label: `${dayLabels[d.getDay()]}, ${MONTH_SHORT[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return days;
}

export function itineraryDocToTrip(doc) {
  if (!doc) return null;
  const id = String(doc._id ?? doc.id ?? '');
  return {
    ...doc,
    id,
    tripExpenseItems: Array.isArray(doc.tripExpenseItems) ? doc.tripExpenseItems : [],
  };
}
export const FOOD_FILTER_OPTIONS = [
  'All',
  'Top Rated (4.5+)',
  'Budget ($-$$)',
  'Cafe',
  'Late Night',
  'Vegetarian / Vegan',
  'Muslim-Friendly',
];

export const PLACE_SORT_OPTIONS = ['Recommended', 'Rating: Low to High', 'Rating: High to Low'];
export const FOOD_SORT_OPTIONS = ['Recommended', 'Rating', 'Most reviewed', 'Name'];
export const EXPERIENCE_TYPES = ['All', 'Day Trips', 'Guided Tours', 'Attraction', 'Outdoor Activities', 'Cultural Tours', 'Food Tours'];
export const EXPERIENCE_PRICE_RANGES = ['All', 'US$0 - 50', 'US$50 - 100', 'US$100 - 200', 'US$200+'];
export const EXPERIENCE_DURATIONS = ['All', 'Less than 4 hours', '4-8 hours', '8-12 hours', 'Full day (12+ hours)'];
export const EXPERIENCE_SORT_OPTIONS = ['Most reviewed', 'Recently added', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Duration'];

export function formatDayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}, ${DAY_NAMES[d.getDay()]}`;
}

export function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return '';
  const a = code.toUpperCase().charCodeAt(0) - 65 + 0x1F1E6;
  const b = code.toUpperCase().charCodeAt(1) - 65 + 0x1F1E6;
  return String.fromCodePoint(a, b);
}

export function extractPrimaryDestination(destinationOrLocations) {
  if (!destinationOrLocations) return '';
  const parts = String(destinationOrLocations).split(',');
  return parts[0]?.trim() || String(destinationOrLocations).trim();
}

export function getDestinationList(destination = '', locations = '') {
  const fromLocations = String(locations || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
  const fallback = String(destination || '').trim();
  const source = fromLocations.length > 0 ? fromLocations : (fallback ? [fallback] : []);

  const seen = new Set();
  const unique = [];
  source.forEach((entry) => {
    const label = String(entry || '').trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    unique.push(label);
  });

  return unique;
}

export function splitRouteLocationLabel(label = '') {
  const parts = String(label || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  const city = parts[0] || '';
  const country = parts.length > 1 ? parts[parts.length - 1] : '';
  return { city, country };
}


export function appendDestinationLabelToTripDoc(trip, label) {
  const raw = String(label || '').trim();
  if (!raw) return { ok: false, reason: 'empty' };
  const currentStr = trip?.locations || trip?.destination || '';
  const parts = currentStr.split(';').map((s) => s.trim()).filter(Boolean);
  const token = (s) => s.split(',')[0].trim().toLowerCase();
  if (parts.some((p) => token(p) === token(raw))) {
    return { ok: false, reason: 'duplicate', message: 'That destination is already on your trip.' };
  }
  const newLocations = [...parts, raw].join('; ');
  const newDestination = parts.length > 0
    ? extractPrimaryDestination(trip?.destination || parts[0])
    : raw.split(',')[0].trim();
  return { ok: true, destination: newDestination, locations: newLocations };
}

export function buildTripRouteSummary(destination = '', locations = '') {
  const routeLocations = getDestinationList(destination, locations);
  const uniqueLocations = [];
  const seenLocationKeys = new Set();
  routeLocations.forEach((entry) => {
    const label = String(entry || '').trim();
    if (!label) return;
    const key = label.toLowerCase();
    if (seenLocationKeys.has(key)) return;
    seenLocationKeys.add(key);
    uniqueLocations.push(label);
  });

  const uniqueCities = [];
  const seenCities = new Set();
  const uniqueCountries = [];
  const seenCountries = new Set();

  uniqueLocations.forEach((label) => {
    const { city, country } = splitRouteLocationLabel(label);
    const cityKey = city.toLowerCase();
    if (city && !seenCities.has(cityKey)) {
      seenCities.add(cityKey);
      uniqueCities.push(city);
    }
    const countryKey = country.toLowerCase();
    if (country && !seenCountries.has(countryKey)) {
      seenCountries.add(countryKey);
      uniqueCountries.push(country);
    }
  });

  if (uniqueCities.length === 0) {
    return {
      routeLocations: uniqueLocations,
      title: destination ? `Trip to ${destination}` : 'Untitled trip',
      displayLocations: uniqueLocations.join('; '),
    };
  }

  const cityPart = uniqueCities.join(', ');
  const countryPart = uniqueCountries.length === 1
    ? uniqueCountries[0]
    : uniqueCountries.length > 1
      ? uniqueCountries.join(', ')
      : '';

  const routeName = countryPart ? `${cityPart}, ${countryPart}` : cityPart;

  return {
    routeLocations: uniqueLocations,
    title: `Trip to ${routeName}`,
    displayLocations: uniqueCities.join('; '),
  };
}

export function getTripDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${String(startDate).slice(0, 10)}T12:00:00`);
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

export function getWhereLocationLabel(loc) {
  if (!loc) return '';
  return loc.country ? `${loc.name}, ${loc.country}` : String(loc.name || '').trim();
}

export function getWhereLocationKey(loc) {
  return getWhereLocationLabel(loc).toLowerCase();
}

export function buildWhereDefaultCityDayRanges(locations, totalDays) {
  const days = Math.max(1, Number(totalDays) || 1);
  const list = Array.isArray(locations) ? locations : [];
  if (list.length === 0) return {};

  const base = Math.floor(days / list.length);
  const rem = days % list.length;
  const ranges = {};
  let cursor = 1;

  list.forEach((loc, idx) => {
    const size = base + (idx < rem ? 1 : 0);
    const startDay = cursor;
    const endDay = Math.min(days, cursor + Math.max(1, size) - 1);
    ranges[getWhereLocationKey(loc)] = { startDay, endDay };
    cursor = endDay + 1;
  });

  return ranges;
}

export function mergeUniqueBy(items = [], toKey) {
  const seen = new Set();
  const merged = [];
  items.forEach((item, idx) => {
    if (!item) return;
    const key = toKey(item, idx);
    if (!key || seen.has(key)) return;
    seen.add(key);
    merged.push(item);
  });
  return merged;
}

export function buildStayBookingDeepLink(stay = {}, city = '', options = {}) {
  const fallbackQuery = `${stay.name || ''} ${stay.address || city || ''}`.trim();
  const rawBookingUrl = String(stay?.bookingUrl || '').trim();
  const checkInDate = String(options?.checkInDate || '').trim();
  const checkOutDate = String(options?.checkOutDate || '').trim();
  const adults = Math.max(1, Number(options?.adults || 2));
  const children = Math.max(0, Number(options?.children || 0));
  const rooms = Math.max(1, Number(options?.rooms || 1));
  const currencyCode = String(options?.currency || 'USD').toUpperCase();

  let target;
  try {
    target = rawBookingUrl ? new URL(rawBookingUrl) : new URL('https://www.booking.com/searchresults.html');
  } catch (_) {
    target = new URL('https://www.booking.com/searchresults.html');
  }

  if (!String(target.hostname || '').toLowerCase().includes('booking.com')) {
    target = new URL('https://www.booking.com/searchresults.html');
  }

  const params = target.searchParams;
  const queryValue = fallbackQuery || city || '';
  if (queryValue) {
    params.set('ss', queryValue);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(checkInDate)) {
    const [y, m, d] = checkInDate.split('-');
    params.set('checkin_year', y);
    params.set('checkin_month', String(Number(m)));
    params.set('checkin_monthday', String(Number(d)));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(checkOutDate)) {
    const [y, m, d] = checkOutDate.split('-');
    params.set('checkout_year', y);
    params.set('checkout_month', String(Number(m)));
    params.set('checkout_monthday', String(Number(d)));
  }

  params.set('group_adults', String(adults));
  params.set('group_children', String(children));
  params.set('no_rooms', String(rooms));
  params.set('selected_currency', currencyCode);

  
  Array.from(params.keys())
    .filter((k) => /^age$|^age\d+$/i.test(k))
    .forEach((k) => params.delete(k));
  for (let idx = 1; idx <= children; idx += 1) {
    params.set(`age${idx}`, '8');
  }

  return target.toString();
}

export const WHERE_TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

export function isCityWhereLocation(loc) {
  return String(loc?.type || '').toLowerCase() === 'city';
}

export function findExactWhereLocationMatch(query) {
  const value = String(query || '').trim();
  if (!value) return null;

  const parts = value.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  if (parts.length > 1) {
    return {
      id: `where-${parts[0].toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: parts[0],
      country: parts.slice(1).join(', '),
      type: 'City',
    };
  }

  return {
    id: `where-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    name: value,
    country: undefined,
    type: 'City',
  };
}

export const ZERO_DECIMAL_CURRENCIES = new Set(['JPY', 'KRW', 'VND']);

export function currencyRate(code = 'USD', ratesTable = {}) {
  const currencyCode = String(code || 'USD').toUpperCase();
  const fromLiveRates = Number(ratesTable?.[currencyCode]);
  if (Number.isFinite(fromLiveRates) && fromLiveRates > 0) return fromLiveRates;
  if (currencyCode === 'USD') return 1;
  return null;
}

export function convertUsdToCurrency(amount, code = 'USD', ratesTable = {}) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  const rate = currencyRate(code, ratesTable);
  if (!Number.isFinite(rate) || rate <= 0) return n;
  return n * rate;
}

export function convertCurrencyToUsd(amount, code = 'USD', ratesTable = {}) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return 0;
  const rate = currencyRate(code, ratesTable);
  return Number.isFinite(rate) && rate > 0 ? (n / rate) : n;
}

export function formatCurrencyAmount(amount, code = 'USD') {
  const value = Number(amount || 0);
  const currencyCode = String(code || 'USD').toUpperCase();
  const digits = ZERO_DECIMAL_CURRENCIES.has(currencyCode) ? 0 : 2;
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch (_) {
    return `${currencyCode} ${value.toFixed(digits)}`;
  }
}

export function formatUsdAsCurrency(usdAmount, code = 'USD', ratesTable = {}) {
  return formatCurrencyAmount(convertUsdToCurrency(usdAmount, code, ratesTable), code);
}

export function getCurrencyDisplayName(code) {
  const currencyCode = String(code || 'USD').toUpperCase();
  try {
    if (typeof Intl?.DisplayNames === 'function') {
      const display = new Intl.DisplayNames(['en'], { type: 'currency' });
      return display.of(currencyCode) || currencyCode;
    }
  } catch (_) {
    
  }
  return currencyCode;
}

export const ADD_PLACES_PAGE_SIZE = 17;


export const CATEGORY_CARD_STYLES = {
  places: { label: 'Place', color: '#16a34a' },
  place: { label: 'Place', color: '#16a34a' },
  food: { label: 'Food & Beverage', color: '#dc2626' },
  stays: { label: 'Stays', color: '#2563eb' },
  transportations: { label: 'Transportation', color: '#ea580c' },
  transportation: { label: 'Transportation', color: '#ea580c' },
  experiences: { label: 'Experience', color: '#7c3aed' },
  experience: { label: 'Experience', color: '#7c3aed' },
};

export function getCategoryStyle(item) {
  const raw = (item.categoryId || item.category || 'places').toLowerCase();
  const key = raw === 'place' ? 'places' : raw === 'transportation' ? 'transportations' : raw === 'experience' ? 'experiences' : raw;
  return CATEGORY_CARD_STYLES[key] || CATEGORY_CARD_STYLES.places;
}

export function isEditableItineraryItem(item) {
  const raw = String(item?.categoryId || item?.category || '').toLowerCase();
  return raw === 'places'
    || raw === 'place'
    || raw === 'food'
    || raw === 'food & beverage'
    || raw === 'stays'
    || raw === 'stay'
    || raw === 'experiences'
    || raw === 'experience'
    || raw === 'transportations'
    || raw === 'transportation';
}

export function parseFoodHours(value) {
  if (!value) return {};
  if (typeof value === 'object' && !Array.isArray(value)) return value;
  const text = String(value).trim();
  if (!text) return {};
  if (text.toLowerCase() === '24/7') {
    return {
      Monday: 'Open 24 hours',
      Tuesday: 'Open 24 hours',
      Wednesday: 'Open 24 hours',
      Thursday: 'Open 24 hours',
      Friday: 'Open 24 hours',
      Saturday: 'Open 24 hours',
      Sunday: 'Open 24 hours',
    };
  }
  return { Hours: text };
}

export function enrichFoodDetails(food, cityQuery) {
  const openingHoursText = food?.openingHoursRaw || food?.openingHours || '';
  const hours = parseFoodHours(food?.hours || openingHoursText);
  const overview = food?.overview
    || food?.description
    || `${food?.name || 'This spot'} is a popular food stop in ${cityQuery}.`;
  const dietary = Array.isArray(food?.dietaryTags) ? food.dietaryTags : [];
  const visitReasons = Array.isArray(food?.whyVisit) && food.whyVisit.length > 0
    ? food.whyVisit
    : [
      `${food?.name || 'This place'} is well rated by travelers and locals.`,
      food?.cuisine ? `Known for ${food.cuisine}.` : 'Great option for a meal break during your itinerary.',
      food?.priceLevel ? `Price level: ${food.priceLevel}.` : 'Fits well into a flexible dining plan.',
    ];
  const skipReasons = Array.isArray(food?.whySkip) && food.whySkip.length > 0
    ? food.whySkip
    : [
      Object.keys(hours).length === 0 ? 'Opening hours may vary; verify before visiting.' : null,
      dietary.length === 0 ? 'Dietary options are not clearly listed; check with the venue.' : null,
    ].filter(Boolean);

  return {
    ...food,
    overview,
    hours,
    openingHoursRaw: openingHoursText,
    isOpenNow: food?.isOpenNow ?? (String(openingHoursText).toLowerCase() === '24/7' ? true : null),
    whyVisit: visitReasons,
    whySkip: skipReasons,
  };
}

export function addDays(dateStr, delta) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export function shouldShiftForInsertedDay(value, anchorDate, position) {
  if (!value || !anchorDate) return false;
  return position === 'before' ? value >= anchorDate : value > anchorDate;
}

export function shiftDayKeyAfterInsert(dayNum, anchorDayNum, position) {
  if (!Number.isFinite(dayNum) || !Number.isFinite(anchorDayNum)) return dayNum;
  if (position === 'before') return dayNum >= anchorDayNum ? dayNum + 1 : dayNum;
  return dayNum > anchorDayNum ? dayNum + 1 : dayNum;
}

export function isStayItem(item) {
  const raw = String(item?.categoryId || item?.category || '').toLowerCase();
  return raw === 'stays' || raw === 'stay';
}

export function isFlightItem(item) {
  if (!item) return false;
  const transportType = String(item?.transportType || '').toLowerCase();
  if (transportType === 'flight' || transportType === 'flights') return true;
  return String(item?.name || '').trim().toLowerCase().startsWith('flight:');
}

export function parseDateTimeLocal(dateStr, timeStr = '00:00') {
  if (!dateStr) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(String(timeStr || '')) ? String(timeStr) : '00:00';
  const parsed = new Date(`${dateStr}T${normalizedTime}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function toIsoDateLocal(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toHHmmLocal(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
}

export function getStayWindow(item) {
  const checkInDate = String(item?.checkInDate || item?.date || '').trim();
  const checkInTime = String(item?.checkInTime || item?.startTime || '15:00').trim() || '15:00';

  let checkOutDate = String(item?.checkOutDate || '').trim();
  let checkOutTime = String(item?.checkOutTime || '').trim();

  if (!checkOutDate || !checkOutTime) {
    const start = parseDateTimeLocal(checkInDate, checkInTime);
    const durationMinutes = (Number(item?.durationHrs || 0) * 60) + Number(item?.durationMins || 0);
    if (start && durationMinutes > 0) {
      const end = new Date(start.getTime() + (durationMinutes * 60 * 1000));
      checkOutDate = checkOutDate || toIsoDateLocal(end);
      checkOutTime = checkOutTime || toHHmmLocal(end);
    }
  }

  checkOutDate = checkOutDate || checkInDate;
  checkOutTime = checkOutTime || checkInTime;

  return {
    checkInDate,
    checkInTime,
    checkOutDate,
    checkOutTime,
  };
}

export function isStayActiveOnDay(item, dayDate) {
  if (!isStayItem(item) || !dayDate) return false;
  const { checkInDate, checkOutDate } = getStayWindow(item);
  if (!checkInDate) return false;

  if (!checkOutDate || checkOutDate <= checkInDate) {
    return dayDate === checkInDate;
  }

  return dayDate >= checkInDate && dayDate <= checkOutDate;
}

export function formatStayDateTime(dateStr, timeStr = '') {
  if (!dateStr) return '';
  const date = parseDateTimeLocal(dateStr, timeStr || '00:00');
  if (!date) return dateStr;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function getDayStayItems(items, dayDate) {
  return (items || []).filter((it) => isStayActiveOnDay(it, dayDate));
}

export function hasStayBookingData(item) {
  if (!item) return false;
  const hasWindow = Boolean(item.checkInDate || item.checkOutDate);
  const hasCost = Number(item.total || 0) > 0;
  const hasNote = Boolean(String(item.notes || '').trim());
  const hasLink = Boolean(String(item.externalLink || '').trim());
  const hasDocs = Array.isArray(item.attachments) && item.attachments.length > 0;
  return hasWindow || hasCost || hasNote || hasLink || hasDocs;
}

export function getDayTotalDurationMinutes(items, dayDate) {
  const dayItems = (items || []).filter((it) => it.date === dayDate && !isStayItem(it));
  let total = 0;
  dayItems.forEach((it) => {
    const hrs = it.durationHrs ?? 0;
    const mins = it.durationMins ?? 0;
    total += hrs * 60 + mins;
  });
  return total;
}

export function formatDurationMinutes(totalMins) {
  if (totalMins < 60) return `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h} hr ${String(m).padStart(2, '0')} min` : `${h} hr`;
}

export const CALENDAR_START_HOUR = 0;
export const CALENDAR_HOURS = 24;
export const CALENDAR_ROW_HEIGHT = 48;
export const CALENDAR_ALL_DAY_HEIGHT = 28;
export const CALENDAR_GUTTER_WIDTH = 52;
export const CALENDAR_DRAG_SNAP_MINS = 30;
export const CALENDAR_EVENT_VERTICAL_INSET = 7;
export const DAY_COLUMN_DEFAULT_WIDTH = 280;
export const CALENDAR_DAY_COLUMN_DEFAULT_WIDTH = 240;
export const DAY_COLUMN_MIN_WIDTH = 220;
export const DAY_COLUMN_MAX_WIDTH = 720;

export function createAttachmentFromFile(file) {
  return {
    name: file.name,
    type: file.type || '',
    url: URL.createObjectURL(file),
  };
}

export function normalizeAttachment(att) {
  if (!att) return null;
  if (typeof att === 'string') return { name: att, type: '', url: '' };
  return {
    name: att.name || 'Attachment',
    type: att.type || '',
    url: att.url || '',
  };
}

export function normalizeExternalUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/\s/.test(raw)) return '';
  return `https://${raw}`;
}

export function getItemViewDetailsUrl(item, city = '') {
  const direct = normalizeExternalUrl(item?.externalLink || item?.website || item?.mapsUrl || '');
  if (direct) return direct;
  const query = `${item?.name || ''} ${item?.detail || item?.address || city || ''}`.trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function formatDurationLabelFromMinutes(totalMinutes) {
  const mins = Math.max(30, Math.round(Number(totalMinutes) || 120));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${String(m).padStart(2, '0')} min`;
}

export function estimateSmartStopDurationMinutes(place) {
  const itemType = String(place?._itemType || place?.itemType || place?.category || '').toLowerCase();
  if (itemType.includes('food')) return 90;

  const durationHours = Number(place?.durationHours || 0);
  if (Number.isFinite(durationHours) && durationHours > 0) {
    return Math.max(60, Math.min(360, Math.round(durationHours * 60)));
  }

  const text = [
    place?.tourismType,
    place?.type,
    place?.name,
    ...(Array.isArray(place?.types) ? place.types : []),
    ...(Array.isArray(place?.tags) ? place.tags : []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(theme[_\s-]?park|amusement|water[_\s-]?park|zoo|aquarium|safari)/.test(text)) return 300;
  if (/(museum|gallery|science center|heritage)/.test(text)) return 180;
  if (/(shopping|mall|outlet|market|bazaar)/.test(text)) return 180;
  if (/(beach|island|national park|botanic|garden|nature reserve|hiking)/.test(text)) return 210;
  if (/(temple|church|shrine|monument|landmark|historic|palace|castle)/.test(text)) return 120;
  if (/(viewpoint|observation|skydeck|tower)/.test(text)) return 90;

  return 120;
}

export function parseDurationTextToMinutes(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text) return 0;

  if (text.includes('half day')) return 300;
  if (text.includes('full day')) return 480;

  const hrMinMatch = text.match(/(\d+)\s*hr[^\d]*(\d+)\s*min/);
  if (hrMinMatch) {
    const h = Number(hrMinMatch[1] || 0);
    const m = Number(hrMinMatch[2] || 0);
    return (h * 60) + m;
  }

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(h|hr|hrs|hour|hours)\b/);
  if (hourMatch) {
    return Math.round(Number(hourMatch[1] || 0) * 60);
  }

  const minuteMatch = text.match(/(\d+)\s*(m|min|mins|minute|minutes)\b/);
  if (minuteMatch) {
    return Number(minuteMatch[1] || 0);
  }

  return 0;
}

export function resolveSmartDurationMinutes(place) {
  const directMinutes = Number(place?.durationMinutes || place?.durationMinsTotal || 0);
  if (Number.isFinite(directMinutes) && directMinutes > 0) {
    return Math.max(30, Math.round(directMinutes));
  }

  const parsedFromLabel = parseDurationTextToMinutes(
    place?.estimatedDuration || place?.durationLabel || place?.duration,
  );
  if (parsedFromLabel > 0) return Math.max(30, parsedFromLabel);

  return estimateSmartStopDurationMinutes(place);
}

export function getStayStarLevel(stay) {
  const explicit = Number(stay?.starRating || 0);
  if (Number.isFinite(explicit) && explicit > 0) {
    return Math.max(1, Math.min(5, Math.round(explicit)));
  }
  const fromRating = Number(stay?.rating || 0);
  if (Number.isFinite(fromRating) && fromRating > 0) {
    return Math.max(3, Math.min(5, Math.round(fromRating)));
  }
  return 3;
}

export function getStayStarText(stay) {
  return `${getStayStarLevel(stay)}-star`;
}

export function itemSpillsIntoNextDay(item) {
  if (!isStayItem(item)) return false;
  const { checkInDate, checkOutDate } = getStayWindow(item);
  return Boolean(checkInDate && checkOutDate && checkOutDate > checkInDate);
}

export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
export function getCalendarEventPosition(item) {
  const startMins = timeToMinutes(item.startTime);
  const startHour = startMins / 60;
  const durationHrs = Number(item.durationHrs ?? 0);
  const durationMins = Number(item.durationMins ?? 0);
  const durationRows = Math.max(0.5, (durationHrs * 60 + durationMins) / 60);
  const topPx = CALENDAR_ALL_DAY_HEIGHT
    + Math.max(0, (startHour - CALENDAR_START_HOUR) * CALENDAR_ROW_HEIGHT)
    + CALENDAR_EVENT_VERTICAL_INSET;
  const rawHeight = durationRows * CALENDAR_ROW_HEIGHT;
  const heightPx = Math.max(CALENDAR_ROW_HEIGHT * 0.5, rawHeight);
  return { top: topPx, height: heightPx };
}

export function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

export function getCalendarEventLayouts(items, dayDate) {
  const dayItems = getSortedDayItems(items, dayDate).filter((it) => !isStayItem(it));
  if (dayItems.length === 0) return [];

  const normalized = dayItems.map((item) => {
    const start = timeToMinutes(item.startTime || `${String(CALENDAR_START_HOUR).padStart(2, '0')}:00`);
    const mins = Math.max(30, (Number(item.durationHrs ?? 0) * 60) + Number(item.durationMins ?? 0));
    return {
      item,
      start,
      end: start + mins,
    };
  }).sort((a, b) => (a.start - b.start) || (a.end - b.end));

  const groups = [];
  let currentGroup = [];
  let currentGroupEnd = -1;

  normalized.forEach((event) => {
    if (currentGroup.length === 0 || event.start < currentGroupEnd) {
      currentGroup.push(event);
      currentGroupEnd = Math.max(currentGroupEnd, event.end);
      return;
    }
    groups.push(currentGroup);
    currentGroup = [event];
    currentGroupEnd = event.end;
  });

  if (currentGroup.length > 0) groups.push(currentGroup);

  const laidOut = [];

  groups.forEach((group) => {
    const active = [];
    const placed = [];
    let maxCols = 1;

    group.forEach((event) => {
      for (let i = active.length - 1; i >= 0; i--) {
        if (active[i].end <= event.start) active.splice(i, 1);
      }

      let col = 0;
      while (active.some((a) => a.col === col)) col += 1;
      active.push({ end: event.end, col });

      maxCols = Math.max(maxCols, col + 1);
      placed.push({ ...event, col });
    });

    placed.forEach((event) => {
      let span = 1;
      while (event.col + span < maxCols) {
        const blocked = placed.some((other) => (
          other !== event
          && other.col === event.col + span
          && rangesOverlap(event.start, event.end, other.start, other.end)
        ));
        if (blocked) break;
        span += 1;
      }

      const widthPercent = (span / maxCols) * 100;
      const leftPercent = (event.col / maxCols) * 100;
      laidOut.push({
        item: event.item,
        style: {
          left: `calc(${leftPercent}% + 4px)`,
          width: `calc(${widthPercent}% - 8px)`,
        },
      });
    });
  });

  return laidOut;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function minutesToHHmm(totalMinutes) {
  const mins = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function getDefaultStartTimeForDate(items, dayDate, fallback = '07:00', desiredDurationMinutes = 60) {
  if (!dayDate) return fallback;

  const minAllowed = CALENDAR_START_HOUR * 60;
  const dayEnd = (CALENDAR_START_HOUR + CALENDAR_HOURS) * 60;
  const snappedDuration = Math.max(
    CALENDAR_DRAG_SNAP_MINS,
    Math.ceil(Math.max(1, Number(desiredDurationMinutes) || 60) / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS,
  );
  const latestAllowedStart = Math.max(minAllowed, dayEnd - snappedDuration);

  const fallbackMinutes = clamp(
    Math.ceil(timeToMinutes(fallback) / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS,
    minAllowed,
    latestAllowedStart,
  );

  const dayItems = (items || [])
    .filter((it) => (
      it?.date === dayDate
      && !isStayItem(it)
      && typeof it?.startTime === 'string'
      && String(it.startTime).trim()
    ))
    .map((it) => {
      const start = timeToMinutes(it.startTime);
      const mins = Math.max(CALENDAR_DRAG_SNAP_MINS, (Number(it.durationHrs ?? 0) * 60) + Number(it.durationMins ?? 0));
      return { start, end: start + mins };
    })
    .sort((a, b) => a.start - b.start);

  if (dayItems.length === 0) return minutesToHHmm(fallbackMinutes);

  for (
    let candidate = fallbackMinutes;
    candidate <= latestAllowedStart;
    candidate += CALENDAR_DRAG_SNAP_MINS
  ) {
    const candidateEnd = candidate + snappedDuration;
    const overlaps = dayItems.some((slot) => rangesOverlap(candidate, candidateEnd, slot.start, slot.end));
    if (!overlaps) return minutesToHHmm(candidate);
  }

  const latestEndMins = dayItems.reduce((latest, slot) => Math.max(latest, slot.end), minAllowed);
  const snappedAfterLatest = Math.ceil(latestEndMins / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS;
  return minutesToHHmm(clamp(snappedAfterLatest, minAllowed, latestAllowedStart));
}

export function durationMinutesToParts(totalMinutes) {
  const safe = Math.max(0, Math.round(totalMinutes));
  return {
    durationHrs: Math.floor(safe / 60),
    durationMins: safe % 60,
  };
}

export function getCalendarDropStartTime(clientY, containerRect) {
  const y = clientY - containerRect.top;
  const timelineY = Math.max(0, y - CALENDAR_ALL_DAY_HEIGHT);
  const minsFromStart = Math.round((timelineY / CALENDAR_ROW_HEIGHT) * 60);
  const snapped = Math.round(minsFromStart / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS;
  const maxMinutes = (CALENDAR_START_HOUR + CALENDAR_HOURS) * 60 - CALENDAR_DRAG_SNAP_MINS;
  const absoluteMinutes = clamp((CALENDAR_START_HOUR * 60) + snapped, CALENDAR_START_HOUR * 60, maxMinutes);
  return minutesToHHmm(absoluteMinutes);
}

export function distanceBetween(a, b) {
  const lat1 = a.lat ?? 0;
  const lng1 = a.lng ?? 0;
  const lat2 = b.lat ?? 0;
  const lng2 = b.lng ?? 0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function hasValidLatLng(place) {
  const lat = Number(place?.lat);
  const lng = Number(place?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng);
}


export function reorderByProximity(items, startId, endId) {
  if (!Array.isArray(items) || items.length <= 1) return items || [];

  const startItem = items.find((i) => String(i.id) === String(startId)) || items[0];
  let endItem = items.find((i) => String(i.id) === String(endId)) || items[items.length - 1];

  if (String(startItem?.id) === String(endItem?.id) && items.length > 1) {
    endItem = items.find((i) => String(i.id) !== String(startItem.id)) || endItem;
  }

  const middle = items.filter((it) => (
    String(it.id) !== String(startItem?.id)
    && String(it.id) !== String(endItem?.id)
  ));
  if (middle.length === 0) return String(startItem?.id) === String(endItem?.id) ? [startItem] : [startItem, endItem];

  const withCoords = middle.filter((it) => hasValidLatLng(it));
  const withoutCoords = middle.filter((it) => !hasValidLatLng(it));
  const orderedMiddle = [];
  let current = startItem;

  while (withCoords.length > 0) {
    let bestIdx = 0;
    let bestObjective = Number.POSITIVE_INFINITY;

    for (let i = 0; i < withCoords.length; i += 1) {
      const candidate = withCoords[i];
      const distFromCurrent = hasValidLatLng(current) ? distanceBetween(current, candidate) : 0;
      const distToEnd = hasValidLatLng(endItem) ? distanceBetween(candidate, endItem) : 0;
      const objective = distFromCurrent + (distToEnd * 0.35);
      if (objective < bestObjective) {
        bestObjective = objective;
        bestIdx = i;
      }
    }

    const next = withCoords.splice(bestIdx, 1)[0];
    orderedMiddle.push(next);
    current = next;
  }

  const ordered = [startItem, ...orderedMiddle, ...withoutCoords];
  if (String(endItem?.id) !== String(startItem?.id)) ordered.push(endItem);
  return ordered;
}

export const DAY_COLOR_OPTIONS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0ea5e9', '#8b5cf6', '#64748b',
];

export const TRAVEL_MODES = [
  { id: 'walking', label: 'Walking', Icon: Footprints },
  { id: 'cycling', label: 'Cycling', Icon: Bike },
  { id: 'driving', label: 'Driving', Icon: Car },
  { id: 'public', label: 'Public Transport', Icon: Train },
];

export function getSortedDayItems(items, dayDate, options = {}) {
  const includeOvernightStays = Boolean(options?.includeOvernightStays);
  const dayItems = (items || []).filter((it) => {
    if (it.date === dayDate) return true;
    if (!includeOvernightStays) return false;
    return itemSpillsIntoNextDay(it) && addDays(it.date, 1) === dayDate;
  });
  return [...dayItems].sort((a, b) => {
    const tA = a.startTime || '00:00';
    const tB = b.startTime || '00:00';
    return tA.localeCompare(tB);
  });
}

export function getEndTime(startTime, durationHrs = 0, durationMins = 0) {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  let endM = m + (durationMins || 0);
  let endH = h + (durationHrs || 0) + Math.floor(endM / 60);
  endM = endM % 60;
  endH = endH % 24;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

export function findTimeOverlapItem(items, candidate) {
  const date = String(candidate?.date || '').trim();
  const startTime = String(candidate?.startTime || '').trim();
  const excludeId = String(candidate?.excludeId || '');
  if (!date || !startTime) return null;

  const candidateStart = timeToMinutes(startTime);
  const candidateDuration = Math.max(
    1,
    (Number(candidate?.durationHrs || 0) * 60) + Number(candidate?.durationMins || 0),
  );
  const candidateEnd = candidateStart + candidateDuration;

  const dayItems = (items || []).filter((it) => {
    if (!it || String(it.date || '') !== date) return false;
    if (isStayItem(it)) return false;
    if (excludeId && String(it.id || '') === excludeId) return false;
    return true;
  });

  return dayItems.find((it) => {
    const itemStartRaw = String(it.startTime || '').trim();
    if (!itemStartRaw) return false;
    const itemStart = timeToMinutes(itemStartRaw);
    const itemDuration = Math.max(
      1,
      (Number(it.durationHrs || 0) * 60) + Number(it.durationMins || 0),
    );
    const itemEnd = itemStart + itemDuration;
    return rangesOverlap(candidateStart, candidateEnd, itemStart, itemEnd);
  }) || null;
}

export function formatTimeRange(item) {
  const start = item.startTime || '';
  const end = getEndTime(item.startTime, item.durationHrs, item.durationMins);
  if (!start) return '';
  if (end && end !== start) return `${start} - ${end}`;
  return start;
}

export function getTransportTimesFromDetail(detail = '') {
  const text = String(detail || '');
  const match = text.match(/Departs?\s*(\d{1,2}:\d{2}).*Arrives?\s*(\d{1,2}:\d{2})/i);
  if (!match) return { dep: '', arr: '' };
  return { dep: match[1], arr: match[2] };
}


export const ROUTE_MATRIX_TRAVEL_MODE = {
  walking: 'WALKING',
  cycling: 'BICYCLING',
  driving: 'DRIVING',
  public: 'TRANSIT',
};


export async function getTravelBetweenGoogleMaps(fromItem, toItem, mode, cache, setCache) {
  const lat1 = fromItem.lat ?? 0;
  const lng1 = fromItem.lng ?? 0;
  const lat2 = toItem.lat ?? 0;
  const lng2 = toItem.lng ?? 0;

  const cacheKey = `${lat1},${lng1}|${lat2},${lng2}|${mode}`;

  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

  if (typeof window === 'undefined' || !window.google?.maps?.importLibrary) {
    return getTravelBetweenFallback(fromItem, toItem, mode);
  }

  try {
    const { RouteMatrix } = await google.maps.importLibrary('routes');
    const travelMode = ROUTE_MATRIX_TRAVEL_MODE[mode] || 'DRIVING';

    const request = {
      origins: [{ lat: lat1, lng: lng1 }],
      destinations: [{ lat: lat2, lng: lng2 }],
      travelMode,
      fields: ['durationMillis', 'distanceMeters'],
    };

    const { matrix } = await RouteMatrix.computeRouteMatrix(request);
    const item = matrix?.rows?.[0]?.items?.[0];

    if (!item || item.error) {
      return getTravelBetweenFallback(fromItem, toItem, mode);
    }

    const distanceMeters = item.distanceMeters;
    const durationMillis = item.durationMillis ?? item.staticDurationMillis;

    if (distanceMeters == null || durationMillis == null) {
      return getTravelBetweenFallback(fromItem, toItem, mode);
    }

    const distKm = Math.round((distanceMeters / 1000) * 10) / 10;
    const totalMins = Math.max(1, Math.ceil(durationMillis / 60000));
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;

    const durationStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
    const result = { duration: durationStr, durationMins: totalMins, distance: `${distKm} km` };

    setCache((prev) => ({ ...prev, [cacheKey]: result }));
    return result;
  } catch (error) {
    console.warn('Route Matrix error:', error);
    return getTravelBetweenFallback(fromItem, toItem, mode);
  }
}


export function getTravelBetweenFallback(fromItem, toItem, mode) {
  const lat1 = fromItem.lat ?? 47.6;
  const lng1 = fromItem.lng ?? -122.3;
  const lat2 = toItem.lat ?? 47.61;
  const lng2 = toItem.lng ?? -122.33;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distKmRounded = Math.max(0.1, Math.round(distKm * 10) / 10);
  
  const routeDistKm = Math.round(distKmRounded * 1.3 * 10) / 10;
  const minPerKm = { walking: 12, cycling: 4, driving: 2.5, public: 5 }[mode] || 5;
  const totalMins = Math.round(routeDistKm * minPerKm);
  const mins = totalMins % 60;
  const hrs = Math.floor(totalMins / 60);
  const durationStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
  return { duration: durationStr, durationMins: totalMins, distance: `${routeDistKm} km` };
}


export function getTravelBetween(fromItem, toItem, mode, cache, setCache) {
  
  const cacheKey = `${fromItem.lat},${fromItem.lng}|${toItem.lat},${toItem.lng}|${mode}`;
  
  
  if (cache && cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  
  if (typeof window !== 'undefined' && window.google && cache !== undefined && setCache) {
    getTravelBetweenGoogleMaps(fromItem, toItem, mode, cache, setCache).catch(err => {
      console.error('Error fetching travel data:', err);
    });
  }
  
  
  return getTravelBetweenFallback(fromItem, toItem, mode);
}


export function tryAppendItemToExpenseList(tripExpenseItems, {
  itemType,
  data,
  categoryId,
  category,
  Icon,
  values,
  currency = 'USD',
  exchangeRates = {},
}) {
  const prev = Array.isArray(tripExpenseItems) ? tripExpenseItems : [];
  const isStayCategory = String(categoryId || '').toLowerCase() === 'stays';
  const costNum = parseFloat(values?.cost) || 0;
  const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
  const durationHrsNum = isStayCategory ? 0 : Number(values?.durationHrs || 0);
  const durationMinsNum = isStayCategory ? 0 : Number(values?.durationMins || 0);
  const startTime = isStayCategory
    ? (values?.checkInTime || '15:00')
    : (values?.startTime || '07:00');
  const resolvedDate = isStayCategory
    ? (values?.checkInDate || values?.date)
    : values?.date;

  const checkInDate = isStayCategory ? (values?.checkInDate || resolvedDate) : '';
  const checkInTime = isStayCategory ? (values?.checkInTime || startTime || '15:00') : '';
  const checkOutDate = isStayCategory ? (values?.checkOutDate || checkInDate) : '';
  const checkOutTime = isStayCategory ? (values?.checkOutTime || checkInTime || '11:00') : '';

  const checkInDateTime = isStayCategory ? parseDateTimeLocal(checkInDate, checkInTime) : null;
  const checkOutDateTime = isStayCategory ? parseDateTimeLocal(checkOutDate, checkOutTime) : null;
  const stayDurationMinutes = (isStayCategory && checkInDateTime && checkOutDateTime)
    ? Math.max(0, Math.round((checkOutDateTime.getTime() - checkInDateTime.getTime()) / (1000 * 60)))
    : 0;
  const stayDuration = isStayCategory
    ? durationMinutesToParts(stayDurationMinutes)
    : { durationHrs: durationHrsNum, durationMins: durationMinsNum };

  if (isStayCategory) {
    if (!checkInDateTime || !checkOutDateTime || checkOutDateTime <= checkInDateTime) {
      return {
        ok: false,
        reason: 'invalid_stay',
        message: 'Check-out must be after check-in.',
      };
    }
  }

  if (!isStayCategory) {
    const overlapping = findTimeOverlapItem(prev, {
      date: resolvedDate,
      startTime,
      durationHrs: stayDuration.durationHrs,
      durationMins: stayDuration.durationMins,
    });
    if (overlapping) {
      return {
        ok: false,
        reason: 'overlap',
        message: `Time overlaps with ${overlapping.name}. Please choose another time slot.`,
      };
    }
  }

  const docs = Array.isArray(values?.travelDocs)
    ? values.travelDocs
      .map((file, idx) => {
        const normalized = normalizeAttachment(file) || createAttachmentFromFile(file);
        if (!normalized) return null;
        return {
          id: `${data.id || data.name || 'doc'}-${idx}-${Date.now()}`,
          name: normalized.name || `Document ${idx + 1}`,
          type: normalized.type || '',
          url: normalized.url || '',
        };
      })
      .filter(Boolean)
    : [];

  const newItem = {
    id: `${itemType}-${data.id}-${Date.now()}`,
    sourcePlaceId: data.id || null,
    name: data.name,
    total: costNumUsd,
    categoryId,
    category,
    date: resolvedDate,
    detail: data.address || data.name,
    Icon,
    lat: data.lat,
    lng: data.lng,
    notes: values?.note || '',
    attachments: docs,
    startTime,
    durationHrs: stayDuration.durationHrs,
    durationMins: stayDuration.durationMins,
    checkInDate: isStayCategory ? checkInDate : undefined,
    checkInTime: isStayCategory ? checkInTime : undefined,
    checkOutDate: isStayCategory ? checkOutDate : undefined,
    checkOutTime: isStayCategory ? checkOutTime : undefined,
    externalLink: normalizeExternalUrl(values?.externalLink || data.website || ''),
    placeImageUrl: resolveImageUrl(
      data.image,
      data.name,
      itemType === 'food' ? 'restaurant' : itemType === 'experience' ? 'activity' : itemType === 'stay' ? 'hotel' : 'landmark',
    ),
    rating: data.rating,
    reviewCount: data.reviewCount,
  };

  return { ok: true, tripExpenseItems: [...prev, newItem] };
}

export const EXPENSE_CATEGORIES = [
  { id: 'stays', label: 'Stays', color: '#2563eb' },
  { id: 'food', label: 'Food & Beverages', color: '#dc2626' },
  { id: 'transportations', label: 'Transportations', color: '#ea580c' },
  { id: 'places', label: 'Places', color: '#16a34a' },
  { id: 'experiences', label: 'Experiences', color: '#7c3aed' },
];


export function getBudgetBreakdown(trip, currencyCode = 'USD', extraItems = []) {
  const prefix = currencyCode === 'USD' ? 'US' : currencyCode;
  const symbol = currencyCode === 'USD' ? 'US$' : `${currencyCode} `;
  const byCategory = EXPENSE_CATEGORIES.map((c) => ({ ...c, amount: 0 }));
  const normalizeAmount = (value) => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const raw = String(value ?? '').trim();
    if (!raw) return 0;
    const cleaned = raw.replace(/[^0-9.-]/g, '');
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  const merged = (Array.isArray(extraItems) ? extraItems : []).map((i, idx) => ({
    ...i,
    id: i.id || `expense-${idx}`,
    total: normalizeAmount(i.total),
  }));

  merged.forEach((item) => {
    const raw = String(item.categoryId || item.category || '').toLowerCase().trim();
    const key = raw === 'place' || raw === 'places' ? 'places'
      : raw === 'experience' || raw === 'experiences' ? 'experiences'
      : raw === 'transportation' || raw === 'transportations' || raw === 'transport' ? 'transportations'
      : raw === 'food' || raw === 'food & beverage' || raw === 'food & beverages' ? 'food'
      : raw === 'stay' || raw === 'stays' ? 'stays'
      : raw;
    const category = byCategory.find((c) => c.id === key);
    if (category) category.amount += normalizeAmount(item.total);
  });

  const total = byCategory.reduce((sum, c) => sum + c.amount, 0);
  return { total, byCategory, items: merged, symbol, prefix };
}

export function formatExpenseDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\//g, ' ');
}

function scoreMatch(query, text) {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (!q || !t) return 0;

  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  
  if (t === q) return 1000;
  
  
  if (new RegExp(`\\b${escaped}`).test(t)) return 500;
  
  
  if (t.startsWith(q)) return 300;
  
  
  if (t.includes(q)) return 100;
  
  return 0;
}

function sortPredictionsByQuery(query, predictions) {
  const q = String(query || '').trim();
  if (!q) return dedupePredictions(predictions).slice(0, 8);

  return dedupePredictions(predictions)
    .map((prediction) => {
      const main = prediction?.structured_formatting?.main_text || prediction?.description || '';
      const secondary = prediction?.structured_formatting?.secondary_text || '';
      const score = Math.max(scoreMatch(q, main), scoreMatch(q, secondary));
      return { prediction, score };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aMain = a.prediction?.structured_formatting?.main_text || a.prediction?.description || '';
      const bMain = b.prediction?.structured_formatting?.main_text || b.prediction?.description || '';
      return String(aMain).localeCompare(String(bMain));
    })
    .slice(0, 8)
    .map((entry) => entry.prediction);
}

function isAddressLikeQuery(query) {
  const q = String(query || '').trim();
  if (!q) return false;
  return /\d/.test(q) || q.includes(',') || q.split(/\s+/).length >= 4;
}

function toPrediction(main, secondary, placeIdPrefix = 'derived', index = 0, lat = null, lng = null) {
  const mainText = String(main || '').trim();
  const secondaryText = String(secondary || '').trim();
  if (!mainText) return null;

  const slug = mainText.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const prediction = {
    place_id: `${placeIdPrefix}-${index}-${slug}`,
    description: secondaryText ? `${mainText}, ${secondaryText}` : mainText,
    structured_formatting: {
      main_text: mainText,
      secondary_text: secondaryText || 'Location',
    },
  };

  const latNum = Number(lat);
  const lngNum = Number(lng);
  if (Number.isFinite(latNum) && Number.isFinite(lngNum)) {
    prediction.lat = latNum;
    prediction.lng = lngNum;
  }

  return prediction;
}

function dedupePredictions(predictions) {
  const seen = new Set();
  const unique = [];
  (predictions || []).forEach((prediction) => {
    const key = String(prediction?.description || prediction?.place_id || '').toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    unique.push(prediction);
  });
  return unique;
}

async function fetchGlobalGeocodingPredictions(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=10&language=en&format=json`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data?.results) ? data.results : [];

    
    const scored = results.map((item, index) => {
      const city = item.name || q;
      const admin = [item.admin1, item.country].filter(Boolean).join(', ');
      const mainScore = scoreMatch(q, city);
      const adminScore = scoreMatch(q, admin);
      const totalScore = Math.max(mainScore, adminScore);
      return {
        item,
        city,
        admin,
        score: totalScore || 50, 
        index,
      };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((s) => {
        const { city, admin, index } = s;
        return toPrediction(city, admin, 'geocode', s.item.id || index, s.item.latitude, s.item.longitude);
      })
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPhotonPredictions(query) {
  const q = String(query || '').trim();
  if (!q) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=12&lang=en`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];

    return features
      .map((feature, index) => {
        const props = feature?.properties || {};
        const main = [props.name, props.street].filter(Boolean).join(' ').trim() || props.name || '';
        const secondaryParts = [
          props.housenumber,
          props.postcode,
          props.city || props.county || props.state,
          props.country,
        ].filter(Boolean);
        const secondary = secondaryParts.join(', ');
        const coords = Array.isArray(feature?.geometry?.coordinates) ? feature.geometry.coordinates : [];
        const lng = coords.length >= 1 ? coords[0] : null;
        const lat = coords.length >= 2 ? coords[1] : null;
        return toPrediction(main, secondary, 'photon', props.osm_id || index, lat, lng);
      })
      .filter(Boolean);
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function fetchGoogleAutocompletePredictions(query) {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.AutocompleteService || !window.google?.maps?.places?.PlacesServiceStatus) {
      resolve([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    const request = { input: query };
    if (window.google.maps.places.AutocompleteSessionToken) {
      request.sessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }

    service.getPlacePredictions(request, (predictions, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && Array.isArray(predictions)) {
        resolve(predictions);
        return;
      }
      resolve([]);
    });
  });
}

function geocodeAddress(query) {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      resolve(null);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: query }, (results, status) => {
      const okStatus = window.google?.maps?.GeocoderStatus?.OK || 'OK';
      if (status !== okStatus && status !== 'OK') {
        resolve(null);
        return;
      }
      if (!Array.isArray(results) || results.length === 0) {
        resolve(null);
        return;
      }
      const location = results[0]?.geometry?.location;
      if (!location || typeof location.lat !== 'function' || typeof location.lng !== 'function') {
        resolve(null);
        return;
      }
      resolve({ lat: location.lat(), lng: location.lng() });
    });
  });
}

function fetchNearbyLandmarksFromLatLng(latLng) {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService || !window.google?.maps?.places?.PlacesServiceStatus) {
      resolve([]);
      return;
    }

    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    const service = new window.google.maps.places.PlacesService(div);
    const request = {
      location: latLng,
      radius: 3000,
      type: 'point_of_interest',
    };

    service.nearbySearch(request, (results, status) => {
      try {
        div.remove();
      } catch {
        
      }

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(results)) {
        resolve([]);
        return;
      }

      const mapped = results.slice(0, 8).map((item, index) => {
        const main = item.name || '';
        const secondary = item.vicinity || item.formatted_address || '';
        const lat = item?.geometry?.location?.lat?.();
        const lng = item?.geometry?.location?.lng?.();
        return toPrediction(main, secondary, 'nearby', item.place_id || index, lat, lng);
      }).filter(Boolean);

      resolve(mapped);
    });
  });
}

function fetchLandmarksByAddressText(query) {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService || !window.google?.maps?.places?.PlacesServiceStatus) {
      resolve([]);
      return;
    }

    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    const service = new window.google.maps.places.PlacesService(div);

    service.textSearch({ query: `top landmarks near ${query}` }, (results, status) => {
      try {
        div.remove();
      } catch {
        
      }

      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !Array.isArray(results)) {
        resolve([]);
        return;
      }

      const mapped = results
        .slice(0, 8)
        .map((item, index) => {
          const main = item.name || '';
          const secondary = item.formatted_address || item.vicinity || '';
          const lat = item?.geometry?.location?.lat?.();
          const lng = item?.geometry?.location?.lng?.();
          return toPrediction(main, secondary, 'text-landmark', item.place_id || index, lat, lng);
        })
        .filter(Boolean);

      resolve(mapped);
    });
  });
}

async function fetchNearbyLandmarkPredictionsFromAddress(query) {
  if (!isAddressLikeQuery(query)) return [];

  const latLng = await geocodeAddress(query);
  const nearby = latLng ? await fetchNearbyLandmarksFromLatLng(latLng) : [];
  if (nearby.length > 0) return dedupePredictions(nearby);

  const textLandmarks = await fetchLandmarksByAddressText(query);
  if (textLandmarks.length > 0) return dedupePredictions(textLandmarks);

  const geocoded = await fetchGlobalGeocodingPredictions(query);
  const hint = geocoded[0]?.description || '';
  if (!hint) return [];

  const hintedLandmarks = await fetchLandmarksByAddressText(hint);
  return dedupePredictions(hintedLandmarks);
}


export async function fetchPlacesPredictions(input, callback) {
  const query = String(input || '').trim();
  if (!query) {
    callback([]);
    return;
  }

  try {
    if (!window.google?.maps?.places?.AutocompleteService) {
      await loadGoogleMapsScript();
    }
    const addressLike = isAddressLikeQuery(query);
    const googlePromise = fetchGoogleAutocompletePredictions(query);
    const geocodePromise = fetchGlobalGeocodingPredictions(query);
    const photonPromise = fetchPhotonPredictions(query);
    const nearbyPromise = addressLike ? fetchNearbyLandmarkPredictionsFromAddress(query) : Promise.resolve([]);

    const [googlePredictions, geocoded, photonPredictions, nearbyLandmarks] = await Promise.all([
      googlePromise,
      geocodePromise,
      photonPromise,
      nearbyPromise,
    ]);

    const merged = sortPredictionsByQuery(query, [
      ...nearbyLandmarks,
      ...googlePredictions,
      ...photonPredictions,
      ...geocoded,
    ]);

    callback(merged);
  } catch (error) {
    console.error('Error fetching places predictions:', error);
    try {
      const [photonPredictions, geocoded] = await Promise.all([
        fetchPhotonPredictions(query),
        fetchGlobalGeocodingPredictions(query),
      ]);
      callback(sortPredictionsByQuery(query, [...photonPredictions, ...geocoded]));
    } catch {
      callback([]);
    }
  }
}

export { ADD_TO_TRIP_OPTIONS } from './tripDetailsConstants';
