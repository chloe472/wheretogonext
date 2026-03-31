import { Search, X } from 'lucide-react';
import countriesData from '../../../data/countries.json';
import {
  WHERE_TYPE_LABELS,
  countryCodeToFlag,
  getWhereLocationKey,
  getWhereLocationLabel,
  isCityWhereLocation,
} from '../lib/tripDetailsPageHelpers';

function whereCityDraftKey(loc, field) {
  return `${getWhereLocationKey(loc)}::${field}`;
}

export default function TripDetailsWhereModal({
  onClose,
  whereModalRef,
  whereQuery,
  setWhereQuery,
  whereSuggestionsOpen,
  setWhereSuggestionsOpen,
  whereSuggestionsLoading,
  whereLocationSuggestions,
  whereSelectedLocations,
  setWhereSelectedLocations,
  whereCityDayRanges,
  whereDefaultCityDayRanges,
  whereTotalTripDays,
  whereCityDayDrafts,
  whereCityRangeError,
  setWhereCityRangeError,
  handleWhereCityRangeInputChange,
  commitWhereCityRangeInput,
  onApply,
}) {
  return (
    <>
      <button
        type="button"
        className="trip-details__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="trip-details__where-modal" role="dialog" aria-labelledby="where-modal-title" aria-modal="true">
        <div className="trip-details__where-modal-head">
          <h2 id="where-modal-title" className="trip-details__where-modal-title">Where to</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="trip-details__where-modal-body" ref={whereModalRef}>
          <label htmlFor="where-modal-input" className="trip-details__where-label">City</label>
          <div className="trip-details__where-autocomplete">
            <div className="trip-details__where-input-wrap">
              <Search size={18} className="trip-details__where-input-icon" aria-hidden />
              <input
                id="where-modal-input"
                type="text"
                className="trip-details__where-input"
                placeholder="Where do you want to go?"
                value={whereQuery}
                onChange={(e) => {
                  const nextQuery = e.target.value;
                  setWhereQuery(nextQuery);
                  setWhereCityRangeError('');
                  setWhereSuggestionsOpen(Boolean(nextQuery.trim()));
                }}
                onFocus={() => setWhereSuggestionsOpen(Boolean(whereQuery.trim()))}
                autoComplete="off"
                aria-expanded={whereSuggestionsOpen}
                aria-controls="where-modal-listbox"
                aria-autocomplete="list"
                role="combobox"
                aria-label="Destination"
              />
            </div>
            {whereSuggestionsOpen && whereQuery.trim() && (
              <ul id="where-modal-listbox" className="trip-details__where-suggestions" role="listbox">
                {whereSuggestionsLoading ? (
                  <li className="trip-details__where-suggestion trip-details__where-suggestion--empty" role="option">Searching cities...</li>
                ) : whereLocationSuggestions.length === 0 ? (
                  <li className="trip-details__where-suggestion trip-details__where-suggestion--empty" role="option">No results</li>
                ) : (
                  whereLocationSuggestions.filter((loc) => isCityWhereLocation(loc)).map((loc) => (
                    <li key={loc.id}>
                      <button
                        type="button"
                        className="trip-details__where-suggestion"
                        role="option"
                        aria-selected={whereSelectedLocations.some((l) => l.id === loc.id || l.name === loc.name)}
                        onClick={() => {
                          setWhereSelectedLocations((prev) =>
                            prev.some((l) => l.id === loc.id || l.name === loc.name) ? prev : [...prev, loc]
                          );
                          setWhereCityRangeError('');
                          setWhereQuery('');
                          setWhereSuggestionsOpen(false);
                        }}
                      >
                        <span className="trip-details__where-suggestion-name">{loc.name}</span>
                        {loc.country && (
                          <span className="trip-details__where-suggestion-meta">{loc.country}</span>
                        )}
                        <span className={`trip-details__where-type-badge trip-details__where-type-badge--${(loc.type || 'city').toLowerCase()}`}>
                          {WHERE_TYPE_LABELS[loc.type] || loc.type}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          {(whereSelectedLocations.length > 0 || whereQuery.trim()) && (
            <div className="trip-details__where-chip-wrap">
              {whereSelectedLocations.map((loc) => {
                const countryCode = loc.country
                  ? (countriesData.find((c) => c.name === loc.country)?.id ?? (loc.type === 'Country' ? loc.id : null))
                  : (loc.type === 'Country' ? loc.id : null);
                const flag = countryCode ? countryCodeToFlag(countryCode) : '';
                return (
                  <span key={loc.id} className="trip-details__where-chip">
                    {flag && <span className="trip-details__where-chip-flag" aria-hidden>{flag}</span>}
                    {loc.name}
                    <button
                      type="button"
                      className="trip-details__where-chip-remove"
                      aria-label={`Remove ${loc.name}`}
                      onClick={() => {
                        setWhereSelectedLocations((prev) => prev.filter((l) => l.id !== loc.id));
                        setWhereCityRangeError('');
                      }}
                    >
                      <X size={14} aria-hidden />
                    </button>
                  </span>
                );
              })}
              {whereQuery.trim() && (
                <span className="trip-details__where-chip trip-details__where-chip--pending">
                  {whereQuery.trim()}
                  <button
                    type="button"
                    className="trip-details__where-chip-remove"
                    aria-label="Clear"
                    onClick={() => {
                      setWhereQuery('');
                      setWhereCityRangeError('');
                    }}
                  >
                    <X size={14} aria-hidden />
                  </button>
                </span>
              )}
            </div>
          )}

          {whereSelectedLocations.length > 1 && (
            <div className="trip-details__where-city-plan" aria-label="City day plan">
              <p className="trip-details__where-city-plan-title">How many days in each city?</p>
              <p className="trip-details__where-city-plan-hint">
                Set day ranges for each city.
              </p>
              {whereSelectedLocations.map((loc) => {
                const key = getWhereLocationKey(loc);
                const range = whereCityDayRanges[key] || whereDefaultCityDayRanges[key] || { startDay: 1, endDay: whereTotalTripDays };
                return (
                  <div key={key} className="trip-details__where-city-plan-row">
                    <span className="trip-details__where-city-plan-city">{getWhereLocationLabel(loc)}</span>
                    <div className="trip-details__where-city-plan-inputs">
                      <label className="trip-details__where-city-plan-label">
                        From
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={whereCityDayDrafts[whereCityDraftKey(loc, 'startDay')] ?? String(range.startDay)}
                          onChange={(e) => handleWhereCityRangeInputChange(loc, 'startDay', e.target.value)}
                          onBlur={() => commitWhereCityRangeInput(loc, 'startDay')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          className="trip-details__where-city-plan-input"
                        />
                      </label>
                      <label className="trip-details__where-city-plan-label">
                        To
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={whereCityDayDrafts[whereCityDraftKey(loc, 'endDay')] ?? String(range.endDay)}
                          onChange={(e) => handleWhereCityRangeInputChange(loc, 'endDay', e.target.value)}
                          onBlur={() => commitWhereCityRangeInput(loc, 'endDay')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.currentTarget.blur();
                            }
                          }}
                          className="trip-details__where-city-plan-input"
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
              <p className="trip-details__where-city-plan-foot">Total trip length: Day 1 to Day {whereTotalTripDays}.</p>
              {whereCityRangeError && <p className="trip-details__where-city-plan-error" role="alert">{whereCityRangeError}</p>}
            </div>
          )}
        </div>
        <div className="trip-details__where-modal-actions">
          <button type="button" className="trip-details__modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="trip-details__modal-update" onClick={onApply}>
            Update
          </button>
        </div>
      </div>
    </>
  );
}
