import { Clock, Star, X } from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import { getDefaultStartTimeForDate } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsExperienceBookingModal({
  onClose,
  onSubmit,
  bookingExperience,
  bookingOption,
  days,
  tripExpenseItems,
  bookingDate,
  setBookingDate,
  bookingStartTime,
  setBookingStartTime,
  bookingTravellers,
  setBookingTravellers,
  bookingNotes,
  setBookingNotes,
}) {
  const handleImageError = (event) => {
    applyImageFallback(event);
  };

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="trip-details__custom-place-modal"
        role="dialog"
        aria-labelledby="book-experience-title"
        aria-modal="true"
      >
        <div className="trip-details__custom-place-head">
          <h2 id="book-experience-title" className="trip-details__custom-place-title">
            Book Experience
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-preview">
            <img
              src={resolveImageUrl(bookingExperience.image, bookingExperience.name, 'activity')}
              alt={bookingExperience.name}
              className="trip-details__custom-place-preview-img"
              onError={handleImageError}
            />
            <div className="trip-details__custom-place-preview-content">
              <span className="trip-details__custom-place-preview-badge">{bookingExperience.type}</span>
              <h3 className="trip-details__custom-place-preview-name">{bookingExperience.name}</h3>
              <p className="trip-details__custom-place-preview-rating">
                <Star size={14} fill="currentColor" aria-hidden /> {bookingExperience.rating} (
                {bookingExperience.reviewCount?.toLocaleString() ?? '0'} reviews)
              </p>
              <p className="trip-details__custom-place-preview-address">
                <Clock size={14} aria-hidden /> {bookingExperience.duration}
              </p>
              <p
                className="trip-details__custom-place-preview-address"
                style={{ marginTop: '4px', fontWeight: 600, color: '#059669' }}
              >
                {bookingOption.name}
              </p>
            </div>
          </div>

          <div className="trip-details__custom-place-field">
            <label htmlFor="booking-date" className="trip-details__custom-place-label">
              Date <span className="trip-details__custom-place-required">*</span>
            </label>
            <select
              id="booking-date"
              className="trip-details__custom-place-select"
              value={bookingDate}
              onChange={(e) => {
                const nextDate = e.target.value;
                const parsedDurationHours = Number(bookingExperience?.durationHours);
                const durationMinutes = Math.max(
                  1,
                  Math.round(
                    (Number.isFinite(parsedDurationHours) && parsedDurationHours > 0 ? parsedDurationHours : 2) * 60,
                  ),
                );
                setBookingDate(nextDate);
                setBookingStartTime(getDefaultStartTimeForDate(tripExpenseItems, nextDate, '07:00', durationMinutes));
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
            <label htmlFor="booking-start-time" className="trip-details__custom-place-label">
              Start time <span className="trip-details__custom-place-required">*</span>
            </label>
            <input
              type="time"
              id="booking-start-time"
              className="trip-details__custom-place-input"
              value={bookingStartTime}
              onChange={(e) => setBookingStartTime(e.target.value)}
              required
            />
          </div>

          <div className="trip-details__custom-place-field">
            <label htmlFor="booking-travellers" className="trip-details__custom-place-label">
              Number of travellers <span className="trip-details__custom-place-required">*</span>
            </label>
            <input
              type="number"
              id="booking-travellers"
              className="trip-details__custom-place-input"
              value={bookingTravellers}
              onChange={(e) =>
                setBookingTravellers(
                  Math.max(1, Math.min(bookingOption.maxTravellers || 99, parseInt(e.target.value, 10) || 1)),
                )
              }
              min="1"
              max={bookingOption.maxTravellers || 99}
              required
            />
            {bookingOption.maxTravellers && (
              <p className="trip-details__custom-place-helper" style={{ marginTop: '4px', fontSize: '13px', color: '#6b7280' }}>
                Maximum {bookingOption.maxTravellers} travellers for this option
              </p>
            )}
          </div>

          <div className="trip-details__custom-place-field">
            <label htmlFor="booking-notes" className="trip-details__custom-place-label">
              Notes <span style={{ fontWeight: 400, color: '#6b7280' }}>(Optional)</span>
            </label>
            <textarea
              id="booking-notes"
              className="trip-details__custom-place-textarea"
              rows={3}
              placeholder="Any special requests or notes for this booking..."
              value={bookingNotes}
              onChange={(e) => setBookingNotes(e.target.value)}
            />
          </div>

          <div
            className="trip-details__custom-place-field"
            style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginTop: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>
                {bookingExperience.currency}
                {bookingOption.price.toFixed(2)} × {bookingTravellers} traveller
                {bookingTravellers !== 1 ? 's' : ''}
              </span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#111827' }}>
                {bookingExperience.currency}
                {(bookingOption.price * bookingTravellers).toFixed(2)}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>All taxes and fees included</p>
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
