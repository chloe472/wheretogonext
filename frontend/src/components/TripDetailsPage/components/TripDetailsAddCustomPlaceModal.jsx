import { Clock, MapPin, Paperclip, PlusCircle, X, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPlacesPredictions } from '../lib/tripDetailsPageHelpers';

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
  const [previewUrl, setPreviewUrl] = useState('');
  const [placePredictions, setPlacePredictions] = useState([]);

  useEffect(() => {
    if (!(customPlaceImage instanceof File)) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(customPlaceImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [customPlaceImage]);

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
            <label
              htmlFor="custom-place-image"
              className={`trip-details__custom-place-upload-label ${customPlaceImage ? 'trip-details__custom-place-upload-label--has-image' : ''}`}
            >
              {customPlaceImage ? (
                <>
                  {previewUrl && (
                    <div className="trip-details__custom-place-upload-preview-container">
                      <img
                        src={previewUrl}
                        alt="Selected place"
                        className="trip-details__custom-place-upload-preview-image"
                      />
                      <button
                        type="button"
                        className="trip-details__custom-place-delete-image"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomPlaceImage(null);
                          setPreviewUrl('');
                        }}
                        aria-label="Delete image"
                      >
                        <Trash2 size={18} aria-hidden />
                      </button>
                    </div>
                  )}
                </>
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
              <span className="trip-details__custom-place-label-heading">
                Place name <span className="trip-details__custom-place-required">*</span>
              </span>
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
              <span className="trip-details__custom-place-label-heading">
                Address <span className="trip-details__custom-place-required">*</span>
              </span>
              <span className="trip-details__custom-place-input-wrap trip-details__custom-transport-autofill-wrap">
                <MapPin size={18} className="trip-details__custom-place-input-icon" aria-hidden />
                <input
                  type="text"
                  className="trip-details__custom-place-input"
                  placeholder="Search by landmark or address"
                  value={customPlaceAddress}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomPlaceAddress(value);
                    setCustomPlaceAddressSelection(null);
                    setCustomPlaceAddressSuggestionsOpen(true);
                    if (!value.trim()) {
                      setPlacePredictions([]);
                      return;
                    }
                    fetchPlacesPredictions(value, (predictions) => {
                      setPlacePredictions(predictions || []);
                    });
                  }}
                  onFocus={() => {
                    setCustomPlaceAddressSuggestionsOpen(true);
                    if (customPlaceAddress.trim()) {
                      fetchPlacesPredictions(customPlaceAddress, (predictions) => {
                        setPlacePredictions(predictions || []);
                      });
                    }
                  }}
                  onBlur={() => setTimeout(() => setCustomPlaceAddressSuggestionsOpen(false), 200)}
                  required
                />
                {customPlaceAddressSuggestionsOpen && customPlaceAddress.trim() && (
                  <ul className="trip-details__custom-transport-suggestions">
                    {placePredictions.length > 0 ? (
                      placePredictions.map((prediction) => (
                        <li key={prediction.place_id}>
                          <button
                            type="button"
                            className="trip-details__custom-transport-suggestion-item"
                            onMouseDown={() => {
                              const name = prediction.structured_formatting?.main_text || prediction.description;
                              const address = prediction.structured_formatting?.secondary_text || prediction.description || 'Location';
                              setCustomPlaceAddress(prediction.description || name);
                              setCustomPlaceAddressSelection({
                                id: prediction.place_id,
                                name,
                                address: prediction.description || address,
                                description: prediction.description || name,
                                source: 'Google Places',
                                lat: Number.isFinite(Number(prediction.lat)) ? Number(prediction.lat) : null,
                                lng: Number.isFinite(Number(prediction.lng)) ? Number(prediction.lng) : null,
                              });
                              setCustomPlaceAddressSuggestionsOpen(false);
                              setPlacePredictions([]);
                            }}
                          >
                            <MapPin size={16} aria-hidden />
                            <div className="trip-details__custom-transport-suggestion-text">
                              <span className="trip-details__custom-transport-suggestion-name">{prediction.structured_formatting?.main_text || prediction.description}</span>
                              <span className="trip-details__custom-transport-suggestion-type">{prediction.structured_formatting?.secondary_text || 'Location'}</span>
                            </div>
                          </button>
                        </li>
                      ))
                    ) : (
                      <li>
                        <div className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom" aria-live="polite">
                          <MapPin size={16} aria-hidden />
                          <div className="trip-details__custom-transport-suggestion-text">
                            <span className="trip-details__custom-transport-suggestion-name">No matching places found</span>
                            <span className="trip-details__custom-transport-suggestion-type">Try a full address, street name, city, or landmark</span>
                          </div>
                        </div>
                        </li>
                      
                    )}
                  </ul>
                )}
              </span>
            </label>
          </div>
          <div className="trip-details__custom-place-row">
            <label className="trip-details__custom-place-label">
              <span className="trip-details__custom-place-label-heading">
                Date <span className="trip-details__custom-place-required">*</span>
              </span>
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
              <span className="trip-details__custom-place-label-heading">
                Start time <span className="trip-details__custom-place-required">*</span>
              </span>
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
            <span className="trip-details__custom-place-label-heading">
              Duration <span className="trip-details__custom-place-required">*</span>
            </span>
            <div className="trip-details__custom-place-duration">
              <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customPlaceDurationHrs} onChange={(e) => setCustomPlaceDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
              <span> hr </span>
              <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customPlaceDurationMins} onChange={(e) => setCustomPlaceDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
              <span> mins</span>
            </div>
          </label>
          <label className="trip-details__custom-place-label">
            Note (Optional)
            <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customPlaceNote} onChange={(e) => setCustomPlaceNote(e.target.value)} rows={3} />
          </label>
          <label className="trip-details__custom-place-label">
            Cost (Optional)
            <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customPlaceCost} onChange={(e) => setCustomPlaceCost(e.target.value)} />
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
            <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-place-docs')?.click()}>
              <Paperclip size={18} aria-hidden /> Attach files
              {customPlaceTravelDocs.length > 0 && (
                <span className="trip-details__custom-place-attach-count"> ({customPlaceTravelDocs.length})</span>
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
