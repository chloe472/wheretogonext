import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Share2,
  Trash2,
  GripVertical,
  MoreVertical,
  Plus,
  MapPin,
  Info,
  Camera,
  UtensilsCrossed,
  Building2,
  Car,
  Ticket,
  Users,
  Heart,
  X,
  Check,
  LayoutGrid,
  Calendar as CalendarIcon,
  Wallet,
  Search,
  PlusCircle,
  Paperclip,
  Clock,
  Plane,
  Train,
  Bus,
  Shield,
  Tag,
  Headphones,
  Minus,
  Ship,
  BookOpen,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Footprints,
  Bike,
  Bed,
  FileText,
  Palette,
  Route,
  Star,
  ArrowLeft,
  ExternalLink,
  Image
} from 'lucide-react';
import { fetchItineraryById, updateItinerary, deleteItinerary } from '../../api/itinerariesApi';
import {
  searchAddressSuggestions,
  getMapCenterForDestination,
  PLACE_FILTER_TAGS,
  PLACE_SORT_OPTIONS,
} from '../../data/mockPlaces';
import {
  searchFoodAddressSuggestions,
  FOOD_SORT_OPTIONS,
} from '../../data/mockFoodAndBeverages';
import {
  EXPERIENCE_TYPES,
  EXPERIENCE_PRICE_RANGES,
  EXPERIENCE_DURATIONS,
  EXPERIENCE_SORT_OPTIONS,
} from '../../data/mockExperiences';
import { searchLocations } from '../../data/mockLocations';
import { fetchDiscoveryData } from '../../api/discoveryApi';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import countriesData from '../../data/countries.json';
import DateRangePickerModal from '../DateRangePickerModal/DateRangePickerModal';
import TripMap from '../TripMap/TripMap';
import TripDetailsMapPanel from '../TripDetailsMapPanel/TripDetailsMapPanel';
import FriendlyModal from '../FriendlyModal/FriendlyModal';
import SocialImportModal from '../SocialImportModal/SocialImportModal';
import { useSocialImport } from '../SocialImportModal/useSocialImport';
import './TripDetailsPage.css';
import './TripDetailsPage.map.css';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Day rows for Kanban/calendar — from trip startDate/endDate (YYYY-MM-DD). */
function getTripDaysFromTrip(trip) {
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

function itineraryDocToTrip(doc) {
  if (!doc) return null;
  const id = String(doc._id ?? doc.id ?? '');
  return {
    ...doc,
    id,
    tripExpenseItems: Array.isArray(doc.tripExpenseItems) ? doc.tripExpenseItems : [],
  };
}
const FOOD_FILTER_OPTIONS = [
  'All',
  'Top Rated (4.5+)',
  'Budget ($-$$)',
  'Cafe',
  'Late Night',
  'Vegetarian / Vegan',
  'Muslim-Friendly',
];

function formatDayDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'Z');
  return `${d.getDate()} ${MONTH_SHORT[d.getMonth()]} ${d.getFullYear()}, ${DAY_NAMES[d.getDay()]}`;
}

function countryCodeToFlag(code) {
  if (!code || code.length !== 2) return '';
  const a = code.toUpperCase().charCodeAt(0) - 65 + 0x1F1E6;
  const b = code.toUpperCase().charCodeAt(1) - 65 + 0x1F1E6;
  return String.fromCodePoint(a, b);
}

function extractPrimaryDestination(destinationOrLocations) {
  if (!destinationOrLocations) return '';
  const parts = String(destinationOrLocations).split(',');
  return parts[0]?.trim() || String(destinationOrLocations).trim();
}

function buildStayFallbackLink(stay = {}, city = '') {
  if (stay.bookingUrl) return stay.bookingUrl;
  if (stay.website) return stay.website;
  if (stay.mapsUrl) return stay.mapsUrl;
  const query = `${stay.name || ''} ${stay.address || city || ''}`.trim();
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

const WHERE_TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

const CURRENCY_LIST = [
  { code: 'USD', name: 'United States dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British pound' },
  { code: 'AUD', name: 'Australian dollar' },
  { code: 'CAD', name: 'Canadian dollar' },
  { code: 'CHF', name: 'Swiss franc' },
  { code: 'CNY', name: 'Chinese yuan' },
  { code: 'JPY', name: 'Japanese yen' },
  { code: 'NZD', name: 'New Zealand dollar' },
  { code: 'PLN', name: 'Polish złoty' },
  { code: 'RON', name: 'Romanian leu' },
  { code: 'SEK', name: 'Swedish krona' },
  { code: 'SGD', name: 'Singapore dollar' },
  { code: 'THB', name: 'Thai baht' },
  { code: 'TWD', name: 'New Taiwan dollar' },
  { code: 'VND', name: 'Vietnamese dong' },
  { code: 'ZAR', name: 'South African rand' },
];
// Keep one slot for the manual-add card so 3-column pages don't end with a lone card row.
const ADD_PLACES_PAGE_SIZE = 17;

/** Category display for day cards */
const CATEGORY_CARD_STYLES = {
  places: { label: 'Place', color: '#16a34a' },
  place: { label: 'Place', color: '#16a34a' },
  food: { label: 'Food & Beverage', color: '#dc2626' },
  stays: { label: 'Stays', color: '#2563eb' },
  transportations: { label: 'Transportation', color: '#ea580c' },
  transportation: { label: 'Transportation', color: '#ea580c' },
  experiences: { label: 'Experience', color: '#7c3aed' },
  experience: { label: 'Experience', color: '#7c3aed' },
};

function getCategoryStyle(item) {
  const raw = (item.categoryId || item.category || 'places').toLowerCase();
  const key = raw === 'place' ? 'places' : raw === 'transportation' ? 'transportations' : raw === 'experience' ? 'experiences' : raw;
  return CATEGORY_CARD_STYLES[key] || CATEGORY_CARD_STYLES.places;
}

function isEditableItineraryItem(item) {
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

function parseFoodHours(value) {
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

function enrichFoodDetails(food, cityQuery) {
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

function addDays(dateStr, delta) {
  if (!dateStr) return dateStr;
  const d = new Date(dateStr + 'Z');
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

function isStayItem(item) {
  const raw = String(item?.categoryId || item?.category || '').toLowerCase();
  return raw === 'stays' || raw === 'stay';
}

function isFlightItem(item) {
  if (!item) return false;
  const transportType = String(item?.transportType || '').toLowerCase();
  if (transportType === 'flight' || transportType === 'flights') return true;
  return String(item?.name || '').trim().toLowerCase().startsWith('flight:');
}

function parseDateTimeLocal(dateStr, timeStr = '00:00') {
  if (!dateStr) return null;
  const normalizedTime = /^\d{2}:\d{2}$/.test(String(timeStr || '')) ? String(timeStr) : '00:00';
  const parsed = new Date(`${dateStr}T${normalizedTime}:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function toIsoDateLocal(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toHHmmLocal(dateObj) {
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return '';
  return `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;
}

function getStayWindow(item) {
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

function isStayActiveOnDay(item, dayDate) {
  if (!isStayItem(item) || !dayDate) return false;
  const { checkInDate, checkOutDate } = getStayWindow(item);
  if (!checkInDate) return false;

  if (!checkOutDate || checkOutDate <= checkInDate) {
    return dayDate === checkInDate;
  }

  return dayDate >= checkInDate && dayDate <= checkOutDate;
}

function formatStayDateTime(dateStr, timeStr = '') {
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

function getDayStayItems(items, dayDate) {
  return (items || []).filter((it) => isStayActiveOnDay(it, dayDate));
}

function hasStayBookingData(item) {
  if (!item) return false;
  const hasWindow = Boolean(item.checkInDate || item.checkOutDate);
  const hasCost = Number(item.total || 0) > 0;
  const hasNote = Boolean(String(item.notes || '').trim());
  const hasLink = Boolean(String(item.externalLink || '').trim());
  const hasDocs = Array.isArray(item.attachments) && item.attachments.length > 0;
  return hasWindow || hasCost || hasNote || hasLink || hasDocs;
}

function getDayTotalDurationMinutes(items, dayDate) {
  const dayItems = (items || []).filter((it) => it.date === dayDate && !isStayItem(it));
  let total = 0;
  dayItems.forEach((it) => {
    const hrs = it.durationHrs ?? 0;
    const mins = it.durationMins ?? 0;
    total += hrs * 60 + mins;
  });
  return total;
}

function formatDurationMinutes(totalMins) {
  if (totalMins < 60) return `${totalMins} min`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m > 0 ? `${h} hr ${String(m).padStart(2, '0')} min` : `${h} hr`;
}

const CALENDAR_START_HOUR = 0;
const CALENDAR_HOURS = 24;
const CALENDAR_ROW_HEIGHT = 48;
const CALENDAR_ALL_DAY_HEIGHT = 28;
const CALENDAR_GUTTER_WIDTH = 52;
const CALENDAR_DRAG_SNAP_MINS = 30;
const DAY_COLUMN_DEFAULT_WIDTH = 280;
const CALENDAR_DAY_COLUMN_DEFAULT_WIDTH = 240;
const DAY_COLUMN_MIN_WIDTH = 220;
const DAY_COLUMN_MAX_WIDTH = 720;

function createAttachmentFromFile(file) {
  return {
    name: file.name,
    type: file.type || '',
    url: URL.createObjectURL(file),
  };
}

function normalizeAttachment(att) {
  if (!att) return null;
  if (typeof att === 'string') return { name: att, type: '', url: '' };
  return {
    name: att.name || 'Attachment',
    type: att.type || '',
    url: att.url || '',
  };
}

function normalizeExternalUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) return '';
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `https:${raw}`;
  if (/\s/.test(raw)) return '';
  return `https://${raw}`;
}

function getItemViewDetailsUrl(item, city = '') {
  const direct = normalizeExternalUrl(item?.externalLink || item?.website || item?.mapsUrl || '');
  if (direct) return direct;
  const query = `${item?.name || ''} ${item?.detail || item?.address || city || ''}`.trim();
  if (!query) return '';
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function itemSpillsIntoNextDay(item) {
  if (!isStayItem(item)) return false;
  const { checkInDate, checkOutDate } = getStayWindow(item);
  return Boolean(checkInDate && checkOutDate && checkOutDate > checkInDate);
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function getCalendarEventPosition(item) {
  const startMins = timeToMinutes(item.startTime);
  const startHour = startMins / 60;
  const durationHrs = Number(item.durationHrs ?? 0);
  const durationMins = Number(item.durationMins ?? 0);
  const durationRows = Math.max(0.5, (durationHrs * 60 + durationMins) / 60);
  const topPx = CALENDAR_ALL_DAY_HEIGHT + Math.max(0, (startHour - CALENDAR_START_HOUR) * CALENDAR_ROW_HEIGHT);
  const heightPx = Math.max(CALENDAR_ROW_HEIGHT * 0.5, durationRows * CALENDAR_ROW_HEIGHT);
  return { top: topPx, height: heightPx };
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function getCalendarEventLayouts(items, dayDate) {
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function minutesToHHmm(totalMinutes) {
  const mins = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function durationMinutesToParts(totalMinutes) {
  const safe = Math.max(0, Math.round(totalMinutes));
  return {
    durationHrs: Math.floor(safe / 60),
    durationMins: safe % 60,
  };
}

function getCalendarDropStartTime(clientY, containerRect) {
  const y = clientY - containerRect.top;
  const timelineY = Math.max(0, y - CALENDAR_ALL_DAY_HEIGHT);
  const minsFromStart = Math.round((timelineY / CALENDAR_ROW_HEIGHT) * 60);
  const snapped = Math.round(minsFromStart / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS;
  const maxMinutes = (CALENDAR_START_HOUR + CALENDAR_HOURS) * 60 - CALENDAR_DRAG_SNAP_MINS;
  const absoluteMinutes = clamp((CALENDAR_START_HOUR * 60) + snapped, CALENDAR_START_HOUR * 60, maxMinutes);
  return minutesToHHmm(absoluteMinutes);
}

function distanceBetween(a, b) {
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

/** Reorder items between start and end (inclusive) by proximity: start fixed, end fixed last, middle ordered by nearest neighbour. */
function reorderByProximity(items, startId, endId) {
  if (!items.length) return items;
  const startIdx = items.findIndex((i) => i.id === startId);
  const endIdx = items.findIndex((i) => i.id === endId);
  if (startIdx < 0 || endIdx < 0 || startIdx > endIdx) return items;
  const startItem = items[startIdx];
  const endItem = items[endIdx];
  const middle = items.slice(startIdx + 1, endIdx);
  if (middle.length === 0) return items;
  const ordered = [startItem];
  let current = startItem;
  const remaining = [...middle];
  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = distanceBetween(current, remaining[0]);
    for (let i = 1; i < remaining.length; i++) {
      const d = distanceBetween(current, remaining[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    ordered.push(next);
    current = next;
  }
  ordered.push(endItem);
  const before = items.slice(0, startIdx);
  const after = items.slice(endIdx + 1);
  return [...before, ...ordered, ...after];
}

const DAY_COLOR_OPTIONS = [
  '#2563eb', '#dc2626', '#16a34a', '#ea580c', '#7c3aed', '#0ea5e9', '#8b5cf6', '#64748b',
];

const TRAVEL_MODES = [
  { id: 'walking', label: 'Walking', Icon: Footprints },
  { id: 'cycling', label: 'Cycling', Icon: Bike },
  { id: 'driving', label: 'Driving', Icon: Car },
  { id: 'public', label: 'Public Transport', Icon: Train },
];

function getSortedDayItems(items, dayDate, options = {}) {
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

function getEndTime(startTime, durationHrs = 0, durationMins = 0) {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  let endM = m + (durationMins || 0);
  let endH = h + (durationHrs || 0) + Math.floor(endM / 60);
  endM = endM % 60;
  endH = endH % 24;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function formatTimeRange(item) {
  const start = item.startTime || '';
  const end = getEndTime(item.startTime, item.durationHrs, item.durationMins);
  if (!start) return '';
  if (end && end !== start) return `${start} - ${end}`;
  return start;
}

function getTransportTimesFromDetail(detail = '') {
  const text = String(detail || '');
  const match = text.match(/Departs?\s*(\d{1,2}:\d{2}).*Arrives?\s*(\d{1,2}:\d{2})/i);
  if (!match) return { dep: '', arr: '' };
  return { dep: match[1], arr: match[2] };
}

/** Maps our UI mode to Route Matrix travelMode strings (replaces legacy Distance Matrix). */
const ROUTE_MATRIX_TRAVEL_MODE = {
  walking: 'WALKING',
  cycling: 'BICYCLING',
  driving: 'DRIVING',
  public: 'TRANSIT',
};

/** Get travel time and distance via google.maps.routes.RouteMatrix.computeRouteMatrix (not deprecated DistanceMatrix). */
async function getTravelBetweenGoogleMaps(fromItem, toItem, mode, cache, setCache) {
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

/** Fallback travel time calculation using straight-line distance (Haversine formula). */
function getTravelBetweenFallback(fromItem, toItem, mode) {
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
  // Add 30% buffer to straight-line distance to approximate actual route distance
  const routeDistKm = Math.round(distKmRounded * 1.3 * 10) / 10;
  const minPerKm = { walking: 12, cycling: 4, driving: 2.5, public: 5 }[mode] || 5;
  const totalMins = Math.round(routeDistKm * minPerKm);
  const mins = totalMins % 60;
  const hrs = Math.floor(totalMins / 60);
  const durationStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
  return { duration: durationStr, durationMins: totalMins, distance: `${routeDistKm} km` };
}

/** Get travel time/distance between two items - tries Google Maps SDK first, falls back to calculation. */
function getTravelBetween(fromItem, toItem, mode, cache, setCache) {
  // Generate cache key
  const cacheKey = `${fromItem.lat},${fromItem.lng}|${toItem.lat},${toItem.lng}|${mode}`;
  
  // Return cached result if available
  if (cache && cache[cacheKey]) {
    return cache[cacheKey];
  }
  
  // Start async fetch in background if Google Maps is available
  if (typeof window !== 'undefined' && window.google && cache !== undefined && setCache) {
    getTravelBetweenGoogleMaps(fromItem, toItem, mode, cache, setCache).catch(err => {
      console.error('Error fetching travel data:', err);
    });
  }
  
  // Return fallback calculation immediately for initial render
  return getTravelBetweenFallback(fromItem, toItem, mode);
}

const EXPENSE_CATEGORIES = [
  { id: 'stays', label: 'Stays', color: '#2563eb' },
  { id: 'food', label: 'Food & Beverages', color: '#dc2626' },
  { id: 'transportations', label: 'Transportations', color: '#ea580c' },
  { id: 'places', label: 'Places', color: '#16a34a' },
  { id: 'experiences', label: 'Experiences', color: '#7c3aed' },
];

/** Mock budget breakdown for the trip (in production would come from API). extraItems merged into items and added to places total. */
function getBudgetBreakdown(trip, currencyCode = 'USD', extraItems = []) {
  const prefix = currencyCode === 'USD' ? 'US' : currencyCode;
  const symbol = currencyCode === 'USD' ? 'US$' : `${currencyCode} `;
  const byCategory = [
    { id: 'stays', label: 'Stays', amount: 842, color: '#2563eb' },
    { id: 'food', label: 'Food & Beverages', amount: 0, color: '#dc2626' },
    { id: 'transportations', label: 'Transportations', amount: 0, color: '#ea580c' },
    { id: 'places', label: 'Places', amount: 0, color: '#16a34a' },
    { id: 'experiences', label: 'Experiences', amount: 65.14, color: '#7c3aed' },
  ];
  const items = [
    { id: '1', name: 'The Belltown Inn', category: 'Stays', categoryId: 'stays', startDate: trip?.startDate || '2026-03-23', endDate: trip?.endDate || '2026-03-29', detail: '140.33 × 6 nights x 1 room', total: 842, Icon: Building2 },
    { id: '2', name: 'Seattle Sky View Observatory tickets', category: 'Experience', categoryId: 'experiences', date: '2026-03-24', detail: '17.16 × 1 pax', total: 17.16, Icon: Ticket },
    { id: '3', name: 'Seattle: Space Needle & Chihuly Garden and Glass Ticket', category: 'Experience', categoryId: 'experiences', date: '2026-03-27', detail: '47.97 × 1 pax', total: 47.97, Icon: Ticket },
  ];
  const placesExtra = extraItems.filter((i) => (i.categoryId || i.category) === 'places');
  const transportExtra = extraItems.filter((i) => (i.categoryId || i.category) === 'transportations');
  const placesAmount = placesExtra.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const transportAmount = transportExtra.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const merged = [...items, ...extraItems.map((i, idx) => ({ ...i, id: i.id || `extra-${idx}` }))];
  const catPlaces = byCategory.find((c) => c.id === 'places');
  const catTransport = byCategory.find((c) => c.id === 'transportations');
  if (catPlaces) catPlaces.amount = placesAmount;
  if (catTransport) catTransport.amount = transportAmount;
  const total = byCategory.reduce((sum, c) => sum + c.amount, 0);
  return { total, byCategory, items: merged, symbol, prefix };
}

function formatExpenseDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\//g, ' ');
}

const ADD_TO_TRIP_OPTIONS = [
  {
    id: 'place',
    label: 'Place',
    description: 'Attractions, Events, Restaurants,...',
    Icon: Camera,
    color: '#16a34a',
  },
  {
    id: 'food',
    label: 'Food & Beverage',
    description: 'Local Food, Restaurant, Drinks,...',
    Icon: UtensilsCrossed,
    color: '#dc2626',
  },
  {
    id: 'stays',
    label: 'Stays',
    description: 'Hotel, Apartments, Villas,...',
    Icon: Building2,
    color: '#2563eb',
  },
  {
    id: 'transportation',
    label: 'Transportation',
    description: 'Flight, Train, Bus, Ferry, Boat & Private Transfer',
    Icon: Car,
    color: '#ea580c',
  },
  {
    id: 'experience',
    label: 'Experience',
    description: 'Tours, Cruises, Indoor & Outdoor Activities...',
    Icon: Ticket,
    color: '#7c3aed',
  },
  {
    id: 'routeIdeas',
    label: 'Smart Itinerary Generator',
    description: 'Builds day-by-day routes using popularity ranking and nearby-place clustering',
    Icon: Route,
    color: '#0ea5e9',
  },
  {
    id: 'wishlists',
    label: 'Wishlists',
    description: 'Add from your saved collection',
    Icon: Heart,
    color: '#db2777',
  },
  {
    id: 'social',
    label: 'Import from social media',
    description: 'Import places and posts from Instagram, Pinterest, TikTok...',
    Icon: Share2,
    color: '#8b5cf6',
  },
];

/** Mock airports and cities for transport autofill (in production use an API). */
const AIRPORTS_AND_CITIES = [
  // Major US Airports
  { id: 'ATL', name: 'Atlanta Hartsfield-Jackson (ATL)', city: 'Atlanta', country: 'United States', type: 'Airport' },
  { id: 'LAX', name: 'Los Angeles International (LAX)', city: 'Los Angeles', country: 'United States', type: 'Airport' },
  { id: 'ORD', name: 'Chicago O\'Hare International (ORD)', city: 'Chicago', country: 'United States', type: 'Airport' },
  { id: 'DFW', name: 'Dallas/Fort Worth International (DFW)', city: 'Dallas', country: 'United States', type: 'Airport' },
  { id: 'DEN', name: 'Denver International (DEN)', city: 'Denver', country: 'United States', type: 'Airport' },
  { id: 'JFK', name: 'John F. Kennedy International (JFK)', city: 'New York', country: 'United States', type: 'Airport' },
  { id: 'SFO', name: 'San Francisco International (SFO)', city: 'San Francisco', country: 'United States', type: 'Airport' },
  { id: 'SEA', name: 'Seattle-Tacoma International (SEA)', city: 'Seattle', country: 'United States', type: 'Airport' },
  { id: 'LAS', name: 'Las Vegas McCarran (LAS)', city: 'Las Vegas', country: 'United States', type: 'Airport' },
  { id: 'MCO', name: 'Orlando International (MCO)', city: 'Orlando', country: 'United States', type: 'Airport' },
  { id: 'MIA', name: 'Miami International (MIA)', city: 'Miami', country: 'United States', type: 'Airport' },
  { id: 'PHX', name: 'Phoenix Sky Harbor (PHX)', city: 'Phoenix', country: 'United States', type: 'Airport' },
  { id: 'IAH', name: 'Houston George Bush (IAH)', city: 'Houston', country: 'United States', type: 'Airport' },
  { id: 'BOS', name: 'Boston Logan International (BOS)', city: 'Boston', country: 'United States', type: 'Airport' },
  { id: 'MSP', name: 'Minneapolis-St Paul (MSP)', city: 'Minneapolis', country: 'United States', type: 'Airport' },
  { id: 'DTW', name: 'Detroit Metropolitan (DTW)', city: 'Detroit', country: 'United States', type: 'Airport' },
  { id: 'PHL', name: 'Philadelphia International (PHL)', city: 'Philadelphia', country: 'United States', type: 'Airport' },
  { id: 'LGA', name: 'LaGuardia Airport (LGA)', city: 'New York', country: 'United States', type: 'Airport' },
  { id: 'EWR', name: 'Newark Liberty International (EWR)', city: 'Newark', country: 'United States', type: 'Airport' },
  { id: 'CLT', name: 'Charlotte Douglas (CLT)', city: 'Charlotte', country: 'United States', type: 'Airport' },

  // Canada
  { id: 'YYZ', name: 'Toronto Pearson (YYZ)', city: 'Toronto', country: 'Canada', type: 'Airport' },
  { id: 'YVR', name: 'Vancouver International (YVR)', city: 'Vancouver', country: 'Canada', type: 'Airport' },
  { id: 'YUL', name: 'Montreal-Pierre Trudeau (YUL)', city: 'Montreal', country: 'Canada', type: 'Airport' },
  { id: 'YYC', name: 'Calgary International (YYC)', city: 'Calgary', country: 'Canada', type: 'Airport' },

  // Europe
  { id: 'LHR', name: 'London Heathrow (LHR)', city: 'London', country: 'United Kingdom', type: 'Airport' },
  { id: 'LGW', name: 'London Gatwick (LGW)', city: 'London', country: 'United Kingdom', type: 'Airport' },
  { id: 'CDG', name: 'Paris Charles de Gaulle (CDG)', city: 'Paris', country: 'France', type: 'Airport' },
  { id: 'ORY', name: 'Paris Orly (ORY)', city: 'Paris', country: 'France', type: 'Airport' },
  { id: 'FRA', name: 'Frankfurt Airport (FRA)', city: 'Frankfurt', country: 'Germany', type: 'Airport' },
  { id: 'AMS', name: 'Amsterdam Schiphol (AMS)', city: 'Amsterdam', country: 'Netherlands', type: 'Airport' },
  { id: 'MAD', name: 'Madrid-Barajas (MAD)', city: 'Madrid', country: 'Spain', type: 'Airport' },
  { id: 'BCN', name: 'Barcelona-El Prat (BCN)', city: 'Barcelona', country: 'Spain', type: 'Airport' },
  { id: 'FCO', name: 'Rome Fiumicino (FCO)', city: 'Rome', country: 'Italy', type: 'Airport' },
  { id: 'MXP', name: 'Milan Malpensa (MXP)', city: 'Milan', country: 'Italy', type: 'Airport' },
  { id: 'MUC', name: 'Munich Airport (MUC)', city: 'Munich', country: 'Germany', type: 'Airport' },
  { id: 'ZRH', name: 'Zurich Airport (ZRH)', city: 'Zurich', country: 'Switzerland', type: 'Airport' },
  { id: 'VIE', name: 'Vienna International (VIE)', city: 'Vienna', country: 'Austria', type: 'Airport' },
  { id: 'CPH', name: 'Copenhagen Airport (CPH)', city: 'Copenhagen', country: 'Denmark', type: 'Airport' },
  { id: 'OSL', name: 'Oslo Gardermoen (OSL)', city: 'Oslo', country: 'Norway', type: 'Airport' },
  { id: 'ARN', name: 'Stockholm Arlanda (ARN)', city: 'Stockholm', country: 'Sweden', type: 'Airport' },
  { id: 'IST', name: 'Istanbul Airport (IST)', city: 'Istanbul', country: 'Turkey', type: 'Airport' },
  { id: 'DUB', name: 'Dublin Airport (DUB)', city: 'Dublin', country: 'Ireland', type: 'Airport' },
  { id: 'LIS', name: 'Lisbon Portela (LIS)', city: 'Lisbon', country: 'Portugal', type: 'Airport' },
  { id: 'ATH', name: 'Athens International (ATH)', city: 'Athens', country: 'Greece', type: 'Airport' },

  // Asia
  { id: 'HND', name: 'Tokyo Haneda (HND)', city: 'Tokyo', country: 'Japan', type: 'Airport' },
  { id: 'NRT', name: 'Tokyo Narita (NRT)', city: 'Tokyo', country: 'Japan', type: 'Airport' },
  { id: 'SIN', name: 'Singapore Changi (SIN)', city: 'Singapore', country: 'Singapore', type: 'Airport' },
  { id: 'HKG', name: 'Hong Kong International (HKG)', city: 'Hong Kong', country: 'Hong Kong', type: 'Airport' },
  { id: 'ICN', name: 'Seoul Incheon (ICN)', city: 'Seoul', country: 'South Korea', type: 'Airport' },
  { id: 'PVG', name: 'Shanghai Pudong (PVG)', city: 'Shanghai', country: 'China', type: 'Airport' },
  { id: 'PEK', name: 'Beijing Capital (PEK)', city: 'Beijing', country: 'China', type: 'Airport' },
  { id: 'CAN', name: 'Guangzhou Baiyun (CAN)', city: 'Guangzhou', country: 'China', type: 'Airport' },
  { id: 'BKK', name: 'Bangkok Suvarnabhumi (BKK)', city: 'Bangkok', country: 'Thailand', type: 'Airport' },
  { id: 'KUL', name: 'Kuala Lumpur International (KUL)', city: 'Kuala Lumpur', country: 'Malaysia', type: 'Airport' },
  { id: 'CGK', name: 'Jakarta Soekarno-Hatta (CGK)', city: 'Jakarta', country: 'Indonesia', type: 'Airport' },
  { id: 'DPS', name: 'Bali Ngurah Rai (DPS)', city: 'Bali', country: 'Indonesia', type: 'Airport' },
  { id: 'MNL', name: 'Manila Ninoy Aquino (MNL)', city: 'Manila', country: 'Philippines', type: 'Airport' },
  { id: 'HAN', name: 'Hanoi Noi Bai (HAN)', city: 'Hanoi', country: 'Vietnam', type: 'Airport' },
  { id: 'SGN', name: 'Ho Chi Minh City (SGN)', city: 'Ho Chi Minh City', country: 'Vietnam', type: 'Airport' },
  { id: 'DEL', name: 'Delhi Indira Gandhi (DEL)', city: 'Delhi', country: 'India', type: 'Airport' },
  { id: 'BOM', name: 'Mumbai Chhatrapati Shivaji (BOM)', city: 'Mumbai', country: 'India', type: 'Airport' },
  { id: 'KIX', name: 'Osaka Kansai (KIX)', city: 'Osaka', country: 'Japan', type: 'Airport' },
  { id: 'TPE', name: 'Taiwan Taoyuan (TPE)', city: 'Taipei', country: 'Taiwan', type: 'Airport' },

  // Middle East
  { id: 'DXB', name: 'Dubai International (DXB)', city: 'Dubai', country: 'UAE', type: 'Airport' },
  { id: 'DOH', name: 'Doha Hamad International (DOH)', city: 'Doha', country: 'Qatar', type: 'Airport' },
  { id: 'AUH', name: 'Abu Dhabi International (AUH)', city: 'Abu Dhabi', country: 'UAE', type: 'Airport' },
  { id: 'CAI', name: 'Cairo International (CAI)', city: 'Cairo', country: 'Egypt', type: 'Airport' },
  { id: 'TLV', name: 'Tel Aviv Ben Gurion (TLV)', city: 'Tel Aviv', country: 'Israel', type: 'Airport' },

  // Oceania
  { id: 'SYD', name: 'Sydney Kingsford Smith (SYD)', city: 'Sydney', country: 'Australia', type: 'Airport' },
  { id: 'MEL', name: 'Melbourne Airport (MEL)', city: 'Melbourne', country: 'Australia', type: 'Airport' },
  { id: 'BNE', name: 'Brisbane Airport (BNE)', city: 'Brisbane', country: 'Australia', type: 'Airport' },
  { id: 'AKL', name: 'Auckland Airport (AKL)', city: 'Auckland', country: 'New Zealand', type: 'Airport' },
  { id: 'PER', name: 'Perth Airport (PER)', city: 'Perth', country: 'Australia', type: 'Airport' },

  // Latin America
  { id: 'GRU', name: 'São Paulo Guarulhos (GRU)', city: 'São Paulo', country: 'Brazil', type: 'Airport' },
  { id: 'GIG', name: 'Rio de Janeiro Galeão (GIG)', city: 'Rio de Janeiro', country: 'Brazil', type: 'Airport' },
  { id: 'MEX', name: 'Mexico City International (MEX)', city: 'Mexico City', country: 'Mexico', type: 'Airport' },
  { id: 'BOG', name: 'Bogotá El Dorado (BOG)', city: 'Bogotá', country: 'Colombia', type: 'Airport' },
  { id: 'EZE', name: 'Buenos Aires Ezeiza (EZE)', city: 'Buenos Aires', country: 'Argentina', type: 'Airport' },
  { id: 'LIM', name: 'Lima Jorge Chávez (LIM)', city: 'Lima', country: 'Peru', type: 'Airport' },
  { id: 'SCL', name: 'Santiago Arturo Merino (SCL)', city: 'Santiago', country: 'Chile', type: 'Airport' },

  // Africa
  { id: 'JNB', name: 'Johannesburg O.R. Tambo (JNB)', city: 'Johannesburg', country: 'South Africa', type: 'Airport' },
  { id: 'CPT', name: 'Cape Town International (CPT)', city: 'Cape Town', country: 'South Africa', type: 'Airport' },
  { id: 'NBO', name: 'Nairobi Jomo Kenyatta (NBO)', city: 'Nairobi', country: 'Kenya', type: 'Airport' },
  { id: 'LOS', name: 'Lagos Murtala Muhammed (LOS)', city: 'Lagos', country: 'Nigeria', type: 'Airport' },
  { id: 'ADD', name: 'Addis Ababa Bole (ADD)', city: 'Addis Ababa', country: 'Ethiopia', type: 'Airport' },

  // Cities and Stations
  { id: 'city-newyork', name: 'New York, United States', type: 'City' },
  { id: 'city-london', name: 'London, United Kingdom', type: 'City' },
  { id: 'city-paris', name: 'Paris, France', type: 'City' },
  { id: 'city-tokyo', name: 'Tokyo, Japan', type: 'City' },
  { id: 'city-singapore', name: 'Singapore', type: 'City' },
  { id: 'city-bangkok', name: 'Bangkok, Thailand', type: 'City' },
  { id: 'city-dubai', name: 'Dubai, UAE', type: 'City' },
  { id: 'city-hongkong', name: 'Hong Kong', type: 'City' },
  { id: 'city-seoul', name: 'Seoul, South Korea', type: 'City' },
  { id: 'city-sydney', name: 'Sydney, Australia', type: 'City' },
  { id: 'city-losangeles', name: 'Los Angeles, United States', type: 'City' },
  { id: 'city-sanfrancisco', name: 'San Francisco, United States', type: 'City' },
  { id: 'city-seattle', name: 'Seattle, United States', type: 'City' },
  { id: 'city-chicago', name: 'Chicago, United States', type: 'City' },
  { id: 'city-miami', name: 'Miami, United States', type: 'City' },
  { id: 'city-toronto', name: 'Toronto, Canada', type: 'City' },
  { id: 'city-vancouver', name: 'Vancouver, Canada', type: 'City' },
  { id: 'city-amsterdam', name: 'Amsterdam, Netherlands', type: 'City' },
  { id: 'city-barcelona', name: 'Barcelona, Spain', type: 'City' },
  { id: 'city-rome', name: 'Rome, Italy', type: 'City' },
  { id: 'city-berlin', name: 'Berlin, Germany', type: 'City' },
  { id: 'city-madrid', name: 'Madrid, Spain', type: 'City' },
  { id: 'city-istanbul', name: 'Istanbul, Turkey', type: 'City' },
  { id: 'city-mumbai', name: 'Mumbai, India', type: 'City' },
  { id: 'city-delhi', name: 'Delhi, India', type: 'City' },
  { id: 'city-shanghai', name: 'Shanghai, China', type: 'City' },
  { id: 'city-beijing', name: 'Beijing, China', type: 'City' },
  { id: 'city-kualalumpur', name: 'Kuala Lumpur, Malaysia', type: 'City' },
  { id: 'city-bali', name: 'Bali, Indonesia', type: 'City' },
  { id: 'city-phuket', name: 'Phuket, Thailand', type: 'City' },
  { id: 'city-hanoi', name: 'Hanoi, Vietnam', type: 'City' },
  { id: 'city-saigon', name: 'Ho Chi Minh City, Vietnam', type: 'City' },
  { id: 'city-osaka', name: 'Osaka, Japan', type: 'City' },
  { id: 'city-kyoto', name: 'Kyoto, Japan', type: 'City' },
  { id: 'city-melbourne', name: 'Melbourne, Australia', type: 'City' },
  { id: 'station-penn', name: 'Penn Station, New York', type: 'Station' },
  { id: 'station-union', name: 'Union Station, Washington DC', type: 'Station' },
  { id: 'station-gare', name: 'Gare du Nord, Paris', type: 'Station' },
  { id: 'station-kings', name: 'King\'s Cross, London', type: 'Station' },
  { id: 'station-chang', name: 'Changi Airport, Singapore', type: 'Station' },
  { id: 'station-shinjuku', name: 'Shinjuku Station, Tokyo', type: 'Station' },
  { id: 'station-central', name: 'Central Station, Amsterdam', type: 'Station' },
];

const AIRLINES = [
  { id: 'UA', name: 'United Airlines' },
  { id: 'AA', name: 'American Airlines' },
  { id: 'DL', name: 'Delta Air Lines' },
  { id: 'BA', name: 'British Airways' },
  { id: 'AF', name: 'Air France' },
  { id: 'LH', name: 'Lufthansa' },
  { id: 'SQ', name: 'Singapore Airlines' },
  { id: 'EK', name: 'Emirates' },
  { id: 'JL', name: 'Japan Airlines' },
  { id: 'NH', name: 'ANA' },
  { id: 'QF', name: 'Qantas' },
  { id: 'AC', name: 'Air Canada' },
  { id: 'TK', name: 'Turkish Airlines' },
  { id: 'KL', name: 'KLM' },
  { id: 'CX', name: 'Cathay Pacific' },
];

function searchAirportsAndCities(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  // Search by airport code, city name, or full name
  return AIRPORTS_AND_CITIES.filter((a) => {
    const nameMatch = a.name.toLowerCase().includes(q);
    const idMatch = a.id && a.id.toLowerCase().includes(q);
    const cityMatch = a.city && a.city.toLowerCase().includes(q);
    const countryMatch = a.country && a.country.toLowerCase().includes(q);

    return nameMatch || idMatch || cityMatch || countryMatch;
  }).slice(0, limit);
}

function searchLocationsForSurfaceTransport(query, limit = 10) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];

  // Search by city name, country, or full name - prioritize cities over airports
  const results = AIRPORTS_AND_CITIES.filter((a) => {
    const nameMatch = a.name.toLowerCase().includes(q);
    const idMatch = a.id && a.id.toLowerCase().includes(q);
    const cityMatch = a.city && a.city.toLowerCase().includes(q);
    const countryMatch = a.country && a.country.toLowerCase().includes(q);

    return nameMatch || idMatch || cityMatch || countryMatch;
  });

  // Sort: Cities first, then Airports
  const sorted = results.sort((a, b) => {
    if (a.type === 'City' && b.type !== 'City') return -1;
    if (a.type !== 'City' && b.type === 'City') return 1;
    return 0;
  });

  return sorted.slice(0, limit);
}

function searchAirlines(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return AIRLINES.filter(
    (a) => a.name.toLowerCase().includes(q) || (a.id && a.id.toLowerCase().includes(q))
  ).slice(0, limit);
}

// Fetch Google Places Autocomplete predictions
async function fetchPlacesPredictions(input, callback) {
  if (!input || !input.trim()) {
    callback([]);
    return;
  }

  try {
    // Wait for Google Maps SDK
    if (!window.google || !window.google.maps || !window.google.maps.places) {
      console.warn('Google Maps Places library not loaded yet');
      callback([]);
      return;
    }

    const service = new window.google.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input: input,
        types: ['establishment', 'geocode'], // Include all types of locations
      },
      (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          callback(predictions);
        } else {
          callback([]);
        }
      }
    );
  } catch (error) {
    console.error('Error fetching places predictions:', error);
    callback([]);
  }
}

export default function TripDetailsPage({ user, onLogout }) {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [locationUpdateKey, setLocationUpdateKey] = useState(0);
  const [serverItinerary, setServerItinerary] = useState(null);
  const [tripLoading, setTripLoading] = useState(true);
  const [tripLoadError, setTripLoadError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setTripLoading(true);
    setTripLoadError(null);
    setServerItinerary(null);
    (async () => {
      try {
        const doc = await fetchItineraryById(tripId);
        if (cancelled) return;
        if (!doc) {
          setTripLoadError('Trip not found.');
          setServerItinerary(null);
        } else {
          setServerItinerary(doc);
        }
      } catch (e) {
        if (!cancelled) {
          setTripLoadError(e?.message || 'Failed to load trip');
          setServerItinerary(null);
        }
      } finally {
        if (!cancelled) setTripLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  const tripData = useMemo(() => itineraryDocToTrip(serverItinerary), [serverItinerary]);

  // Local state for immediate destination/location updates
  const [localDestination, setLocalDestination] = useState(null);
  const [localLocations, setLocalLocations] = useState(null);

  // Use local state if available, otherwise use trip data
  const trip = useMemo(() => {
    if (!tripData) return null;
    if (localDestination !== null || localLocations !== null) {
      return {
        ...tripData,
        destination: localDestination ?? tripData.destination,
        locations: localLocations ?? tripData.locations,
      };
    }
    return tripData;
  }, [tripData, localDestination, localLocations]);

  // Clear local state after trip data has been updated to match
  useEffect(() => {
    if (localDestination !== null && tripData?.destination === localDestination) {
      setLocalDestination(null);
    }
    if (localLocations !== null && tripData?.locations === localLocations) {
      setLocalLocations(null);
    }
  }, [tripData, localDestination, localLocations]);

  const [currency, setCurrency] = useState('USD');
  const [friendlyDialog, setFriendlyDialog] = useState({
    open: false,
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
  });
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [titleDisplay, setTitleDisplay] = useState('');
  const [mapView, setMapView] = useState('Default');
  const [mapFilter, setMapFilter] = useState('Default');
  const [mapExpandOpen, setMapExpandOpen] = useState(false);
  const [dayTitles, setDayTitles] = useState({});
  const [addSheetDay, setAddSheetDay] = useState(null);
  const [addSheetFromCalendar, setAddSheetFromCalendar] = useState(false);
  /** When set, the add sheet is positioned just above this rect (from "Add things to do" button); null when opened from calendar FAB. */
  const [addSheetAnchor, setAddSheetAnchor] = useState(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [expenseSortBy, setExpenseSortBy] = useState('category');
  const [viewMode, setViewMode] = useState('kanban');
  const [dateRange, setDateRange] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [modalCurrency, setModalCurrency] = useState('USD');
  const [addPlacesOpen, setAddPlacesOpen] = useState(false);
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addExperiencesOpen, setAddExperiencesOpen] = useState(false);
  const [addStaysOpen, setAddStaysOpen] = useState(false);
  const [placeDetailsView, setPlaceDetailsView] = useState(null);
  const [placeDetailsTab, setPlaceDetailsTab] = useState('overview');
  const [foodDetailsView, setFoodDetailsView] = useState(null);
  const [foodDetailsTab, setFoodDetailsTab] = useState('overview');
  const [experienceDetailsView, setExperienceDetailsView] = useState(null);
  const [experienceDetailsTab, setExperienceDetailsTab] = useState('overview');
  const [stayDetailsView, setStayDetailsView] = useState(null);
  const [stayDetailsTab, setStayDetailsTab] = useState('overview');
  const [itineraryDetailsView, setItineraryDetailsView] = useState(null);
  const [addCustomPlaceOpen, setAddCustomPlaceOpen] = useState(false);
  const [addCustomFoodOpen, setAddCustomFoodOpen] = useState(false);
  const [addCustomExperienceOpen, setAddCustomExperienceOpen] = useState(false);
  const [addPlacesDay, setAddPlacesDay] = useState(1);
  const [addFoodDay, setAddFoodDay] = useState(1);
  const [addToTripModalOpen, setAddToTripModalOpen] = useState(false);
  const [addToTripItem, setAddToTripItem] = useState(null);
  const [addToTripDate, setAddToTripDate] = useState('');
  const [addToTripStartTime, setAddToTripStartTime] = useState('07:00');
  const [addToTripDurationHrs, setAddToTripDurationHrs] = useState('1');
  const [addToTripDurationMins, setAddToTripDurationMins] = useState('0');
  const [addToTripCheckInDate, setAddToTripCheckInDate] = useState('');
  const [addToTripCheckInTime, setAddToTripCheckInTime] = useState('15:00');
  const [addToTripCheckOutDate, setAddToTripCheckOutDate] = useState('');
  const [addToTripCheckOutTime, setAddToTripCheckOutTime] = useState('11:00');
  const [addToTripNotes, setAddToTripNotes] = useState('');
  const [addToTripCost, setAddToTripCost] = useState('');
  const [addToTripExternalLink, setAddToTripExternalLink] = useState('');
  const [addToTripTravelDocs, setAddToTripTravelDocs] = useState([]);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeFilterTag, setPlaceFilterTag] = useState('');
  const [placeSortBy, setPlaceSortBy] = useState('Recommended');
  const [addPlacesPage, setAddPlacesPage] = useState(1);
  const [selectedPlaceMarkerId, setSelectedPlaceMarkerId] = useState(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [foodDietaryFilter, setFoodDietaryFilter] = useState('All');
  const [foodSortBy, setFoodSortBy] = useState('Recommended');
  const [staySearchQuery, setStaySearchQuery] = useState('');
  const [stayTypeFilter, setStayTypeFilter] = useState('All');
  const [stayPriceRange, setStayPriceRange] = useState('All');
  const [staySortBy, setStaySortBy] = useState('Recommended');
  const [experienceSearchQuery, setExperienceSearchQuery] = useState('');
  const [experienceTypeFilter, setExperienceTypeFilter] = useState('All');
  const [experiencePriceRange, setExperiencePriceRange] = useState('All');
  const [experienceDurationFilter, setExperienceDurationFilter] = useState('All');
  const [experienceSortBy, setExperienceSortBy] = useState('Recently added');
  const [experienceBookingModalOpen, setExperienceBookingModalOpen] = useState(false);
  const [bookingExperience, setBookingExperience] = useState(null);
  const [bookingOption, setBookingOption] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('07:00');
  const [bookingTravellers, setBookingTravellers] = useState(2);
  const [bookingNotes, setBookingNotes] = useState('');
  const [tripExpenseItems, setTripExpenseItems] = useState([]);
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [customPlaceAddress, setCustomPlaceAddress] = useState('');
  const [customPlaceAddressSelection, setCustomPlaceAddressSelection] = useState(null);
  const [customPlaceAddressSuggestionsOpen, setCustomPlaceAddressSuggestionsOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodAddress, setCustomFoodAddress] = useState('');
  const [customFoodAddressSelection, setCustomFoodAddressSelection] = useState(null);
  const [customFoodAddressSuggestionsOpen, setCustomFoodAddressSuggestionsOpen] = useState(false);
  const [customPlaceDateKey, setCustomPlaceDateKey] = useState('');
  const [customFoodDateKey, setCustomFoodDateKey] = useState('');
  const [customPlaceStartTime, setCustomPlaceStartTime] = useState('07:00');
  const [customFoodStartTime, setCustomFoodStartTime] = useState('07:00');
  const [customPlaceDurationHrs, setCustomPlaceDurationHrs] = useState(1);
  const [customFoodDurationHrs, setCustomFoodDurationHrs] = useState(1);
  const [customPlaceDurationMins, setCustomPlaceDurationMins] = useState(0);
  const [customFoodDurationMins, setCustomFoodDurationMins] = useState(0);
  const [customPlaceNote, setCustomPlaceNote] = useState('');
  const [customFoodNote, setCustomFoodNote] = useState('');
  const [customExperienceName, setCustomExperienceName] = useState('');
  const [customExperienceType, setCustomExperienceType] = useState('Attraction');
  const [customExperienceAddress, setCustomExperienceAddress] = useState('');
  const [customExperienceDateKey, setCustomExperienceDateKey] = useState('');
  const [customExperienceStartTime, setCustomExperienceStartTime] = useState('07:00');
  const [customExperienceDurationHrs, setCustomExperienceDurationHrs] = useState(2);
  const [customExperienceDurationMins, setCustomExperienceDurationMins] = useState(0);
  const [customExperienceNote, setCustomExperienceNote] = useState('');
  const [customExperienceCost, setCustomExperienceCost] = useState('');
  const [customExperienceExternalLink, setCustomExperienceExternalLink] = useState('');
  const [customExperienceTravelDocs, setCustomExperienceTravelDocs] = useState([]);
  const [customPlaceCost, setCustomPlaceCost] = useState('');
  const [customFoodCost, setCustomFoodCost] = useState('');
  const [customPlaceImage, setCustomPlaceImage] = useState(null);
  const [customFoodImage, setCustomFoodImage] = useState(null);
  const [customPlaceTravelDocs, setCustomPlaceTravelDocs] = useState([]);
  const [customFoodTravelDocs, setCustomFoodTravelDocs] = useState([]);
  const [mapDayFilterOpen, setMapDayFilterOpen] = useState(false);
  const [mapDayFilterSelected, setMapDayFilterSelected] = useState([]);
  const [addTransportOpen, setAddTransportOpen] = useState(false);
  const [addTransportDay, setAddTransportDay] = useState(1);
  const [addTransportTab, setAddTransportTab] = useState('Flights');
  const [transferType, setTransferType] = useState('pickup');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferDateKey, setTransferDateKey] = useState('');
  const [transferTime, setTransferTime] = useState('08:00');
  const [transferPax, setTransferPax] = useState(2);
  const [surfaceFrom, setSurfaceFrom] = useState('');
  const [surfaceTo, setSurfaceTo] = useState('');
  const [surfaceFromSuggestionsOpen, setSurfaceFromSuggestionsOpen] = useState(false);
  const [surfaceToSuggestionsOpen, setSurfaceToSuggestionsOpen] = useState(false);
  const [surfaceFromPredictions, setSurfaceFromPredictions] = useState([]);
  const [surfaceToPredictions, setSurfaceToPredictions] = useState([]);
  const [surfaceDate, setSurfaceDate] = useState('');
  const [surfaceTime, setSurfaceTime] = useState('08:00');
  const [surfaceArrivalTime, setSurfaceArrivalTime] = useState('18:00');
  const [surfaceOperator, setSurfaceOperator] = useState('');
  const [surfaceNumber, setSurfaceNumber] = useState('');
  const [surfaceCost, setSurfaceCost] = useState('');
  const [flightCode, setFlightCode] = useState('');
  const [flightDepartDate, setFlightDepartDate] = useState('');
  const [transportHomeCountry, setTransportHomeCountry] = useState(() => user?.country || 'United States');
  const [flightSearchResults, setFlightSearchResults] = useState([]);
  const [flightSearchLoading, setFlightSearchLoading] = useState(false);
  const [flightSearchError, setFlightSearchError] = useState('');
  const [addCustomTransportOpen, setAddCustomTransportOpen] = useState(false);
  const [customTransportVehicle, setCustomTransportVehicle] = useState('Bus');
  const [customTransportFrom, setCustomTransportFrom] = useState('');
  const [customTransportTo, setCustomTransportTo] = useState('');
  const [customTransportAirline, setCustomTransportAirline] = useState('');
  const [customTransportFlightNumber, setCustomTransportFlightNumber] = useState('');
  const [customTransportDepartureDate, setCustomTransportDepartureDate] = useState('');
  const [customTransportDepartureTime, setCustomTransportDepartureTime] = useState('08:00');
  const [customTransportArrivalDate, setCustomTransportArrivalDate] = useState('');
  const [customTransportArrivalTime, setCustomTransportArrivalTime] = useState('18:00');
  const [customTransportConfirmation, setCustomTransportConfirmation] = useState('');
  const [customTransportNote, setCustomTransportNote] = useState('');
  const [customTransportCost, setCustomTransportCost] = useState('');
  const [customTransportExternalLink, setCustomTransportExternalLink] = useState('');
  const [customTransportTravelDocs, setCustomTransportTravelDocs] = useState([]);
  const [customTransportName, setCustomTransportName] = useState('');
  const [customTransportDurationHrs, setCustomTransportDurationHrs] = useState(1);
  const [customTransportDurationMins, setCustomTransportDurationMins] = useState(0);
  const [transportFromSuggestionsOpen, setTransportFromSuggestionsOpen] = useState(false);
  const [transportToSuggestionsOpen, setTransportToSuggestionsOpen] = useState(false);
  const [transportAirlineSuggestionsOpen, setTransportAirlineSuggestionsOpen] = useState(false);
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');
  const [generalAttachments, setGeneralAttachments] = useState([]);
  const [notesActiveTab, setNotesActiveTab] = useState('general');
  const [editPlaceItem, setEditPlaceItem] = useState(null);
  const [pendingDeleteItemId, setPendingDeleteItemId] = useState(null);
  const [whereModalOpen, setWhereModalOpen] = useState(false);
  const [whereQuery, setWhereQuery] = useState('');
  const [whereSuggestionsOpen, setWhereSuggestionsOpen] = useState(false);
  const [whereSelectedLocations, setWhereSelectedLocations] = useState([]);
  const [calendarScrollLeft, setCalendarScrollLeft] = useState(0);
  const [calendarDraggingItemId, setCalendarDraggingItemId] = useState(null);
  const [calendarResizingItemId, setCalendarResizingItemId] = useState(null);
  const [calendarDragOverDayNum, setCalendarDragOverDayNum] = useState(null);
  const whereModalRef = useRef(null);
  const calendarTimelineRef = useRef(null);
  const calendarResizeSessionRef = useRef(null);
  const hydratedTripItemsForIdRef = useRef(null);
  /** Counts expense-item persists per trip; first persist is hydration — skip toast. */
  const expensePersistCountByTripRef = useRef({ tripId: null, count: 0 });
  const titleDropdownRef = useRef(null);
  const titleLastClickRef = useRef(0);
  const [transportModeBySegment, setTransportModeBySegment] = useState({});
  const [openTravelDropdownKey, setOpenTravelDropdownKey] = useState(null);
  const [publicTransportModalOpen, setPublicTransportModalOpen] = useState(false);
  const [publicTransportSegment, setPublicTransportSegment] = useState({ fromName: '', toName: '', fromLat: null, fromLng: null, toLat: null, toLng: null });
  const [publicTransportDirections, setPublicTransportDirections] = useState(null);
  const [publicTransportLoading, setPublicTransportLoading] = useState(false);
  const [travelTimeCache, setTravelTimeCache] = useState({});
  const [openDayMenuKey, setOpenDayMenuKey] = useState(null);
  const [dayColors, setDayColors] = useState({});
  const [dayColorPickerDay, setDayColorPickerDay] = useState(null);
  const [dayColumnWidths, setDayColumnWidths] = useState({});
  const [optimizeRouteModalOpen, setOptimizeRouteModalOpen] = useState(false);
  const [optimizeRouteDay, setOptimizeRouteDay] = useState(null);
  const [optimizeRouteStartId, setOptimizeRouteStartId] = useState('');
  const [optimizeRouteEndId, setOptimizeRouteEndId] = useState('');
  const [optimizationsLeft, setOptimizationsLeft] = useState(3);
  const [discoveryData, setDiscoveryData] = useState({
    places: [],
    foods: [],
    stays: [],
    experiences: [],
    communityItineraries: [],
    center: null,
    warning: '',
    cached: false,
    stale: false,
  });
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [inAppNotice, setInAppNotice] = useState(null);
  const dayResizeSessionRef = useRef(null);
  const inAppNoticeTimerRef = useRef(null);

  useEffect(() => () => {
    if (inAppNoticeTimerRef.current) {
      clearTimeout(inAppNoticeTimerRef.current);
    }
  }, []);

  const showInAppNotice = (message, type = 'info', durationMs = 3200) => {
    if (!message) return;
    if (inAppNoticeTimerRef.current) {
      clearTimeout(inAppNoticeTimerRef.current);
    }
    setInAppNotice({
      id: Date.now(),
      message,
      type,
    });
    inAppNoticeTimerRef.current = setTimeout(() => {
      setInAppNotice(null);
      inAppNoticeTimerRef.current = null;
    }, durationMs);
  };

  const handleCalendarDragStart = (e, itemId) => {
    setCalendarDraggingItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(itemId));
  };

  const handleCalendarDragEnd = () => {
    setCalendarDraggingItemId(null);
    setCalendarDragOverDayNum(null);
  };

  const handleCalendarDayDragOver = (e, dayNum) => {
    if (!calendarDraggingItemId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setCalendarDragOverDayNum(dayNum);
  };

  const handleCalendarDayDrop = (e, day) => {
    const dragId = calendarDraggingItemId || e.dataTransfer.getData('text/plain');
    if (!dragId) return;

    e.preventDefault();
    const startTime = getCalendarDropStartTime(e.clientY, e.currentTarget.getBoundingClientRect());
    setTripExpenseItems((prev) => prev.map((it) => (
      String(it.id) === String(dragId)
        ? { ...it, date: day.date, startTime }
        : it
    )));

    setCalendarDraggingItemId(null);
    setCalendarDragOverDayNum(null);
  };

  const handleCalendarResizeStart = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const startDuration = Math.max(
      CALENDAR_DRAG_SNAP_MINS,
      (Number(item.durationHrs ?? 0) * 60) + Number(item.durationMins ?? 0),
    );
    calendarResizeSessionRef.current = {
      itemId: item.id,
      startClientY: e.clientY,
      startDuration,
      startMinutes: timeToMinutes(item.startTime || '00:00'),
    };
    setCalendarResizingItemId(item.id);

    const onMouseMove = (moveEvent) => {
      const session = calendarResizeSessionRef.current;
      if (!session) return;
      const deltaRaw = ((moveEvent.clientY - session.startClientY) / CALENDAR_ROW_HEIGHT) * 60;
      const snappedDelta = Math.round(deltaRaw / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS;
      const maxDuration = Math.max(
        CALENDAR_DRAG_SNAP_MINS,
        (24 * 60) - session.startMinutes,
      );
      const nextDuration = clamp(
        session.startDuration + snappedDelta,
        CALENDAR_DRAG_SNAP_MINS,
        maxDuration,
      );
      const { durationHrs, durationMins } = durationMinutesToParts(nextDuration);
      setTripExpenseItems((prev) => prev.map((it) => (
        String(it.id) === String(session.itemId)
          ? { ...it, durationHrs, durationMins }
          : it
      )));
    };

    const onMouseUp = () => {
      calendarResizeSessionRef.current = null;
      setCalendarResizingItemId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    if (!whereModalOpen) return;
    function handleClickOutside(e) {
      if (whereModalRef.current && !whereModalRef.current.contains(e.target)) {
        setWhereSuggestionsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [whereModalOpen]);

  useEffect(() => {
    if (openDayMenuKey == null) return;
    function handleClickOutside(e) {
      if (e.target.closest('[data-day-menu]') == null) {
        setOpenDayMenuKey(null);
        setDayColorPickerDay(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDayMenuKey]);

  useEffect(() => {
    const targetDestination = extractPrimaryDestination(trip?.destination || trip?.locations);
    if (!targetDestination) return;

    let cancelled = false;
    const run = async () => {
      setDiscoveryLoading(true);
      setDiscoveryError('');
      try {
        const data = await fetchDiscoveryData(targetDestination, 50);
        if (!cancelled) {
          setDiscoveryData({
            places: Array.isArray(data?.places) ? data.places : [],
            foods: Array.isArray(data?.foods) ? data.foods : [],
            stays: Array.isArray(data?.stays) ? data.stays : [],
            experiences: Array.isArray(data?.experiences) ? data.experiences : [],
            communityItineraries: Array.isArray(data?.communityItineraries) ? data.communityItineraries : [],
            center: Array.isArray(data?.center) ? data.center : null,
            warning: data?.warning || '',
            cached: Boolean(data?.cached),
            stale: Boolean(data?.stale),
          });
        }
      } catch (err) {
        if (!cancelled) {
          setDiscoveryError(err?.message || 'Failed to load destination data');
          setDiscoveryData({
            places: [],
            stays: [],
            foods: [],
            experiences: [],
            communityItineraries: [],
            center: getMapCenterForDestination(targetDestination),
            warning: 'Could not connect to the discovery service. Please check that the backend is running and try again.',
            cached: false,
            stale: true,
          });
        }
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [trip?.destination, trip?.locations]);

  useEffect(() => {
    if (trip) {
      const d = getTripDaysFromTrip(trip);
      setTitleDisplay(trip.title ?? `${d.length} days to ${trip.destination}`);
    }
  }, [tripId, trip?.destination, locationUpdateKey, trip]);

  useEffect(() => {
    if (!titleDropdownOpen) return;
    function handleClickOutside(e) {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target)) {
        setTitleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [titleDropdownOpen]);

  useEffect(() => {
    if (!tripData) return;
    const persistedItems = Array.isArray(tripData?.tripExpenseItems)
      ? tripData.tripExpenseItems.map((item) => ({
        ...item,
        attachments: Array.isArray(item?.attachments) ? item.attachments : [],
      }))
      : [];

    setTripExpenseItems(persistedItems);
    hydratedTripItemsForIdRef.current = tripId;
  }, [tripId, tripData]);

  useEffect(() => {
    if (tripLoading || !tripData) return;
    if (hydratedTripItemsForIdRef.current !== tripId) return;
    const meta = expensePersistCountByTripRef.current;
    if (meta.tripId !== tripId) {
      expensePersistCountByTripRef.current = { tripId, count: 0 };
    }
    let cancelled = false;
    (async () => {
      try {
        await updateItinerary(tripId, { tripExpenseItems });
        if (cancelled) return;
        const m = expensePersistCountByTripRef.current;
        if (m.tripId !== tripId) return;
        m.count += 1;
        if (m.count > 1) {
          toast.success('Changes saved', { id: 'trip-details-saved' });
        }
      } catch (e) {
        if (!cancelled) console.error('Failed to save trip items', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, tripExpenseItems, tripLoading, tripData]);

  // Fetch transit directions when public transport modal opens
  useEffect(() => {
    if (!publicTransportModalOpen || !publicTransportSegment.fromLat || !publicTransportSegment.toLat) {
      return;
    }
    
    const fetchTransitDirections = () => {
      setPublicTransportLoading(true);
      setPublicTransportDirections(null);
      
      // Wait for Google Maps SDK to load
      const waitForGoogleMaps = (callback, maxAttempts = 20) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts++;
          if (window.google && window.google.maps && window.google.maps.DirectionsService) {
            clearInterval(checkInterval);
            callback();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Google Maps SDK failed to load after', attempts, 'attempts');
            setPublicTransportLoading(false);
          }
        }, 200);
      };
      
      waitForGoogleMaps(() => {
        try {
          const service = new google.maps.DirectionsService();
          const origin = new google.maps.LatLng(publicTransportSegment.fromLat, publicTransportSegment.fromLng);
          const destination = new google.maps.LatLng(publicTransportSegment.toLat, publicTransportSegment.toLng);
          
          console.log('Requesting transit directions from', publicTransportSegment.fromLat, publicTransportSegment.fromLng, 'to', publicTransportSegment.toLat, publicTransportSegment.toLng);
          
          // Set departure time to now (required for transit to work properly)
          const departureTime = new Date();
          departureTime.setMinutes(departureTime.getMinutes() + 5); // 5 minutes from now
          
          service.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.TRANSIT,
            transitOptions: {
              departureTime: departureTime,
              modes: [google.maps.TransitMode.BUS, google.maps.TransitMode.RAIL, google.maps.TransitMode.SUBWAY, google.maps.TransitMode.TRAIN, google.maps.TransitMode.TRAM],
              routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
            },
            provideRouteAlternatives: false,
          }, (result, status) => {
            console.log('Transit directions response:', status, result);
            
            if (status === 'OK' && result?.routes?.[0]) {
              const route = result.routes[0];
              const steps = route.legs?.[0]?.steps || [];
              const hasTransit = steps.some(step => step.travel_mode === 'TRANSIT');
              
              console.log('Transit route found:', route);
              console.log('Steps:', steps.map(s => ({ mode: s.travel_mode, duration: s.duration?.text })));
              console.log('Has transit steps:', hasTransit);
              
              if (hasTransit) {
                setPublicTransportDirections(route);
              } else {
                console.warn('Route returned only walking steps - no transit available');
                setPublicTransportDirections(null);
              }
            } else if (status === 'ZERO_RESULTS') {
              console.log('No transit routes available between these locations');
              setPublicTransportDirections(null);
            } else {
              console.error('Transit directions error:', status, result);
              setPublicTransportDirections(null);
            }
            setPublicTransportLoading(false);
          });
        } catch (error) {
          console.error('Error fetching transit directions:', error);
          setPublicTransportLoading(false);
        }
      });
    };
    
    fetchTransitDirections();
  }, [publicTransportModalOpen, publicTransportSegment]);

  const displayTrip = useMemo(() => {
    if (!trip) return null;
    const start = dateRange?.startDate ?? trip.startDate;
    const end = dateRange?.endDate ?? trip.endDate;
    return { ...trip, startDate: start, endDate: end };
  }, [trip, dateRange?.startDate, dateRange?.endDate]);

  const days = trip ? getTripDaysFromTrip(displayTrip ?? trip) : [];
  const spent = trip?.budgetSpent ?? 0;

  const displayStart = trip ? (dateRange?.startDate ?? trip.startDate) : undefined;
  const displayEnd = trip ? (dateRange?.endDate ?? trip.endDate) : undefined;
  const allDayNums = days.map((d) => d.dayNum);
  const activeDayNums = (mapDayFilterSelected.length ? mapDayFilterSelected : allDayNums).filter((n) =>
    allDayNums.includes(n),
  );
  const displayDatesLabel = displayStart && displayEnd
    ? (() => {
      const s = new Date(displayStart);
      const e = new Date(displayEnd);
      return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}`;
    })()
    : (trip?.dates ?? '');

  const openDateModal = () => setDateModalOpen(true);

  const searchFlights = async () => {
    if (!flightCode || !flightDepartDate) {
      setFlightSearchError('Please enter both flight code and departure date');
      return;
    }

    setFlightSearchLoading(true);
    setFlightSearchError('');
    setFlightSearchResults([]);

    try {
      // Parse flight code (e.g., UA1, AA100, SQ-322)
      const match = flightCode.trim().toUpperCase().match(/^([A-Z0-9]{2,3})[-\s]?(\d{1,4})$/);
      if (!match) {
        throw new Error('Invalid flight code format. Example: UA1, AA100, SQ322');
      }

      const [, airlineCode, flightNumber] = match;
      const normalizedCode = `${airlineCode}${flightNumber}`;
      const homeCountry = String(transportHomeCountry || '').trim();
      const targetCountry = String(destinationCountry || '').trim();

      if (!homeCountry || !targetCountry) {
        throw new Error('Unable to determine home/destination country for route filtering.');
      }

      const routeCountries = new Set([homeCountry, targetCountry]);
      const airportByCode = new Map(
        AIRPORTS_AND_CITIES
          .filter((item) => item.type === 'Airport')
          .map((item) => [String(item.id || '').toUpperCase(), item]),
      );
      const apiKey = import.meta.env.VITE_AIRLABS_API_KEY || '';

      if (apiKey) {
        try {
          // Airlabs sometimes omits timing fields in /flights, but /flight usually includes full schedule details.
          // Try /flight first for one detailed match, then fallback to /flights.
          let apiFlights = [];

          const detailedResponse = await fetch(
            `https://airlabs.co/api/v9/flight?api_key=${apiKey}&flight_iata=${normalizedCode}`,
          );
          if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            if (detailedData?.response && !Array.isArray(detailedData.response)) {
              apiFlights = [detailedData.response];
            }
          }

          if (apiFlights.length === 0) {
            const listResponse = await fetch(
              `https://airlabs.co/api/v9/flights?api_key=${apiKey}&flight_iata=${normalizedCode}`,
            );
            if (!listResponse.ok) {
              throw new Error(`Flight provider error (${listResponse.status})`);
            }
            const listData = await listResponse.json();
            apiFlights = Array.isArray(listData?.response) ? listData.response : [];
          }
          
          if (apiFlights.length > 0) {
            const flights = apiFlights
              .map((flight) => {
                const iataCode = flight.flight_iata || normalizedCode;
                const depAirport = airportByCode.get(String(flight.dep_iata || '').toUpperCase());
                const arrAirport = airportByCode.get(String(flight.arr_iata || '').toUpperCase());
                
                // Normalize provider values; Airlabs can return strings, unix timestamps, or alternate field names.
                const toIsoLike = (value) => {
                  if (value == null || value === '') return '';
                  if (typeof value === 'number') {
                    const ms = value < 1e12 ? value * 1000 : value;
                    return new Date(ms).toISOString();
                  }
                  const raw = String(value).trim();
                  if (!raw) return '';
                  if (/^\d+$/.test(raw)) {
                    const num = Number(raw);
                    const ms = num < 1e12 ? num * 1000 : num;
                    return new Date(ms).toISOString();
                  }
                  if (raw.includes('T')) return raw;
                  return raw.replace(' ', 'T');
                };

                const toHHmm = (value) => {
                  const isoLike = toIsoLike(value);
                  if (!isoLike) return '';
                  const match = isoLike.match(/T(\d{2}):(\d{2})/);
                  if (match) return `${match[1]}:${match[2]}`;
                  const fallback = isoLike.match(/(\d{2}):(\d{2})/);
                  return fallback ? `${fallback[1]}:${fallback[2]}` : '';
                };

                // Prefer local fields for display, then fallback to UTC/schedule/actual/estimated variants.
                const depDisplaySource =
                  flight.dep_time ||
                  flight.dep_estimated ||
                  flight.dep_scheduled ||
                  flight.dep_actual ||
                  flight.dep_estimated_utc ||
                  flight.dep_actual_utc ||
                  flight.dep_time_utc ||
                  flight.departure_time ||
                  flight.departure_scheduled ||
                  flight.departure_estimated ||
                  flight.departure_actual ||
                  flight.updated ||
                  flight.dep_time_ts ||
                  '';
                const arrDisplaySource =
                  flight.arr_time ||
                  flight.arr_estimated ||
                  flight.arr_scheduled ||
                  flight.arr_actual ||
                  flight.arr_estimated_utc ||
                  flight.arr_actual_utc ||
                  flight.arr_time_utc ||
                  flight.arrival_time ||
                  flight.arrival_scheduled ||
                  flight.arrival_estimated ||
                  flight.arrival_actual ||
                  flight.arr_time_ts ||
                  '';

                const depTimeLocal = toHHmm(depDisplaySource);
                const arrTimeLocal = toHHmm(arrDisplaySource);

                // Prefer UTC fields for duration math to avoid timezone ambiguity.
                let durationMinutes = 0;
                const depUtcSource = flight.dep_time_utc || flight.dep_estimated_utc || flight.dep_actual_utc || flight.dep_time_ts || depDisplaySource;
                const arrUtcSource = flight.arr_time_utc || flight.arr_estimated_utc || flight.arr_actual_utc || flight.arr_time_ts || arrDisplaySource;
                const depIso = toIsoLike(depUtcSource);
                const arrIso = toIsoLike(arrUtcSource);
                if (depIso && arrIso) {
                  const depDate = new Date(depIso);
                  const arrDate = new Date(arrIso);
                  const diff = Math.round((arrDate.getTime() - depDate.getTime()) / (1000 * 60));
                  durationMinutes = Number.isFinite(diff) && diff > 0 ? diff : 0;
                }
                
                return {
                  id: `${iataCode}-${depIso || depTimeLocal || Date.now()}`,
                  flight_code: iataCode,
                  airline: flight.airline_name || `${flight.airline_iata || airlineCode} Airlines`,
                  airline_code: flight.airline_iata || airlineCode,
                  flight_number: String(flight.flight_number || flightNumber),
                  departure_airport: flight.dep_iata || 'N/A',
                  departure_city: depAirport?.city || flight.dep_city || flight.dep_name || flight.dep_iata || 'N/A',
                  arrival_airport: flight.arr_iata || 'N/A',
                  arrival_city: arrAirport?.city || flight.arr_city || flight.arr_name || flight.arr_iata || 'N/A',
                  departure_time: depTimeLocal || '--:--',
                  arrival_time: arrTimeLocal || '--:--',
                  flight_date: flightDepartDate,
                  status: (flight.status || 'scheduled').toLowerCase(),
                  aircraft: flight.aircraft_icao || flight.model || 'N/A',
                  terminal: flight.dep_terminal || 'N/A',
                  gate: flight.dep_gate || 'N/A',
                  durationMinutes,
                };
              })
              .filter((f) => {
                if (!String(f.flight_code || '').toUpperCase().includes(normalizedCode)) return false;
                const depCountry = airportByCode.get(String(f.departure_airport || '').toUpperCase())?.country || '';
                const arrCountry = airportByCode.get(String(f.arrival_airport || '').toUpperCase())?.country || '';
                
                // If we can't determine countries, include the flight anyway
                if (!depCountry || !arrCountry) return true;
                
                const pair = new Set([depCountry, arrCountry]);
                return pair.size === routeCountries.size && [...pair].every((c) => routeCountries.has(c));
              });

            if (flights.length > 0) {
              setFlightSearchResults(flights);
              setFlightSearchLoading(false);
              return;
            }
          }
        } catch (providerError) {
          console.warn('Flight API unavailable, using fallback results:', providerError?.message || providerError);
        }
      }

      const airline = AIRLINES.find((a) => a.id === airlineCode) || { name: `${airlineCode} Airlines` };
      const airportsByCountry = AIRPORTS_AND_CITIES.filter((a) => a.type === 'Airport').reduce((acc, item) => {
        const key = String(item.country || '');
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      const homeAirports = airportsByCountry[homeCountry] || [];
      const destinationAirports = airportsByCountry[targetCountry] || [];

      if (homeAirports.length === 0 || destinationAirports.length === 0) {
        throw new Error('No airports available for selected home/destination country pair.');
      }

      const seed = `${normalizedCode}${flightDepartDate}${homeCountry}${targetCountry}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const pick = (arr, idx) => arr[idx % arr.length];
      const outboundFrom = pick(homeAirports, seed + 1);
      const outboundTo = pick(destinationAirports, seed + 2);
      const inboundFrom = pick(destinationAirports, seed + 3);
      const inboundTo = pick(homeAirports, seed + 4);
      const routeDurationMins = 360 + (seed % 420);
      const baseDate = new Date(`${flightDepartDate}T00:00:00`);
      const departureA = new Date(baseDate);
      departureA.setHours(8 + (seed % 6), 15, 0, 0);
      const arrivalA = new Date(departureA.getTime() + routeDurationMins * 60000);
      const departureB = new Date(baseDate);
      departureB.setHours(13 + (seed % 5), 50, 0, 0);
      const arrivalB = new Date(departureB.getTime() + (routeDurationMins + 35) * 60000);

      const fallbackFlights = [
        {
          id: `${normalizedCode}-a`,
          flight_code: normalizedCode,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: outboundFrom.id,
          departure_city: outboundFrom.city,
          arrival_airport: outboundTo.id,
          arrival_city: outboundTo.city,
          departure_time: `${String(departureA.getHours()).padStart(2, '0')}:${String(departureA.getMinutes()).padStart(2, '0')}`,
          arrival_time: `${String(arrivalA.getHours()).padStart(2, '0')}:${String(arrivalA.getMinutes()).padStart(2, '0')}`,
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Boeing 787-9',
          terminal: '1',
          gate: `A${10 + (seed % 20)}`,
          durationMinutes: routeDurationMins,
        },
        {
          id: `${normalizedCode}-b`,
          flight_code: normalizedCode,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: inboundFrom.id,
          departure_city: inboundFrom.city,
          arrival_airport: inboundTo.id,
          arrival_city: inboundTo.city,
          departure_time: `${String(departureB.getHours()).padStart(2, '0')}:${String(departureB.getMinutes()).padStart(2, '0')}`,
          arrival_time: `${String(arrivalB.getHours()).padStart(2, '0')}:${String(arrivalB.getMinutes()).padStart(2, '0')}`,
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Airbus A350-900',
          terminal: '2',
          gate: `B${11 + (seed % 18)}`,
          durationMinutes: routeDurationMins + 35,
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 400));
      setFlightSearchResults(fallbackFlights);
    } catch (error) {
      console.error('Flight search error:', error);
      setFlightSearchError(error.message || 'Failed to search flights. Please try again.');
    } finally {
      setFlightSearchLoading(false);
    }
  };

  const applyDateRange = (start, end) => {
    if (start && end && start <= end) {
      setDateRange({ startDate: start, endDate: end });
    }
  };

  const setDayTitle = (dayNum, value) => {
    setDayTitles((prev) => ({ ...prev, [dayNum]: value }));
  };

  const visibleDays = useMemo(() => {
    if (!days || days.length === 0) return [];
    if (mapView === 'Expand half') {
      return days.slice(0, 2);
    }
    if (mapView === 'Expand full') {
      return days.slice(0, 1);
    }
    return days;
  }, [days, mapView]);

  const toggleMapDay = (dayNum) => {
    setMapDayFilterSelected((prev) => {
      const base = prev.length ? prev : allDayNums;
      if (base.includes(dayNum)) {
        return base.filter((n) => n !== dayNum);
      }
      const next = [...base, dayNum].sort((a, b) => a - b);
      return next;
    });
  };

  const resetMapDays = () => {
    setMapDayFilterSelected(allDayNums);
  };

  const getDayColumnWidth = (dayNum) => Number(dayColumnWidths[dayNum] || DAY_COLUMN_DEFAULT_WIDTH);

  const getResizeClientX = (evt) => {
    if (evt?.touches?.[0]?.clientX != null) return Number(evt.touches[0].clientX);
    if (evt?.changedTouches?.[0]?.clientX != null) return Number(evt.changedTouches[0].clientX);
    return Number(evt?.clientX || 0);
  };

  const beginDayColumnResize = (dayNum, event) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = getResizeClientX(event);
    const startWidth = getDayColumnWidth(dayNum);
    dayResizeSessionRef.current = { dayNum, startX, startWidth };
    document.body.classList.add('trip-details--day-resizing');

    const handleResizeMove = (moveEvent) => {
      const session = dayResizeSessionRef.current;
      if (!session) return;
      const deltaX = getResizeClientX(moveEvent) - session.startX;
      const nextWidth = Math.max(DAY_COLUMN_MIN_WIDTH, Math.min(DAY_COLUMN_MAX_WIDTH, session.startWidth + deltaX));
      setDayColumnWidths((prev) => ({ ...prev, [session.dayNum]: nextWidth }));
    };

    const handleResizeEnd = () => {
      dayResizeSessionRef.current = null;
      document.body.classList.remove('trip-details--day-resizing');
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, { passive: false });
    window.addEventListener('touchend', handleResizeEnd, { passive: false });
  };

  const appendTransportTripItem = ({
    id,
    name,
    date,
    detail,
    startTime = '',
    durationHrs = 0,
    durationMins = 0,
    notes = '',
    total = 0,
    Icon = Car,
    transportType = 'transport',
  }) => {
    setTripExpenseItems((prev) => [...prev, {
      id: id || `transport-${Date.now()}`,
      name,
      total: Number(total) || 0,
      categoryId: 'transportations',
      category: 'Transportations',
      date: date || days[0]?.date,
      detail,
      startTime,
      durationHrs,
      durationMins,
      Icon,
      notes,
      attachments: [],
      externalLink: '',
      transportType,
    }]);
  };

  const cityQuery = useMemo(
    () => extractPrimaryDestination(trip?.destination || trip?.locations),
    [trip?.destination, trip?.locations],
  );

  const destinationCountry = useMemo(() => {
    const byCity = AIRPORTS_AND_CITIES.find(
      (item) => String(item.city || '').toLowerCase() === String(cityQuery || '').toLowerCase() && item.country,
    );
    if (byCity?.country) return byCity.country;

    const byName = AIRPORTS_AND_CITIES.find(
      (item) => String(item.name || '').toLowerCase().includes(String(cityQuery || '').toLowerCase()) && item.country,
    );
    if (byName?.country) return byName.country;

    return '';
  }, [cityQuery]);

  const availableTransportCountries = useMemo(() => (
    [...new Set(AIRPORTS_AND_CITIES.map((a) => a.country).filter(Boolean))].sort((a, b) => a.localeCompare(b))
  ), []);

  const filteredPlaces = useMemo(() => {
    const deriveSemanticTags = (place) => {
      const rawTags = place?.tags;
      if (Array.isArray(rawTags) && rawTags.length > 0) {
        return rawTags.map((tag) => String(tag));
      }
      if (typeof rawTags === 'string' && rawTags.trim()) {
        return [rawTags.trim()];
      }
      // Return type if no tags available
      return place?.type ? [place.type] : [];
    };

    const scorePlaceRecommendation = (place) => {
      let score = 0;
      score += Number(place?.recommendedScore || 0);
      score += Number(place?.rating || 0) * 8;
      score += Math.log10(Number(place?.reviewCount || 0) + 1) * 5;
      return score;
    };

    const source = Array.isArray(discoveryData?.places)
      ? discoveryData.places.map((place) => ({
        ...place,
        tags: deriveSemanticTags(place),
      }))
      : [];
    let results = source;
    if (placeSearchQuery.trim()) {
      const q = placeSearchQuery.trim().toLowerCase();
      results = results.filter((p) =>
        (p.name || '').toLowerCase().includes(q)
        || (p.address || '').toLowerCase().includes(q)
        || (p.description || '').toLowerCase().includes(q),
      );
    }
    if (placeSortBy === 'Rating: Low to High') {
      results = [...results].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (placeSortBy === 'Rating: High to Low') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      results = [...results].sort((a, b) => scorePlaceRecommendation(b) - scorePlaceRecommendation(a));
    }
    return results;
  }, [discoveryData?.places, placeSearchQuery, placeSortBy]);

  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const addPlacesTotalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredPlaces.length / ADD_PLACES_PAGE_SIZE)),
    [filteredPlaces.length],
  );

  const pagedPlaces = useMemo(() => {
    const start = (addPlacesPage - 1) * ADD_PLACES_PAGE_SIZE;
    return filteredPlaces.slice(start, start + ADD_PLACES_PAGE_SIZE);
  }, [filteredPlaces, addPlacesPage]);

  useEffect(() => {
    setAddPlacesPage(1);
  }, [placeSearchQuery, placeSortBy]);

  useEffect(() => {
    if (addPlacesPage > addPlacesTotalPages) {
      setAddPlacesPage(addPlacesTotalPages);
    }
  }, [addPlacesPage, addPlacesTotalPages]);

  const filteredFoods = useMemo(() => {
    const source = (Array.isArray(discoveryData?.foods) ? discoveryData.foods : [])
      .map((food) => enrichFoodDetails(food, cityQuery));
    let results = source;
    if (foodSearchQuery.trim()) {
      const q = foodSearchQuery.trim().toLowerCase();
      results = results.filter((f) =>
        (f.name || '').toLowerCase().includes(q)
        || (f.address || '').toLowerCase().includes(q)
        || (f.cuisine || '').toLowerCase().includes(q),
      );
    }
    if (foodDietaryFilter && foodDietaryFilter !== 'All') {
      const selected = String(foodDietaryFilter).toLowerCase();
      results = results.filter((f) => {
        const tags = Array.isArray(f.dietaryTags) ? f.dietaryTags.map((d) => String(d).toLowerCase()) : [];
        const amenity = String(f.amenityType || f.type || '').toLowerCase();
        const price = String(f.priceLevel || '').trim();
        const rating = Number(f.rating || 0);
        const opening = String(f.openingHoursRaw || '').toLowerCase();

        if (selected === 'top rated (4.5+)') return rating >= 4.5;
        if (selected === 'budget ($-$$)') return price === '$' || price === '$$' || Number(f.priceLevel) <= 2;
        if (selected === 'cafe') return amenity.includes('cafe') || tags.some((t) => t.includes('cafe'));
        if (selected === 'late night') {
          return tags.some((t) => t.includes('late night'))
            || opening.includes('24')
            || opening.includes('late');
        }
        if (selected === 'vegetarian / vegan') {
          return tags.some((t) => t.includes('vegetarian') || t.includes('vegan'));
        }
        if (selected === 'muslim-friendly') {
          return tags.some((t) => t.includes('muslim'));
        }
        return true;
      });
    }
    if (foodSortBy === 'Rating') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (foodSortBy === 'Most reviewed') {
      results = [...results].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    }
    return results;
  }, [discoveryData?.foods, foodSearchQuery, foodDietaryFilter, foodSortBy, cityQuery]);

  const filteredExperiences = useMemo(() => {
    const source = Array.isArray(discoveryData?.experiences) ? discoveryData.experiences : [];
    let results = source;
    if (experienceSearchQuery.trim()) {
      const q = experienceSearchQuery.trim().toLowerCase();
      results = results.filter((e) =>
        (e.name || '').toLowerCase().includes(q)
        || (e.description || '').toLowerCase().includes(q)
        || (e.type || '').toLowerCase().includes(q),
      );
    }
    if (experienceTypeFilter && experienceTypeFilter !== 'All') {
      const type = experienceTypeFilter.toLowerCase();
      results = results.filter((e) => (e.type || '').toLowerCase().includes(type));
    }
    if (experiencePriceRange && experiencePriceRange !== 'All') {
      const normalizedPriceFilter = String(experiencePriceRange).toLowerCase();
      results = results.filter((e) => {
        const price = Number(e.price || 0);
        if (normalizedPriceFilter.includes('0') && normalizedPriceFilter.includes('50')) return price < 50;
        if (normalizedPriceFilter.includes('50') && normalizedPriceFilter.includes('100')) return price >= 50 && price < 100;
        if (normalizedPriceFilter.includes('100') && normalizedPriceFilter.includes('200')) return price >= 100 && price < 200;
        if (normalizedPriceFilter.includes('200+')) return price >= 200;
        return true;
      });
    }
    if (experienceDurationFilter && experienceDurationFilter !== 'All') {
      const normalizedDurationFilter = String(experienceDurationFilter).toLowerCase();
      results = results.filter((e) => {
        const hrs = Number(e.durationHours || 0);
        if (normalizedDurationFilter.includes('under 4') || normalizedDurationFilter.includes('less than 4')) return hrs < 4;
        if (normalizedDurationFilter.includes('4-8')) return hrs >= 4 && hrs <= 8;
        if (normalizedDurationFilter.includes('8-12')) return hrs > 8 && hrs <= 12;
        if (normalizedDurationFilter.includes('12+') || normalizedDurationFilter.includes('full day')) return hrs > 12;
        return true;
      });
    }
    if (experienceSortBy === 'Price: Low to High') {
      results = [...results].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (experienceSortBy === 'Price: High to Low') {
      results = [...results].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (experienceSortBy === 'Highest Rated' || experienceSortBy === 'Rating') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (experienceSortBy === 'Most reviewed') {
      results = [...results].sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
    } else if (experienceSortBy === 'Duration') {
      results = [...results].sort((a, b) => (a.durationHours || 0) - (b.durationHours || 0));
    }
    return results;
  }, [discoveryData?.experiences, experienceSearchQuery, experienceTypeFilter, experiencePriceRange, experienceDurationFilter, experienceSortBy]);

  const filteredStays = useMemo(() => {
    const source = Array.isArray(discoveryData?.stays) ? discoveryData.stays : [];
    let results = source;
    
    if (staySearchQuery.trim()) {
      const q = staySearchQuery.trim().toLowerCase();
      results = results.filter((s) =>
        (s.name || '').toLowerCase().includes(q)
        || (s.address || '').toLowerCase().includes(q)
        || (s.type || '').toLowerCase().includes(q),
      );
    }
    
    if (stayTypeFilter !== 'All') {
      const selectedType = String(stayTypeFilter).toLowerCase();
      results = results.filter((s) => {
        const stayType = String(s.type || '').toLowerCase();
        return stayType === selectedType || stayType.includes(selectedType);
      });
    }
    
    if (stayPriceRange !== 'All') {
      results = results.filter((s) => {
        const price = Number(s.pricePerNight || 0);
        if (stayPriceRange === '400+') return price >= 400;
        const [minRaw, maxRaw] = stayPriceRange.split('-').map(Number);
        const min = Number.isFinite(minRaw) ? minRaw : 0;
        const max = Number.isFinite(maxRaw) ? maxRaw : Number.POSITIVE_INFINITY;
        return price >= min && price <= max;
      });
    }
    
    if (staySortBy === 'Price: Low to High') {
      results = [...results].sort((a, b) => (a.pricePerNight || 0) - (b.pricePerNight || 0));
    } else if (staySortBy === 'Price: High to Low') {
      results = [...results].sort((a, b) => (b.pricePerNight || 0) - (a.pricePerNight || 0));
    } else if (staySortBy === 'Rating: High to Low') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else {
      // Recommended
      results = [...results].sort((a, b) => {
        const scoreA = (a.rating || 0) * 10 + Math.log10((a.reviewCount || 0) + 1) * 5;
        const scoreB = (b.rating || 0) * 10 + Math.log10((b.reviewCount || 0) + 1) * 5;
        return scoreB - scoreA;
      });
    }
    
    return results;
  }, [discoveryData?.stays, staySearchQuery, stayTypeFilter, stayPriceRange, staySortBy]);

  const stayTypeOptions = useMemo(() => {
    const source = Array.isArray(discoveryData?.stays) ? discoveryData.stays : [];
    const normalized = source
      .map((stay) => String(stay?.type || '').trim())
      .filter(Boolean);
    const deduped = [...new Set(normalized)].sort((a, b) => a.localeCompare(b));
    if (deduped.length > 0) return ['All', ...deduped];
    return ['All', 'Hotel', 'Resort', 'Motel', 'Guesthouse', 'Extended Stay', 'Accommodation'];
  }, [discoveryData?.stays]);

  const routeIdeas = useMemo(() => {
    const placePool = Array.isArray(discoveryData?.places) && discoveryData.places.length > 0
      ? discoveryData.places
      : filteredPlaces;
    if (!Array.isArray(placePool) || placePool.length === 0) return [];

    const normalizedPlaces = placePool
      .filter((place) => place && place.lat != null && place.lng != null)
      .map((place, index) => {
        const rating = Number(place.rating || 0);
        const reviewCount = Number(place.reviewCount || 0);
        const score = rating * 100 + Math.log10(reviewCount + 1) * 50;
        return {
          ...place,
          _idx: index,
          _score: score,
          _rating: rating,
          _reviewCount: reviewCount,
        };
      });

    if (normalizedPlaces.length === 0) return [];

    const rankedPlaces = [...normalizedPlaces].sort((a, b) => {
      if (b._score !== a._score) return b._score - a._score;
      return (b._rating || 0) - (a._rating || 0);
    });

    const CLUSTER_DISTANCE_KM = 2;
    const clusters = [];
    rankedPlaces.forEach((place) => {
      let bestClusterIdx = -1;
      let bestDistance = Number.POSITIVE_INFINITY;

      for (let i = 0; i < clusters.length; i += 1) {
        const cluster = clusters[i];
        const dist = distanceBetween(place, { lat: cluster.centerLat, lng: cluster.centerLng });
        if (dist <= CLUSTER_DISTANCE_KM && dist < bestDistance) {
          bestDistance = dist;
          bestClusterIdx = i;
        }
      }

      if (bestClusterIdx >= 0) {
        const cluster = clusters[bestClusterIdx];
        cluster.members.push(place);
        cluster.totalScore += place._score;
        cluster.centerLat = cluster.members.reduce((sum, p) => sum + Number(p.lat || 0), 0) / cluster.members.length;
        cluster.centerLng = cluster.members.reduce((sum, p) => sum + Number(p.lng || 0), 0) / cluster.members.length;
      } else {
        clusters.push({
          id: `cluster-${clusters.length + 1}`,
          centerLat: Number(place.lat || 0),
          centerLng: Number(place.lng || 0),
          totalScore: place._score,
          members: [place],
        });
      }
    });

    const rankedClusters = clusters
      .map((cluster) => ({
        ...cluster,
        members: [...cluster.members].sort((a, b) => b._score - a._score),
      }))
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
        return b.members.length - a.members.length;
      });

    const tripDayCount = Math.max(1, Number(days?.length || 0) || 3);
    const maxFeasibleDays = Math.max(1, Math.floor(rankedPlaces.length / 3));
    const dayCount = Math.max(1, Math.min(tripDayCount, maxFeasibleDays, 7));

    const dayBuckets = Array.from({ length: dayCount }, (_, idx) => ({
      dayNum: idx + 1,
      title: `Day ${idx + 1}`,
      places: [],
      clusterIds: [],
    }));

    rankedClusters.forEach((cluster, idx) => {
      const bucket = dayBuckets[idx % dayBuckets.length];
      bucket.clusterIds.push(cluster.id);
      bucket.places.push(...cluster.members);
    });

    const getPlaceKey = (place) => String(place?.id || `idx-${place?._idx || '0'}`);
    const usedIds = new Set();
    const orderedDayPlaces = dayBuckets.map((bucket) => {
      const localPool = bucket.places.filter((place) => !usedIds.has(getPlaceKey(place)));
      if (localPool.length === 0) {
        return { ...bucket, ordered: [] };
      }

      const seed = [...localPool].sort((a, b) => b._score - a._score)[0];
      const remaining = localPool.filter((place) => getPlaceKey(place) !== getPlaceKey(seed));
      const ordered = [seed];
      let current = seed;

      while (remaining.length > 0 && ordered.length < 5) {
        let nearestIdx = 0;
        let nearestDist = distanceBetween(current, remaining[0]);
        for (let i = 1; i < remaining.length; i += 1) {
          const dist = distanceBetween(current, remaining[i]);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = i;
          }
        }
        const next = remaining.splice(nearestIdx, 1)[0];
        ordered.push(next);
        current = next;
      }

      ordered.forEach((place) => usedIds.add(getPlaceKey(place)));
      return { ...bucket, ordered };
    });

    const leftovers = rankedPlaces.filter((place) => !usedIds.has(getPlaceKey(place)));
    for (let i = 0; i < orderedDayPlaces.length; i += 1) {
      while (orderedDayPlaces[i].ordered.length < 3 && leftovers.length > 0) {
        const currentList = orderedDayPlaces[i].ordered;
        if (currentList.length === 0) {
          currentList.push(leftovers.shift());
          continue;
        }
        const anchor = currentList[currentList.length - 1];
        let nearestIdx = 0;
        let nearestDist = distanceBetween(anchor, leftovers[0]);
        for (let j = 1; j < leftovers.length; j += 1) {
          const dist = distanceBetween(anchor, leftovers[j]);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestIdx = j;
          }
        }
        currentList.push(leftovers.splice(nearestIdx, 1)[0]);
      }
    }

    const itineraryPlaces = orderedDayPlaces
      .flatMap((bucket) => bucket.ordered.slice(0, 5).map((source, index) => ({
        id: `smart-itinerary-${source.id || source._idx || `${bucket.dayNum}-${index}`}`,
        name: source.name || `Stop ${index + 1}`,
        lat: source.lat,
        lng: source.lng,
        image: source.image,
        address: source.address || cityQuery,
        rating: source._rating || 4.2,
        reviewCount: source._reviewCount || 0,
        overview: source.overview || source.description || `${source.name || 'This stop'} is selected based on proximity and popularity.`,
        website: source.website || '',
        tags: Array.isArray(source.tags) && source.tags.length > 0 ? source.tags : ['Smart-picked'],
        dayNum: bucket.dayNum,
        dayTitle: `Day ${bucket.dayNum}`,
        durationLabel: source.estimatedDuration || `${Math.max(1, Math.min(4, Number(source.durationHours || 2)))} hr`,
      })))
      .slice(0, dayCount * 5);

    return [{
      id: 'smart-itinerary-generator',
      title: `${cityQuery}: Smart Itinerary Generator`,
      destination: cityQuery,
      duration: `${dayCount} days`,
      type: 'Smart-generated',
      creator: 'Smart Itinerary Generator',
      author: {
        name: 'AI Route Planner',
        travelStyle: 'Popularity-ranked, cluster-based itinerary',
        interests: ['Top-rated', 'Nearby routing', 'Efficient days'],
        avatar: '',
      },
      image: itineraryPlaces[0]?.image || '',
      tags: ['Popularity-ranked', 'Clustered by 2km', 'Nearest-neighbor ordered'],
      views: 0,
      countriesCount: 1,
      places: itineraryPlaces,
    }];
  }, [discoveryData?.places, filteredPlaces, cityQuery, days?.length]);

  const mapCenter = useMemo(() => {
    if (Array.isArray(discoveryData?.center) && discoveryData.center.length === 2) {
      return discoveryData.center;
    }
    const firstItem = tripExpenseItems.find((i) => i.lat != null && i.lng != null);
    if (firstItem) return [firstItem.lat, firstItem.lng];
    return getMapCenterForDestination(trip?.destination || trip?.locations);
  }, [discoveryData?.center, tripExpenseItems, locationUpdateKey, trip?.destination, trip?.locations]);

  const mapMarkers = useMemo(() => {
    const tripItemMarkers = tripExpenseItems
      .filter((i) => i.lat != null && i.lng != null)
      .map((i) => {
        const day = days.find((d) => d.date === i.date);
        return {
          id: i.id,
          name: i.name,
          lat: i.lat,
          lng: i.lng,
          dayNum: day?.dayNum ?? 1,
          address: i.detail || '',
          markerType: 'trip',
          website: i.externalLink || '',
        };
      });

    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const sourceFoods = Array.isArray(discoveryData?.foods) ? discoveryData.foods : [];
    const sourceExperiences = Array.isArray(discoveryData?.experiences) ? discoveryData.experiences : [];

    const toDiscoveryMarkers = (items, markerType, limit = 24) => items
      .filter((item) => item.lat != null && item.lng != null)
      .slice(0, limit)
      .map((item, idx) => ({
        id: `discovery-${markerType}-${item.id || idx}`,
        sourceId: item.id,
        markerType,
        name: item.name,
        lat: item.lat,
        lng: item.lng,
        dayNum: 1,
        address: item.address || cityQuery,
        rating: item.rating,
        reviewCount: item.reviewCount,
        overview: item.overview || item.description || '',
        image: resolveImageUrl(
          item.image,
          item.name,
          markerType === 'food' ? 'restaurant' : markerType === 'experience' ? 'activity' : 'landmark',
        ),
        website: item.website || '',
        originalData: item,
      }));

    const placeMarkers = toDiscoveryMarkers(sourcePlaces, 'place', 24);
    const foodMarkers = toDiscoveryMarkers(sourceFoods, 'food', 24);
    const experienceMarkers = toDiscoveryMarkers(sourceExperiences, 'experience', 30);

    if (mapFilter === 'Food & Beverages') return foodMarkers;
    if (mapFilter === 'Experiences') return experienceMarkers;
    if (mapFilter === 'My Trip') return tripItemMarkers.length > 0 ? tripItemMarkers : [];
    return placeMarkers.length > 0 ? placeMarkers : tripItemMarkers;
  }, [tripExpenseItems, days, discoveryData?.places, discoveryData?.foods, discoveryData?.experiences, mapFilter, cityQuery]);

  const appendItemToTrip = ({ itemType, data, categoryId, category, Icon, values }) => {
    const isStayCategory = String(categoryId || '').toLowerCase() === 'stays';
    const costNum = parseFloat(values?.cost) || 0;
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
    const stayDuration = isStayCategory ? durationMinutesToParts(stayDurationMinutes) : { durationHrs: durationHrsNum, durationMins: durationMinsNum };

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

    setTripExpenseItems((prev) => [...prev, {
      id: `${itemType}-${data.id}-${Date.now()}`,
      sourcePlaceId: data.id || null,
      name: data.name,
      total: costNum,
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
    }]);
  };

  const { openSocialImportForDay, socialImportModalProps } = useSocialImport({
    appendItemToTrip,
    days,
    cityQuery,
  });

  const handleAddDetectedDestinationFromSocial = useCallback(async (label) => {
    const raw = String(label || '').trim();
    if (!raw || !tripId) return;
    const currentStr = trip?.locations || trip?.destination || '';
    const parts = currentStr.split(';').map((s) => s.trim()).filter(Boolean);
    const token = (s) => s.split(',')[0].trim().toLowerCase();
    if (parts.some((p) => token(p) === token(raw))) {
      toast('That destination is already on your trip.');
      return;
    }
    const newLocations = [...parts, raw].join('; ');
    const newDestination = parts.length > 0
      ? extractPrimaryDestination(trip.destination || parts[0])
      : raw.split(',')[0].trim();
    setLocalDestination(newDestination);
    setLocalLocations(newLocations);
    try {
      const updated = await updateItinerary(tripId, { destination: newDestination, locations: newLocations });
      if (updated) setServerItinerary(updated);
      setLocationUpdateKey((k) => k + 1);
      toast.success(`Added ${raw.split(',')[0].trim()} to your destinations`);
    } catch (e) {
      toast.error(e?.message || 'Could not update trip');
    }
  }, [tripId, trip]);

  const openAddToTripFromMapMarker = (marker) => {
    if (!marker) return;

    const markerType = marker.markerType;
    let type = 'place';
    let categoryId = 'places';
    let category = 'Places';
    let Icon = Camera;

    if (markerType === 'food') {
      type = 'food';
      categoryId = 'food';
      category = 'Food & Beverage';
      Icon = UtensilsCrossed;
    } else if (markerType === 'experience') {
      type = 'experience';
      categoryId = 'experiences';
      category = 'Experience';
      Icon = Ticket;
    }

    const data = marker.originalData || {
      id: marker.sourceId || marker.id,
      name: marker.name,
      address: marker.address || cityQuery,
      lat: marker.lat,
      lng: marker.lng,
      image: marker.image,
      website: marker.website || '',
      rating: marker.rating,
      reviewCount: marker.reviewCount,
    };

    const day = days.find((d) => d.dayNum === 1);
    setAddToTripItem({ type, data, categoryId, category, Icon });
    setAddToTripDate(day?.date || days[0]?.date || '');
    setAddToTripStartTime('07:00');
    setAddToTripDurationHrs('1');
    setAddToTripDurationMins('0');
    setAddToTripCheckInDate(day?.date || days[0]?.date || '');
    setAddToTripCheckInTime('15:00');
    setAddToTripCheckOutDate(days.find((d) => d.dayNum === 2)?.date || addDays(day?.date || days[0]?.date || '', 1));
    setAddToTripCheckOutTime('11:00');
    setAddToTripNotes('');
    setAddToTripCost('');
    setAddToTripExternalLink(data.website || '');
    setAddToTripTravelDocs([]);
    setAddToTripModalOpen(true);
  };

  const openAddStayToTrip = (stay, room = null) => {
    if (!stay) return;

    const day = days.find((d) => d.dayNum === 1);
    const bookingLink = buildStayFallbackLink(stay, cityQuery);
    const defaultCost = Number(room?.price ?? stay.pricePerNight ?? 0);
    const roomLabel = room?.name ? ` • ${room.name}` : '';

    setAddToTripItem({
      type: 'stay',
      data: {
        ...stay,
        website: bookingLink,
      },
      categoryId: 'stays',
      category: 'Stays',
      Icon: Building2,
    });
    setAddToTripDate(day?.date || days[0]?.date || '');
    setAddToTripStartTime('15:00');
    setAddToTripDurationHrs('12');
    setAddToTripDurationMins('0');
    setAddToTripCheckInDate(day?.date || days[0]?.date || '');
    setAddToTripCheckInTime('15:00');
    setAddToTripCheckOutDate(days.find((d) => d.dayNum === 2)?.date || addDays(day?.date || days[0]?.date || '', 1));
    setAddToTripCheckOutTime('11:00');
    setAddToTripNotes(`Stay booking${roomLabel}`.trim());
    setAddToTripCost(defaultCost > 0 ? String(defaultCost) : '');
    setAddToTripExternalLink(bookingLink);
    setAddToTripTravelDocs([]);
    setAddToTripModalOpen(true);
  };

  const canOpenInternalItemOverview = (item) => {
    const raw = String(item?.categoryId || item?.category || '').toLowerCase();
    return raw === 'places'
      || raw === 'place'
      || raw === 'food'
      || raw === 'food & beverage'
      || raw === 'stays'
      || raw === 'stay'
      || raw === 'experiences'
      || raw === 'experience';
  };

  const openInternalItemOverview = (item) => {
    if (!item) return;
    const raw = String(item.categoryId || item.category || '').toLowerCase();

    setAddPlacesOpen(false);
    setAddFoodOpen(false);
    setAddStaysOpen(false);
    setAddExperiencesOpen(false);
    setPlaceDetailsView(null);
    setFoodDetailsView(null);
    setStayDetailsView(null);
    setExperienceDetailsView(null);

    if (raw === 'food' || raw === 'food & beverage') {
      setFoodDetailsTab('overview');
      setFoodDetailsView(enrichFoodDetails(item, cityQuery));
      setAddFoodOpen(true);
      setEditPlaceItem(null);
      return;
    }

    if (raw === 'stays' || raw === 'stay') {
      if (hasStayBookingData(item)) {
        setEditPlaceItem(item);
        return;
      }
      setStayDetailsTab('overview');
      setStayDetailsView(item);
      setAddStaysOpen(true);
      setEditPlaceItem(null);
      return;
    }

    if (raw === 'experiences' || raw === 'experience') {
      setExperienceDetailsTab('overview');
      setExperienceDetailsView(item);
      setAddExperiencesOpen(true);
      setEditPlaceItem(null);
      return;
    }

    const normalizeText = (value) => String(value || '').trim().toLowerCase();
    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const byId = sourcePlaces.find((p) => String(p?.id || '') === String(item?.sourcePlaceId || item?.id || ''))
      || filteredPlaces.find((p) => String(p?.id || '') === String(item?.sourcePlaceId || item?.id || ''));

    const byNameAndAddress = !byId
      ? (sourcePlaces.find((p) => (
        normalizeText(p?.name) === normalizeText(item?.name)
        && normalizeText(p?.address || '').includes(normalizeText(item?.detail || item?.address || ''))
      )) || filteredPlaces.find((p) => (
        normalizeText(p?.name) === normalizeText(item?.name)
        && normalizeText(p?.address || '').includes(normalizeText(item?.detail || item?.address || ''))
      )))
      : null;

    const byCoords = (!byId && !byNameAndAddress && item?.lat != null && item?.lng != null)
      ? (sourcePlaces.find((p) => Number(p?.lat).toFixed(4) === Number(item.lat).toFixed(4) && Number(p?.lng).toFixed(4) === Number(item.lng).toFixed(4))
        || filteredPlaces.find((p) => Number(p?.lat).toFixed(4) === Number(item.lat).toFixed(4) && Number(p?.lng).toFixed(4) === Number(item.lng).toFixed(4)))
      : null;

    const canonical = byId || byNameAndAddress || byCoords || null;
    const detailItem = canonical
      ? {
        ...item,
        ...canonical,
        id: canonical.id || item.id,
        name: canonical.name || item.name,
        image: canonical.image || item.image || item.placeImageUrl,
        images: Array.isArray(canonical.images) && canonical.images.length > 0
          ? canonical.images
          : (item.image || item.placeImageUrl ? [item.image || item.placeImageUrl] : []),
        address: canonical.address || item.address || item.detail,
        website: canonical.website || item.website || item.externalLink || '',
        lat: canonical.lat ?? item.lat,
        lng: canonical.lng ?? item.lng,
      }
      : {
        ...item,
        image: item.image || item.placeImageUrl,
        images: item.image || item.placeImageUrl ? [item.image || item.placeImageUrl] : [],
        address: item.address || item.detail,
      };

    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(detailItem.id || null);
    setPlaceDetailsView(detailItem);
    setAddPlacesOpen(true);
    setEditPlaceItem(null);
  };

  const openAddPlacesDetailsFromMapMarker = (marker) => {
    if (!marker) return;

    const markerId = String(marker.sourceId || marker.id || '');
    const sourcePlaces = Array.isArray(discoveryData?.places) ? discoveryData.places : [];
    const selectedFromSource = sourcePlaces.find((place) => String(place.id) === markerId);
    const selectedFromFiltered = filteredPlaces.find((place) => String(place.id) === markerId);
    const selected = selectedFromSource || selectedFromFiltered || {
      id: marker.sourceId || marker.id || `place-${Date.now()}`,
      name: marker.name || 'Place',
      lat: marker.lat,
      lng: marker.lng,
      image: marker.image,
      address: marker.address || cityQuery,
      rating: marker.rating,
      reviewCount: marker.reviewCount,
      website: marker.website || '',
      overview: marker.overview || '',
      tags: marker.tags || [],
    };

    setAddFoodOpen(false);
    setAddExperiencesOpen(false);
    setFoodDetailsView(null);
    setExperienceDetailsView(null);
    setItineraryDetailsView(null);
    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(selected.id);
    setPlaceDetailsView(selected);
    setAddPlacesOpen(true);
  };

  const openRouteIdeasBrowseAll = () => {
    setAddFoodOpen(false);
    setAddExperiencesOpen(false);
    setPlaceDetailsView(null);
    setFoodDetailsView(null);
    setExperienceDetailsView(null);
    setPlaceDetailsTab('overview');
    const firstItinerary = Array.isArray(routeIdeas) ? routeIdeas[0] : null;
    if (firstItinerary) {
      openRouteIdeaDetails(firstItinerary);
    } else {
      setItineraryDetailsView(null);
      setSelectedPlaceMarkerId(null);
    }
    setAddPlacesOpen(true);
  };

  const openRouteIdeaDetails = (itinerary) => {
    if (!itinerary) return;
    const firstPlace = Array.isArray(itinerary.places) ? itinerary.places.find((place) => place?.id) : null;
    setPlaceDetailsView(null);
    setPlaceDetailsTab('overview');
    setItineraryDetailsView(itinerary);
    setSelectedPlaceMarkerId(firstPlace?.id || null);
  };

  const openItineraryPlaceDetails = (itineraryPlace) => {
    if (!itineraryPlace) return;
    const nextPlace = {
      ...itineraryPlace,
      id: itineraryPlace.id || `itinerary-place-${Date.now()}`,
      tags: Array.isArray(itineraryPlace.tags) ? itineraryPlace.tags : [],
    };
    setAddFoodOpen(false);
    setAddExperiencesOpen(false);
    setAddPlacesOpen(true);
    setItineraryDetailsView(null);
    setPlaceDetailsTab('overview');
    setSelectedPlaceMarkerId(nextPlace.id);
    setPlaceDetailsView(nextPlace);
  };

  const addEntireItineraryToTrip = (itineraryPlaces = []) => {
    if (!Array.isArray(itineraryPlaces) || itineraryPlaces.length === 0) {
      showInAppNotice('No places found in this itinerary.', 'warning');
      return;
    }

    const normalize = (value) => String(value || '').trim().toLowerCase();
    const dayDateByNum = new Map((days || []).map((d) => [Number(d.dayNum), d.date]));
    const dayCounts = new Map();

    const existingKeys = new Set(
      (tripExpenseItems || []).map((item) => {
        const latKey = Number(item?.lat || 0).toFixed(4);
        const lngKey = Number(item?.lng || 0).toFixed(4);
        return `${normalize(item?.name)}|${String(item?.date || '')}|${latKey}|${lngKey}`;
      }),
    );

    const placesSorted = [...itineraryPlaces].sort((a, b) => Number(a?.dayNum || 1) - Number(b?.dayNum || 1));
    const toAppend = [];

    placesSorted.forEach((place, idx) => {
      const dayNum = Math.max(1, Number(place?.dayNum || 1));
      const fallbackDay = days[idx % Math.max(days.length, 1)]?.date || days[0]?.date || '';
      const itemDate = dayDateByNum.get(dayNum) || fallbackDay;
      const daySlot = dayCounts.get(dayNum) || 0;
      dayCounts.set(dayNum, daySlot + 1);

      const startMinutes = Math.min(20 * 60, 9 * 60 + (daySlot * 120));
      const startH = String(Math.floor(startMinutes / 60)).padStart(2, '0');
      const startM = String(startMinutes % 60).padStart(2, '0');
      const latKey = Number(place?.lat || 0).toFixed(4);
      const lngKey = Number(place?.lng || 0).toFixed(4);
      const dedupeKey = `${normalize(place?.name)}|${String(itemDate || '')}|${latKey}|${lngKey}`;
      if (existingKeys.has(dedupeKey)) return;

      existingKeys.add(dedupeKey);
      toAppend.push({
        id: `place-${place?.id || idx}-${Date.now()}-${idx}`,
        sourcePlaceId: place?.id || null,
        name: place?.name || `Place ${idx + 1}`,
        total: 0,
        categoryId: 'places',
        category: 'Places',
        date: itemDate,
        detail: place?.address || place?.name || cityQuery,
        Icon: Camera,
        lat: place?.lat,
        lng: place?.lng,
        notes: '',
        attachments: [],
        startTime: `${startH}:${startM}`,
        durationHrs: 2,
        durationMins: 0,
        externalLink: place?.website || '',
        placeImageUrl: resolveImageUrl(place?.image, place?.name, 'landmark'),
        rating: place?.rating,
        reviewCount: place?.reviewCount,
      });
    });

    if (toAppend.length === 0) {
      showInAppNotice('These itinerary places are already in your trip.', 'warning');
      return;
    }

    setTripExpenseItems((prev) => [...prev, ...toAppend]);
    showInAppNotice(`Added ${toAppend.length} place${toAppend.length === 1 ? '' : 's'} to your itinerary page.`, 'success');
  };

  if (tripLoading) {
    return (
      <div className="trip-details trip-details--missing">
        <p>Loading trip…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="trip-details trip-details--missing">
        <p>{tripLoadError || 'Trip not found.'}</p>
        <Link to="/">Back to My Trips</Link>
      </div>
    );
  }

  return (
    <div className="trip-details">
      <header className="trip-details__header">
        <div className="trip-details__brand">
          <Link to="/" className="trip-details__logo" aria-label="Back to My Trips">
            @
          </Link>
          <div className="trip-details__trip-info" ref={titleDropdownRef}>
            {titleEditing ? (
              <input
                type="text"
                className="trip-details__title-input"
                value={titleEditValue}
                onChange={(e) => setTitleEditValue(e.target.value)}
                onBlur={() => {
                  const v = titleEditValue.trim();
                  if (v) {
                    (async () => {
                      try {
                        const updated = await updateItinerary(tripId, { title: v });
                        if (updated) setServerItinerary(updated);
                        setTitleDisplay(v);
                        toast.success('Changes saved', { id: 'trip-details-saved' });
                      } catch (e) {
                        console.error(e);
                      }
                    })();
                  }
                  setTitleEditing(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                  if (e.key === 'Escape') {
                    setTitleEditValue(titleDisplay);
                    setTitleEditing(false);
                  }
                }}
                autoFocus
                aria-label="Trip title"
              />
            ) : (
              <>
                <button
                  type="button"
                  className="trip-details__title-btn"
                  onClick={() => {
                    const now = Date.now();
                    if (now - titleLastClickRef.current < 400) {
                      setTitleEditValue(titleDisplay);
                      setTitleEditing(true);
                      setTitleDropdownOpen(false);
                    } else {
                      setTitleDropdownOpen((o) => !o);
                    }
                    titleLastClickRef.current = now;
                  }}
                  onDoubleClick={(e) => {
                    e.preventDefault();
                    setTitleEditValue(titleDisplay);
                    setTitleEditing(true);
                    setTitleDropdownOpen(false);
                  }}
                  aria-label="Trip name - click for menu, double-click to rename"
                  aria-expanded={titleDropdownOpen}
                >
                  <span className="trip-details__title-text">{titleDisplay || `${days.length} days to ${trip.destination}`}</span>
                  <ChevronDown size={16} aria-hidden />
                </button>
                {titleDropdownOpen && (
                  <div className="trip-details__title-dropdown" role="menu">
                    <button type="button" className="trip-details__title-dropdown-item" role="menuitem" onClick={() => { setTitleEditing(true); setTitleEditValue(titleDisplay); setTitleDropdownOpen(false); }}>
                      Rename trip
                    </button>
                    <button
                      type="button"
                      className="trip-details__title-dropdown-item trip-details__title-dropdown-item--danger"
                      role="menuitem"
                      onClick={() => {
                        setTitleDropdownOpen(false);
                        setFriendlyDialog({
                          open: true,
                          title: 'Delete trip',
                          message: 'Delete this trip? This cannot be undone.',
                          showCancel: true,
                          confirmText: 'Delete',
                          cancelText: 'Cancel',
                          onConfirm: async () => {
                            try {
                              await deleteItinerary(tripId);
                              toast.success('Trip deleted');
                              navigate('/');
                            } catch (e) {
                              setFriendlyDialog({
                                open: true,
                                title: 'Could not delete trip',
                                message: e?.message || 'Please try again.',
                                showCancel: false,
                                confirmText: 'OK',
                                cancelText: 'Cancel',
                                onConfirm: null,
                              });
                            }
                          },
                        });
                      }}
                    >
                      Delete trip
                    </button>
                  </div>
                )}
              </>
            )}
            <p className="trip-details__spent">
              Spent: {currency} ${spent.toFixed(2)}{' '}
              <button type="button" className="trip-details__details-link" onClick={() => setBudgetModalOpen(true)}>Details</button>
            </p>
          </div>
        </div>

        <div className="trip-details__center">
          <button
            type="button"
            className="trip-details__pill trip-details__pill--btn"
            onClick={() => {
              setWhereQuery('');
              const locationsStr = trip.locations || trip.destination || '';
              const parts = locationsStr.split(';').map((s) => s.trim()).filter(Boolean);
              const initial = parts.length > 0 ? parts : (trip.destination ? [trip.destination] : []);
              const resolved = initial.map((str, i) => {
                const match = searchLocations(str).find((loc) => loc.name === str || (loc.country && `${loc.name}, ${loc.country}` === str));
                if (match) return match;
                const [name, ...rest] = str.split(',').map((s) => s.trim());
                const locName = name || str;
                const locCountry = rest.length > 0 ? rest.join(', ') : undefined;
                const byName = searchLocations(locName).find((loc) => !locCountry || loc.country === locCountry);
                if (byName) return byName;
                return { id: `where-${i}-${locName}`, name: locName, country: locCountry };
              });
              setWhereSelectedLocations(resolved);
              setWhereModalOpen(true);
              setWhereSuggestionsOpen(false);
            }}
            aria-label="Change destination"
          >
            {trip.locations || trip.destination}
            <ChevronDown size={14} aria-hidden />
          </button>
          <button
            type="button"
            className="trip-details__pill trip-details__pill--btn"
            onClick={openDateModal}
            aria-label="Change dates"
          >
            {displayDatesLabel}
          </button>
          <div className="trip-details__currency-wrap">
            <button
              type="button"
              className="trip-details__currency-btn"
              onClick={() => { setModalCurrency(currency); setCurrencyModalOpen(true); }}
              aria-label="Change currency"
            >
              {currency}
              <ChevronDown size={14} aria-hidden />
            </button>
          </div>
          <button
            type="button"
            className="trip-details__icon-btn"
            aria-label="Notes & Documents"
            onClick={() => setNotesModalOpen(true)}
          >
            <BookOpen size={18} aria-hidden />
          </button>
        </div>

        <div className="trip-details__actions">
          <button
            type="button"
            className="trip-details__icon-btn"
            onClick={() => navigate(`/trip/${tripId}/moodboard`)}
            title="Moodboard"
          >
            <Image size={18} />
          </button>

          <div className="trip-details__view-toggle" role="group" aria-label="View mode">
            <button
              type="button"
              className={`trip-details__view-toggle-btn ${viewMode === 'kanban' ? 'trip-details__view-toggle-btn--active' : ''}`}
              onClick={() => setViewMode('kanban')}
              aria-pressed={viewMode === 'kanban'}
              aria-label="Kanban board view"
              title="Board view"
            >
              <LayoutGrid size={18} aria-hidden />
            </button>
            <button
              type="button"
              className={`trip-details__view-toggle-btn ${viewMode === 'calendar' ? 'trip-details__view-toggle-btn--active' : ''}`}
              onClick={() => setViewMode('calendar')}
              aria-pressed={viewMode === 'calendar'}
              aria-label="Calendar view"
              title="Calendar view"
            >
              <CalendarIcon size={18} aria-hidden />
            </button>
          </div>
          <button type="button" className="trip-details__icon-btn" aria-label="Share">
            <Share2 size={18} aria-hidden />
          </button>
        </div>
      </header>

      {inAppNotice ? (
        <div className={`trip-details__inline-notice trip-details__inline-notice--${inAppNotice.type}`} role="status" aria-live="polite">
          <span className="trip-details__inline-notice-text">{inAppNotice.message}</span>
          <button
            type="button"
            className="trip-details__inline-notice-close"
            aria-label="Dismiss notification"
            onClick={() => {
              if (inAppNoticeTimerRef.current) {
                clearTimeout(inAppNoticeTimerRef.current);
                inAppNoticeTimerRef.current = null;
              }
              setInAppNotice(null);
            }}
          >
            <X size={14} aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="trip-details__body">
        {viewMode === 'kanban' ? (
          <div className="trip-details__columns">
            <div className="trip-details__columns-scroll">
              {visibleDays.map((day) => {
                const dayStayItems = getDayStayItems(tripExpenseItems, day.date);
                const boardDayItems = getSortedDayItems(tripExpenseItems, day.date, { includeOvernightStays: true })
                  .filter((item) => !isStayItem(item));
                const dayItemsCount = boardDayItems.length;
                const totalMins = getDayTotalDurationMinutes(tripExpenseItems, day.date);
                const durationStr = formatDurationMinutes(totalMins || 60);
                const isDayMenuOpen = openDayMenuKey === day.dayNum;
                const dayColor = dayColors[day.dayNum] ?? DAY_COLOR_OPTIONS[0];
                return (
                  <section
                    key={day.dayNum}
                    className="trip-details__day-col"
                    style={{ width: getDayColumnWidth(day.dayNum), flexBasis: getDayColumnWidth(day.dayNum) }}
                  >
                    <div className="trip-details__day-header">
                      <div className="trip-details__day-heading">
                        <GripVertical size={14} className="trip-details__grip" aria-hidden />
                        <h2 className="trip-details__day-title">
                          Day {day.dayNum}: {day.label}
                        </h2>
                      </div>
                      <div className="trip-details__day-header-actions" data-day-menu>
                        <button
                          type="button"
                          className="trip-details__day-optimize-btn"
                          aria-label="Optimize route"
                          title={dayItemsCount < 2 ? 'Add at least 2 places to optimize route' : 'Optimize route'}
                          disabled={dayItemsCount < 2}
                          onClick={() => {
                            const items = getSortedDayItems(tripExpenseItems, day.date)
                              .filter((item) => !isStayItem(item));
                            if (items.length < 2) return;
                            setOptimizeRouteDay(day);
                            setOptimizeRouteStartId(items[0]?.id ?? '');
                            setOptimizeRouteEndId(items[items.length - 1]?.id ?? '');
                            setOptimizeRouteModalOpen(true);
                          }}
                        >
                          <Route size={16} aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="trip-details__day-menu"
                          aria-label="Day options"
                          aria-expanded={isDayMenuOpen}
                          aria-haspopup="menu"
                          onClick={() => { setOpenDayMenuKey(isDayMenuOpen ? null : day.dayNum); setDayColorPickerDay(null); }}
                        >
                          <MoreVertical size={16} aria-hidden />
                        </button>
                        {isDayMenuOpen && (
                          <div className="trip-details__day-dropdown" role="menu">
                            <button
                              type="button"
                              className="trip-details__day-dropdown-item"
                              role="menuitem"
                              onClick={() => {
                                setMapDayFilterSelected([day.dayNum]);
                                setOpenDayMenuKey(null);
                              }}
                            >
                              <MapPin size={18} aria-hidden />
                              Show in map
                            </button>
                            <div className="trip-details__day-dropdown-item trip-details__day-dropdown-item--sub">
                              <button type="button" className="trip-details__day-dropdown-item-btn" onClick={() => setDayColorPickerDay(dayColorPickerDay === day.dayNum ? null : day.dayNum)}>
                                <Palette size={18} aria-hidden />
                                Change colour
                              </button>
                              {dayColorPickerDay === day.dayNum && (
                                <div className="trip-details__day-color-picker">
                                  {DAY_COLOR_OPTIONS.map((color) => (
                                    <button
                                      key={color}
                                      type="button"
                                      className="trip-details__day-color-swatch"
                                      style={{ background: color }}
                                      aria-label={`Color ${color}`}
                                      onClick={() => { setDayColors((prev) => ({ ...prev, [day.dayNum]: color })); setDayColorPickerDay(null); }}
                                    />
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              className="trip-details__day-dropdown-item"
                              role="menuitem"
                              onClick={() => {
                                setDateRange({ startDate: addDays(displayStart, -1), endDate: displayEnd });
                                setOpenDayMenuKey(null);
                              }}
                            >
                              Insert day before
                            </button>
                            <button
                              type="button"
                              className="trip-details__day-dropdown-item"
                              role="menuitem"
                              onClick={() => {
                                setDateRange({ startDate: displayStart, endDate: addDays(displayEnd, 1) });
                                setOpenDayMenuKey(null);
                              }}
                            >
                              Insert day after
                            </button>
                            <button
                              type="button"
                              className="trip-details__day-dropdown-item"
                              role="menuitem"
                              onClick={() => {
                                setTripExpenseItems((prev) => prev.filter((it) => it.date !== day.date));
                                setOpenDayMenuKey(null);
                              }}
                            >
                              Clear all ({dayItemsCount})
                            </button>
                            <button
                              type="button"
                              className="trip-details__day-dropdown-item trip-details__day-dropdown-item--danger"
                              role="menuitem"
                              onClick={() => {
                                setTripExpenseItems((prev) => prev.filter((it) => it.date !== day.date));
                                const isFirst = day.dayNum === 1;
                                const isLast = day.dayNum === days.length;
                                if (days.length <= 1) { setOpenDayMenuKey(null); return; }
                                if (isFirst) setDateRange({ startDate: addDays(displayStart, 1), endDate: displayEnd });
                                else if (isLast) setDateRange({ startDate: displayStart, endDate: addDays(displayEnd, -1) });
                                setOpenDayMenuKey(null);
                              }}
                            >
                              <Trash2 size={18} aria-hidden />
                              Delete day
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="trip-details__day-resize-handle"
                      aria-label={`Resize Day ${day.dayNum} column`}
                      onMouseDown={(e) => beginDayColumnResize(day.dayNum, e)}
                      onTouchStart={(e) => beginDayColumnResize(day.dayNum, e)}
                    />
                    <div className="trip-details__day-summary" style={dayColor ? { borderLeftColor: dayColor } : undefined}>
                      <span className="trip-details__day-summary-text">Day {day.dayNum}: {day.label} · {durationStr}</span>
                      <Info size={14} className="trip-details__day-summary-icon" aria-hidden />
                    </div>
                    <input
                      type="text"
                      className="trip-details__day-input"
                      placeholder="Add day title..."
                      value={dayTitles[day.dayNum] ?? ''}
                      onChange={(e) => setDayTitle(day.dayNum, e.target.value)}
                    />
                    <div className="trip-details__day-content">
                      {dayStayItems.map((stayItem) => {
                        const stayWindow = getStayWindow(stayItem);
                        return (
                          <button
                            key={`stay-info-${day.date}-${stayItem.id}`}
                            type="button"
                            className="trip-details__stay-banner"
                            onClick={() => openInternalItemOverview(stayItem)}
                          >
                            <div className="trip-details__stay-banner-thumb" aria-hidden>
                              {stayItem.placeImageUrl ? (
                                <img src={resolveImageUrl(stayItem.placeImageUrl, stayItem.name, 'hotel')} alt="" className="trip-details__stay-banner-img" onError={handleImageError} />
                              ) : (
                                <span className="trip-details__stay-banner-icon">
                                  <Bed size={20} aria-hidden />
                                </span>
                              )}
                            </div>
                            <div className="trip-details__stay-banner-body">
                              <span className="trip-details__stay-banner-label">Stay</span>
                              <strong className="trip-details__stay-banner-name">{stayItem.name}</strong>
                              <span className="trip-details__stay-banner-time">
                                Check-in: {formatStayDateTime(stayWindow.checkInDate, stayWindow.checkInTime)}
                              </span>
                              <span className="trip-details__stay-banner-time">
                                Check-out: {formatStayDateTime(stayWindow.checkOutDate, stayWindow.checkOutTime)}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {boardDayItems.map((item, idx) => {
                        const style = getCategoryStyle(item);
                        const IconComponent = item.Icon || Camera;
                        const timeRange = formatTimeRange(item);
                        const isTransportItem = item.categoryId === 'transportations' || Boolean(item.transportType);
                        const transportTypeLabel = item.transportType
                          ? `${String(item.transportType).charAt(0).toUpperCase()}${String(item.transportType).slice(1)}`
                          : 'Transport';
                        const transportTitle = `Transport (${transportTypeLabel})`;
                        const transportRoute = (String(item.name || '')
                          .replace(/^[A-Za-z]+:\s*/, '')
                          .replace(/\s*→\s*/g, ' to ')) || 'Route not available';
                        const transportTimes = getTransportTimesFromDetail(item.detail);
                        const transportMeta = transportTimes.dep && transportTimes.arr
                          ? `Dep ${transportTimes.dep} - Arr ${transportTimes.arr}`
                          : (timeRange ? `Dep ${timeRange}` : 'Time not available');
                        const itemNotes = String(item.notes || '').trim();
                        const itemHasCost = Number(item.total || 0) > 0;
                        const itemExternalLink = String(item.externalLink || '').trim();
                        const itemAttachments = Array.isArray(item.attachments) ? item.attachments : [];
                        const hasMetaDetails = Boolean(itemNotes || itemHasCost || itemExternalLink || itemAttachments.length > 0);
                        const segmentKey = `${day.date}-${idx}`;
                        const mode = transportModeBySegment[segmentKey] || 'driving';
                        const travelModeInfo = TRAVEL_MODES.find((m) => m.id === mode) || TRAVEL_MODES[2];
                        const TravelSegmentIcon = travelModeInfo.Icon;
                        const nextItem = boardDayItems[idx + 1];
                        const hideTravelSegment = Boolean(nextItem) && (isFlightItem(item) || isFlightItem(nextItem));
                        const travelToNext = nextItem && !hideTravelSegment
                          ? getTravelBetween(item, nextItem, mode, travelTimeCache, setTravelTimeCache)
                          : null;
                        const isTravelDropdownOpen = openTravelDropdownKey === segmentKey;
                        return (
                          <div key={item.id} className="trip-details__itinerary-block">
                            <div
                              role="button"
                              tabIndex={0}
                              className="trip-details__itinerary-card"
                              onClick={() => isEditableItineraryItem(item) && setEditPlaceItem(item)}
                              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isEditableItineraryItem(item) && setEditPlaceItem(item); } }}
                            >
                              <span className="trip-details__itinerary-num" aria-hidden>{idx + 1}</span>
                              <div className="trip-details__itinerary-card-thumb">
                                {item.placeImageUrl ? (
                                  <img src={resolveImageUrl(item.placeImageUrl, item.name, 'landmark')} alt="" className="trip-details__itinerary-card-img" onError={handleImageError} />
                                ) : (
                                  <span className="trip-details__itinerary-card-icon" style={{ background: `${style.color}22`, color: style.color }}>
                                    <IconComponent size={20} aria-hidden />
                                  </span>
                                )}
                              </div>
                              <div className={`trip-details__itinerary-card-body ${isTransportItem ? 'trip-details__itinerary-card-body--transport' : ''}`}>
                                <span className="trip-details__itinerary-category" style={{ color: style.color }}>
                                  {isTransportItem ? transportTitle : style.label}
                                </span>
                                <h4 className={`trip-details__itinerary-name ${isTransportItem ? 'trip-details__itinerary-name--transport' : ''}`}>{isTransportItem ? transportRoute : item.name}</h4>
                                {(isTransportItem ? transportMeta : timeRange) ? (
                                  <span className={`trip-details__itinerary-time ${isTransportItem ? 'trip-details__itinerary-time--transport' : ''}`}>
                                    {isTransportItem ? transportMeta : timeRange}
                                  </span>
                                ) : null}
                                {hasMetaDetails ? (
                                  <div className="trip-details__itinerary-meta">
                                    {itemNotes ? (
                                      <p className="trip-details__itinerary-meta-line">
                                        <strong>Note:</strong> {itemNotes}
                                      </p>
                                    ) : null}
                                    {itemHasCost ? (
                                      <p className="trip-details__itinerary-meta-line">
                                        <strong>Cost:</strong> {currency} {Number(item.total).toFixed(2)}
                                      </p>
                                    ) : null}
                                    {itemExternalLink ? (
                                      <p className="trip-details__itinerary-meta-line">
                                        <strong>Link:</strong>{' '}
                                        <a
                                          href={itemExternalLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="trip-details__itinerary-meta-link"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          {itemExternalLink.replace(/^https?:\/\//, '')}
                                        </a>
                                      </p>
                                    ) : null}
                                    {itemAttachments.length > 0 ? (
                                      <p className="trip-details__itinerary-meta-line">
                                        <strong>Docs:</strong>{' '}
                                        {itemAttachments.map((doc, docIdx) => {
                                          const attachment = normalizeAttachment(doc);
                                          if (!attachment) return null;
                                          return (
                                            <span key={`${item.id}-doc-${docIdx}`}>
                                              {docIdx > 0 ? ', ' : ''}
                                              {attachment.url ? (
                                                <a
                                                  href={attachment.url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="trip-details__itinerary-meta-link"
                                                  onClick={(e) => e.stopPropagation()}
                                                >
                                                  {attachment.name}
                                                </a>
                                              ) : (
                                                attachment.name
                                              )}
                                            </span>
                                          );
                                        })}
                                      </p>
                                    ) : null}
                                  </div>
                                ) : null}
                              </div>
                              {!isTransportItem ? (
                                <button
                                  type="button"
                                  className="trip-details__itinerary-edit-btn"
                                  aria-label="Edit"
                                  onClick={(e) => { e.stopPropagation(); isEditableItineraryItem(item) && setEditPlaceItem(item); }}
                                >
                                  <FileText size={16} aria-hidden />
                                </button>
                              ) : null}
                            </div>
                            {nextItem && travelToNext && (
                              <div className="trip-details__travel-segment-wrap">
                                <button
                                  type="button"
                                  className="trip-details__travel-segment"
                                  onClick={() => setOpenTravelDropdownKey(isTravelDropdownOpen ? null : segmentKey)}
                                  aria-expanded={isTravelDropdownOpen}
                                  aria-haspopup="listbox"
                                >
                                  <TravelSegmentIcon size={16} className="trip-details__travel-segment-icon" aria-hidden />
                                  <span>{travelToNext.duration} · {travelToNext.distance}</span>
                                  <ChevronDown size={14} aria-hidden />
                                </button>
                                {isTravelDropdownOpen && (
                                  <>
                                    <button type="button" className="trip-details__travel-dropdown-backdrop" aria-label="Close" onClick={() => setOpenTravelDropdownKey(null)} />
                                    <ul className="trip-details__travel-dropdown" role="listbox">
                                      {TRAVEL_MODES.map((m) => (
                                        <li key={m.id}>
                                          <button
                                            type="button"
                                            role="option"
                                            aria-selected={mode === m.id}
                                            className="trip-details__travel-dropdown-option"
                                            onClick={() => {
                                              setTransportModeBySegment((prev) => ({ ...prev, [segmentKey]: m.id }));
                                              setOpenTravelDropdownKey(null);
                                              if (m.id === 'public') {
                                                setPublicTransportSegment({ 
                                                  fromName: item.name, 
                                                  toName: nextItem.name,
                                                  fromLat: item.lat,
                                                  fromLng: item.lng,
                                                  toLat: nextItem.lat,
                                                  toLng: nextItem.lng
                                                });
                                                setPublicTransportModalOpen(true);
                                              }
                                            }}
                                          >
                                            <m.Icon size={18} aria-hidden />
                                            <span>{m.id === 'public' ? `${m.label}` : `${m.label} · ${getTravelBetween(item, nextItem, m.id, travelTimeCache, setTravelTimeCache).duration}`}</span>
                                            {mode === m.id && <Check size={18} className="trip-details__travel-check" aria-hidden />}
                                          </button>
                                        </li>
                                      ))}
                                    </ul>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-btn"
                      onClick={(e) => {
                        setAddSheetFromCalendar(false);
                        setAddSheetDay(day.dayNum);
                        const rect = e.currentTarget.getBoundingClientRect();
                        setAddSheetAnchor({ top: rect.top, left: rect.left, width: rect.width });
                      }}
                    >
                      <Plus size={16} aria-hidden />
                      Add things to do, hotels...
                    </button>
                  </section>
                );
              })}
            </div>
            <TripDetailsMapPanel
              mapView={mapView}
              mapExpandOpen={mapExpandOpen}
              setMapExpandOpen={setMapExpandOpen}
              setMapView={setMapView}
              mapFilter={mapFilter}
              setMapFilter={setMapFilter}
              resetMapDays={resetMapDays}
              setMapDayFilterOpen={setMapDayFilterOpen}
              mapCenter={mapCenter}
              mapMarkers={mapMarkers}
              activeDayNums={activeDayNums}
              openAddToTripFromMapMarker={openAddToTripFromMapMarker}
              openAddPlacesDetailsFromMapMarker={openAddPlacesDetailsFromMapMarker}
            />
          </div>
        ) : (
          <div className="trip-details__calendar-view">
            <div className="trip-details__calendar-content">
              {(() => {
                const dayColumnWidth = Math.min(DAY_COLUMN_MAX_WIDTH, Math.max(DAY_COLUMN_MIN_WIDTH, CALENDAR_DAY_COLUMN_DEFAULT_WIDTH));
                const calendarColumnsWidth = dayColumnWidth * days.length;
                return (
                  <>
              <div className="trip-details__calendar-day-tabs-row">
                <div className="trip-details__calendar-day-tabs-spacer" aria-hidden style={{ width: `${CALENDAR_GUTTER_WIDTH}px` }} />
                <div className="trip-details__calendar-day-tabs-viewport">
                <div
                  className="trip-details__calendar-day-tabs"
                  style={{ width: `${calendarColumnsWidth}px`, transform: `translateX(-${calendarScrollLeft}px)` }}
                >
                  {days.map((day) => (
                    <div
                      key={day.dayNum}
                      className="trip-details__calendar-day-tab"
                      style={{ width: `${dayColumnWidth}px`, minWidth: `${dayColumnWidth}px`, maxWidth: `${dayColumnWidth}px` }}
                    >
                      <span className="trip-details__calendar-day-tab-title">Day {day.dayNum}: {day.label}</span>
                      <span className="trip-details__calendar-day-tab-city">{trip.destination}</span>
                    </div>
                  ))}
                </div>
                </div>
              </div>
              <div
                className="trip-details__calendar-timeline-wrap"
                ref={calendarTimelineRef}
                onScroll={(e) => setCalendarScrollLeft(e.currentTarget.scrollLeft)}
              >
                <div className="trip-details__calendar-times" style={{ width: `${CALENDAR_GUTTER_WIDTH}px` }}>
                  <div className="trip-details__calendar-time-row trip-details__calendar-time-row--all-day">
                    <span className="trip-details__calendar-time-label">All day</span>
                  </div>
                  {Array.from({ length: CALENDAR_HOURS }, (_, i) => i + CALENDAR_START_HOUR).map((h) => (
                    <div key={h} className="trip-details__calendar-time-row">
                      <span className="trip-details__calendar-time-label">{String(h).padStart(2, '0')}:00</span>
                    </div>
                  ))}
                </div>
                <div className="trip-details__calendar-grid" style={{ width: `${calendarColumnsWidth}px`, minWidth: `${calendarColumnsWidth}px` }}>
                  {days.map((day) => (
                    <div
                      key={day.dayNum}
                      className="trip-details__calendar-day-col"
                      style={{ width: `${dayColumnWidth}px`, minWidth: `${dayColumnWidth}px`, maxWidth: `${dayColumnWidth}px` }}
                    >
                      <div
                        className={`trip-details__calendar-day-col-content ${calendarDragOverDayNum === day.dayNum ? 'trip-details__calendar-day-col-content--drop-target' : ''}`}
                        onDragOver={(e) => handleCalendarDayDragOver(e, day.dayNum)}
                        onDrop={(e) => handleCalendarDayDrop(e, day)}
                        onDragLeave={() => {
                          if (calendarDragOverDayNum === day.dayNum) setCalendarDragOverDayNum(null);
                        }}
                      >
                        <div className="trip-details__calendar-all-day-cell" aria-hidden />
                        {Array.from({ length: CALENDAR_HOURS }, (_, i) => (
                          <div key={i} className="trip-details__calendar-cell" />
                        ))}
                        <div className="trip-details__calendar-events">
                          {getCalendarEventLayouts(tripExpenseItems, day.date).map(({ item, style: laneStyle }) => {
                            const style = getCategoryStyle(item);
                            const IconComponent = (typeof item.Icon === 'function' || typeof item.Icon === 'string')
                              ? item.Icon
                              : Camera;
                            const timeRange = formatTimeRange(item);
                            const { top, height } = getCalendarEventPosition(item);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className={`trip-details__calendar-event ${calendarDraggingItemId === item.id ? 'trip-details__calendar-event--dragging' : ''} ${calendarResizingItemId === item.id ? 'trip-details__calendar-event--resizing' : ''}`}
                                draggable
                                onDragStart={(e) => handleCalendarDragStart(e, item.id)}
                                onDragEnd={handleCalendarDragEnd}
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
                                  ...laneStyle,
                                  backgroundColor: `${style.color}18`,
                                  borderLeftColor: style.color,
                                }}
                                onClick={() => isEditableItineraryItem(item) && setEditPlaceItem(item)}
                              >
                                <span className="trip-details__calendar-event-time">{timeRange}</span>
                                <span className="trip-details__calendar-event-icon" style={{ color: style.color }}>
                                  <IconComponent size={14} aria-hidden />
                                </span>
                                <span className="trip-details__calendar-event-name">{item.name}</span>
                                <span
                                  className="trip-details__calendar-event-resize"
                                  role="presentation"
                                  onMouseDown={(e) => handleCalendarResizeStart(e, item)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
                  </>
                );
              })()}
              <button
                type="button"
                className="trip-details__calendar-fab"
                aria-label="Add to trip"
                onClick={() => { setAddSheetFromCalendar(true); setAddSheetDay(1); setAddSheetAnchor(null); }}
              >
                <Plus size={24} aria-hidden />
              </button>
            </div>
            <TripDetailsMapPanel
              mapView={mapView}
              mapExpandOpen={mapExpandOpen}
              setMapExpandOpen={setMapExpandOpen}
              setMapView={setMapView}
              mapFilter={mapFilter}
              setMapFilter={setMapFilter}
              resetMapDays={resetMapDays}
              setMapDayFilterOpen={setMapDayFilterOpen}
              mapCenter={mapCenter}
              mapMarkers={mapMarkers}
              activeDayNums={activeDayNums}
              openAddToTripFromMapMarker={openAddToTripFromMapMarker}
              openAddPlacesDetailsFromMapMarker={openAddPlacesDetailsFromMapMarker}
            />
          </div>
        )}
      </div>

      <DateRangePickerModal
        open={dateModalOpen}
        start={displayStart}
        end={displayEnd}
        displayStartForMonth={displayStart}
        onApply={applyDateRange}
        onClose={() => setDateModalOpen(false)}
        title="When"
      />

      {currencyModalOpen && (
        <>
          <button
            type="button"
            className="trip-details__modal-backdrop"
            aria-label="Close"
            onClick={() => setCurrencyModalOpen(false)}
          />
          <div className="trip-details__currency-modal" role="dialog" aria-labelledby="currency-modal-title" aria-modal="true">
            <div className="trip-details__currency-modal-head">
              <h2 id="currency-modal-title" className="trip-details__currency-modal-title">Currencies</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setCurrencyModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <ul className="trip-details__currency-list">
              {CURRENCY_LIST.map(({ code, name }) => (
                <li key={code}>
                  <button
                    type="button"
                    className={`trip-details__currency-option ${modalCurrency === code ? 'trip-details__currency-option--selected' : ''}`}
                    onClick={() => setModalCurrency(code)}
                  >
                    <span className="trip-details__currency-option-text">{code} – {name}</span>
                    {modalCurrency === code && <Check size={18} className="trip-details__currency-check" aria-hidden />}
                  </button>
                </li>
              ))}
            </ul>
            <div className="trip-details__currency-modal-actions">
              <button type="button" className="trip-details__modal-cancel" onClick={() => setCurrencyModalOpen(false)}>Cancel</button>
              <button type="button" className="trip-details__modal-update" onClick={() => { setCurrency(modalCurrency); setCurrencyModalOpen(false); }}>Update</button>
            </div>
          </div>
        </>
      )}

      {whereModalOpen && (
        <>
          <button
            type="button"
            className="trip-details__modal-backdrop"
            aria-label="Close"
            onClick={() => setWhereModalOpen(false)}
          />
          <div className="trip-details__where-modal" role="dialog" aria-labelledby="where-modal-title" aria-modal="true">
            <div className="trip-details__where-modal-head">
              <h2 id="where-modal-title" className="trip-details__where-modal-title">Where to</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setWhereModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="trip-details__where-modal-body" ref={whereModalRef}>
              <label htmlFor="where-modal-input" className="trip-details__where-label">City</label>
              <div className="trip-details__where-input-wrap">
                <Search size={18} className="trip-details__where-input-icon" aria-hidden />
                <input
                  id="where-modal-input"
                  type="text"
                  className="trip-details__where-input"
                  placeholder="Where do you want to go?"
                  value={whereQuery}
                  onChange={(e) => {
                    setWhereQuery(e.target.value);
                    setWhereSuggestionsOpen(true);
                  }}
                  onFocus={() => setWhereSuggestionsOpen(true)}
                  autoComplete="off"
                  aria-expanded={whereSuggestionsOpen}
                  aria-controls="where-modal-listbox"
                  aria-autocomplete="list"
                  role="combobox"
                  aria-label="Destination"
                />
              </div>
              {whereSuggestionsOpen && (
                <ul id="where-modal-listbox" className="trip-details__where-suggestions" role="listbox">
                  {searchLocations(whereQuery).length === 0 ? (
                    <li className="trip-details__where-suggestion trip-details__where-suggestion--empty" role="option">No results</li>
                  ) : (
                    searchLocations(whereQuery).map((loc) => (
                      <li key={loc.id}>
                        <button
                          type="button"
                          className="trip-details__where-suggestion"
                          role="option"
                          aria-selected={whereSelectedLocations.some((l) => l.id === loc.id || l.name === loc.name)}
                          onClick={() => {
                            setWhereSelectedLocations((prev) =>
                              prev.some((l) => l.id === loc.id || l.name === loc.name) ? prev : [...prev, loc]
                            );
                            setWhereQuery('');
                          }}
                        >
                          <span className="trip-details__where-suggestion-name">{loc.name}</span>
                          {loc.country && (
                            <span className="trip-details__where-suggestion-meta">{loc.country}</span>
                          )}
                          <span className={`trip-details__where-type-badge trip-details__where-type-badge--${(loc.type || 'city').toLowerCase()}`}>
                            {WHERE_TYPE_LABELS[loc.type] || loc.type}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              )}
              {(whereSelectedLocations.length > 0 || whereQuery.trim()) && (
                <div className="trip-details__where-chip-wrap">
                  {whereSelectedLocations.map((loc) => {
                    const countryCode = loc.country
                      ? (countriesData.find((c) => c.name === loc.country)?.id ?? (loc.type === 'Country' ? loc.id : null))
                      : (loc.type === 'Country' ? loc.id : null);
                    const flag = countryCode ? countryCodeToFlag(countryCode) : '';
                    return (
                      <span key={loc.id} className="trip-details__where-chip">
                        {flag && <span className="trip-details__where-chip-flag" aria-hidden>{flag}</span>}
                        {loc.name}
                        <button
                          type="button"
                          className="trip-details__where-chip-remove"
                          aria-label={`Remove ${loc.name}`}
                          onClick={() => setWhereSelectedLocations((prev) => prev.filter((l) => l.id !== loc.id))}
                        >
                          <X size={14} aria-hidden />
                        </button>
                      </span>
                    );
                  })}
                  {whereQuery.trim() && (
                    <span className="trip-details__where-chip trip-details__where-chip--pending">
                      {whereQuery.trim()}
                      <button
                        type="button"
                        className="trip-details__where-chip-remove"
                        aria-label="Clear"
                        onClick={() => setWhereQuery('')}
                      >
                        <X size={14} aria-hidden />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="trip-details__where-modal-actions">
              <button type="button" className="trip-details__modal-cancel" onClick={() => setWhereModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="trip-details__modal-update"
                onClick={() => {
                  const pending = whereQuery.trim();
                  const list = pending
                    ? [...whereSelectedLocations, { id: `where-new-${Date.now()}`, name: pending, country: undefined }]
                    : whereSelectedLocations;
                  const locationsStr = list.length > 0
                    ? list.map((l) => (l.country ? `${l.name}, ${l.country}` : l.name)).join('; ')
                    : '';
                  const newDestination = list.length > 0 ? list[0].name : '';

                  // Close modal first for immediate feedback
                  setWhereModalOpen(false);

                  // Update local state immediately for instant UI update
                  setLocalDestination(newDestination);
                  setLocalLocations(locationsStr);

                  (async () => {
                    try {
                      const updated = await updateItinerary(tripId, {
                        destination: newDestination,
                        locations: locationsStr,
                      });
                      if (updated) setServerItinerary(updated);
                      setLocationUpdateKey((prev) => prev + 1);
                      toast.success('Changes saved', { id: 'trip-details-saved' });
                    } catch (e) {
                      console.error(e);
                      setFriendlyDialog({
                        open: true,
                        title: 'Could not update destination',
                        message: e?.message || 'Please try again.',
                        showCancel: false,
                        confirmText: 'OK',
                        cancelText: 'Cancel',
                        onConfirm: null,
                      });
                    }
                  })();
                }}
              >
                Update
              </button>
            </div>
          </div>
        </>
      )}

      {notesModalOpen && (
        <>
          <button
            type="button"
            className="trip-details__modal-backdrop"
            aria-label="Close"
            onClick={() => setNotesModalOpen(false)}
          />
          <div className="trip-details__notes-modal" role="dialog" aria-labelledby="notes-modal-title" aria-modal="true">
            <div className="trip-details__notes-modal-head">
              <h2 id="notes-modal-title" className="trip-details__notes-modal-title">Notes & Documents</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setNotesModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="trip-details__notes-tabs">
              <button
                type="button"
                className={`trip-details__notes-tab ${notesActiveTab === 'general' ? 'trip-details__notes-tab--active' : ''}`}
                onClick={() => setNotesActiveTab('general')}
              >
                General
              </button>
              {days.map((day, idx) => (
                <button
                  key={day.date}
                  type="button"
                  className={`trip-details__notes-tab ${notesActiveTab === `day-${idx}` ? 'trip-details__notes-tab--active' : ''}`}
                  onClick={() => setNotesActiveTab(`day-${idx}`)}
                >
                  Day {idx + 1}
                </button>
              ))}
              {days.length > 5 && (
                <span className="trip-details__notes-tab-arrow" aria-hidden><ChevronRight size={16} /></span>
              )}
            </div>
            <div className="trip-details__notes-content">
              {notesActiveTab === 'general' && (
                <div className="trip-details__notes-general">
                  <h3 className="trip-details__notes-section-title">General notes</h3>
                  <div className="trip-details__notes-toolbar">
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Bold" title="Bold"><Bold size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Italic" title="Italic"><Italic size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Underline" title="Underline"><Underline size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Link" title="Insert link"><LinkIcon size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Heading 1" title="Heading 1"><Heading1 size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Heading 2" title="Heading 2"><Heading2 size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Bullet list" title="Bullet list"><List size={16} /></button>
                    <button type="button" className="trip-details__notes-toolbar-btn" aria-label="Numbered list" title="Numbered list"><ListOrdered size={16} /></button>
                  </div>
                  <div className="trip-details__notes-general-wrap">
                    <textarea
                      className="trip-details__notes-textarea"
                      placeholder="Write a note..."
                      value={generalNotes}
                      onChange={(e) => setGeneralNotes(e.target.value)}
                      rows={10}
                    />
                    <label className="trip-details__notes-attach-label">
                      <Paperclip size={18} aria-hidden />
                      <span>Attach files</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        className="trip-details__notes-attach-input"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files?.length) return;
                          const toAdd = Array.from(files).map((f) => createAttachmentFromFile(f)).slice(0, 5 - generalAttachments.length);
                          setGeneralAttachments((prev) => [...prev, ...toAdd].slice(0, 5));
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {generalAttachments.length > 0 && (
                      <ul className="trip-details__notes-attach-list">
                        {generalAttachments.map((att, ai) => (
                          <li key={ai} className="trip-details__notes-attach-item">
                            <Paperclip size={12} aria-hidden />
                            {att.url ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                            ) : (
                              att.name
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
              {notesActiveTab.startsWith('day-') && (() => {
                const dayIdx = parseInt(notesActiveTab.replace('day-', ''), 10);
                const day = days[dayIdx];
                const dayItems = (tripExpenseItems || []).filter((it) => it.date === day?.date);
                return (
                  <div className="trip-details__notes-day">
                    <h3 className="trip-details__notes-section-title">Day {dayIdx + 1} notes</h3>
                    {dayItems.length === 0 ? (
                      <p className="trip-details__notes-empty">No places or activities added for this day yet. Add items from the board to attach notes here.</p>
                    ) : (
                      <ul className="trip-details__notes-day-list">
                        {dayItems.map((item, i) => (
                          <li key={item.id} className="trip-details__notes-day-item">
                            <div className="trip-details__notes-day-item-header">
                              <span className="trip-details__notes-day-num" aria-hidden>{i + 1}</span>
                              <span className="trip-details__notes-day-name">{item.name}</span>
                              <label className="trip-details__notes-attach-label trip-details__notes-attach-label--inline">
                                <Paperclip size={16} aria-hidden />
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*,.pdf"
                                  className="trip-details__notes-attach-input"
                                  onChange={(e) => {
                                    const files = e.target.files;
                                    if (!files?.length) return;
                                    const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => createAttachmentFromFile(f));
                                    setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, attachments: [...(it.attachments || []), ...toAdd] } : it)));
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            </div>
                            <textarea
                              className="trip-details__notes-textarea trip-details__notes-textarea--item"
                              placeholder="Add notes and documents..."
                              value={item.notes ?? ''}
                              onChange={(e) => setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, notes: e.target.value } : it)))}
                              rows={3}
                            />
                            {(item.attachments?.length > 0) && (
                              <ul className="trip-details__notes-attach-list">
                                {item.attachments.map((att, ai) => (
                                  <li key={ai} className="trip-details__notes-attach-item">
                                    <Paperclip size={12} aria-hidden />
                                    {att.url ? (
                                      <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                                    ) : (
                                      att.name
                                    )}
                                  </li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </>
      )}

      {editPlaceItem && (() => {
        const item = tripExpenseItems.find((i) => i.id === editPlaceItem.id) ?? editPlaceItem;
        const isStayEditing = isStayItem(item);
        const stayWindow = isStayEditing ? getStayWindow(item) : null;
        const update = (updates) => setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updates } : it)));
        const updateStayWindow = (updates) => {
          const nextCheckInDate = updates.checkInDate ?? (stayWindow?.checkInDate || item.date || '');
          const nextCheckInTime = updates.checkInTime ?? (stayWindow?.checkInTime || item.startTime || '15:00');
          const nextCheckOutDate = updates.checkOutDate ?? (stayWindow?.checkOutDate || nextCheckInDate);
          const nextCheckOutTime = updates.checkOutTime ?? (stayWindow?.checkOutTime || nextCheckInTime);

          const checkIn = parseDateTimeLocal(nextCheckInDate, nextCheckInTime);
          const checkOut = parseDateTimeLocal(nextCheckOutDate, nextCheckOutTime);
          const durationUpdates = {};
          if (checkIn && checkOut && checkOut > checkIn) {
            const durationMinutes = Math.max(0, Math.round((checkOut.getTime() - checkIn.getTime()) / (1000 * 60)));
            const durationParts = durationMinutesToParts(durationMinutes);
            durationUpdates.durationHrs = durationParts.durationHrs;
            durationUpdates.durationMins = durationParts.durationMins;
          }

          update({
            ...updates,
            date: nextCheckInDate,
            startTime: nextCheckInTime,
            ...durationUpdates,
          });
        };
        return (
          <>
            <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setEditPlaceItem(null)} />
            <div className="trip-details__edit-place-modal" role="dialog" aria-labelledby="edit-place-title" aria-modal="true">
              <div className="trip-details__edit-place-head">
                <h2 id="edit-place-title" className="trip-details__edit-place-title">{isStayEditing ? 'Edit Stay' : 'Edit Place'}</h2>
                <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setEditPlaceItem(null)}>
                  <X size={20} aria-hidden />
                </button>
              </div>
              <div className="trip-details__edit-place-body">
                <div className="trip-details__edit-place-overview">
                  {item.placeImageUrl && (
                    <img src={resolveImageUrl(item.placeImageUrl, item.name, isStayEditing ? 'hotel' : 'landmark')} alt="" className="trip-details__edit-place-thumb" onError={handleImageError} />
                  )}
                  <div className="trip-details__edit-place-meta">
                    <span className="trip-details__edit-place-type">{isStayEditing ? 'Stay' : 'Place'}</span>
                    <h3 className="trip-details__edit-place-name">{item.name}</h3>
                    {(item.rating != null || item.reviewCount != null) && (
                      <p className="trip-details__edit-place-rating">
                        {[item.rating != null && item.rating, item.reviewCount != null && `${item.reviewCount.toLocaleString()} reviews`].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="trip-details__edit-place-address">{item.detail || '—'}</p>
                    {canOpenInternalItemOverview(item) ? (
                      <button
                        type="button"
                        className="trip-details__edit-place-view-details trip-details__edit-place-view-details--button"
                        onClick={() => openInternalItemOverview(item)}
                      >
                        View details
                      </button>
                    ) : (
                      <span className="trip-details__edit-place-view-details trip-details__edit-place-view-details--muted">View details</span>
                    )}
                  </div>
                </div>
                <div className="trip-details__edit-place-fields">
                  {isStayEditing ? (
                    <>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Check-in date <span className="trip-details__edit-place-required">*</span></span>
                        <input
                          type="date"
                          className="trip-details__edit-place-input"
                          value={stayWindow?.checkInDate || ''}
                          onChange={(e) => updateStayWindow({ checkInDate: e.target.value })}
                          required
                        />
                      </label>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Check-in time <span className="trip-details__edit-place-required">*</span></span>
                        <span className="trip-details__edit-place-input-wrap">
                          <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                          <input
                            type="time"
                            className="trip-details__edit-place-input"
                            value={stayWindow?.checkInTime || '15:00'}
                            onChange={(e) => updateStayWindow({ checkInTime: e.target.value })}
                          />
                        </span>
                      </label>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Check-out date <span className="trip-details__edit-place-required">*</span></span>
                        <input
                          type="date"
                          className="trip-details__edit-place-input"
                          value={stayWindow?.checkOutDate || ''}
                          onChange={(e) => updateStayWindow({ checkOutDate: e.target.value })}
                          required
                        />
                      </label>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Check-out time <span className="trip-details__edit-place-required">*</span></span>
                        <span className="trip-details__edit-place-input-wrap">
                          <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                          <input
                            type="time"
                            className="trip-details__edit-place-input"
                            value={stayWindow?.checkOutTime || '11:00'}
                            onChange={(e) => updateStayWindow({ checkOutTime: e.target.value })}
                          />
                        </span>
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Date <span className="trip-details__edit-place-required">*</span></span>
                        <select
                          className="trip-details__edit-place-select"
                          value={item.date || ''}
                          onChange={(e) => update({ date: e.target.value })}
                          required
                        >
                          {days.map((d) => (
                            <option key={d.date} value={d.date}>Day {d.dayNum}: {formatDayDate(d.date)}</option>
                          ))}
                        </select>
                      </label>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Start time <span className="trip-details__edit-place-required">*</span></span>
                        <span className="trip-details__edit-place-input-wrap">
                          <Clock size={18} className="trip-details__edit-place-input-icon" aria-hidden />
                          <input
                            type="time"
                            className="trip-details__edit-place-input"
                            value={item.startTime || '07:00'}
                            onChange={(e) => update({ startTime: e.target.value })}
                          />
                        </span>
                      </label>
                      <label className="trip-details__edit-place-label">
                        <span className="trip-details__edit-place-label-text">Duration <span className="trip-details__edit-place-required">*</span></span>
                        <div className="trip-details__edit-place-duration">
                          <input
                            type="number"
                            min={0}
                            max={23}
                            className="trip-details__edit-place-duration-input"
                            value={item.durationHrs ?? 1}
                            onChange={(e) => update({ durationHrs: Number(e.target.value) || 0 })}
                            aria-label="Hours"
                          />
                          <span className="trip-details__edit-place-duration-sep">hrs</span>
                          <span className="trip-details__edit-place-duration-colon">:</span>
                          <input
                            type="number"
                            min={0}
                            max={59}
                            className="trip-details__edit-place-duration-input"
                            value={item.durationMins ?? 0}
                            onChange={(e) => update({ durationMins: Number(e.target.value) || 0 })}
                            aria-label="Minutes"
                          />
                          <span className="trip-details__edit-place-duration-sep">mins</span>
                        </div>
                      </label>
                    </>
                  )}
                  <label className="trip-details__edit-place-label">
                    Note (Optional)
                    <textarea
                      className="trip-details__edit-place-textarea"
                      placeholder="Add a note..."
                      value={item.notes ?? ''}
                      onChange={(e) => update({ notes: e.target.value })}
                      rows={3}
                    />
                  </label>
                  <label className="trip-details__edit-place-label">
                    Cost (Optional)
                    <span className="trip-details__edit-place-cost-wrap">
                      <span className="trip-details__edit-place-cost-prefix">{currency} $</span>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        className="trip-details__edit-place-input"
                        value={item.total ?? ''}
                        onChange={(e) => {
                          const v = e.target.value;
                          update({ total: v === '' ? null : Number(v) });
                        }}
                      />
                    </span>
                  </label>
                  <label className="trip-details__edit-place-label">
                    External link (optional)
                    <span className="trip-details__edit-place-input-wrap trip-details__edit-place-input-wrap--prefix">
                      <span className="trip-details__edit-place-prefix">https://</span>
                      <input
                        type="text"
                        className="trip-details__edit-place-input"
                        placeholder="Type or paste the activity link"
                        value={(item.externalLink || '').replace(/^https?:\/\//i, '')}
                        onChange={(e) => {
                          const v = e.target.value.trim();
                          update({ externalLink: v ? `https://${v.replace(/^https?:\/\//i, '')}` : '' });
                        }}
                      />
                    </span>
                  </label>
                  <div className="trip-details__edit-place-docs">
                    <h4 className="trip-details__edit-place-docs-title">Travel Documents</h4>
                    <p className="trip-details__edit-place-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
                    <label className="trip-details__edit-place-attach-label">
                      <Paperclip size={18} aria-hidden />
                      Attach files
                      <input
                        type="file"
                        multiple
                        accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                        className="trip-details__notes-attach-input"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (!files?.length) return;
                          const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => createAttachmentFromFile(f));
                          update({ attachments: [...(item.attachments || []), ...toAdd].slice(0, 3) });
                          e.target.value = '';
                        }}
                      />
                    </label>
                    {(item.attachments?.length > 0) && (
                      <ul className="trip-details__notes-attach-list">
                        {item.attachments.map((att, ai) => (
                          <li key={ai} className="trip-details__notes-attach-item">
                            <Paperclip size={12} aria-hidden />
                            {att.url ? (
                              <a href={att.url} target="_blank" rel="noopener noreferrer">{att.name}</a>
                            ) : (
                              att.name
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
              <div className="trip-details__edit-place-actions">
                <button
                  type="button"
                  className="trip-details__edit-place-delete"
                  onClick={() => {
                    setPendingDeleteItemId(item.id);
                  }}
                >
                  <Trash2 size={18} aria-hidden />
                  Delete
                </button>
                <div className="trip-details__edit-place-actions-right">
                  <button type="button" className="trip-details__modal-cancel" onClick={() => setEditPlaceItem(null)}>Cancel</button>
                  <button type="button" className="trip-details__edit-place-save" onClick={() => setEditPlaceItem(null)}>Save</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {pendingDeleteItemId && (
        <>
          <button
            type="button"
            className="trip-details__modal-backdrop"
            aria-label="Close"
            onClick={() => setPendingDeleteItemId(null)}
          />
          <div className="trip-details__delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
            <h3 id="delete-confirm-title" className="trip-details__delete-confirm-title">Delete saved place?</h3>
            <p className="trip-details__delete-confirm-text">This will remove the item from your itinerary.</p>
            <div className="trip-details__delete-confirm-actions">
              <button type="button" className="trip-details__modal-cancel" onClick={() => setPendingDeleteItemId(null)}>Cancel</button>
              <button
                type="button"
                className="trip-details__modal-delete"
                onClick={() => {
                  setTripExpenseItems((prev) => prev.filter((it) => it.id !== pendingDeleteItemId));
                  setPendingDeleteItemId(null);
                  setEditPlaceItem(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </>
      )}

      {optimizeRouteModalOpen && optimizeRouteDay && (() => {
        const dayItems = getSortedDayItems(tripExpenseItems, optimizeRouteDay.date).filter((item) => !isStayItem(item));
        const startItem = dayItems.find((i) => i.id === optimizeRouteStartId) || dayItems[0];
        const endItem = dayItems.find((i) => i.id === optimizeRouteEndId) || dayItems[dayItems.length - 1];
        return (
          <>
            <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setOptimizeRouteModalOpen(false)} />
            <div className="trip-details__optimize-route-modal" role="dialog" aria-labelledby="optimize-route-title" aria-modal="true">
              <div className="trip-details__optimize-route-head">
                <h2 id="optimize-route-title" className="trip-details__optimize-route-title">Optimize Route</h2>
                {optimizationsLeft >= 0 && (
                  <span className="trip-details__optimize-route-count">{optimizationsLeft} Optimizations Left</span>
                )}
                <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setOptimizeRouteModalOpen(false)}>
                  <X size={20} aria-hidden />
                </button>
              </div>
              <p className="trip-details__optimize-route-desc">
                Select a start and end point, and we&apos;ll automatically rearrange everything in between based on proximity to ensure you get the best route possible. If you change your mind, you can revert back to your original route.
              </p>
              <p className="trip-details__optimize-route-day-label">Day {optimizeRouteDay.dayNum}: {optimizeRouteDay.label}</p>
              <div className="trip-details__optimize-route-fields">
                <label className="trip-details__optimize-route-label">
                  Start Point
                  <select
                    className="trip-details__optimize-route-select"
                    value={optimizeRouteStartId}
                    onChange={(e) => setOptimizeRouteStartId(e.target.value)}
                  >
                    {dayItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
                <label className="trip-details__optimize-route-label">
                  End Point
                  <select
                    className="trip-details__optimize-route-select"
                    value={optimizeRouteEndId}
                    onChange={(e) => setOptimizeRouteEndId(e.target.value)}
                  >
                    {dayItems.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="trip-details__optimize-route-actions">
                <button type="button" className="trip-details__modal-cancel" onClick={() => setOptimizeRouteModalOpen(false)}>Cancel</button>
                <button
                  type="button"
                  className="trip-details__optimize-route-submit"
                  disabled={optimizationsLeft <= 0}
                  onClick={() => {
                    if (!optimizeRouteDay || !startItem || !endItem || dayItems.length < 2 || optimizationsLeft <= 0) { setOptimizeRouteModalOpen(false); return; }
                    const reordered = reorderByProximity(dayItems, optimizeRouteStartId, optimizeRouteEndId);
                    const startTimes = [];
                    let timeMins = 8 * 60;
                    reordered.forEach((it, i) => {
                      const hrs = Math.floor(timeMins / 60);
                      const mins = timeMins % 60;
                      startTimes.push({ id: it.id, startTime: `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}` });
                      const durationMins = (it.durationHrs ?? 1) * 60 + (it.durationMins ?? 0);
                      timeMins += Math.max(durationMins, 30);
                    });
                    setTripExpenseItems((prev) => prev.map((it) => {
                      const assigned = startTimes.find((s) => s.id === it.id);
                      return assigned ? { ...it, startTime: assigned.startTime } : it;
                    }));
                    setOptimizationsLeft((n) => Math.max(0, n - 1));
                    setOptimizeRouteModalOpen(false);
                  }}
                >
                  Optimize
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {publicTransportModalOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setPublicTransportModalOpen(false)} />
          <div className="trip-details__public-transport-modal" role="dialog" aria-labelledby="public-transport-title" aria-modal="true">
            <div className="trip-details__public-transport-head">
              <MapPin size={24} className="trip-details__public-transport-head-icon" aria-hidden />
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setPublicTransportModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <h2 id="public-transport-title" className="trip-details__public-transport-title">Public Transport Directions</h2>
            <p className="trip-details__public-transport-subtitle">See detailed MRT, bus, and train routes between places.</p>
            
            {publicTransportLoading && (
              <div className="trip-details__public-transport-loading">
                <p>Loading transit directions...</p>
              </div>
            )}
            
            {!publicTransportLoading && !publicTransportDirections && (
              <div className="trip-details__public-transport-error">
                <p>No public transport routes available for this journey.</p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--wtg-text-muted)' }}>
                  This could happen if the locations are too far apart, in different transit systems, or don't have direct public transport connections. Try using driving, walking, or cycling instead.
                </p>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--wtg-text-muted)' }}>
                  <em>Note: Check your browser console (F12) for technical details.</em>
                </p>
              </div>
            )}
            
            {!publicTransportLoading && publicTransportDirections && (
              <div className="trip-details__public-transport-route">
                {/* Departure location */}
                <div className="trip-details__public-transport-step">
                  <span className="trip-details__public-transport-dot" aria-hidden />
                  <div>
                    <strong className="trip-details__public-transport-step-title">Departure location</strong>
                    <p className="trip-details__public-transport-step-detail">{publicTransportSegment.fromName || 'Departure address'}</p>
                  </div>
                </div>
                
                {/* Render each step from directions */}
                {publicTransportDirections.legs?.[0]?.steps?.map((step, stepIdx) => {
                  const travelMode = step.travel_mode;
                  const isTransit = travelMode === 'TRANSIT';
                  const isWalking = travelMode === 'WALKING';
                  const transitDetails = step.transit_details || step.transitDetails || step.transit || null;
                  const distance = step.distance?.text || '';
                  const duration = step.duration?.text || '';
                  
                  return (
                    <div key={stepIdx}>
                      <div className="trip-details__public-transport-connector" />
                      
                      {isWalking && (
                        <div className="trip-details__public-transport-step trip-details__public-transport-step--walk">
                          <Footprints size={18} aria-hidden />
                          <span>Walk</span>
                          <span className="trip-details__public-transport-step-meta">
                            {duration} ({distance})
                          </span>
                        </div>
                      )}
                      
                      {isTransit && transitDetails && (
                        <>
                          {/* Departure station */}
                          <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                          <div className="trip-details__public-transport-step">
                            <span className="trip-details__public-transport-dot trip-details__public-transport-dot--highlight" aria-hidden />
                            <strong className="trip-details__public-transport-step-title">
                              {transitDetails.departure_stop?.name || transitDetails.departureStop?.name || 'Station'}
                            </strong>
                          </div>
                          
                          {/* Transit leg */}
                          <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                          <div className="trip-details__public-transport-step trip-details__public-transport-step--transit">
                            {(() => {
                              const vehicleType = (transitDetails.line?.vehicle?.type || '').toLowerCase();
                              const TransitIcon = vehicleType.includes('bus') ? Bus : Train;
                              return <TransitIcon size={18} aria-hidden />;
                            })()}
                            {transitDetails.line?.short_name && (
                              <span 
                                className="trip-details__public-transport-line"
                                style={{
                                  backgroundColor: transitDetails.line.color
                                    ? (transitDetails.line.color.startsWith('#') ? transitDetails.line.color : `#${transitDetails.line.color}`)
                                    : '#dc2626',
                                  color: transitDetails.line.text_color
                                    ? (transitDetails.line.text_color.startsWith('#') ? transitDetails.line.text_color : `#${transitDetails.line.text_color}`)
                                    : '#ffffff'
                                }}
                              >
                                {transitDetails.line.short_name}
                              </span>
                            )}
                            <span>
                              {transitDetails.line?.name || transitDetails.line?.vehicle?.name || 'Transit'}
                            </span>
                            <span className="trip-details__public-transport-step-meta">
                              {duration} ({distance})
                              {(transitDetails.num_stops || transitDetails.numStops) && ` • ${transitDetails.num_stops || transitDetails.numStops} stops`}
                            </span>
                          </div>
                          
                          {/* Arrival station */}
                          <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                          <div className="trip-details__public-transport-step">
                            <span className="trip-details__public-transport-dot" aria-hidden />
                            <strong className="trip-details__public-transport-step-title">
                              {transitDetails.arrival_stop?.name || transitDetails.arrivalStop?.name || 'Station'}
                            </strong>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                
                {/* Final connector and arrival location */}
                <div className="trip-details__public-transport-step">
                  <span className="trip-details__public-transport-dot" aria-hidden />
                  <div>
                    <strong className="trip-details__public-transport-step-title">Arrival location</strong>
                    <p className="trip-details__public-transport-step-detail">{publicTransportSegment.toName || 'Arrival address'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {mapDayFilterOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setMapDayFilterOpen(false)} />
          <div className="trip-details__filter-days-modal" role="dialog" aria-labelledby="filter-days-title" aria-modal="true">
            <div className="trip-details__filter-days-head">
              <h2 id="filter-days-title" className="trip-details__filter-days-title">Filter days on map</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setMapDayFilterOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <p className="trip-details__filter-days-hint">Show pindrops for selected days only.</p>
            <div className="trip-details__filter-days-actions">
              <button type="button" className="trip-details__filter-days-btn" onClick={() => setMapDayFilterSelected(allDayNums)}>Select all</button>
              <button type="button" className="trip-details__filter-days-btn" onClick={() => setMapDayFilterSelected([])}>Clear</button>
            </div>
            <ul className="trip-details__filter-days-list">
              {days.map((day) => {
                const selected = (mapDayFilterSelected.length ? mapDayFilterSelected : allDayNums).includes(day.dayNum);
                return (
                  <li key={day.dayNum}>
                    <button
                      type="button"
                      className={`trip-details__filter-days-item ${selected ? 'trip-details__filter-days-item--selected' : ''}`}
                      onClick={() => toggleMapDay(day.dayNum)}
                      aria-pressed={selected}
                    >
                      <span className="trip-details__filter-days-check">{selected ? <Check size={16} aria-hidden /> : null}</span>
                      Day {day.dayNum}: {day.label}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="trip-details__filter-days-footer">
              <button type="button" className="trip-details__modal-update" onClick={() => setMapDayFilterOpen(false)}>Done</button>
            </div>
          </div>
        </>
      )}

      {addTransportOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddTransportOpen(false)} />
          <div className="trip-details__add-transport-modal" role="dialog" aria-labelledby="add-transport-title" aria-modal="true">
            <div className="trip-details__add-transport-head">
              <h2 id="add-transport-title" className="trip-details__add-transport-title">Add Transport</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddTransportOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="trip-details__add-transport-tabs">
              {['Flights', 'Trains', 'Buses'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`trip-details__add-transport-tab ${addTransportTab === tab ? 'trip-details__add-transport-tab--active' : ''}`}
                  onClick={() => setAddTransportTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="trip-details__add-transport-body">
              {addTransportTab === 'Flights' && (
                <>
                  <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight" style={{ marginBottom: '12px' }}>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Home country</label>
                      <select className="trip-details__add-transport-input" value={transportHomeCountry} onChange={(e) => setTransportHomeCountry(e.target.value)}>
                        {availableTransportCountries.map((countryName) => (
                          <option key={countryName} value={countryName}>{countryName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Destination country</label>
                      <input type="text" className="trip-details__add-transport-input" value={destinationCountry || 'Unknown'} readOnly />
                    </div>
                  </div>
                  <p className="trip-details__add-transport-hint">Enter your flight number below and we&apos;ll automatically get its details</p>
                  <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight">
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Flight code</label>
                      <input
                        type="text"
                        className="trip-details__add-transport-input"
                        placeholder="eg. UA1, AA100, DL250"
                        value={flightCode}
                        onChange={(e) => {
                          setFlightCode(e.target.value);
                          setFlightSearchError('');
                          setFlightSearchResults([]);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchFlights();
                          }
                        }}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Depart date</label>
                      <input
                        type="date"
                        className="trip-details__add-transport-input"
                        value={flightDepartDate}
                        onChange={(e) => {
                          setFlightDepartDate(e.target.value);
                          setFlightSearchError('');
                          setFlightSearchResults([]);
                        }}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchFlights();
                          }
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-transport-search"
                      aria-label="Search flight"
                      onClick={searchFlights}
                      disabled={flightSearchLoading}
                    >
                      <Search size={20} aria-hidden />
                    </button>
                  </div>

                  {flightSearchLoading && (
                    <div className="trip-details__add-transport-loading">
                      <div className="trip-details__add-transport-spinner" />
                      <p>Searching for flights...</p>
                    </div>
                  )}

                  {flightSearchError && (
                    <div className="trip-details__add-transport-error">
                      <Info size={18} aria-hidden />
                      <p>{flightSearchError}</p>
                    </div>
                  )}

                  {flightSearchResults.length > 0 && (
                    <div className="trip-details__add-transport-results">
                      <p className="trip-details__add-transport-results-title">{flightSearchResults.length} result{flightSearchResults.length > 1 ? 's' : ''} found</p>
                      {flightSearchResults.map((flight) => {
                        // Times are already formatted as HH:MM from the mapping
                        const depTimeStr = flight.departure_time || '--:--';
                        const arrTimeStr = flight.arrival_time || '--:--';
                        
                        // Calculate display duration
                        let durationText = '';
                        if (flight.durationMinutes && flight.durationMinutes > 0) {
                          const hours = Math.floor(flight.durationMinutes / 60);
                          const mins = flight.durationMinutes % 60;
                          durationText = `${hours}h ${mins}m`;
                        }
                        
                        // Format status for display. If selected date is in the future,
                        // treat provider "landed/arrived" as scheduled to avoid confusing UX.
                        const rawStatus = String(flight.status || 'scheduled').toUpperCase();
                        const now = new Date();
                        const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const isFutureFlightDate = Boolean(flight.flight_date && flight.flight_date > todayYmd);
                        const normalizedStatus = (isFutureFlightDate && (rawStatus === 'LANDED' || rawStatus === 'ARRIVED'))
                          ? 'SCHEDULED'
                          : rawStatus;
                        const statusClass = normalizedStatus.toLowerCase();
                        const statusText = normalizedStatus;

                        return (
                          <div key={flight.id} className="trip-details__add-transport-result-card trip-details__add-transport-result-card--compact">
                            <div className="trip-details__add-transport-result-header trip-details__add-transport-result-header--compact">
                              <div className="trip-details__add-transport-result-airline">
                                <Plane size={20} aria-hidden />
                                <div>
                                  <strong>{flight.airline}</strong>
                                  <span className="trip-details__add-transport-result-code">{flight.flight_code}</span>
                                </div>
                              </div>
                              <span className={`trip-details__add-transport-result-status trip-details__add-transport-result-status--${statusClass}`}>
                                {statusText}
                              </span>
                            </div>

                            <div className="trip-details__add-transport-result-route trip-details__add-transport-result-route--compact">
                              <div className="trip-details__add-transport-result-location">
                                <strong className="trip-details__add-transport-result-time">
                                  {depTimeStr}
                                </strong>
                                <span className="trip-details__add-transport-result-airport">{flight.departure_airport}</span>
                                <span className="trip-details__add-transport-result-city">{flight.departure_city}</span>
                                {flight.terminal !== 'N/A' && (
                                  <span className="trip-details__add-transport-result-terminal">Terminal {flight.terminal}{flight.gate !== 'N/A' ? `, Gate ${flight.gate}` : ''}</span>
                                )}
                              </div>

                              <div className="trip-details__add-transport-result-duration">
                                <div className="trip-details__add-transport-result-line">
                                  <Plane size={16} aria-hidden />
                                </div>
                                <span className="trip-details__add-transport-result-time-info">
                                  {durationText}
                                </span>
                              </div>

                              <div className="trip-details__add-transport-result-location">
                                <strong className="trip-details__add-transport-result-time">
                                  {arrTimeStr}
                                </strong>
                                <span className="trip-details__add-transport-result-airport">{flight.arrival_airport}</span>
                                <span className="trip-details__add-transport-result-city">{flight.arrival_city}</span>
                              </div>

                              <button
                                type="button"
                                className="trip-details__add-transport-result-add trip-details__add-transport-result-add--compact"
                                onClick={() => {
                                  const name = `${flight.departure_airport} → ${flight.arrival_airport} (${flight.flight_code})`;

                                  appendTransportTripItem({
                                    id: `flight-${flight.id}-${Date.now()}`,
                                    name,
                                    total: 0,
                                    date: flight.flight_date,
                                    detail: `${flight.airline} ${flight.flight_code} | Departs ${depTimeStr}, Arrives ${arrTimeStr}`,
                                    startTime: depTimeStr || '',
                                    durationHrs: Math.floor((flight.durationMinutes || 0) / 60),
                                    durationMins: (flight.durationMinutes || 0) % 60,
                                    Icon: Plane,
                                    notes: `Terminal: ${flight.terminal}, Gate: ${flight.gate}${flight.aircraft ? `, Aircraft: ${flight.aircraft}` : ''}`,
                                    transportType: 'flight',
                                  });

                                  setFlightSearchResults([]);
                                  setFlightCode('');
                                  setFlightDepartDate('');
                                  setAddTransportOpen(false);
                                }}
                              >
                                Add to trip
                              </button>
                            </div>

                            {flight.aircraft && flight.aircraft !== 'N/A' ? (
                              <div className="trip-details__add-transport-result-aircraft trip-details__add-transport-result-aircraft--compact">
                                <span>Aircraft: {flight.aircraft}</span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {(addTransportTab === 'Trains' || addTransportTab === 'Buses') && (
                <>
                  <p className="trip-details__add-transport-hint">Add your {addTransportTab.toLowerCase()} reservations below.</p>
                  <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight">
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">From</label>
                      <div className="trip-details__custom-transport-autofill-wrap">
                        <input
                          type="text"
                          className="trip-details__add-transport-input"
                          placeholder="City, station, or terminal"
                          value={surfaceFrom}
                          onChange={(e) => { 
                            const value = e.target.value;
                            setSurfaceFrom(value); 
                            setSurfaceFromSuggestionsOpen(true);
                            fetchPlacesPredictions(value, setSurfaceFromPredictions);
                          }}
                          onFocus={() => setSurfaceFromSuggestionsOpen(true)}
                          onBlur={() => setTimeout(() => setSurfaceFromSuggestionsOpen(false), 200)}
                        />
                        {surfaceFromSuggestionsOpen && surfaceFrom.trim() && (
                          <ul className="trip-details__custom-transport-suggestions">
                            {surfaceFromPredictions.length > 0 ? (
                              surfaceFromPredictions.map((prediction) => (
                                <li key={prediction.place_id}>
                                  <button
                                    type="button"
                                    className="trip-details__custom-transport-suggestion-item"
                                    onMouseDown={() => {
                                      setSurfaceFrom(prediction.description);
                                      setSurfaceFromSuggestionsOpen(false);
                                      setSurfaceFromPredictions([]);
                                    }}
                                  >
                                    <MapPin size={16} aria-hidden />
                                    <div className="trip-details__custom-transport-suggestion-text">
                                      <span className="trip-details__custom-transport-suggestion-name">{prediction.structured_formatting?.main_text || prediction.description}</span>
                                      <span className="trip-details__custom-transport-suggestion-type">{prediction.structured_formatting?.secondary_text || 'Location'}</span>
                                    </div>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                  onMouseDown={() => {
                                    setSurfaceFromSuggestionsOpen(false);
                                  }}
                                >
                                  <MapPin size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{surfaceFrom}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                  </div>
                                </button>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">To</label>
                      <div className="trip-details__custom-transport-autofill-wrap">
                        <input
                          type="text"
                          className="trip-details__add-transport-input"
                          placeholder="City, station, or terminal"
                          value={surfaceTo}
                          onChange={(e) => { 
                            const value = e.target.value;
                            setSurfaceTo(value); 
                            setSurfaceToSuggestionsOpen(true);
                            fetchPlacesPredictions(value, setSurfaceToPredictions);
                          }}
                          onFocus={() => setSurfaceToSuggestionsOpen(true)}
                          onBlur={() => setTimeout(() => setSurfaceToSuggestionsOpen(false), 200)}
                        />
                        {surfaceToSuggestionsOpen && surfaceTo.trim() && (
                          <ul className="trip-details__custom-transport-suggestions">
                            {surfaceToPredictions.length > 0 ? (
                              surfaceToPredictions.map((prediction) => (
                                <li key={prediction.place_id}>
                                  <button
                                    type="button"
                                    className="trip-details__custom-transport-suggestion-item"
                                    onMouseDown={() => {
                                      setSurfaceTo(prediction.description);
                                      setSurfaceToSuggestionsOpen(false);
                                      setSurfaceToPredictions([]);
                                    }}
                                  >
                                    <MapPin size={16} aria-hidden />
                                    <div className="trip-details__custom-transport-suggestion-text">
                                      <span className="trip-details__custom-transport-suggestion-name">{prediction.structured_formatting?.main_text || prediction.description}</span>
                                      <span className="trip-details__custom-transport-suggestion-type">{prediction.structured_formatting?.secondary_text || 'Location'}</span>
                                    </div>
                                  </button>
                                </li>
                              ))
                            ) : (
                              <li>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                  onMouseDown={() => {
                                    setSurfaceToSuggestionsOpen(false);
                                  }}
                                >
                                  <MapPin size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{surfaceTo}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                  </div>
                                </button>
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Date</label>
                      <input
                        type="date"
                        className="trip-details__add-transport-input"
                        value={surfaceDate}
                        onChange={(e) => setSurfaceDate(e.target.value)}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Departure time</label>
                      <input
                        type="time"
                        className="trip-details__add-transport-input"
                        value={surfaceTime}
                        onChange={(e) => setSurfaceTime(e.target.value)}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Arrival time</label>
                      <input
                        type="time"
                        className="trip-details__add-transport-input"
                        value={surfaceArrivalTime}
                        onChange={(e) => setSurfaceArrivalTime(e.target.value)}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Operator</label>
                      <input
                        type="text"
                        className="trip-details__add-transport-input"
                        placeholder={addTransportTab === 'Trains' ? 'e.g. JR East, SNCF' : 'e.g. FlixBus'}
                        value={surfaceOperator}
                        onChange={(e) => setSurfaceOperator(e.target.value)}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">{addTransportTab === 'Trains' ? 'Train no.' : 'Bus no.'}</label>
                      <input
                        type="text"
                        className="trip-details__add-transport-input"
                        placeholder="Optional"
                        value={surfaceNumber}
                        onChange={(e) => setSurfaceNumber(e.target.value)}
                      />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Cost (optional)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="trip-details__add-transport-input"
                        placeholder="0.00"
                        value={surfaceCost}
                        onChange={(e) => setSurfaceCost(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="trip-details__add-transport-fields" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                    <button
                      type="button"
                      className="trip-details__add-transport-result-add"
                      onClick={() => {
                        if (!surfaceFrom.trim() || !surfaceTo.trim()) return;
                        const modeLabel = addTransportTab === 'Trains' ? 'Train' : 'Bus';
                        const Icon = addTransportTab === 'Trains' ? Train : Bus;

                        appendTransportTripItem({
                          id: `${modeLabel.toLowerCase()}-${Date.now()}`,
                          name: `${modeLabel}: ${surfaceFrom} → ${surfaceTo}`,
                          date: surfaceDate || days.find((d) => d.dayNum === addTransportDay)?.date || days[0]?.date,
                          detail: `${surfaceOperator || modeLabel}${surfaceNumber ? ` ${surfaceNumber}` : ''} · Dep ${surfaceTime} - Arr ${surfaceArrivalTime}`,
                          startTime: surfaceTime || '',
                          notes: '',
                          total: Number(surfaceCost || 0),
                          Icon,
                          transportType: modeLabel.toLowerCase(),
                        });

                        setSurfaceFrom('');
                        setSurfaceTo('');
                        setSurfaceFromSuggestionsOpen(false);
                        setSurfaceToSuggestionsOpen(false);
                        setSurfaceDate('');
                        setSurfaceTime('08:00');
                        setSurfaceArrivalTime('18:00');
                        setSurfaceOperator('');
                        setSurfaceNumber('');
                        setSurfaceCost('');
                        setAddTransportOpen(false);
                      }}
                    >
                      Add to trip
                    </button>
                  </div>
                </>
              )}
              {addTransportTab === 'Flights' && (
                <p className="trip-details__add-transport-manual">
                  Can&apos;t find what you need? <button type="button" className="trip-details__add-transport-manual-link" onClick={() => { setAddTransportOpen(false); setCustomTransportVehicle('Flight'); setAddCustomTransportOpen(true); }}>Add manually</button>
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {addCustomTransportOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddCustomTransportOpen(false)} />
          <div className="trip-details__custom-transport-modal" role="dialog" aria-labelledby="custom-transport-title" aria-modal="true">
            <div className="trip-details__custom-transport-head">
              <h2 id="custom-transport-title" className="trip-details__custom-transport-title">Add Manual Flight</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddCustomTransportOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-transport-form"
              onSubmit={(e) => {
                e.preventDefault();
                const costNum = parseFloat(customTransportCost) || 0;
                const detailParts = [
                  customTransportAirline || 'Flight',
                  customTransportFlightNumber ? `Flight ${customTransportFlightNumber}` : '',
                  customTransportDepartureTime ? `Dep ${customTransportDepartureTime}` : '',
                  customTransportArrivalDate || customTransportArrivalTime
                    ? `Arr ${customTransportArrivalDate || customTransportDepartureDate || ''} ${customTransportArrivalTime || ''}`.trim()
                    : '',
                ].filter(Boolean);
                setTripExpenseItems((prev) => [...prev, {
                  id: `transport-${Date.now()}`,
                  name: `${customTransportFrom || 'From'} → ${customTransportTo || 'To'}${customTransportFlightNumber ? ` (${customTransportFlightNumber})` : ''}`,
                  total: costNum,
                  categoryId: 'transportations',
                  category: 'Transportations',
                  date: customTransportDepartureDate || days[0]?.date,
                  detail: detailParts.join(' · '),
                  Icon: Plane,
                  startTime: customTransportDepartureTime || '08:00',
                  notes: [customTransportConfirmation ? `Confirmation: ${customTransportConfirmation}` : '', customTransportNote].filter(Boolean).join(' | '),
                  externalLink: customTransportExternalLink,
                  attachments: customTransportTravelDocs.map((file, idx) => ({
                    id: `transport-doc-${Date.now()}-${idx}`,
                    name: file?.name || `Document ${idx + 1}`,
                    size: file?.size || 0,
                    type: file?.type || '',
                  })),
                  transportType: 'flight',
                }]);
                setAddCustomTransportOpen(false);
                setCustomTransportName('');
                setCustomTransportFrom('');
                setCustomTransportTo('');
                setCustomTransportAirline('');
                setCustomTransportFlightNumber('');
                setCustomTransportDepartureDate('');
                setCustomTransportDepartureTime('08:00');
                setCustomTransportArrivalDate('');
                setCustomTransportArrivalTime('18:00');
                setCustomTransportDurationHrs(1);
                setCustomTransportDurationMins(0);
                setCustomTransportConfirmation('');
                setCustomTransportNote('');
                setCustomTransportCost('');
                setCustomTransportExternalLink('');
                setCustomTransportTravelDocs([]);
              }}
            >
              <div className="trip-details__custom-transport-upload">
                <input type="file" id="custom-transport-image" accept=".svg,.png,.jpg,.jpeg,.webp,.gif" className="trip-details__custom-transport-file-input" onChange={() => { }} />
                <label htmlFor="custom-transport-image" className="trip-details__custom-transport-upload-label">
                  <PlusCircle size={32} aria-hidden />
                  <span>Click to upload image or drag and drop</span>
                  <span className="trip-details__custom-transport-upload-hint">SVG, PNG, JPG, WEBP or GIF (max. 800×400px)</span>
                </label>
              </div>
              <label className="trip-details__custom-transport-label">
                Transport type
                <input type="text" className="trip-details__custom-transport-input" value="Flight" readOnly />
              </label>
              {(customTransportVehicle === 'Train' || customTransportVehicle === 'Bus') && (
                <>
                  <label className="trip-details__custom-transport-label">
                    Transportation name <span className="trip-details__custom-transport-required">*</span>
                    <input type="text" className="trip-details__custom-transport-input" placeholder="Enter the transportation name" value={customTransportName} onChange={(e) => setCustomTransportName(e.target.value)} required />
                  </label>
                  <label className="trip-details__custom-transport-label">
                    From <span className="trip-details__custom-transport-required">*</span>
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <MapPin size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="Search by landmark or address"
                        value={customTransportFrom}
                        onChange={(e) => { setCustomTransportFrom(e.target.value); setTransportFromSuggestionsOpen(true); }}
                        onFocus={() => setTransportFromSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setTransportFromSuggestionsOpen(false), 200)}
                        required
                      />
                      {transportFromSuggestionsOpen && customTransportFrom.trim() && (
                        <ul className="trip-details__custom-transport-suggestions">
                          {searchAirportsAndCities(customTransportFrom).length > 0 ? (
                            searchAirportsAndCities(customTransportFrom).map((a) => (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item"
                                  onMouseDown={() => {
                                    setCustomTransportFrom(a.name);
                                    setTransportFromSuggestionsOpen(false);
                                  }}
                                >
                                  <MapPin size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{a.name}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">{a.type}</span>
                                  </div>
                                </button>
                              </li>
                            ))
                          ) : (
                            <li>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                onMouseDown={() => {
                                  setTransportFromSuggestionsOpen(false);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{customTransportFrom}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                </div>
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="trip-details__custom-transport-label">
                    To <span className="trip-details__custom-transport-required">*</span>
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <MapPin size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="Search by landmark or address"
                        value={customTransportTo}
                        onChange={(e) => { setCustomTransportTo(e.target.value); setTransportToSuggestionsOpen(true); }}
                        onFocus={() => setTransportToSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setTransportToSuggestionsOpen(false), 200)}
                        required
                      />
                      {transportToSuggestionsOpen && customTransportTo.trim() && (
                        <ul className="trip-details__custom-transport-suggestions">
                          {searchAirportsAndCities(customTransportTo).length > 0 ? (
                            searchAirportsAndCities(customTransportTo).map((a) => (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item"
                                  onMouseDown={() => {
                                    setCustomTransportTo(a.name);
                                    setTransportToSuggestionsOpen(false);
                                  }}
                                >
                                  <MapPin size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{a.name}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">{a.type}</span>
                                  </div>
                                </button>
                              </li>
                            ))
                          ) : (
                            <li>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                onMouseDown={() => {
                                  setTransportToSuggestionsOpen(false);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{customTransportTo}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                </div>
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </label>
                  <div className="trip-details__custom-transport-row">
                    <label className="trip-details__custom-transport-label">
                      Start date <span className="trip-details__custom-transport-required">*</span>
                      <select className="trip-details__custom-transport-select" value={customTransportDepartureDate} onChange={(e) => setCustomTransportDepartureDate(e.target.value)} required>
                        <option value="">Select day</option>
                        {days.map((d) => {
                          const x = new Date(d.date);
                          return <option key={d.date} value={d.date}>Day {d.dayNum}: {MONTH_SHORT[x.getMonth()]} {x.getDate()} {x.getFullYear()}, {x.toLocaleDateString('en', { weekday: 'short' })}</option>;
                        })}
                      </select>
                    </label>
                    <label className="trip-details__custom-transport-label">
                      Start time <span className="trip-details__custom-transport-required">*</span>
                      <span className="trip-details__custom-transport-input-wrap">
                        <Clock size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                        <input type="time" className="trip-details__custom-transport-input" value={customTransportDepartureTime} onChange={(e) => setCustomTransportDepartureTime(e.target.value)} required />
                      </span>
                    </label>
                  </div>
                  <label className="trip-details__custom-transport-label">
                    Duration <span className="trip-details__custom-transport-required">*</span>
                    <div className="trip-details__custom-transport-duration">
                      <input type="number" min={0} max={23} className="trip-details__custom-transport-duration-input" value={customTransportDurationHrs} onChange={(e) => setCustomTransportDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
                      <span> hr </span>
                      <input type="number" min={0} max={59} className="trip-details__custom-transport-duration-input" value={customTransportDurationMins} onChange={(e) => setCustomTransportDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
                      <span> mins</span>
                    </div>
                  </label>
                </>
              )}
              {customTransportVehicle !== 'Flight' && customTransportVehicle !== 'Train' && customTransportVehicle !== 'Bus' && (
                <div className="trip-details__custom-transport-row">
                  <label className="trip-details__custom-transport-label">
                    Date <span className="trip-details__custom-transport-required">*</span>
                    <select className="trip-details__custom-transport-select" value={customTransportDepartureDate} onChange={(e) => setCustomTransportDepartureDate(e.target.value)} required>
                      <option value="">Select day</option>
                      {days.map((d) => {
                        const x = new Date(d.date);
                        return <option key={d.date} value={d.date}>Day {d.dayNum}: {MONTH_SHORT[x.getMonth()]} {x.getDate()} {x.getFullYear()}, {x.toLocaleDateString('en', { weekday: 'short' })}</option>;
                      })}
                    </select>
                  </label>
                  <label className="trip-details__custom-transport-label">
                    Time <span className="trip-details__custom-transport-required">*</span>
                    <span className="trip-details__custom-transport-input-wrap">
                      <Clock size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                      <input type="time" className="trip-details__custom-transport-input" value={customTransportDepartureTime} onChange={(e) => setCustomTransportDepartureTime(e.target.value)} required />
                    </span>
                  </label>
                </div>
              )}
              {customTransportVehicle === 'Flight' && (
                <>
                  <label className="trip-details__custom-transport-label">
                    From <span className="trip-details__custom-transport-required">*</span>
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <MapPin size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="Search departure airport or city"
                        value={customTransportFrom}
                        onChange={(e) => { setCustomTransportFrom(e.target.value); setTransportFromSuggestionsOpen(true); }}
                        onFocus={() => setTransportFromSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setTransportFromSuggestionsOpen(false), 200)}
                        required
                      />
                      {transportFromSuggestionsOpen && customTransportFrom.trim() && (
                        <ul className="trip-details__custom-transport-suggestions">
                          {searchAirportsAndCities(customTransportFrom).length > 0 ? (
                            searchAirportsAndCities(customTransportFrom).map((a) => (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item"
                                  onMouseDown={() => {
                                    setCustomTransportFrom(a.name);
                                    setTransportFromSuggestionsOpen(false);
                                  }}
                                >
                                  <Plane size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{a.name}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">{a.type}</span>
                                  </div>
                                </button>
                              </li>
                            ))
                          ) : (
                            <li>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                onMouseDown={() => {
                                  setTransportFromSuggestionsOpen(false);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{customTransportFrom}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                </div>
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="trip-details__custom-transport-label">
                    To <span className="trip-details__custom-transport-required">*</span>
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <MapPin size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="Search arrival airport or city"
                        value={customTransportTo}
                        onChange={(e) => { setCustomTransportTo(e.target.value); setTransportToSuggestionsOpen(true); }}
                        onFocus={() => setTransportToSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setTransportToSuggestionsOpen(false), 200)}
                        required
                      />
                      {transportToSuggestionsOpen && customTransportTo.trim() && (
                        <ul className="trip-details__custom-transport-suggestions">
                          {searchAirportsAndCities(customTransportTo).length > 0 ? (
                            searchAirportsAndCities(customTransportTo).map((a) => (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  className="trip-details__custom-transport-suggestion-item"
                                  onMouseDown={() => {
                                    setCustomTransportTo(a.name);
                                    setTransportToSuggestionsOpen(false);
                                  }}
                                >
                                  <Plane size={16} aria-hidden />
                                  <div className="trip-details__custom-transport-suggestion-text">
                                    <span className="trip-details__custom-transport-suggestion-name">{a.name}</span>
                                    <span className="trip-details__custom-transport-suggestion-type">{a.type}</span>
                                  </div>
                                </button>
                              </li>
                            ))
                          ) : (
                            <li>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                                onMouseDown={() => {
                                  setTransportToSuggestionsOpen(false);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{customTransportTo}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                                </div>
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="trip-details__custom-transport-label">
                    Airline (type manually or pick suggestion)
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="e.g. Singapore Airlines"
                        value={customTransportAirline}
                        onChange={(e) => { setCustomTransportAirline(e.target.value); setTransportAirlineSuggestionsOpen(true); }}
                        onFocus={() => setTransportAirlineSuggestionsOpen(true)}
                        onBlur={() => setTimeout(() => setTransportAirlineSuggestionsOpen(false), 200)}
                      />
                      {transportAirlineSuggestionsOpen && customTransportAirline.trim() && (
                        <ul className="trip-details__custom-transport-suggestions">
                          {searchAirlines(customTransportAirline).map((a) => (
                            <li key={a.id}>
                              <button type="button" className="trip-details__custom-transport-suggestion-item" onMouseDown={() => { setCustomTransportAirline(a.name); setTransportAirlineSuggestionsOpen(false); }}>{a.name}</button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                  <label className="trip-details__custom-transport-label">
                    Flight number
                    <input type="text" className="trip-details__custom-transport-input" placeholder="Enter your flight number" value={customTransportFlightNumber} onChange={(e) => setCustomTransportFlightNumber(e.target.value)} />
                  </label>
                  <div className="trip-details__custom-transport-row">
                    <label className="trip-details__custom-transport-label">
                      Departure date <span className="trip-details__custom-transport-required">*</span>
                      <select className="trip-details__custom-transport-select" value={customTransportDepartureDate} onChange={(e) => setCustomTransportDepartureDate(e.target.value)} required>
                        <option value="">Select day</option>
                        {days.map((d) => {
                          const x = new Date(d.date);
                          const dayName = x.toLocaleDateString('en', { weekday: 'short' });
                          return <option key={d.date} value={d.date}>Day {d.dayNum}: {MONTH_SHORT[x.getMonth()]} {x.getDate()} {x.getFullYear()}, {dayName}</option>;
                        })}
                      </select>
                    </label>
                    <label className="trip-details__custom-transport-label">
                      Time <span className="trip-details__custom-transport-required">*</span>
                      <span className="trip-details__custom-transport-input-wrap">
                        <Clock size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                        <input type="time" className="trip-details__custom-transport-input" value={customTransportDepartureTime} onChange={(e) => setCustomTransportDepartureTime(e.target.value)} required />
                      </span>
                    </label>
                  </div>
                  <div className="trip-details__custom-transport-row">
                    <label className="trip-details__custom-transport-label">
                      Arrival date <span className="trip-details__custom-transport-required">*</span>
                      <select className="trip-details__custom-transport-select" value={customTransportArrivalDate} onChange={(e) => setCustomTransportArrivalDate(e.target.value)} required>
                        <option value="">Select day</option>
                        {days.map((d) => {
                          const x = new Date(d.date);
                          const dayName = x.toLocaleDateString('en', { weekday: 'short' });
                          return <option key={d.date} value={d.date}>Day {d.dayNum}: {MONTH_SHORT[x.getMonth()]} {x.getDate()} {x.getFullYear()}, {dayName}</option>;
                        })}
                      </select>
                    </label>
                    <label className="trip-details__custom-transport-label">
                      Time <span className="trip-details__custom-transport-required">*</span>
                      <span className="trip-details__custom-transport-input-wrap">
                        <Clock size={18} className="trip-details__custom-transport-input-icon" aria-hidden />
                        <input type="time" className="trip-details__custom-transport-input" value={customTransportArrivalTime} onChange={(e) => setCustomTransportArrivalTime(e.target.value)} required />
                      </span>
                    </label>
                  </div>
                </>
              )}
              {customTransportVehicle === 'Flight' && (
                <label className="trip-details__custom-transport-label">
                  Confirmation # (Optional)
                  <input type="text" className="trip-details__custom-transport-input" placeholder="Enter your confirmation code" value={customTransportConfirmation} onChange={(e) => setCustomTransportConfirmation(e.target.value)} />
                </label>
              )}
              <label className="trip-details__custom-transport-label">
                Note (Optional)
                <textarea className="trip-details__custom-transport-textarea" placeholder="Enter your note..." value={customTransportNote} onChange={(e) => setCustomTransportNote(e.target.value)} rows={3} />
              </label>
              <label className="trip-details__custom-transport-label">
                Cost (Optional)
                <input type="number" step="0.01" min={0} className="trip-details__custom-transport-input" placeholder="US$0.00" value={customTransportCost} onChange={(e) => setCustomTransportCost(e.target.value)} />
                <span className="trip-details__custom-transport-currency-hint">{currency} — adds to trip budget</span>
              </label>
              <label className="trip-details__custom-transport-label">
                External link (optional)
                <input type="url" className="trip-details__custom-transport-input" placeholder="https:// Type or paste the activity link" value={customTransportExternalLink} onChange={(e) => setCustomTransportExternalLink(e.target.value)} />
              </label>
              <label className="trip-details__custom-transport-label">
                Travel Documents
                <p className="trip-details__custom-transport-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
                <input
                  id="custom-transport-docs"
                  type="file"
                  multiple
                  accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                  className="trip-details__custom-transport-file-input"
                  onChange={(e) => setCustomTransportTravelDocs(Array.from(e.target.files || []).slice(0, 3))}
                />
                <button type="button" className="trip-details__custom-transport-attach" onClick={() => document.getElementById('custom-transport-docs')?.click()}>
                  <Paperclip size={18} aria-hidden /> Attach files
                  {customTransportTravelDocs.length > 0 && <span className="trip-details__custom-transport-attach-count"> ({customTransportTravelDocs.length})</span>}
                </button>
              </label>
              <div className="trip-details__custom-transport-actions">
                <button type="button" className="trip-details__modal-cancel" onClick={() => setAddCustomTransportOpen(false)}>Cancel</button>
                <button type="submit" className="trip-details__custom-transport-submit">Add to trip</button>
              </div>
            </form>
          </div>
        </>
      )}

      {addPlacesOpen && (() => {
        const showingPlaceDetail = placeDetailsView != null;
        const showingItineraryDetail = itineraryDetailsView != null;
        const showingAnyDetail = showingPlaceDetail || showingItineraryDetail;
        const detailPlace = showingPlaceDetail ? placeDetailsView : null;
        const nearbyPlaces = detailPlace
          ? filteredPlaces
            .filter((p) => p.id !== detailPlace.id && p.lat != null && p.lng != null)
            .map((p) => ({ ...p, dist: distanceBetween(detailPlace, p) }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 6)
          : [];
        const itineraryPlaces = showingItineraryDetail && itineraryDetailsView
          ? (Array.isArray(itineraryDetailsView.places) ? itineraryDetailsView.places : []).map((place, index) => {
            const dayNumValue = Number(place?.dayNum || place?.day || Math.floor(index / 3) + 1);
            return {
              ...place,
              id: place?.id || `${itineraryDetailsView.id || 'smart-itinerary'}-place-${index + 1}`,
              dayNum: Number.isFinite(dayNumValue) && dayNumValue > 0 ? dayNumValue : 1,
            };
          })
          : [];
        const itineraryDayGroups = showingItineraryDetail
          ? Object.values(
            itineraryPlaces.reduce((acc, place) => {
              const dayNum = Number(place.dayNum || 1);
              if (!acc[dayNum]) {
                acc[dayNum] = {
                  dayNum,
                  title: place.dayTitle || `Exploring ${cityQuery} - Day ${dayNum}`,
                  places: [],
                };
              }
              acc[dayNum].places.push(place);
              return acc;
            }, {}),
          ).sort((a, b) => a.dayNum - b.dayNum)
          : [];
        const selectedItineraryPlace = itineraryPlaces.find((place) => String(place.id) === String(selectedPlaceMarkerId)) || null;

        const mapPlaces = showingPlaceDetail && detailPlace
          ? [detailPlace, ...nearbyPlaces].filter((p) => p && p.lat != null && p.lng != null)
          : showingItineraryDetail
            ? itineraryPlaces
            : filteredPlaces;
        const addPlacesMarkers = mapPlaces
          .filter((p) => p.lat != null && p.lng != null)
          .map((p, i) => ({
            id: p.id,
            sourceId: p.id,
            markerType: 'place',
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            dayNum: Number(p.dayNum) > 0 ? Number(p.dayNum) : (i % Math.max(days.length, 1)) + 1,
            address: p.address || cityQuery,
            rating: p.rating,
            reviewCount: p.reviewCount,
            image: p.image,
            website: p.website,
            originalData: p,
          }));
        const firstItineraryPlaceWithCoords = itineraryPlaces.find((place) => place.lat != null && place.lng != null);
        const mapCenterDetail = detailPlace && detailPlace.lat != null
          ? [detailPlace.lat, detailPlace.lng]
          : selectedItineraryPlace && selectedItineraryPlace.lat != null && selectedItineraryPlace.lng != null
            ? [selectedItineraryPlace.lat, selectedItineraryPlace.lng]
            : firstItineraryPlaceWithCoords
              ? [firstItineraryPlaceWithCoords.lat, firstItineraryPlaceWithCoords.lng]
              : mapCenter;
        return (
          <>
            <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => { setAddPlacesOpen(false); setPlaceDetailsView(null); setItineraryDetailsView(null); setSelectedPlaceMarkerId(null); }} />
            <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingAnyDetail ? (showingItineraryDetail ? 'itinerary-detail-title' : 'place-detail-title') : 'add-places-title'} aria-modal="true">
              {showingItineraryDetail ? (
                // Itinerary Detail View
                <div className="trip-details__add-places-body">
                  <div className="trip-details__itinerary-detail-panel">
                    <div className="trip-details__itinerary-detail-header">
                      <button type="button" className="trip-details__place-detail-back" onClick={() => setItineraryDetailsView(null)} aria-label="Back to list">
                        <ArrowLeft size={20} aria-hidden /> Back
                      </button>
                      <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={() => { setAddPlacesOpen(false); setItineraryDetailsView(null); setSelectedPlaceMarkerId(null); }}>
                        <X size={20} aria-hidden />
                      </button>
                      <h1 id="itinerary-detail-title" className="trip-details__itinerary-detail-name">{itineraryDetailsView.title}</h1>
                      {itineraryDetailsView.author?.travelStyle && (
                        <p className="trip-details__itinerary-detail-author-style">{itineraryDetailsView.author.travelStyle}</p>
                      )}
                      <div className="trip-details__itinerary-detail-meta">
                        <span className="trip-details__itinerary-detail-creator">
                          <Route size={16} aria-hidden /> {itineraryDetailsView.creator}
                        </span>
                        <span className="trip-details__itinerary-detail-stat">Smart-generated route</span>
                        <span className="trip-details__itinerary-detail-stat">{itineraryDetailsView.duration}</span>
                        <span className="trip-details__itinerary-detail-stat">{cityQuery}</span>
                        <span className="trip-details__itinerary-detail-stat">{itineraryPlaces.length} places</span>
                      </div>
                      <div className="trip-details__itinerary-detail-tags">
                        {(Array.isArray(itineraryDetailsView.tags) ? itineraryDetailsView.tags : [itineraryDetailsView.type]).filter(Boolean).slice(0, 5).map((tag) => (
                          <span key={tag} className="trip-details__itinerary-detail-tag">{tag}</span>
                        ))}
                      </div>
                      <div className="trip-details__place-detail-add-wrap">
                        <button
                          type="button"
                          className="trip-details__place-detail-add-btn"
                          onClick={() => addEntireItineraryToTrip(itineraryPlaces)}
                        >
                          Add entire itinerary to trip
                        </button>
                      </div>
                    </div>
                    <div className="trip-details__itinerary-detail-content">
                      {itineraryDayGroups.length > 0 ? itineraryDayGroups.map((dayGroup) => (
                        <div key={`itinerary-day-${dayGroup.dayNum}`} className="trip-details__itinerary-detail-day">
                          <div className="trip-details__itinerary-detail-day-header">
                            <span className="trip-details__itinerary-detail-day-badge">Day {dayGroup.dayNum}</span>
                            <span className="trip-details__itinerary-detail-day-title">{dayGroup.title}</span>
                          </div>
                          <div className="trip-details__itinerary-detail-places">
                            {dayGroup.places.map((place) => (
                              <div
                                key={place.id}
                                role="button"
                                tabIndex={0}
                                className="trip-details__itinerary-detail-place trip-details__itinerary-detail-place--interactive"
                                onClick={() => openItineraryPlaceDetails(place)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    openItineraryPlaceDetails(place);
                                  }
                                }}
                              >
                                <div className="trip-details__itinerary-detail-place-img-wrap">
                                  <img src={resolveImageUrl(place.image || itineraryDetailsView.image, place.name || itineraryDetailsView.title, 'landmark')} alt="" className="trip-details__itinerary-detail-place-img" onError={handleImageError} />
                                </div>
                                <div className="trip-details__itinerary-detail-place-content">
                                  <h3 className="trip-details__itinerary-detail-place-name">{place.name}</h3>
                                  <div className="trip-details__itinerary-detail-place-rating">
                                    <Star size={14} fill="currentColor" aria-hidden /> {place.rating} ({(place.reviewCount || 0).toLocaleString()}) · Place
                                  </div>
                                  <div className="trip-details__itinerary-detail-place-address">
                                    <MapPin size={14} aria-hidden /> {place.address || cityQuery}
                                  </div>
                                  <div className="trip-details__itinerary-detail-place-duration">
                                    <Clock size={14} aria-hidden /> Duration: {place.durationLabel || '2 hr'}
                                  </div>
                                  <div className="trip-details__itinerary-detail-place-note">
                                    {place.overview || 'Suggested stop from this smart itinerary.'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <p className="trip-details__add-places-results">No places found for this itinerary.</p>
                      )}
                    </div>
                  </div>
                  <div className="trip-details__add-places-map-panel">
                    <div className="trip-details__add-places-map">
                      <TripMap
                        center={mapCenterDetail}
                        zoom={11}
                        markers={addPlacesMarkers}
                        activeDayNums={allDayNums}
                        className="trip-details__add-places-trip-map"
                        fitBounds={addPlacesMarkers.length > 0}
                        selectedMarkerId={selectedPlaceMarkerId}
                        popupMode="hover-preview"
                        onMarkerAddClick={openAddToTripFromMapMarker}
                        onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                      />
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-places-filter-days"
                      onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                    >
                      <CalendarIcon size={16} aria-hidden /> Filter days
                    </button>
                  </div>
                </div>
              ) : !showingPlaceDetail ? (
                <>
                  <div className="trip-details__add-places-head">
                    <h2 id="add-places-title" className="trip-details__add-places-title">Add Places</h2>
                    <div className="trip-details__add-places-location">
                      <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                      <span>{trip.locations || trip.destination}</span>
                    </div>
                    <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={() => { setAddPlacesOpen(false); setSelectedPlaceMarkerId(null); }}>
                      <X size={20} aria-hidden />
                    </button>
                  </div>
                  <div className="trip-details__add-places-body">
                    <div className="trip-details__add-places-list-panel">
                      <div className="trip-details__add-places-search-wrap">
                        <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                        <input
                          type="text"
                          className="trip-details__add-places-search-input"
                          placeholder="Search by place name..."
                          value={placeSearchQuery}
                          onChange={(e) => {
                            setPlaceSearchQuery(e.target.value);
                          }}
                          aria-label="Search places"
                        />
                      </div>
                      {(() => {
                        const places = pagedPlaces;

                        return (
                          <>
                            {discoveryError && (
                              <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                            )}
                            {discoveryLoading && (
                              <p className="trip-details__add-places-results">Loading live places for {cityQuery}...</p>
                            )}
                            <div className="trip-details__add-places-filters">
                              <p className="trip-details__add-places-results">
                                {filteredPlaces.length} results found · Page {addPlacesPage} of {addPlacesTotalPages}
                              </p>
                              <div className="trip-details__add-places-sort">
                                <label htmlFor="add-places-sort">Sort by:</label>
                                <select id="add-places-sort" className="trip-details__add-places-sort-select" value={placeSortBy} onChange={(e) => setPlaceSortBy(e.target.value)}>
                                  {PLACE_SORT_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="trip-details__add-places-grid">
                              <button
                                type="button"
                                className="trip-details__add-places-card trip-details__add-places-card--manual"
                                onClick={() => {
                                  const day = days.find((d) => d.dayNum === addPlacesDay);
                                  setCustomPlaceName('');
                                  setCustomPlaceAddress('');
                                  setCustomPlaceAddressSelection(null);
                                  setCustomPlaceAddressSuggestionsOpen(false);
                                  setCustomPlaceDateKey(day?.date || days[0]?.date || '');
                                  setAddCustomPlaceOpen(true);
                                }}
                              >
                                <div className="trip-details__add-places-card-manual-icon">
                                  <Camera size={24} aria-hidden />
                                </div>
                                <span className="trip-details__add-places-card-manual-text">Can&apos;t find what you need? Add manually.</span>
                              </button>
                              {places.map((place) => (
                                <div
                                  key={place.id}
                                  role="button"
                                  tabIndex={0}
                                  className="trip-details__add-places-card"
                                  onClick={() => { setPlaceDetailsView(place); setSelectedPlaceMarkerId(place.id); }}
                                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlaceDetailsView(place); setSelectedPlaceMarkerId(place.id); } }}
                                >
                                  <img src={resolveImageUrl(place.image, place.name, 'landmark')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                                  <button type="button" className="trip-details__add-places-card-heart" aria-label={place.saved ? 'Unsave' : 'Save'} onClick={(e) => e.stopPropagation()}>
                                    <Heart size={18} fill={place.saved ? 'currentColor' : 'none'} aria-hidden />
                                  </button>
                                  <div className="trip-details__add-places-card-info">
                                    <span className="trip-details__add-places-card-name">{place.name}</span>
                                    <span className="trip-details__add-places-card-rating">{place.rating} ({place.reviewCount.toLocaleString()})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {addPlacesTotalPages > 1 && (
                              <div className="trip-details__add-places-pagination" role="navigation" aria-label="Add places pages">
                                <button
                                  type="button"
                                  className="trip-details__add-places-page-btn"
                                  onClick={() => setAddPlacesPage((prev) => Math.max(1, prev - 1))}
                                  disabled={addPlacesPage <= 1}
                                >
                                  Previous
                                </button>
                                <span className="trip-details__add-places-page-text">Page {addPlacesPage} / {addPlacesTotalPages}</span>
                                <button
                                  type="button"
                                  className="trip-details__add-places-page-btn"
                                  onClick={() => setAddPlacesPage((prev) => Math.min(addPlacesTotalPages, prev + 1))}
                                  disabled={addPlacesPage >= addPlacesTotalPages}
                                >
                                  Next
                                </button>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                    <div className="trip-details__add-places-map-panel">
                      <div className="trip-details__add-places-map">
                        <TripMap
                          center={mapCenter}
                          zoom={11}
                          markers={addPlacesMarkers}
                          activeDayNums={allDayNums}
                          className="trip-details__add-places-trip-map"
                          fitBounds={addPlacesMarkers.length > 0}
                          selectedMarkerId={selectedPlaceMarkerId}
                          popupMode="hover-preview"
                          onMarkerAddClick={openAddToTripFromMapMarker}
                          onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                        />
                      </div>
                      <button
                        type="button"
                        className="trip-details__add-places-filter-days"
                        onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                      >
                        <CalendarIcon size={16} aria-hidden /> Filter days
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="trip-details__add-places-body">
                  <div className="trip-details__place-detail-panel">
                    <div className="trip-details__place-detail-header">
                      <button type="button" className="trip-details__place-detail-back" onClick={() => { setPlaceDetailsView(null); setPlaceDetailsTab('overview'); }} aria-label="Back to list">
                        <ArrowLeft size={20} aria-hidden /> Back
                      </button>
                      <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={() => { setAddPlacesOpen(false); setPlaceDetailsView(null); setSelectedPlaceMarkerId(null); }}>
                        <X size={20} aria-hidden />
                      </button>
                      <h1 id="place-detail-title" className="trip-details__place-detail-name">{detailPlace.name}</h1>
                      <div className="trip-details__place-detail-meta">
                        <span className="trip-details__place-detail-rating">
                          <Star size={16} fill="currentColor" aria-hidden /> {detailPlace.rating} ({detailPlace.reviewCount?.toLocaleString() ?? '0'})
                        </span>
                        <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                          <Heart size={20} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="trip-details__place-detail-hero">
                      {(() => {
                        const galleryImages = [
                          ...(Array.isArray(detailPlace.images) ? detailPlace.images : []),
                          detailPlace.image,
                        ].filter(Boolean);
                        const uniqueImages = [...new Set(galleryImages)].slice(0, 3);

                        if (uniqueImages.length <= 1) {
                          return <img src={resolveImageUrl(uniqueImages[0] || detailPlace.image, detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img" onError={handleImageError} />;
                        }

                        return (
                          <div className="trip-details__place-detail-gallery">
                            <img src={resolveImageUrl(uniqueImages[0], detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img trip-details__place-detail-img--primary" onError={handleImageError} />
                            <div className="trip-details__place-detail-gallery-side">
                              {uniqueImages.slice(1, 3).map((img, idx) => (
                                <img key={`${detailPlace.id || detailPlace.name}-gallery-${idx}`} src={resolveImageUrl(img, detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img trip-details__place-detail-img--secondary" onError={handleImageError} />
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="trip-details__place-detail-tabs">
                      <button type="button" className={`trip-details__place-detail-tab ${placeDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setPlaceDetailsTab('overview')}>Overview</button>
                      <button type="button" className={`trip-details__place-detail-tab ${placeDetailsTab === 'nearby' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setPlaceDetailsTab('nearby')}>Nearby Places</button>
                    </div>
                    <div className="trip-details__place-detail-content">
                      {placeDetailsTab === 'overview' ? (
                        <>
                          {detailPlace.overview && (
                            <p className="trip-details__place-detail-overview">{detailPlace.overview}</p>
                          )}
                          <div className="trip-details__place-detail-add-wrap">
                            <button
                              type="button"
                              className="trip-details__place-detail-add-btn"
                              onClick={() => {
                                const day = days.find((d) => d.dayNum === addPlacesDay);
                                setAddToTripItem({
                                  type: 'place',
                                  data: detailPlace,
                                  categoryId: 'places',
                                  category: 'Places',
                                  Icon: Camera,
                                });
                                setAddToTripDate(day?.date || days[0]?.date || '');
                                setAddToTripStartTime('07:00');
                                setAddToTripDurationHrs('1');
                                setAddToTripDurationMins('0');
                                setAddToTripNotes('');
                                setAddToTripCost('');
                                setAddToTripExternalLink(detailPlace.website || '');
                                setAddToTripTravelDocs([]);
                                setAddToTripModalOpen(true);
                              }}
                            >
                              Add to trip
                            </button>
                          </div>
                          {Array.isArray(detailPlace.whyVisit) && detailPlace.whyVisit.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Why you should visit</h3>
                              <ul className="trip-details__place-detail-hours">
                                {detailPlace.whyVisit.map((reason, idx) => (
                                  <li key={`visit-${idx}`}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {detailPlace.address && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Address</h3>
                              <p className="trip-details__place-detail-section-text">{detailPlace.address}</p>
                            </div>
                          )}
                          {(detailPlace.hours && Object.keys(detailPlace.hours).length > 0) && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Hours of operation</h3>
                              {detailPlace.isOpenNow != null && (
                                <p className={`trip-details__place-detail-status ${detailPlace.isOpenNow ? 'trip-details__place-detail-status--open' : 'trip-details__place-detail-status--closed'}`}>
                                  {detailPlace.isOpenNow ? 'Open Now' : 'Closed Now'}
                                </p>
                              )}
                              <ul className="trip-details__place-detail-hours">
                                {Object.entries(detailPlace.hours).map(([day, hrs]) => (
                                  <li key={day}>{day}: {hrs}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {detailPlace.website && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Website</h3>
                              <a href={detailPlace.website} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                                {detailPlace.website.replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                              </a>
                            </div>
                          )}
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Review</h3>
                            <p className="trip-details__place-detail-section-text">
                              <Star size={14} fill="currentColor" aria-hidden /> {detailPlace.rating} ({detailPlace.reviewCount?.toLocaleString() ?? '0'} reviews)
                              {detailPlace.googleMapsReviewUrl && (
                                <>
                                  {' · '}
                                  <a href={detailPlace.googleMapsReviewUrl} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                                    Leave a review / Google Maps reviews
                                  </a>
                                </>
                              )}
                            </p>
                          </div>
                        </>
                      ) : (
                        <div className="trip-details__place-detail-nearby">
                          <p className="trip-details__place-detail-nearby-title">Nearby Places</p>
                          <div className="trip-details__place-detail-nearby-grid">
                            {nearbyPlaces.map((near) => (
                              <button
                                key={near.id}
                                type="button"
                                className="trip-details__place-detail-nearby-card"
                                onClick={() => { setPlaceDetailsView(near); setSelectedPlaceMarkerId(near.id); }}
                              >
                                <img src={resolveImageUrl(near.image, near.name, 'landmark')} alt="" className="trip-details__place-detail-nearby-img" onError={handleImageError} />
                                <button type="button" className="trip-details__place-detail-nearby-heart" aria-label="Save" onClick={(e) => e.stopPropagation()}>
                                  <Heart size={16} aria-hidden />
                                </button>
                                <div className="trip-details__place-detail-nearby-info">
                                  <span className="trip-details__place-detail-nearby-name">{near.name}</span>
                                  <span className="trip-details__place-detail-nearby-rating">{near.rating} ({near.reviewCount?.toLocaleString() ?? '0'})</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="trip-details__add-places-map-panel">
                    <div className="trip-details__add-places-map">
                      <TripMap
                        center={mapCenterDetail}
                        zoom={14}
                        markers={addPlacesMarkers}
                        activeDayNums={allDayNums}
                        className="trip-details__add-places-trip-map"
                        fitBounds={addPlacesMarkers.length > 0}
                        selectedMarkerId={detailPlace?.id || selectedPlaceMarkerId}
                        popupMode="hover-preview"
                        onMarkerAddClick={openAddToTripFromMapMarker}
                        onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                      />
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-places-filter-days"
                      onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                    >
                      <CalendarIcon size={16} aria-hidden /> Filter days
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {addFoodOpen && (() => {
        const showingFoodDetail = foodDetailsView != null;
        const showingAnyDetail = showingFoodDetail;
        const foodPlaces = filteredFoods;
        const foodMapMarkers = foodPlaces
          .filter((place) => place.lat != null && place.lng != null)
          .map((place, index) => ({
            id: place.id,
            sourceId: place.id,
            markerType: 'food',
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            dayNum: (index % Math.max(days.length, 1)) + 1,
            address: place.address || cityQuery,
            rating: place.rating,
            reviewCount: place.reviewCount,
            image: place.image,
            website: place.website || '',
            originalData: place,
          }));

        return (
          <>
            <button
              type="button"
              className="trip-details__modal-backdrop"
              aria-label="Close"
              onClick={() => { setAddFoodOpen(false); setFoodDetailsView(null); }}
            />
            <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingAnyDetail ? 'food-detail-title' : 'add-food-title'} aria-modal="true">
              {showingFoodDetail ? (
                // Food Detail View
                <div className="trip-details__add-places-body trip-details__add-food-body">
                  <div className="trip-details__place-detail-panel">
                    <div className="trip-details__place-detail-header">
                      <button type="button" className="trip-details__place-detail-back" onClick={() => { setFoodDetailsView(null); setFoodDetailsTab('overview'); }} aria-label="Back to list">
                        <ArrowLeft size={20} aria-hidden /> Back
                      </button>
                      <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={() => { setAddFoodOpen(false); setFoodDetailsView(null); }}>
                        <X size={20} aria-hidden />
                      </button>
                      <h1 id="food-detail-title" className="trip-details__place-detail-name">{foodDetailsView.name}</h1>
                      <div className="trip-details__place-detail-meta">
                        <span className="trip-details__place-detail-rating">
                          <Star size={16} fill="currentColor" aria-hidden /> {foodDetailsView.rating} ({foodDetailsView.reviewCount?.toLocaleString() ?? '0'})
                        </span>
                        <span className="trip-details__place-detail-badge">{foodDetailsView.priceLevel}</span>
                        <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                          <Heart size={20} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="trip-details__place-detail-hero">
                      <img src={resolveImageUrl(foodDetailsView.image, foodDetailsView.name, 'restaurant')} alt="" className="trip-details__place-detail-img" onError={handleImageError} />
                    </div>
                    <div className="trip-details__place-detail-tabs">
                      <button type="button" className={`trip-details__place-detail-tab ${foodDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setFoodDetailsTab('overview')}>Overview</button>
                    </div>
                    <div className="trip-details__place-detail-content">
                      {foodDetailsTab === 'overview' && (
                        <>
                          {foodDetailsView.overview && (
                            <p className="trip-details__place-detail-overview">{foodDetailsView.overview}<span className="trip-details__place-detail-read-more"> Read more</span></p>
                          )}
                          <div className="trip-details__place-detail-add-wrap">
                            <button
                              type="button"
                              className="trip-details__place-detail-add-btn"
                              onClick={() => {
                                const day = days.find((d) => d.dayNum === addFoodDay);
                                setAddToTripItem({
                                  type: 'food',
                                  data: foodDetailsView,
                                  categoryId: 'food',
                                  category: 'Food & Beverage',
                                  Icon: UtensilsCrossed,
                                });
                                setAddToTripDate(day?.date || days[0]?.date || '');
                                setAddToTripStartTime('07:00');
                                setAddToTripDurationHrs('1');
                                setAddToTripDurationMins('0');
                                setAddToTripNotes('');
                                setAddToTripCost('');
                                setAddToTripExternalLink(foodDetailsView.website || '');
                                setAddToTripTravelDocs([]);
                                setAddToTripModalOpen(true);
                              }}
                            >
                              Add to trip
                            </button>
                          </div>
                          {Array.isArray(foodDetailsView.whyVisit) && foodDetailsView.whyVisit.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Why you should visit</h3>
                              <ul className="trip-details__place-detail-hours">
                                {foodDetailsView.whyVisit.map((reason, idx) => (
                                  <li key={`food-visit-${idx}`}>{reason}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {foodDetailsView.address && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Address</h3>
                              <p className="trip-details__place-detail-section-text">{foodDetailsView.address}</p>
                            </div>
                          )}
                          {(foodDetailsView.hours && Object.keys(foodDetailsView.hours).length > 0) && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Hours of operation</h3>
                              {foodDetailsView.isOpenNow != null && (
                                <p className={`trip-details__place-detail-status ${foodDetailsView.isOpenNow ? 'trip-details__place-detail-status--open' : 'trip-details__place-detail-status--closed'}`}>
                                  {foodDetailsView.isOpenNow ? 'Open Now' : 'Closed Now'}
                                </p>
                              )}
                              <ul className="trip-details__place-detail-hours">
                                {Object.entries(foodDetailsView.hours).map(([day, hrs]) => (
                                  <li key={`food-hour-${day}`}>{day}: {hrs}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {foodDetailsView.website && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Website</h3>
                              <a href={foodDetailsView.website} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                                {foodDetailsView.website.replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                              </a>
                            </div>
                          )}
                          {foodDetailsView.dietaryTags?.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Dietary Options</h3>
                              <div className="trip-details__add-food-card-badges">
                                {foodDetailsView.dietaryTags.map((tag) => (
                                  <span key={tag} className="trip-details__add-food-card-badge">{tag}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Review</h3>
                            <p className="trip-details__place-detail-section-text">
                              <Star size={14} fill="currentColor" aria-hidden /> {foodDetailsView.rating} ({foodDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)
                              {foodDetailsView.googleMapsReviewUrl && (
                                <>
                                  {' · '}
                                  <a href={foodDetailsView.googleMapsReviewUrl} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                                    Leave a review / Google Maps reviews
                                  </a>
                                </>
                              )}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="trip-details__add-places-map-panel">
                    <div className="trip-details__add-places-map">
                      <TripMap
                        center={foodDetailsView.lat && foodDetailsView.lng ? [foodDetailsView.lat, foodDetailsView.lng] : mapCenter}
                        zoom={14}
                        markers={[{ id: foodDetailsView.id, sourceId: foodDetailsView.id, markerType: 'food', name: foodDetailsView.name, lat: foodDetailsView.lat, lng: foodDetailsView.lng, dayNum: 1, image: foodDetailsView.image, address: foodDetailsView.address || cityQuery, rating: foodDetailsView.rating, reviewCount: foodDetailsView.reviewCount, website: foodDetailsView.website || '', originalData: foodDetailsView }]}
                        activeDayNums={allDayNums}
                        className="trip-details__add-places-trip-map"
                        fitBounds={false}
                        popupMode="hover-preview"
                        onMarkerAddClick={openAddToTripFromMapMarker}
                        onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                      />
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-places-filter-days"
                      onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                    >
                      <CalendarIcon size={16} aria-hidden /> Filter days
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="trip-details__add-places-head">
                    <h2 id="add-food-title" className="trip-details__add-places-title">Add Food &amp; Beverages</h2>
                    <div className="trip-details__add-places-location">
                      <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                      <span>{trip.locations || trip.destination}</span>
                    </div>
                    <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={() => { setAddFoodOpen(false); }}>
                      <X size={20} aria-hidden />
                    </button>
                  </div>
                  <div className="trip-details__add-places-body trip-details__add-food-body">
                    <div className="trip-details__add-places-list-panel trip-details__add-food-panel">
                      <div className="trip-details__add-places-search-wrap">
                        <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                        <input
                          type="text"
                          className="trip-details__add-places-search-input"
                          placeholder="Search by place name..."
                          value={foodSearchQuery}
                          onChange={(e) => setFoodSearchQuery(e.target.value)}
                          aria-label="Search food and beverage places"
                        />
                      </div>

                      <div className="trip-details__add-food-toolbar">
                        <p className="trip-details__add-places-results">{foodPlaces.length} results found</p>
                        <div className="trip-details__add-food-toolbar-actions">
                          <select
                            className="trip-details__add-places-sort-select"
                            value={foodDietaryFilter}
                            onChange={(e) => setFoodDietaryFilter(e.target.value)}
                            aria-label="Filter food and beverage results"
                          >
                            {FOOD_FILTER_OPTIONS.map((filter) => (
                              <option key={filter} value={filter}>{filter}</option>
                            ))}
                          </select>
                          <select
                            className="trip-details__add-places-sort-select"
                            value={foodSortBy}
                            onChange={(e) => setFoodSortBy(e.target.value)}
                            aria-label="Sort food and beverage places"
                          >
                            {FOOD_SORT_OPTIONS.map((option) => (
                              <option key={option} value={option}>{option}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {discoveryError && (
                        <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                      )}
                      {discoveryData?.warning && (
                        <p className="trip-details__add-places-results">{discoveryData.warning}</p>
                      )}
                      {discoveryLoading && (
                        <p className="trip-details__add-places-results">Loading live food places for {cityQuery}...</p>
                      )}

                      <div className="trip-details__add-places-grid">
                        <button
                          type="button"
                          className="trip-details__add-places-card trip-details__add-places-card--manual"
                          onClick={() => {
                            const day = days.find((d) => d.dayNum === addFoodDay);
                            setCustomFoodName('');
                            setCustomFoodAddress('');
                            setCustomFoodAddressSelection(null);
                            setCustomFoodAddressSuggestionsOpen(false);
                            setCustomFoodDateKey(day?.date || days[0]?.date || '');
                            setAddCustomFoodOpen(true);
                          }}
                        >
                          <div className="trip-details__add-places-card-manual-icon">
                            <UtensilsCrossed size={24} aria-hidden />
                          </div>
                          <span className="trip-details__add-places-card-manual-text">Can&apos;t find what you need? Add manually.</span>
                        </button>

                        {foodPlaces.map((foodPlace) => (
                          <div
                            key={foodPlace.id}
                            className="trip-details__add-places-card"
                            onClick={() => setFoodDetailsView(foodPlace)}
                            role="button"
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFoodDetailsView(foodPlace); } }}
                          >
                            <img src={resolveImageUrl(foodPlace.image, foodPlace.name, 'restaurant')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                            <button
                              type="button"
                              className="trip-details__add-places-card-heart"
                              aria-label="Save to wishlist"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Heart size={18} fill="none" aria-hidden />
                            </button>
                            <div className="trip-details__add-places-card-info">
                              <span className="trip-details__add-places-card-name">{foodPlace.name}</span>
                              <span className="trip-details__add-places-card-rating">{foodPlace.rating} ({foodPlace.reviewCount?.toLocaleString() ?? '0'})</span>
                              {foodPlace.dietaryTags?.length > 0 && (
                                <div className="trip-details__add-food-card-badges">
                                  {foodPlace.dietaryTags.slice(0, 2).map((tag) => (
                                    <span key={tag} className="trip-details__add-food-card-badge">{tag}</span>
                                  ))}
                                </div>
                              )}
                              <p className="trip-details__add-food-card-address">{foodPlace.priceLevel} · {foodPlace.address}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!discoveryLoading && !discoveryError && foodPlaces.length === 0 && (
                        <p className="trip-details__add-places-results">No food places found for this destination yet. Try a broader search or add one manually.</p>
                      )}
                    </div>
                    <div className="trip-details__add-places-map-panel">
                      <div className="trip-details__add-places-map">
                        <TripMap
                          center={mapCenter}
                          zoom={11}
                          markers={foodMapMarkers}
                          activeDayNums={allDayNums}
                          className="trip-details__add-places-trip-map"
                          fitBounds={foodMapMarkers.length > 0}
                          popupMode="hover-preview"
                          onMarkerAddClick={openAddToTripFromMapMarker}
                          onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                        />
                      </div>
                      <button
                        type="button"
                        className="trip-details__add-places-filter-days"
                        onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                      >
                        <CalendarIcon size={16} aria-hidden /> Filter days
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        );
      })()}

      {addStaysOpen && (() => {
        const showingStayDetail = stayDetailsView != null;
        const stayWindow = stayDetailsView ? getStayWindow(stayDetailsView) : null;
        const stayHasBookingData = hasStayBookingData(stayDetailsView);

        const stayMapMarkers = filteredStays
          .filter((stay) => stay.lat != null && stay.lng != null)
          .map((stay, index) => ({
            id: stay.id,
            sourceId: stay.id,
            markerType: 'stay',
            name: stay.name,
            lat: stay.lat,
            lng: stay.lng,
            dayNum: (index % Math.max(days.length, 1)) + 1,
            address: stay.address || cityQuery,
            rating: stay.rating,
            reviewCount: stay.reviewCount,
            image: stay.image,
            originalData: stay,
          }));

        return (
          <>
            <button
              type="button"
              className="trip-details__modal-backdrop"
              aria-label="Close"
              onClick={() => { setAddStaysOpen(false); setStayDetailsView(null); }}
            />
            <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingStayDetail ? 'stay-detail-title' : 'add-stays-title'} aria-modal="true">
              {showingStayDetail ? (
                // Stay Detail View
                <div className="trip-details__add-places-body">
                  <div className="trip-details__place-detail-panel">
                    <div className="trip-details__place-detail-header">
                      <button type="button" className="trip-details__place-detail-back" onClick={() => { setStayDetailsView(null); setStayDetailsTab('overview'); }} aria-label="Back to list">
                        <ArrowLeft size={20} aria-hidden /> Back
                      </button>
                      <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={() => { setAddStaysOpen(false); setStayDetailsView(null); }}>
                        <X size={20} aria-hidden />
                      </button>
                      <h1 id="stay-detail-title" className="trip-details__place-detail-name">{stayDetailsView.name}</h1>
                      <div className="trip-details__place-detail-meta">
                        <span className="trip-details__place-detail-rating">
                          {[...Array(stayDetailsView.starRating || 5)].map((_, i) => (
                            <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" aria-hidden />
                          ))}
                          <span style={{ marginLeft: '8px' }}>{stayDetailsView.rating} ({stayDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)</span>
                        </span>
                        <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                          <Heart size={20} aria-hidden />
                        </button>
                      </div>
                      {Array.isArray(stayDetailsView.images) && stayDetailsView.images.length > 0 && (
                        <div className="trip-details__place-detail-gallery">
                          <div className="trip-details__place-detail-gallery-main">
                            <img src={resolveImageUrl(stayDetailsView.images[0], stayDetailsView.name, 'hotel')} alt={stayDetailsView.name} className="trip-details__place-detail-img trip-details__place-detail-img--main" onError={handleImageError} />
                          </div>
                          <div className="trip-details__place-detail-gallery-grid">
                            {stayDetailsView.images.slice(1, 5).map((img, idx) => (
                              <img key={`stay-gallery-${idx}`} src={resolveImageUrl(img, stayDetailsView.name, 'hotel')} alt="" className="trip-details__place-detail-img trip-details__place-detail-img--secondary" onError={handleImageError} />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="trip-details__place-detail-tabs">
                      {stayHasBookingData && (
                        <button type="button" className={`trip-details__place-detail-tab ${stayDetailsTab === 'booking' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setStayDetailsTab('booking')}>Your booking</button>
                      )}
                      <button type="button" className={`trip-details__place-detail-tab ${stayDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setStayDetailsTab('overview')}>Overview</button>
                      <button type="button" className={`trip-details__place-detail-tab ${stayDetailsTab === 'rooms' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setStayDetailsTab('rooms')}>Rooms</button>
                      <button type="button" className={`trip-details__place-detail-tab ${stayDetailsTab === 'policies' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setStayDetailsTab('policies')}>Policies</button>
                      <button type="button" className={`trip-details__place-detail-tab ${stayDetailsTab === 'nearby' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setStayDetailsTab('nearby')}>Stays Nearby</button>
                    </div>
                    <div className="trip-details__place-detail-content">
                      {stayDetailsTab === 'booking' ? (
                        <>
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Your stay booking</h3>
                            {stayWindow && (
                              <ul className="trip-details__place-detail-list">
                                <li><strong>Check-in:</strong> {formatStayDateTime(stayWindow.checkInDate, stayWindow.checkInTime)}</li>
                                <li><strong>Check-out:</strong> {formatStayDateTime(stayWindow.checkOutDate, stayWindow.checkOutTime)}</li>
                              </ul>
                            )}
                          </div>
                          {Number(stayDetailsView.total || 0) > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Cost</h3>
                              <p className="trip-details__place-detail-section-text">{currency} {Number(stayDetailsView.total).toFixed(2)}</p>
                            </div>
                          )}
                          {String(stayDetailsView.notes || '').trim() && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Notes</h3>
                              <p className="trip-details__place-detail-section-text">{stayDetailsView.notes}</p>
                            </div>
                          )}
                          {String(stayDetailsView.externalLink || '').trim() && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Booking link</h3>
                              <a href={stayDetailsView.externalLink} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                                {String(stayDetailsView.externalLink).replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                              </a>
                            </div>
                          )}
                          {Array.isArray(stayDetailsView.attachments) && stayDetailsView.attachments.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Travel documents</h3>
                              <ul className="trip-details__place-detail-list">
                                {stayDetailsView.attachments.map((doc, idx) => {
                                  const attachment = normalizeAttachment(doc);
                                  if (!attachment) return null;
                                  return (
                                    <li key={`stay-doc-${idx}`}>
                                      {attachment.url ? (
                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">{attachment.name}</a>
                                      ) : (
                                        attachment.name
                                      )}
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          )}
                          <div className="trip-details__place-detail-section" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="trip-details__place-detail-add-btn"
                              onClick={() => setEditPlaceItem(stayDetailsView)}
                            >
                              Edit booking details
                            </button>
                          </div>
                        </>
                      ) : stayDetailsTab === 'overview' ? (
                        <>
                          <div className="trip-details__place-detail-section" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="trip-details__place-detail-add-btn"
                              onClick={() => openAddStayToTrip(stayDetailsView)}
                            >
                              Add to trip
                            </button>
                          </div>
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Overview</h3>
                            <p className="trip-details__place-detail-section-text">{stayDetailsView.overview || stayDetailsView.description}</p>
                          </div>
                          {stayDetailsView.address && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Address</h3>
                              <p className="trip-details__place-detail-section-text">
                                <MapPin size={14} aria-hidden style={{ display: 'inline', marginRight: '6px' }} />
                                {stayDetailsView.address}
                              </p>
                            </div>
                          )}
                          {Array.isArray(stayDetailsView.surrounding) && stayDetailsView.surrounding.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Surrounding</h3>
                              <ul className="trip-details__place-detail-list">
                                {stayDetailsView.surrounding.map((item, idx) => (
                                  <li key={idx}>{item.name}: {item.distance}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(stayDetailsView.amenities) && stayDetailsView.amenities.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">What this accommodation offers</h3>
                              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                                {stayDetailsView.amenities.map((amenity, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Check size={16} color="#16a34a" aria-hidden />
                                    <span>{amenity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : stayDetailsTab === 'rooms' ? (
                        <div className="trip-details__place-detail-section">
                          <h3 className="trip-details__place-detail-section-title">Choose your room</h3>
                          {Array.isArray(stayDetailsView.roomTypes) && stayDetailsView.roomTypes.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                              {stayDetailsView.roomTypes.map((room) => (
                                <div key={room.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                                  <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{room.name}</h4>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
                                    <Bed size={16} aria-hidden /> {room.beds}
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
                                    <div>
                                      <div style={{ fontSize: '20px', fontWeight: '700' }}>
                                        {stayDetailsView.currency === 'USD' ? '$' : stayDetailsView.currency}
                                        {room.price.toFixed(2)}
                                      </div>
                                      {room.originalPrice && (
                                        <div style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through' }}>
                                          {stayDetailsView.currency === 'USD' ? '$' : stayDetailsView.currency}
                                          {room.originalPrice.toFixed(2)}
                                        </div>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      style={{
                                        marginLeft: 'auto',
                                        padding: '8px 16px',
                                        backgroundColor: '#2563eb',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: '500',
                                      }}
                                      onClick={() => {
                                        const bookingLink = buildStayFallbackLink(stayDetailsView, cityQuery);
                                        window.open(bookingLink, '_blank', 'noopener,noreferrer');
                                      }}
                                    >
                                      Book now
                                    </button>
                                  </div>
                                  <div style={{ marginTop: '12px', display: 'flex', gap: '12px', fontSize: '12px', color: '#6b7280' }}>
                                    {room.mealsIncluded && <span>✓ Meals included</span>}
                                    {room.refundable && <span>✓ Refundable</span>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="trip-details__place-detail-section-text">No room information available.</p>
                          )}
                        </div>
                      ) : stayDetailsTab === 'policies' ? (
                        <>
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Hotel Policies</h3>
                            {stayDetailsView.policies && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Check-in</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.checkIn}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Check-out</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.checkOut}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Children and Extra Beds</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.children}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Pets</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.pets}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Smoking</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.smoking}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Parking</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.parking}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Cancellation Policy</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.cancellation}</p>
                                </div>
                                <div>
                                  <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Payment</h4>
                                  <p className="trip-details__place-detail-section-text">{stayDetailsView.policies.payment}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : stayDetailsTab === 'nearby' ? (
                        <div className="trip-details__place-detail-section">
                          <h3 className="trip-details__place-detail-section-title">Stays Nearby</h3>
                          {filteredStays.filter(s => s.id !== stayDetailsView.id).slice(0, 8).length > 0 ? (
                            <div className="trip-details__place-detail-nearby-grid">
                              {filteredStays.filter(s => s.id !== stayDetailsView.id).slice(0, 8).map((nearStay) => (
                                <button
                                  key={nearStay.id}
                                  type="button"
                                  className="trip-details__place-detail-nearby-card"
                                  onClick={() => { setStayDetailsView(nearStay); setStayDetailsTab('overview'); }}
                                >
                                  <img src={resolveImageUrl(nearStay.image, nearStay.name, 'hotel')} alt="" className="trip-details__place-detail-nearby-img" onError={handleImageError} />
                                  <button type="button" className="trip-details__place-detail-nearby-heart" aria-label="Save" onClick={(e) => e.stopPropagation()}>
                                    <Heart size={16} aria-hidden />
                                  </button>
                                  <div className="trip-details__place-detail-nearby-info">
                                    <span className="trip-details__place-detail-nearby-name">{nearStay.name}</span>
                                    <span className="trip-details__place-detail-nearby-rating">
                                      {[...Array(nearStay.starRating || 5)].map((_, i) => (
                                        <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" aria-hidden />
                                      ))}
                                    </span>
                                    <span className="trip-details__place-detail-nearby-rating">
                                      {nearStay.currency === 'USD' ? '$' : nearStay.currency}{nearStay.pricePerNight}/night
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="trip-details__place-detail-section-text">No nearby stays found.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : (
                // Stays List View
                <>
                  <div className="trip-details__add-places-head">
                    <h2 id="add-stays-title" className="trip-details__add-places-title">Add Stays</h2>
                    <div className="trip-details__add-places-location">
                      <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                      <span>{trip.locations || trip.destination}</span>
                    </div>
                    <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={() => setAddStaysOpen(false)}>
                      <X size={20} aria-hidden />
                    </button>
                  </div>
                  <div className="trip-details__add-places-body">
                    <div className="trip-details__add-places-list-panel">
                      <div className="trip-details__add-places-search-wrap">
                        <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                        <input
                          type="text"
                          className="trip-details__add-places-search-input"
                          placeholder="Search by hotel name..."
                          value={staySearchQuery}
                          onChange={(e) => setStaySearchQuery(e.target.value)}
                          aria-label="Search accommodations"
                        />
                      </div>

                      <div className="trip-details__add-food-toolbar">
                        <p className="trip-details__add-places-results">{filteredStays.length} results found</p>
                        <div className="trip-details__add-food-toolbar-actions">
                        <select
                          className="trip-details__add-places-sort-select"
                          value={stayTypeFilter}
                          onChange={(e) => setStayTypeFilter(e.target.value)}
                          aria-label="Filter by accommodation type"
                        >
                          {stayTypeOptions.map((type) => (
                            <option key={type} value={type}>{type === 'All' ? 'All Types' : type}</option>
                          ))}
                        </select>
                        <select
                          className="trip-details__add-places-sort-select"
                          value={stayPriceRange}
                          onChange={(e) => setStayPriceRange(e.target.value)}
                          aria-label="Filter by price range"
                        >
                          <option value="All">All Prices</option>
                          <option value="0-100">Under $100</option>
                          <option value="100-200">$100 - $200</option>
                          <option value="200-400">$200 - $400</option>
                          <option value="400+">$400+</option>
                        </select>
                        <select
                          className="trip-details__add-places-sort-select"
                          value={staySortBy}
                          onChange={(e) => setStaySortBy(e.target.value)}
                          aria-label="Sort accommodations"
                        >
                          <option value="Recommended">Recommended</option>
                          <option value="Price: Low to High">Price: Low to High</option>
                          <option value="Price: High to Low">Price: High to Low</option>
                          <option value="Rating: High to Low">Rating: High to Low</option>
                        </select>
                      </div>
                    </div>

                    {discoveryError && (
                      <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                    )}
                    {discoveryData?.warning && (
                      <p className="trip-details__add-places-results">{discoveryData.warning}</p>
                    )}
                    {discoveryLoading && (
                      <p className="trip-details__add-places-results">Loading stays for {cityQuery}...</p>
                    )}

                    <div className="trip-details__add-places-grid">
                      {filteredStays.map((stay) => (
                        <button
                          key={stay.id}
                          type="button"
                          className="trip-details__add-places-card"
                          onClick={() => { setStayDetailsView(stay); setStayDetailsTab('overview'); }}
                        >
                          <img src={resolveImageUrl(stay.image, stay.name, 'hotel')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                          <button type="button" className="trip-details__add-places-card-heart" aria-label="Save" onClick={(e) => e.stopPropagation()}>
                            <Heart size={18} fill="none" aria-hidden />
                          </button>
                          <div className="trip-details__add-places-card-info">
                            <span className="trip-details__add-places-card-name">{stay.name}</span>
                            <span className="trip-details__add-places-card-rating">
                              {[...Array(stay.starRating || 5)].map((_, i) => (
                                <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" aria-hidden />
                              ))}
                              <span style={{ marginLeft: '6px' }}>{stay.rating} ({stay.reviewCount?.toLocaleString() ?? '0'})</span>
                            </span>
                            <span className="trip-details__add-places-card-address">{stay.type}</span>
                            <span className="trip-details__add-places-card-price" style={{ fontWeight: '600', color: '#2563eb' }}>
                              {stay.currency === 'USD' ? '$' : stay.currency}{stay.pricePerNight}/night
                            </span>
                          </div>
                        </button>
                      ))}
                        {filteredStays.length === 0 && !discoveryLoading && (
                          <p className="trip-details__add-places-results">No stays found. Try adjusting your filters.</p>
                        )}
                      </div>
                    </div>

                    <div className="trip-details__add-places-map-panel">
                      <div className="trip-details__add-places-map">
                        <TripMap
                          center={discoveryData?.center || [1.290270, 103.851959]}
                          zoom={13}
                          markers={stayMapMarkers}
                          activeDayNums={allDayNums}
                          className="trip-details__add-places-trip-map"
                          fitBounds={stayMapMarkers.length > 0}
                          popupMode="hover-preview"
                          // onMarkerAddClick={openAddToTripFromMapMarker}
                          // onMarkerViewDetails={(marker) => { setStayDetailsView(marker.originalData); setStayDetailsTab('overview'); }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        );
      })()}

      {addExperiencesOpen && (() => {
        const showingExperienceDetail = experienceDetailsView != null;
        const experiences = filteredExperiences;
        const experienceMapMarkers = experiences
          .filter((experience) => experience.lat != null && experience.lng != null)
          .map((experience, index) => ({
            id: experience.id,
            sourceId: experience.id,
            markerType: 'experience',
            name: experience.name,
            lat: experience.lat,
            lng: experience.lng,
            dayNum: (index % Math.max(days.length, 1)) + 1,
            address: experience.address || cityQuery,
            rating: experience.rating,
            reviewCount: experience.reviewCount,
            image: experience.image,
            website: experience.website || '',
            originalData: experience,
          }));
        return (
          <>
            <button
              type="button"
              className="trip-details__modal-backdrop"
              aria-label="Close"
              onClick={() => { setAddExperiencesOpen(false); setExperienceDetailsView(null); }}
            />
            <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingExperienceDetail ? 'experience-detail-title' : 'add-experiences-title'} aria-modal="true">
              {showingExperienceDetail ? (
                // Experience Detail View
                <div className="trip-details__add-places-body">
                  <div className="trip-details__place-detail-panel">
                    <div className="trip-details__place-detail-header">
                      <button type="button" className="trip-details__place-detail-back" onClick={() => { setExperienceDetailsView(null); setExperienceDetailsTab('overview'); }} aria-label="Back to list">
                        <ArrowLeft size={20} aria-hidden /> Back
                      </button>
                      <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={() => { setAddExperiencesOpen(false); setExperienceDetailsView(null); }}>
                        <X size={20} aria-hidden />
                      </button>
                      <h1 id="experience-detail-title" className="trip-details__place-detail-name">{experienceDetailsView.name}</h1>
                      <div className="trip-details__place-detail-meta">
                        <span className="trip-details__place-detail-rating">
                          <Star size={16} fill="currentColor" aria-hidden /> {experienceDetailsView.rating} ({experienceDetailsView.reviewCount?.toLocaleString() ?? '0'})
                        </span>
                        <span className="trip-details__place-detail-badge">{experienceDetailsView.type}</span>
                        <span className="trip-details__place-detail-badge">Duration: {experienceDetailsView.duration}</span>
                        <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                          <Heart size={20} aria-hidden />
                        </button>
                      </div>
                    </div>
                    <div className="trip-details__place-detail-hero">
                      <img src={resolveImageUrl(experienceDetailsView.image, experienceDetailsView.name, 'activity')} alt="" className="trip-details__place-detail-img" onError={handleImageError} />
                    </div>
                    <div className="trip-details__place-detail-tabs">
                      <button type="button" className={`trip-details__place-detail-tab ${experienceDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setExperienceDetailsTab('overview')}>Overview</button>
                      <button type="button" className={`trip-details__place-detail-tab ${experienceDetailsTab === 'booking' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setExperienceDetailsTab('booking')}>Package Options</button>
                      <button type="button" className={`trip-details__place-detail-tab ${experienceDetailsTab === 'included' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setExperienceDetailsTab('included')}>Included / Excluded</button>
                    </div>
                    <div className="trip-details__place-detail-content">
                      {experienceDetailsTab === 'overview' ? (
                        <>
                          {experienceDetailsView.description && (
                            <>
                              <h3 className="trip-details__place-detail-section-title">Description</h3>
                              <p className="trip-details__place-detail-overview">{experienceDetailsView.description}</p>
                            </>
                          )}
                          {experienceDetailsView.highlights && experienceDetailsView.highlights.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Highlights</h3>
                              <ul className="trip-details__place-detail-hours">
                                {experienceDetailsView.highlights.map((highlight, idx) => (
                                  <li key={idx}>{highlight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {experienceDetailsView.address && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Address</h3>
                              <p className="trip-details__place-detail-section-text">{experienceDetailsView.address}</p>
                            </div>
                          )}
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Review</h3>
                            <p className="trip-details__place-detail-section-text">
                              <Star size={14} fill="currentColor" aria-hidden /> {experienceDetailsView.rating} ({experienceDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)
                            </p>
                          </div>
                        </>
                      ) : experienceDetailsTab === 'booking' ? (
                        <>
                          <div className="trip-details__place-detail-section">
                            <h3 className="trip-details__place-detail-section-title">Booking Options</h3>
                            <p className="trip-details__place-detail-section-text">The operator will reach out to you after purchase nearing your dates.</p>

                            {experienceDetailsView.bookingOptions && experienceDetailsView.bookingOptions.length > 0 && (
                              <div style={{ marginTop: '16px' }}>
                                {experienceDetailsView.bookingOptions.map((option) => (
                                  <div key={option.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>{option.type} - {option.option}</h4>
                                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>{option.description}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div>
                                        <span style={{ fontSize: '20px', fontWeight: '700' }}>{experienceDetailsView.currency}{option.price.toFixed(2)}</span>
                                        {option.originalPrice && (
                                          <span style={{ fontSize: '14px', color: '#9ca3af', textDecoration: 'line-through', marginLeft: '8px' }}>
                                            {experienceDetailsView.currency}{option.originalPrice.toFixed(2)}
                                          </span>
                                        )}
                                        <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>/ traveller</span>
                                      </div>
                                      <button
                                        type="button"
                                        className="trip-details__place-detail-add-btn"
                                        style={{ padding: '8px 16px' }}
                                        onClick={() => {
                                          const day = days[0];
                                          setBookingExperience(experienceDetailsView);
                                          setBookingOption(option);
                                          setBookingDate(day?.date || '');
                                          setBookingStartTime('07:00');
                                          setBookingTravellers(2);
                                          setBookingNotes('');
                                          setExperienceBookingModalOpen(true);
                                        }}
                                      >
                                        Add to Trip
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          {experienceDetailsView.importantInfo && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Important Information</h3>
                              <p className="trip-details__place-detail-section-text">{experienceDetailsView.importantInfo}</p>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          {experienceDetailsView.included && experienceDetailsView.included.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">What's Included</h3>
                              <ul className="trip-details__place-detail-hours">
                                {experienceDetailsView.included.map((item, idx) => (
                                  <li key={idx} style={{ color: '#059669' }}>✓ {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {experienceDetailsView.excluded && experienceDetailsView.excluded.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">What's Excluded</h3>
                              <ul className="trip-details__place-detail-hours">
                                {experienceDetailsView.excluded.map((item, idx) => (
                                  <li key={idx} style={{ color: '#dc2626' }}>✗ {item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {experienceDetailsView.cancellationPolicy && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Cancellation Policy</h3>
                              <p className="trip-details__place-detail-section-text">{experienceDetailsView.cancellationPolicy}</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="trip-details__add-places-map-panel">
                    <div className="trip-details__add-places-map">
                      <TripMap
                        center={experienceDetailsView.lat && experienceDetailsView.lng ? [experienceDetailsView.lat, experienceDetailsView.lng] : mapCenter}
                        zoom={12}
                        markers={experienceDetailsView.lat && experienceDetailsView.lng ? [{ id: experienceDetailsView.id, sourceId: experienceDetailsView.id, markerType: 'experience', name: experienceDetailsView.name, lat: experienceDetailsView.lat, lng: experienceDetailsView.lng, dayNum: 1, image: experienceDetailsView.image, address: experienceDetailsView.address || cityQuery, rating: experienceDetailsView.rating, reviewCount: experienceDetailsView.reviewCount, website: experienceDetailsView.website || '', originalData: experienceDetailsView }] : []}
                        activeDayNums={allDayNums}
                        className="trip-details__add-places-trip-map"
                        fitBounds={false}
                        popupMode="hover-preview"
                        onMarkerAddClick={openAddToTripFromMapMarker}
                        onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                      />
                    </div>
                    <button
                      type="button"
                      className="trip-details__add-places-filter-days"
                      onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                    >
                      <CalendarIcon size={16} aria-hidden /> Filter days
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="trip-details__add-places-head">
                    <h2 id="add-experiences-title" className="trip-details__add-places-title">Add Experiences</h2>
                    <div className="trip-details__add-places-location">
                      <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                      <span>{trip.locations || trip.destination}</span>
                    </div>
                    <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={() => { setAddExperiencesOpen(false); setExperienceDetailsView(null); }}>
                      <X size={20} aria-hidden />
                    </button>
                  </div>
                  <div className="trip-details__add-places-body">
                    <div className="trip-details__add-places-list-panel">
                      <div className="trip-details__add-places-search-wrap">
                        <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                        <input
                          type="text"
                          className="trip-details__add-places-search-input"
                          placeholder="Search by experience name..."
                          value={experienceSearchQuery}
                          onChange={(e) => setExperienceSearchQuery(e.target.value)}
                          aria-label="Search experiences"
                        />
                      </div>

                      <div className="trip-details__add-food-toolbar">
                        <p className="trip-details__add-places-results">{experiences.length} results found</p>
                        <div className="trip-details__add-food-toolbar-actions">
                            <select
                              className="trip-details__add-places-sort-select"
                              value={experienceTypeFilter}
                              onChange={(e) => setExperienceTypeFilter(e.target.value)}
                              aria-label="Filter by experience type"
                            >
                              {EXPERIENCE_TYPES.map((type) => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          <select
                            className="trip-details__add-places-sort-select"
                            value={experiencePriceRange}
                            onChange={(e) => setExperiencePriceRange(e.target.value)}
                            aria-label="Filter by price range"
                          >
                            {EXPERIENCE_PRICE_RANGES.map((range) => (
                              <option key={range} value={range}>{range}</option>
                            ))}
                          </select>
                          <select
                            className="trip-details__add-places-sort-select"
                            value={experienceDurationFilter}
                            onChange={(e) => setExperienceDurationFilter(e.target.value)}
                            aria-label="Filter by duration"
                          >
                            {EXPERIENCE_DURATIONS.map((duration) => (
                              <option key={duration} value={duration}>Duration: {duration}</option>
                            ))}
                          </select>
                          <select
                            className="trip-details__add-places-sort-select"
                            value={experienceSortBy}
                            onChange={(e) => setExperienceSortBy(e.target.value)}
                            aria-label="Sort experiences"
                          >
                            {EXPERIENCE_SORT_OPTIONS.map((option) => (
                              <option key={option} value={option}>Sort by: {option}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {discoveryError && (
                        <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                      )}
                      {discoveryData?.warning && (
                        <p className="trip-details__add-places-results">{discoveryData.warning}</p>
                      )}
                      {discoveryLoading && (
                        <p className="trip-details__add-places-results">Loading live experiences for {cityQuery}...</p>
                      )}

                      <div className="trip-details__add-places-grid">
                        <button
                          type="button"
                          className="trip-details__add-places-card trip-details__add-places-card--manual"
                          onClick={() => {
                            const day = days.find((d) => d.dayNum === (addSheetDay || 1));
                            setCustomExperienceName('');
                            setCustomExperienceType('Attraction');
                            setCustomExperienceAddress('');
                            setCustomExperienceDateKey(day?.date || days[0]?.date || '');
                            setCustomExperienceStartTime('07:00');
                            setCustomExperienceDurationHrs(2);
                            setCustomExperienceDurationMins(0);
                            setCustomExperienceNote('');
                            setCustomExperienceCost('');
                            setCustomExperienceExternalLink('');
                            setCustomExperienceTravelDocs([]);
                            setAddCustomExperienceOpen(true);
                          }}
                        >
                          <div className="trip-details__add-places-card-manual-icon">
                            <Ticket size={24} aria-hidden />
                          </div>
                          <span className="trip-details__add-places-card-manual-text">Can&apos;t find what you need? Add manually.</span>
                        </button>

                        {experiences.map((experience) => (
                          <div
                            key={experience.id}
                            className="trip-details__add-places-card"
                            onClick={() => setExperienceDetailsView(experience)}
                            role="button"
                            tabIndex={0}
                            style={{ cursor: 'pointer' }}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExperienceDetailsView(experience); } }}
                          >
                            <img src={resolveImageUrl(experience.image, experience.name, 'activity')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                            <button
                              type="button"
                              className="trip-details__add-places-card-heart"
                              aria-label="Save to wishlist"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Heart size={18} fill="none" aria-hidden />
                            </button>
                            <div className="trip-details__add-places-card-info">
                              <span className="trip-details__place-detail-badge" style={{ marginBottom: '4px', display: 'inline-block' }}>{experience.type}</span>
                              <span className="trip-details__add-places-card-name">{experience.name}</span>
                              <div className="trip-details__add-food-card-meta">
                                <span><Star size={14} fill="currentColor" aria-hidden style={{ verticalAlign: 'middle' }} /> {experience.rating} ({experience.reviewCount?.toLocaleString() ?? '0'})</span>
                                <span><Clock size={14} aria-hidden style={{ verticalAlign: 'middle' }} /> {experience.duration}</span>
                              </div>
                              <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>{experience.currency}{experience.price.toFixed(2)}</span>
                                  {experience.originalPrice && (
                                    <span style={{ fontSize: '12px', color: '#9ca3af', textDecoration: 'line-through', marginLeft: '4px' }}>
                                      {experience.currency}{experience.originalPrice.toFixed(2)}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>/ traveller</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {!discoveryLoading && !discoveryError && experiences.length === 0 && (
                        <p className="trip-details__add-places-results">No experiences found for this destination yet. Try adjusting filters.</p>
                      )}
                    </div>
                    <div className="trip-details__add-places-map-panel">
                      <div className="trip-details__add-places-map">
                        <TripMap
                          center={mapCenter}
                          zoom={11}
                          markers={experienceMapMarkers}
                          activeDayNums={allDayNums}
                          className="trip-details__add-places-trip-map"
                          fitBounds={experienceMapMarkers.length > 0}
                          popupMode="hover-preview"
                          onMarkerAddClick={openAddToTripFromMapMarker}
                          onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                        />
                      </div>
                      <button
                        type="button"
                        className="trip-details__add-places-filter-days"
                        onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
                      >
                        <CalendarIcon size={16} aria-hidden /> Filter days
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        );
      })()}

      {addCustomExperienceOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddCustomExperienceOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="custom-experience-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="custom-experience-title" className="trip-details__custom-place-title">Add Custom Experience</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddCustomExperienceOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const [fallbackLat, fallbackLng] = mapCenter;
                const costNum = parseFloat(customExperienceCost) || 0;
                setTripExpenseItems((prev) => [...prev, {
                  id: `experience-${Date.now()}`,
                  name: customExperienceName,
                  total: costNum,
                  categoryId: 'experiences',
                  category: 'Experience',
                  date: customExperienceDateKey,
                  detail: `${customExperienceType} · ${customExperienceAddress}`,
                  Icon: Ticket,
                  lat: fallbackLat,
                  lng: fallbackLng,
                  notes: customExperienceNote || '',
                  attachments: customExperienceTravelDocs.map((file, idx) => ({
                    id: `experience-doc-${Date.now()}-${idx}`,
                    name: file?.name || `Document ${idx + 1}`,
                    size: file?.size || 0,
                    type: file?.type || '',
                  })),
                  startTime: customExperienceStartTime,
                  durationHrs: customExperienceDurationHrs,
                  durationMins: customExperienceDurationMins,
                  externalLink: customExperienceExternalLink || '',
                  placeImageUrl: '',
                }]);
                setAddCustomExperienceOpen(false);
              }}
            >
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Experience name <span className="trip-details__custom-place-required">*</span>
                  <input type="text" className="trip-details__custom-place-input" placeholder="Enter experience name" value={customExperienceName} onChange={(e) => setCustomExperienceName(e.target.value)} required />
                </label>
                <label className="trip-details__custom-place-label">
                  Experience type <span className="trip-details__custom-place-required">*</span>
                  <select className="trip-details__custom-place-select" value={customExperienceType} onChange={(e) => setCustomExperienceType(e.target.value)} required>
                    {EXPERIENCE_TYPES.filter((type) => type !== 'All').map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="trip-details__custom-place-label">
                Address / meeting point <span className="trip-details__custom-place-required">*</span>
                <input type="text" className="trip-details__custom-place-input" placeholder="Enter meeting point or location" value={customExperienceAddress} onChange={(e) => setCustomExperienceAddress(e.target.value)} required />
              </label>
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Date <span className="trip-details__custom-place-required">*</span>
                  <select className="trip-details__custom-place-select" value={customExperienceDateKey} onChange={(e) => setCustomExperienceDateKey(e.target.value)} required>
                    <option value="">Select day</option>
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>Day {d.dayNum}: {d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="trip-details__custom-place-label">
                  Start time <span className="trip-details__custom-place-required">*</span>
                  <input type="time" className="trip-details__custom-place-input" value={customExperienceStartTime} onChange={(e) => setCustomExperienceStartTime(e.target.value)} required />
                </label>
              </div>
              <label className="trip-details__custom-place-label">
                Duration <span className="trip-details__custom-place-required">*</span>
                <div className="trip-details__custom-place-duration">
                  <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customExperienceDurationHrs} onChange={(e) => setCustomExperienceDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
                  <span> hr </span>
                  <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customExperienceDurationMins} onChange={(e) => setCustomExperienceDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
                  <span> mins</span>
                </div>
              </label>
              <label className="trip-details__custom-place-label">
                Note (Optional)
                <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customExperienceNote} onChange={(e) => setCustomExperienceNote(e.target.value)} rows={3} />
              </label>
              <label className="trip-details__custom-place-label">
                Cost (Optional)
                <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customExperienceCost} onChange={(e) => setCustomExperienceCost(e.target.value)} />
                <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
              </label>
              <label className="trip-details__custom-place-label">
                External link (Optional)
                <input type="url" className="trip-details__custom-place-input" placeholder="https://" value={customExperienceExternalLink} onChange={(e) => setCustomExperienceExternalLink(e.target.value)} />
              </label>
              <label className="trip-details__custom-place-label">
                Travel Documents
                <p className="trip-details__custom-place-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
                <input
                  id="custom-experience-docs"
                  type="file"
                  multiple
                  accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                  className="trip-details__custom-place-file-input"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setCustomExperienceTravelDocs(files);
                  }}
                />
                <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-experience-docs')?.click()}>
                  <Paperclip size={18} aria-hidden /> Attach files
                  {customExperienceTravelDocs.length > 0 && <span className="trip-details__custom-place-attach-count"> ({customExperienceTravelDocs.length})</span>}
                </button>
              </label>
              <div className="trip-details__custom-place-actions">
                <button type="button" className="trip-details__modal-cancel" onClick={() => setAddCustomExperienceOpen(false)}>Cancel</button>
                <button type="submit" className="trip-details__custom-place-submit">Add to trip</button>
              </div>
            </form>
          </div>
        </>
      )}

      {addCustomPlaceOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddCustomPlaceOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="custom-place-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="custom-place-title" className="trip-details__custom-place-title">Add Custom Place</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddCustomPlaceOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const costNum = parseFloat(customPlaceCost) || 0;
                const resolvedAddress = customPlaceAddressSelection
                  ?? searchAddressSuggestions(trip.destination || trip.locations, customPlaceAddress)[0];
                const [fallbackLat, fallbackLng] = mapCenter;
                setTripExpenseItems((prev) => [...prev, {
                  id: `place-${Date.now()}`,
                  name: customPlaceName,
                  total: costNum,
                  categoryId: 'places',
                  category: 'Places',
                  date: customPlaceDateKey,
                  detail: resolvedAddress?.address && resolvedAddress.address !== 'Custom location'
                    ? resolvedAddress.address
                    : (customPlaceAddress || 'Custom place'),
                  Icon: Camera,
                  lat: resolvedAddress?.lat ?? fallbackLat,
                  lng: resolvedAddress?.lng ?? fallbackLng,
                  notes: customPlaceNote || '',
                  attachments: [],
                  startTime: customPlaceStartTime,
                  durationHrs: customPlaceDurationHrs,
                  durationMins: customPlaceDurationMins,
                  externalLink: '',
                  placeImageUrl: '',
                  rating: null,
                  reviewCount: null,
                }]);
                setAddCustomPlaceOpen(false);
                setCustomPlaceName('');
                setCustomPlaceAddress('');
                setCustomPlaceAddressSelection(null);
                setCustomPlaceAddressSuggestionsOpen(false);
                setCustomPlaceCost('');
                setCustomPlaceNote('');
                setCustomPlaceImage(null);
                setCustomPlaceTravelDocs([]);
                setCustomPlaceStartTime('07:00');
                setCustomPlaceDurationHrs(1);
                setCustomPlaceDurationMins(0);
              }}
            >
              <div className="trip-details__custom-place-upload">
                <input
                  type="file"
                  id="custom-place-image"
                  accept=".svg,.png,.jpg,.jpeg,.webp,.gif"
                  className="trip-details__custom-place-file-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCustomPlaceImage(f);
                  }}
                />
                <label htmlFor="custom-place-image" className="trip-details__custom-place-upload-label">
                  {customPlaceImage ? (
                    <span className="trip-details__custom-place-upload-preview">Image selected: {(customPlaceImage instanceof File) ? customPlaceImage.name : 'Preview'}</span>
                  ) : (
                    <>
                      <PlusCircle size={32} aria-hidden />
                      <span>Click to upload image or drag and drop</span>
                      <span className="trip-details__custom-place-upload-hint">SVG, PNG, JPG, WEBP or GIF (max. 800×400px)</span>
                    </>
                  )}
                </label>
              </div>
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Place name <span className="trip-details__custom-place-required">*</span>
                  <input type="text" className="trip-details__custom-place-input" placeholder="Enter the place name" value={customPlaceName} onChange={(e) => setCustomPlaceName(e.target.value)} required />
                </label>
                <label className="trip-details__custom-place-label">
                  Address <span className="trip-details__custom-place-required">*</span>
                  <span className="trip-details__custom-place-input-wrap trip-details__custom-transport-autofill-wrap">
                    <MapPin size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                    <input
                      type="text"
                      className="trip-details__custom-place-input"
                      placeholder="Search by landmark or address"
                      value={customPlaceAddress}
                      onChange={(e) => {
                        setCustomPlaceAddress(e.target.value);
                        setCustomPlaceAddressSelection(null);
                        setCustomPlaceAddressSuggestionsOpen(true);
                      }}
                      onFocus={() => setCustomPlaceAddressSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setCustomPlaceAddressSuggestionsOpen(false), 200)}
                      required
                    />
                    {customPlaceAddressSuggestionsOpen && customPlaceAddress.trim() && (
                      <ul className="trip-details__custom-transport-suggestions">
                        {searchAddressSuggestions(trip.destination || trip.locations, customPlaceAddress).map((suggestion) => (
                          <li key={suggestion.id}>
                            <button
                              type="button"
                              className="trip-details__custom-transport-suggestion"
                              onClick={() => {
                                setCustomPlaceAddress(suggestion.name);
                                setCustomPlaceAddressSelection(suggestion);
                                setCustomPlaceAddressSuggestionsOpen(false);
                              }}
                            >
                              <strong>{suggestion.name}</strong>
                              <span>{suggestion.address}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </label>
              </div>
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Date <span className="trip-details__custom-place-required">*</span>
                  <select
                    className="trip-details__custom-place-select"
                    value={customPlaceDateKey}
                    onChange={(e) => setCustomPlaceDateKey(e.target.value)}
                    required
                  >
                    <option value="">Select day</option>
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>Day {d.dayNum}: {d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="trip-details__custom-place-label">
                  Start time <span className="trip-details__custom-place-required">*</span>
                  <span className="trip-details__custom-place-input-wrap">
                    <Clock size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                    <input type="time" className="trip-details__custom-place-input" value={customPlaceStartTime} onChange={(e) => setCustomPlaceStartTime(e.target.value)} required />
                  </span>
                </label>
              </div>
              <label className="trip-details__custom-place-label">
                Duration <span className="trip-details__custom-place-required">*</span>
                <div className="trip-details__custom-place-duration">
                  <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customPlaceDurationHrs} onChange={(e) => setCustomPlaceDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
                  <span> hr </span>
                  <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customPlaceDurationMins} onChange={(e) => setCustomPlaceDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
                  <span> mins</span>
                </div>
              </label>
              <label className="trip-details__custom-place-label">
                Note (Optional)
                <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customPlaceNote} onChange={(e) => setCustomPlaceNote(e.target.value)} rows={3} />
              </label>
              <label className="trip-details__custom-place-label">
                Cost (Optional)
                <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customPlaceCost} onChange={(e) => setCustomPlaceCost(e.target.value)} />
                <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
              </label>
              <label className="trip-details__custom-place-label">
                Travel Documents
                <p className="trip-details__custom-place-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
                <input
                  id="custom-place-docs"
                  type="file"
                  multiple
                  accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                  className="trip-details__custom-place-file-input"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setCustomPlaceTravelDocs(files);
                  }}
                />
                <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-place-docs')?.click()}>
                  <Paperclip size={18} aria-hidden /> Attach files
                  {customPlaceTravelDocs.length > 0 && <span className="trip-details__custom-place-attach-count"> ({customPlaceTravelDocs.length})</span>}
                </button>
              </label>
              <div className="trip-details__custom-place-actions">
                <button type="button" className="trip-details__modal-cancel" onClick={() => setAddCustomPlaceOpen(false)}>Cancel</button>
                <button type="submit" className="trip-details__custom-place-submit">Add to trip</button>
              </div>
            </form>
          </div>
        </>
      )}

      {addCustomFoodOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddCustomFoodOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="custom-food-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="custom-food-title" className="trip-details__custom-place-title">Add Custom Food &amp; Beverage</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddCustomFoodOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const costNum = parseFloat(customFoodCost) || 0;
                const resolvedAddress = customFoodAddressSelection
                  ?? searchFoodAddressSuggestions(trip.destination || trip.locations, customFoodAddress)[0];
                const [fallbackLat, fallbackLng] = mapCenter;
                setTripExpenseItems((prev) => [...prev, {
                  id: `food-${Date.now()}`,
                  name: customFoodName,
                  total: costNum,
                  categoryId: 'food',
                  category: 'Food & Beverage',
                  date: customFoodDateKey,
                  detail: resolvedAddress?.address && resolvedAddress.address !== 'Custom location'
                    ? resolvedAddress.address
                    : (customFoodAddress || 'Custom food & beverage'),
                  Icon: UtensilsCrossed,
                  lat: resolvedAddress?.lat ?? fallbackLat,
                  lng: resolvedAddress?.lng ?? fallbackLng,
                  notes: customFoodNote || '',
                  attachments: [],
                  startTime: customFoodStartTime,
                  durationHrs: customFoodDurationHrs,
                  durationMins: customFoodDurationMins,
                  externalLink: '',
                  placeImageUrl: '',
                  rating: null,
                  reviewCount: null,
                }]);
                setAddCustomFoodOpen(false);
                setCustomFoodName('');
                setCustomFoodAddress('');
                setCustomFoodAddressSelection(null);
                setCustomFoodAddressSuggestionsOpen(false);
                setCustomFoodCost('');
                setCustomFoodNote('');
                setCustomFoodImage(null);
                setCustomFoodTravelDocs([]);
                setCustomFoodStartTime('07:00');
                setCustomFoodDurationHrs(1);
                setCustomFoodDurationMins(0);
              }}
            >
              <div className="trip-details__custom-place-upload">
                <input
                  type="file"
                  id="custom-food-image"
                  accept=".svg,.png,.jpg,.jpeg,.webp,.gif"
                  className="trip-details__custom-place-file-input"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setCustomFoodImage(f);
                  }}
                />
                <label htmlFor="custom-food-image" className="trip-details__custom-place-upload-label">
                  {customFoodImage ? (
                    <span className="trip-details__custom-place-upload-preview">Image selected: {(customFoodImage instanceof File) ? customFoodImage.name : 'Preview'}</span>
                  ) : (
                    <>
                      <PlusCircle size={32} aria-hidden />
                      <span>Click to upload image or drag and drop</span>
                      <span className="trip-details__custom-place-upload-hint">SVG, PNG, JPG, WEBP or GIF (max. 800×400px)</span>
                    </>
                  )}
                </label>
              </div>
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Food &amp; Beverage name <span className="trip-details__custom-place-required">*</span>
                  <input type="text" className="trip-details__custom-place-input" placeholder="Enter the place name" value={customFoodName} onChange={(e) => setCustomFoodName(e.target.value)} required />
                </label>
                <label className="trip-details__custom-place-label">
                  Address <span className="trip-details__custom-place-required">*</span>
                  <span className="trip-details__custom-place-input-wrap trip-details__custom-transport-autofill-wrap">
                    <MapPin size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                    <input
                      type="text"
                      className="trip-details__custom-place-input"
                      placeholder="Search by landmark or address"
                      value={customFoodAddress}
                      onChange={(e) => {
                        setCustomFoodAddress(e.target.value);
                        setCustomFoodAddressSelection(null);
                        setCustomFoodAddressSuggestionsOpen(true);
                      }}
                      onFocus={() => setCustomFoodAddressSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setCustomFoodAddressSuggestionsOpen(false), 200)}
                      required
                    />
                    {customFoodAddressSuggestionsOpen && customFoodAddress.trim() && (
                      <ul className="trip-details__custom-transport-suggestions">
                        {searchFoodAddressSuggestions(trip.destination || trip.locations, customFoodAddress).map((suggestion) => (
                          <li key={suggestion.id}>
                            <button
                              type="button"
                              className="trip-details__custom-transport-suggestion"
                              onClick={() => {
                                setCustomFoodAddress(suggestion.name);
                                setCustomFoodAddressSelection(suggestion);
                                setCustomFoodAddressSuggestionsOpen(false);
                              }}
                            >
                              <strong>{suggestion.name}</strong>
                              <span>{suggestion.address}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </span>
                </label>
              </div>
              <div className="trip-details__custom-place-row">
                <label className="trip-details__custom-place-label">
                  Date <span className="trip-details__custom-place-required">*</span>
                  <select
                    className="trip-details__custom-place-select"
                    value={customFoodDateKey}
                    onChange={(e) => setCustomFoodDateKey(e.target.value)}
                    required
                  >
                    <option value="">Select day</option>
                    {days.map((d) => (
                      <option key={d.date} value={d.date}>Day {d.dayNum}: {d.label}</option>
                    ))}
                  </select>
                </label>
                <label className="trip-details__custom-place-label">
                  Start time <span className="trip-details__custom-place-required">*</span>
                  <span className="trip-details__custom-place-input-wrap">
                    <Clock size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                    <input type="time" className="trip-details__custom-place-input" value={customFoodStartTime} onChange={(e) => setCustomFoodStartTime(e.target.value)} required />
                  </span>
                </label>
              </div>
              <label className="trip-details__custom-place-label">
                Duration <span className="trip-details__custom-place-required">*</span>
                <div className="trip-details__custom-place-duration">
                  <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customFoodDurationHrs} onChange={(e) => setCustomFoodDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
                  <span> hr </span>
                  <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customFoodDurationMins} onChange={(e) => setCustomFoodDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
                  <span> mins</span>
                </div>
              </label>
              <label className="trip-details__custom-place-label">
                Note (Optional)
                <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customFoodNote} onChange={(e) => setCustomFoodNote(e.target.value)} rows={3} />
              </label>
              <label className="trip-details__custom-place-label">
                Cost (Optional)
                <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customFoodCost} onChange={(e) => setCustomFoodCost(e.target.value)} />
                <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
              </label>
              <label className="trip-details__custom-place-label">
                Travel Documents
                <p className="trip-details__custom-place-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</p>
                <input
                  id="custom-food-docs"
                  type="file"
                  multiple
                  accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                  className="trip-details__custom-place-file-input"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []).slice(0, 3);
                    setCustomFoodTravelDocs(files);
                  }}
                />
                <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-food-docs')?.click()}>
                  <Paperclip size={18} aria-hidden /> Attach files
                  {customFoodTravelDocs.length > 0 && <span className="trip-details__custom-place-attach-count"> ({customFoodTravelDocs.length})</span>}
                </button>
              </label>
              <div className="trip-details__custom-place-actions">
                <button type="button" className="trip-details__modal-cancel" onClick={() => setAddCustomFoodOpen(false)}>Cancel</button>
                <button type="submit" className="trip-details__custom-place-submit">Add to trip</button>
              </div>
            </form>
          </div>
        </>
      )}

      {budgetModalOpen && (() => {
        const breakdown = getBudgetBreakdown(trip, currency, tripExpenseItems);
        const total = breakdown.total;
        const withAmount = breakdown.byCategory.filter((c) => c.amount > 0);
        const pieStyle = total > 0 && withAmount.length > 0 ? {
          background: `conic-gradient(${withAmount.map((c, i) => {
            const start = withAmount.slice(0, i).reduce((s, x) => s + x.amount, 0) / total * 100;
            const end = start + (c.amount / total * 100);
            return `${c.color} ${start}% ${end}%`;
          }).join(', ')})`,
        } : { background: '#e5e7eb' };
        const sortedItems = [...breakdown.items].sort((a, b) => expenseSortBy === 'category' ? (a.category.localeCompare(b.category) || a.name.localeCompare(b.name)) : (b.total - a.total));
        return (
          <>
            <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setBudgetModalOpen(false)} />
            <div className="trip-details__budget-modal" role="dialog" aria-labelledby="budget-modal-title" aria-modal="true">
              <div className="trip-details__budget-modal-head">
                <h2 id="budget-modal-title" className="trip-details__budget-modal-title">Estimated expenses</h2>
                <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setBudgetModalOpen(false)}>
                  <X size={20} aria-hidden />
                </button>
              </div>
              <div className="trip-details__budget-your-expenses">
                <span className="trip-details__budget-your-label">Your expenses</span>
                <span className="trip-details__budget-total">{breakdown.prefix}$ {total.toFixed(2)}</span>
                <Wallet size={24} className="trip-details__budget-wallet-icon" aria-hidden />
              </div>
              <div className="trip-details__budget-summary">
                <div className="trip-details__budget-pie" style={pieStyle} aria-hidden />
                <div className="trip-details__budget-details">
                  <h3 className="trip-details__budget-details-title">
                    Details <Info size={14} className="trip-details__budget-info-icon" aria-hidden />
                  </h3>
                  <ul className="trip-details__budget-category-list">
                    {breakdown.byCategory.map((c) => (
                      <li key={c.id} className="trip-details__budget-category-item">
                        <span className="trip-details__budget-category-dot" style={{ backgroundColor: c.color }} aria-hidden />
                        <span className="trip-details__budget-category-label">{c.label}</span>
                        <span className="trip-details__budget-category-amount">{breakdown.symbol}{c.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="trip-details__budget-details-total">
                    <strong>Total</strong> {breakdown.symbol}{total.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="trip-details__budget-breakdown">
                <h3 className="trip-details__budget-breakdown-title">Expenses breakdown</h3>
                <div className="trip-details__budget-sort">
                  <label htmlFor="expense-sort">Sort by:</label>
                  <select id="expense-sort" className="trip-details__budget-sort-select" value={expenseSortBy} onChange={(e) => setExpenseSortBy(e.target.value)}>
                    <option value="category">Category</option>
                    <option value="amount">Amount</option>
                  </select>
                </div>
                <ul className="trip-details__budget-item-list">
                  {sortedItems.map((item) => (
                    <li key={item.id} className="trip-details__budget-item">
                      <span className="trip-details__budget-item-icon">
                        <item.Icon size={20} aria-hidden />
                      </span>
                      <div className="trip-details__budget-item-body">
                        <span className="trip-details__budget-item-name">{item.name}</span>
                        <span className="trip-details__budget-item-meta">{item.category}</span>
                        <span className="trip-details__budget-item-dates">
                          {item.endDate ? `${formatExpenseDate(item.startDate)} - ${formatExpenseDate(item.endDate)}` : formatExpenseDate(item.date)}
                        </span>
                        <span className="trip-details__budget-item-detail">{breakdown.symbol}{item.detail}</span>
                        <span className="trip-details__budget-item-total">{breakdown.symbol}{item.total.toFixed(2)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        );
      })()}

      {addSheetDay !== null && (
        <>
          <button
            type="button"
            className="trip-details__add-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => { setAddSheetDay(null); setAddSheetFromCalendar(false); setAddSheetAnchor(null); }}
          />
          <div
            className={`trip-details__add-sheet ${addSheetAnchor ? 'trip-details__add-sheet--anchored' : ''}`}
            role="dialog"
            aria-labelledby="add-to-trip-title"
            aria-modal="true"
            style={addSheetAnchor ? {
              left: Math.max(16, Math.min(addSheetAnchor.left, typeof window !== 'undefined' ? window.innerWidth - 436 : addSheetAnchor.left)),
              bottom: `calc(100vh - ${addSheetAnchor.top}px + 8px)`,
              transform: 'none',
            } : undefined}
          >
            <h2 id="add-to-trip-title" className="trip-details__add-sheet-title">Add to trip</h2>
            {!addSheetFromCalendar && <p className="trip-details__add-sheet-subtitle">Day {addSheetDay}</p>}
            <ul className="trip-details__add-sheet-list">
              {ADD_TO_TRIP_OPTIONS.map(({ id, label, description, Icon, color }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="trip-details__add-sheet-option"
                    onClick={() => {
                      if (id === 'place') {
                        setAddPlacesDay(addSheetDay ?? 1);
                        setAddPlacesOpen(true);
                      } else if (id === 'food') {
                        const day = days.find((d) => d.dayNum === (addSheetDay ?? 1));
                        setAddFoodDay(addSheetDay ?? 1);
                        setFoodSearchQuery('');
                        setFoodDietaryFilter('All');
                        setFoodSortBy('Recommended');
                        setCustomFoodDateKey(day?.date || days[0]?.date || '');
                        setAddFoodOpen(true);
                      } else if (id === 'stays') {
                        setStaySearchQuery('');
                        setStayTypeFilter('All');
                        setStayPriceRange('All');
                        setStaySortBy('Recommended');
                        setAddStaysOpen(true);
                      } else if (id === 'experience') {
                        setExperienceSearchQuery('');
                        setExperienceTypeFilter('All');
                        setExperiencePriceRange('All');
                        setExperienceDurationFilter('All');
                        setExperienceSortBy('Recently added');
                        setAddExperiencesOpen(true);
                      } else if (id === 'transportation') {
                        setAddTransportDay(addSheetDay ?? 1);
                        setAddTransportOpen(true);
                      } else if (id === 'routeIdeas') {
                        openRouteIdeasBrowseAll();
                      } else if (id === 'social') {
                        openSocialImportForDay(addSheetDay ?? 1);
                      }
                      setAddSheetDay(null);
                      setAddSheetFromCalendar(false);
                      setAddSheetAnchor(null);
                    }}
                  >
                    <span className="trip-details__add-sheet-icon" style={{ backgroundColor: color }}>
                      <Icon size={20} className="trip-details__add-sheet-icon-svg" aria-hidden />
                    </span>
                    <span className="trip-details__add-sheet-text">
                      <span className="trip-details__add-sheet-label">{label}</span>
                      <span className="trip-details__add-sheet-desc">{description}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      <SocialImportModal
        {...socialImportModalProps}
        resolveImageUrl={resolveImageUrl}
        onImageError={handleImageError}
        onAddDetectedDestination={handleAddDetectedDestinationFromSocial}
      />

      {addToTripModalOpen && addToTripItem && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddToTripModalOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="add-to-trip-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="add-to-trip-title" className="trip-details__custom-place-title">Add {addToTripItem.type === 'place' ? 'Place' : addToTripItem.type === 'food' ? 'Food & Beverage' : addToTripItem.type === 'stay' ? 'Stay' : 'Experience'}</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddToTripModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = addToTripItem.data;
                const isStayForm = addToTripItem.type === 'stay';
                if (isStayForm) {
                  const checkIn = parseDateTimeLocal(addToTripCheckInDate, addToTripCheckInTime);
                  const checkOut = parseDateTimeLocal(addToTripCheckOutDate, addToTripCheckOutTime);
                  if (!checkIn || !checkOut || checkOut <= checkIn) {
                    setFriendlyDialog({
                      open: true,
                      title: 'Invalid stay dates',
                      message: 'Check-out must be after check-in.',
                      showCancel: false,
                      confirmText: 'OK',
                      cancelText: 'Cancel',
                      onConfirm: null,
                    });
                    return;
                  }
                }
                appendItemToTrip({
                  itemType: addToTripItem.type,
                  data,
                  categoryId: addToTripItem.categoryId,
                  category: addToTripItem.category,
                  Icon: addToTripItem.Icon,
                  values: {
                    date: addToTripDate,
                    startTime: addToTripStartTime,
                    durationHrs: parseInt(addToTripDurationHrs, 10) || 0,
                    durationMins: parseInt(addToTripDurationMins, 10) || 0,
                    checkInDate: addToTripCheckInDate,
                    checkInTime: addToTripCheckInTime,
                    checkOutDate: addToTripCheckOutDate,
                    checkOutTime: addToTripCheckOutTime,
                    note: addToTripNotes,
                    cost: addToTripCost,
                    externalLink: addToTripExternalLink,
                    travelDocs: addToTripTravelDocs,
                  },
                });
                setAddToTripModalOpen(false);
                if (addToTripItem.type === 'place') {
                  setPlaceDetailsView(null);
                  setAddPlacesOpen(false);
                } else if (addToTripItem.type === 'food') {
                  setFoodDetailsView(null);
                  setAddFoodOpen(false);
                } else if (addToTripItem.type === 'stay') {
                  setStayDetailsView(null);
                  setAddStaysOpen(false);
                } else if (addToTripItem.type === 'experience') {
                  setExperienceDetailsView(null);
                  setAddExperiencesOpen(false);
                }
              }}
            >
              <div className="trip-details__custom-place-preview">
                <img src={resolveImageUrl(addToTripItem.data.image, addToTripItem.data.name, addToTripItem.type === 'stay' ? 'hotel' : (addToTripItem.type || 'place'))} alt={addToTripItem.data.name} className="trip-details__custom-place-preview-img" onError={handleImageError} />
                <div className="trip-details__custom-place-preview-content">
                  <span className="trip-details__custom-place-preview-badge">{addToTripItem.type === 'place' ? 'Place' : addToTripItem.type === 'food' ? 'Food & Beverage' : addToTripItem.type === 'stay' ? 'Stay' : 'Experience'}</span>
                  <h3 className="trip-details__custom-place-preview-name">{addToTripItem.data.name}</h3>
                  <p className="trip-details__custom-place-preview-rating">
                    <Star size={14} fill="currentColor" aria-hidden /> {addToTripItem.data.rating} ({addToTripItem.data.reviewCount?.toLocaleString() ?? '0'} reviews)
                  </p>
                  <p className="trip-details__custom-place-preview-address">{addToTripItem.data.address}</p>
                </div>
              </div>

              {addToTripItem.type === 'stay' ? (
                <div className="trip-details__custom-place-field-row">
                  <div className="trip-details__custom-place-field">
                    <label htmlFor="add-to-trip-checkin-date" className="trip-details__custom-place-label">
                      Check-in date <span className="trip-details__custom-place-required">*</span>
                    </label>
                    <input
                      type="date"
                      id="add-to-trip-checkin-date"
                      className="trip-details__custom-place-input"
                      value={addToTripCheckInDate}
                      onChange={(e) => setAddToTripCheckInDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="trip-details__custom-place-field">
                    <label htmlFor="add-to-trip-checkin-time" className="trip-details__custom-place-label">
                      Check-in time <span className="trip-details__custom-place-required">*</span>
                    </label>
                    <input
                      type="time"
                      id="add-to-trip-checkin-time"
                      className="trip-details__custom-place-input"
                      value={addToTripCheckInTime}
                      onChange={(e) => setAddToTripCheckInTime(e.target.value)}
                      required
                    />
                  </div>

                  <div className="trip-details__custom-place-field">
                    <label htmlFor="add-to-trip-checkout-date" className="trip-details__custom-place-label">
                      Check-out date <span className="trip-details__custom-place-required">*</span>
                    </label>
                    <input
                      type="date"
                      id="add-to-trip-checkout-date"
                      className="trip-details__custom-place-input"
                      value={addToTripCheckOutDate}
                      onChange={(e) => setAddToTripCheckOutDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="trip-details__custom-place-field">
                    <label htmlFor="add-to-trip-checkout-time" className="trip-details__custom-place-label">
                      Check-out time <span className="trip-details__custom-place-required">*</span>
                    </label>
                    <input
                      type="time"
                      id="add-to-trip-checkout-time"
                      className="trip-details__custom-place-input"
                      value={addToTripCheckOutTime}
                      onChange={(e) => setAddToTripCheckOutTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              ) : (
                <>
                  <div className="trip-details__custom-place-field-row">
                    <div className="trip-details__custom-place-field">
                      <label htmlFor="add-to-trip-date" className="trip-details__custom-place-label">
                        Date <span className="trip-details__custom-place-required">*</span>
                      </label>
                      <select
                        id="add-to-trip-date"
                        className="trip-details__custom-place-select"
                        value={addToTripDate}
                        onChange={(e) => setAddToTripDate(e.target.value)}
                        required
                      >
                        {days.map((day) => (
                          <option key={day.dayNum} value={day.date}>
                            Day {day.dayNum}: {day.date}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="trip-details__custom-place-field">
                      <label htmlFor="add-to-trip-start-time" className="trip-details__custom-place-label">
                        Start time <span className="trip-details__custom-place-required">*</span>
                      </label>
                      <input
                        type="time"
                        id="add-to-trip-start-time"
                        className="trip-details__custom-place-input"
                        value={addToTripStartTime}
                        onChange={(e) => setAddToTripStartTime(e.target.value)}
                        required
                      />
                    </div>

                    <div className="trip-details__custom-place-field">
                      <label htmlFor="add-to-trip-duration" className="trip-details__custom-place-label">
                        Duration <span className="trip-details__custom-place-required">*</span>
                      </label>
                      <div className="trip-details__custom-place-duration-wrap">
                        <input
                          type="number"
                          id="add-to-trip-duration-hrs"
                          className="trip-details__custom-place-duration-input"
                          placeholder="hrs"
                          min="0"
                          value={addToTripDurationHrs}
                          onChange={(e) => setAddToTripDurationHrs(e.target.value)}
                        />
                        <span className="trip-details__custom-place-duration-separator">hr:</span>
                        <input
                          type="number"
                          id="add-to-trip-duration-mins"
                          className="trip-details__custom-place-duration-input"
                          placeholder="mins"
                          min="0"
                          max="59"
                          step="5"
                          value={addToTripDurationMins}
                          onChange={(e) => setAddToTripDurationMins(e.target.value)}
                        />
                        <span className="trip-details__custom-place-duration-separator">mins</span>
                      </div>
                    </div>
                  </div>

                </>
              )}

              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-note" className="trip-details__custom-place-label">
                  Note (Optional)
                </label>
                <textarea
                  id="add-to-trip-note"
                  className="trip-details__custom-place-textarea"
                  placeholder="Enter your note..."
                  value={addToTripNotes}
                  onChange={(e) => setAddToTripNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="trip-details__custom-place-field-row">
                <div className="trip-details__custom-place-field">
                  <label htmlFor="add-to-trip-cost" className="trip-details__custom-place-label">
                    Cost (Optional)
                  </label>
                  <input
                    type="text"
                    id="add-to-trip-cost"
                    className="trip-details__custom-place-input"
                    placeholder="US$0.00"
                    value={addToTripCost}
                    onChange={(e) => setAddToTripCost(e.target.value)}
                  />
                </div>

                <div className="trip-details__custom-place-field">
                  <label htmlFor="add-to-trip-link" className="trip-details__custom-place-label">
                    External link (optional)
                  </label>
                  <input
                    type="url"
                    id="add-to-trip-link"
                    className="trip-details__custom-place-input"
                    placeholder="https://"
                    value={addToTripExternalLink}
                    onChange={(e) => setAddToTripExternalLink(e.target.value)}
                  />
                </div>
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-docs" className="trip-details__custom-place-label">
                  Travel Documents
                </label>
                <input
                  type="file"
                  id="add-to-trip-docs"
                  className="trip-details__custom-place-input"
                  multiple
                  onChange={(e) => setAddToTripTravelDocs(Array.from(e.target.files || []).slice(0, 3))}
                />
              </div>

              <div className="trip-details__custom-place-actions">
                <button type="button" className="trip-details__custom-place-cancel" onClick={() => setAddToTripModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="trip-details__custom-place-submit">
                  Add to trip
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {experienceBookingModalOpen && bookingExperience && bookingOption && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setExperienceBookingModalOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="book-experience-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="book-experience-title" className="trip-details__custom-place-title">Book Experience</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setExperienceBookingModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const parsedDurationHours = Number(bookingExperience.durationHours);
                const fallbackDurationHours = Number.isFinite(parsedDurationHours) && parsedDurationHours > 0
                  ? parsedDurationHours
                  : 2;
                const optionLabel = bookingOption.option || bookingOption.name || bookingOption.type || 'Experience package';
                const totalCost = bookingOption.price * bookingTravellers;
                setTripExpenseItems((prev) => [...prev, {
                  id: `experience-${bookingExperience.id}-${bookingOption.id}-${Date.now()}`,
                  name: bookingExperience.name,
                  total: totalCost,
                  categoryId: 'experiences',
                  category: 'Experience',
                  date: bookingDate,
                  detail: `${optionLabel} - ${bookingTravellers} traveller${bookingTravellers !== 1 ? 's' : ''}`,
                  Icon: Ticket,
                  lat: bookingExperience.lat,
                  lng: bookingExperience.lng,
                  notes: bookingNotes,
                  attachments: [],
                  startTime: bookingStartTime,
                  durationHrs: Math.floor(fallbackDurationHours),
                  durationMins: Math.round((fallbackDurationHours % 1) * 60),
                  externalLink: '',
                  placeImageUrl: bookingExperience.image,
                  rating: bookingExperience.rating,
                  reviewCount: bookingExperience.reviewCount,
                  experienceType: bookingExperience.type,
                  bookingOption: optionLabel,
                  travellers: bookingTravellers,
                  pricePerTraveller: bookingOption.price,
                }]);
                setExperienceBookingModalOpen(false);
                setExperienceDetailsView(null);
                setAddExperiencesOpen(false);
                setBookingExperience(null);
                setBookingOption(null);
                setBookingDate('');
                setBookingStartTime('07:00');
                setBookingTravellers(2);
                setBookingNotes('');
              }}
            >
              <div className="trip-details__custom-place-preview">
                <img src={resolveImageUrl(bookingExperience.image, bookingExperience.name, 'activity')} alt={bookingExperience.name} className="trip-details__custom-place-preview-img" onError={handleImageError} />
                <div className="trip-details__custom-place-preview-content">
                  <span className="trip-details__custom-place-preview-badge">{bookingExperience.type}</span>
                  <h3 className="trip-details__custom-place-preview-name">{bookingExperience.name}</h3>
                  <p className="trip-details__custom-place-preview-rating">
                    <Star size={14} fill="currentColor" aria-hidden /> {bookingExperience.rating} ({bookingExperience.reviewCount?.toLocaleString() ?? '0'} reviews)
                  </p>
                  <p className="trip-details__custom-place-preview-address">
                    <Clock size={14} aria-hidden /> {bookingExperience.duration}
                  </p>
                  <p className="trip-details__custom-place-preview-address" style={{ marginTop: '4px', fontWeight: 600, color: '#059669' }}>
                    {bookingOption.name}
                  </p>
                </div>
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="booking-date" className="trip-details__custom-place-label">
                  Date <span className="trip-details__custom-place-required">*</span>
                </label>
                <select
                  id="booking-date"
                  className="trip-details__custom-place-select"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                >
                  {days.map((day) => (
                    <option key={day.dayNum} value={day.date}>
                      Day {day.dayNum}: {day.date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="booking-start-time" className="trip-details__custom-place-label">
                  Start time <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="time"
                  id="booking-start-time"
                  className="trip-details__custom-place-input"
                  value={bookingStartTime}
                  onChange={(e) => setBookingStartTime(e.target.value)}
                  required
                />
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="booking-travellers" className="trip-details__custom-place-label">
                  Number of travellers <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="number"
                  id="booking-travellers"
                  className="trip-details__custom-place-input"
                  value={bookingTravellers}
                  onChange={(e) => setBookingTravellers(Math.max(1, Math.min(bookingOption.maxTravellers || 99, parseInt(e.target.value) || 1)))}
                  min="1"
                  max={bookingOption.maxTravellers || 99}
                  required
                />
                {bookingOption.maxTravellers && (
                  <p className="trip-details__custom-place-helper" style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                    Maximum {bookingOption.maxTravellers} travellers for this option
                  </p>
                )}
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="booking-notes" className="trip-details__custom-place-label">
                  Notes <span style={{ fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
                </label>
                <textarea
                  id="booking-notes"
                  className="trip-details__custom-place-textarea"
                  rows={3}
                  placeholder="Any special requests or notes for this booking..."
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                />
              </div>

              <div className="trip-details__custom-place-field" style={{
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                marginTop: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#6b7280' }}>
                    {bookingExperience.currency}${bookingOption.price.toFixed(2)} × {bookingTravellers} traveller{bookingTravellers !== 1 ? 's' : ''}
                  </span>
                  <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                    {bookingExperience.currency}${(bookingOption.price * bookingTravellers).toFixed(2)}
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                  All taxes and fees included
                </p>
              </div>

              <div className="trip-details__custom-place-actions">
                <button type="button" className="trip-details__custom-place-cancel" onClick={() => setExperienceBookingModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="trip-details__custom-place-submit">
                  Add to trip
                </button>
              </div>
            </form>
          </div>
        </>
      )}
      <FriendlyModal
        open={friendlyDialog.open}
        title={friendlyDialog.title}
        message={friendlyDialog.message}
        showCancel={friendlyDialog.showCancel}
        confirmText={friendlyDialog.confirmText}
        cancelText={friendlyDialog.cancelText}
        onClose={() => setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }))}
        onConfirm={async () => {
          if (typeof friendlyDialog.onConfirm === 'function') {
            await friendlyDialog.onConfirm();
            setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
            return;
          }
          setFriendlyDialog((prev) => ({ ...prev, open: false, onConfirm: null }));
        }}
      />
    </div>
  );
}
