import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Camera,
  Clock,
  ExternalLink,
  Heart,
  MapPin,
  Route,
  Search,
  Star,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../lib/imageFallback';
import TripMap from '../TripMap/TripMap';
import {
  distanceBetween,
  getDefaultStartTimeForDate,
  PLACE_SORT_OPTIONS,
} from './lib/tripDetailsPageHelpers';

export default function TripDetailsAddPlacesModal({
  trip,
  days,
  cityQuery,
  destinationLabel,
  mapCenter,
  allDayNums,
  placeDetailsView,
  setPlaceDetailsView,
  itineraryDetailsView,
  selectedPlaceMarkerId,
  setSelectedPlaceMarkerId,
  filteredPlaces,
  addEntireItineraryToTrip,
  openItineraryPlaceDetails,
  openAddToTripFromMapMarker,
  openAddPlacesDetailsFromMapMarker,
  resetMapDays,
  setMapDayFilterOpen,
  discoveryError,
  discoveryLoading,
  placeSearchQuery,
  setPlaceSearchQuery,
  pagedPlaces,
  addPlacesPage,
  setAddPlacesPage,
  addPlacesTotalPages,
  placeSortBy,
  setPlaceSortBy,
  addPlacesDay,
  setCustomPlaceName,
  setCustomPlaceAddress,
  setCustomPlaceAddressSelection,
  setCustomPlaceAddressSuggestionsOpen,
  setCustomPlaceDateKey,
  setAddCustomPlaceOpen,
  placeDetailsTab,
  setPlaceDetailsTab,
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
  onCloseBackdrop,
  onCloseItineraryHeader,
  onCloseListHeader,
  onClosePlaceDetailHeader,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

const showingPlaceDetail = placeDetailsView != null;
const showingItineraryDetail = itineraryDetailsView != null;
const showingAnyDetail = showingPlaceDetail || showingItineraryDetail;
const detailPlace = showingPlaceDetail ? placeDetailsView : null;
const nearbyPlaces = detailPlace
  ? filteredPlaces
    .filter((p) => p.id !== detailPlace.id && p.lat != null && p.lng != null)
    .map((p) => ({ ...p, dist: distanceBetween(detailPlace, p) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 6)
  : [];
const itineraryPlaces = showingItineraryDetail && itineraryDetailsView
  ? (Array.isArray(itineraryDetailsView.places) ? itineraryDetailsView.places : []).map((place, index) => {
    const dayNumValue = Number(place?.dayNum || place?.day || Math.floor(index / 3) + 1);
    return {
      ...place,
      id: place?.id || `${itineraryDetailsView.id || 'smart-itinerary'}-place-${index + 1}`,
      dayNum: Number.isFinite(dayNumValue) && dayNumValue > 0 ? dayNumValue : 1,
    };
  })
  : [];
const itineraryDayGroups = showingItineraryDetail
  ? (() => {
    const plannedDays = Math.max(1, Number(itineraryDetailsView?.dayCount || days.length || 1));
    const base = {};
    for (let d = 1; d <= plannedDays; d += 1) {
      base[d] = {
        dayNum: d,
        title: `Exploring ${cityQuery} - Day ${d}`,
        places: [],
      };
    }
    itineraryPlaces.forEach((place) => {
      const dayNum = Number(place.dayNum || 1);
      if (!base[dayNum]) {
        base[dayNum] = {
          dayNum,
          title: `Exploring ${cityQuery} - Day ${dayNum}`,
          places: [],
        };
      }
      if (place.dayTitle) base[dayNum].title = place.dayTitle;
      base[dayNum].places.push(place);
    });
    return Object.values(base).sort((a, b) => a.dayNum - b.dayNum);
  })()
  : [];
const selectedItineraryPlace = itineraryPlaces.find((place) => String(place.id) === String(selectedPlaceMarkerId)) || null;

const mapPlaces = showingPlaceDetail && detailPlace
  ? [detailPlace, ...nearbyPlaces].filter((p) => p && p.lat != null && p.lng != null)
  : showingItineraryDetail
    ? itineraryPlaces
    : filteredPlaces;
const addPlacesMarkers = mapPlaces
  .filter((p) => p.lat != null && p.lng != null)
  .map((p, i) => ({
    id: p.id,
    sourceId: p.id,
    markerType: String(p.itemType || '').toLowerCase() === 'food' ? 'food' : 'place',
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    dayNum: Number(p.dayNum) > 0 ? Number(p.dayNum) : (i % Math.max(days.length, 1)) + 1,
    address: p.address || cityQuery,
    rating: p.rating,
    reviewCount: p.reviewCount,
    image: p.image,
    website: p.website,
    originalData: p,
  }));
const firstItineraryPlaceWithCoords = itineraryPlaces.find((place) => place.lat != null && place.lng != null);
const mapCenterDetail = detailPlace && detailPlace.lat != null
  ? [detailPlace.lat, detailPlace.lng]
  : selectedItineraryPlace && selectedItineraryPlace.lat != null && selectedItineraryPlace.lng != null
    ? [selectedItineraryPlace.lat, selectedItineraryPlace.lng]
    : firstItineraryPlaceWithCoords
      ? [firstItineraryPlaceWithCoords.lat, firstItineraryPlaceWithCoords.lng]
      : mapCenter;
return (
  <>
    <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onCloseBackdrop} />
    <div className="trip-details__add-places-modal trip-details__add-places-modal--theme" role="dialog" aria-labelledby={showingAnyDetail ? (showingItineraryDetail ? 'itinerary-detail-title' : 'place-detail-title') : 'add-places-title'} aria-modal="true">
      {showingItineraryDetail ? (
        // Itinerary Detail View
        <div className="trip-details__add-places-body">
          <div className="trip-details__itinerary-detail-panel">
            <div className="trip-details__itinerary-detail-header">
              <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={onCloseItineraryHeader}>
                <X size={20} aria-hidden />
              </button>
              <h1 id="itinerary-detail-title" className="trip-details__itinerary-detail-name">{itineraryDetailsView.title}</h1>
              {itineraryDetailsView.author?.travelStyle && (
                <p className="trip-details__itinerary-detail-author-style">{itineraryDetailsView.author.travelStyle}</p>
              )}
              <div className="trip-details__itinerary-detail-meta">
                <span className="trip-details__itinerary-detail-creator">
                  <Route size={16} aria-hidden /> {itineraryDetailsView.creator}
                </span>
                <span className="trip-details__itinerary-detail-stat">Smart-generated route</span>
                <span className="trip-details__itinerary-detail-stat">{itineraryDetailsView.duration}</span>
                <span className="trip-details__itinerary-detail-stat">{destinationLabel}</span>
                <span className="trip-details__itinerary-detail-stat">{itineraryPlaces.length} places</span>
              </div>
              <div className="trip-details__itinerary-detail-tags">
                {(Array.isArray(itineraryDetailsView.tags) ? itineraryDetailsView.tags : [itineraryDetailsView.type]).filter(Boolean).slice(0, 5).map((tag) => (
                  <span key={tag} className="trip-details__itinerary-detail-tag">{tag}</span>
                ))}
              </div>
              <div className="trip-details__place-detail-add-wrap">
                <button
                  type="button"
                  className="trip-details__place-detail-add-btn"
                  onClick={() => addEntireItineraryToTrip(itineraryPlaces)}
                >
                  Add entire itinerary to trip
                </button>
              </div>
            </div>
            <div className="trip-details__itinerary-detail-content">
              {itineraryDayGroups.length > 0 ? itineraryDayGroups.map((dayGroup) => (
                <div key={`itinerary-day-${dayGroup.dayNum}`} className="trip-details__itinerary-detail-day">
                  <div className="trip-details__itinerary-detail-day-header">
                    <span className="trip-details__itinerary-detail-day-badge">Day {dayGroup.dayNum}</span>
                    <span className="trip-details__itinerary-detail-day-title">{dayGroup.title}</span>
                  </div>
                  <div className="trip-details__itinerary-detail-places">
                    {dayGroup.places.length === 0 ? (
                      <p className="trip-details__add-places-results">No recommendations for this day yet.</p>
                    ) : null}
                    {dayGroup.places.map((place) => (
                      <div
                        key={place.id}
                        role="button"
                        tabIndex={0}
                        className="trip-details__itinerary-detail-place trip-details__itinerary-detail-place--interactive"
                        onClick={() => openItineraryPlaceDetails(place)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openItineraryPlaceDetails(place);
                          }
                        }}
                      >
                        <div className="trip-details__itinerary-detail-place-img-wrap">
                          <img src={resolveImageUrl(place.image || itineraryDetailsView.image, place.name || itineraryDetailsView.title, 'landmark')} alt="" className="trip-details__itinerary-detail-place-img" onError={handleImageError} />
                        </div>
                        <div className="trip-details__itinerary-detail-place-content">
                          <h3 className="trip-details__itinerary-detail-place-name">{place.name}</h3>
                          <div className="trip-details__itinerary-detail-place-rating">
                            <Star size={14} fill="currentColor" aria-hidden /> {place.rating} ({(place.reviewCount || 0).toLocaleString()}) · {place.category || 'Place'}
                          </div>
                          <div className="trip-details__itinerary-detail-place-address">
                            <MapPin size={14} aria-hidden /> {place.address || cityQuery}
                          </div>
                          <div className="trip-details__itinerary-detail-place-duration">
                            <Clock size={14} aria-hidden /> Duration: {place.durationLabel || '2 hr'}
                          </div>
                          <div className="trip-details__itinerary-detail-place-note">
                            {place.overview || 'Suggested stop from this smart itinerary.'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <p className="trip-details__add-places-results">No places found for this itinerary.</p>
              )}
            </div>
          </div>
          <div className="trip-details__add-places-map-panel">
            <div className="trip-details__add-places-map">
              <TripMap
                center={mapCenterDetail}
                zoom={11}
                markers={addPlacesMarkers}
                activeDayNums={allDayNums}
                className="trip-details__add-places-trip-map"
                fitBounds={addPlacesMarkers.length > 0}
                selectedMarkerId={selectedPlaceMarkerId}
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
      ) : !showingPlaceDetail ? (
        <>
          <div className="trip-details__add-places-head">
            <h2 id="add-places-title" className="trip-details__add-places-title">Add Places</h2>
            <div className="trip-details__add-places-location">
              <Search size={18} className="trip-details__add-places-location-icon" aria-hidden />
              <span>{trip.locations || trip.destination}</span>
            </div>
            <button type="button" className="trip-details__modal-close trip-details__add-places-close" aria-label="Close" onClick={onCloseListHeader}>
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
                  placeholder="Search by place name..."
                  value={placeSearchQuery}
                  onChange={(e) => {
                    setPlaceSearchQuery(e.target.value);
                  }}
                  aria-label="Search places"
                />
              </div>
              {(() => {
                const places = pagedPlaces;

                return (
                  <>
                    {discoveryError && (
                      <p className="trip-details__add-places-results">Could not load live data: {discoveryError}</p>
                    )}
                    {discoveryLoading && (
                      <p className="trip-details__add-places-results">Loading live places for {destinationLabel}...</p>
                    )}
                    <div className="trip-details__add-places-filters">
                      <p className="trip-details__add-places-results">
                        {filteredPlaces.length} results found · Page {addPlacesPage} of {addPlacesTotalPages}
                      </p>
                      <div className="trip-details__add-places-sort">
                        <label htmlFor="add-places-sort">Sort by:</label>
                        <select id="add-places-sort" className="trip-details__add-places-sort-select" value={placeSortBy} onChange={(e) => setPlaceSortBy(e.target.value)}>
                          {PLACE_SORT_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="trip-details__add-places-grid">
                      <button
                        type="button"
                        className="trip-details__add-places-card trip-details__add-places-card--manual"
                        onClick={() => {
                          const day = days.find((d) => d.dayNum === addPlacesDay);
                          setCustomPlaceName('');
                          setCustomPlaceAddress('');
                          setCustomPlaceAddressSelection(null);
                          setCustomPlaceAddressSuggestionsOpen(false);
                          setCustomPlaceDateKey(day?.date || days[0]?.date || '');
                          setAddCustomPlaceOpen(true);
                        }}
                      >
                        <div className="trip-details__add-places-card-manual-icon">
                          <Camera size={24} aria-hidden />
                        </div>
                        <span className="trip-details__add-places-card-manual-text">Can&apos;t find what you need? Add manually.</span>
                      </button>
                      {places.map((place) => (
                        <div
                          key={place.id}
                          role="button"
                          tabIndex={0}
                          className="trip-details__add-places-card"
                          onClick={() => { setPlaceDetailsView(place); setSelectedPlaceMarkerId(place.id); }}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPlaceDetailsView(place); setSelectedPlaceMarkerId(place.id); } }}
                        >
                          <img src={resolveImageUrl(place.image, place.name, 'landmark')} alt="" className="trip-details__add-places-card-img" onError={handleImageError} />
                          <button type="button" className="trip-details__add-places-card-heart" aria-label={place.saved ? 'Unsave' : 'Save'} onClick={(e) => e.stopPropagation()}>
                            <Heart size={18} fill={place.saved ? 'currentColor' : 'none'} aria-hidden />
                          </button>
                          <div className="trip-details__add-places-card-info">
                            <span className="trip-details__add-places-card-name">{place.name}</span>
                            <span className="trip-details__add-places-card-rating">{place.rating} ({place.reviewCount.toLocaleString()})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {addPlacesTotalPages > 1 && (
                      <div className="trip-details__add-places-pagination" role="navigation" aria-label="Add places pages">
                        <button
                          type="button"
                          className="trip-details__add-places-page-btn"
                          onClick={() => setAddPlacesPage((prev) => Math.max(1, prev - 1))}
                          disabled={addPlacesPage <= 1}
                        >
                          Previous
                        </button>
                        <span className="trip-details__add-places-page-text">Page {addPlacesPage} / {addPlacesTotalPages}</span>
                        <button
                          type="button"
                          className="trip-details__add-places-page-btn"
                          onClick={() => setAddPlacesPage((prev) => Math.min(addPlacesTotalPages, prev + 1))}
                          disabled={addPlacesPage >= addPlacesTotalPages}
                        >
                          Next
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="trip-details__add-places-map-panel">
              <div className="trip-details__add-places-map">
                <TripMap
                  center={mapCenter}
                  zoom={11}
                  markers={addPlacesMarkers}
                  activeDayNums={allDayNums}
                  className="trip-details__add-places-trip-map"
                  fitBounds={addPlacesMarkers.length > 0}
                  selectedMarkerId={selectedPlaceMarkerId}
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
      ) : (
        <div className="trip-details__add-places-body">
          <div className="trip-details__place-detail-panel">
            <div className="trip-details__place-detail-header">
              <button type="button" className="trip-details__place-detail-back" onClick={() => { setPlaceDetailsView(null); setPlaceDetailsTab('overview'); }} aria-label="Back to list">
                <ArrowLeft size={20} aria-hidden /> Back
              </button>
              <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={onClosePlaceDetailHeader}>
                <X size={20} aria-hidden />
              </button>
              <h1 id="place-detail-title" className="trip-details__place-detail-name">{detailPlace.name}</h1>
              <div className="trip-details__place-detail-meta">
                <span className="trip-details__place-detail-rating">
                  <Star size={16} fill="currentColor" aria-hidden /> {detailPlace.rating} ({detailPlace.reviewCount?.toLocaleString() ?? '0'})
                </span>
                <button type="button" className="trip-details__place-detail-heart" aria-label="Save">
                  <Heart size={20} aria-hidden />
                </button>
              </div>
            </div>
            <div className="trip-details__place-detail-hero">
              {(() => {
                const galleryImages = [
                  ...(Array.isArray(detailPlace.images) ? detailPlace.images : []),
                  detailPlace.image,
                ].filter(Boolean);
                const uniqueImages = [...new Set(galleryImages)].slice(0, 3);

                if (uniqueImages.length <= 1) {
                  return <img src={resolveImageUrl(uniqueImages[0] || detailPlace.image, detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img" onError={handleImageError} />;
                }

                return (
                  <div className="trip-details__place-detail-gallery">
                    <img src={resolveImageUrl(uniqueImages[0], detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img trip-details__place-detail-img--primary" onError={handleImageError} />
                    <div className="trip-details__place-detail-gallery-side">
                      {uniqueImages.slice(1, 3).map((img, idx) => (
                        <img key={`${detailPlace.id || detailPlace.name}-gallery-${idx}`} src={resolveImageUrl(img, detailPlace.name, 'landmark')} alt="" className="trip-details__place-detail-img trip-details__place-detail-img--secondary" onError={handleImageError} />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="trip-details__place-detail-tabs">
              <button type="button" className={`trip-details__place-detail-tab ${placeDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setPlaceDetailsTab('overview')}>Overview</button>
              <button type="button" className={`trip-details__place-detail-tab ${placeDetailsTab === 'nearby' ? 'trip-details__place-detail-tab--active' : ''}`} onClick={() => setPlaceDetailsTab('nearby')}>Nearby Places</button>
            </div>
            <div className="trip-details__place-detail-content">
              {placeDetailsTab === 'overview' ? (
                <>
                  {detailPlace.overview && (
                    <p className="trip-details__place-detail-overview">{detailPlace.overview}</p>
                  )}
                  <div className="trip-details__place-detail-add-wrap">
                    <button
                      type="button"
                      className="trip-details__place-detail-add-btn"
                      onClick={() => {
                        const day = days.find((d) => d.dayNum === addPlacesDay);
                        const selectedDate = day?.date || days[0]?.date || '';
                        const smartItemType = String(detailPlace.itemType || '').toLowerCase() === 'food' ? 'food' : 'place';
                        setAddToTripItem({
                          type: smartItemType,
                          data: detailPlace,
                          categoryId: smartItemType === 'food' ? 'food' : 'places',
                          category: smartItemType === 'food' ? 'Food & Beverage' : 'Places',
                          Icon: smartItemType === 'food' ? UtensilsCrossed : Camera,
                        });
                        setAddToTripDate(selectedDate);
                        setAddToTripStartTime(getDefaultStartTimeForDate(tripExpenseItems, selectedDate, '07:00'));
                        setAddToTripDurationHrs('1');
                        setAddToTripDurationMins('0');
                        setAddToTripNotes('');
                        setAddToTripCost('');
                        setAddToTripExternalLink(detailPlace.website || '');
                        setAddToTripTravelDocs([]);
                        setAddToTripModalOpen(true);
                      }}
                    >
                      Add to trip
                    </button>
                  </div>
                  {Array.isArray(detailPlace.whyVisit) && detailPlace.whyVisit.length > 0 && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Why you should visit</h3>
                      <ul className="trip-details__place-detail-hours">
                        {detailPlace.whyVisit.map((reason, idx) => (
                          <li key={`visit-${idx}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {detailPlace.address && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Address</h3>
                      <p className="trip-details__place-detail-section-text">{detailPlace.address}</p>
                    </div>
                  )}
                  {(detailPlace.hours && Object.keys(detailPlace.hours).length > 0) && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Hours of operation</h3>
                      {detailPlace.isOpenNow != null && (
                        <p className={`trip-details__place-detail-status ${detailPlace.isOpenNow ? 'trip-details__place-detail-status--open' : 'trip-details__place-detail-status--closed'}`}>
                          {detailPlace.isOpenNow ? 'Open Now' : 'Closed Now'}
                        </p>
                      )}
                      <ul className="trip-details__place-detail-hours">
                        {Object.entries(detailPlace.hours).map(([day, hrs]) => (
                          <li key={day}>{day}: {hrs}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {detailPlace.website && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Website</h3>
                      <a href={detailPlace.website} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                        {detailPlace.website.replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  )}
                  <div className="trip-details__place-detail-section">
                    <h3 className="trip-details__place-detail-section-title">Review</h3>
                    <p className="trip-details__place-detail-section-text">
                      <Star size={14} fill="currentColor" aria-hidden /> {detailPlace.rating} ({detailPlace.reviewCount?.toLocaleString() ?? '0'} reviews)
                      {detailPlace.googleMapsReviewUrl && (
                        <>
                          {' · '}
                          <a href={detailPlace.googleMapsReviewUrl} target="_blank" rel="noopener noreferrer" className="trip-details__place-detail-link">
                            Leave a review / Google Maps reviews
                          </a>
                        </>
                      )}
                    </p>
                  </div>
                </>
              ) : (
                <div className="trip-details__place-detail-nearby">
                  <p className="trip-details__place-detail-nearby-title">Nearby Places</p>
                  <div className="trip-details__place-detail-nearby-grid">
                    {nearbyPlaces.map((near) => (
                      <button
                        key={near.id}
                        type="button"
                        className="trip-details__place-detail-nearby-card"
                        onClick={() => { setPlaceDetailsView(near); setSelectedPlaceMarkerId(near.id); }}
                      >
                        <img src={resolveImageUrl(near.image, near.name, 'landmark')} alt="" className="trip-details__place-detail-nearby-img" onError={handleImageError} />
                        <button type="button" className="trip-details__place-detail-nearby-heart" aria-label="Save" onClick={(e) => e.stopPropagation()}>
                          <Heart size={16} aria-hidden />
                        </button>
                        <div className="trip-details__place-detail-nearby-info">
                          <span className="trip-details__place-detail-nearby-name">{near.name}</span>
                          <span className="trip-details__place-detail-nearby-rating">{near.rating} ({near.reviewCount?.toLocaleString() ?? '0'})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="trip-details__add-places-map-panel">
            <div className="trip-details__add-places-map">
              <TripMap
                center={mapCenterDetail}
                zoom={14}
                markers={addPlacesMarkers}
                activeDayNums={allDayNums}
                className="trip-details__add-places-trip-map"
                fitBounds={addPlacesMarkers.length > 0}
                selectedMarkerId={detailPlace?.id || selectedPlaceMarkerId}
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
      )}
    </div>
  </>
);
}
