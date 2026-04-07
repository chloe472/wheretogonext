import { MapPin } from 'lucide-react';


export default function SocialImportLocationMismatchBanner({ locationInsight, onAddDetectedDestination }) {
  if (!locationInsight?.mismatch || !locationInsight.detectedLabel) return null;

  return (
    <div className="trip-details__social-import-location-banner" role="status">
      <MapPin className="trip-details__social-import-location-banner-icon" size={18} aria-hidden />
      <div className="trip-details__social-import-location-banner-main">
        <p className="trip-details__social-import-location-banner-title">Different city than your trip</p>
        <p className="trip-details__social-import-location-banner-desc">
          {locationInsight.message}
        </p>
        {locationInsight.canAddDetectedDestination && onAddDetectedDestination ? (
          <button
            type="button"
            className="trip-details__social-import-location-banner-btn"
            onClick={() => onAddDetectedDestination(locationInsight.detectedLabel)}
          >
            Add {locationInsight.detectedLabel} to trip destinations
          </button>
        ) : null}
      </div>
    </div>
  );
}
