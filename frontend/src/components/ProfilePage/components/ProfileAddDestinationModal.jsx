export default function ProfileAddDestinationModal({
  open,
  onClose,
  destinationCountry,
  setDestinationCountry,
  destinationCountryInput,
  setDestinationCountryInput,
  destinationCountryOpen,
  setDestinationCountryOpen,
  destinationCity,
  setDestinationCity,
  destinationCityOpen,
  setDestinationCityOpen,
  destinationCountrySuggestions,
  destinationCitySuggestions,
  destinationSuggestionsLoading,
  destinationError,
  setDestinationError,
  destinationLoading,
  submitDestination,
  countryDropdownRef,
  cityDropdownRef,
}) {
  if (!open) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="add-destination-title">
      <button
        type="button"
        className="profile-page__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="profile-page__modal-card profile-page__modal-card--dest">
        <div className="profile-page__modal-head">
          <h2 id="add-destination-title" className="profile-page__modal-title">
            Add destination
          </h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="profile-page__modal-body profile-page__modal-body--dest">
          <div className="profile-page__dest-add-row">
            <label className="profile-page__modal-label" htmlFor="dest-country">Country</label>
            <div className="profile-page__dest-combobox" ref={countryDropdownRef}>
              <input
                id="dest-country"
                className={`profile-page__modal-input profile-page__dest-input${destinationCountry ? ' profile-page__modal-input--selected' : ''}`}
                type="text"
                placeholder="Search or select country…"
                autoComplete="off"
                value={destinationCountryInput}
                onChange={(e) => {
                  setDestinationCountryInput(e.target.value);
                  setDestinationCountry('');
                  setDestinationCountryOpen(true);
                  setDestinationCity('');
                }}
                onFocus={() => {
                  setDestinationCountryInput('');
                  setDestinationCountryOpen(true);
                }}
                onBlur={() => {
                  const match = (Array.isArray(destinationCountrySuggestions) ? destinationCountrySuggestions : []).find(
                    (name) => String(name || '').toLowerCase() === destinationCountryInput.toLowerCase()
                  );
                  if (match) {
                    setDestinationCountry(match);
                    setDestinationCountryInput(match);
                  } else if (destinationCountry) {
                    setDestinationCountryInput(destinationCountry);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setDestinationCountryOpen(false); return; }
                  if (e.key === 'Enter') {
                    const suggestions = (Array.isArray(destinationCountrySuggestions) ? destinationCountrySuggestions : [])
                      .filter((name) => String(name || '').toLowerCase().includes(destinationCountryInput.toLowerCase()));
                    if (suggestions.length > 0) {
                      setDestinationCountry(suggestions[0]);
                      setDestinationCountryInput(suggestions[0]);
                      setDestinationCountryOpen(false);
                    }
                  }
                }}
              />
              {destinationCountryOpen && (
                <ul className="profile-page__dest-dropdown">
                  {destinationSuggestionsLoading && <li className="profile-page__dest-dropdown-item">Searching...</li>}
                  {!destinationSuggestionsLoading && (Array.isArray(destinationCountrySuggestions) ? destinationCountrySuggestions : [])
                    .filter((name) => !destinationCountryInput || String(name || '').toLowerCase().includes(destinationCountryInput.toLowerCase()))
                    .map((name) => (
                      <li key={name}>
                        <button
                          type="button"
                          className={`profile-page__dest-dropdown-item${destinationCountry === name ? ' profile-page__dest-dropdown-item--active' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDestinationCountry(name);
                            setDestinationCountryInput(name);
                            setDestinationCountryOpen(false);
                            setDestinationCity('');
                            setDestinationCityOpen(false);
                          }}
                        >
                          {name}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            <label className="profile-page__modal-label" htmlFor="dest-city">City <span className="profile-page__modal-label--optional">(optional)</span></label>
            <div className="profile-page__dest-combobox" ref={cityDropdownRef}>
              <input
                id="dest-city"
                className="profile-page__modal-input profile-page__dest-input"
                type="text"
                placeholder="Search or select city…"
                autoComplete="off"
                value={destinationCity}
                onChange={(e) => {
                  setDestinationCity(e.target.value);
                  setDestinationCityOpen(true);
                }}
                onFocus={() => {
                  setDestinationCity('');
                  setDestinationCityOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') { setDestinationCityOpen(false); return; }
                  if (e.key === 'Enter') submitDestination();
                }}
              />
              {destinationCityOpen && (
                <ul className="profile-page__dest-dropdown">
                  {destinationSuggestionsLoading && <li className="profile-page__dest-dropdown-item">Searching...</li>}
                  {!destinationSuggestionsLoading && (Array.isArray(destinationCitySuggestions) ? destinationCitySuggestions : [])
                    .filter((c) => {
                      if (destinationCountry && c.country !== destinationCountry) return false;
                      if (!destinationCity) return true;
                      return String(c.name || '').toLowerCase().includes(destinationCity.toLowerCase());
                    })
                    .map((c) => (
                      <li key={c.id || `${c.name}-${c.country || 'city'}`}>
                        <button
                          type="button"
                          className={`profile-page__dest-dropdown-item${destinationCity === c.name ? ' profile-page__dest-dropdown-item--active' : ''}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setDestinationCity(c.name);
                            if (!destinationCountry) {
                              setDestinationCountry(c.country);
                              setDestinationCountryInput(c.country);
                            }
                            setDestinationCityOpen(false);
                          }}
                        >
                          {c.name}
                          {!destinationCountry && (
                            <span className="profile-page__dest-dropdown-sub">{c.country}</span>
                          )}
                        </button>
                      </li>
                    ))}
                </ul>
              )}
            </div>
            {destinationError && <p className="profile-page__modal-error">{destinationError}</p>}
          </div>
        </div>
        <div className="profile-page__modal-actions">
          <button
            type="button"
            className="profile-page__modal-btn profile-page__modal-btn--primary"
            onClick={submitDestination}
            disabled={destinationLoading || !destinationCountryInput.trim()}
          >
            {destinationLoading ? 'Saving…' : '+ Add'}
          </button>
        </div>
      </div>
    </div>
  );
}
