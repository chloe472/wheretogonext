import { X } from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../../lib/imageFallback';
import { addDays } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsStayBookingModal({
  onClose,
  onSubmit,
  stayBookingTarget,
  cityQuery,
  stayBookingCheckInDate,
  setStayBookingCheckInDate,
  stayBookingCheckOutDate,
  setStayBookingCheckOutDate,
  stayBookingAdults,
  setStayBookingAdults,
  stayBookingChildren,
  setStayBookingChildren,
  stayBookingRooms,
  setStayBookingRooms,
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
        aria-labelledby="stay-booking-title"
        aria-modal="true"
      >
        <div className="trip-details__custom-place-head">
          <h2 id="stay-booking-title" className="trip-details__custom-place-title">
            Book Stay on Booking.com
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-preview">
            <img
              src={resolveImageUrl(stayBookingTarget.image, stayBookingTarget.name, 'hotel')}
              alt={stayBookingTarget.name}
              className="trip-details__custom-place-preview-img"
              onError={handleImageError}
            />
            <div className="trip-details__custom-place-preview-content">
              <span className="trip-details__custom-place-preview-badge">Stay</span>
              <h3 className="trip-details__custom-place-preview-name">{stayBookingTarget.name}</h3>
              <p className="trip-details__custom-place-preview-address">{stayBookingTarget.address || cityQuery}</p>
            </div>
          </div>

          <div className="trip-details__custom-place-grid">
            <div className="trip-details__custom-place-field">
              <label htmlFor="stay-booking-checkin" className="trip-details__custom-place-label">
                Check-in
              </label>
              <input
                id="stay-booking-checkin"
                type="date"
                className="trip-details__custom-place-input"
                value={stayBookingCheckInDate}
                onChange={(e) => {
                  const nextCheckIn = e.target.value;
                  setStayBookingCheckInDate(nextCheckIn);
                  if (stayBookingCheckOutDate <= nextCheckIn) {
                    setStayBookingCheckOutDate(addDays(nextCheckIn, 1));
                  }
                }}
                required
              />
            </div>

            <div className="trip-details__custom-place-field">
              <label htmlFor="stay-booking-checkout" className="trip-details__custom-place-label">
                Check-out
              </label>
              <input
                id="stay-booking-checkout"
                type="date"
                className="trip-details__custom-place-input"
                min={addDays(stayBookingCheckInDate, 1)}
                value={stayBookingCheckOutDate}
                onChange={(e) => setStayBookingCheckOutDate(e.target.value)}
                required
              />
            </div>

            <div className="trip-details__custom-place-field">
              <label htmlFor="stay-booking-adults" className="trip-details__custom-place-label">
                Adults
              </label>
              <input
                id="stay-booking-adults"
                type="number"
                className="trip-details__custom-place-input"
                min={1}
                max={16}
                value={stayBookingAdults}
                onChange={(e) => setStayBookingAdults(Math.max(1, Number(e.target.value || 1)))}
                required
              />
            </div>

            <div className="trip-details__custom-place-field">
              <label htmlFor="stay-booking-children" className="trip-details__custom-place-label">
                Children
              </label>
              <input
                id="stay-booking-children"
                type="number"
                className="trip-details__custom-place-input"
                min={0}
                max={10}
                value={stayBookingChildren}
                onChange={(e) => setStayBookingChildren(Math.max(0, Number(e.target.value || 0)))}
              />
            </div>

            <div className="trip-details__custom-place-field">
              <label htmlFor="stay-booking-rooms" className="trip-details__custom-place-label">
                Rooms
              </label>
              <input
                id="stay-booking-rooms"
                type="number"
                className="trip-details__custom-place-input"
                min={1}
                max={8}
                value={stayBookingRooms}
                onChange={(e) => setStayBookingRooms(Math.max(1, Number(e.target.value || 1)))}
                required
              />
            </div>
          </div>

          <p className="trip-details__custom-place-hint">
            We will open Booking.com with this hotel and your booking details prefilled.
          </p>

          <div className="trip-details__custom-place-actions">
            <button type="button" className="trip-details__custom-place-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="trip-details__custom-place-submit">
              Continue to Booking.com
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
