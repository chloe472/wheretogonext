import { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search, User, Bell, ChevronDown, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { searchLocations } from '../data/mockLocations';
import {
  ADVENTURE_TYPES,
  DURATIONS,
  SORT_OPTIONS,
  CREATOR_NATIONALITIES,
} from '../data/mockCommunityItineraries';
import { fetchDiscoveryData } from '../api/discoveryApi';
import { fetchItinerariesEngagementBatch } from '../api/itineraryEngagementApi';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import countriesData from '../data/countries.json';
import './SearchResultsPage.css';

function countryCodeToEmoji(code = '') {
  const c = String(code || '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return '';
  const A = 0x1f1e6;
  const out = [...c].map((ch) => String.fromCodePoint(A + (ch.charCodeAt(0) - 65))).join('');
  return out;
}

function inferCountryCode(itinerary, fallbackCountry = '') {
  const direct = String(itinerary?.countryCode || '').trim().toLowerCase();
  if (direct && /^[a-z]{2}$/.test(direct)) return direct;
  const name = String(itinerary?.country || fallbackCountry || '').trim().toLowerCase();
  if (!name) return '';
  const hit = (countriesData || []).find((c) => String(c?.name || '').trim().toLowerCase() === name);
  return hit?.id || '';
}

function getCardImages(itinerary) {
  const out = [];
  if (itinerary?.image) out.push(itinerary.image);
  const placeImages = Array.isArray(itinerary?.places)
    ? itinerary.places.map((p) => p?.image).filter(Boolean)
    : [];
  out.push(...placeImages);
  return [...new Set(out)].filter(Boolean).slice(0, 6);
}

function ItineraryCarousel({ images, title }) {
  const [index, setIndex] = useState(0);
  const safeImages = Array.isArray(images) && images.length > 0 ? images : [''];
  const active = safeImages[index] || safeImages[0] || '';
  const count = safeImages.length;

  const go = (delta) => {
    if (count <= 1) return;
    setIndex((prev) => (prev + delta + count) % count);
  };

  return (
    <div className="search-results__carousel">
      <img
        src={resolveImageUrl(active, title, 'itinerary')}
        alt={title || 'Itinerary'}
        className="search-results__card-image"
        data-image-hint={title || ''}
        data-image-topic="itinerary"
        onError={(event) => applyImageFallback(event)}
      />
      {count > 1 ? (
        <>
          <button
            type="button"
            className="search-results__carousel-nav search-results__carousel-nav--left"
            aria-label="Previous photo"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(-1); }}
          >
            <ChevronLeft size={18} aria-hidden />
          </button>
          <button
            type="button"
            className="search-results__carousel-nav search-results__carousel-nav--right"
            aria-label="Next photo"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); go(1); }}
          >
            <ChevronRight size={18} aria-hidden />
          </button>
          <div className="search-results__carousel-dots" aria-hidden>
            {safeImages.map((_, i) => (
              <span
                key={String(i)}
                className={`search-results__carousel-dot ${i === index ? 'search-results__carousel-dot--active' : ''}`}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function SearchResultsPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [searchInput, setSearchInput] = useState(q);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Most Popular');
  const [adventureType, setAdventureType] = useState('All');
  const [duration, setDuration] = useState('');
  const [creatorNationality, setCreatorNationality] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState('');
  const [communityItineraries, setCommunityItineraries] = useState([]);
  const [destinationCountry, setDestinationCountry] = useState({ country: '', countryCode: '' });
  const [engagementById, setEngagementById] = useState({});
  const searchRef = useRef(null);
  const suggestRef = useRef(null);

  const suggestions = searchLocations(searchInput.trim());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const query = (q || '').trim();
      if (!query) {
        setCommunityItineraries([]);
        setDiscoveryError('');
        setDiscoveryLoading(false);
        return;
      }

      setDiscoveryLoading(true);
      setDiscoveryError('');
      try {
        const data = await fetchDiscoveryData(query, 24);
        if (cancelled) return;
        const list = Array.isArray(data?.communityItineraries) ? data.communityItineraries : [];
        setCommunityItineraries(list);
        setDestinationCountry({
          country: String(data?.country || '').trim(),
          countryCode: String(data?.countryCode || '').trim(),
        });
      } catch (err) {
        if (cancelled) return;
        setDiscoveryError(err?.message || 'Failed to load community itineraries');
        setCommunityItineraries([]);
      } finally {
        if (!cancelled) setDiscoveryLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    async function loadEngagement() {
      const ids = (Array.isArray(communityItineraries) ? communityItineraries : []).map((it) => it.id).filter(Boolean);
      if (ids.length === 0) {
        setEngagementById({});
        return;
      }
      try {
        const data = await fetchItinerariesEngagementBatch(ids);
        if (cancelled) return;
        const items = Array.isArray(data?.items) ? data.items : [];
        const next = {};
        items.forEach((row) => {
          if (!row?.itineraryId) return;
          next[String(row.itineraryId)] = {
            views: Number(row.views || 0),
            commentsCount: Number(row.commentsCount || 0),
          };
        });
        setEngagementById(next);
      } catch {
        if (!cancelled) setEngagementById({});
      }
    }
    loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [communityItineraries]);

  const itineraries = useMemo(() => {
    let list = Array.isArray(communityItineraries) ? communityItineraries : [];

    if (adventureType && adventureType !== 'All') {
      list = list.filter((it) => it.type === adventureType);
    }

    if (duration) {
      list = list.filter((it) => {
        const days = parseInt(it.duration, 10) || 0;
        if (duration === '1-3 days') return days >= 1 && days <= 3;
        if (duration === '3-5 days') return days >= 3 && days <= 5;
        if (duration === '5-7 days') return days >= 5 && days <= 7;
        if (duration === '7-10 days') return days >= 7 && days <= 10;
        if (duration === '10-14 days') return days >= 10 && days <= 14;
        if (duration === '14+ days') return days >= 14;
        return true;
      });
    }

    if (sortBy === 'Newest') list = [...list].sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
    if (sortBy === 'Most Popular') list = [...list].sort((a, b) => (Number(b.views || 0) + Number(b.likes || 0)) - (Number(a.views || 0) + Number(a.likes || 0)));
    if (sortBy === 'Price: Low to High') list = [...list].sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    if (sortBy === 'Price: High to Low') list = [...list].sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    if (sortBy === 'Duration') list = [...list].sort((a, b) => (parseInt(a.duration, 10) || 0) - (parseInt(b.duration, 10) || 0));

    return list;
  }, [communityItineraries, adventureType, duration, sortBy, creatorNationality]);

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
              <article
                key={it.id}
                className="search-results__card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/itinerary/${encodeURIComponent(it.id)}`, { state: { destination: it.destination || q } })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/itinerary/${encodeURIComponent(it.id)}`, { state: { destination: it.destination || q } });
                  }
                }}
              >
                <div className="search-results__card-image-wrap">
                  <ItineraryCarousel images={getCardImages(it)} title={it.title} />
                  <div className="search-results__views-badge" aria-label="Views">
                    <Eye size={16} aria-hidden />
                    <span>{Number(engagementById?.[String(it.id)]?.views || 0).toLocaleString()}</span>
                  </div>
                  {(() => {
                    const code = inferCountryCode(it, destinationCountry.country);
                    const emoji = countryCodeToEmoji(code);
                    return emoji ? (
                      <span className="search-results__flag" aria-label={it.country || destinationCountry.country || 'Country'}>
                        {emoji}
                      </span>
                    ) : null;
                  })()}
                </div>
                <div className="search-results__card-body">
                  <h3 className="search-results__card-title">{it.title}</h3>
                  <div className="search-results__pills">
                    <span className="search-results__pill">{parseInt(it.duration, 10) || 0} days</span>
                    <span className="search-results__pill">{Array.isArray(it.places) ? it.places.length : 0} places</span>
                  </div>
                  <div className="search-results__card-creator">
                    <span className="search-results__card-avatar"><User size={14} aria-hidden /></span>
                    <span className="search-results__card-username">{it.creator}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {discoveryLoading && (
            <p className="search-results__empty">Loading community itineraries…</p>
          )}
          {discoveryError && !discoveryLoading && (
            <p className="search-results__empty">{discoveryError}</p>
          )}
          {itineraries.length === 0 && !discoveryLoading && !discoveryError && (
            <p className="search-results__empty">No itineraries match your search. Try a different destination or filters.</p>
          )}
        </div>
      </div>
    </div>
  );
}
