export default function TripDetailsDeleteItemConfirmModal({ onClose, onConfirmDelete }) {
  return (
    <>
      <button
        type="button"
        className="trip-details__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="trip-details__delete-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="delete-confirm-title">
        <h3 id="delete-confirm-title" className="trip-details__delete-confirm-title">Delete saved place?</h3>
        <p className="trip-details__delete-confirm-text">This will remove the item from your itinerary.</p>
        <div className="trip-details__delete-confirm-actions">
          <button type="button" className="trip-details__modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="trip-details__modal-delete" onClick={onConfirmDelete}>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
