import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Heart,
  Search,
  Star,
  Ticket,
  X,
} from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import TripMap from '../../TripMap/TripMap';
import {
  EXPERIENCE_DURATIONS,
  EXPERIENCE_PRICE_RANGES,
  EXPERIENCE_SORT_OPTIONS,
  EXPERIENCE_TYPES,
  getDefaultStartTimeForDate,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddExperiencesModal({
  trip,
  days,
  cityQuery,
  destinationLabel,
  mapCenter,
  allDayNums,
  filteredExperiences,
  experienceDetailsView,
  setExperienceDetailsView,
  experienceDetailsTab,
  setExperienceDetailsTab,
  experienceSearchQuery,
  setExperienceSearchQuery,
  experienceTypeFilter,
  setExperienceTypeFilter,
  experiencePriceRange,
  setExperiencePriceRange,
  experienceDurationFilter,
  setExperienceDurationFilter,
  experienceSortBy,
  setExperienceSortBy,
  addExperiencesDay,
  discoveryError,
  discoveryLoading,
  discoveryData,
  tripExpenseItems,
  setBookingExperience,
  setBookingOption,
  setBookingDate,
  setBookingStartTime,
  setBookingTravellers,
  setBookingNotes,
  setExperienceBookingModalOpen,
  openAddToTripFromMapMarker,
  openAddPlacesDetailsFromMapMarker,
  resetMapDays,
  setMapDayFilterOpen,
  setCustomExperienceName,
  setCustomExperienceType,
  setCustomExperienceAddress,
  setCustomExperienceDateKey,
  setCustomExperienceStartTime,
  setCustomExperienceDurationHrs,
  setCustomExperienceDurationMins,
  setCustomExperienceNote,
  setCustomExperienceCost,
  setCustomExperienceExternalLink,
  setCustomExperienceTravelDocs,
  setAddCustomExperienceOpen,
  onCloseExperienceBackdrop,
  onCloseExperienceListHeader,
  onBackExperienceDetail,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const showingExperienceDetail = experienceDetailsView != null;
  const experiences = filteredExperiences;
  const experienceMapMarkers = experiences
    .filter((experience) => experience.lat != null && experience.lng != null)
    .map((experience, index) => ({
      id: experience.id,
      sourceId: experience.id,
      markerType: 'experience',
      name: experience.name,
      lat: experience.lat,
      lng: experience.lng,
      dayNum: (index % Math.max(days.length, 1)) + 1,
      address: experience.address || cityQuery,
      rating: experience.rating,
      reviewCount: experience.reviewCount,
      image: experience.image,
      website: experience.website || '',
      originalData: experience,
    }));

  return (
    <>
      <button
        type="button"
        className="trip-details__modal-backdrop"
        aria-label="Close"
        onClick={onCloseExperienceBackdrop}
      />
      <div
        className="trip-details__add-places-modal trip-details__add-places-modal--theme"
        role="dialog"
        aria-labelledby={showingExperienceDetail ? 'experience-detail-title' : 'add-experiences-title'}
        aria-modal="true"
      >
        {showingExperienceDetail ? (
          <div className="trip-details__add-places-body">
            <div className="trip-details__place-detail-panel">
              <div className="trip-details__place-detail-header">
                <button
                  type="button"
                  className="trip-details__place-detail-back"
                  onClick={onBackExperienceDetail}
                  aria-label="Back to list"
                >
                  <ArrowLeft size={20} aria-hidden /> Back
                </button>
                <button
                  type="button"
                  className="trip-details__place-detail-close"
                  aria-label="Close"
                  onClick={onCloseExperienceBackdrop}
                >
                  <X size={20} aria-hidden />
                </button>
                <h1 id="experience-detail-title" className="trip-details__place-detail-name">
                  {experienceDetailsView.name}
                </h1>
                <div className="trip-details__place-detail-meta">
                  <span className="trip-details__place-detail-rating">
                    <Star size={16} fill="currentColor" aria-hidden /> {experienceDetailsView.rating} (
                    {experienceDetailsView.reviewCount?.toLocaleString() ?? '0'})
                  </span>
                  <span className="trip-details__place-detail-badge">{experienceDetailsView.type}</span>
                  <span className="trip-details__place-detail-badge">
                    Duration: {experienceDetailsView.duration}
                  </span>
                  <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                    <Heart size={20} aria-hidden />
                  </button>
                </div>
              </div>
              <div className="trip-details__place-detail-hero">
                <img
                  src={resolveImageUrl(experienceDetailsView.image, experienceDetailsView.name, 'activity')}
                  alt=""
                  className="trip-details__place-detail-img"
                  onError={handleImageError}
                />
              </div>
              <div className="trip-details__place-detail-tabs">
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${experienceDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setExperienceDetailsTab('overview')}
                >
                  Overview
                </button>
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${experienceDetailsTab === 'booking' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setExperienceDetailsTab('booking')}
                >
                  Package Options
                </button>
                <button
                  type="button"
                  className={`trip-details__place-detail-tab ${experienceDetailsTab === 'included' ? 'trip-details__place-detail-tab--active' : ''}`}
                  onClick={() => setExperienceDetailsTab('included')}
                >
                  Included / Excluded
                </button>
              </div>
              <div className="trip-details__place-detail-content">
                {experienceDetailsTab === 'overview' ? (
                  <>
                    {experienceDetailsView.description && (
                      <>
                        <h3 className="trip-details__place-detail-section-title">Description</h3>
                        <p className="trip-details__place-detail-overview">{experienceDetailsView.description}</p>
                      </>
                    )}
                    {experienceDetailsView.highlights && experienceDetailsView.highlights.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Highlights</h3>
                        <ul className="trip-details__place-detail-hours">
                          {experienceDetailsView.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {experienceDetailsView.address && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Address</h3>
                        <p className="trip-details__place-detail-section-text">{experienceDetailsView.address}</p>
                      </div>
                    )}
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Review</h3>
                      <p className="trip-details__place-detail-section-text">
                        <Star size={14} fill="currentColor" aria-hidden /> {experienceDetailsView.rating} (
                        {experienceDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)
                      </p>
                    </div>
                  </>
                ) : experienceDetailsTab === 'booking' ? (
                  <>
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Booking Options</h3>
                      <p className="trip-details__place-detail-section-text">
                        The operator will reach out to you after purchase nearing your dates.
                      </p>

                      {experienceDetailsView.bookingOptions && experienceDetailsView.bookingOptions.length > 0 && (
                        <div style={{ marginTop: '16px' }}>
                          {experienceDetailsView.bookingOptions.map((option) => (
                            <div
                              key={option.id}
                              style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '8px',
                                padding: '16px',
                                marginBottom: '12px',
                              }}
                            >
                              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
                                {option.type} - {option.option}
                              </h4>
                              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                                {option.description}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                  <span style={{ fontSize: '20px', fontWeight: '700' }}>
                                    {experienceDetailsView.currency}
                                    {option.price.toFixed(2)}
                                  </span>
                                  {option.originalPrice && (
                                    <span
                                      style={{
                                        fontSize: '14px',
                                        color: '#9ca3af',
                                        textDecoration: 'line-through',
                                        marginLeft: '8px',
                                      }}
                                    >
                                      {experienceDetailsView.currency}
                                      {option.originalPrice.toFixed(2)}
                                    </span>
                                  )}
                                  <span style={{ fontSize: '12px', color: '#6b7280', marginLeft: '4px' }}>
                                    / traveller
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  className="trip-details__place-detail-add-btn"
                                  style={{ padding: '8px 16px' }}
                                  onClick={() => {
                                    const day = days.find((d) => d.dayNum === addExperiencesDay) || days[0];
                                    const selectedDate = day?.date || '';
                                    const parsedDurationHours = Number(experienceDetailsView?.durationHours);
                                    const bookingDurationMins = Math.max(
                                      1,
                                      Math.round(
                                        (Number.isFinite(parsedDurationHours) && parsedDurationHours > 0
                                          ? parsedDurationHours
                                          : 2) * 60,
                                      ),
                                    );
                                    setBookingExperience(experienceDetailsView);
                                    setBookingOption(option);
                                    setBookingDate(selectedDate);
                                    setBookingStartTime(
                                      getDefaultStartTimeForDate(
                                        tripExpenseItems,
                                        selectedDate,
                                        '07:00',
                                        bookingDurationMins,
                                      ),
                                    );
                                    setBookingTravellers(2);
                                    setBookingNotes('');
                                    setExperienceBookingModalOpen(true);
                                  }}
                                >
                                  Add to Trip
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {experienceDetailsView.importantInfo && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Important Information</h3>
                        <p className="trip-details__place-detail-section-text">{experienceDetailsView.importantInfo}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {experienceDetailsView.included && experienceDetailsView.included.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">What's Included</h3>
                        <ul className="trip-details__place-detail-hours">
                          {experienceDetailsView.included.map((item, idx) => (
                            <li key={idx} style={{ color: '#059669' }}>
                              ✓ {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {experienceDetailsView.excluded && experienceDetailsView.excluded.length > 0 && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">What's Excluded</h3>
                        <ul className="trip-details__place-detail-hours">
                          {experienceDetailsView.excluded.map((item, idx) => (
                            <li key={idx} style={{ color: '#dc2626' }}>
                              ✗ {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {experienceDetailsView.cancellationPolicy && (
                      <div className="trip-details__place-detail-section">
                        <h3 className="trip-details__place-detail-section-title">Cancellation Policy</h3>
                        <p className="trip-details__place-detail-section-text">
                          {experienceDetailsView.cancellationPolicy}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className="trip-details__add-places-map-panel">
              <div className="trip-details__add-places-map">
                <TripMap
                  center={
                    experienceDetailsView.lat && experienceDetailsView.lng
                      ? [experienceDetailsView.lat, experienceDetailsView.lng]
                      : mapCenter
                  }
                  zoom={12}
                  markers={
                    experienceDetailsView.lat && experienceDetailsView.lng
                      ? [
                          {
                            id: experienceDetailsView.id,
                            sourceId: experienceDetailsView.id,
                            markerType: 'experience',
                            name: experienceDetailsView.name,
                            lat: experienceDetailsView.lat,
                            lng: experienceDetailsView.lng,
                            dayNum: 1,
                            image: experienceDetailsView.image,
                            address: experienceDetailsView.address || cityQuery,
                            rating: experienceDetailsView.rating,
                            reviewCount: experienceDetailsView.reviewCount,
                            website: experienceDetailsView.website || '',
                            originalData: experienceDetailsView,
                          },
                        ]
                      : []
                  }
                  activeDayNums={allDayNums}
                  className="trip-details__add-places-trip-map"
                  fitBounds={false}
                  popupMode="hover-preview"
                  onMarkerAddClick={openAddToTripFromMapMarker}
                  onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                />
              </div>
              <button
                type="button"
                className="trip-details__add-places-filter-days"
                onClick={() => {
                  resetMapDays();
                  setMapDayFilterOpen(true);
                }}
              >
                <CalendarIcon size={16} aria-hidden /> Filter days
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="trip-details__add-places-head">
              <h2 id="add-experiences-title" className="trip-details__add-places-title">
                Add Experiences
              </h2>
              <div className="trip-details__add-places-location">
                <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
                <span>{trip.locations || trip.destination}</span>
              </div>
              <button
                type="button"
                className="trip-details__modal-close trip-details__add-places-close"
                aria-label="Close"
                onClick={onCloseExperienceListHeader}
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
                    placeholder="Search by experience name..."
                    value={experienceSearchQuery}
                    onChange={(e) => setExperienceSearchQuery(e.target.value)}
                    aria-label="Search experiences"
                  />
                </div>

                <div className="trip-details__add-food-toolbar">
                  <p className="trip-details__add-places-results">{experiences.length} results found</p>
                  <div className="trip-details__add-food-toolbar-actions">
                    <select
                      className="trip-details__add-places-sort-select"
                      value={experienceTypeFilter}
                      onChange={(e) => setExperienceTypeFilter(e.target.value)}
                      aria-label="Filter by experience type"
                    >
                      {EXPERIENCE_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-details__add-places-sort-select"
                      value={experiencePriceRange}
                      onChange={(e) => setExperiencePriceRange(e.target.value)}
                      aria-label="Filter by price range"
                    >
                      {EXPERIENCE_PRICE_RANGES.map((range) => (
                        <option key={range} value={range}>
                          {range}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-details__add-places-sort-select"
                      value={experienceDurationFilter}
                      onChange={(e) => setExperienceDurationFilter(e.target.value)}
                      aria-label="Filter by duration"
                    >
                      {EXPERIENCE_DURATIONS.map((duration) => (
                        <option key={duration} value={duration}>
                          Duration: {duration}
                        </option>
                      ))}
                    </select>
                    <select
                      className="trip-details__add-places-sort-select"
                      value={experienceSortBy}
                      onChange={(e) => setExperienceSortBy(e.target.value)}
                      aria-label="Sort experiences"
                    >
                      {EXPERIENCE_SORT_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          Sort by: {option}
                        </option>
                      ))}
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
                  <p className="trip-details__add-places-results">
                    Loading live experiences for {destinationLabel}...
                  </p>
                )}

                <div className="trip-details__add-places-grid">
                  <button
                    type="button"
                    className="trip-details__add-places-card trip-details__add-places-card--manual"
                    onClick={() => {
                      const day = days.find((d) => d.dayNum === addExperiencesDay);
                      const selectedDate = day?.date || days[0]?.date || '';
                      setCustomExperienceName('');
                      setCustomExperienceType('Attraction');
                      setCustomExperienceAddress('');
                      setCustomExperienceDateKey(selectedDate);
                      setCustomExperienceStartTime(
                        getDefaultStartTimeForDate(tripExpenseItems, selectedDate, '07:00', 120),
                      );
                      setCustomExperienceDurationHrs(2);
                      setCustomExperienceDurationMins(0);
                      setCustomExperienceNote('');
                      setCustomExperienceCost('');
                      setCustomExperienceExternalLink('');
                      setCustomExperienceTravelDocs([]);
                      setAddCustomExperienceOpen(true);
                    }}
                  >
                    <div className="trip-details__add-places-card-manual-icon">
                      <Ticket size={24} aria-hidden />
                    </div>
                    <span className="trip-details__add-places-card-manual-text">
                      Can&apos;t find what you need? Add manually.
                    </span>
                  </button>

                  {experiences.map((experience) => (
                    <div
                      key={experience.id}
                      className="trip-details__add-places-card"
                      onClick={() => setExperienceDetailsView(experience)}
                      role="button"
                      tabIndex={0}
                      style={{ cursor: 'pointer' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setExperienceDetailsView(experience);
                        }
                      }}
                    >
                      <img
                        src={resolveImageUrl(experience.image, experience.name, 'activity')}
                        alt=""
                        className="trip-details__add-places-card-img"
                        onError={handleImageError}
                      />
                      <button
                        type="button"
                        className="trip-details__add-places-card-heart"
                        aria-label="Save to wishlist"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Heart size={18} fill="none" aria-hidden />
                      </button>
                      <div className="trip-details__add-places-card-info">
                        <span
                          className="trip-details__place-detail-badge"
                          style={{ marginBottom: '4px', display: 'inline-block' }}
                        >
                          {experience.type}
                        </span>
                        <span className="trip-details__add-places-card-name">{experience.name}</span>
                        <div className="trip-details__add-food-card-meta">
                          <span>
                            <Star size={14} fill="currentColor" aria-hidden style={{ verticalAlign: 'middle' }} />{' '}
                            {experience.rating} ({experience.reviewCount?.toLocaleString() ?? '0'})
                          </span>
                          <span>
                            <Clock size={14} aria-hidden style={{ verticalAlign: 'middle' }} />{' '}
                            {experience.duration}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: '8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <div>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: '#16a34a' }}>
                              {experience.currency}
                              {experience.price.toFixed(2)}
                            </span>
                            {experience.originalPrice && (
                              <span
                                style={{
                                  fontSize: '12px',
                                  color: '#9ca3af',
                                  textDecoration: 'line-through',
                                  marginLeft: '4px',
                                }}
                              >
                                {experience.currency}
                                {experience.originalPrice.toFixed(2)}
                              </span>
                            )}
                            <span style={{ fontSize: '11px', color: '#6b7280', display: 'block' }}>
                              / traveller
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {!discoveryLoading && !discoveryError && experiences.length === 0 && (
                  <p className="trip-details__add-places-results">
                    No experiences found for this destination yet. Try adjusting filters.
                  </p>
                )}
              </div>
              <div className="trip-details__add-places-map-panel">
                <div className="trip-details__add-places-map">
                  <TripMap
                    center={mapCenter}
                    zoom={11}
                    markers={experienceMapMarkers}
                    activeDayNums={allDayNums}
                    className="trip-details__add-places-trip-map"
                    fitBounds={experienceMapMarkers.length > 0}
                    popupMode="hover-preview"
                    onMarkerAddClick={openAddToTripFromMapMarker}
                    onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                  />
                </div>
                <button
                  type="button"
                  className="trip-details__add-places-filter-days"
                  onClick={() => {
                    resetMapDays();
                    setMapDayFilterOpen(true);
                  }}
                >
                  <CalendarIcon size={16} aria-hidden /> Filter days
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
