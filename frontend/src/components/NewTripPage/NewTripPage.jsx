import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, Users } from 'lucide-react';
import { createItinerary, fetchItineraryById, fetchMyItineraries } from '../../api/itinerariesApi';
import { fetchCitySuggestions } from '../../api/locationsApi';
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

function isCityLocation(loc) {
  return String(loc?.type || '').toLowerCase() === 'city';
}

function resolveTypedLocation(query) {
  const value = String(query || '').trim();
  if (!value) return null;

  const [name, ...rest] = value.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    id: `custom-location-${Date.now()}`,
    name: name || value,
    country: rest.join(', ') || undefined,
    type: 'City',
  };
}

function getLocationLabel(loc) {
  return loc?.country ? `${loc.name}, ${loc.country}` : String(loc?.name || '').trim();
}

function getLocationKey(loc) {
  return getLocationLabel(loc).toLowerCase();
}

function getTripDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${String(startDate).slice(0, 10)}T12:00:00`);
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

function buildDefaultCityDayRanges(locations, totalDays) {
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
    ranges[getLocationKey(loc)] = { startDay, endDay };
    cursor = endDay + 1;
  });

  return ranges;
}

function extractItineraryId(itinerary) {
  if (!itinerary) return '';
  const raw = itinerary._id ?? itinerary.id ?? itinerary?.itinerary?._id ?? itinerary?.itinerary?.id;
  if (raw == null) return '';
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    if (raw.$oid) return String(raw.$oid);
    if (typeof raw.toString === 'function') {
      const value = raw.toString();
      if (value && value !== '[object Object]') return value;
    }
  }
  return '';
}

async function waitForItineraryReadable(itineraryId, attempts = 12, delayMs = 400) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const doc = await fetchItineraryById(itineraryId);
      if (doc) return doc;
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      const isTransient = message.includes('404') || message.includes('not found');
      if (!isTransient && attempt >= 2) {
        break;
      }
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return null;
}

export default function NewTripPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [whereQuery, setWhereQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [cityDayRanges, setCityDayRanges] = useState({});
  const [cityDayDrafts, setCityDayDrafts] = useState({});
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

  const totalTripDays = getTripDayCount(startDate, endDate);
  const defaultCityDayRanges = buildDefaultCityDayRanges(selectedLocations, totalTripDays || 1);

  useEffect(() => {
    const trimmed = whereQuery.trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setSuggestionsLoading(false);
      return () => {};
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const next = await fetchCitySuggestions(trimmed, { signal: controller.signal, limit: 12 });
        setLocationSuggestions(Array.isArray(next) ? next : []);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setLocationSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [whereQuery]);

  useEffect(() => {
    setCityDayRanges((prev) => {
      const next = {};
      selectedLocations.forEach((loc) => {
        const key = getLocationKey(loc);
        next[key] = prev[key] || defaultCityDayRanges[key] || { startDay: 1, endDay: Math.max(1, totalTripDays || 1) };
      });
      return next;
    });
  }, [selectedLocations, defaultCityDayRanges, totalTripDays]);

  useEffect(() => {
    setCityDayDrafts((prev) => {
      const validKeys = new Set(selectedLocations.map((loc) => getLocationKey(loc)));
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [locKey] = key.split('::');
        if (validKeys.has(locKey)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [selectedLocations]);

  const addLocation = (loc) => {
    if (!loc) return;
    setSelectedLocations((prev) => {
      const nextKey = getLocationKey(loc);
      if (prev.some((item) => getLocationKey(item) === nextKey)) return prev;
      return [...prev, loc];
    });
    setWhereQuery('');
    setWhereOpen(false);
  };

  const suggestions = locationSuggestions.filter(
    (loc) => isCityLocation(loc)
      && !selectedLocations.some((selected) => getLocationKey(selected) === getLocationKey(loc)),
  );

  const updateCityRange = (loc, field, value) => {
    const key = getLocationKey(loc);
    const maxDay = Math.max(1, totalTripDays || 1);
    const n = Number.parseInt(String(value), 10);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(maxDay, Math.round(n))) : 1;
    setCityDayRanges((prev) => {
      const current = prev[key] || defaultCityDayRanges[key] || { startDay: 1, endDay: maxDay };
      const next = { ...current, [field]: safe };
      if (next.startDay > next.endDay) {
        if (field === 'startDay') next.endDay = next.startDay;
        if (field === 'endDay') next.startDay = next.endDay;
      }
      return { ...prev, [key]: next };
    });
  };

  const getCityDayDraftKey = (loc, field) => `${getLocationKey(loc)}::${field}`;

  const handleCityRangeInputChange = (loc, field, value) => {
    const raw = String(value);
    const sanitized = raw.replace(/[^0-9]/g, '');
    const draftKey = getCityDayDraftKey(loc, field);
    setCityDayDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
  };

  const commitCityRangeInput = (loc, field) => {
    const key = getLocationKey(loc);
    const draftKey = getCityDayDraftKey(loc, field);
    const raw = cityDayDrafts[draftKey];

    if (raw === undefined) return;

    if (!raw) {
      setCityDayDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      return;
    }

    updateCityRange(loc, field, raw);
    setCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (whereRef.current && !whereRef.current.contains(e.target)) {
        setWhereOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectLocation = (loc) => addLocation(loc);

  const handleWhereChange = (e) => {
    setWhereQuery(e.target.value);
    setWhereOpen(true);
  };

  const handleWhereFocus = () => setWhereOpen(true);

  const commitPendingLocation = () => {
    const resolved = resolveTypedLocation(whereQuery);
    if (!resolved) return null;
    addLocation(resolved);
    setSubmitError('');
    return resolved;
  };

  const handleStartPlanning = async (e) => {
    e.preventDefault();
    setDatesError('');
    setSubmitError('');
    const pendingLocation = resolveTypedLocation(whereQuery);
    const allLocations = [...selectedLocations];
    if (pendingLocation) {
      const pendingKey = getLocationKey(pendingLocation);
      if (!allLocations.some((loc) => getLocationKey(loc) === pendingKey)) {
        allLocations.push(pendingLocation);
      }
    }
    if (allLocations.length === 0) {
      setSubmitError('Please add at least one destination.');
      return;
    }
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
    const dayCount = getTripDayCount(start, end);
    if (dayCount <= 0) {
      setDatesError('Please select a valid date range.');
      return;
    }

    const fallbackRanges = buildDefaultCityDayRanges(allLocations, dayCount);
    let citySegments = [];
    if (allLocations.length > 1) {
      citySegments = allLocations.map((loc) => {
        const key = getLocationKey(loc);
        const selected = cityDayRanges[key] || fallbackRanges[key] || { startDay: 1, endDay: dayCount };
        const startDraft = cityDayDrafts[getCityDayDraftKey(loc, 'startDay')];
        const endDraft = cityDayDrafts[getCityDayDraftKey(loc, 'endDay')];
        const startSource = startDraft !== undefined && startDraft !== '' ? startDraft : selected.startDay;
        const endSource = endDraft !== undefined && endDraft !== '' ? endDraft : selected.endDay;
        const startDay = Math.max(1, Math.min(dayCount, Number(startSource) || 1));
        const endDay = Math.max(1, Math.min(dayCount, Number(endSource) || dayCount));
        return {
          city: String(loc.name || '').trim(),
          locationLabel: getLocationLabel(loc),
          startDay: Math.min(startDay, endDay),
          endDay: Math.max(startDay, endDay),
        };
      }).sort((a, b) => a.startDay - b.startDay);

      const firstStart = citySegments[0]?.startDay;
      const lastEnd = citySegments[citySegments.length - 1]?.endDay;
      let contiguous = firstStart === 1 && lastEnd === dayCount;
      for (let i = 1; i < citySegments.length; i += 1) {
        if (citySegments[i].startDay !== citySegments[i - 1].endDay + 1) {
          contiguous = false;
          break;
        }
      }
      if (!contiguous) {
        setSubmitError(`City day ranges must cover Day 1 to Day ${dayCount} without gaps or overlaps.`);
        return;
      }
    } else {
      citySegments = [{
        city: String(allLocations[0]?.name || '').trim(),
        locationLabel: getLocationLabel(allLocations[0]),
        startDay: 1,
        endDay: dayCount,
      }];
    }

    const primaryLocation = allLocations[0];
    const title = getLocationLabel(primaryLocation);
    const locations = citySegments.map((seg) => seg.locationLabel).join('; ');
    const coverUrl = getCoverImageForDestination(primaryLocation.name, locations);
    const payload = {
      title: `Trip to ${title}`,
      overview: '',
      destination: primaryLocation.name,
      dates: formatTripDates(start, end),
      startDate: start,
      endDate: end,
      locations,
      placesSaved: 0,
      budget: '$0',
      budgetSpent: 0,
      travelers: 1 + (invitedEmails?.length || 0),
      collaborators: invitedEmails,
      status: 'Planning',
      statusClass: 'trip-card__status--planning',
      image: coverUrl,
      coverImages: [coverUrl],
      published: false,
      visibility: 'private',
      citySegments,
    };
    setSubmitting(true);
    try {
      const newItinerary = await createItinerary(payload);
      let id = extractItineraryId(newItinerary);
      if (!id) {
        const mine = await fetchMyItineraries();
        const sorted = [...mine].sort((a, b) => {
          const ta = new Date(a?.createdAt || 0).getTime();
          const tb = new Date(b?.createdAt || 0).getTime();
          return tb - ta;
        });
        id = extractItineraryId(sorted[0]);
      }
      if (!id) {
        throw new Error('Trip was created but could not open it automatically. Please refresh and open your latest trip.');
      }

      const hydrated = await waitForItineraryReadable(id);
      const nextPath = `/trip/${id}`;
      navigate(nextPath, { state: { preloadedItinerary: hydrated || newItinerary || null, fromCreateFlow: true } });

      // Rarely, route state updates the URL but the view remains on NewTripPage until a manual refresh.
      // If the NewTrip UI is still mounted shortly after navigation, force a same-path reload.
      setTimeout(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        if (window.location.pathname !== nextPath) return;
        const stillOnNewTripView = Boolean(document.querySelector('.new-trip__main'));
        if (stillOnNewTripView) {
          window.location.assign(nextPath);
        }
      }, 220);
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  commitPendingLocation();
                }
              }}
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
                {suggestionsLoading ? (
                  <li className="new-trip__suggestion new-trip__suggestion--empty" role="option">
                    Searching cities...
                  </li>
                ) : suggestions.length === 0 ? (
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
                        aria-selected={selectedLocations.some((item) => getLocationKey(item) === getLocationKey(loc))}
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
            {(selectedLocations.length > 0 || whereQuery.trim()) && (
              <div className="new-trip__chips" aria-label="Selected destinations">
                {selectedLocations.map((loc) => (
                  <span key={getLocationKey(loc)} className="new-trip__chip">
                    {getLocationLabel(loc)}
                    <button
                      type="button"
                      className="new-trip__chip-remove"
                      onClick={() => setSelectedLocations((prev) => prev.filter((item) => getLocationKey(item) !== getLocationKey(loc)))}
                      aria-label={`Remove ${getLocationLabel(loc)}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {whereQuery.trim() && (
                  <button
                    type="button"
                    className="new-trip__chip new-trip__chip--pending"
                    onClick={commitPendingLocation}
                    aria-label={`Add ${whereQuery.trim()}`}
                  >
                    + Add "{whereQuery.trim()}"
                  </button>
                )}
              </div>
            )}

            {selectedLocations.length > 1 && (
              <div className="new-trip__city-plan" aria-label="City day plan">
                <p className="new-trip__city-plan-title">How many days in each city?</p>
                <p className="new-trip__city-plan-hint">
                  Set day ranges to allocate days per city (for example, Seoul Day 1-3, Busan Day 4-6).
                </p>
                {totalTripDays > 0 ? (
                  <>
                    {selectedLocations.map((loc) => {
                      const key = getLocationKey(loc);
                      const range = cityDayRanges[key] || defaultCityDayRanges[key] || { startDay: 1, endDay: totalTripDays };
                      return (
                        <div key={key} className="new-trip__city-plan-row">
                          <span className="new-trip__city-plan-city">{getLocationLabel(loc)}</span>
                          <div className="new-trip__city-plan-inputs">
                            <label className="new-trip__city-plan-label">
                              From
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={1}
                                max={totalTripDays}
                                value={cityDayDrafts[getCityDayDraftKey(loc, 'startDay')] ?? String(range.startDay)}
                                onChange={(e) => handleCityRangeInputChange(loc, 'startDay', e.target.value)}
                                onBlur={() => commitCityRangeInput(loc, 'startDay')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="new-trip__city-plan-input"
                              />
                            </label>
                            <label className="new-trip__city-plan-label">
                              To
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={1}
                                max={totalTripDays}
                                value={cityDayDrafts[getCityDayDraftKey(loc, 'endDay')] ?? String(range.endDay)}
                                onChange={(e) => handleCityRangeInputChange(loc, 'endDay', e.target.value)}
                                onBlur={() => commitCityRangeInput(loc, 'endDay')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="new-trip__city-plan-input"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                    <p className="new-trip__city-plan-foot">Total trip length: Day 1 to Day {totalTripDays}.</p>
                  </>
                ) : (
                  <p className="new-trip__city-plan-foot">Select trip dates first to allocate days per city.</p>
                )}
              </div>
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
