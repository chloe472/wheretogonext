import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Bell, User, Search } from 'lucide-react';
import { searchLocations } from '../../data/mockLocations';
import './DashboardHeader.css';

export default function DashboardHeader({ user, onLogout }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
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
      <div className="dashboard__brand">
        <div className="dashboard__logo" aria-hidden>
          @
        </div>
        <div>
          <span className="dashboard__app-name">where to go next</span>
          <span className="dashboard__tagline">Your travel companion</span>
        </div>
      </div>

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
        <a href="#my-trips" className="dashboard__nav-link">My Trips</a>
        <Link to="/search" className="dashboard__nav-link">Explore</Link>
        <button type="button" className="dashboard__icon-btn" aria-label="Notifications">
          <Bell size={20} aria-hidden />
        </button>
        <div className="dashboard__profile-wrap">
          <button type="button" className="dashboard__icon-btn dashboard__icon-btn--avatar" aria-label="Profile">
            <User size={20} aria-hidden />
          </button>
          <div className="dashboard__profile-menu">
            {user?.name && <span className="dashboard__profile-name">{user.name}</span>}
            <Link to="/profile" className="dashboard__profile-link">Profile</Link>
            <button type="button" className="dashboard__profile-logout" onClick={onLogout}>
              Log out
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
}