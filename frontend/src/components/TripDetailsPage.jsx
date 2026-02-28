import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import { getTripById, getTripDays } from '../data/mockTrips';
import { getPlacesForDestination, PLACE_FILTER_TAGS, PLACE_SORT_OPTIONS } from '../data/mockPlaces';
import DateRangePickerModal from './DateRangePickerModal';
import './TripDetailsPage.css';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  const placesAmount = placesExtra.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
  const merged = [...items, ...extraItems.map((i, idx) => ({ ...i, id: i.id || `extra-${idx}` }))];
  const catPlaces = byCategory.find((c) => c.id === 'places');
  if (catPlaces) catPlaces.amount = placesAmount;
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
];

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
          <span className="trip-details__pill">{trip.destination}</span>
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
            {visibleDays.map((day) => (
              <section key={day.dayNum} className="trip-details__day-col">
                <div className="trip-details__day-header">
                  <div className="trip-details__day-heading">
                    <GripVertical size={14} className="trip-details__grip" aria-hidden />
                    <h2 className="trip-details__day-title">
                      Day {day.dayNum}: {day.label}
                    </h2>
                  </div>
                  <button type="button" className="trip-details__day-menu" aria-label="Day options">
                    <MoreVertical size={16} aria-hidden />
                  </button>
                </div>
                <input
                  type="text"
                  className="trip-details__day-input"
                  placeholder="Add day title..."
                  value={dayTitles[day.dayNum] ?? ''}
                  onChange={(e) => setDayTitle(day.dayNum, e.target.value)}
                />
                <div className="trip-details__day-content">
                  {/* Placeholder for cards/activities */}
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
            ))}

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
              <div className="trip-details__map-placeholder">
                <div className="trip-details__map-markers">
                  {days.map((day, idx) => {
                    if (!activeDayNums.includes(day.dayNum)) return null;
                    const col = idx % 3;
                    const row = Math.floor(idx / 3);
                    const left = 18 + col * 22;
                    const top = 22 + row * 18;
                    const colorIndex = (day.dayNum % 5) || 5;
                    return (
                      <button
                        key={day.dayNum}
                        type="button"
                        className={`trip-details__map-marker trip-details__map-marker--day${colorIndex}`}
                        style={{ left: `${left}%`, top: `${top}%` }}
                        aria-label={`Day ${day.dayNum}`}
                      >
                        <MapPin size={14} aria-hidden />
                      </button>
                    );
                  })}
                </div>
                <MapPin size={48} aria-hidden />
                <p>Map</p>
                <span className="trip-details__map-hint">Add a map provider (e.g. Leaflet) for pins</span>
              </div>
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
                      {Array.from({ length: 12 }, (_, i) => (
                        <div key={i} className="trip-details__calendar-cell" />
                      ))}
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
                <div className="trip-details__map-placeholder">
                  <div className="trip-details__map-markers">
                    {days.map((day, idx) => {
                      if (!activeDayNums.includes(day.dayNum)) return null;
                      const col = idx % 3;
                      const row = Math.floor(idx / 3);
                      const left = 18 + col * 22;
                      const top = 22 + row * 18;
                      const colorIndex = (day.dayNum % 5) || 5;
                      return (
                        <button
                          key={day.dayNum}
                          type="button"
                          className={`trip-details__map-marker trip-details__map-marker--day${colorIndex}`}
                          style={{ left: `${left}%`, top: `${top}%` }}
                          aria-label={`Day ${day.dayNum}`}
                        >
                          <MapPin size={14} aria-hidden />
                        </button>
                      );
                    })}
                  </div>
                  <MapPin size={48} aria-hidden />
                  <p>Map</p>
                  <span className="trip-details__map-hint">Add a map provider (e.g. Leaflet) for pins</span>
                </div>
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
                            <button type="button" className="trip-details__add-places-card-add" aria-label="Add to trip">
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
                  const dayCount = Math.max(days.length, 1);
                  return (
                    <div className="trip-details__add-places-map">
                      <div className="trip-details__add-places-map-base">
                        <span className="trip-details__add-places-map-label">Map preview</span>
                      </div>
                      {mapPlaces.map((p, idx) => {
                        const dayNum = (idx % dayCount) + 1;
                        if (!activeDayNums.includes(dayNum)) return null;
                        const col = idx % 3;
                        const row = Math.floor(idx / 3);
                        const left = 12 + col * 28;
                        const top = 18 + row * 20;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            className="trip-details__add-places-map-marker"
                            style={{ left: `${left}%`, top: `${top}%` }}
                            aria-label={p.name}
                          >
                            <MapPin size={16} aria-hidden />
                          </button>
                        );
                      })}
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
                if (costNum > 0) {
                  setTripExpenseItems((prev) => [...prev, {
                    id: `place-${Date.now()}`,
                    name: customPlaceName,
                    total: costNum,
                    categoryId: 'places',
                    category: 'Places',
                    date: customPlaceDateKey,
                    detail: customPlaceAddress || 'Custom place',
                    Icon: Camera,
                  }]);
                }
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
