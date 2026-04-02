import { useState, useEffect } from 'react';
import { ExternalLink, MapPin, Star, X } from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import TripMap from '../../TripMap/TripMap';
import '../../TripDetailsPage/styles/trip-details-add-places-modal.css';
import '../../TripDetailsPage/styles/trip-details-place-detail.css';

export default function ExplorePlaceDetailModal({ place, onClose, onAddToTrip }) {
  const [placeDetailsTab, setPlaceDetailsTab] = useState('overview');

  useEffect(() => {
    if (!place) return undefined;
    function onKey(e) {
      if (e.key === 'Escape') onClose?.();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [place, onClose]);

  useEffect(() => {
    setPlaceDetailsTab('overview');
  }, [place?.id]);

  if (!place) return null;

  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const mapMarkers =
    place.lat != null && place.lng != null
      ? [
          {
            id: place.id,
            sourceId: place.id,
            markerType: place.itemType === 'food' ? 'food' : 'trip',
            name: place.name,
            lat: place.lat,
            lng: place.lng,
            dayNum: 1,
            address: place.address,
            rating: place.rating,
            reviewCount: place.reviewCount,
            image: place.image,
            website: place.website,
            originalData: place,
          },
        ]
      : [];

  const mapCenter =
    place.lat != null && place.lng != null ? [place.lat, place.lng] : [35.6762, 139.6503];

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="trip-details__add-places-modal trip-details__add-places-modal--theme"
        role="dialog"
        aria-labelledby="explore-place-detail-title"
        aria-modal="true"
      >
        <div className="trip-details__add-places-body">
          <div className="trip-details__place-detail-panel">
            <div className="trip-details__place-detail-header">
              <button type="button" className="trip-details__place-detail-back" onClick={onClose} aria-label="Back">
                Back
              </button>
              <button type="button" className="trip-details__place-detail-close" aria-label="Close" onClick={onClose}>
                <X size={20} aria-hidden />
              </button>
              <h1 id="explore-place-detail-title" className="trip-details__place-detail-name">{place.name}</h1>
              <div className="trip-details__place-detail-meta">
                <span className="trip-details__place-detail-rating">
                  <Star size={16} fill="currentColor" aria-hidden /> {place.rating ?? '—'} (
                  {place.reviewCount != null ? place.reviewCount.toLocaleString() : '0'})
                </span>
              </div>
            </div>
            <div className="trip-details__place-detail-hero">
              {(() => {
                const galleryImages = [
                  ...(Array.isArray(place.images) ? place.images : []),
                  place.image,
                ].filter(Boolean);
                const uniqueImages = [...new Set(galleryImages)].slice(0, 3);

                if (uniqueImages.length <= 1) {
                  return (
                    <img
                      src={resolveImageUrl(uniqueImages[0] || place.image, place.name, 'landmark')}
                      alt=""
                      className="trip-details__place-detail-img"
                      onError={handleImageError}
                    />
                  );
                }

                return (
                  <div className="trip-details__place-detail-gallery">
                    <img
                      src={resolveImageUrl(uniqueImages[0], place.name, 'landmark')}
                      alt=""
                      className="trip-details__place-detail-img trip-details__place-detail-img--primary"
                      onError={handleImageError}
                    />
                    <div className="trip-details__place-detail-gallery-side">
                      {uniqueImages.slice(1, 3).map((img, idx) => (
                        <img
                          key={`${place.id}-gallery-${idx}`}
                          src={resolveImageUrl(img, place.name, 'landmark')}
                          alt=""
                          className="trip-details__place-detail-img trip-details__place-detail-img--secondary"
                          onError={handleImageError}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="trip-details__place-detail-tabs">
              <button
                type="button"
                className={`trip-details__place-detail-tab ${placeDetailsTab === 'overview' ? 'trip-details__place-detail-tab--active' : ''}`}
                onClick={() => setPlaceDetailsTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`trip-details__place-detail-tab ${placeDetailsTab === 'nearby' ? 'trip-details__place-detail-tab--active' : ''}`}
                onClick={() => setPlaceDetailsTab('nearby')}
              >
                Nearby Places
              </button>
            </div>
            <div className="trip-details__place-detail-content">
              {placeDetailsTab === 'overview' ? (
                <>
                  {place.overview && <p className="trip-details__place-detail-overview">{place.overview}</p>}
                  <div className="trip-details__place-detail-add-wrap">
                    <button type="button" className="trip-details__place-detail-add-btn" onClick={onAddToTrip}>
                      Add to trip
                    </button>
                  </div>
                  {Array.isArray(place.whyVisit) && place.whyVisit.length > 0 && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Why you should visit</h3>
                      <ul className="trip-details__place-detail-hours">
                        {place.whyVisit.map((reason, idx) => (
                          <li key={`visit-${idx}`}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {place.address && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Address</h3>
                      <p className="trip-details__place-detail-section-text">
                        <MapPin size={16} aria-hidden /> {place.address}
                      </p>
                    </div>
                  )}
                  {place.hours && Object.keys(place.hours).length > 0 && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Hours of operation</h3>
                      {place.isOpenNow != null && (
                        <p
                          className={`trip-details__place-detail-status ${place.isOpenNow ? 'trip-details__place-detail-status--open' : 'trip-details__place-detail-status--closed'}`}
                        >
                          {place.isOpenNow ? 'Open Now' : 'Closed Now'}
                        </p>
                      )}
                      <ul className="trip-details__place-detail-hours">
                        {Object.entries(place.hours).map(([day, hrs]) => (
                          <li key={day}>
                            {day}: {hrs}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {place.website && (
                    <div className="trip-details__place-detail-section">
                      <h3 className="trip-details__place-detail-section-title">Website</h3>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="trip-details__place-detail-link"
                      >
                        {place.website.replace(/^https?:\/\//, '')} <ExternalLink size={14} aria-hidden />
                      </a>
                    </div>
                  )}
                  <div className="trip-details__place-detail-section">
                    <h3 className="trip-details__place-detail-section-title">Review</h3>
                    <p className="trip-details__place-detail-section-text">
                      <Star size={14} fill="currentColor" aria-hidden /> {place.rating ?? '—'} (
                      {place.reviewCount != null ? place.reviewCount.toLocaleString() : '0'} reviews)
                      {place.googleMapsReviewUrl && (
                        <>
                          {' · '}
                          <a
                            href={place.googleMapsReviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="trip-details__place-detail-link"
                          >
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
                  <p className="trip-details__place-detail-section-text" style={{ marginTop: '0.5rem' }}>
                    Suggestions for places nearby are available when you add stops from trip planning. On Explore you
                    can still add this place to one of your trips using the button above.
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="trip-details__add-places-map-panel">
            <div className="trip-details__add-places-map">
              <TripMap
                center={mapCenter}
                zoom={14}
                markers={mapMarkers}
                className="trip-details__add-places-trip-map"
                fitBounds={mapMarkers.length > 0}
                selectedMarkerId={place.id}
                popupMode="hover-preview"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
