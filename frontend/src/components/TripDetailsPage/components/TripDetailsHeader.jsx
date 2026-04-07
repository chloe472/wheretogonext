import { Link, useNavigate } from 'react-router-dom';
import { useTripAccess } from '../lib/TripAccessContext';
import {
  BookOpen,
  Calendar as CalendarIcon,
  ChevronDown,
  Image,
  LayoutGrid,
  Route,
  Share2,
} from 'lucide-react';
import { buildTripRouteSummary, formatUsdAsCurrency } from '../lib/tripDetailsPageHelpers';

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
  onShareTrip,
  onPublishTrip,
  onEditPublishedContent,
  onSetCoverPage,
  onDuplicateTrip,
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
  const { readOnly } = useTripAccess();
  const routeSummary = buildTripRouteSummary(trip?.destination, trip?.locations);

  return (
    <header className="trip-details__header">
      <div className="trip-details__header-main">
        <div className="trip-details__left-cluster">
          <div className="trip-details__brand">
            <Link to="/" className="trip-details__logo" aria-label="Back to My Trips">
              @
            </Link>
            <div className="trip-details__trip-info" ref={titleDropdownRef}>
              {titleEditing && !readOnly ? (
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
                  <div className="trip-details__title-line">
                    <button
                      type="button"
                      className="trip-details__title-btn"
                      onClick={() => {
                        const now = Date.now();
                        if (!readOnly && now - titleLastClickRef.current < 400) {
                          setTitleEditValue(titleDisplay);
                          setTitleEditing(true);
                          setTitleDropdownOpen(false);
                        } else {
                          setTitleDropdownOpen((o) => !o);
                        }
                        titleLastClickRef.current = now;
                      }}
                      onDoubleClick={(e) => {
                        if (readOnly) return;
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
                    {readOnly && (
                      <span
                        className="trip-details__collab-badge"
                        role="status"
                        title="You can view this trip but cannot edit it"
                      >
                        View only
                      </span>
                    )}
                  </div>
                  {titleDropdownOpen && (
                    <div className="trip-details__title-dropdown" role="menu">
                      <button
                        type="button"
                        className="trip-details__title-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setTitleDropdownOpen(false);
                          onShareTrip?.();
                        }}
                      >
                        Share link
                      </button>
                      {!readOnly && (
                        <button
                          type="button"
                          className="trip-details__title-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setTitleDropdownOpen(false);
                            onPublishTrip?.();
                          }}
                        >
                          {trip?.published && trip?.visibility === 'public' ? 'Make private' : 'Publish to Explore'}
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          className="trip-details__title-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setTitleDropdownOpen(false);
                            onSetCoverPage?.();
                          }}
                        >
                          Set cover page
                        </button>
                      )}
                      {!readOnly && trip?.published && trip?.visibility === 'public' ? (
                        <button
                          type="button"
                          className="trip-details__title-dropdown-item"
                          role="menuitem"
                          onClick={() => {
                            setTitleDropdownOpen(false);
                            onEditPublishedContent?.();
                          }}
                        >
                          Edit published content
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="trip-details__title-dropdown-item"
                        role="menuitem"
                        onClick={() => {
                          setTitleDropdownOpen(false);
                          onDuplicateTrip?.();
                        }}
                      >
                        Duplicate
                      </button>
                      {!readOnly && (
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
                          Rename
                        </button>
                      )}
                      {!readOnly && (
                        <button
                          type="button"
                          className="trip-details__title-dropdown-item trip-details__title-dropdown-item--danger"
                          role="menuitem"
                          onClick={() => {
                            setTitleDropdownOpen(false);
                            onRequestDeleteTrip();
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
              <div className="trip-details__spent-row">
                <p className="trip-details__spent" aria-label="Current spent amount">
                  <span className="trip-details__spent-label">Spent</span>
                  <span className="trip-details__spent-value">{formatUsdAsCurrency(spent, currency, exchangeRates)}</span>
                </p>
                <button
                  type="button"
                  className="trip-details__details-btn"
                  onClick={onBudgetDetailsClick}
                  aria-label="Open budget details"
                >
                  View details
                </button>
              </div>
            </div>
          </div>

          <div className="trip-details__center">
            <button
              type="button"
              className="trip-details__pill trip-details__pill--btn trip-details__pill--primary"
              onClick={readOnly ? undefined : onOpenWhereModal}
              disabled={readOnly}
              aria-label="Change destination"
            >
              <span className="trip-details__pill-label">Where</span>
              <span className="trip-details__pill-value">{routeSummary.displayLocations || trip.locations || trip.destination}</span>
              {!readOnly && <ChevronDown size={14} aria-hidden />}
            </button>
            <button
              type="button"
              className="trip-details__pill trip-details__pill--btn"
              onClick={readOnly ? undefined : onOpenDateModal}
              disabled={readOnly}
              aria-label="Change dates"
            >
              <span className="trip-details__pill-label">When</span>
              <span className="trip-details__pill-value">{displayDatesLabel}</span>
            </button>
            <div className="trip-details__currency-wrap">
              <button
                type="button"
                className="trip-details__pill trip-details__pill--btn trip-details__currency-btn"
                onClick={readOnly ? undefined : onOpenCurrencyModal}
                disabled={readOnly}
                aria-label="Change currency"
              >
                <span className="trip-details__pill-label">Budget</span>
                <span className="trip-details__pill-value">{currency}</span>
                {!readOnly && <ChevronDown size={14} aria-hidden />}
              </button>
            </div>
          </div>
        </div>

        <div className="trip-details__actions">
          <button
            type="button"
            className="trip-details__icon-btn"
            aria-label="Notes & Documents"
            title="Notes & Documents"
            onClick={onOpenNotesModal}
          >
            <BookOpen size={18} aria-hidden />
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
          <button
            type="button"
            className="trip-details__icon-btn"
            onClick={() => navigate(`/trip/${tripId}/moodboard`)}
            title="Moodboard"
            aria-label="Moodboard"
          >
            <Image size={18} />
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
          <button type="button" className="trip-details__icon-btn" aria-label="Share" onClick={onShareTrip}>
            <Share2 size={18} aria-hidden />
          </button>
        </div>
      </div>

    </header>
  );
}
