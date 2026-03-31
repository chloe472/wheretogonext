import { Clock, MapPin, Paperclip, PlusCircle, X } from 'lucide-react';
import { searchAddressSuggestions } from './lib/tripDetailsLocationData';

export default function TripDetailsAddCustomPlaceModal({
  trip,
  days,
  onClose,
  onSubmit,
  customPlaceName,
  setCustomPlaceName,
  customPlaceAddress,
  setCustomPlaceAddress,
  setCustomPlaceAddressSelection,
  customPlaceAddressSuggestionsOpen,
  setCustomPlaceAddressSuggestionsOpen,
  customPlaceDateKey,
  setCustomPlaceDateKey,
  customPlaceStartTime,
  setCustomPlaceStartTime,
  customPlaceDurationHrs,
  setCustomPlaceDurationHrs,
  customPlaceDurationMins,
  setCustomPlaceDurationMins,
  customPlaceNote,
  setCustomPlaceNote,
  customPlaceCost,
  setCustomPlaceCost,
  customPlaceImage,
  setCustomPlaceImage,
  customPlaceTravelDocs,
  setCustomPlaceTravelDocs,
  currency,
}) {
  const destinationQuery = trip.destination || trip.locations;

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="trip-details__custom-place-modal"
        role="dialog"
        aria-labelledby="custom-place-title"
        aria-modal="true"
      >
        <div className="trip-details__custom-place-head">
          <h2 id="custom-place-title" className="trip-details__custom-place-title">
            Add Custom Place
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-upload">
            <input
              type="file"
              id="custom-place-image"
              accept=".svg,.png,.jpg,.jpeg,.webp,.gif"
              className="trip-details__custom-place-file-input"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setCustomPlaceImage(f);
              }}
            />
            <label htmlFor="custom-place-image" className="trip-details__custom-place-upload-label">
              {customPlaceImage ? (
                <span className="trip-details__custom-place-upload-preview">
                  Image selected: {customPlaceImage instanceof File ? customPlaceImage.name : 'Preview'}
                </span>
              ) : (
                <>
                  <PlusCircle size={32} aria-hidden />
                  <span>Click to upload image or drag and drop</span>
                  <span className="trip-details__custom-place-upload-hint">
                    SVG, PNG, JPG, WEBP or GIF (max. 800×400px)
                  </span>
                </>
              )}
            </label>
          </div>
          <div className="trip-details__custom-place-row">
            <label className="trip-details__custom-place-label">
              Place name <span className="trip-details__custom-place-required">*</span>
              <input
                type="text"
                className="trip-details__custom-place-input"
                placeholder="Enter the place name"
                value={customPlaceName}
                onChange={(e) => setCustomPlaceName(e.target.value)}
                required
              />
            </label>
            <label className="trip-details__custom-place-label">
              Address <span className="trip-details__custom-place-required">*</span>
              <span className="trip-details__custom-place-input-wrap trip-details__custom-transport-autofill-wrap">
                <MapPin size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                <input
                  type="text"
                  className="trip-details__custom-place-input"
                  placeholder="Search by landmark or address"
                  value={customPlaceAddress}
                  onChange={(e) => {
                    setCustomPlaceAddress(e.target.value);
                    setCustomPlaceAddressSelection(null);
                    setCustomPlaceAddressSuggestionsOpen(true);
                  }}
                  onFocus={() => setCustomPlaceAddressSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setCustomPlaceAddressSuggestionsOpen(false), 200)}
                  required
                />
                {customPlaceAddressSuggestionsOpen && customPlaceAddress.trim() && (
                  <ul className="trip-details__custom-transport-suggestions">
                    {searchAddressSuggestions(destinationQuery, customPlaceAddress).map((suggestion) => (
                      <li key={suggestion.id}>
                        <button
                          type="button"
                          className="trip-details__custom-transport-suggestion"
                          onClick={() => {
                            setCustomPlaceAddress(suggestion.name);
                            setCustomPlaceAddressSelection(suggestion);
                            setCustomPlaceAddressSuggestionsOpen(false);
                          }}
                        >
                          <strong>{suggestion.name}</strong>
                          <span>{suggestion.address}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </span>
            </label>
          </div>
          <div className="trip-details__custom-place-row">
            <label className="trip-details__custom-place-label">
              Date <span className="trip-details__custom-place-required">*</span>
              <select
                className="trip-details__custom-place-select"
                value={customPlaceDateKey}
                onChange={(e) => setCustomPlaceDateKey(e.target.value)}
                required
              >
                <option value="">Select day</option>
                {days.map((d) => (
                  <option key={d.date} value={d.date}>
                    Day {d.dayNum}: {d.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="trip-details__custom-place-label">
              Start time <span className="trip-details__custom-place-required">*</span>
              <span className="trip-details__custom-place-input-wrap">
                <Clock size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                <input
                  type="time"
                  className="trip-details__custom-place-input"
                  value={customPlaceStartTime}
                  onChange={(e) => setCustomPlaceStartTime(e.target.value)}
                  required
                />
              </span>
            </label>
          </div>
          <label className="trip-details__custom-place-label">
            Duration <span className="trip-details__custom-place-required">*</span>
            <div className="trip-details__custom-place-duration">
              <input
                type="number"
                min={0}
                max={23}
                className="trip-details__custom-place-duration-input"
                value={customPlaceDurationHrs}
                onChange={(e) => setCustomPlaceDurationHrs(Number(e.target.value) || 0)}
                aria-label="Hours"
              />
              <span> hr </span>
              <input
                type="number"
                min={0}
                max={59}
                className="trip-details__custom-place-duration-input"
                value={customPlaceDurationMins}
                onChange={(e) => setCustomPlaceDurationMins(Number(e.target.value) || 0)}
                aria-label="Minutes"
              />
              <span> mins</span>
            </div>
          </label>
          <label className="trip-details__custom-place-label">
            Note (Optional)
            <textarea
              className="trip-details__custom-place-textarea"
              placeholder="Enter your note..."
              value={customPlaceNote}
              onChange={(e) => setCustomPlaceNote(e.target.value)}
              rows={3}
            />
          </label>
          <label className="trip-details__custom-place-label">
            Cost (Optional)
            <input
              type="number"
              step="0.01"
              min={0}
              className="trip-details__custom-place-input"
              placeholder="0"
              value={customPlaceCost}
              onChange={(e) => setCustomPlaceCost(e.target.value)}
            />
            <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
          </label>
          <label className="trip-details__custom-place-label">
            Travel Documents
            <p className="trip-details__custom-place-docs-hint">
              Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.
            </p>
            <input
              id="custom-place-docs"
              type="file"
              multiple
              accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
              className="trip-details__custom-place-file-input"
              onChange={(e) => {
                const files = Array.from(e.target.files || []).slice(0, 3);
                setCustomPlaceTravelDocs(files);
              }}
            />
            <button
              type="button"
              className="trip-details__custom-place-attach"
              onClick={() => document.getElementById('custom-place-docs')?.click()}
            >
              <Paperclip size={18} aria-hidden /> Attach files
              {customPlaceTravelDocs.length > 0 && (
                <span className="trip-details__custom-place-attach-count">
                  {' '}
                  ({customPlaceTravelDocs.length})
                </span>
              )}
            </button>
          </label>
          <div className="trip-details__custom-place-actions">
            <button type="button" className="trip-details__modal-cancel" onClick={onClose}>
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
