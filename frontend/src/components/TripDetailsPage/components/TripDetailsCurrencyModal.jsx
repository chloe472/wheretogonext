import { useState } from 'react';
import { Check, Search, X } from 'lucide-react';

export default function TripDetailsCurrencyModal({
  onClose,
  currencyOptions,
  currencyOptionsForModal,
  modalCurrency,
  setModalCurrency,
  onApply,
}) {
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visibleCurrencies = query
    ? currencyOptionsForModal.filter(
        ({ code, name }) =>
          code.toLowerCase().includes(query) || name.toLowerCase().includes(query),
      )
    : currencyOptionsForModal;

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
        <div className="trip-details__currency-search-wrap">
          <Search size={15} className="trip-details__currency-search-icon" aria-hidden />
          <input
            className="trip-details__currency-search"
            type="text"
            placeholder="Search currencies…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button
              type="button"
              className="trip-details__currency-search-clear"
              aria-label="Clear search"
              onClick={() => setSearch('')}
            >
              <X size={13} aria-hidden />
            </button>
          )}
        </div>
        <ul className="trip-details__currency-list">
          {visibleCurrencies.length === 0 ? (
            <li className="trip-details__currency-empty">No currencies match "{search}"</li>
          ) : null}
          {visibleCurrencies.map(({ code, name }) => (
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
