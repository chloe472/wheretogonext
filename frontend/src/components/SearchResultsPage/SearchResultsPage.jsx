import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, Search } from 'lucide-react';
import { fetchCitySuggestions } from '../../api/locationsApi';
import {
  ADVENTURE_TYPES,
  DURATIONS,
  SORT_OPTIONS,
} from '../../data/communitySearchConstants';
import { fetchMyProfile } from '../../api/profileApi';
import {
  fetchPublicItineraries,
  mapItineraryToCard,
  mapSortToApiParam,
  applyExploreOrdering,
} from '../../api/itinerariesApi';
import { EXPLORE_HERO_IMAGES } from '../../assets/exploreHeroImages';
import ItineraryCard from '../ItineraryCard/ItineraryCard';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import HeroSlideshowBackground from '../HeroSlideshowBackground/HeroSlideshowBackground';
import '../Dashboard/components/DashboardTripsSection.css';
import './SearchResultsPage.css';

const RECENT_DESTINATIONS = ['Tokyo', 'Hanoi', 'Bangkok', 'Kuala Lumpur', 'Seoul'];

const TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

function isCityLocation(loc) {
  return String(loc?.type || '').toLowerCase() === 'city';
}

function getLocationKey(loc) {
  const name = String(loc?.name || '').trim();
  const country = String(loc?.country || '').trim();
  return country ? `${name}, ${country}`.toLowerCase() : name.toLowerCase();
}

export default function SearchResultsPage({ user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [adventureType, setAdventureType] = useState('All');
  const [duration, setDuration] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [openSortDropdown, setOpenSortDropdown] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [profileInterests, setProfileInterests] = useState([]);
  const searchRef = useRef(null);
  const suggestRef = useRef(null);
  const sortDropdownRef = useRef(null);

  const exploreFiltersActive = useMemo(
    () =>
      Boolean(String(q || '').trim()) ||
      adventureType !== 'All' ||
      Boolean(String(duration || '').trim()),
    [q, adventureType, duration],
  );

  const suggestions = locationSuggestions.filter((loc) => isCityLocation(loc));

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  useEffect(() => {
    const trimmed = searchInput.trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setSuggestionsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const next = await fetchCitySuggestions(trimmed, { signal: controller.signal, limit: 12 });
        setLocationSuggestions(Array.isArray(next) ? next : []);
      } catch (err) {
        if (err?.name !== 'AbortError') {
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
  }, [searchInput]);

  useEffect(() => {
    if (!user?.id) {
      setProfileInterests([]);
      return undefined;
    }
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      try {
        const data = await fetchMyProfile({ signal: ac.signal });
        if (cancelled) return;
        const list = Array.isArray(data?.profile?.interests) ? data.profile.interests : [];
        setProfileInterests(list);
      } catch {
        if (!cancelled) setProfileInterests([]);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    async function load() {
      setLoading(true);
      setError('');
      try {
        const apiSort = mapSortToApiParam(sortBy);
        const raw = await fetchPublicItineraries(
          {
            search: q,
            sort: apiSort,
            categories: adventureType !== 'All' ? adventureType : undefined,
            duration: duration || undefined,
          },
          ac.signal
        );
        if (cancelled) return;
        let cards = raw.map(mapItineraryToCard);
        cards = applyExploreOrdering(cards, sortBy, profileInterests, exploreFiltersActive);
        setItineraries(cards);
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err?.message || 'Failed to load itineraries');
        setItineraries([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [q, sortBy, adventureType, duration, profileInterests, exploreFiltersActive]);

  useEffect(() => {
    function handleClickOutside(e) {
      if ((searchRef.current && !searchRef.current.contains(e.target)) && (suggestRef.current && !suggestRef.current.contains(e.target))) {
        setSuggestOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setOpenSortDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const term = (searchInput.trim() || q).replace(/\s+/g, ' ');
    if (term) setSearchParams({ q: term });
    setSuggestOpen(false);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchParams({});
    setSuggestOpen(false);
  };

  const handleSelectSuggestion = (loc) => {
    const term = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
    setSearchInput(term);
    setSearchParams({ q: term });
    setSuggestOpen(false);
  };

  const clearExploreFilters = useCallback(() => {
    setAdventureType('All');
    setDuration('');
    setSearchParams({});
    setSearchInput('');
    setSuggestOpen(false);
  }, [setSearchParams]);

  const showSuggestionPanel = suggestOpen && searchInput.trim().length >= 2;

  return (
    <div className="search-results">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="explore" />

      <section className="search-results__hero">
        <HeroSlideshowBackground images={EXPLORE_HERO_IMAGES} />
        <div className="search-results__hero-content">
          <p className="search-results__hero-eyebrow">Community made itineraries</p>
          <h1 className="search-results__hero-title">
            Find your next <em>adventure</em>
          </h1>
          <form className="search-results__search-form" onSubmit={handleSearchSubmit} ref={searchRef}>
            <Search size={20} className="search-results__search-icon" aria-hidden />
            <input
              type="text"
              className="search-results__search-input"
              placeholder="Search for Destination / Itineraries"
              value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setSuggestOpen(true); }}
              onFocus={() => setSuggestOpen(true)}
              aria-label="Search destinations or itineraries"
              aria-expanded={showSuggestionPanel}
              aria-autocomplete="list"
              autoComplete="off"
            />
            {(q || searchInput.trim()) && (
              <button
                type="button"
                className="search-results__search-clear"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
            {showSuggestionPanel && (
              <ul className="search-results__suggestions" role="listbox" ref={suggestRef}>
                {suggestionsLoading ? (
                  <li className="search-results__suggestion search-results__suggestion--empty" role="option">
                    Searching cities...
                  </li>
                ) : suggestions.length === 0 ? (
                  <li className="search-results__suggestion search-results__suggestion--empty" role="option">
                    No results
                  </li>
                ) : (
                  suggestions.slice(0, 8).map((loc) => (
                    <li key={String(loc.id || getLocationKey(loc))}>
                      <button
                        type="button"
                        className="search-results__suggestion"
                        onClick={() => handleSelectSuggestion(loc)}
                        role="option"
                      >
                        <span className="search-results__suggestion-name">{loc.name}</span>
                        {loc.country && (
                          <span className="search-results__suggestion-meta">{loc.country}</span>
                        )}
                        <span className={`search-results__type-badge search-results__type-badge--${String(loc.type || 'City').toLowerCase()}`}>
                          {TYPE_LABELS[loc.type] || loc.type || 'City'}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </form>
          <div className="search-results__tags">
            {RECENT_DESTINATIONS.map((dest) => {
              const isActive = q.trim().toLowerCase() === dest.toLowerCase();
              return (
                <button
                  key={dest}
                  type="button"
                  className={`search-results__tag ${isActive ? 'search-results__tag--active' : ''}`}
                  onClick={() => {
                    if (isActive) {
                      handleClearSearch();
                      return;
                    }
                    setSearchInput(dest);
                    setSearchParams({ q: dest });
                    setSuggestOpen(false);
                  }}
                  aria-pressed={isActive}
                >
                  {dest}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="search-results__main">
        <aside className="search-results__sidebar">
          {!loading && exploreFiltersActive && (
            <p className="search-results__filters-active-hint">
              Filters are on — results are sorted by your selection only (profile interest ranking is off).
            </p>
          )}
          <div className="search-results__sort-row">
            <div className="dashboard__filters">
              <label htmlFor="explore-sort" className="dashboard__filter-label">Sort by:</label>
              <div className="dashboard__filter-dropdown" ref={sortDropdownRef}>
                <button
                  id="explore-sort"
                  type="button"
                  className={`dashboard__filter-btn ${openSortDropdown ? 'dashboard__filter-btn--open' : ''}`}
                  aria-haspopup="listbox"
                  aria-expanded={openSortDropdown}
                  onClick={() => setOpenSortDropdown((o) => !o)}
                >
                  <span className="dashboard__filter-btn-text">{sortBy}</span>
                  <ChevronDown size={14} className="dashboard__filter-chevron" aria-hidden />
                </button>
                {openSortDropdown && (
                  <div className="dashboard__filter-menu" role="listbox" aria-label="Sort itineraries">
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="option"
                        aria-selected={sortBy === opt}
                        className={`dashboard__filter-option ${sortBy === opt ? 'dashboard__filter-option--active' : ''}`}
                        onClick={() => {
                          setSortBy(opt);
                          setOpenSortDropdown(false);
                        }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          {exploreFiltersActive && (
            <div className="search-results__clear-filters-wrap">
              <button type="button" className="search-results__clear-filters-btn" onClick={clearExploreFilters}>
                Clear filters
              </button>
            </div>
          )}
          <div className="search-results__filter-block">
            <h3 className="search-results__filter-title">Adventure type</h3>
            <div className="search-results__filter-tags">
              {ADVENTURE_TYPES.map((t) => (
                <button key={t} type="button" className={`search-results__filter-tag ${adventureType === t ? 'search-results__filter-tag--active' : ''}`} onClick={() => setAdventureType(t)}>{t}</button>
              ))}
            </div>
          </div>
          <div className="search-results__filter-block">
            <h3 className="search-results__filter-title">Duration</h3>
            <div className="search-results__filter-tags">
              {DURATIONS.map((d) => (
                <button key={d} type="button" className={`search-results__filter-tag ${duration === d ? 'search-results__filter-tag--active' : ''}`} onClick={() => setDuration(duration === d ? '' : d)}>{d}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="search-results__content">
          {error && (
            <p className="search-results__error" role="alert">{error}</p>
          )}
          {q && (
            <p className="search-results__query-hint">
              You are searching for itineraries that contain <strong>{q}</strong> – this can be in the name or in the contents of the itinerary.
            </p>
          )}
          <div className="search-results__grid">
            {!loading && itineraries.map((it) => (
              <ItineraryCard
                key={it.id}
                itineraryId={it.id}
                title={it.destination || it.title}
                coverImages={it.coverImages}
                destination={it.destination}
                locations={it.locations}
                views={it.views}
                durationLabel={it.duration}
                placesCount={it.placesCount ?? 0}
                creatorName={it.creator}
                creatorAvatar={it.creatorAvatar}
                creatorId={it.creatorId}
              />
            ))}
          </div>
          {!loading && itineraries.length === 0 && !error && (
            <p className="search-results__empty">No itineraries match your search. Try a different destination or filters.</p>
          )}
          {loading && (
            <p className="search-results__loading">Loading itineraries…</p>
          )}
        </div>
      </div>
    </div>
  );
}
