import { ADD_TO_TRIP_OPTIONS } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddSheet({
  addSheetDay,
  addSheetFromCalendar,
  addSheetAnchor,
  onClose,
  onOptionSelect,
}) {
  return (
    <>
      <button
        type="button"
        className="trip-details__add-sheet-backdrop"
        aria-label="Close menu"
        onClick={onClose}
      />
      <div
        className={`trip-details__add-sheet ${addSheetAnchor ? 'trip-details__add-sheet--anchored' : ''}`}
        role="dialog"
        aria-labelledby="add-to-trip-title"
        aria-modal="true"
        style={
          addSheetAnchor
            ? {
              left: Math.max(
                16,
                Math.min(
                  addSheetAnchor.left,
                  typeof window !== 'undefined' ? window.innerWidth - 436 : addSheetAnchor.left,
                ),
              ),
              bottom: `calc(100vh - ${addSheetAnchor.top}px + 8px)`,
              transform: 'none',
            }
            : undefined
        }
      >
        <h2 id="add-to-trip-title" className="trip-details__add-sheet-title">
          Add to trip
        </h2>
        {!addSheetFromCalendar && <p className="trip-details__add-sheet-subtitle">Day {addSheetDay}</p>}
        <ul className="trip-details__add-sheet-list">
          {ADD_TO_TRIP_OPTIONS.map(({ id, label, description, Icon, color }) => (
            <li key={id}>
              <button type="button" className="trip-details__add-sheet-option" onClick={() => onOptionSelect(id)}>
                <span className="trip-details__add-sheet-icon" style={{ backgroundColor: color }}>
                  <Icon size={20} className="trip-details__add-sheet-icon-svg" aria-hidden />
                </span>
                <span className="trip-details__add-sheet-text">
                  <span className="trip-details__add-sheet-label">{label}</span>
                  <span className="trip-details__add-sheet-desc">{description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
