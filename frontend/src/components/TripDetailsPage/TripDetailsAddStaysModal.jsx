import {
  ArrowLeft,
  Check,
  ExternalLink,
  Heart,
  MapPin,
  Search,
  Star,
  X,
} from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../lib/imageFallback';
import TripMap from '../TripMap/TripMap';
import {
  formatStayDateTime,
  formatUsdAsCurrency,
  getStayStarText,
  getStayWindow,
  hasStayBookingData,
  normalizeAttachment,
} from './lib/tripDetailsPageHelpers';

export default function TripDetailsAddStaysModal({
  trip,
  days,
  cityQuery,
  destinationLabel,
  allDayNums,
  filteredStays,
  stayTypeOptions,
  stayDetailsView,
  setStayDetailsView,
  stayDetailsTab,
  setStayDetailsTab,
  staySearchQuery,
  setStaySearchQuery,
  stayTypeFilter,
  setStayTypeFilter,
  stayStarFilter,
  setStayStarFilter,
  staySortBy,
  setStaySortBy,
  discoveryError,
  discoveryLoading,
  discoveryData,
  currency,
  exchangeRates,
  setEditPlaceItem,
  openAddStayToTrip,
  openStayBookingModal,
  onCloseStayBackdrop,
  onCloseStayListHeader,
  onBackStayDetail,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const showingStayDetail = stayDetailsView != null;
  const stayWindow = stayDetailsView ? getStayWindow(stayDetailsView) : null;
  const stayHasBookingData = hasStayBookingData(stayDetailsView);

  const stayMapMarkers = filteredStays
    .filter((stay) => stay.lat != null && stay.lng != null)
    .map((stay, index) => ({
      id: stay.id,
      sourceId: stay.id,
      markerType: 'stay',
      name: stay.name,
      lat: stay.lat,
      lng: stay.lng,
      dayNum: (index % Math.max(days.length, 1)) + 1,
      address: stay.address || cityQuery,
      rating: stay.rating,
      reviewCount: stay.reviewCount,
      image: stay.image,
      originalData: stay,
    }));

  return (
    <>
      <button
        type="button"
        className="trip-details__modal-backdrop"
        aria-label="Close"
        onClick={onCloseStayBackdrop}
      />
      <div
        className="trip-details__add-places-modal trip-details__add-places-modal--theme"
        role="dialog"
        aria-labelledby={showingStayDetail ? 'stay-detail-title' : 'add-stays-title'}
        aria-modal="true"
      >
        {showingStayDetail ? (
          <div className="trip-details__add-places-body">
            <div className="trip-details__place-detail-panel">
              <div className="trip-details__place-detail-header">
                <button
                  type="button"
                  className="trip-details__place-detail-back"
                  onClick={onBackStayDetail}
                  aria-label="Back to list"
                >
                  <ArrowLeft size={20} aria-hidden /> Back
                </button>
                <button
                  type="button"
                  className="trip-details__place-detail-close"
                  aria-label="Close"
                  onClick={onCloseStayBackdrop}
                >
                  <X size={20} aria-hidden />
                </button>
                <h1 id="stay-detail-title" className="trip-details__place-detail-name">
                  {stayDetailsView.name}
                </h1>
                <div className="trip-details__place-detail-meta">
                  <span className="trip-details__place-detail-rating">
                    {[...Array(stayDetailsView.starRating || 5)].map((_, i) => (
                      <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" aria-hidden />
                    ))}
                    <span style={{ marginLeft: '8px' }}>
                      {stayDetailsView.rating} ({stayDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)
                    </span>
                  </span>
                  <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                    <Heart size={20} aria-hidden />
                  </button>
                </div>
                {Array.isArray(stayDetailsView.images) && stayDetailsView.images.length > 0 && (
                  <div className="trip-details__place-detail-gallery">
                    <div className="trip-details__place-detail-gallery-main">
                      <img
                        src={resolveImageUrl(stayDetailsView.images[0], stayDetailsView.name, 'hotel')}
                        alt={stayDetailsView.name}
                        className="trip-details__place-detail-img trip-details__place-detail-img--main"
                        onError={handleImageError}
                      />
                    </div>
                    <div className="trip-details__place-detail-gallery-grid">
                      {stayDetailsView.images.slice(1, 5).map((img, idx) => (
                        <img
                          key={`stay-gallery-${idx}`}
                          src={resolveImageUrl(img, stayDetailsView.name, 'hotel')}
                          alt=""
                          className="trip-details__place-detail-img trip-details__place-detail-img--secondary"
                          onError={handleImageError}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="trip-details__place-detail-tabs">
                {stayHasBookingData && (
                  <button
                    type="button"
                    className={`trip-details__place-detail-tab ${stayDetailsTab === 'booking' ? 'trip-details__place-detail-tab--active' : ''}`}
                    onClick={() => setStayDetailsTab('booking')}
                  >
                    Your booking
                  </button>
                )}
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${stayDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setStayDetailsTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${stayDetailsTab === 'policies' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setStayDetailsTab('policies')}
                >
                  Policies
                </button>
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${stayDetailsTab === 'nearby' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setStayDetailsTab('nearby')}
                >
                  Stays Nearby
                </button>
              </div>
              <div className="trip-details__place-detail-content">
                {stayDetailsTab === 'booking' ? (
                  <>
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Your stay booking</h3>
                      {stayWindow && (
                        <ul className="trip-details__place-detail-list">
                          <li>
                            <strong>Check-in:</strong>{' '}
                            {formatStayDateTime(stayWindow.checkInDate, stayWindow.checkInTime)}
                          </li>
                          <li>
                            <strong>Check-out:</strong>{' '}
                            {formatStayDateTime(stayWindow.checkOutDate, stayWindow.checkOutTime)}
                          </li>
                        </ul>
                      )}
                    </div>
                    {Number(stayDetailsView.total || 0) > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Cost</h3>
                        <p className="trip-details__place-detail-section-text">
                          {formatUsdAsCurrency(Number(stayDetailsView.total), currency, exchangeRates)}
                        </p>
                      </div>
                    )}
                    {String(stayDetailsView.notes || '').trim() && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Notes</h3>
                        <p className="trip-details__place-detail-section-text">{stayDetailsView.notes}</p>
                      </div>
                    )}
                    {String(stayDetailsView.externalLink || '').trim() && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Booking link</h3>
                        <a
                          href={stayDetailsView.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="trip-details__place-detail-link"
                        >
                          {String(stayDetailsView.externalLink).replace(/^https?:\/\//, '')}{' '}
                          <ExternalLink size={14} aria-hidden />
                        </a>
                      </div>
                    )}
                    {Array.isArray(stayDetailsView.attachments) && stayDetailsView.attachments.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Travel documents</h3>
                        <ul className="trip-details__place-detail-list">
                          {stayDetailsView.attachments.map((doc, idx) => {
                            const attachment = normalizeAttachment(doc);
                            if (!attachment) return null;
                            return (
                              <li key={`stay-doc-${idx}`}>
                                {attachment.url ? (
                                  <a
                                    href={attachment.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="trip-details__place-detail-link"
                                  >
                                    {attachment.name}
                                  </a>
                                ) : (
                                  attachment.name
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                    <div
                      className="trip-details__place-detail-section"
                      style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                    >
                      <button
                        type="button"
                        className="trip-details__place-detail-add-btn"
                        onClick={() => setEditPlaceItem(stayDetailsView)}
                      >
                        Edit booking details
                      </button>
                    </div>
                  </>
                ) : stayDetailsTab === 'overview' ? (
                  <>
                    <div
                      className="trip-details__place-detail-section"
                      style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}
                    >
                      <button
                        type="button"
                        className="trip-details__place-detail-add-btn"
                        onClick={() => openAddStayToTrip(stayDetailsView)}
                      >
                        Add to trip
                      </button>
                      <button
                        type="button"
                        className="trip-details__place-detail-book-btn"
                        onClick={() => openStayBookingModal(stayDetailsView)}
                      >
                        Book now
                      </button>
                    </div>
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Overview</h3>
                      <p className="trip-details__place-detail-section-text">
                        {stayDetailsView.overview || stayDetailsView.description}
                      </p>
                    </div>
                    {stayDetailsView.address && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Address</h3>
                        <p className="trip-details__place-detail-section-text">
                          <MapPin size={14} aria-hidden style={{ display: 'inline', marginRight: '6px' }} />
                          {stayDetailsView.address}
                        </p>
                      </div>
                    )}
                    {Array.isArray(stayDetailsView.surrounding) && stayDetailsView.surrounding.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Surrounding</h3>
                        <ul className="trip-details__place-detail-list">
                          {stayDetailsView.surrounding.map((item, idx) => (
                            <li key={idx}>
                              {item.name}: {item.distance}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {Array.isArray(stayDetailsView.amenities) && stayDetailsView.amenities.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">
                          What this accommodation offers
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          {stayDetailsView.amenities.map((amenity, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Check size={16} color="#16a34a" aria-hidden />
                              <span>{amenity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : stayDetailsTab === 'policies' ? (
                  <>
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Hotel Policies</h3>
                      {stayDetailsView.policies && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Check-in
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.checkIn}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Check-out
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.checkOut}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Children and Extra Beds
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.children}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Pets</h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.pets}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Smoking
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.smoking}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Parking
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.parking}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Cancellation Policy
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.cancellation}
                            </p>
                          </div>
                          <div>
                            <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>
                              Payment
                            </h4>
                            <p className="trip-details__place-detail-section-text">
                              {stayDetailsView.policies.payment}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : stayDetailsTab === 'nearby' ? (
                  <div className="trip-details__place-detail-section">
                    <h3 className="trip-details__place-detail-section-title">Stays Nearby</h3>
                    {filteredStays.filter((s) => s.id !== stayDetailsView.id).slice(0, 8).length > 0 ? (
                      <div className="trip-details__place-detail-nearby-grid">
                        {filteredStays
                          .filter((s) => s.id !== stayDetailsView.id)
                          .slice(0, 8)
                          .map((nearStay) => (
                            <button
                              key={nearStay.id}
                              type="button"
                              className="trip-details__place-detail-nearby-card"
                              onClick={() => {
                                setStayDetailsView(nearStay);
                                setStayDetailsTab('overview');
                              }}
                            >
                              <img
                                src={resolveImageUrl(nearStay.image, nearStay.name, 'hotel')}
                                alt=""
                                className="trip-details__place-detail-nearby-img"
                                onError={handleImageError}
                              />
                              <button
                                type="button"
                                className="trip-details__place-detail-nearby-heart"
                                aria-label="Save"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Heart size={16} aria-hidden />
                              </button>
                              <div className="trip-details__place-detail-nearby-info">
                                <span className="trip-details__place-detail-nearby-name">{nearStay.name}</span>
                                <span className="trip-details__place-detail-nearby-rating">
                                  {[...Array(nearStay.starRating || 5)].map((_, i) => (
                                    <Star key={i} size={10} fill="#f59e0b" color="#f59e0b" aria-hidden />
                                  ))}
                                </span>
                                <span className="trip-details__place-detail-nearby-rating">
                                  Hotel class: {getStayStarText(nearStay)}
                                </span>
                              </div>
                            </button>
                          ))}
                      </div>
                    ) : (
                      <p className="trip-details__place-detail-section-text">No nearby stays found.</p>
                    )}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="trip-details__add-places-head">
              <h2 id="add-stays-title" className="trip-details__add-places-title">
                Add Stays
              </h2>
              <div className="trip-details__add-places-location">
                <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                <span>{trip.locations || trip.destination}</span>
              </div>
              <button
                type="button"
                className="trip-details__modal-close trip-details__add-places-close"
                aria-label="Close"
                onClick={onCloseStayListHeader}
              >
                <X size={20} aria-hidden />
              </button>
            </div>
            <div className="trip-details__add-places-body">
              <div className="trip-details__add-places-list-panel">
                <div className="trip-details__add-places-search-wrap">
                  <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                  <input
                    type="text"
                    className="trip-details__add-places-search-input"
                    placeholder="Search by hotel name..."
                    value={staySearchQuery}
                    onChange={(e) => setStaySearchQuery(e.target.value)}
                    aria-label="Search accommodations"
                  />
                </div>

                <div className="trip-details__add-food-toolbar">
                  <p className="trip-details__add-places-results">{filteredStays.length} results found</p>
                  <div className="trip-details__add-food-toolbar-actions">
                    <select
                      className="trip-details__add-places-sort-select"
                      value={stayTypeFilter}
                      onChange={(e) => setStayTypeFilter(e.target.value)}
                      aria-label="Filter by accommodation type"
                    >
                      {stayTypeOptions.map((type) => (
                        <option key={type} value={type}>
                          {type === 'All' ? 'All Types' : type}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-details__add-places-sort-select"
                      value={stayStarFilter}
                      onChange={(e) => setStayStarFilter(e.target.value)}
                      aria-label="Filter by hotel star rating"
                    >
                      <option value="All">All Stars</option>
                      <option value="3">3-star</option>
                      <option value="4">4-star</option>
                      <option value="5">5-star</option>
                    </select>
                    <select
                      className="trip-details__add-places-sort-select"
                      value={staySortBy}
                      onChange={(e) => setStaySortBy(e.target.value)}
                      aria-label="Sort accommodations"
                    >
                      <option value="Recommended">Recommended</option>
                      <option value="Stars: High to Low">Stars: High to Low</option>
                      <option value="Stars: Low to High">Stars: Low to High</option>
                      <option value="Rating: High to Low">Rating: High to Low</option>
                    </select>
                  </div>
                </div>

                {discoveryError && (
                  <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                )}
                {discoveryData?.warning && (
                  <p className="trip-details__add-places-results">{discoveryData.warning}</p>
                )}
                {discoveryLoading && (
                  <p className="trip-details__add-places-results">Loading stays for {destinationLabel}...</p>
                )}

                <div className="trip-details__add-places-grid">
                  {filteredStays.map((stay) => (
                    <button
                      key={stay.id}
                      type="button"
                      className="trip-details__add-places-card"
                      onClick={() => {
                        setStayDetailsView(stay);
                        setStayDetailsTab('overview');
                      }}
                    >
                      <img
                        src={resolveImageUrl(stay.image, stay.name, 'hotel')}
                        alt=""
                        className="trip-details__add-places-card-img"
                        onError={handleImageError}
                      />
                      <span
                        className="trip-details__add-places-card-heart"
                        aria-label="Save"
                        role="presentation"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Heart size={18} fill="none" aria-hidden />
                      </span>
                      <div className="trip-details__add-places-card-info">
                        <span className="trip-details__add-places-card-name">{stay.name}</span>
                        <span className="trip-details__add-places-card-rating">
                          {[...Array(stay.starRating || 5)].map((_, i) => (
                            <Star key={i} size={12} fill="#f59e0b" color="#f59e0b" aria-hidden />
                          ))}
                          <span style={{ marginLeft: '6px' }}>
                            {stay.rating} ({stay.reviewCount?.toLocaleString() ?? '0'})
                          </span>
                        </span>
                        <span className="trip-details__add-places-card-address">{stay.type}</span>
                        <span className="trip-details__add-places-card-price" style={{ fontWeight: '600', color: '#2563eb' }}>
                          Hotel class: {getStayStarText(stay)}
                        </span>
                      </div>
                    </button>
                  ))}
                  {filteredStays.length === 0 && !discoveryLoading && (
                    <p className="trip-details__add-places-results">No stays found. Try adjusting your filters.</p>
                  )}
                </div>
              </div>

              <div className="trip-details__add-places-map-panel">
                <div className="trip-details__add-places-map">
                  <TripMap
                    center={discoveryData?.center || [1.290270, 103.851959]}
                    zoom={13}
                    markers={stayMapMarkers}
                    activeDayNums={allDayNums}
                    className="trip-details__add-places-trip-map"
                    fitBounds={stayMapMarkers.length > 0}
                    popupMode="hover-preview"
                    onMarkerViewDetails={(marker) => {
                      setStayDetailsView(marker.originalData);
                      setStayDetailsTab('overview');
                    }}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
