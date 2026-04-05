import { ChevronDown, MoreVertical } from 'lucide-react';
import { applyImageFallback } from '../../../lib/imageFallback';
import { resolveDashboardTripImage, getTripDestinationQuery, getStatusClass, TRIP_STATUS_OPTIONS } from '../lib/dashboardTripUtils';
import './DashboardTripCard.css';

export default function DashboardTripCard({
  trip,
  tripStatuses,
  openOwnerMenuId,
  openStatusDropdownId,
  ownerMenuRef,
  statusDropdownRef,
  destinationCoverByQuery,
  setOpenOwnerMenuId,
  setOpenStatusDropdownId,
  setTripStatus,
  handleItineraryOwnerMenu,
  onOpenTrip,
}) {
  const resolvedStatus = tripStatuses[trip.id] ?? trip.status;

  return (
    <li
      className={`trip-card${openOwnerMenuId === trip.id || openStatusDropdownId === trip.id ? ' trip-card--active' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpenTrip(trip.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenTrip(trip.id);
        }
      }}
    >
      <div className="trip-card__image-wrap">
        <div className="trip-card__image-crop">
          <img
            src={resolveDashboardTripImage(trip, destinationCoverByQuery[getTripDestinationQuery(trip.raw)] || '')}
            alt=""
            className="trip-card__image"
            onError={(event) => applyImageFallback(event, trip.title || 'Trip cover', 'trip')}
          />
        </div>
        {trip.flagImage?.url ? (
          <img
            src={trip.flagImage.url}
            alt={`${trip.flagImage.countryName} flag`}
            className="trip-card__flag"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div
          className="trip-card__owner-menu"
          ref={openOwnerMenuId === trip.id ? ownerMenuRef : null}
        >
          <button
            type="button"
            className="trip-card__owner-more"
            aria-label="Trip options"
            aria-expanded={openOwnerMenuId === trip.id}
            onClick={(e) => {
              e.stopPropagation();
              setOpenOwnerMenuId((id) => (id === trip.id ? null : trip.id));
            }}
          >
            <MoreVertical size={18} aria-hidden />
          </button>
          {openOwnerMenuId === trip.id && (
            <div className="trip-card__owner-dropdown" role="menu">
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'share');
                }}
              >
                Share
              </button>
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'publish');
                }}
              >
                {trip.isPublishedToCommunity ? 'Make private' : 'Publish to Explore'}
              </button>
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'set-cover-page');
                }}
              >
                Set cover page
              </button>
              {trip.isPublishedToCommunity ? (
                <button
                  type="button"
                  role="menuitem"
                  className="trip-card__owner-option"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenOwnerMenuId(null);
                    handleItineraryOwnerMenu(trip.raw, 'edit-published-content');
                  }}
                >
                  Edit published content
                </button>
              ) : null}
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'duplicate');
                }}
              >
                Duplicate
              </button>
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'rename');
                }}
              >
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                className="trip-card__owner-option trip-card__owner-option--danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenOwnerMenuId(null);
                  handleItineraryOwnerMenu(trip.raw, 'delete');
                }}
              >
                Delete
              </button>
            </div>
          )}
        </div>
        <div className="trip-card__status-wrap" ref={openStatusDropdownId === trip.id ? statusDropdownRef : null}>
          <button
            type="button"
            className={`trip-card__status-btn ${getStatusClass(resolvedStatus)}`}
            onClick={(e) => {
              e.stopPropagation();
              setOpenStatusDropdownId((id) => (id === trip.id ? null : trip.id));
            }}
            aria-expanded={openStatusDropdownId === trip.id}
            aria-haspopup="listbox"
            aria-label={`Trip status: ${trip.title}, ${resolvedStatus}`}
          >
            <span className="trip-card__status-btn-text">{resolvedStatus}</span>
            <ChevronDown size={14} className="trip-card__status-chevron" aria-hidden />
          </button>
          {openStatusDropdownId === trip.id && (
            <div className="trip-card__status-dropdown" role="listbox">
              {TRIP_STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="option"
                  aria-selected={resolvedStatus === opt.value}
                  className={`trip-card__status-option ${opt.optionClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setTripStatus(trip.id, opt.value);
                  }}
                >
                  <span className="trip-card__status-dot" style={{ backgroundColor: opt.dotColor }} aria-hidden />
                  <span className="trip-card__status-option-text">{opt.value}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="trip-card__body">
        <h3 className="trip-card__title">{trip.title}</h3>
        {trip.isSharedWithMe ? (
          <span className="trip-card__shared-badge">Shared with me</span>
        ) : null}
        {trip.isPublishedToCommunity ? (
          <span className="trip-card__published-badge">Published</span>
        ) : null}
        <p className="trip-card__dates">{trip.dateLabel}</p>
      </div>
    </li>
  );
}
