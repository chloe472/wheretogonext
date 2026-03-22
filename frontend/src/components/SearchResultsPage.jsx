import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { searchLocations } from '../data/mockLocations';
import {
  ADVENTURE_TYPES,
  DURATIONS,
  SORT_OPTIONS,
  CREATOR_NATIONALITIES,
} from '../data/communitySearchConstants';
import {
  fetchPublicItineraries,
  mapItineraryToCard,
  mapSortToApiParam,
  applyClientSort,
} from '../api/itinerariesApi';
import ItineraryCard from './ItineraryCard';
import DashboardHeader from './DashboardHeader';
import './SearchResultsPage.css';

export default function SearchResultsPage({ user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [adventureType, setAdventureType] = useState('All');
  const [duration, setDuration] = useState('');
  const [creatorNationality, setCreatorNationality] = useState('');
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchRef = useRef(null);
  const suggestRef = useRef(null);

  const suggestions = searchLocations(searchInput.trim());

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

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
        cards = applyClientSort(cards, sortBy);
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
  }, [q, sortBy, adventureType, duration]);

  useEffect(() => {
    function handleClickOutside(e) {
      if ((searchRef.current && !searchRef.current.contains(e.target)) && (suggestRef.current && !suggestRef.current.contains(e.target))) {
        setSuggestOpen(false);
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

  const handleSelectSuggestion = (loc) => {
    const term = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
    setSearchInput(term);
    setSearchParams({ q: term });
    setSuggestOpen(false);
  };

  return (
    <div className="search-results">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="explore" />

      <section className="search-results__hero">
        <h1 className="search-results__hero-title">Community made itineraries</h1>
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
          />
          {suggestOpen && suggestions.length > 0 && (
            <ul className="search-results__suggestions" role="listbox" ref={suggestRef}>
              {suggestions.slice(0, 8).map((loc) => (
                <li key={loc.id}>
                  <button type="button" className="search-results__suggestion" onClick={() => handleSelectSuggestion(loc)} role="option">
                    {loc.name}
                    {loc.country && <span className="search-results__suggestion-meta">{loc.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </form>
        <p className="search-results__hero-hint">Search by your most recent destination</p>
        <div className="search-results__tags">
          {['Tokyo', 'Hanoi', 'Bangkok', 'Kuala Lumpur', 'Seoul'].map((dest) => (
            <button key={dest} type="button" className="search-results__tag" onClick={() => { setSearchInput(dest); setSearchParams({ q: dest }); setSuggestOpen(false); }}>
              {dest}
            </button>
          ))}
        </div>
      </section>

      <div className="search-results__main">
        <aside className="search-results__sidebar">
          <p className="search-results__count">
            {loading ? 'Loading…' : `${itineraries.length} Itineraries for you`}
          </p>
          <div className="search-results__filter">
            <label htmlFor="sort">Sort by:</label>
            <select id="sort" className="search-results__select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
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
          <div className="search-results__filter-block">
            <h3 className="search-results__filter-title">Creator Nationality</h3>
            <p className="search-results__filter-note">Coming soon — not applied to saved itineraries yet.</p>
            <div className="search-results__filter-tags">
              {CREATOR_NATIONALITIES.map((n) => (
                <button key={n} type="button" className={`search-results__filter-tag ${creatorNationality === n ? 'search-results__filter-tag--active' : ''}`} onClick={() => setCreatorNationality(creatorNationality === n ? '' : n)}>{n}</button>
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
                title={it.title}
                coverImages={it.coverImages}
                views={it.views}
                durationLabel={it.duration}
                placesCount={it.placesCount ?? 0}
                creatorName={it.creator}
                creatorAvatar={it.creatorAvatar}
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
