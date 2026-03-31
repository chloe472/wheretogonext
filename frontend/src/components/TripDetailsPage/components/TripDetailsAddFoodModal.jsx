import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ExternalLink,
  Heart,
  Search,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import TripMap from '../../TripMap/TripMap';
import {
  FOOD_FILTER_OPTIONS,
  FOOD_SORT_OPTIONS,
  getDefaultStartTimeForDate,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddFoodModal({
  trip,
  days,
  cityQuery,
  destinationLabel,
  mapCenter,
  allDayNums,
  filteredFoods,
  foodDetailsView,
  setFoodDetailsView,
  foodDetailsTab,
  setFoodDetailsTab,
  foodSearchQuery,
  setFoodSearchQuery,
  foodDietaryFilter,
  setFoodDietaryFilter,
  foodSortBy,
  setFoodSortBy,
  addFoodDay,
  discoveryError,
  discoveryLoading,
  discoveryData,
  setCustomFoodName,
  setCustomFoodAddress,
  setCustomFoodAddressSelection,
  setCustomFoodAddressSuggestionsOpen,
  setCustomFoodDateKey,
  setAddCustomFoodOpen,
  tripExpenseItems,
  setAddToTripItem,
  setAddToTripDate,
  setAddToTripStartTime,
  setAddToTripDurationHrs,
  setAddToTripDurationMins,
  setAddToTripNotes,
  setAddToTripCost,
  setAddToTripExternalLink,
  setAddToTripTravelDocs,
  setAddToTripModalOpen,
  openAddToTripFromMapMarker,
  openAddPlacesDetailsFromMapMarker,
  resetMapDays,
  setMapDayFilterOpen,
  onCloseFoodBackdrop,
  onCloseFoodListHeader,
  onBackFoodDetail,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

const showingFoodDetail = foodDetailsView != null;
const showingAnyDetail = showingFoodDetail;
const foodPlaces = filteredFoods;
const foodMapMarkers = foodPlaces
  .filter((place) => place.lat != null && place.lng != null)
  .map((place, index) => ({
    id: place.id,
    sourceId: place.id,
    markerType: 'food',
    name: place.name,
    lat: place.lat,
    lng: place.lng,
    dayNum: (index % Math.max(days.length, 1)) + 1,
    address: place.address || cityQuery,
    rating: place.rating,
    reviewCount: place.reviewCount,
    image: place.image,
    website: place.website || '',
    originalData: place,
  }));

return (
  <>
    <button
      type="button"
      className="trip-details__modal-backdrop"
      aria-label="Close"
      onClick={onCloseFoodBackdrop}
    />
    <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingAnyDetail ? 'food-detail-title' : 'add-food-title'} aria-modal="true">
      {showingFoodDetail ? (
        // Food Detail View
        <div className="trip-details__add-places-body trip-details__add-food-body">
          <div className="trip-details__place-detail-panel">
            <div className="trip-details__place-detail-header">
              <button type="button" className="trip-details__place-detail-back" onClick={onBackFoodDetail} aria-label="Back to list">
                <ArrowLeft size={20} aria-hidden /> Back
              </button>
              <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={onCloseFoodBackdrop}>
                <X size={20} aria-hidden />
              </button>
              <h1 id="food-detail-title" className="trip-details__place-detail-name">{foodDetailsView.name}</h1>
              <div className="trip-details__place-detail-meta">
                <span className="trip-details__place-detail-rating">
                  <Star size={16} fill="currentColor" aria-hidden /> {foodDetailsView.rating} ({foodDetailsView.reviewCount?.toLocaleString() ?? '0'})
                </span>
                <span className="trip-details__place-detail-badge">{foodDetailsView.priceLevel}</span>
                <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                  <Heart size={20} aria-hidden />
                </button>
              </div>
            </div>
            <div className="trip-details__place-detail-hero">
              <img src={resolveImageUrl(foodDetailsView.image, foodDetailsView.name, 'restaurant')} alt="" className="trip-details__place-detail-img" onError={handleImageError} />
            </div>
            <div className="trip-details__place-detail-tabs">
              <button type="button" className={`trip-details__place-detail-tab ${foodDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setFoodDetailsTab('overview')}>Overview</button>
            </div>
            <div className="trip-details__place-detail-content">
              {foodDetailsTab === 'overview' && (
                <>
                  {foodDetailsView.overview && (
                    <p className="trip-details__place-detail-overview">{foodDetailsView.overview}<span className="trip-details__place-detail-read-more"> Read more</span></p>
                  )}
                  <div className="trip-details__place-detail-add-wrap">
                    <button
                      type="button"
                      className="trip-details__place-detail-add-btn"
                      onClick={() => {
                        const day = days.find((d) => d.dayNum === addFoodDay);
                        const selectedDate = day?.date || days[0]?.date || '';
                        setAddToTripItem({
                          type: 'food',
                          data: foodDetailsView,
                          categoryId: 'food',
                          category: 'Food & Beverage',
                          Icon: UtensilsCrossed,
                        });
                        setAddToTripDate(selectedDate);
                        setAddToTripStartTime(getDefaultStartTimeForDate(tripExpenseItems, selectedDate, '07:00'));
                        setAddToTripDurationHrs('1');
                        setAddToTripDurationMins('0');
                        setAddToTripNotes('');
                        setAddToTripCost('');
                        setAddToTripExternalLink(foodDetailsView.website || '');
                        setAddToTripTravelDocs([]);
                        setAddToTripModalOpen(true);
                      }}
                    >
                      Add to trip
                    </button>
                  </div>
                  {Array.isArray(foodDetailsView.whyVisit) && foodDetailsView.whyVisit.length > 0 && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Why you should visit</h3>
                      <ul className="trip-details__place-detail-hours">
                        {foodDetailsView.whyVisit.map((reason, idx) => (
                          <li key={`food-visit-${idx}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {foodDetailsView.address && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Address</h3>
                      <p className="trip-details__place-detail-section-text">{foodDetailsView.address}</p>
                    </div>
                  )}
                  {(foodDetailsView.hours && Object.keys(foodDetailsView.hours).length > 0) && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Hours of operation</h3>
                      {foodDetailsView.isOpenNow != null && (
                        <p className={`trip-details__place-detail-status ${foodDetailsView.isOpenNow ? 'trip-details__place-detail-status--open' : 'trip-details__place-detail-status--closed'}`}>
                          {foodDetailsView.isOpenNow ? 'Open Now' : 'Closed Now'}
                        </p>
                      )}
                      <ul className="trip-details__place-detail-hours">
                        {Object.entries(foodDetailsView.hours).map(([day, hrs]) => (
                          <li key={`food-hour-${day}`}>{day}: {hrs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {foodDetailsView.website && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Website</h3>
                      <a href={foodDetailsView.website} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                        {foodDetailsView.website.replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  )}
                  {foodDetailsView.dietaryTags?.length > 0 && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Dietary Options</h3>
                      <div className="trip-details__add-food-card-badges">
                        {foodDetailsView.dietaryTags.map((tag) => (
                          <span key={tag} className="trip-details__add-food-card-badge">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="trip-details__place-detail-section">
                    <h3 className="trip-details__place-detail-section-title">Review</h3>
                    <p className="trip-details__place-detail-section-text">
                      <Star size={14} fill="currentColor" aria-hidden /> {foodDetailsView.rating} ({foodDetailsView.reviewCount?.toLocaleString() ?? '0'} reviews)
                      {foodDetailsView.googleMapsReviewUrl && (
                        <>
                          {' · '}
                          <a href={foodDetailsView.googleMapsReviewUrl} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                            Leave a review / Google Maps reviews
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="trip-details__add-places-map-panel">
            <div className="trip-details__add-places-map">
              <TripMap
                center={foodDetailsView.lat && foodDetailsView.lng ? [foodDetailsView.lat, foodDetailsView.lng] : mapCenter}
                zoom={14}
                markers={[{ id: foodDetailsView.id, sourceId: foodDetailsView.id, markerType: 'food', name: foodDetailsView.name, lat: foodDetailsView.lat, lng: foodDetailsView.lng, dayNum: 1, image: foodDetailsView.image, address: foodDetailsView.address || cityQuery, rating: foodDetailsView.rating, reviewCount: foodDetailsView.reviewCount, website: foodDetailsView.website || '', originalData: foodDetailsView }]}
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
              onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
            >
              <CalendarIcon size={16} aria-hidden /> Filter days
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="trip-details__add-places-head">
            <h2 id="add-food-title" className="trip-details__add-places-title">Add Food &amp; Beverages</h2>
            <div className="trip-details__add-places-location">
              <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
              <span>{trip.locations || trip.destination}</span>
            </div>
            <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={onCloseFoodListHeader}>
              <X size={20} aria-hidden />
            </button>
          </div>
          <div className="trip-details__add-places-body trip-details__add-food-body">
            <div className="trip-details__add-places-list-panel trip-details__add-food-panel">
              <div className="trip-details__add-places-search-wrap">
                <Search size={18} className="trip-details__add-places-search-icon" aria-hidden />
                <input
                  type="text"
                  className="trip-details__add-places-search-input"
                  placeholder="Search by place name..."
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  aria-label="Search food and beverage places"
                />
              </div>

              <div className="trip-details__add-food-toolbar">
                <p className="trip-details__add-places-results">{foodPlaces.length} results found</p>
                <div className="trip-details__add-food-toolbar-actions">
                  <select
                    className="trip-details__add-places-sort-select"
                    value={foodDietaryFilter}
                    onChange={(e) => setFoodDietaryFilter(e.target.value)}
                    aria-label="Filter food and beverage results"
                  >
                    {FOOD_FILTER_OPTIONS.map((filter) => (
                      <option key={filter} value={filter}>{filter}</option>
                    ))}
                  </select>
                  <select
                    className="trip-details__add-places-sort-select"
                    value={foodSortBy}
                    onChange={(e) => setFoodSortBy(e.target.value)}
                    aria-label="Sort food and beverage places"
                  >
                    {FOOD_SORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
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
                <p className="trip-details__add-places-results">Loading live food places for {destinationLabel}...</p>
              )}

              <div className="trip-details__add-places-grid">
                <button
                  type="button"
                  className="trip-details__add-places-card trip-details__add-places-card--manual"
                  onClick={() => {
                    const day = days.find((d) => d.dayNum === addFoodDay);
                    setCustomFoodName('');
                    setCustomFoodAddress('');
                    setCustomFoodAddressSelection(null);
                    setCustomFoodAddressSuggestionsOpen(false);
                    setCustomFoodDateKey(day?.date || days[0]?.date || '');
                    setAddCustomFoodOpen(true);
                  }}
                >
                  <div className="trip-details__add-places-card-manual-icon">
                    <UtensilsCrossed size={24} aria-hidden />
                  </div>
                  <span className="trip-details__add-places-card-manual-text">Can&apos;t find what you need? Add manually.</span>
                </button>

                {foodPlaces.map((foodPlace) => (
                  <div
                    key={foodPlace.id}
                    className="trip-details__add-places-card"
                    onClick={() => setFoodDetailsView(foodPlace)}
                    role="button"
                    tabIndex={0}
                    style={{ cursor: 'pointer' }}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFoodDetailsView(foodPlace); } }}
                  >
                    <img src={resolveImageUrl(foodPlace.image, foodPlace.name, 'restaurant')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                    <button
                      type="button"
                      className="trip-details__add-places-card-heart"
                      aria-label="Save to wishlist"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Heart size={18} fill="none" aria-hidden />
                    </button>
                    <div className="trip-details__add-places-card-info">
                      <span className="trip-details__add-places-card-name">{foodPlace.name}</span>
                      <span className="trip-details__add-places-card-rating">{foodPlace.rating} ({foodPlace.reviewCount?.toLocaleString() ?? '0'})</span>
                      {foodPlace.dietaryTags?.length > 0 && (
                        <div className="trip-details__add-food-card-badges">
                          {foodPlace.dietaryTags.slice(0, 2).map((tag) => (
                            <span key={tag} className="trip-details__add-food-card-badge">{tag}</span>
                          ))}
                        </div>
                      )}
                      <p className="trip-details__add-food-card-address">{foodPlace.priceLevel} · {foodPlace.address}</p>
                    </div>
                  </div>
                ))}
              </div>
              {!discoveryLoading && !discoveryError && foodPlaces.length === 0 && (
                <p className="trip-details__add-places-results">No food places found for this destination yet. Try a broader search or add one manually.</p>
              )}
            </div>
            <div className="trip-details__add-places-map-panel">
              <div className="trip-details__add-places-map">
                <TripMap
                  center={mapCenter}
                  zoom={11}
                  markers={foodMapMarkers}
                  activeDayNums={allDayNums}
                  className="trip-details__add-places-trip-map"
                  fitBounds={foodMapMarkers.length > 0}
                  popupMode="hover-preview"
                  onMarkerAddClick={openAddToTripFromMapMarker}
                  onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
                />
              </div>
              <button
                type="button"
                className="trip-details__add-places-filter-days"
                onClick={() => { resetMapDays(); setMapDayFilterOpen(true); }}
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
