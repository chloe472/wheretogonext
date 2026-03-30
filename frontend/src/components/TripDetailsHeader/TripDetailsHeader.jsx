import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  ChevronDown,
  Image,
  LayoutGrid,
  Share2,
} from 'lucide-react';

import { updateItinerary, deleteItinerary } from '../../api/itinerariesApi';
import { searchLocations } from '../../data/mockLocations';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

export default function TripDetailsHeader({
  trip,
  dateRange,
  locationUpdateKey,
  currency = 'USD',
  setServerItinerary,
  setFriendlyDialog,
  setBudgetModalOpen,
  setWhereQuery,
  setWhereSelectedLocations,
  setWhereModalOpen,
  setWhereSuggestionsOpen,
  setDateModalOpen,
  setModalCurrency,
  setCurrencyModalOpen,
  setNotesModalOpen,
  kanbanPath,
  shareOnClick,
}) {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [titleDisplay, setTitleDisplay] = useState('');

  const titleDropdownRef = useRef(null);
  const titleLastClickRef = useRef(0);

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
  const displayDatesLabel = displayStart && displayEnd
    ? (() => {
      const s = new Date(displayStart);
      const e = new Date(displayEnd);
      return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}`;
    })()
    : (trip?.dates ?? '');

  useEffect(() => {
    if (!trip) return;
    const d = getTripDaysFromTrip(trip);
    setTitleDisplay(trip.title ?? `${d.length} days to ${trip.destination}`);
  }, [tripId, trip, trip?.destination, locationUpdateKey]);

  useEffect(() => {
    if (!titleDropdownOpen) return undefined;

    function handleClickOutside(e) {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target)) {
        setTitleDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [titleDropdownOpen]);

  if (!trip) return null;

  const handleKanbanNavigate = () => {
    navigate(kanbanPath || `/trip/${tripId}`);
  };

  return (
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
                      if (updated) setServerItinerary?.(updated);
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
                if (e.key === 'Enter') e.target.blur();
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
                    setTitleDropdownOpen((open) => !open);
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
                <span className="trip-details__title-text">
                  {titleDisplay || `${days.length} days to ${trip.destination}`}
                </span>
                <ChevronDown size={16} aria-hidden />
              </button>

              {titleDropdownOpen && (
                <div className="trip-details__title-dropdown" role="menu">
                  <button
                    type="button"
                    className="trip-details__title-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setTitleEditing(true);
                      setTitleEditValue(titleDisplay);
                      setTitleDropdownOpen(false);
                    }}
                  >
                    Rename trip
                  </button>

                  <button
                    type="button"
                    className="trip-details__title-dropdown-item trip-details__title-dropdown-item--danger"
                    role="menuitem"
                    onClick={() => {
                      setTitleDropdownOpen(false);
                      setFriendlyDialog?.({
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
                            setFriendlyDialog?.({
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
        </div>
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
            className="trip-details__view-toggle-btn"
            onClick={handleKanbanNavigate}
            title="Kanban View"
            aria-label="Kanban View"
          >
            <LayoutGrid size={18} aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="trip-details__icon-btn"
          aria-label="Share"
          onClick={shareOnClick}
        >
          <Share2 size={18} aria-hidden />
        </button>
      </div>
    </header>
  );
}
