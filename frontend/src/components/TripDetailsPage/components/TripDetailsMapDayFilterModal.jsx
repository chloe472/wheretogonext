import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

export default function TripDetailsMapDayFilterModal({
  days,
  selectedDayNums,
  setSelectedDayNums,
  onClose,
}) {
  const allDayNums = useMemo(() => days.map((d) => d.dayNum), [days]);

  const toggleDay = (dayNum) => {
    setSelectedDayNums((prev) => {
      const base = prev.length ? prev : allDayNums;
      if (base.includes(dayNum)) {
        return base.filter((n) => n !== dayNum);
      }
      return [...base, dayNum].sort((a, b) => a - b);
    });
  };

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__filter-days-modal" role="dialog" aria-labelledby="filter-days-title" aria-modal="true">
        <div className="trip-details__filter-days-head">
          <h2 id="filter-days-title" className="trip-details__filter-days-title">Filter days on map</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <p className="trip-details__filter-days-hint">Show pindrops for selected days only.</p>
        <div className="trip-details__filter-days-actions">
          <button type="button" className="trip-details__filter-days-btn" onClick={() => setSelectedDayNums(allDayNums)}>Select all</button>
          <button type="button" className="trip-details__filter-days-btn" onClick={() => setSelectedDayNums([])}>Clear</button>
        </div>
        <ul className="trip-details__filter-days-list">
          {days.map((day) => {
            const selected = (selectedDayNums.length ? selectedDayNums : allDayNums).includes(day.dayNum);
            return (
              <li key={day.dayNum}>
                <button
                  type="button"
                  className={`trip-details__filter-days-item ${selected ? 'trip-details__filter-days-item--selected' : ''}`}
                  onClick={() => toggleDay(day.dayNum)}
                  aria-pressed={selected}
                >
                  <span className="trip-details__filter-days-check">{selected ? <Check size={16} aria-hidden /> : null}</span>
                  Day {day.dayNum}: {day.label}
                </button>
              </li>
            );
          })}
        </ul>
        <div className="trip-details__filter-days-footer">
          <button type="button" className="trip-details__modal-update" onClick={onClose}>Done</button>
        </div>
      </div>
    </>
  );
}
