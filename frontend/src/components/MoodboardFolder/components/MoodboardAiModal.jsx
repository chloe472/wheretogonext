export default function MoodboardAiModal({ show, aiLoading, aiResult, onClose, onAddToItinerary }) {
  if (!show) return null;

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
              {aiResult.places.map((place, i) => (
                <div key={i} className="ai-place-card">
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
                  <button onClick={() => onAddToItinerary(place)}>Add to Trip</button>
                </div>
              ))}
            </>
          )
        )}
      </div>
    </div>
  );
}
