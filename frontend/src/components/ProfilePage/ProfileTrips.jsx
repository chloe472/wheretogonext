import { ChevronDown, MoreVertical } from 'lucide-react';
import {
  resolveTripCardCoverImage,
  getFlagImageForDestination,
  formatTripCardDateRange,
} from '../../data/tripDestinationMeta';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';
import { TRIP_STATUS_OPTIONS, getStatusClass } from './profileTripCardUtils';

export default function ProfileTrips({
  isSelf,
  trips,
  openOwnerMenuId,
  openStatusDropdownId,
  statusDropdownRef,
  ownerMenuRef,
  tripStatuses,
  onOwnerMenuToggle,
  onStatusToggle,
  onStatusSelect,
  onOwnerAction,
  onTripOpen,
  getTripLink,
}) {
  return (
    <>
      <h2 className="profile-page__section-title">{isSelf ? 'My Trips' : 'Trips'}</h2>
      {trips.length === 0 ? (
        <p className="profile-page__empty">
          {isSelf ? 'No trips yet.' : 'No trips yet for this traveler.'}
        </p>
      ) : (
        <ul className="dashboard__trip-list profile-page__trip-grid">
          {trips.map((trip) => {
            const tripDestination = trip.destination || trip.locations || '';
            const coverImage = resolveTripCardCoverImage(trip, tripDestination);
            const flagImage = getFlagImageForDestination(tripDestination);
            const dateLabel = formatTripCardDateRange(trip?.startDate, trip?.endDate, trip?.dates);
            const isActive = openOwnerMenuId === trip.id || openStatusDropdownId === trip.id;
            return (
              <li
                key={trip.id}
                className={`trip-card${isActive ? ' trip-card--active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => onTripOpen(getTripLink(trip))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onTripOpen(getTripLink(trip));
                  }
                }}
              >
                <div className="trip-card__image-wrap">
                  <div className="trip-card__image-crop">
                    <img
                      src={resolveImageUrl(coverImage)}
                      alt=""
                      className="trip-card__image"
                      onError={(e) => applyImageFallback(e, coverImage)}
                    />
                  </div>
                  {flagImage?.url ? (
                    <img
                      src={flagImage.url}
                      alt={`${flagImage.countryName} flag`}
                      className="trip-card__flag"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : null}
                  {isSelf && (
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
                          onOwnerMenuToggle(trip.id);
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
                              onOwnerAction(trip, 'share');
                            }}
                          >
                            Share link
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOwnerAction(trip, 'publish');
                            }}
                          >
                            {trip.published && trip.visibility === 'public' ? 'Republish to Explore' : 'Publish to Explore'}
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="trip-card__owner-option"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOwnerAction(trip, 'duplicate');
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
                              onOwnerAction(trip, 'rename');
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
                              onOwnerAction(trip, 'delete');
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className="trip-card__status-wrap"
                    ref={openStatusDropdownId === trip.id ? statusDropdownRef : null}
                  >
                    <button
                      type="button"
                      className={`trip-card__status-btn ${getStatusClass(tripStatuses[trip.id] ?? trip.status)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isSelf) return;
                        onStatusToggle(trip.id);
                      }}
                      aria-expanded={openStatusDropdownId === trip.id}
                      aria-haspopup="listbox"
                      aria-label={`Trip status: ${trip.title}, ${tripStatuses[trip.id] ?? trip.status}`}
                    >
                      <span className="trip-card__status-btn-text">{tripStatuses[trip.id] ?? trip.status}</span>
                      <ChevronDown size={14} className="trip-card__status-chevron" aria-hidden />
                    </button>
                    {isSelf && openStatusDropdownId === trip.id && (
                      <div className="trip-card__status-dropdown" role="listbox">
                        {TRIP_STATUS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            role="option"
                            aria-selected={(tripStatuses[trip.id] ?? trip.status) === opt.value}
                            className={`trip-card__status-option ${opt.optionClass}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              onStatusSelect(trip.id, opt.value);
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
                  <h3 className="trip-card__title">{trip.title || 'Untitled trip'}</h3>
                  {trip.published && trip.visibility === 'public' ? (
                    <span className="trip-card__published-badge">Published</span>
                  ) : null}
                  <p className="trip-card__dates">{dateLabel}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
