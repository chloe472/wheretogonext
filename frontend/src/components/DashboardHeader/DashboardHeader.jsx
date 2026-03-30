import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Bell, User, Search } from 'lucide-react';
import { searchLocations } from '../../data/mockLocations';
import './DashboardHeader.css';

/**
 * Shared top bar for dashboard-style pages (My Trips, Explore, etc.)
 * @param {{ user?: { name?: string }, onLogout?: () => void, activeNav?: 'dashboard' | 'explore' }} props
 */
export default function DashboardHeader({ user, onLogout, activeNav = 'dashboard' }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchRef = useRef(null);

  const searchSuggestions = searchLocations(searchQuery);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="dashboard__header">
      <Link to="/" className="dashboard__brand dashboard__brand-link">
        <div className="dashboard__logo" aria-hidden>
          @
        </div>
        <div>
          <span className="dashboard__app-name">where to go next</span>
          <span className="dashboard__tagline">Your travel companion</span>
        </div>
      </Link>

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
        {activeNav === 'dashboard' ? (
          <a href="#my-trips" className="dashboard__nav-link dashboard__nav-link--active">
            My Trips
          </a>
        ) : (
          <Link to="/" className="dashboard__nav-link">
            My Trips
          </Link>
        )}
        <Link
          to="/search"
          className={
            activeNav === 'explore'
              ? 'dashboard__nav-link dashboard__nav-link--active'
              : 'dashboard__nav-link'
          }
        >
          Explore
        </Link>
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
                <Link
                  to="/profile"
                  className="dashboard__profile-link"
                  onClick={() => setProfileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="dashboard__profile-logout"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout?.();
                  }}
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
