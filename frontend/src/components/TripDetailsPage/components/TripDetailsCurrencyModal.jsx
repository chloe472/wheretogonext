import { Check, X } from 'lucide-react';

export default function TripDetailsCurrencyModal({
  onClose,
  currencyOptions,
  currencyOptionsForModal,
  modalCurrency,
  setModalCurrency,
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
      <div className="trip-details__currency-modal" role="dialog" aria-labelledby="currency-modal-title" aria-modal="true">
        <div className="trip-details__currency-modal-head">
          <h2 id="currency-modal-title" className="trip-details__currency-modal-title">Currencies</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        {currencyOptions.length === 0 ? (
          <p className="trip-details__itinerary-meta-line">Live exchange rates are loading. Showing USD for now.</p>
        ) : null}
        <ul className="trip-details__currency-list">
          {currencyOptionsForModal.map(({ code, name }) => (
            <li key={code}>
              <button
                type="button"
                className={`trip-details__currency-option ${modalCurrency === code ? 'trip-details__currency-option--selected' : ''}`}
                onClick={() => setModalCurrency(code)}
              >
                <span className="trip-details__currency-option-text">{code} – {name}</span>
                {modalCurrency === code && <Check size={18} className="trip-details__currency-check" aria-hidden />}
              </button>
            </li>
          ))}
        </ul>
        <div className="trip-details__currency-modal-actions">
          <button type="button" className="trip-details__modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="trip-details__modal-update" onClick={onApply}>Update</button>
        </div>
      </div>
    </>
  );
}
