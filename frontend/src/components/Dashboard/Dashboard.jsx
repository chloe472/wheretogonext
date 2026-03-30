import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Plus,
  Clock,
  FileText,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import {
  fetchMyItineraries,
  fetchSharedWithMeItineraries,
  deleteItinerary,
  createItinerary,
  updateItinerary,
} from '../../api/itinerariesApi';
import PublishItineraryModal from '../PublishItineraryModal/PublishItineraryModal';
import FriendlyModal from '../FriendlyModal/FriendlyModal';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import {
  resolveTripCardCoverImage,
  getCoverImageForDestination,
  getFlagImageForDestination,
  formatTripCardDateRange,
} from '../../data/tripDestinationMeta';
import { resolveImageUrl } from '../../lib/imageFallback';
import './Dashboard.css';

/** Map Mongo itinerary doc → trip card row (same shape the mock list used). */
function mapItineraryToTripRow(raw) {
  const id = String(raw._id ?? raw.id ?? '');
  const destination = String(raw.destination || '').trim();
  const locations = String(raw.locations || '').trim();
  const image = resolveTripCardCoverImage(raw);
  const dateLabel = formatTripCardDateRange(raw.startDate, raw.endDate, raw.dates);
  const flagImage = getFlagImageForDestination(destination, locations);
  return {
    raw,
    id,
    title: raw.title || '',
    dateLabel,
    image,
    flagImage,
    status: raw.status || 'Planning',
    endDate: raw.endDate || '',
    startDate: raw.startDate || '',
    isSharedWithMe: Boolean(raw?.__sharedWithMe),
  };
}

function resolveDashboardTripImage(trip) {
  const primary = String(trip?.image || '').trim();
  const cover0 = String(trip?.raw?.coverImages?.[0] || '').trim();
  const destFallback = getCoverImageForDestination(trip?.raw?.destination, trip?.raw?.locations);
  if (primary) {
    const resolvedPrimary = resolveImageUrl(primary, trip?.title || 'Trip cover', 'trip');
    if (resolvedPrimary && !resolvedPrimary.startsWith('data:image/')) return resolvedPrimary;
  }
  if (cover0) {
    const resolvedCover = resolveImageUrl(cover0, trip?.title || 'Trip cover', 'trip');
    if (resolvedCover && !resolvedCover.startsWith('data:image/')) return resolvedCover;
  }
  return destFallback;
}

const TRIP_FILTERS = ['All', 'Upcoming', 'Past'];

const TRIP_STATUS_OPTIONS = [
  {
    value: 'Planning',
    class: 'trip-card__status--planning',
    optionClass: 'trip-card__status-option--planning',
    dotColor: '#fdba74',
  },
  {
    value: 'Upcoming',
    class: 'trip-card__status--upcoming',
    optionClass: 'trip-card__status-option--upcoming',
    dotColor: '#0d9488',
  },
  {
    value: 'Dreaming',
    class: 'trip-card__status--dreaming',
    optionClass: 'trip-card__status-option--dreaming',
    dotColor: '#7c3aed',
  },
];

function getStatusClass(status) {
  const opt = TRIP_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.class : 'trip-card__status--planning';
}

function parseTripDate(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return null;

  // Strict ISO date (YYYY-MM-DD).
  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    // Use midday local time to avoid TZ edge cases.
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  // Fallback for non-standard values (e.g., "Mar 3 - Mar 10, 2026").
  const rangeStart = s.split(' - ')[0]?.trim() || s;
  const parsed = new Date(rangeStart);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function resolveTripStartDate(trip) {
  if (!trip) return null;
  const candidates = [
    trip.startDate,
    trip.raw?.startDate,
    trip.raw?.dates,
    trip.dateLabel,
  ];
  for (const candidate of candidates) {
    const parsed = parseTripDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

function formatDepartureDistance(startDate, todayDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const deltaDays = Math.floor((startDate.getTime() - todayDate.getTime()) / msPerDay);

  if (deltaDays <= 0) return 'Departs today';
  if (deltaDays === 1) return 'Departs tomorrow';
  if (deltaDays < 30) return `Departure in ${deltaDays} days`;

  const months = Math.round(deltaDays / 30.44);
  if (months <= 1) return 'Departure in 1 month';
  return `Departure in ${months} months`;
}

function parseIsoDate(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatRelativeTime(date, now = new Date()) {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'just now';
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export default function Dashboard({ user, onLogout }) {
  const DIALOG_CLOSED = {
    open: false,
    title: '',
    message: '',
    showCancel: false,
    confirmText: 'OK',
    cancelText: 'Cancel',
    onConfirm: null,
  };
  const navigate = useNavigate();
  const [tripFilter, setTripFilter] = useState('All');
  const [openTripFilterDropdown, setOpenTripFilterDropdown] = useState(false);
  const tripFilterDropdownRef = useRef(null);
  const [tripStatuses, setTripStatuses] = useState({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState(null);
  const statusDropdownRef = useRef(null);
  const [openOwnerMenuId, setOpenOwnerMenuId] = useState(null);
  const ownerMenuRef = useRef(null);

  const [myTrips, setMyTrips] = useState([]);
  const [myTripsLoading, setMyTripsLoading] = useState(true);
  const [publishTarget, setPublishTarget] = useState(null);
  /** Raw itinerary doc while rename modal is open */
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameTitleDraft, setRenameTitleDraft] = useState('');
  const [dialog, setDialog] = useState(DIALOG_CLOSED);

  const tripRows = useMemo(() => myTrips.map(mapItineraryToTripRow), [myTrips]);

  useEffect(() => {
    setTripStatuses((prev) => {
      const next = { ...prev };
      tripRows.forEach((t) => {
        if (next[t.id] === undefined) next[t.id] = t.status;
      });
      return next;
    });
  }, [tripRows]);

  useEffect(() => {
    let cancelled = false;
    async function loadTrips() {
      setMyTripsLoading(true);
      try {
        const [mineRows, sharedRows] = await Promise.all([
          fetchMyItineraries(),
          fetchSharedWithMeItineraries(),
        ]);

        if (cancelled) return;

        const mine = Array.isArray(mineRows) ? mineRows : [];
        const shared = (Array.isArray(sharedRows) ? sharedRows : []).map((row) => ({
          ...row,
          __sharedWithMe: true,
        }));

        // Merge by id so "mine" wins if a trip appears in both sets.
        const mergedById = new Map();
        [...shared, ...mine].forEach((row) => {
          const key = String(row?._id ?? row?.id ?? '');
          if (key) mergedById.set(key, row);
        });

        const merged = Array.from(mergedById.values()).sort(
          (a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0),
        );

        setMyTrips(merged);
      } catch {
        if (!cancelled) setMyTrips([]);
      } finally {
        if (!cancelled) setMyTripsLoading(false);
      }
    }
    loadTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRenameFromModal = async () => {
    const title = renameTitleDraft.trim();
    if (!renameTarget || !title) return;
    try {
      await updateItinerary(String(renameTarget._id), { title });
      setMyTrips((prev) =>
        prev.map((doc) => (String(doc._id) === String(renameTarget._id) ? { ...doc, title } : doc)),
      );
      setRenameTarget(null);
      setRenameTitleDraft('');
      toast.success('Trip renamed');
    } catch (err) {
      setDialog({
        ...DIALOG_CLOSED,
        open: true,
        title: 'Could not rename trip',
        message: err?.message || 'Please try again.',
      });
    }
  };

  const handleItineraryOwnerMenu = (rawItinerary, action) => {
    if (action === 'share') {
      (async () => {
        const tripId = String(rawItinerary?._id ?? rawItinerary?.id ?? '').trim();
        if (!tripId) {
          toast.error('Trip link is unavailable for this item.');
          return;
        }
        const url = `${window.location.origin}/itineraries/${encodeURIComponent(tripId)}`;
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            ta.style.pointerEvents = 'none';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (!ok) throw new Error('Copy command failed');
          }
          toast.success('Link copied to clipboard!');
        } catch (e) {
          toast.error(e?.message || 'Could not copy link. Try copying from the address bar.');
        }
      })();
      return;
    }
    if (action === 'publish') {
      setPublishTarget(rawItinerary);
      return;
    }
    if (action === 'rename') {
      setRenameTarget(rawItinerary);
      setRenameTitleDraft(String(rawItinerary.title || '').trim() || 'Untitled trip');
      return;
    }
    if (action === 'duplicate') {
      (async () => {
        try {
          await createItinerary({
            title: `${rawItinerary.title || 'Itinerary'} (copy)`,
            overview: rawItinerary.overview || '',
            destination: rawItinerary.destination || '',
            locations: rawItinerary.locations || '',
            startDate: rawItinerary.startDate || '',
            endDate: rawItinerary.endDate || '',
            dates: rawItinerary.dates || '',
            days: rawItinerary.days || 1,
            categories: Array.isArray(rawItinerary.categories) ? rawItinerary.categories : [],
            coverImages: Array.isArray(rawItinerary.coverImages) ? rawItinerary.coverImages : [],
            places: Array.isArray(rawItinerary.places) ? rawItinerary.places : [],
            tripExpenseItems: Array.isArray(rawItinerary.tripExpenseItems) ? rawItinerary.tripExpenseItems : [],
            budget: rawItinerary.budget,
            budgetSpent: rawItinerary.budgetSpent,
            travelers: rawItinerary.travelers,
            status: rawItinerary.status,
            statusClass: rawItinerary.statusClass,
            image: rawItinerary.image,
            placesSaved: rawItinerary.placesSaved,
            published: false,
            visibility: 'private',
          });
          const [mineRows, sharedRows] = await Promise.all([
            fetchMyItineraries(),
            fetchSharedWithMeItineraries(),
          ]);
          const mine = Array.isArray(mineRows) ? mineRows : [];
          const shared = (Array.isArray(sharedRows) ? sharedRows : []).map((row) => ({
            ...row,
            __sharedWithMe: true,
          }));
          const mergedById = new Map();
          [...shared, ...mine].forEach((row) => {
            const key = String(row?._id ?? row?.id ?? '');
            if (key) mergedById.set(key, row);
          });
          setMyTrips(Array.from(mergedById.values()));
          toast.success('Trip duplicated successfully');
        } catch (e) {
          toast.error(e?.message || 'Could not duplicate trip. Please try again.');
        }
      })();
      return;
    }
    if (action === 'delete') {
      setDialog({
        ...DIALOG_CLOSED,
        open: true,
        title: 'Delete trip',
        message: 'Delete this trip? This cannot be undone.',
        showCancel: true,
        confirmText: 'Delete',
        onConfirm: async () => {
          try {
            await deleteItinerary(String(rawItinerary._id));
            setMyTrips((prev) => prev.filter((x) => String(x._id) !== String(rawItinerary._id)));
            setDialog(DIALOG_CLOSED);
            toast.success('Trip deleted');
          } catch (e) {
            setDialog({
              ...DIALOG_CLOSED,
              open: true,
              title: 'Delete failed',
              message: e?.message || 'Please try again.',
            });
          }
        },
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
        setOpenStatusDropdownId(null);
      }
      if (ownerMenuRef.current && !ownerMenuRef.current.contains(e.target)) {
        setOpenOwnerMenuId(null);
      }
      if (tripFilterDropdownRef.current && !tripFilterDropdownRef.current.contains(e.target)) {
        setOpenTripFilterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const setTripStatus = (tripId, status) => {
    setTripStatuses((prev) => ({ ...prev, [tripId]: status }));
    setOpenStatusDropdownId(null);
  };

  const todayStr = (() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  })();

  const filteredTrips = useMemo(() => {
    // Use midday local time to avoid TZ edge cases.
    const todayDate = new Date(`${todayStr}T12:00:00`);
    if (tripFilter === 'All') return tripRows;
    if (tripFilter === 'Upcoming') {
      return tripRows.filter((trip) => {
        const startDate = resolveTripStartDate(trip);
        return Boolean(startDate) && startDate >= todayDate;
      });
    }
    if (tripFilter === 'Past') {
      return tripRows.filter((trip) => {
        const startDate = resolveTripStartDate(trip);
        return Boolean(startDate) && startDate < todayDate;
      });
    }
    return tripRows;
  }, [tripRows, tripFilter, todayStr]);

  const comingUpTrips = useMemo(() => {
    const todayDate = new Date(`${todayStr}T00:00:00`);
    return tripRows
      .map((trip) => {
        const startDate = resolveTripStartDate(trip);
        if (!startDate || startDate < todayDate) return null;
        return {
          id: trip.id,
          name: trip.title || 'Untitled trip',
          day: startDate.getDate(),
          month: startDate.toLocaleDateString(undefined, { month: 'short' }).toUpperCase(),
          departureDateLabel: startDate.toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
          departureDistanceLabel: formatDepartureDistance(startDate, todayDate),
          ts: startDate.getTime(),
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.ts - b.ts)
      .slice(0, 3);
  }, [tripRows, todayStr]);

  const recentActivity = useMemo(() => {
    const now = new Date();
    return tripRows
      .map((trip) => {
        const createdAt = parseIsoDate(trip.raw?.createdAt);
        const updatedAt = parseIsoDate(trip.raw?.updatedAt);
        const activityDate = updatedAt || createdAt;
        if (!activityDate) return null;

        // Treat as "created" when updatedAt is missing or effectively same as createdAt.
        const createdMs = createdAt ? createdAt.getTime() : null;
        const updatedMs = updatedAt ? updatedAt.getTime() : null;
        const isCreated =
          updatedMs == null
          || createdMs == null
          || Math.abs(updatedMs - createdMs) < 60 * 1000;

        return {
          id: trip.id,
          ts: activityDate.getTime(),
          text: `${isCreated ? 'You created' : 'You updated'} ${trip.title || 'Untitled trip'}`,
          timeLabel: formatRelativeTime(activityDate, now),
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 5);
  }, [tripRows]);

  return (
    <div className="dashboard">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="dashboard" />

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

          <section className="dashboard__trips" id="my-trips">
            <h2 className="dashboard__section-title">Your Trips</h2>
            <p className="dashboard__trips-hint">
              Plan trips, publish to Explore, or share from the menu on each card.
            </p>
            <div className="dashboard__filters">
              <label htmlFor="trip-filter" className="dashboard__filter-label">Filter:</label>
              <div className="dashboard__filter-dropdown" ref={tripFilterDropdownRef}>
                <button
                  id="trip-filter"
                  type="button"
                  className={`dashboard__filter-btn ${openTripFilterDropdown ? 'dashboard__filter-btn--open' : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={openTripFilterDropdown}
                  onClick={() => setOpenTripFilterDropdown((o) => !o)}
                >
                  <span className="dashboard__filter-btn-text">{tripFilter}</span>
                  <ChevronDown size={14} className="dashboard__filter-chevron" aria-hidden />
                </button>
                {openTripFilterDropdown && (
                  <div className="dashboard__filter-menu" role="listbox" aria-label="Trip filter">
                    {TRIP_FILTERS.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        role="option"
                        aria-selected={tripFilter === filter}
                        className={`dashboard__filter-option ${tripFilter === filter ? 'dashboard__filter-option--active' : ''}`}
                        onClick={() => {
                          setTripFilter(filter);
                          setOpenTripFilterDropdown(false);
                        }}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {myTripsLoading && <p className="dashboard__trips-status">Loading your trips…</p>}
            {!myTripsLoading && myTrips.length === 0 && (
              <p className="dashboard__trips-empty">No trips yet. Start with &quot;New Trip&quot; above.</p>
            )}
            {!myTripsLoading && myTrips.length > 0 && filteredTrips.length === 0 && (
              <p className="dashboard__trips-empty">No trips match this filter.</p>
            )}
            <ul className="dashboard__trip-list">
              {!myTripsLoading && filteredTrips.map((trip) => (
                <li
                  key={trip.id}
                  className={`trip-card${openOwnerMenuId === trip.id || openStatusDropdownId === trip.id ? ' trip-card--active' : ''}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/trip/${trip.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/trip/${trip.id}`);
                    }
                  }}
                >
                  <div className="trip-card__image-wrap">
                    <div className="trip-card__image-crop">
                      <img
                        src={resolveDashboardTripImage(trip)}
                        alt=""
                        className="trip-card__image"
                      />
                    </div>
                    {trip.flagImage?.url ? (
                      <img
                        src={trip.flagImage.url}
                        alt={`${trip.flagImage.countryName} flag`}
                        className="trip-card__flag"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : null}
                    <div
                      className="trip-card__owner-menu"
                      ref={openOwnerMenuId === trip.id ? ownerMenuRef : null}
                    >
                      <button
                        type="button"
                        className="trip-card__owner-more"
                        aria-label="Trip options"
                        aria-expanded={openOwnerMenuId === trip.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenOwnerMenuId((id) => (id === trip.id ? null : trip.id));
                        }}
                      >
                        <MoreVertical size={18} aria-hidden />
                      </button>
                      {openOwnerMenuId === trip.id && (
                        <div className="trip-card__owner-dropdown" role="menu">
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOwnerMenuId(null);
                              handleItineraryOwnerMenu(trip.raw, 'share');
                            }}
                          >
                            Share link
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOwnerMenuId(null);
                              handleItineraryOwnerMenu(trip.raw, 'publish');
                            }}
                          >
                            Publish to Explore
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOwnerMenuId(null);
                              handleItineraryOwnerMenu(trip.raw, 'duplicate');
                            }}
                          >
                            Duplicate
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOwnerMenuId(null);
                              handleItineraryOwnerMenu(trip.raw, 'rename');
                            }}
                          >
                            Rename
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option trip-card__owner-option--danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenOwnerMenuId(null);
                              handleItineraryOwnerMenu(trip.raw, 'delete');
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="trip-card__status-wrap" ref={openStatusDropdownId === trip.id ? statusDropdownRef : null}>
                      <button
                        type="button"
                        className={`trip-card__status-btn ${getStatusClass(tripStatuses[trip.id] ?? trip.status)}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenStatusDropdownId((id) => (id === trip.id ? null : trip.id));
                        }}
                        aria-expanded={openStatusDropdownId === trip.id}
                        aria-haspopup="listbox"
                        aria-label={`Trip status: ${trip.title}, ${tripStatuses[trip.id] ?? trip.status}`}
                      >
                        <span className="trip-card__status-btn-text">{tripStatuses[trip.id] ?? trip.status}</span>
                        <ChevronDown size={14} className="trip-card__status-chevron" aria-hidden />
                      </button>
                      {openStatusDropdownId === trip.id && (
                        <div className="trip-card__status-dropdown" role="listbox">
                          {TRIP_STATUS_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              role="option"
                              aria-selected={(tripStatuses[trip.id] ?? trip.status) === opt.value}
                              className={`trip-card__status-option ${opt.optionClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setTripStatus(trip.id, opt.value);
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
                  <div className="trip-card__body">
                    <h3 className="trip-card__title">{trip.title}</h3>
                    {trip.isSharedWithMe ? (
                      <span className="trip-card__shared-badge">Shared with me</span>
                    ) : null}
                    <p className="trip-card__dates">{trip.dateLabel}</p>
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
            {comingUpTrips.length === 0 ? (
              <p className="dashboard__trips-empty">No upcoming trips yet.</p>
            ) : (
              <ul className="sidebar-block__list">
                {comingUpTrips.map((item) => (
                  <li key={item.id} className="coming-up-item">
                    <div className="coming-up-item__date">
                      <span className="coming-up-item__day">{item.day}</span>
                      <span className="coming-up-item__month">{item.month}</span>
                    </div>
                    <div className="coming-up-item__info">
                      <span className="coming-up-item__name">{item.name}</span>
                      <span className="coming-up-item__label">
                        {item.departureDateLabel} · {item.departureDistanceLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section className="sidebar-block">
            <h3 className="sidebar-block__title">
              <FileText size={18} aria-hidden />
              Recent Activity
            </h3>
            {recentActivity.length === 0 ? (
              <p className="dashboard__trips-empty">No recent activity yet.</p>
            ) : (
              <ul className="sidebar-block__list">
                {recentActivity.map((item) => (
                  <li key={item.id} className="activity-item">
                    <span className="activity-item__text">{item.text}</span>
                    <span className="activity-item__time">{item.timeLabel}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>

      {renameTarget && (
        <>
          <button
            type="button"
            className="dashboard__rename-backdrop"
            aria-label="Close rename dialog"
            onClick={() => {
              setRenameTarget(null);
              setRenameTitleDraft('');
            }}
          />
          <div
            className="dashboard__rename-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dashboard-rename-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="dashboard-rename-title" className="dashboard__rename-title">
              Rename trip
            </h2>
            <label htmlFor="dashboard-rename-input" className="dashboard__rename-label">
              Trip name
            </label>
            <input
              id="dashboard-rename-input"
              type="text"
              className="dashboard__rename-input"
              value={renameTitleDraft}
              onChange={(e) => setRenameTitleDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  applyRenameFromModal();
                }
                if (e.key === 'Escape') {
                  setRenameTarget(null);
                  setRenameTitleDraft('');
                }
              }}
              autoFocus
            />
            <div className="dashboard__rename-actions">
              <button
                type="button"
                className="dashboard__rename-cancel"
                onClick={() => {
                  setRenameTarget(null);
                  setRenameTitleDraft('');
                }}
              >
                Cancel
              </button>
              <button type="button" className="dashboard__rename-save" onClick={() => applyRenameFromModal()}>
                Save
              </button>
            </div>
          </div>
        </>
      )}

      <PublishItineraryModal
        open={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        itinerary={publishTarget}
        onPublished={async () => {
          try {
            const [mineRows, sharedRows] = await Promise.all([
              fetchMyItineraries(),
              fetchSharedWithMeItineraries(),
            ]);
            const mine = Array.isArray(mineRows) ? mineRows : [];
            const shared = (Array.isArray(sharedRows) ? sharedRows : []).map((row) => ({
              ...row,
              __sharedWithMe: true,
            }));
            const mergedById = new Map();
            [...shared, ...mine].forEach((row) => {
              const key = String(row?._id ?? row?.id ?? '');
              if (key) mergedById.set(key, row);
            });
            setMyTrips(Array.from(mergedById.values()));
          } catch {
            /* ignore */
          }
        }}
      />
      <FriendlyModal
        open={dialog.open}
        title={dialog.title}
        message={dialog.message}
        showCancel={dialog.showCancel}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onClose={() => setDialog(DIALOG_CLOSED)}
        onConfirm={async () => {
          if (typeof dialog.onConfirm === 'function') {
            await dialog.onConfirm();
            return;
          }
          setDialog(DIALOG_CLOSED);
        }}
      />
    </div>
  );
}
