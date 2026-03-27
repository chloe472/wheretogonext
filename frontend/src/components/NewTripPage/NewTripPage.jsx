import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, Users } from 'lucide-react';
import { searchLocations } from '../../data/mockLocations';
import { createItinerary } from '../../api/itinerariesApi';
import { getCoverImageForDestination } from '../../data/tripDestinationMeta';
import DateRangePickerModal from '../DateRangePickerModal/DateRangePickerModal';
import './NewTripPage.css';

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatTripDates(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

const TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

function resolveTypedLocation(query) {
  const value = String(query || '').trim();
  if (!value) return null;
  const exactMatch = searchLocations(value).find((loc) => {
    const full = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
    return (
      loc.name.toLowerCase() === value.toLowerCase()
      || full.toLowerCase() === value.toLowerCase()
    );
  });
  if (exactMatch) return exactMatch;

  const [name, ...rest] = value.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    id: `custom-location-${Date.now()}`,
    name: name || value,
    country: rest.join(', ') || undefined,
    type: 'City',
  };
}

export default function NewTripPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [whereQuery, setWhereQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [whereOpen, setWhereOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [datesError, setDatesError] = useState('');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const whereRef = useRef(null);

  const suggestions = searchLocations(whereQuery);

  useEffect(() => {
    function handleClickOutside(e) {
      if (whereRef.current && !whereRef.current.contains(e.target)) {
        setWhereOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (loc) => {
    setSelectedLocation(loc);
    setWhereQuery(loc.name);
    setWhereOpen(false);
  };

  const handleWhereChange = (e) => {
    setWhereQuery(e.target.value);
    setSelectedLocation(null);
    setWhereOpen(true);
  };

  const handleWhereFocus = () => setWhereOpen(true);

  const handleStartPlanning = async (e) => {
    e.preventDefault();
    setDatesError('');
    setSubmitError('');
    const resolvedLocation = selectedLocation ?? resolveTypedLocation(whereQuery);
    if (!resolvedLocation) return;
    if (!startDate || !endDate) {
      setDatesError('Please select start and end dates for your trip.');
      return;
    }
    if (startDate > endDate) {
      setDatesError('End date must be on or after start date.');
      return;
    }
    const start = startDate;
    const end = endDate;
    const title = resolvedLocation.country
      ? `${resolvedLocation.name}, ${resolvedLocation.country}`
      : resolvedLocation.name;
    const locations = resolvedLocation.country
      ? `${resolvedLocation.name}, ${resolvedLocation.country}`
      : resolvedLocation.name;
    const coverUrl = getCoverImageForDestination(resolvedLocation.name, locations);
    const payload = {
      title: `Trip to ${title}`,
      overview: '',
      destination: resolvedLocation.name,
      dates: formatTripDates(start, end),
      startDate: start,
      endDate: end,
      locations,
      placesSaved: 0,
      budget: '$0',
      budgetSpent: 0,
      travelers: 1 + (invitedEmails?.length || 0),
      status: 'Planning',
      statusClass: 'trip-card__status--planning',
      image: coverUrl,
      coverImages: [coverUrl],
      published: false,
      visibility: 'private',
    };
    setSubmitting(true);
    try {
      const newItinerary = await createItinerary(payload);
      const id = newItinerary?._id ?? newItinerary?.id;
      if (!id) {
        throw new Error('Server did not return an itinerary id.');
      }
      navigate(`/trip/${id}`);
    } catch (err) {
      setSubmitError(err?.message || 'Could not create trip. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new-trip">
      <header className="new-trip__header">
        <Link to="/" className="new-trip__back" aria-label="Back to My Trips">
          ← My Trips
        </Link>
      </header>

      <main className="new-trip__main">
        <h1 className="new-trip__title">Plan a new trip</h1>

        <form className="new-trip__form" onSubmit={handleStartPlanning}>
          <div className="new-trip__field" ref={whereRef}>
            <label htmlFor="where" className="new-trip__label">Where to?</label>
            <input
              id="where"
              type="text"
              className="new-trip__input new-trip__input--where"
              placeholder="e.g. Paris, Hawaii, Japan"
              value={whereQuery}
              onChange={handleWhereChange}
              onFocus={handleWhereFocus}
              autoComplete="off"
              aria-expanded={whereOpen}
              aria-controls="where-listbox"
              aria-autocomplete="list"
              role="combobox"
              aria-label="Destination"
            />
            {whereOpen && (
              <ul
                id="where-listbox"
                className="new-trip__suggestions"
                role="listbox"
              >
                {suggestions.length === 0 ? (
                  <li className="new-trip__suggestion new-trip__suggestion--empty" role="option">
                    No results
                  </li>
                ) : (
                  suggestions.map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        className="new-trip__suggestion"
                        role="option"
                        aria-selected={selectedLocation?.id === loc.id}
                        onClick={() => handleSelectLocation(loc)}
                      >
                        <span className="new-trip__suggestion-name">{loc.name}</span>
                        {loc.country && (
                          <span className="new-trip__suggestion-meta">{loc.country}</span>
                        )}
                        <span className={`new-trip__type-badge new-trip__type-badge--${loc.type.toLowerCase()}`}>
                          {TYPE_LABELS[loc.type] || loc.type}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>

          <div className="new-trip__field">
            <label className="new-trip__label">Dates</label>
            <button
              type="button"
              className={`new-trip__date-btn ${datesError ? 'new-trip__date-btn--error' : ''}`}
              onClick={() => setDateModalOpen(true)}
              aria-label="Select trip dates"
            >
              <CalendarIcon size={18} className="new-trip__date-icon" aria-hidden />
              {startDate && endDate ? formatTripDates(startDate, endDate) : 'Select start and end date'}
            </button>
            {datesError && <p className="new-trip__error" role="alert">{datesError}</p>}
            <DateRangePickerModal
              open={dateModalOpen}
              start={startDate || null}
              end={endDate || null}
              title="When"
              onApply={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                setDatesError('');
              }}
              onClose={() => setDateModalOpen(false)}
            />
          </div>

          <div className="new-trip__invite-section">
            <div className="new-trip__invite-row">
              <button
                type="button"
                className="new-trip__invite"
                onClick={() => setInviteOpen((o) => !o)}
                aria-expanded={inviteOpen}
              >
                + Invite tripmates
              </button>
              <div className="new-trip__friends-wrap">
                <button
                  type="button"
                  className="new-trip__friends-btn"
                  onClick={() => setFriendsOpen((o) => !o)}
                  aria-expanded={friendsOpen}
                  aria-haspopup="listbox"
                >
                  <Users size={18} aria-hidden />
                  Friends
                  <ChevronDown size={16} aria-hidden />
                </button>
                {friendsOpen && (
                  <div className="new-trip__friends-dropdown" role="listbox">
                    <p className="new-trip__friends-hint">No friends added yet. Use &quot;+ Invite tripmates&quot; to add by email.</p>
                  </div>
                )}
              </div>
            </div>
            {inviteOpen && (
              <div className="new-trip__invite-panel">
                <label htmlFor="invite-email" className="new-trip__label">Invite by email</label>
                <div className="new-trip__invite-input-row">
                  <input
                    id="invite-email"
                    type="email"
                    className="new-trip__input"
                    placeholder="e.g. friend@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const email = inviteEmail.trim().toLowerCase();
                        if (email && !invitedEmails.includes(email)) {
                          setInvitedEmails((prev) => [...prev, email]);
                          setInviteEmail('');
                        }
                      }
                    }}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    className="new-trip__invite-add-btn"
                    onClick={() => {
                      const email = inviteEmail.trim().toLowerCase();
                      if (email && !invitedEmails.includes(email)) {
                        setInvitedEmails((prev) => [...prev, email]);
                        setInviteEmail('');
                      }
                    }}
                  >
                    Add
                  </button>
                </div>
                {invitedEmails.length > 0 && (
                  <ul className="new-trip__invited-list">
                    {invitedEmails.map((email) => (
                      <li key={email} className="new-trip__invited-item">
                        <span className="new-trip__invited-email">{email}</span>
                        <button
                          type="button"
                          className="new-trip__invited-remove"
                          onClick={() => setInvitedEmails((prev) => prev.filter((e) => e !== email))}
                          aria-label={`Remove ${email}`}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {submitError && (
            <p className="new-trip__error" role="alert">{submitError}</p>
          )}
          <button type="submit" className="new-trip__submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Start planning'}
          </button>
        </form>
      </main>
    </div>
  );
}
