import { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, User, Bell, ChevronDown } from 'lucide-react';
import { searchLocations } from '../data/mockLocations';
import {
  getCommunityItineraries,
  ADVENTURE_TYPES,
  DURATIONS,
  SORT_OPTIONS,
  CREATOR_NATIONALITIES,
} from '../data/mockCommunityItineraries';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import './SearchResultsPage.css';

export default function SearchResultsPage({ user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [adventureType, setAdventureType] = useState('All');
  const [duration, setDuration] = useState('');
  const [creatorNationality, setCreatorNationality] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);
  const suggestRef = useRef(null);

  const suggestions = searchLocations(searchInput.trim());
  const itineraries = getCommunityItineraries(q, { type: adventureType !== 'All' ? adventureType : undefined, duration: duration || undefined, sort: sortBy });

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

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
      <header className="search-results__header">
        <Link to="/" className="search-results__brand">
          <span className="search-results__logo">@</span>
          <span className="search-results__app-name">where to go next</span>
        </Link>
        <nav className="search-results__nav">
          <Link to="/" className="search-results__nav-link">My Trips</Link>
          <Link to="/search" className="search-results__nav-link search-results__nav-link--active">Explore</Link>
          <button type="button" className="search-results__icon-btn" aria-label="Notifications">
            <Bell size={20} aria-hidden />
          </button>
          <div className="search-results__profile-wrap">
            <button type="button" className="search-results__icon-btn search-results__icon-btn--avatar" aria-label="Profile" onClick={() => setProfileOpen((o) => !o)}>
              <User size={20} aria-hidden />
            </button>
            {profileOpen && (
              <>
                <button type="button" className="search-results__profile-backdrop" aria-label="Close" onClick={() => setProfileOpen(false)} />
                <div className="search-results__profile-menu">
                  {user?.name && <span className="search-results__profile-name">{user.name}</span>}
                  <button type="button" className="search-results__profile-logout" onClick={() => { setProfileOpen(false); onLogout?.(); }}>Log out</button>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

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
          <p className="search-results__count">{itineraries.length} Itineraries for you</p>
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
            <div className="search-results__filter-tags">
              {CREATOR_NATIONALITIES.map((n) => (
                <button key={n} type="button" className={`search-results__filter-tag ${creatorNationality === n ? 'search-results__filter-tag--active' : ''}`} onClick={() => setCreatorNationality(creatorNationality === n ? '' : n)}>{n}</button>
              ))}
            </div>
          </div>
        </aside>

        <div className="search-results__content">
          {q && (
            <p className="search-results__query-hint">
              You are searching for itineraries that contain <strong>{q}</strong> – this can be in the name or in the contents of the itinerary.
            </p>
          )}
          <div className="search-results__grid">
            {itineraries.map((it) => (
              <article key={it.id} className="search-results__card">
                <div className="search-results__card-image-wrap">
                  <img
                    src={resolveImageUrl(it.image, it.title, 'itinerary')}
                    alt={it.title || 'Itinerary'}
                    className="search-results__card-image"
                    data-image-hint={it.title || ''}
                    data-image-topic="itinerary"
                    onError={(event) => applyImageFallback(event)}
                  />
                </div>
                <div className="search-results__card-body">
                  <h3 className="search-results__card-title">{it.title}</h3>
                  <p className="search-results__card-price">{it.currency} {it.price}</p>
                  <div className="search-results__card-creator">
                    <span className="search-results__card-avatar"><User size={14} aria-hidden /></span>
                    <span className="search-results__card-username">{it.creator}</span>
                  </div>
                  <div className="search-results__card-meta">
                    <span className="search-results__card-type">{it.type}</span>
                    <span className="search-results__card-duration">{it.duration}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {itineraries.length === 0 && (
            <p className="search-results__empty">No itineraries match your search. Try a different destination or filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
