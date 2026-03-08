import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Bell,
  User,
  Calendar,
  MapPin,
  Bookmark,
  Banknote,
  Users,
  Plus,
  Clock,
  FileText,
  ChevronRight,
  ChevronDown,
  Search,
} from 'lucide-react';
import { fetchTrips, patchTrip } from '../api/tripsApi';
import { searchLocations } from '../data/mockLocations';
import './Dashboard.css';

const MOCK_COMING_UP = [
  { id: '1', name: 'Summer Europe', day: 15, month: 'JUN', label: 'Departure in 4 months' },
  { id: '3', name: 'Bali Wellness', day: 10, month: 'AUG', label: 'Departure in 6 months' },
];

const MOCK_ACTIVITY = [
  { id: '1', text: 'Sarah added 3 restaurants to Summer Europe', time: '2 hours ago' },
  { id: '2', text: 'Flight confirmation received for Tokyo trip', time: '5 hours ago' },
  { id: '3', text: 'Mike updated the budget for Bali Retreat', time: '1 day ago' },
  { id: '4', text: 'New template created: Beach Essentials', time: '2 days ago' },
];

const TRIP_FILTERS = ['All', 'Upcoming', 'Past'];

const TRIP_STATUS_OPTIONS = [
  { value: 'Planning', class: 'trip-card__status--planning', dotColor: '#d4c4a8' },
  { value: 'Upcoming', class: 'trip-card__status--upcoming', dotColor: '#a89f91' },
  { value: 'Dreaming', class: 'trip-card__status--dreaming', dotColor: '#c4b8a8' },
];

function getStatusClass(status) {
  const opt = TRIP_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.class : 'trip-card__status--planning';
}

export default function Dashboard({ user, onLogout }) {
  const navigate = useNavigate();
  const [tripFilter, setTripFilter] = useState('All');
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [tripsError, setTripsError] = useState('');
  const [trips, setTrips] = useState([]);
  const searchRef = useRef(null);
  const searchSuggestions = searchLocations(searchQuery);
  const [tripStatuses, setTripStatuses] = useState(() => {
    const map = {};
    return map;
  });
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setTripsLoading(true);
      setTripsError('');
      try {
        const data = await fetchTrips();
        if (cancelled) return;
        const list = Array.isArray(data?.trips) ? data.trips : [];
        setTrips(list);
        setTripStatuses(() => {
          const map = {};
          list.forEach((t) => { map[t._id || t.id] = t.status; });
          return map;
        });
      } catch (err) {
        if (!cancelled) {
          setTripsError(err?.message || 'Failed to load trips');
          setTrips([]);
        }
      } finally {
        if (!cancelled) setTripsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const setTripStatus = (tripId, status) => {
    setTripStatuses((prev) => ({ ...prev, [tripId]: status }));
    setOpenStatusDropdownId(null);
    patchTrip(tripId, { status }).catch(() => {});
  };

  const todayStr = (() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  })();

  const filteredTrips = (() => {
    if (tripFilter === 'All') return trips;
    if (tripFilter === 'Upcoming') {
      return trips.filter((t) => t.endDate && t.endDate >= todayStr);
    }
    if (tripFilter === 'Past') {
      return trips.filter((t) => t.endDate && t.endDate < todayStr);
    }
    return trips;
  })();

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo" aria-hidden>
            @
          </div>
          <div>
            <span className="dashboard__app-name">where to go next</span>
            <span className="dashboard__tagline">Your travel companion</span>
          </div>
        </div>
        <div className="dashboard__search-wrap" ref={searchRef}>
          <form
            className="dashboard__search-form"
            onSubmit={(e) => {
              e.preventDefault();
              const term = searchQuery.trim();
              if (term) {
                navigate(`/search?q=${encodeURIComponent(term)}`);
                setSearchOpen(false);
              }
            }}
          >
            <Search size={18} className="dashboard__search-icon" aria-hidden />
            <input
              type="text"
              className="dashboard__search-input"
              placeholder="Search for destination / itineraries"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              aria-label="Search destinations or itineraries"
              aria-expanded={searchOpen && searchSuggestions.length > 0}
              aria-autocomplete="list"
            />
          </form>
          {searchOpen && searchSuggestions.length > 0 && (
            <ul className="dashboard__search-suggestions" role="listbox">
              {searchSuggestions.slice(0, 8).map((loc) => (
                <li key={loc.id}>
                  <button
                    type="button"
                    className="dashboard__search-suggestion"
                    role="option"
                    onClick={() => {
                      const term = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
                      navigate(`/search?q=${encodeURIComponent(term)}`);
                      setSearchQuery(term);
                      setSearchOpen(false);
                    }}
                  >
                    {loc.name}
                    {loc.country && <span className="dashboard__search-suggestion-meta">{loc.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <nav className="dashboard__nav">
          <a href="#my-trips" className="dashboard__nav-link">My Trips</a>
          <Link to="/search" className="dashboard__nav-link">Explore</Link>
          <button type="button" className="dashboard__icon-btn" aria-label="Notifications">
            <Bell size={20} aria-hidden />
          </button>
          <div className="dashboard__profile-wrap">
            <button
              type="button"
              className="dashboard__icon-btn dashboard__icon-btn--avatar"
              aria-label="Profile"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((o) => !o)}
            >
              <User size={20} aria-hidden />
            </button>
            {profileOpen && (
              <>
                <button
                  type="button"
                  className="dashboard__profile-backdrop"
                  aria-label="Close menu"
                  onClick={() => setProfileOpen(false)}
                />
                <div className="dashboard__profile-menu">
                  {user?.name && <span className="dashboard__profile-name">{user.name}</span>}
                  <Link to="/profile" className="dashboard__profile-link" onClick={() => setProfileOpen(false)}>
                    Profile
                  </Link>
                  <button type="button" className="dashboard__profile-logout" onClick={() => { setProfileOpen(false); onLogout?.(); }}>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="dashboard__body">
        <main className="dashboard__main">
          <section className="dashboard__welcome">
            <h1 className="dashboard__title">
              your{' '}
              <span className="dashboard__title-highlight">
                adventures
              </span>{' '}
              await
            </h1>
            <p className="dashboard__greeting">
              Welcome back! Let&apos;s continue planning your perfect trips.
            </p>
            <Link to="/new-trip" className="dashboard__new-trip">
              <Plus size={20} aria-hidden />
              New Trip
            </Link>
          </section>

          <section className="dashboard__trips">
            <h2 className="dashboard__section-title">Your Trips</h2>
            <div className="dashboard__filters">
              {TRIP_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`dashboard__filter ${tripFilter === filter ? 'dashboard__filter--active' : ''}`}
                  onClick={() => setTripFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <ul className="dashboard__trip-list">
              {tripsLoading && (
                <li style={{ padding: '1rem', color: 'var(--wtg-text-muted)' }}>Loading your trips…</li>
              )}
              {tripsError && !tripsLoading && (
                <li style={{ padding: '1rem', color: 'var(--wtg-text-muted)' }}>{tripsError}</li>
              )}
              {filteredTrips.map((trip) => (
                <li
                  key={trip._id || trip.id}
                  className="trip-card"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/trip/${trip._id || trip.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/trip/${trip._id || trip.id}`);
                    }
                  }}
                >
                  <div className="trip-card__image-wrap">
                    <img
                      src={trip.image}
                      alt=""
                      className="trip-card__image"
                    />
                    <div className="trip-card__status-wrap" ref={openStatusDropdownId === (trip._id || trip.id) ? statusDropdownRef : null}>
                      <button
                        type="button"
                        className={`trip-card__status-btn ${getStatusClass(tripStatuses[trip._id || trip.id] ?? trip.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const id = trip._id || trip.id;
                          setOpenStatusDropdownId((open) => (open === id ? null : id));
                        }}
                        aria-expanded={openStatusDropdownId === (trip._id || trip.id)}
                        aria-haspopup="listbox"
                        aria-label={`Trip status: ${trip.title}, ${tripStatuses[trip._id || trip.id] ?? trip.status}`}
                      >
                        <span className="trip-card__status-btn-text">{tripStatuses[trip._id || trip.id] ?? trip.status}</span>
                        <ChevronDown size={14} className="trip-card__status-chevron" aria-hidden />
                      </button>
                      {openStatusDropdownId === (trip._id || trip.id) && (
                        <div className="trip-card__status-dropdown" role="listbox">
                          {TRIP_STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={(tripStatuses[trip._id || trip.id] ?? trip.status) === opt.value}
                              className="trip-card__status-option"
                              onClick={(e) => {
                                e.stopPropagation();
                                setTripStatus(trip._id || trip.id, opt.value);
                              }}
                            >
                              <span className="trip-card__status-dot" style={{ backgroundColor: opt.dotColor }} aria-hidden />
                              <span className="trip-card__status-option-text">{opt.value}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="trip-card__content">
                    <h3 className="trip-card__title">{trip.title}</h3>
                    <p className="trip-card__meta">
                      <Calendar size={16} className="trip-card__meta-icon" aria-hidden />
                      {trip.dates}
                    </p>
                    <p className="trip-card__meta">
                      <MapPin size={16} className="trip-card__meta-icon" aria-hidden />
                      {trip.locations}
                    </p>
                    <div className="trip-card__stats">
                      <span className="trip-card__stat">
                        <Bookmark size={16} aria-hidden />
                        <strong>{trip.placesSaved}</strong> Places Saved
                      </span>
                      <span className="trip-card__stat">
                        <Banknote size={16} aria-hidden />
                        <strong>{trip.budget}</strong> Budget
                      </span>
                      <span className="trip-card__stat">
                        <Users size={16} aria-hidden />
                        <strong>{trip.travelers}</strong> Travelers
                      </span>
                    </div>
                    <Link
                      to={`/trip/${trip._id || trip.id}`}
                      className="trip-card__link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View Trip Details <ChevronRight size={16} aria-hidden />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <aside className="dashboard__sidebar">
          <section className="sidebar-block">
            <h3 className="sidebar-block__title">
              <Clock size={18} aria-hidden />
              Coming Up
            </h3>
            <ul className="sidebar-block__list">
              {MOCK_COMING_UP.map((item) => (
                <li key={item.id} className="coming-up-item">
                  <div className="coming-up-item__date">
                    <span className="coming-up-item__day">{item.day}</span>
                    <span className="coming-up-item__month">{item.month}</span>
                  </div>
                  <div className="coming-up-item__info">
                    <span className="coming-up-item__name">{item.name}</span>
                    <span className="coming-up-item__label">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="sidebar-block">
            <h3 className="sidebar-block__title">
              <FileText size={18} aria-hidden />
              Recent Activity
            </h3>
            <ul className="sidebar-block__list">
              {MOCK_ACTIVITY.map((item) => (
                <li key={item.id} className="activity-item">
                  <span className="activity-item__text">{item.text}</span>
                  <span className="activity-item__time">{item.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
