import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
} from 'lucide-react';
import { getTripById, getTripDays } from '../data/mockTrips';
import './TripDetailsPage.css';

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateRangeLabel(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
  return `${dayNames[s.getDay()]}, ${s.getDate()} ${MONTH_SHORT[s.getMonth()]} - ${dayNames[e.getDay()]}, ${e.getDate()} ${MONTH_SHORT[e.getMonth()]} - ${days} days`;
}

function getCalendarCells(year, month, rangeStart, rangeEnd) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const startOffset = startDow === 0 ? 6 : startDow - 1;
  const cells = [];
  const prevMonth = new Date(year, month, 0);
  const prevCount = prevMonth.getDate();
  for (let i = 0; i < startOffset; i++) {
    const d = prevCount - startOffset + i + 1;
    const date = new Date(year, month - 1, d);
    const dateStr = date.toISOString().slice(0, 10);
    cells.push({ dateStr, day: d, currentMonth: false, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dateStr, day: d, currentMonth: true, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const dateStr = date.toISOString().slice(0, 10);
    cells.push({ dateStr, day: d, currentMonth: false, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
  }
  return cells;
}

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
  const [viewMode, setViewMode] = useState('kanban');
  const [dateRange, setDateRange] = useState(null);
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [modalCurrency, setModalCurrency] = useState('USD');
  const [modalDateStart, setModalDateStart] = useState(null);
  const [modalDateEnd, setModalDateEnd] = useState(null);
  const [modalCalendarOffset, setModalCalendarOffset] = useState(0);

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
  const displayDatesLabel = displayStart && displayEnd
    ? (() => {
        const s = new Date(displayStart);
        const e = new Date(displayEnd);
        return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}`;
      })()
    : trip.dates;

  const openDateModal = () => {
    setModalDateStart(displayStart);
    setModalDateEnd(displayEnd);
    setModalCalendarOffset(0);
    setDateModalOpen(true);
  };

  const applyDateRange = (start, end) => {
    if (start && end && start <= end) {
      setDateRange({ startDate: start, endDate: end });
    }
  };

  const handleCalendarDateClick = (dateStr) => {
    if (modalDateStart && modalDateEnd) {
      setModalDateStart(dateStr);
      setModalDateEnd(null);
      return;
    }
    if (!modalDateStart) {
      setModalDateStart(dateStr);
      return;
    }
    if (dateStr < modalDateStart) {
      setModalDateEnd(modalDateStart);
      setModalDateStart(dateStr);
    } else {
      setModalDateEnd(dateStr);
    }
  };

  const setDayTitle = (dayNum, value) => {
    setDayTitles((prev) => ({ ...prev, [dayNum]: value }));
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
              Spent: {currency} ${spent.toFixed(2)} <a href="#details">Details</a>
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
            {days.map((day) => (
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
                  onClick={() => { setAddSheetFromCalendar(false); setAddSheetDay(day.dayNum); }}
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
              <button type="button" className="trip-details__map-ctrl">
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
                onClick={() => { setAddSheetFromCalendar(true); setAddSheetDay(1); }}
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
                  <MapPin size={48} aria-hidden />
                  <p>Map</p>
                  <span className="trip-details__map-hint">Add a map provider (e.g. Leaflet) for pins</span>
                </div>
              </div>
              <div className="trip-details__map-controls">
                <button type="button" className="trip-details__map-ctrl"><ZoomIn size={14} aria-hidden /> Zoom into...</button>
                <button type="button" className="trip-details__map-ctrl"><Filter size={14} aria-hidden /> Filter days</button>
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

      {dateModalOpen && (
        <>
          <button
            type="button"
            className="trip-details__modal-backdrop"
            aria-label="Close"
            onClick={() => setDateModalOpen(false)}
          />
          <div className="trip-details__when-modal" role="dialog" aria-labelledby="when-modal-title" aria-modal="true">
            <div className="trip-details__when-modal-head">
              <div>
                <h2 id="when-modal-title" className="trip-details__when-modal-title">When</h2>
                <p className="trip-details__when-modal-subtitle">
                  {formatDateRangeLabel(modalDateStart, modalDateEnd || modalDateStart)}
                </p>
              </div>
              <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => setDateModalOpen(false)}>
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="trip-details__when-calendars">
              {[0, 1].map((i) => {
                const base = displayStart ? new Date(displayStart) : new Date();
                const d = new Date(base.getFullYear(), base.getMonth() + modalCalendarOffset + i, 1);
                const y = d.getFullYear();
                const m = d.getMonth();
                const cells = getCalendarCells(y, m, modalDateStart, modalDateEnd || modalDateStart);
                return (
                  <div key={i} className="trip-details__calendar">
                    <div className="trip-details__calendar-head">
                      <button type="button" className="trip-details__calendar-nav" aria-label="Previous month" onClick={() => setModalCalendarOffset((o) => o - 1)}>
                        <ChevronLeft size={18} aria-hidden />
                      </button>
                      <span className="trip-details__calendar-month">{MONTH_NAMES[m]} {y}</span>
                      <button type="button" className="trip-details__calendar-nav" aria-label="Next month" onClick={() => setModalCalendarOffset((o) => o + 1)}>
                        <ChevronRight size={18} aria-hidden />
                      </button>
                    </div>
                    <div className="trip-details__calendar-weekdays">
                      {DAY_LABELS.map((l) => (
                        <span key={l} className="trip-details__calendar-wd">{l}</span>
                      ))}
                    </div>
                    <div className="trip-details__calendar-grid">
                      {cells.map((cell) => (
                        <button
                          key={cell.dateStr}
                          type="button"
                          className={`trip-details__calendar-cell ${!cell.currentMonth ? 'trip-details__calendar-cell--other' : ''} ${cell.isStart || cell.isEnd ? 'trip-details__calendar-cell--range-end' : ''} ${cell.inRange ? 'trip-details__calendar-cell--range' : ''}`}
                          onClick={() => handleCalendarDateClick(cell.dateStr)}
                        >
                          {cell.day}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="trip-details__when-modal-actions">
              <button type="button" className="trip-details__modal-cancel" onClick={() => setDateModalOpen(false)}>Cancel</button>
              <button type="button" className="trip-details__modal-update" onClick={() => { applyDateRange(modalDateStart, modalDateEnd || modalDateStart); setDateModalOpen(false); }}>Update</button>
            </div>
          </div>
        </>
      )}

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

      {addSheetDay !== null && (
        <>
          <button
            type="button"
            className="trip-details__add-sheet-backdrop"
            aria-label="Close menu"
            onClick={() => { setAddSheetDay(null); setAddSheetFromCalendar(false); }}
          />
          <div className="trip-details__add-sheet" role="dialog" aria-labelledby="add-to-trip-title" aria-modal="true">
            <h2 id="add-to-trip-title" className="trip-details__add-sheet-title">Add to trip</h2>
            {!addSheetFromCalendar && <p className="trip-details__add-sheet-subtitle">Day {addSheetDay}</p>}
            <ul className="trip-details__add-sheet-list">
              {ADD_TO_TRIP_OPTIONS.map(({ id, label, description, Icon, color }) => (
                <li key={id}>
                  <button
                    type="button"
                    className="trip-details__add-sheet-option"
                    onClick={() => {
                      /* TODO: open flow for this category */
                      setAddSheetDay(null);
                      setAddSheetFromCalendar(false);
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
