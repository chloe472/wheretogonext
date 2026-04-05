export default function ProfileDestinationsModal({
  open,
  onClose,
  isSelf,
  displayName,
  countriesCount,
  visitedCountries,
  citiesCount,
  visitedCities,
}) {
  if (!open) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="stats-list-title">
      <button type="button" className="profile-page__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="profile-page__modal-card profile-page__modal-card--compact">
        <div className="profile-page__modal-head">
          <h2 id="stats-list-title" className="profile-page__modal-title">
            {isSelf ? 'My Destinations' : `${displayName}'s Destinations`}
          </h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="profile-page__modal-body">
          <div className="profile-page__destinations-view">
            <div className="profile-page__destinations-section">
              <div className="profile-page__destinations-section-head">
                <span className="profile-page__destinations-section-title">Countries</span>
                <span className="profile-page__destinations-section-count">{countriesCount}</span>
              </div>
              {visitedCountries.length === 0
                ? <p className="profile-page__destinations-empty">No countries yet.</p>
                : <div className="profile-page__destinations-tags">
                    {[...visitedCountries].sort().map((c) => (
                      <span key={c} className="profile-page__destinations-tag">{c}</span>
                    ))}
                  </div>
              }
            </div>
            <div className="profile-page__destinations-section">
              <div className="profile-page__destinations-section-head">
                <span className="profile-page__destinations-section-title">Cities</span>
                <span className="profile-page__destinations-section-count">{citiesCount}</span>
              </div>
              {visitedCities.length === 0
                ? <p className="profile-page__destinations-empty">No cities yet.</p>
                : <div className="profile-page__destinations-tags">
                    {[...visitedCities].sort().map((c) => (
                      <span key={c} className="profile-page__destinations-tag">{c}</span>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
