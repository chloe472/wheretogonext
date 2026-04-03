import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, Users } from 'lucide-react';
import { createItinerary, fetchItineraryById, fetchMyItineraries } from '../../api/itinerariesApi';
import { fetchMyProfile, searchUserByIdentifier } from '../../api/profileApi';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import { fetchCitySuggestions } from '../../api/locationsApi';
import { lookupUserByEmail } from '../../api/profileApi';
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
  const cityPlanRowSeqRef = useRef(0);
  const [cityPlanRows, setCityPlanRows] = useState([]);
  const [cityDayRanges, setCityDayRanges] = useState({});
  const [cityDayDrafts, setCityDayDrafts] = useState({});
  const [cityRangeError, setCityRangeError] = useState('');
  const [whereOpen, setWhereOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [datesError, setDatesError] = useState('');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendsList, setFriendsList] = useState([]);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteSearching, setInviteSearching] = useState(false);
  const [invitePreview, setInvitePreview] = useState(null);
  const [inviteError, setInviteError] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const whereRef = useRef(null);
  const friendsRef = useRef(null);

  const myEmail = String(user?.email || '').trim().toLowerCase();

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
    const selectedKeys = new Set(selectedLocations.map((loc) => getLocationKey(loc)));
    setCityPlanRows((prev) => {
      const next = prev.filter((row) => selectedKeys.has(row.locationKey));
      selectedLocations.forEach((loc) => {
        const key = getLocationKey(loc);
        if (!next.some((row) => row.locationKey === key)) {
          cityPlanRowSeqRef.current += 1;
          next.push({ id: `city-plan-${cityPlanRowSeqRef.current}`, locationKey: key });
        }
      });
      return next;
    });
  }, [selectedLocations]);

  useEffect(() => {
    setCityDayRanges((prev) => {
      const next = {};
      cityPlanRows.forEach((row) => {
        const fallback = defaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: Math.max(1, totalTripDays || 1) };
        next[row.id] = prev[row.id] || fallback;
      });
      return next;
    });
  }, [cityPlanRows, defaultCityDayRanges, totalTripDays]);

  useEffect(() => {
    setCityDayDrafts((prev) => {
      const validRowIds = new Set(cityPlanRows.map((row) => row.id));
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [rowId] = key.split('::');
        if (validRowIds.has(rowId)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [cityPlanRows]);

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

  const updateCityRange = (rowId, locationKey, field, value) => {
    if (cityRangeError) setCityRangeError('');
    const maxDay = Math.max(1, totalTripDays || 1);
    const n = Number.parseInt(String(value), 10);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(maxDay, Math.round(n))) : 1;
    setCityDayRanges((prev) => {
      const current = prev[rowId] || defaultCityDayRanges[locationKey] || { startDay: 1, endDay: maxDay };
      const next = { ...current, [field]: safe };
      if (next.startDay > next.endDay) {
        if (field === 'startDay') next.endDay = next.startDay;
        if (field === 'endDay') next.startDay = next.endDay;
      }
      return { ...prev, [rowId]: next };
    });
  };

  const getCityDayDraftKey = (rowId, field) => `${rowId}::${field}`;

  const handleCityRangeInputChange = (row, field, value) => {
    const raw = String(value);
    const sanitized = raw.replace(/[^0-9]/g, '');
    const draftKey = getCityDayDraftKey(row.id, field);
    if (cityRangeError) setCityRangeError('');
    setCityDayDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
  };

  const commitCityRangeInput = (row, field) => {
    const draftKey = getCityDayDraftKey(row.id, field);
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

    const maxDay = Math.max(1, totalTripDays || 1);
    const parsed = Number.parseInt(String(raw), 10);
    if (Number.isFinite(parsed) && parsed > maxDay) {
      setCityRangeError(`Day cannot exceed Day ${maxDay}.`);
      return;
    }

    if (cityRangeError) setCityRangeError('');

    updateCityRange(row.id, row.locationKey, field, raw);
    setCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const addCityPlanRow = () => {
    if (!selectedLocations.length) return;
    if (cityRangeError) setCityRangeError('');
    cityPlanRowSeqRef.current += 1;
    setCityPlanRows((prev) => [
      ...prev,
      { id: `city-plan-${cityPlanRowSeqRef.current}`, locationKey: getLocationKey(selectedLocations[0]) },
    ]);
  };

  const removeCityPlanRow = (rowId) => {
    if (cityRangeError) setCityRangeError('');
    setCityPlanRows((prev) => prev.filter((row) => row.id !== rowId));
    setCityDayRanges((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[`${rowId}::startDay`];
      delete next[`${rowId}::endDay`];
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

  const handleBackToTrips = (e) => {
    e.preventDefault();
    navigate('/', { replace: true, flushSync: true });

    // Guard against rare cases where URL updates but NewTrip view stays mounted.
    setTimeout(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      if (window.location.pathname !== '/') return;
      const stillOnNewTripView = Boolean(document.querySelector('.new-trip__main'));
      if (stillOnNewTripView) {
        window.location.assign('/');
      }
    }, 220);
  };

  const handleAddInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('');
      return;
    }
    if (email === myEmail) {
      setInviteError('You cannot add your own email as a tripmate.');
      return;
    }
    if (invitedEmails.includes(email)) {
      setInviteError('That tripmate has already been added.');
      return;
    }
    setValidatingInvite(true);
    setInviteError('');
    try {
      await lookupUserByEmail(email);
      setInvitedEmails((prev) => [...prev, email]);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err?.message || 'Could not add that tripmate.');
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleStartPlanning = async (e) => {
    e.preventDefault();
    setDatesError('');
    setSubmitError('');
    setCityRangeError('');
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
      const allLocationKeys = allLocations.map((loc) => getLocationKey(loc));
      const effectiveRows = cityPlanRows
        .filter((row) => allLocationKeys.includes(row.locationKey));
      allLocations.forEach((loc) => {
        const key = getLocationKey(loc);
        if (!effectiveRows.some((row) => row.locationKey === key)) {
          effectiveRows.push({ id: `virtual-${key}`, locationKey: key });
        }
      });

      citySegments = effectiveRows.map((row) => {
        const loc = allLocations.find((item) => getLocationKey(item) === row.locationKey) || allLocations[0];
        const key = getLocationKey(loc);
        const selected = cityDayRanges[row.id] || fallbackRanges[key] || { startDay: 1, endDay: dayCount };
        const startDraft = cityDayDrafts[getCityDayDraftKey(row.id, 'startDay')];
        const endDraft = cityDayDrafts[getCityDayDraftKey(row.id, 'endDay')];
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

      if (citySegments.length > 0) {
        if (citySegments[0].startDay !== 1) {
          const firstCity = citySegments[0].city || citySegments[0].locationLabel || 'the first city';
          const message = `City ranges must start at Day 1. ${firstCity} currently starts at Day ${citySegments[0].startDay}.`;
          setCityRangeError(message);
          return;
        }

        const last = citySegments[citySegments.length - 1];
        if (last.endDay !== dayCount) {
          const message = `City ranges must end at Day ${dayCount}. Current end day is Day ${last.endDay}.`;
          setCityRangeError(message);
          return;
        }
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
      travelers: 1 + (invitedEmails?.length || 0) + (invitedFriends?.length || 0),
      collaborators: [
        ...invitedEmails,
        ...invitedFriends.map((f) => ({ userId: f.id })),
      ],
      status: 'Planning',
      statusClass: 'trip-card__status--planning',
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
      navigate(nextPath, {
        state: { preloadedItinerary: hydrated || newItinerary || null, fromCreateFlow: true },
        flushSync: true,
      });

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
        <Link to="/" className="new-trip__back" aria-label="Back to My Trips" onClick={handleBackToTrips}>
          Back
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
                    {cityPlanRows.map((row) => {
                      const loc = selectedLocations.find((item) => getLocationKey(item) === row.locationKey) || selectedLocations[0];
                      if (!loc) return null;
                      const range = cityDayRanges[row.id] || defaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: totalTripDays };
                      const canRemove = cityPlanRows.length > selectedLocations.length;
                      return (
                        <div key={row.id} className="new-trip__city-plan-row">
                          <div className="new-trip__city-plan-city-field">
                            <select
                              className="new-trip__city-plan-select"
                              value={row.locationKey}
                              onChange={(e) => {
                                const nextKey = e.target.value;
                                setCityPlanRows((prev) => prev.map((it) => (it.id === row.id ? { ...it, locationKey: nextKey } : it)));
                              }}
                              aria-label="City"
                            >
                              {selectedLocations.map((optionLoc) => {
                                const optionKey = getLocationKey(optionLoc);
                                return (
                                  <option key={optionKey} value={optionKey}>{getLocationLabel(optionLoc)}</option>
                                );
                              })}
                            </select>
                          </div>
                          <div className="new-trip__city-plan-inputs">
                            <div className="new-trip__city-plan-range-group">
                              <span className="new-trip__city-plan-range-prefix">Day</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={1}
                                max={totalTripDays}
                                value={cityDayDrafts[getCityDayDraftKey(row.id, 'startDay')] ?? String(range.startDay)}
                                onChange={(e) => handleCityRangeInputChange(row, 'startDay', e.target.value)}
                                onBlur={() => commitCityRangeInput(row, 'startDay')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="new-trip__city-plan-input"
                                aria-label="Start day"
                              />
                              <span className="new-trip__city-plan-range-separator">to</span>
                              <span className="new-trip__city-plan-range-prefix">Day</span>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                min={1}
                                max={totalTripDays}
                                value={cityDayDrafts[getCityDayDraftKey(row.id, 'endDay')] ?? String(range.endDay)}
                                onChange={(e) => handleCityRangeInputChange(row, 'endDay', e.target.value)}
                                onBlur={() => commitCityRangeInput(row, 'endDay')}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.currentTarget.blur();
                                  }
                                }}
                                className="new-trip__city-plan-input"
                                aria-label="End day"
                              />
                            </div>
                            {canRemove ? (
                              <button
                                type="button"
                                className="new-trip__city-plan-remove"
                                onClick={() => removeCityPlanRow(row.id)}
                                aria-label="Remove row"
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" className="new-trip__city-plan-add" onClick={addCityPlanRow}>
                      + Add another row
                    </button>
                    {cityRangeError ? (
                      <p className="new-trip__error new-trip__city-plan-error" role="alert">{cityRangeError}</p>
                    ) : null}
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
            <p className="new-trip__label">Tripmates</p>

            {/* always-visible invited list */}
            {(invitedFriends.length > 0 || invitedEmails.length > 0) && (
              <ul className="new-trip__invited-list">
                {invitedFriends.map((f) => (
                  <li key={`friend-${f.id}`} className="new-trip__invited-item">
                    <div className="new-trip__invited-avatar">
                      {f.picture
                        ? <img src={resolveImageUrl(f.picture)} alt="" onError={applyImageFallback} />
                        : <span>{(f.name || '?')[0].toUpperCase()}</span>
                      }
                    </div>
                    <div className="new-trip__invited-info">
                      <span className="new-trip__invited-name">{f.name}</span>
                      {f.email && <span className="new-trip__invited-handle">@{f.email.split('@')[0]}</span>}
                    </div>
                    <button
                      type="button"
                      className="new-trip__invited-remove"
                      onClick={() => setInvitedFriends((prev) => prev.filter((x) => x.id !== f.id))}
                      aria-label={`Remove ${f.name}`}
                    >×</button>
                  </li>
                ))}
                {invitedEmails.map((email) => (
                  <li key={email} className="new-trip__invited-item">
                    <div className="new-trip__invited-avatar new-trip__invited-avatar--email">@</div>
                    <span className="new-trip__invited-name">{email}</span>
                    <button
                      type="button"
                      className="new-trip__invited-remove"
                      onClick={() => setInvitedEmails((prev) => prev.filter((e) => e !== email))}
                      aria-label={`Remove ${email}`}
                    >×</button>
                  </li>
                ))}
              </ul>
            )}

            {/* search input + friends picker */}
            <div className="new-trip__invite-row">
              <div className="new-trip__invite-search-wrap">
                <div className="new-trip__invite-input-row">
                  <input
                    type="text"
                    className="new-trip__input"
                    placeholder="Search by name or email…"
                    value={inviteQuery}
                    onChange={(e) => { setInviteQuery(e.target.value); setInvitePreview(null); setInviteError(''); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addInvitePreview(); } }}
                  />
                  <button
                    type="button"
                    className="new-trip__invite-add-btn"
                    onClick={addInvitePreview}
                    disabled={!invitePreview}
                  >
                    Add
                  </button>
                </div>
                {inviteSearching && <p className="new-trip__invite-status">Searching…</p>}
                {!inviteSearching && inviteError && inviteQuery.trim().length >= 2 && (
                  <p className="new-trip__invite-status new-trip__invite-status--error">{inviteError}</p>
                )}
                {!inviteSearching && invitePreview && (
                  <div className="new-trip__invite-preview">
                    <div className="new-trip__friend-avatar">
                      {invitePreview.picture
                        ? <img src={resolveImageUrl(invitePreview.picture)} alt="" onError={applyImageFallback} />
                        : <span>{(invitePreview.name || '?')[0].toUpperCase()}</span>
                      }
                    </div>
                    <div className="new-trip__friend-info">
                      <span className="new-trip__friend-name">{invitePreview.name}</span>
                      {invitePreview.email && <span className="new-trip__friend-handle">@{invitePreview.email.split('@')[0]}</span>}
                    </div>
                    <span className="new-trip__friend-check">✓</span>
                  </div>
                )}
              </div>

              <div className="new-trip__friends-wrap" ref={friendsRef}>
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
                    {friendsList.length === 0 ? (
                      <p className="new-trip__friends-hint">No friends yet.</p>
                    ) : (
                      <ul className="new-trip__friends-list">
                        {friendsList.map((friend) => {
                          const selected = invitedFriends.some((f) => f.id === friend.id);
                          return (
                            <li key={friend.id}>
                              <button
                                type="button"
                                className={`new-trip__friend-item${selected ? ' new-trip__friend-item--selected' : ''}`}
                                onClick={() => setInvitedFriends((prev) =>
                                  selected ? prev.filter((f) => f.id !== friend.id) : [...prev, friend]
                                )}
                                role="option"
                                aria-selected={selected}
                              >
                                <div className="new-trip__friend-avatar">
                                  {friend.picture
                                    ? <img src={resolveImageUrl(friend.picture)} alt="" onError={applyImageFallback} />
                                    : <span>{(friend.name || '?')[0].toUpperCase()}</span>
                                  }
                                </div>
                                <div className="new-trip__friend-info">
                                  <span className="new-trip__friend-name">{friend.name}</span>
                                  {friend.email && <span className="new-trip__friend-handle">@{friend.email.split('@')[0]}</span>}
                                </div>
                                {selected && <span className="new-trip__friend-check">✓</span>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
<<<<<<< HEAD
=======
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
                    onChange={(e) => {
                      setInviteEmail(e.target.value);
                      if (inviteError) setInviteError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInvite();
                      }
                    }}
                    autoComplete="email"
                  />
                  <button
                    type="button"
                    className="new-trip__invite-add-btn"
                    onClick={handleAddInvite}
                    disabled={validatingInvite}
                  >
                    {validatingInvite ? 'Adding...' : 'Add'}
                  </button>
                </div>
                {inviteError ? (
                  <p className="new-trip__error" role="alert">{inviteError}</p>
                ) : null}
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
>>>>>>> cccd73791376edf219883e1068e11132f54f38e6
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
