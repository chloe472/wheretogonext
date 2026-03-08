import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  Share2,
  Trash2,
  GripVertical,
  MoreVertical,
  MapPin,
  Plus,
  ZoomIn,
  Filter,
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
  Mail,
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
  FileText,
  Palette,
  Route,
  Star,
  ArrowLeft,
  ExternalLink,
} from 'lucide-react';
import { getTripDays } from '../lib/tripDates';
import { fetchTrip, patchTrip, deleteTrip as apiDeleteTrip } from '../api/tripsApi';
import {
  searchAddressSuggestions,
  getMapCenterForDestination,
  PLACE_FILTER_TAGS,
  PLACE_SORT_OPTIONS,
} from '../data/mockPlaces';
import {
  searchFoodAddressSuggestions,
  FOOD_DIETARY_FILTERS,
  FOOD_SORT_OPTIONS,
} from '../data/mockFoodAndBeverages';
import {
  EXPERIENCE_TYPES,
  EXPERIENCE_PRICE_RANGES,
  EXPERIENCE_DURATIONS,
  EXPERIENCE_SORT_OPTIONS,
} from '../data/mockExperiences';
import { searchLocations } from '../data/mockLocations';
import { fetchDiscoveryData } from '../api/discoveryApi';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import countriesData from '../data/countries.json';
import DateRangePickerModal from './DateRangePickerModal';
import TripMap from './TripMap';
import './TripDetailsPage.css';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
const MAP_VIEWS = ['Default', 'Expand half', 'Expand full'];
const MAP_FILTERS = ['Default', 'Food & Beverages', 'Experiences', 'My Trip'];
const ADD_PLACES_PAGE_SIZE = 18;

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
  return raw === 'places' || raw === 'place' || raw === 'food' || raw === 'food & beverage';
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

function getDayTotalDurationMinutes(items, dayDate) {
  const dayItems = (items || []).filter((it) => it.date === dayDate);
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

const CALENDAR_START_HOUR = 6;
const CALENDAR_HOURS = 12;
const CALENDAR_ROW_HEIGHT = 48;

function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}
function getCalendarEventPosition(item) {
  const startMins = timeToMinutes(item.startTime);
  const startHour = startMins / 60;
  const topPx = Math.max(0, (startHour - CALENDAR_START_HOUR) * CALENDAR_ROW_HEIGHT);
  const heightPx = Math.max(CALENDAR_ROW_HEIGHT * 0.5, durationHrs * CALENDAR_ROW_HEIGHT);
  return { top: topPx, height: heightPx };
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

function getSortedDayItems(items, dayDate) {
  const dayItems = (items || []).filter((it) => it.date === dayDate);
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

/** Mock travel time/distance between two items (in production would use routing API). */
function getTravelBetween(fromItem, toItem, mode) {
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
  const minPerKm = { walking: 12, cycling: 4, driving: 2.5, public: 5 }[mode] || 5;
  const totalMins = Math.round(distKm * minPerKm);
  const mins = totalMins % 60;
  const hrs = Math.floor(totalMins / 60);
  const durationStr = hrs > 0 ? `${hrs} hr ${mins} min` : `${mins} min`;
  return { duration: durationStr, durationMins: totalMins, distance: `${distKmRounded} km` };
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
    id: 'community',
    label: 'Community Itineraries',
    description: 'See suggestions from trips published by other travellers',
    Icon: Users,
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

const VEHICLE_TYPES = [
  { value: 'Bus', label: 'Bus' },
  { value: 'Car', label: 'Car' },
  { value: 'Ferry', label: 'Ferry' },
  { value: 'Flight', label: 'Flight' },
  { value: 'Train', label: 'Train' },
  { value: 'Others', label: 'Others' },
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

function searchAirlines(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return AIRLINES.filter(
    (a) => a.name.toLowerCase().includes(q) || (a.id && a.id.toLowerCase().includes(q))
  ).slice(0, limit);
}

function TripDetailsPageInner({ user, onLogout, tripId, initialTripData }) {
  const navigate = useNavigate();
  const [locationUpdateKey, setLocationUpdateKey] = useState(0);

  const [tripData, setTripData] = useState(initialTripData);

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
  const [placeDetailsView, setPlaceDetailsView] = useState(null);
  const [placeDetailsTab, setPlaceDetailsTab] = useState('overview');
  const [foodDetailsView, setFoodDetailsView] = useState(null);
  const [foodDetailsTab, setFoodDetailsTab] = useState('overview');
  const [experienceDetailsView, setExperienceDetailsView] = useState(null);
  const [experienceDetailsTab, setExperienceDetailsTab] = useState('overview');
  const [itineraryDetailsView, setItineraryDetailsView] = useState(null);
  const [addCustomPlaceOpen, setAddCustomPlaceOpen] = useState(false);
  const [addCustomFoodOpen, setAddCustomFoodOpen] = useState(false);
  const [addPlacesDay, setAddPlacesDay] = useState(1);
  const [addFoodDay, setAddFoodDay] = useState(1);
  const [addToTripModalOpen, setAddToTripModalOpen] = useState(false);
  const [addToTripItem, setAddToTripItem] = useState(null);
  const [addToTripDate, setAddToTripDate] = useState('');
  const [addToTripStartTime, setAddToTripStartTime] = useState('07:00');
  const [addToTripDurationHrs, setAddToTripDurationHrs] = useState(1);
  const [addToTripDurationMins, setAddToTripDurationMins] = useState(0);
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

  const saveTripUpdates = (updates) => {
    setTripData((prev) => (prev ? { ...prev, ...updates } : prev));
    patchTrip(tripId, updates).catch(() => {});
  };

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
  const [addTransportTab, setAddTransportTab] = useState('Private Transfers');
  const [transferType, setTransferType] = useState('pickup');
  const [transferFrom, setTransferFrom] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferDateKey, setTransferDateKey] = useState('');
  const [transferTime, setTransferTime] = useState('08:00');
  const [transferPax, setTransferPax] = useState(2);
  const [flightCode, setFlightCode] = useState('');
  const [flightDepartDate, setFlightDepartDate] = useState('');
  const [flightSearchResults, setFlightSearchResults] = useState([]);
  const [flightSearchLoading, setFlightSearchLoading] = useState(false);
  const [flightSearchError, setFlightSearchError] = useState('');
  const [transportFaqOpen, setTransportFaqOpen] = useState(null);
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
  const [whereModalOpen, setWhereModalOpen] = useState(false);
  const [whereQuery, setWhereQuery] = useState('');
  const [whereSuggestionsOpen, setWhereSuggestionsOpen] = useState(false);
  const [whereSelectedLocations, setWhereSelectedLocations] = useState([]);
  const whereModalRef = useRef(null);
  const hydratedTripItemsForIdRef = useRef(null);
  const titleDropdownRef = useRef(null);
  const titleLastClickRef = useRef(0);
  const [transportModeBySegment, setTransportModeBySegment] = useState({});
  const [openTravelDropdownKey, setOpenTravelDropdownKey] = useState(null);
  const [publicTransportModalOpen, setPublicTransportModalOpen] = useState(false);
  const [publicTransportSegment, setPublicTransportSegment] = useState({ fromName: '', toName: '' });
  const [openDayMenuKey, setOpenDayMenuKey] = useState(null);
  const [dayColors, setDayColors] = useState({});
  const [dayColorPickerDay, setDayColorPickerDay] = useState(null);
  const [optimizeRouteModalOpen, setOptimizeRouteModalOpen] = useState(false);
  const [optimizeRouteDay, setOptimizeRouteDay] = useState(null);
  const [optimizeRouteStartId, setOptimizeRouteStartId] = useState('');
  const [optimizeRouteEndId, setOptimizeRouteEndId] = useState('');
  const [optimizationsLeft, setOptimizationsLeft] = useState(3);
  const [discoveryData, setDiscoveryData] = useState({
    places: [],
    foods: [],
    experiences: [],
    communityItineraries: [],
    center: null,
    warning: '',
    cached: false,
    stale: false,
  });
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');

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
      const d = getTripDays(trip);
      setTitleDisplay(trip.title ?? `${d.length} days to ${trip.destination}`);
    }
  }, [tripId, trip?.destination, locationUpdateKey]);

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
    if (!tripData || !tripId) return;
    hydratedTripItemsForIdRef.current = tripId;
  }, [tripData, tripId]);

  const persistItemsTimerRef = useRef(null);
  useEffect(() => {
    if (hydratedTripItemsForIdRef.current !== tripId) return;
    if (persistItemsTimerRef.current) clearTimeout(persistItemsTimerRef.current);
    persistItemsTimerRef.current = setTimeout(() => {
      patchTrip(tripId, { tripExpenseItems }).catch(() => {});
    }, 600);
    return () => {
      if (persistItemsTimerRef.current) clearTimeout(persistItemsTimerRef.current);
    };
  }, [tripId, tripExpenseItems]);

  if (!trip) {
    return (
      <div className="trip-details trip-details--missing">
        <p>Trip not found.</p>
        <Link to="/">Back to My Trips</Link>
      </div>
    );
  }

  const displayTrip = useMemo(() => {
    if (!trip) return null;
    const start = dateRange?.startDate ?? trip.startDate;
    const end = dateRange?.endDate ?? trip.endDate;
    return { ...trip, startDate: start, endDate: end };
  }, [trip, dateRange?.startDate, dateRange?.endDate]);

  const days = getTripDays(displayTrip ?? trip);
  const spent = trip.budgetSpent ?? 0;

  const displayStart = dateRange?.startDate ?? trip.startDate;
  const displayEnd = dateRange?.endDate ?? trip.endDate;
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
    : trip.dates;

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
      // Parse flight code (e.g., "UA1" -> airline: "UA", flight_number: "1")
      const match = flightCode.trim().toUpperCase().match(/^([A-Z0-9]{2})(\d+)$/);
      if (!match) {
        throw new Error('Invalid flight code format. Example: UA1, AA100, DL250');
      }

      const [, airlineCode, flightNumber] = match;

      // Try real API first (AviationStack)
      const apiKey = 'YOUR_AVIATIONSTACK_API_KEY'; // You'll need to get this from https://aviationstack.com/

      // For demo purposes, if no API key, use mock data
      if (!apiKey || apiKey === 'YOUR_AVIATIONSTACK_API_KEY') {
        // Generate realistic mock flight data
        const airline = AIRLINES.find(a => a.id === airlineCode) || { name: `${airlineCode} Airlines` };
        const departDate = new Date(flightDepartDate);

        // Mock realistic flights with proper timing
        const mockFlights = [];

        // Flight 1 - Morning departure
        const morningDept = new Date(departDate);
        morningDept.setHours(8, 30, 0);
        const morningArr = new Date(morningDept);
        morningArr.setHours(morningArr.getHours() + 12); // 12 hour flight

        // Flight 2 - Afternoon departure  
        const afternoonDept = new Date(departDate);
        afternoonDept.setHours(14, 45, 0);
        const afternoonArr = new Date(afternoonDept);
        afternoonArr.setHours(afternoonArr.getHours() + 12);

        // Get reasonable airport pairs based on common routes
        const routes = [
          { from: 'SFO', to: 'SIN', fromName: 'San Francisco', toName: 'Singapore' },
          { from: 'JFK', to: 'LHR', fromName: 'New York', toName: 'London' },
          { from: 'LAX', to: 'NRT', fromName: 'Los Angeles', toName: 'Tokyo' },
          { from: 'ORD', to: 'CDG', fromName: 'Chicago', toName: 'Paris' },
          { from: 'SEA', to: 'HND', fromName: 'Seattle', toName: 'Tokyo' },
        ];

        const route = routes[Math.floor(Math.random() * routes.length)];

        mockFlights.push({
          id: `${airlineCode}${flightNumber}-1`,
          flight_code: `${airlineCode}${flightNumber}`,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: route.from,
          departure_city: route.fromName,
          arrival_airport: route.to,
          arrival_city: route.toName,
          departure_time: morningDept.toISOString(),
          arrival_time: morningArr.toISOString(),
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Boeing 777-300ER',
          terminal: '1',
          gate: 'A15',
        });

        // Add a second option
        mockFlights.push({
          id: `${airlineCode}${flightNumber}-2`,
          flight_code: `${airlineCode}${flightNumber}`,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: route.from,
          departure_city: route.fromName,
          arrival_airport: route.to,
          arrival_city: route.toName,
          departure_time: afternoonDept.toISOString(),
          arrival_time: afternoonArr.toISOString(),
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Airbus A350-900',
          terminal: '2',
          gate: 'B22',
        });

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        setFlightSearchResults(mockFlights);
        setFlightSearchLoading(false);
        return;
      }

      // Real API call (if API key is provided)
      const response = await fetch(
        `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&flight_iata=${airlineCode}${flightNumber}&flight_date=${flightDepartDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch flight data');
      }

      const data = await response.json();

      if (data.data && data.data.length > 0) {
        const flights = data.data.map(flight => ({
          id: flight.flight.iata || `${flight.airline.iata}${flight.flight.number}`,
          flight_code: flight.flight.iata || `${flight.airline.iata}${flight.flight.number}`,
          airline: flight.airline.name,
          airline_code: flight.airline.iata,
          flight_number: flight.flight.number,
          departure_airport: flight.departure.iata,
          departure_city: flight.departure.timezone?.split('/')[1] || flight.departure.airport,
          arrival_airport: flight.arrival.iata,
          arrival_city: flight.arrival.timezone?.split('/')[1] || flight.arrival.airport,
          departure_time: flight.departure.scheduled,
          arrival_time: flight.arrival.scheduled,
          flight_date: flightDepartDate,
          status: flight.flight_status,
          aircraft: flight.aircraft?.registration || 'N/A',
          terminal: flight.departure.terminal || 'N/A',
          gate: flight.departure.gate || 'N/A',
        }));

        setFlightSearchResults(flights);
      } else {
        setFlightSearchError('No flights found for this code and date');
      }
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

  const cityQuery = useMemo(
    () => extractPrimaryDestination(trip?.destination || trip?.locations),
    [trip?.destination, trip?.locations],
  );

  const filteredPlaces = useMemo(() => {
    const deriveSemanticTags = (place) => {
      const rawTags = place?.tags;
      if (Array.isArray(rawTags) && rawTags.length > 0) {
        return rawTags.map((tag) => String(tag));
      }
      if (typeof rawTags === 'string' && rawTags.trim()) {
        return [rawTags.trim()];
      }

      const tags = [];
      const rating = Number(place?.rating || 0);
      const reviewCount = Number(place?.reviewCount || 0);
      const type = String(place?.type || '').toLowerCase();

      if (rating >= 4.6 || reviewCount >= 12000 || type.includes('museum') || type.includes('attraction') || type.includes('landmark')) {
        tags.push('Must go');
      }
      if (reviewCount >= 3000) {
        tags.push('Seen in 100+ plans');
      }
      if ((type.includes('gallery') || type.includes('scenic') || type.includes('view')) && rating >= 4.3 && reviewCount < 4000) {
        tags.push('Hidden gem');
      }
      if (tags.length === 0) {
        tags.push('Must go');
      }
      return [...new Set(tags)];
    };

    const scorePlaceRecommendation = (place) => {
      const tags = deriveSemanticTags(place);
      let score = 0;
      score += Number(place?.recommendedScore || 0);
      score += Number(place?.rating || 0) * 8;
      score += Math.log10(Number(place?.reviewCount || 0) + 1) * 5;
      if (tags.includes('Must go')) score += 8;
      if (tags.includes('Seen in 100+ plans')) score += 4;
      if (tags.includes('Hidden gem')) score += 3;
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
    if (placeFilterTag) {
      const tag = placeFilterTag.toLowerCase();
      results = results.filter((p) =>
        (p.type || '').toLowerCase().includes(tag)
        || (Array.isArray(p.tags) && p.tags.some((t) => String(t).toLowerCase().includes(tag))),
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
  }, [discoveryData?.places, placeSearchQuery, placeFilterTag, placeSortBy]);

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
  }, [placeSearchQuery, placeFilterTag, placeSortBy]);

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
      const tag = foodDietaryFilter.toLowerCase();
      results = results.filter((f) => Array.isArray(f.dietaryTags) && f.dietaryTags.some((d) => String(d).toLowerCase().includes(tag)));
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
      results = results.filter((e) => {
        const price = Number(e.price || 0);
        if (experiencePriceRange === 'US$0 - US$50') return price < 50;
        if (experiencePriceRange === 'US$50 - US$100') return price >= 50 && price < 100;
        if (experiencePriceRange === 'US$100 - US$200') return price >= 100 && price < 200;
        if (experiencePriceRange === 'US$200+') return price >= 200;
        return true;
      });
    }
    if (experienceDurationFilter && experienceDurationFilter !== 'All') {
      results = results.filter((e) => {
        const hrs = Number(e.durationHours || 0);
        if (experienceDurationFilter === 'Under 4 hours') return hrs < 4;
        if (experienceDurationFilter === '4-8 hours') return hrs >= 4 && hrs <= 8;
        if (experienceDurationFilter === '8-12 hours') return hrs > 8 && hrs <= 12;
        if (experienceDurationFilter === '12+ hours') return hrs > 12;
        return true;
      });
    }
    if (experienceSortBy === 'Price: Low to High') {
      results = [...results].sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (experienceSortBy === 'Price: High to Low') {
      results = [...results].sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (experienceSortBy === 'Highest Rated') {
      results = [...results].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }
    return results;
  }, [discoveryData?.experiences, experienceSearchQuery, experienceTypeFilter, experiencePriceRange, experienceDurationFilter, experienceSortBy]);

  const communityItineraries = useMemo(() => {
    const source = Array.isArray(discoveryData?.communityItineraries) ? discoveryData.communityItineraries : [];
    if (source.length === 0) return [];

    const placePool = Array.isArray(discoveryData?.places) && discoveryData.places.length > 0
      ? discoveryData.places
      : filteredPlaces;

    const placeById = new Map(placePool.map((place) => [String(place.id), place]));
    const placeByName = new Map(
      placePool
        .filter((place) => place?.name)
        .map((place) => [String(place.name).trim().toLowerCase(), place]),
    );

    const getSeedPlaces = (start, count) => {
      if (placePool.length === 0) return [];
      const out = [];
      for (let offset = 0; offset < count; offset += 1) {
        out.push(placePool[(start + offset) % placePool.length]);
      }
      return out;
    };

    return source.map((itinerary, itineraryIndex) => {
      const dayMatch = String(itinerary.duration || '').match(/\d+/);
      const parsedDays = Math.max(1, parseInt(dayMatch?.[0] || '3', 10));
      const desiredStops = Math.min(12, Math.max(4, parsedDays * 3));
      const sourcePlaces = Array.isArray(itinerary.places) && itinerary.places.length > 0
        ? itinerary.places
        : getSeedPlaces(itineraryIndex * 2, desiredStops);

      const normalizedPlaces = sourcePlaces.map((rawPlace, placeIndex) => {
        const rawId = rawPlace?.id ?? rawPlace?.placeId ?? rawPlace?.sourceId ?? '';
        const rawName = String(rawPlace?.name || '').trim();
        const matchedPlace = (rawId && placeById.get(String(rawId))) || (rawName ? placeByName.get(rawName.toLowerCase()) : null) || null;
        const dayNumValue = Number(rawPlace?.dayNum || rawPlace?.day || matchedPlace?.dayNum || Math.floor(placeIndex / 3) + 1);
        const durationHrs = Number(rawPlace?.durationHrs || matchedPlace?.durationHrs || 2);

        return {
          id: rawId || matchedPlace?.id || `${itinerary.id || `community-${itineraryIndex + 1}`}-place-${placeIndex + 1}`,
          name: rawName || matchedPlace?.name || `Stop ${placeIndex + 1}`,
          lat: rawPlace?.lat ?? matchedPlace?.lat,
          lng: rawPlace?.lng ?? matchedPlace?.lng,
          image: rawPlace?.image || matchedPlace?.image || itinerary.image,
          address: rawPlace?.address || matchedPlace?.address || cityQuery,
          rating: rawPlace?.rating ?? matchedPlace?.rating ?? 4.4,
          reviewCount: rawPlace?.reviewCount ?? matchedPlace?.reviewCount ?? 0,
          overview: rawPlace?.overview || matchedPlace?.overview || matchedPlace?.description || `${rawName || matchedPlace?.name || 'This place'} is a popular stop in ${cityQuery}.`,
          website: rawPlace?.website || matchedPlace?.website || '',
          tags: Array.isArray(rawPlace?.tags) && rawPlace.tags.length > 0
            ? rawPlace.tags
            : (Array.isArray(matchedPlace?.tags) && matchedPlace.tags.length > 0 ? matchedPlace.tags : [itinerary.type || 'Place']),
          dayNum: Number.isFinite(dayNumValue) && dayNumValue > 0 ? dayNumValue : 1,
          durationLabel: rawPlace?.duration || matchedPlace?.estimatedDuration || `${durationHrs} hr`,
          note: rawPlace?.note || `I stopped by ${rawName || matchedPlace?.name || 'this place'} and really enjoyed the vibe here.`,
        };
      });

      const itineraryTags = Array.isArray(itinerary.tags) && itinerary.tags.length > 0
        ? itinerary.tags
        : [itinerary.type, 'Community'].filter(Boolean);

      const authorProfile = {
        name: itinerary?.author?.name || itinerary.creator || 'Traveler',
        travelStyle: itinerary?.author?.travelStyle || itinerary.travelStyle || itinerary.type || 'Community traveler',
        interests: Array.isArray(itinerary?.author?.interests) && itinerary.author.interests.length > 0
          ? itinerary.author.interests
          : itineraryTags.slice(0, 3),
        avatar: itinerary?.author?.avatar || itinerary.creatorAvatar || '',
      };

      return {
        ...itinerary,
        creator: authorProfile.name,
        author: authorProfile,
        places: normalizedPlaces,
        tags: itineraryTags,
        views: Number(itinerary.views || itinerary.viewCount || 0),
        countriesCount: Number(itinerary.countriesCount || 1),
      };
    });
  }, [discoveryData?.communityItineraries, discoveryData?.places, filteredPlaces, cityQuery]);

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
    const experienceMarkers = toDiscoveryMarkers(sourceExperiences, 'experience', 20);

    if (mapFilter === 'Food & Beverages') return foodMarkers;
    if (mapFilter === 'Experiences') return experienceMarkers;
    if (mapFilter === 'My Trip') return tripItemMarkers.length > 0 ? tripItemMarkers : [];
    return placeMarkers.length > 0 ? placeMarkers : tripItemMarkers;
  }, [tripExpenseItems, days, discoveryData?.places, discoveryData?.foods, discoveryData?.experiences, mapFilter, cityQuery]);

  const appendItemToTrip = ({ itemType, data, categoryId, category, Icon, values }) => {
    const costNum = parseFloat(values?.cost) || 0;
    const docs = Array.isArray(values?.travelDocs)
      ? values.travelDocs.map((file, idx) => ({
        id: `${data.id || data.name || 'doc'}-${idx}-${Date.now()}`,
        name: file?.name || `Document ${idx + 1}`,
        size: file?.size || 0,
        type: file?.type || '',
      }))
      : [];

    setTripExpenseItems((prev) => [...prev, {
      id: `${itemType}-${data.id}-${Date.now()}`,
      name: data.name,
      total: costNum,
      categoryId,
      category,
      date: values?.date,
      detail: data.address || data.name,
      Icon,
      lat: data.lat,
      lng: data.lng,
      notes: values?.note || '',
      attachments: docs,
      startTime: values?.startTime || '07:00',
      durationHrs: Number(values?.durationHrs || 0),
      durationMins: Number(values?.durationMins || 0),
      externalLink: values?.externalLink || data.website || '',
      placeImageUrl: resolveImageUrl(
        data.image,
        data.name,
        itemType === 'food' ? 'restaurant' : itemType === 'experience' ? 'activity' : 'landmark',
      ),
      rating: data.rating,
      reviewCount: data.reviewCount,
    }]);
  };

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
    setAddToTripDurationHrs(1);
    setAddToTripDurationMins(0);
    setAddToTripNotes('');
    setAddToTripCost('');
    setAddToTripExternalLink(data.website || '');
    setAddToTripTravelDocs([]);
    setAddToTripModalOpen(true);
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

  const openCommunityBrowseAll = () => {
    setAddFoodOpen(false);
    setAddExperiencesOpen(false);
    setPlaceDetailsView(null);
    setFoodDetailsView(null);
    setExperienceDetailsView(null);
    setPlaceDetailsTab('overview');
    const firstItinerary = Array.isArray(communityItineraries) ? communityItineraries[0] : null;
    if (firstItinerary) {
      openCommunityItineraryDetails(firstItinerary);
    } else {
      setItineraryDetailsView(null);
      setSelectedPlaceMarkerId(null);
    }
    setAddPlacesOpen(true);
  };

  const openCommunityItineraryDetails = (itinerary) => {
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
                    saveTripUpdates({ title: v });
                    setTitleDisplay(v);
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
                        if (!window.confirm('Delete this trip? This cannot be undone.')) return;
                        apiDeleteTrip(tripId)
                          .then(() => navigate('/'))
                          .catch(() => {});
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
          <button type="button" className="trip-details__icon-btn" aria-label="View as list">
            <MapPin size={18} aria-hidden />
          </button>
        </div>

        <div className="trip-details__actions">
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
          <button type="button" className="trip-details__save">
            Save
          </button>
        </div>
      </header>

      <div className="trip-details__body">
        {viewMode === 'kanban' ? (
          <div className="trip-details__columns">
            <div className="trip-details__columns-scroll">
              {visibleDays.map((day) => {
                const dayItemsCount = getSortedDayItems(tripExpenseItems, day.date).length;
                const totalMins = getDayTotalDurationMinutes(tripExpenseItems, day.date);
                const durationStr = formatDurationMinutes(totalMins || 60);
                const isDayMenuOpen = openDayMenuKey === day.dayNum;
                const dayColor = dayColors[day.dayNum] ?? DAY_COLOR_OPTIONS[0];
                return (
                  <section key={day.dayNum} className="trip-details__day-col">
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
                            const items = getSortedDayItems(tripExpenseItems, day.date);
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
                      {getSortedDayItems(tripExpenseItems, day.date).map((item, idx) => {
                        const style = getCategoryStyle(item);
                        const IconComponent = item.Icon || Camera;
                        const timeRange = formatTimeRange(item);
                        const segmentKey = `${day.date}-${idx}`;
                        const mode = transportModeBySegment[segmentKey] || 'driving';
                        const travelModeInfo = TRAVEL_MODES.find((m) => m.id === mode) || TRAVEL_MODES[2];
                        const TravelSegmentIcon = travelModeInfo.Icon;
                        const nextItem = getSortedDayItems(tripExpenseItems, day.date)[idx + 1];
                        const travelToNext = nextItem ? getTravelBetween(item, nextItem, mode) : null;
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
                              <div className="trip-details__itinerary-card-body">
                                <span className="trip-details__itinerary-category" style={{ color: style.color }}>
                                  {style.label}
                                </span>
                                <h4 className="trip-details__itinerary-name">{item.name}</h4>
                                {timeRange && <span className="trip-details__itinerary-time">{timeRange}</span>}
                              </div>
                              <button
                                type="button"
                                className="trip-details__itinerary-edit-btn"
                                aria-label="Edit"
                                onClick={(e) => { e.stopPropagation(); isEditableItineraryItem(item) && setEditPlaceItem(item); }}
                              >
                                <FileText size={16} aria-hidden />
                              </button>
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
                                                setPublicTransportSegment({ fromName: item.name, toName: nextItem.name });
                                                setPublicTransportModalOpen(true);
                                              }
                                            }}
                                          >
                                            <m.Icon size={18} aria-hidden />
                                            <span>{m.id === 'public' ? `${m.label}` : `${m.label} · ${getTravelBetween(item, nextItem, m.id).duration}`}</span>
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
            <aside className={`trip-details__map-col trip-details__map-col--${mapView.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="trip-details__map-header">
                <div className="trip-details__map-dropdown-wrap">
                  <button
                    type="button"
                    className="trip-details__map-expand-btn"
                    onClick={() => setMapExpandOpen((o) => !o)}
                    aria-expanded={mapExpandOpen}
                  >
                    Expand Map
                    <ChevronDown size={14} aria-hidden />
                  </button>
                  {mapExpandOpen && (
                    <>
                      <button
                        type="button"
                        className="trip-details__map-dropdown-backdrop"
                        aria-label="Close"
                        onClick={() => setMapExpandOpen(false)}
                      />
                      <div className="trip-details__map-dropdown">
                        {MAP_VIEWS.map((view) => (
                          <button
                            key={view}
                            type="button"
                            className={`trip-details__map-dropdown-item ${mapView === view ? 'trip-details__map-dropdown-item--active' : ''}`}
                            onClick={() => { setMapView(view); setMapExpandOpen(false); }}
                          >
                            {view}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="trip-details__map-filters">
                  {MAP_FILTERS.map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`trip-details__map-filter ${mapFilter === f ? 'trip-details__map-filter--active' : ''}`}
                      onClick={() => setMapFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
              <div className="trip-details__map-area">
                <TripMap
                  center={mapCenter}
                  zoom={11}
                  markers={mapMarkers}
                  activeDayNums={activeDayNums}
                  className="trip-details__trip-map"
                  fitBounds={mapMarkers.length > 0}
                  resizeKey={mapView}
                  popupMode="hover-preview"
                  onMarkerAddClick={openAddToTripFromMapMarker}
                  onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                />
              </div>
              <div className="trip-details__map-controls">
                <button type="button" className="trip-details__map-ctrl">
                  <ZoomIn size={14} aria-hidden />
                  Zoom into...
                </button>
                <button
                  type="button"
                  className="trip-details__map-ctrl"
                  onClick={() => {
                    resetMapDays();
                    setMapDayFilterOpen(true);
                  }}
                >
                  <Filter size={14} aria-hidden />
                  Filter days
                </button>
                <div className="trip-details__map-zoom">
                  <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom in">+</button>
                  <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom out">−</button>
                </div>
                <button type="button" className="trip-details__map-info" aria-label="Map info">
                  <Info size={16} aria-hidden />
                </button>
              </div>
            </aside>
          </div>
        ) : (
          <div className="trip-details__calendar-view">
            <div className="trip-details__calendar-content">
              <div className="trip-details__calendar-day-tabs">
                {days.map((day) => (
                  <div key={day.dayNum} className="trip-details__calendar-day-tab">
                    <span className="trip-details__calendar-day-tab-title">Day {day.dayNum}: {day.label}</span>
                    <span className="trip-details__calendar-day-tab-city">{trip.destination}</span>
                  </div>
                ))}
              </div>
              <div className="trip-details__calendar-timeline-wrap">
                <div className="trip-details__calendar-times">
                  {Array.from({ length: 12 }, (_, i) => i + 6).map((h) => (
                    <div key={h} className="trip-details__calendar-time-row">
                      <span className="trip-details__calendar-time-label">{String(h).padStart(2, '0')}:00</span>
                    </div>
                  ))}
                </div>
                <div className="trip-details__calendar-grid">
                  {days.map((day) => (
                    <div key={day.dayNum} className="trip-details__calendar-day-col">
                      <div className="trip-details__calendar-day-col-content">
                        {Array.from({ length: CALENDAR_HOURS }, (_, i) => (
                          <div key={i} className="trip-details__calendar-cell" />
                        ))}
                        <div className="trip-details__calendar-events">
                          {getSortedDayItems(tripExpenseItems, day.date).map((item) => {
                            const style = getCategoryStyle(item);
                            const IconComponent = item.Icon || Camera;
                            const timeRange = formatTimeRange(item);
                            const { top, height } = getCalendarEventPosition(item);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                className="trip-details__calendar-event"
                                style={{
                                  top: `${top}px`,
                                  height: `${height}px`,
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
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                type="button"
                className="trip-details__calendar-fab"
                aria-label="Add to trip"
                onClick={() => { setAddSheetFromCalendar(true); setAddSheetDay(1); setAddSheetAnchor(null); }}
              >
                <Plus size={24} aria-hidden />
              </button>
            </div>
            <aside className={`trip-details__map-col trip-details__map-col--${mapView.toLowerCase().replace(/\s+/g, '-')}`}>
              <div className="trip-details__map-header">
                <div className="trip-details__map-dropdown-wrap">
                  <button
                    type="button"
                    className="trip-details__map-expand-btn"
                    onClick={() => setMapExpandOpen((o) => !o)}
                    aria-expanded={mapExpandOpen}
                  >
                    Expand Map
                    <ChevronDown size={14} aria-hidden />
                  </button>
                  {mapExpandOpen && (
                    <>
                      <button type="button" className="trip-details__map-dropdown-backdrop" aria-label="Close" onClick={() => setMapExpandOpen(false)} />
                      <div className="trip-details__map-dropdown">
                        {MAP_VIEWS.map((view) => (
                          <button key={view} type="button" className={`trip-details__map-dropdown-item ${mapView === view ? 'trip-details__map-dropdown-item--active' : ''}`} onClick={() => { setMapView(view); setMapExpandOpen(false); }}>{view}</button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                <div className="trip-details__map-filters">
                  {MAP_FILTERS.map((f) => (
                    <button key={f} type="button" className={`trip-details__map-filter ${mapFilter === f ? 'trip-details__map-filter--active' : ''}`} onClick={() => setMapFilter(f)}>{f}</button>
                  ))}
                </div>
              </div>
              <div className="trip-details__map-area">
                <TripMap
                  center={mapCenter}
                  zoom={11}
                  markers={mapMarkers}
                  activeDayNums={activeDayNums}
                  className="trip-details__trip-map"
                  fitBounds={mapMarkers.length > 0}
                  resizeKey={mapView}
                  popupMode="hover-preview"
                  onMarkerAddClick={openAddToTripFromMapMarker}
                  onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                />
              </div>
              <div className="trip-details__map-controls">
                <button type="button" className="trip-details__map-ctrl"><ZoomIn size={14} aria-hidden /> Zoom into...</button>
                <button
                  type="button"
                  className="trip-details__map-ctrl"
                  onClick={() => {
                    resetMapDays();
                    setMapDayFilterOpen(true);
                  }}
                >
                  <Filter size={14} aria-hidden /> Filter days
                </button>
                <div className="trip-details__map-zoom">
                  <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom in">+</button>
                  <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom out">−</button>
                </div>
                <button type="button" className="trip-details__map-info" aria-label="Map info"><Info size={16} aria-hidden /></button>
              </div>
            </aside>
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

                  // Update the trip data in the store
                  saveTripUpdates({
                    destination: newDestination,
                    locations: locationsStr
                  });

                  // Force re-render with updated trip data
                  setLocationUpdateKey(prev => prev + 1);
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
                          const toAdd = Array.from(files).map((f) => ({ name: f.name })).slice(0, 5 - generalAttachments.length);
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
                            {att.name}
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
                                    const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => ({ name: f.name }));
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
                                    {att.name}
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
        const update = (updates) => setTripExpenseItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, ...updates } : it)));
        return (
          <>
            <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setEditPlaceItem(null)} />
            <div className="trip-details__edit-place-modal" role="dialog" aria-labelledby="edit-place-title" aria-modal="true">
              <div className="trip-details__edit-place-head">
                <h2 id="edit-place-title" className="trip-details__edit-place-title">Edit Place</h2>
                <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setEditPlaceItem(null)}>
                  <X size={20} aria-hidden />
                </button>
              </div>
              <div className="trip-details__edit-place-body">
                <div className="trip-details__edit-place-overview">
                  {item.placeImageUrl && (
                    <img src={resolveImageUrl(item.placeImageUrl, item.name, 'landmark')} alt="" className="trip-details__edit-place-thumb" onError={handleImageError} />
                  )}
                  <div className="trip-details__edit-place-meta">
                    <span className="trip-details__edit-place-type">Place</span>
                    <h3 className="trip-details__edit-place-name">{item.name}</h3>
                    {(item.rating != null || item.reviewCount != null) && (
                      <p className="trip-details__edit-place-rating">
                        {[item.rating != null && item.rating, item.reviewCount != null && `${item.reviewCount.toLocaleString()} reviews`].filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="trip-details__edit-place-address">{item.detail || '—'}</p>
                    {item.externalLink ? (
                      <a href={item.externalLink} target="_blank" rel="noopener noreferrer" className="trip-details__edit-place-view-details">View details</a>
                    ) : (
                      <span className="trip-details__edit-place-view-details trip-details__edit-place-view-details--muted">View details</span>
                    )}
                  </div>
                </div>
                <div className="trip-details__edit-place-fields">
                  <label className="trip-details__edit-place-label">
                    Date <span className="trip-details__edit-place-required">*</span>
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
                    Start time <span className="trip-details__edit-place-required">*</span>
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
                    Duration <span className="trip-details__edit-place-required">*</span>
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
                        value={item.total ?? 0}
                        onChange={(e) => update({ total: parseFloat(e.target.value) || 0 })}
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
                          const toAdd = Array.from(files).slice(0, 3 - (item.attachments?.length || 0)).map((f) => ({ name: f.name }));
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
                            {att.name}
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
                    setTripExpenseItems((prev) => prev.filter((it) => it.id !== item.id));
                    setEditPlaceItem(null);
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

      {optimizeRouteModalOpen && optimizeRouteDay && (() => {
        const dayItems = getSortedDayItems(tripExpenseItems, optimizeRouteDay.date);
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
            <div className="trip-details__public-transport-route">
              <div className="trip-details__public-transport-step">
                <span className="trip-details__public-transport-dot" aria-hidden />
                <div>
                  <strong className="trip-details__public-transport-step-title">Departure location</strong>
                  <p className="trip-details__public-transport-step-detail">{publicTransportSegment.fromName || 'Departure address'}</p>
                </div>
              </div>
              <div className="trip-details__public-transport-connector" />
              <div className="trip-details__public-transport-step trip-details__public-transport-step--walk">
                <Footprints size={18} aria-hidden />
                <span>Walk</span>
                <span className="trip-details__public-transport-step-meta">About 06 min (450 m)</span>
              </div>
              <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
              <div className="trip-details__public-transport-step">
                <span className="trip-details__public-transport-dot trip-details__public-transport-dot--highlight" aria-hidden />
                <strong className="trip-details__public-transport-step-title">Station A</strong>
              </div>
              <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
              <div className="trip-details__public-transport-step trip-details__public-transport-step--transit">
                <Train size={18} aria-hidden />
                <span className="trip-details__public-transport-line">A</span>
                <span>MRT lines name</span>
                <span className="trip-details__public-transport-step-meta">19 min (2.3 km) (15 stops)</span>
              </div>
              <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
              <div className="trip-details__public-transport-step">
                <span className="trip-details__public-transport-dot" aria-hidden />
                <strong className="trip-details__public-transport-step-title">Station B</strong>
              </div>
              <div className="trip-details__public-transport-connector" />
              <div className="trip-details__public-transport-step trip-details__public-transport-step--walk">
                <Footprints size={18} aria-hidden />
                <span>Walk</span>
                <span className="trip-details__public-transport-step-meta">About 05 min (400 m)</span>
              </div>
              <div className="trip-details__public-transport-connector" />
              <div className="trip-details__public-transport-step">
                <span className="trip-details__public-transport-dot" aria-hidden />
                <div>
                  <strong className="trip-details__public-transport-step-title">Arrival location</strong>
                  <p className="trip-details__public-transport-step-detail">{publicTransportSegment.toName || 'Arrival address'}</p>
                </div>
              </div>
            </div>
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
              {['Private Transfers', 'Flights', 'Trains', 'Buses'].map((tab) => (
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
              {addTransportTab === 'Private Transfers' && (
                <>
                  <div className="trip-details__add-transport-radio">
                    <label className="trip-details__add-transport-radio-label">
                      <input type="radio" name="transferType" checked={transferType === 'pickup'} onChange={() => setTransferType('pickup')} />
                      <span>Airport pick-up</span>
                    </label>
                    <label className="trip-details__add-transport-radio-label">
                      <input type="radio" name="transferType" checked={transferType === 'dropoff'} onChange={() => setTransferType('dropoff')} />
                      <span>Airport drop-off</span>
                    </label>
                  </div>
                  <div className="trip-details__add-transport-fields">
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">From</label>
                      <input type="text" className="trip-details__add-transport-input" placeholder="e.g. Seattle-Tacoma International" value={transferFrom} onChange={(e) => setTransferFrom(e.target.value)} />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">To</label>
                      <input type="text" className="trip-details__add-transport-input" placeholder="Enter drop-off location" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Date & Pick-up time</label>
                      <span className="trip-details__add-transport-date-time">
                        <input type="date" className="trip-details__add-transport-input" value={transferDateKey || (days.find((x) => x.dayNum === addTransportDay)?.date || '')} onChange={(e) => setTransferDateKey(e.target.value)} />
                        <input type="time" className="trip-details__add-transport-input" value={transferTime} onChange={(e) => setTransferTime(e.target.value)} />
                      </span>
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Number of pax</label>
                      <select className="trip-details__add-transport-input" value={transferPax} onChange={(e) => setTransferPax(Number(e.target.value))} aria-label="Passengers">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (<option key={n} value={n}>{n} passengers</option>))}
                      </select>
                    </div>
                    <button type="button" className="trip-details__add-transport-search" aria-label="Search transfers">
                      <Search size={20} aria-hidden />
                    </button>
                  </div>
                  <div className="trip-details__add-transport-features">
                    <div className="trip-details__add-transport-feature">
                      <Shield size={20} aria-hidden />
                      <div>
                        <strong>Trusted operators & safer rides</strong>
                        <p>Travel worry-free with 24/7 support, professional drivers, trusted operators</p>
                      </div>
                    </div>
                    <div className="trip-details__add-transport-feature">
                      <Tag size={20} aria-hidden />
                      <div>
                        <strong>Up to 40% off</strong>
                        <p>Find the best prices and no booking fees</p>
                      </div>
                    </div>
                    <div className="trip-details__add-transport-feature">
                      <Headphones size={20} aria-hidden />
                      <div>
                        <strong>Reliable customer support</strong>
                        <p>We&apos;re always here when you need us</p>
                      </div>
                    </div>
                  </div>
                  <div className="trip-details__add-transport-faq">
                    <h3 className="trip-details__add-transport-faq-title">Frequently asked questions</h3>
                    {[
                      { q: 'Can I book a transfer for someone else?', a: 'Yes. Make sure to enter the details of the correct passenger at checkout.' },
                      { q: 'Can I book a round-trip transfer?', a: 'Yes. You can add both legs when searching.' },
                      { q: 'Can I choose my pickup and drop-off time?', a: 'Yes. Select your preferred time when booking.' },
                    ].map((faq, idx) => (
                      <div key={idx} className="trip-details__add-transport-faq-item">
                        <button type="button" className="trip-details__add-transport-faq-q" onClick={() => setTransportFaqOpen(transportFaqOpen === idx ? null : idx)} aria-expanded={transportFaqOpen === idx}>
                          {faq.q}
                          {transportFaqOpen === idx ? <Minus size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
                        </button>
                        {transportFaqOpen === idx && <p className="trip-details__add-transport-faq-a">{faq.a}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
              {addTransportTab === 'Flights' && (
                <>
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
                        const deptTime = new Date(flight.departure_time);
                        const arrTime = new Date(flight.arrival_time);
                        const duration = Math.floor((arrTime - deptTime) / (1000 * 60 * 60));
                        const durationMins = Math.floor(((arrTime - deptTime) / (1000 * 60)) % 60);

                        return (
                          <div key={flight.id} className="trip-details__add-transport-result-card">
                            <div className="trip-details__add-transport-result-header">
                              <div className="trip-details__add-transport-result-airline">
                                <Plane size={20} aria-hidden />
                                <div>
                                  <strong>{flight.airline}</strong>
                                  <span className="trip-details__add-transport-result-code">{flight.flight_code}</span>
                                </div>
                              </div>
                              <span className={`trip-details__add-transport-result-status trip-details__add-transport-result-status--${flight.status}`}>
                                {flight.status}
                              </span>
                            </div>

                            <div className="trip-details__add-transport-result-route">
                              <div className="trip-details__add-transport-result-location">
                                <strong className="trip-details__add-transport-result-time">
                                  {deptTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
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
                                  {duration}h {durationMins}m
                                </span>
                              </div>

                              <div className="trip-details__add-transport-result-location">
                                <strong className="trip-details__add-transport-result-time">
                                  {arrTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                </strong>
                                <span className="trip-details__add-transport-result-airport">{flight.arrival_airport}</span>
                                <span className="trip-details__add-transport-result-city">{flight.arrival_city}</span>
                              </div>
                            </div>

                            {flight.aircraft && (
                              <div className="trip-details__add-transport-result-aircraft">
                                <span>Aircraft: {flight.aircraft}</span>
                              </div>
                            )}

                            <button
                              type="button"
                              className="trip-details__add-transport-result-add"
                              onClick={() => {
                                const name = `${flight.departure_airport} → ${flight.arrival_airport} (${flight.flight_code})`;
                                const deptTimeStr = deptTime.toTimeString().slice(0, 5);
                                const arrTimeStr = arrTime.toTimeString().slice(0, 5);

                                setTripExpenseItems((prev) => [...prev, {
                                  id: `flight-${flight.id}-${Date.now()}`,
                                  name,
                                  total: 0,
                                  categoryId: 'transportations',
                                  category: 'Transportations',
                                  date: flight.flight_date,
                                  detail: `${flight.airline} ${flight.flight_code} | Departs ${deptTimeStr}, Arrives ${arrTimeStr}`,
                                  Icon: Plane,
                                  notes: `Terminal: ${flight.terminal}, Gate: ${flight.gate}${flight.aircraft ? `, Aircraft: ${flight.aircraft}` : ''}`,
                                  attachments: [],
                                  transportType: 'flight',
                                  flightData: flight,
                                }]);

                                setFlightSearchResults([]);
                                setFlightCode('');
                                setFlightDepartDate('');
                                setAddTransportOpen(false);
                              }}
                            >
                              Add to trip
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
              {(addTransportTab === 'Trains' || addTransportTab === 'Buses') && (
                <p className="trip-details__add-transport-hint">Add your {addTransportTab.toLowerCase()} reservations below.</p>
              )}
              <div className="trip-details__add-transport-or">or</div>
              <div className="trip-details__add-transport-reservations">
                <h3 className="trip-details__add-transport-reservations-title">Add reservations to your plan</h3>
                <p className="trip-details__add-transport-reservations-sub">Forward the confirmation email, or connect Gmail for automatic syncing</p>
                <button type="button" className="trip-details__add-transport-forward">
                  <Mail size={18} aria-hidden />
                  Forward email
                </button>
              </div>
              <p className="trip-details__add-transport-manual">
                Can&apos;t find what you need? <button type="button" className="trip-details__add-transport-manual-link" onClick={() => { setAddTransportOpen(false); setAddCustomTransportOpen(true); }}>Add manually</button>
              </p>
            </div>
          </div>
        </>
      )}

      {addCustomTransportOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddCustomTransportOpen(false)} />
          <div className="trip-details__custom-transport-modal" role="dialog" aria-labelledby="custom-transport-title" aria-modal="true">
            <div className="trip-details__custom-transport-head">
              <h2 id="custom-transport-title" className="trip-details__custom-transport-title">Add Custom Transport</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddCustomTransportOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-transport-form"
              onSubmit={(e) => {
                e.preventDefault();
                const costNum = parseFloat(customTransportCost) || 0;
                const name = customTransportVehicle === 'Flight'
                  ? `${customTransportFrom || 'From'} → ${customTransportTo || 'To'}${customTransportFlightNumber ? ` (${customTransportFlightNumber})` : ''}`
                  : (customTransportVehicle === 'Train' || customTransportVehicle === 'Bus')
                    ? (customTransportName || `${customTransportVehicle}: ${customTransportFrom || 'From'} → ${customTransportTo || 'To'}`)
                    : `${customTransportVehicle}${customTransportFrom ? `: ${customTransportFrom}` : ''}`;
                const TransportIcon = customTransportVehicle === 'Flight' ? Plane : customTransportVehicle === 'Train' ? Train : customTransportVehicle === 'Bus' ? Bus : customTransportVehicle === 'Ferry' ? Ship : Car;
                setTripExpenseItems((prev) => [...prev, {
                  id: `transport-${Date.now()}`,
                  name,
                  total: costNum,
                  categoryId: 'transportations',
                  category: 'Transportations',
                  date: customTransportDepartureDate || days[0]?.date,
                  detail: customTransportNote || customTransportVehicle,
                  Icon: TransportIcon,
                  notes: '',
                  attachments: [],
                }]);
                setAddCustomTransportOpen(false);
                setCustomTransportName('');
                setCustomTransportFrom('');
                setCustomTransportTo('');
                setCustomTransportAirline('');
                setCustomTransportFlightNumber('');
                setCustomTransportDepartureDate('');
                setCustomTransportArrivalDate('');
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
                Vehicle <span className="trip-details__custom-transport-required">*</span>
                <select className="trip-details__custom-transport-select" value={customTransportVehicle} onChange={(e) => setCustomTransportVehicle(e.target.value)} required>
                  {VEHICLE_TYPES.map((v) => (<option key={v.value} value={v.value}>{v.label}</option>))}
                </select>
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
                    Airline
                    <div className="trip-details__custom-transport-autofill-wrap">
                      <input
                        type="text"
                        className="trip-details__custom-transport-input"
                        placeholder="Select airline"
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
              id: place?.id || `${itineraryDetailsView.id || 'community-itinerary'}-place-${index + 1}`,
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
                          <Users size={16} aria-hidden /> {itineraryDetailsView.creator}
                        </span>
                        <span className="trip-details__itinerary-detail-stat">{Number(itineraryDetailsView.views || itineraryDetailsView.likes || 0).toLocaleString()} views</span>
                        <span className="trip-details__itinerary-detail-stat">{itineraryDetailsView.duration}</span>
                        <span className="trip-details__itinerary-detail-stat">{Number(itineraryDetailsView.countriesCount || 1)} country</span>
                        <span className="trip-details__itinerary-detail-stat">{itineraryPlaces.length} places</span>
                      </div>
                      <div className="trip-details__itinerary-detail-tags">
                        {(Array.isArray(itineraryDetailsView.tags) ? itineraryDetailsView.tags : [itineraryDetailsView.type]).filter(Boolean).slice(0, 5).map((tag) => (
                          <span key={tag} className="trip-details__itinerary-detail-tag">{tag}</span>
                        ))}
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
                                    <strong>Note:</strong> {place.note || place.overview || 'Community recommendation from this itinerary.'}
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
                            <p className="trip-details__add-places-results">
                              {filteredPlaces.length} results found · Page {addPlacesPage} of {addPlacesTotalPages}
                            </p>
                            <div className="trip-details__add-places-filters">
                              {PLACE_FILTER_TAGS.map((tag) => (
                                <button
                                  key={tag}
                                  type="button"
                                  className={`trip-details__add-places-tag ${placeFilterTag === tag ? 'trip-details__add-places-tag--active' : ''}`}
                                  onClick={() => setPlaceFilterTag(placeFilterTag === tag ? '' : tag)}
                                >
                                  {tag}
                                </button>
                              ))}
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
                                    {place.tags && place.tags.length > 0 && (
                                      <div className="trip-details__add-places-card-tags">
                                        {place.tags.map((t) => (
                                          <span key={t} className="trip-details__add-places-card-tag" data-tag={t}>{t}</span>
                                        ))}
                                      </div>
                                    )}
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
                        {detailPlace.tags && detailPlace.tags[0] && (
                          <span className="trip-details__place-detail-badge">{detailPlace.tags[0]}</span>
                        )}
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
                            <p className="trip-details__place-detail-overview">{detailPlace.overview}<span className="trip-details__place-detail-read-more"> Read more</span></p>
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
                                setAddToTripDurationHrs(1);
                                setAddToTripDurationMins(0);
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
                          {Array.isArray(detailPlace.whySkip) && detailPlace.whySkip.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Why you might want to skip it</h3>
                              <ul className="trip-details__place-detail-hours">
                                {detailPlace.whySkip.map((reason, idx) => (
                                  <li key={`skip-${idx}`}>{reason}</li>
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
                                setAddToTripDurationHrs(1);
                                setAddToTripDurationMins(0);
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
                          {Array.isArray(foodDetailsView.whySkip) && foodDetailsView.whySkip.length > 0 && (
                            <div className="trip-details__place-detail-section">
                              <h3 className="trip-details__place-detail-section-title">Why you might want to skip it</h3>
                              <ul className="trip-details__place-detail-hours">
                                {foodDetailsView.whySkip.map((reason, idx) => (
                                  <li key={`food-skip-${idx}`}>{reason}</li>
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
                            aria-label="Filter by dietary needs"
                          >
                            {FOOD_DIETARY_FILTERS.map((filter) => (
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
                      } else if (id === 'community') {
                        openCommunityBrowseAll();
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

      {addToTripModalOpen && addToTripItem && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddToTripModalOpen(false)} />
          <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="add-to-trip-title" aria-modal="true">
            <div className="trip-details__custom-place-head">
              <h2 id="add-to-trip-title" className="trip-details__custom-place-title">Add {addToTripItem.type === 'place' ? 'Place' : addToTripItem.type === 'food' ? 'Food & Beverage' : 'Experience'}</h2>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setAddToTripModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <form
              className="trip-details__custom-place-form"
              onSubmit={(e) => {
                e.preventDefault();
                const data = addToTripItem.data;
                appendItemToTrip({
                  itemType: addToTripItem.type,
                  data,
                  categoryId: addToTripItem.categoryId,
                  category: addToTripItem.category,
                  Icon: addToTripItem.Icon,
                  values: {
                    date: addToTripDate,
                    startTime: addToTripStartTime,
                    durationHrs: addToTripDurationHrs,
                    durationMins: addToTripDurationMins,
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
                }
              }}
            >
              <div className="trip-details__custom-place-preview">
                <img src={resolveImageUrl(addToTripItem.data.image, addToTripItem.data.name, addToTripItem.type || 'place')} alt={addToTripItem.data.name} className="trip-details__custom-place-preview-img" onError={handleImageError} />
                <div className="trip-details__custom-place-preview-content">
                  <span className="trip-details__custom-place-preview-badge">{addToTripItem.type === 'place' ? 'Place' : addToTripItem.type === 'food' ? 'Food & Beverage' : 'Experience'}</span>
                  <h3 className="trip-details__custom-place-preview-name">{addToTripItem.data.name}</h3>
                  <p className="trip-details__custom-place-preview-rating">
                    <Star size={14} fill="currentColor" aria-hidden /> {addToTripItem.data.rating} ({addToTripItem.data.reviewCount?.toLocaleString() ?? '0'} reviews)
                  </p>
                  <p className="trip-details__custom-place-preview-address">{addToTripItem.data.address}</p>
                </div>
              </div>

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
                      max="24"
                      value={addToTripDurationHrs}
                      onChange={(e) => setAddToTripDurationHrs(parseInt(e.target.value) || 0)}
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
                      onChange={(e) => setAddToTripDurationMins(parseInt(e.target.value) || 0)}
                    />
                    <span className="trip-details__custom-place-duration-separator">mins</span>
                  </div>
                </div>
              </div>

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
                const totalCost = bookingOption.price * bookingTravellers;
                setTripExpenseItems((prev) => [...prev, {
                  id: `experience-${bookingExperience.id}-${bookingOption.id}-${Date.now()}`,
                  name: bookingExperience.name,
                  total: totalCost,
                  categoryId: 7,
                  category: 'Experience',
                  date: bookingDate,
                  detail: `${bookingOption.name} - ${bookingTravellers} traveller${bookingTravellers !== 1 ? 's' : ''}`,
                  Icon: Ticket,
                  lat: bookingExperience.lat,
                  lng: bookingExperience.lng,
                  notes: bookingNotes,
                  attachments: [],
                  startTime: bookingStartTime,
                  durationHrs: Math.floor(bookingExperience.durationHours),
                  durationMins: Math.round((bookingExperience.durationHours % 1) * 60),
                  externalLink: '',
                  placeImageUrl: bookingExperience.image,
                  rating: bookingExperience.rating,
                  reviewCount: bookingExperience.reviewCount,
                  experienceType: bookingExperience.type,
                  bookingOption: bookingOption.name,
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
    </div>
  );
}

export default function TripDetailsPage({ user, onLogout }) {
  const { tripId } = useParams();
  const [tripData, setTripData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!tripId) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchTrip(tripId);
        if (cancelled) return;
        const trip = data?.trip || null;
        setTripData(trip);
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load trip');
          setTripData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return (
      <div className="trip-details trip-details--missing">
        <p>Loading trip…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="trip-details trip-details--missing">
        <p>{error}</p>
        <Link to="/">Back to My Trips</Link>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="trip-details trip-details--missing">
        <p>Trip not found.</p>
        <Link to="/">Back to My Trips</Link>
      </div>
    );
  }

  return (
    <TripDetailsPageInner
      key={tripId}
      user={user}
      onLogout={onLogout}
      tripId={tripId}
      initialTripData={tripData}
    />
  );
}