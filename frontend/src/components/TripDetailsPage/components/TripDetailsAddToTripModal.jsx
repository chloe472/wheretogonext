import { Star, X } from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import { getDefaultStartTimeForDate } from '../lib/tripDetailsPageHelpers';

function addToTripTypeLabel(type) {
  if (type === 'place') return 'Place';
  if (type === 'food') return 'Food & Beverage';
  if (type === 'stay') return 'Stay';
  return 'Experience';
}

export default function TripDetailsAddToTripModal({
  onClose,
  onSubmit,
  addToTripItem,
  days,
  tripExpenseItems,
  addToTripDate,
  setAddToTripDate,
  addToTripStartTime,
  setAddToTripStartTime,
  addToTripDurationHrs,
  setAddToTripDurationHrs,
  addToTripDurationMins,
  setAddToTripDurationMins,
  addToTripCheckInDate,
  setAddToTripCheckInDate,
  addToTripCheckInTime,
  setAddToTripCheckInTime,
  addToTripCheckOutDate,
  setAddToTripCheckOutDate,
  addToTripCheckOutTime,
  setAddToTripCheckOutTime,
  addToTripNotes,
  setAddToTripNotes,
  addToTripCost,
  setAddToTripCost,
  addToTripExternalLink,
  setAddToTripExternalLink,
  addToTripTravelDocs,
  setAddToTripTravelDocs,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  const previewImageKind = addToTripItem.type === 'stay' ? 'hotel' : addToTripItem.type || 'place';

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="trip-details__custom-place-modal"
        role="dialog"
        aria-labelledby="add-to-trip-title"
        aria-modal="true"
      >
        <div className="trip-details__custom-place-head">
          <h2 id="add-to-trip-title" className="trip-details__custom-place-title">
            Add {addToTripTypeLabel(addToTripItem.type)}
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-preview">
            <img
              src={resolveImageUrl(addToTripItem.data.image, addToTripItem.data.name, previewImageKind)}
              alt={addToTripItem.data.name}
              className="trip-details__custom-place-preview-img"
              onError={handleImageError}
            />
            <div className="trip-details__custom-place-preview-content">
              <span className="trip-details__custom-place-preview-badge">{addToTripTypeLabel(addToTripItem.type)}</span>
              <h3 className="trip-details__custom-place-preview-name">{addToTripItem.data.name}</h3>
              <p className="trip-details__custom-place-preview-rating">
                <Star size={14} fill="currentColor" aria-hidden /> {addToTripItem.data.rating} (
                {addToTripItem.data.reviewCount?.toLocaleString() ?? '0'} reviews)
              </p>
              <p className="trip-details__custom-place-preview-address">{addToTripItem.data.address}</p>
            </div>
          </div>

          {addToTripItem.type === 'stay' ? (
            <div className="trip-details__custom-place-field-row">
              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-checkin-date" className="trip-details__custom-place-label">
                  Check-in date <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="date"
                  id="add-to-trip-checkin-date"
                  className="trip-details__custom-place-input"
                  value={addToTripCheckInDate}
                  onChange={(e) => setAddToTripCheckInDate(e.target.value)}
                  required
                />
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-checkin-time" className="trip-details__custom-place-label">
                  Check-in time <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="time"
                  id="add-to-trip-checkin-time"
                  className="trip-details__custom-place-input"
                  value={addToTripCheckInTime}
                  onChange={(e) => setAddToTripCheckInTime(e.target.value)}
                  required
                />
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-checkout-date" className="trip-details__custom-place-label">
                  Check-out date <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="date"
                  id="add-to-trip-checkout-date"
                  className="trip-details__custom-place-input"
                  value={addToTripCheckOutDate}
                  onChange={(e) => setAddToTripCheckOutDate(e.target.value)}
                  required
                />
              </div>

              <div className="trip-details__custom-place-field">
                <label htmlFor="add-to-trip-checkout-time" className="trip-details__custom-place-label">
                  Check-out time <span className="trip-details__custom-place-required">*</span>
                </label>
                <input
                  type="time"
                  id="add-to-trip-checkout-time"
                  className="trip-details__custom-place-input"
                  value={addToTripCheckOutTime}
                  onChange={(e) => setAddToTripCheckOutTime(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            <>
              <div className="trip-details__custom-place-field-row">
                <div className="trip-details__custom-place-field">
                  <label htmlFor="add-to-trip-date" className="trip-details__custom-place-label">
                    Date <span className="trip-details__custom-place-required">*</span>
                  </label>
                  <select
                    id="add-to-trip-date"
                    className="trip-details__custom-place-select"
                    value={addToTripDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const durationMinutes =
                        Number(addToTripDurationHrs || 0) * 60 + Number(addToTripDurationMins || 0);
                      setAddToTripDate(selectedDate);
                      setAddToTripStartTime(
                        getDefaultStartTimeForDate(tripExpenseItems, selectedDate, '07:00', durationMinutes),
                      );
                    }}
                    required
                  >
                    {days.map((day) => (
                      <option key={day.dayNum} value={day.date}>
                        Day {day.dayNum}: {day.date}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="trip-details__custom-place-field">
                  <label htmlFor="add-to-trip-start-time" className="trip-details__custom-place-label">
                    Start time <span className="trip-details__custom-place-required">*</span>
                  </label>
                  <input
                    type="time"
                    id="add-to-trip-start-time"
                    className="trip-details__custom-place-input"
                    value={addToTripStartTime}
                    onChange={(e) => setAddToTripStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="trip-details__custom-place-field">
                  <label htmlFor="add-to-trip-duration" className="trip-details__custom-place-label">
                    Duration <span className="trip-details__custom-place-required">*</span>
                  </label>
                  <div className="trip-details__custom-place-duration-wrap">
                    <input
                      type="number"
                      id="add-to-trip-duration-hrs"
                      className="trip-details__custom-place-duration-input"
                      placeholder="hrs"
                      min="0"
                      value={addToTripDurationHrs}
                      onChange={(e) => setAddToTripDurationHrs(e.target.value)}
                    />
                    <span className="trip-details__custom-place-duration-separator">hr:</span>
                    <input
                      type="number"
                      id="add-to-trip-duration-mins"
                      className="trip-details__custom-place-duration-input"
                      placeholder="mins"
                      min="0"
                      max="59"
                      step="5"
                      value={addToTripDurationMins}
                      onChange={(e) => setAddToTripDurationMins(e.target.value)}
                    />
                    <span className="trip-details__custom-place-duration-separator">mins</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="trip-details__custom-place-field">
            <label htmlFor="add-to-trip-note" className="trip-details__custom-place-label">
              Note (Optional)
            </label>
            <textarea
              id="add-to-trip-note"
              className="trip-details__custom-place-textarea"
              placeholder="Enter your note..."
              value={addToTripNotes}
              onChange={(e) => setAddToTripNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="trip-details__custom-place-field-row">
            <div className="trip-details__custom-place-field">
              <label htmlFor="add-to-trip-cost" className="trip-details__custom-place-label">
                Cost (Optional)
              </label>
              <input
                type="text"
                id="add-to-trip-cost"
                className="trip-details__custom-place-input"
                placeholder="US$0.00"
                value={addToTripCost}
                onChange={(e) => setAddToTripCost(e.target.value)}
              />
            </div>

            <div className="trip-details__custom-place-field">
              <label htmlFor="add-to-trip-link" className="trip-details__custom-place-label">
                External link (optional)
              </label>
              <input
                type="url"
                id="add-to-trip-link"
                className="trip-details__custom-place-input"
                placeholder="https://"
                value={addToTripExternalLink}
                onChange={(e) => setAddToTripExternalLink(e.target.value)}
              />
            </div>
          </div>

          <div className="trip-details__custom-place-field">
            <label htmlFor="add-to-trip-docs" className="trip-details__custom-place-label">
              Travel Documents
            </label>
            <input
              type="file"
              id="add-to-trip-docs"
              className="trip-details__custom-place-input"
              multiple
              onChange={(e) => setAddToTripTravelDocs(Array.from(e.target.files || []).slice(0, 3))}
            />
          </div>

          <div className="trip-details__custom-place-actions">
            <button type="button" className="trip-details__custom-place-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="trip-details__custom-place-submit">
              Add to trip
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
