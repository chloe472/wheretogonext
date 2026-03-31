import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronDown,
  Image,
  LayoutGrid,
  Route,
  Share2,
} from 'lucide-react';
import { formatUsdAsCurrency } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsHeader({
  trip,
  tripId,
  daysLength,
  titleDropdownRef,
  titleLastClickRef,
  titleEditing,
  setTitleEditing,
  titleEditValue,
  setTitleEditValue,
  titleDisplay,
  titleDropdownOpen,
  setTitleDropdownOpen,
  onCommitTripTitle,
  onRequestDeleteTrip,
  spent,
  currency,
  exchangeRates,
  onBudgetDetailsClick,
  onOpenWhereModal,
  displayDatesLabel,
  onOpenDateModal,
  currencyOptions,
  loadExchangeRates,
  onOpenCurrencyModal,
  onOpenNotesModal,
  onOpenRouteIdeas,
  viewMode,
  setViewMode,
}) {
  const navigate = useNavigate();

  return (
    <header className="trip-details__header">
      <div className="trip-details__brand">
        <Link to="/" className="trip-details__logo" aria-label="Back to My Trips">
          @
        </Link>
        <div className="trip-details__trip-info" ref={titleDropdownRef}>
          {titleEditing ? (
            <input
              type="text"
              className="trip-details__title-input"
              value={titleEditValue}
              onChange={(e) => setTitleEditValue(e.target.value)}
              onBlur={() => {
                const v = titleEditValue.trim();
                if (v) {
                  onCommitTripTitle(v);
                }
                setTitleEditing(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
                if (e.key === 'Escape') {
                  setTitleEditValue(titleDisplay);
                  setTitleEditing(false);
                }
              }}
              autoFocus
              aria-label="Trip title"
            />
          ) : (
            <>
              <button
                type="button"
                className="trip-details__title-btn"
                onClick={() => {
                  const now = Date.now();
                  if (now - titleLastClickRef.current < 400) {
                    setTitleEditValue(titleDisplay);
                    setTitleEditing(true);
                    setTitleDropdownOpen(false);
                  } else {
                    setTitleDropdownOpen((o) => !o);
                  }
                  titleLastClickRef.current = now;
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  setTitleEditValue(titleDisplay);
                  setTitleEditing(true);
                  setTitleDropdownOpen(false);
                }}
                aria-label="Trip name - click for menu, double-click to rename"
                aria-expanded={titleDropdownOpen}
              >
                <span className="trip-details__title-text">
                  {titleDisplay || `${daysLength} days to ${trip.destination}`}
                </span>
                <ChevronDown size={16} aria-hidden />
              </button>
              {titleDropdownOpen && (
                <div className="trip-details__title-dropdown" role="menu">
                  <button
                    type="button"
                    className="trip-details__title-dropdown-item"
                    role="menuitem"
                    onClick={() => {
                      setTitleEditing(true);
                      setTitleEditValue(titleDisplay);
                      setTitleDropdownOpen(false);
                    }}
                  >
                    Rename trip
                  </button>
                  <button
                    type="button"
                    className="trip-details__title-dropdown-item trip-details__title-dropdown-item--danger"
                    role="menuitem"
                    onClick={() => {
                      setTitleDropdownOpen(false);
                      onRequestDeleteTrip();
                    }}
                  >
                    Delete trip
                  </button>
                </div>
              )}
            </>
          )}
          <p className="trip-details__spent">
            Spent: {formatUsdAsCurrency(spent, currency, exchangeRates)}{' '}
            <button type="button" className="trip-details__details-link" onClick={onBudgetDetailsClick}>
              Details
            </button>
          </p>
        </div>
      </div>

      <div className="trip-details__center">
        <button
          type="button"
          className="trip-details__pill trip-details__pill--btn"
          onClick={onOpenWhereModal}
          aria-label="Change destination"
        >
          {trip.locations || trip.destination}
          <ChevronDown size={14} aria-hidden />
        </button>
        <button
          type="button"
          className="trip-details__pill trip-details__pill--btn"
          onClick={onOpenDateModal}
          aria-label="Change dates"
        >
          {displayDatesLabel}
        </button>
        <div className="trip-details__currency-wrap">
          <button
            type="button"
            className="trip-details__currency-btn"
            onClick={onOpenCurrencyModal}
            aria-label="Change currency"
          >
            {currency}
            <ChevronDown size={14} aria-hidden />
          </button>
        </div>
        <button
          type="button"
          className="trip-details__icon-btn"
          aria-label="Notes & Documents"
          onClick={onOpenNotesModal}
        >
          <BookOpen size={18} aria-hidden />
        </button>
      </div>

      <div className="trip-details__actions">
        <button
          type="button"
          className="trip-details__icon-btn"
          onClick={() => navigate(`/trip/${tripId}/moodboard`)}
          title="Moodboard"
        >
          <Image size={18} />
        </button>

        <button
          type="button"
          className="trip-details__icon-btn"
          onClick={onOpenRouteIdeas}
          aria-label="Smart Itinerary Generator"
          title="Smart Itinerary Generator"
        >
          <Route size={18} aria-hidden />
        </button>

        <div className="trip-details__view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`trip-details__view-toggle-btn ${viewMode === 'kanban' ? 'trip-details__view-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('kanban')}
            aria-pressed={viewMode === 'kanban'}
            aria-label="Kanban board view"
            title="Board view"
          >
            <LayoutGrid size={18} aria-hidden />
          </button>
          <button
            type="button"
            className={`trip-details__view-toggle-btn ${viewMode === 'calendar' ? 'trip-details__view-toggle-btn--active' : ''}`}
            onClick={() => setViewMode('calendar')}
            aria-pressed={viewMode === 'calendar'}
            aria-label="Calendar view"
            title="Calendar view"
          >
            <CalendarIcon size={18} aria-hidden />
          </button>
        </div>
        <button type="button" className="trip-details__icon-btn" aria-label="Share">
          <Share2 size={18} aria-hidden />
        </button>
      </div>
    </header>
  );
}
