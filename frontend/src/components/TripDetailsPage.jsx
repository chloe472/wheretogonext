import { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronDown,
  Share2,
  Trash2,
  ShoppingCart,
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
} from 'lucide-react';
import { getTripById, getTripDays } from '../data/mockTrips';
import { getPlacesForDestination, getMapCenterForDestination, PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS } from '../data/mockPlaces';
import { searchLocations } from '../data/mockLocations';
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
const MAP_FILTERS = ['Default', 'Days', 'Food & Beverages', 'Experiences'];

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
  { id: 'SEA', name: 'Seattle-Tacoma International (SEA)', type: 'Airport' },
  { id: 'LAX', name: 'Los Angeles International (LAX)', type: 'Airport' },
  { id: 'JFK', name: 'John F. Kennedy International (JFK)', type: 'Airport' },
  { id: 'LHR', name: 'London Heathrow (LHR)', type: 'Airport' },
  { id: 'CDG', name: 'Paris Charles de Gaulle (CDG)', type: 'Airport' },
  { id: 'NRT', name: 'Tokyo Narita (NRT)', type: 'Airport' },
  { id: 'HND', name: 'Tokyo Haneda (HND)', type: 'Airport' },
  { id: 'SIN', name: 'Singapore Changi (SIN)', type: 'Airport' },
  { id: 'BKK', name: 'Bangkok Suvarnabhumi (BKK)', type: 'Airport' },
  { id: 'SGN', name: 'Ho Chi Minh City (SGN)', type: 'Airport' },
  { id: 'DXB', name: 'Dubai International (DXB)', type: 'Airport' },
  { id: 'FRA', name: 'Frankfurt (FRA)', type: 'Airport' },
  { id: 'AMS', name: 'Amsterdam Schiphol (AMS)', type: 'Airport' },
  { id: 'SYD', name: 'Sydney Kingsford Smith (SYD)', type: 'Airport' },
  { id: 'YYZ', name: 'Toronto Pearson (YYZ)', type: 'Airport' },
  { id: 'city-seattle', name: 'Seattle', type: 'City' },
  { id: 'city-paris', name: 'Paris', type: 'City' },
  { id: 'city-tokyo', name: 'Tokyo', type: 'City' },
  { id: 'city-london', name: 'London', type: 'City' },
  { id: 'city-bangkok', name: 'Bangkok', type: 'City' },
  { id: 'city-singapore', name: 'Singapore', type: 'City' },
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
  return AIRPORTS_AND_CITIES.filter(
    (a) => a.name.toLowerCase().includes(q)
  ).slice(0, limit);
}

function searchAirlines(query, limit = 8) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return [];
  return AIRLINES.filter(
    (a) => a.name.toLowerCase().includes(q) || (a.id && a.id.toLowerCase().includes(q))
  ).slice(0, limit);
}

export default function TripDetailsPage({ user, onLogout }) {
  const { tripId } = useParams();
  const trip = getTripById(tripId);
  const [currency, setCurrency] = useState('USD');
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
  const [addCustomPlaceOpen, setAddCustomPlaceOpen] = useState(false);
  const [addPlacesDay, setAddPlacesDay] = useState(1);
  const [placeSearchQuery, setPlaceSearchQuery] = useState('');
  const [placeFilterTag, setPlaceFilterTag] = useState('');
  const [placeSortBy, setPlaceSortBy] = useState('Recommended');
  const [tripExpenseItems, setTripExpenseItems] = useState([]);
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [customPlaceAddress, setCustomPlaceAddress] = useState('');
  const [customPlaceDateKey, setCustomPlaceDateKey] = useState('');
  const [customPlaceStartTime, setCustomPlaceStartTime] = useState('07:00');
  const [customPlaceDurationHrs, setCustomPlaceDurationHrs] = useState(1);
  const [customPlaceDurationMins, setCustomPlaceDurationMins] = useState(0);
  const [customPlaceNote, setCustomPlaceNote] = useState('');
  const [customPlaceCost, setCustomPlaceCost] = useState('');
  const [customPlaceImage, setCustomPlaceImage] = useState(null);
  const [customPlaceTravelDocs, setCustomPlaceTravelDocs] = useState([]);
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
  const [whereSelectedLocation, setWhereSelectedLocation] = useState(null);
  const whereModalRef = useRef(null);
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

  const mapCenter = useMemo(
    () => getMapCenterForDestination(trip?.destination || trip?.locations),
    [trip?.destination, trip?.locations],
  );

  const mapMarkers = useMemo(() => {
    const items = tripExpenseItems.filter((i) => i.lat != null && i.lng != null);
    return items.map((i) => {
      const day = days.find((d) => d.date === i.date);
      return {
        id: i.id,
        name: i.name,
        lat: i.lat,
        lng: i.lng,
        dayNum: day?.dayNum ?? 1,
      };
    });
  }, [tripExpenseItems, days]);

  return (
    <div className="trip-details">
      <header className="trip-details__header">
        <div className="trip-details__brand">
          <Link to="/" className="trip-details__logo" aria-label="Back to My Trips">
            @
          </Link>
          <div className="trip-details__trip-info">
            <button type="button" className="trip-details__title-btn">
              {days.length} days to {trip.destination}
              <ChevronDown size={16} aria-hidden />
            </button>
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
              const dest = trip.destination || '';
              setWhereQuery(dest);
              const match = dest.trim() ? searchLocations(dest).find((loc) => loc.name === dest.trim()) : null;
              setWhereSelectedLocation(match || null);
              setWhereModalOpen(true);
              setWhereSuggestionsOpen(false);
            }}
            aria-label="Change destination"
          >
            {trip.destination}
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
          <button type="button" className="trip-details__icon-btn" aria-label="Delete trip">
            <Trash2 size={18} aria-hidden />
          </button>
          <button type="button" className="trip-details__icon-btn" aria-label="Cart">
            <ShoppingCart size={18} aria-hidden />
          </button>
          <button type="button" className="trip-details__save">
            Save
          </button>
        </div>
      </header>

      <div className="trip-details__body">
        {viewMode === 'kanban' ? (
          <div className="trip-details__columns">
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
                          onClick={() => (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item); } }}
                        >
                          <span className="trip-details__itinerary-num" aria-hidden>{idx + 1}</span>
                          <div className="trip-details__itinerary-card-thumb">
                            {item.placeImageUrl ? (
                              <img src={item.placeImageUrl} alt="" className="trip-details__itinerary-card-img" />
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
                            onClick={(e) => { e.stopPropagation(); (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item); }}
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
                        {getSortedDayItems(tripExpenseItems, day.date).map((item, idx) => {
                          const style = getCategoryStyle(item);
                          const IconComponent = item.Icon || Camera;
                          const timeRange = formatTimeRange(item);
                          const segmentKey = `cal-${day.date}-${idx}`;
                          const mode = transportModeBySegment[segmentKey] || transportModeBySegment[`${day.date}-${idx}`] || 'driving';
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
                                onClick={() => (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item); } }}
                              >
                                <span className="trip-details__itinerary-num" aria-hidden>{idx + 1}</span>
                                <div className="trip-details__itinerary-card-thumb">
                                  {item.placeImageUrl ? (
                                    <img src={item.placeImageUrl} alt="" className="trip-details__itinerary-card-img" />
                                  ) : (
                                    <span className="trip-details__itinerary-card-icon" style={{ background: `${style.color}22`, color: style.color }}>
                                      <IconComponent size={20} aria-hidden />
                                    </span>
                                  )}
                                </div>
                                <div className="trip-details__itinerary-card-body">
                                  <span className="trip-details__itinerary-category" style={{ color: style.color }}>{style.label}</span>
                                  <h4 className="trip-details__itinerary-name">{item.name}</h4>
                                  {timeRange && <span className="trip-details__itinerary-time">{timeRange}</span>}
                                </div>
                                <button type="button" className="trip-details__itinerary-edit-btn" aria-label="Edit" onClick={(e) => { e.stopPropagation(); (item.categoryId === 'places' || item.category === 'Places') && setEditPlaceItem(item); }}>
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
                                              className="trip-details__travel-dropdown-option"
                                              onClick={() => {
                                                setTransportModeBySegment((prev) => ({ ...prev, [segmentKey]: m.id, [`${day.date}-${idx}`]: m.id }));
                                                setOpenTravelDropdownKey(null);
                                                if (m.id === 'public') {
                                                  setPublicTransportSegment({ fromName: item.name, toName: nextItem.name });
                                                  setPublicTransportModalOpen(true);
                                                }
                                              }}
                                            >
                                              <m.Icon size={18} aria-hidden />
                                              <span>{m.id === 'public' ? m.label : `${m.label} · ${getTravelBetween(item, nextItem, m.id).duration}`}</span>
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
                    setWhereSelectedLocation(null);
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
                          aria-selected={whereSelectedLocation?.id === loc.id}
                          onClick={() => {
                            setWhereSelectedLocation(loc);
                            setWhereQuery(loc.name);
                            setWhereSuggestionsOpen(false);
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
              {(whereSelectedLocation || whereQuery.trim()) && (
                <div className="trip-details__where-chip-wrap">
                  <span className="trip-details__where-chip">
                    {whereSelectedLocation ? (() => {
                      const countryCode = whereSelectedLocation.country
                        ? (countriesData.find((c) => c.name === whereSelectedLocation.country)?.id ?? (whereSelectedLocation.type === 'Country' ? whereSelectedLocation.id : null))
                        : (whereSelectedLocation.type === 'Country' ? whereSelectedLocation.id : null);
                      const flag = countryCode ? countryCodeToFlag(countryCode) : '';
                      return (
                        <>
                          {flag && <span className="trip-details__where-chip-flag" aria-hidden>{flag}</span>}
                          {whereSelectedLocation.name}
                        </>
                      );
                    })() : whereQuery.trim()}
                    <button
                      type="button"
                      className="trip-details__where-chip-remove"
                      aria-label="Remove selection"
                      onClick={() => {
                        setWhereSelectedLocation(null);
                        setWhereQuery('');
                      }}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </span>
                </div>
              )}
            </div>
            <div className="trip-details__where-modal-actions">
              <button type="button" className="trip-details__modal-cancel" onClick={() => setWhereModalOpen(false)}>Cancel</button>
              <button
                type="button"
                className="trip-details__modal-update"
                onClick={() => {
                  const name = whereSelectedLocation?.name ?? (whereQuery.trim() || trip.destination);
                  const locations = whereSelectedLocation
                    ? (whereSelectedLocation.country ? `${whereSelectedLocation.name}, ${whereSelectedLocation.country}` : whereSelectedLocation.name)
                    : (whereQuery.trim() || trip.destination);
                  trip.destination = name;
                  trip.locations = locations;
                  setWhereModalOpen(false);
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
                    <img src={item.placeImageUrl} alt="" className="trip-details__edit-place-thumb" />
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
                      <input type="text" className="trip-details__add-transport-input" placeholder="eg. UA614" value={flightCode} onChange={(e) => setFlightCode(e.target.value)} />
                    </div>
                    <div className="trip-details__add-transport-field">
                      <label className="trip-details__add-transport-label">Depart date</label>
                      <input type="date" className="trip-details__add-transport-input" value={flightDepartDate} onChange={(e) => setFlightDepartDate(e.target.value)} />
                    </div>
                    <button type="button" className="trip-details__add-transport-search" aria-label="Search flight">
                      <Search size={20} aria-hidden />
                    </button>
                  </div>
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
                <input type="file" id="custom-transport-image" accept=".svg,.png,.jpg,.jpeg,.webp,.gif" className="trip-details__custom-transport-file-input" onChange={() => {}} />
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
                          {searchAirportsAndCities(customTransportFrom).map((a) => (
                            <li key={a.id}>
                              <button type="button" className="trip-details__custom-transport-suggestion-item" onMouseDown={() => { setCustomTransportFrom(a.name); setTransportFromSuggestionsOpen(false); }}>{a.name}</button>
                            </li>
                          ))}
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
                          {searchAirportsAndCities(customTransportTo).map((a) => (
                            <li key={a.id}>
                              <button type="button" className="trip-details__custom-transport-suggestion-item" onMouseDown={() => { setCustomTransportTo(a.name); setTransportToSuggestionsOpen(false); }}>{a.name}</button>
                            </li>
                          ))}
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
                          {searchAirportsAndCities(customTransportFrom).map((a) => (
                            <li key={a.id}>
                              <button type="button" className="trip-details__custom-transport-suggestion-item" onMouseDown={() => { setCustomTransportFrom(a.name); setTransportFromSuggestionsOpen(false); }}>{a.name}</button>
                            </li>
                          ))}
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
                          {searchAirportsAndCities(customTransportTo).map((a) => (
                            <li key={a.id}>
                              <button type="button" className="trip-details__custom-transport-suggestion-item" onMouseDown={() => { setCustomTransportTo(a.name); setTransportToSuggestionsOpen(false); }}>{a.name}</button>
                            </li>
                          ))}
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

      {addPlacesOpen && (
        <>
          <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={() => setAddPlacesOpen(false)} />
          <div className="trip-details__add-places-modal" role="dialog" aria-labelledby="add-places-title" aria-modal="true">
            <div className="trip-details__add-places-head">
              <h2 id="add-places-title" className="trip-details__add-places-title">Add Places</h2>
              <div className="trip-details__add-places-location">
                <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                <span>{trip.locations || trip.destination}</span>
              </div>
              <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={() => setAddPlacesOpen(false)}>
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
                    onChange={(e) => setPlaceSearchQuery(e.target.value)}
                    aria-label="Search places"
                  />
                </div>
                {(() => {
                  const places = getPlacesForDestination(trip.destination || trip.locations, { searchQuery: placeSearchQuery, filterTag: placeFilterTag, sortBy: placeSortBy });
                  return (
                    <>
                      <p className="trip-details__add-places-results">{places.length} results found</p>
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
                          <div key={place.id} className="trip-details__add-places-card">
                            <img src={place.image} alt="" className="trip-details__add-places-card-img" />
                            <button type="button" className="trip-details__add-places-card-heart" aria-label={place.saved ? 'Unsave' : 'Save'}>
                              <Heart size={18} fill={place.saved ? 'currentColor' : 'none'} aria-hidden />
                            </button>
                            <button
                              type="button"
                              className="trip-details__add-places-card-add"
                              aria-label="Add to trip"
                              onClick={() => {
                                const day = days.find((d) => d.dayNum === addPlacesDay);
                                setTripExpenseItems((prev) => [...prev, {
                                  id: `place-${place.id}-${Date.now()}`,
                                  name: place.name,
                                  total: 0,
                                  categoryId: 'places',
                                  category: 'Places',
                                  date: day?.date || days[0]?.date || '',
                                  detail: place.name,
                                  Icon: Camera,
                                  lat: place.lat,
                                  lng: place.lng,
                                  notes: '',
                                  attachments: [],
                                  startTime: '07:00',
                                  durationHrs: 1,
                                  durationMins: 0,
                                  externalLink: '',
                                  placeImageUrl: place.image,
                                  rating: place.rating,
                                  reviewCount: place.reviewCount,
                                }]);
                              }}
                            >
                              <Plus size={18} aria-hidden />
                            </button>
                            <div className="trip-details__add-places-card-info">
                              <span className="trip-details__add-places-card-name">{place.name}</span>
                              <span className="trip-details__add-places-card-rating">{place.rating} ({place.reviewCount.toLocaleString()})</span>
                              {place.tags.length > 0 && (
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
                    </>
                  );
                })()}
              </div>
              <div className="trip-details__add-places-map-panel">
                {(() => {
                  const mapPlaces = getPlacesForDestination(trip.destination || trip.locations, {
                    searchQuery: placeSearchQuery,
                    filterTag: placeFilterTag,
                    sortBy: placeSortBy,
                  });
                  const addPlacesMarkers = mapPlaces
                    .filter((p) => p.lat != null && p.lng != null)
                    .map((p, i) => ({ id: p.id, name: p.name, lat: p.lat, lng: p.lng, dayNum: (i % Math.max(days.length, 1)) + 1 }));
                  return (
                    <div className="trip-details__add-places-map">
                      <TripMap
                        center={mapCenter}
                        zoom={11}
                        markers={addPlacesMarkers}
                        activeDayNums={allDayNums}
                        className="trip-details__add-places-trip-map"
                        fitBounds={addPlacesMarkers.length > 0}
                      />
                    </div>
                  );
                })()}
                <button
                  type="button"
                  className="trip-details__add-places-filter-days"
                  onClick={() => {
                    resetMapDays();
                    setMapDayFilterOpen(true);
                  }}
                >
                  <CalendarIcon size={16} aria-hidden /> Filter days
                </button>
              </div>
            </div>
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
                const [fallbackLat, fallbackLng] = mapCenter;
                setTripExpenseItems((prev) => [...prev, {
                  id: `place-${Date.now()}`,
                  name: customPlaceName,
                  total: costNum,
                  categoryId: 'places',
                  category: 'Places',
                  date: customPlaceDateKey,
                  detail: customPlaceAddress || 'Custom place',
                  Icon: Camera,
                  lat: fallbackLat,
                  lng: fallbackLng,
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
                  <span className="trip-details__custom-place-input-wrap">
                    <MapPin size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                    <input type="text" className="trip-details__custom-place-input" placeholder="Search by landmark or address" value={customPlaceAddress} onChange={(e) => setCustomPlaceAddress(e.target.value)} required />
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
                      } else if (id === 'transportation') {
                        setAddTransportDay(addSheetDay ?? 1);
                        setAddTransportOpen(true);
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
    </div>
  );
}
