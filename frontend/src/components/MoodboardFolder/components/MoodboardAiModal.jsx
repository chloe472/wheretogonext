import '../styles/moodboard-ai-modal.css';

export default function MoodboardAiModal({
  show,
  aiLoading,
  aiResult,
  locationInsight,
  tripDestination,
  onClose,
  onAddToItinerary,
  onAddDetectedDestination,
}) {
  if (!show) return null;

  const mismatch = Boolean(locationInsight?.mismatch && locationInsight?.detectedLabel);
  const detectedPlaces = Array.isArray(aiResult?.detectedPlaces)
    ? aiResult.detectedPlaces
    : (Array.isArray(aiResult?.places) ? aiResult.places : []);
  const detectedPlacesForDisplay = detectedPlaces.slice(0, 2);
  const adaptedPlaces = Array.isArray(aiResult?.adaptedPlaces) && aiResult.adaptedPlaces.length > 0
    ? aiResult.adaptedPlaces
    : (mismatch ? [] : (Array.isArray(aiResult?.places) ? aiResult.places : []));
  const recommendedPlacesForDisplay = adaptedPlaces.slice(0, 3);
  const defaultPlacesForDisplay = (Array.isArray(aiResult?.places) ? aiResult.places : []).slice(0, 3);

  const sectionTripLabel = String(tripDestination || '').trim() || 'your trip';

  const renderPlaceCard = (place, index, canAdd) => (
    <div key={`${String(place?.name || 'place')}-${index}`} className="ai-place-card">
      {place.image ? (
        <img
          src={place.image}
          alt={place.name}
          style={{
            width: '100%',
            height: '200px',
            objectFit: 'cover',
            borderRadius: '10px',
            marginBottom: '10px',
          }}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <h3>{place.name}</h3>
      <p>{place.description}</p>
      <p>
        <em>{place.location}</em>
      </p>
      {canAdd ? (
        <button className="ai-add-btn" onClick={() => onAddToItinerary(place)}>Add to Trip</button>
      ) : null}
    </div>
  );

  return (
    <div className="ai-modal-overlay" onClick={() => !aiLoading && onClose()}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
          className="close-btn"
          onClick={() => !aiLoading && onClose()}
          title={aiLoading ? 'Wait for analysis...' : 'Close'}
        >
          ✖
        </button>

        {aiLoading ? (
          <div className="ai-loading">
            <div className="ai-loading-spinner" aria-hidden="true" />
            <p>Analyzing Moodboard...</p>
          </div>
        ) : (
          aiResult && (
            <>
              <h2>Theme: {aiResult.theme}</h2>
              {mismatch ? (
                <div className="ai-location-banner" role="status">
                  <p className="ai-location-banner-title">Different city than your trip</p>
                  <p className="ai-location-banner-desc">{locationInsight.message}</p>
                  {locationInsight.canAddDetectedDestination && onAddDetectedDestination ? (
                    <button
                      type="button"
                      className="ai-location-banner-btn"
                      onClick={() => onAddDetectedDestination(locationInsight.detectedLabel)}
                    >
                      Add {locationInsight.detectedLabel} to itinerary
                    </button>
                  ) : null}
                </div>
              ) : null}

              {mismatch ? (
                <>
                  <h3 className="ai-section-title">Detected Inspiration ({locationInsight.detectedLabel})</h3>
                  {detectedPlacesForDisplay.map((place, i) => renderPlaceCard(place, i, false))}

                  <h3 className="ai-section-title">Similar Places in {sectionTripLabel}</h3>
                  {recommendedPlacesForDisplay.length > 0
                    ? recommendedPlacesForDisplay.map((place, i) => renderPlaceCard(place, i, true))
                    : <p className="ai-empty-note">No trip-adjusted matches yet. You can still add the destination using the button above.</p>}
                </>
              ) : (
                defaultPlacesForDisplay.map((place, i) => renderPlaceCard(place, i, true))
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
