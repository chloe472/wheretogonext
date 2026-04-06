import { getLocationKey, getLocationLabel, getCityDayDraftKey } from '../lib/newTripPageHelpers.js';

export default function CityDayPlanSection({
  selectedLocations,
  totalTripDays,
  cityPlanRows,
  cityDayRanges,
  cityDayDrafts,
  cityRangeError,
  defaultCityDayRanges,
  onCityRangeInputChange,
  onCommitCityRangeInput,
  onAddCityPlanRow,
  onRemoveCityPlanRow,
  onCityPlanRowLocationKeyChange,
}) {
  if (selectedLocations.length <= 1) return null;

  return (
    <div className="new-trip__city-plan" aria-label="City day plan">
      <p className="new-trip__city-plan-title">How many days in each city?</p>
      <p className="new-trip__city-plan-hint">
        Set day ranges to allocate days per city (for example, Seoul Day 1-3, Busan Day 4-6).
      </p>
      {totalTripDays > 0 ? (
        <>
          {cityPlanRows.map((row) => {
            const loc = selectedLocations.find((item) => getLocationKey(item) === row.locationKey) || selectedLocations[0];
            if (!loc) return null;
            const range = cityDayRanges[row.id] || defaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: totalTripDays };
            const canRemove = cityPlanRows.length > selectedLocations.length;
            return (
              <div key={row.id} className="new-trip__city-plan-row">
                <div className="new-trip__city-plan-city-field">
                  <select
                    className="new-trip__city-plan-select"
                    value={row.locationKey}
                    onChange={(e) => onCityPlanRowLocationKeyChange(row.id, e.target.value)}
                    aria-label="City"
                  >
                    {selectedLocations.map((optionLoc) => {
                      const optionKey = getLocationKey(optionLoc);
                      return (
                        <option key={optionKey} value={optionKey}>{getLocationLabel(optionLoc)}</option>
                      );
                    })}
                  </select>
                </div>
                <div className="new-trip__city-plan-inputs">
                  <div className="new-trip__city-plan-range-group">
                    <span className="new-trip__city-plan-range-prefix">Day</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={totalTripDays}
                      value={cityDayDrafts[getCityDayDraftKey(row.id, 'startDay')] ?? String(range.startDay)}
                      onChange={(e) => onCityRangeInputChange(row, 'startDay', e.target.value)}
                      onBlur={() => onCommitCityRangeInput(row, 'startDay')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      className="new-trip__city-plan-input"
                      aria-label="Start day"
                    />
                    <span className="new-trip__city-plan-range-separator">to</span>
                    <span className="new-trip__city-plan-range-prefix">Day</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={totalTripDays}
                      value={cityDayDrafts[getCityDayDraftKey(row.id, 'endDay')] ?? String(range.endDay)}
                      onChange={(e) => onCityRangeInputChange(row, 'endDay', e.target.value)}
                      onBlur={() => onCommitCityRangeInput(row, 'endDay')}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          e.currentTarget.blur();
                        }
                      }}
                      className="new-trip__city-plan-input"
                      aria-label="End day"
                    />
                  </div>
                  {canRemove ? (
                    <button
                      type="button"
                      className="new-trip__city-plan-remove"
                      onClick={() => onRemoveCityPlanRow(row.id)}
                      aria-label="Remove row"
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
          <button type="button" className="new-trip__city-plan-add" onClick={onAddCityPlanRow}>
            + Add another row
          </button>
          {cityRangeError ? (
            <p className="new-trip__error new-trip__city-plan-error" role="alert">{cityRangeError}</p>
          ) : null}
          <p className="new-trip__city-plan-foot">Total trip length: Day 1 to Day {totalTripDays}.</p>
        </>
      ) : (
        <p className="new-trip__city-plan-foot">Select trip dates first to allocate days per city.</p>
      )}
    </div>
  );
}
