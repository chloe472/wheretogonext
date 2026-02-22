import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, ChevronDown, Users } from 'lucide-react';
import { searchLocations } from '../data/mockLocations';
import './NewTripPage.css';

const TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

export default function NewTripPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [whereQuery, setWhereQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [whereOpen, setWhereOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState([]);
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

  const handleStartPlanning = (e) => {
    e.preventDefault();
    // In a real app: create trip via API with selectedLocation, startDate, endDate, then navigate to trip details
    if (selectedLocation) {
      navigate('/');
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
            <label className="new-trip__label">Dates (optional)</label>
            <div className="new-trip__dates">
              <span className="new-trip__date-wrap">
                <CalendarIcon size={18} className="new-trip__date-icon" aria-hidden />
                <input
                  type="date"
                  className="new-trip__input new-trip__input--date"
                  placeholder="Start date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  aria-label="Start date"
                />
              </span>
              <span className="new-trip__date-wrap">
                <CalendarIcon size={18} className="new-trip__date-icon" aria-hidden />
                <input
                  type="date"
                  className="new-trip__input new-trip__input--date"
                  placeholder="End date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  aria-label="End date"
                />
              </span>
            </div>
          </div>

          <div className="new-trip__row">
            <button type="button" className="new-trip__invite">
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
                  <p className="new-trip__friends-hint">No friends added yet. Invite by email or link.</p>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="new-trip__submit">
            Start planning
          </button>
        </form>
      </main>
    </div>
  );
}
