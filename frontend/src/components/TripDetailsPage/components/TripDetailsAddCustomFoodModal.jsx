import { Clock, MapPin, Paperclip, PlusCircle, X, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPlacesPredictions } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddCustomFoodModal({
  trip,
  days,
  onClose,
  onSubmit,
  customFoodName,
  setCustomFoodName,
  customFoodAddress,
  setCustomFoodAddress,
  setCustomFoodAddressSelection,
  customFoodAddressSuggestionsOpen,
  setCustomFoodAddressSuggestionsOpen,
  customFoodDateKey,
  setCustomFoodDateKey,
  customFoodStartTime,
  setCustomFoodStartTime,
  customFoodDurationHrs,
  setCustomFoodDurationHrs,
  customFoodDurationMins,
  setCustomFoodDurationMins,
  customFoodNote,
  setCustomFoodNote,
  customFoodCost,
  setCustomFoodCost,
  customFoodImage,
  setCustomFoodImage,
  customFoodTravelDocs,
  setCustomFoodTravelDocs,
  currency,
}) {
  const [previewUrl, setPreviewUrl] = useState('');
  const [foodPredictions, setFoodPredictions] = useState([]);

  useEffect(() => {
    if (!(customFoodImage instanceof File)) {
      setPreviewUrl('');
      return undefined;
    }
    const url = URL.createObjectURL(customFoodImage);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [customFoodImage]);

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="custom-food-title" aria-modal="true">
        <div className="trip-details__custom-place-head">
          <h2 id="custom-food-title" className="trip-details__custom-place-title">
            Add Custom Food &amp; Beverage
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-upload">
            <input type="file" id="custom-food-image" accept=".svg,.png,.jpg,.jpeg,.webp,.gif" className="trip-details__custom-place-file-input" onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setCustomFoodImage(f);
            }} />
            <label
              htmlFor="custom-food-image"
              className={`trip-details__custom-place-upload-label ${customFoodImage ? 'trip-details__custom-place-upload-label--has-image' : ''}`}
            >
              {customFoodImage ? (
                <>
                  {previewUrl && (
                    <div className="trip-details__custom-place-upload-preview-container">
                      <img
                        src={previewUrl}
                        alt="Selected food"
                        className="trip-details__custom-place-upload-preview-image"
                      />
                      <button
                        type="button"
                        className="trip-details__custom-place-delete-image"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setCustomFoodImage(null);
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
                Food &amp; Beverage name <span className="trip-details__custom-place-required">*</span>
              </span>
              <input type="text" className="trip-details__custom-place-input" placeholder="Enter the place name" value={customFoodName} onChange={(e) => setCustomFoodName(e.target.value)} required />
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
                  value={customFoodAddress}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomFoodAddress(value);
                    setCustomFoodAddressSelection(null);
                    setCustomFoodAddressSuggestionsOpen(true);
                    if (!value.trim()) {
                      setFoodPredictions([]);
                      return;
                    }
                    fetchPlacesPredictions(value, (predictions) => {
                      setFoodPredictions(predictions || []);
                    });
                  }}
                  onFocus={() => {
                    setCustomFoodAddressSuggestionsOpen(true);
                    if (customFoodAddress.trim()) {
                      fetchPlacesPredictions(customFoodAddress, (predictions) => {
                        setFoodPredictions(predictions || []);
                      });
                    }
                  }}
                  onBlur={() => setTimeout(() => setCustomFoodAddressSuggestionsOpen(false), 200)}
                  required
                />
                {customFoodAddressSuggestionsOpen && customFoodAddress.trim() && (
                  <ul className="trip-details__custom-transport-suggestions">
                    {foodPredictions.length > 0 ? (
                      foodPredictions.map((prediction) => (
                        <li key={prediction.place_id}>
                          <button
                            type="button"
                            className="trip-details__custom-transport-suggestion-item"
                            onMouseDown={() => {
                              const name = prediction.structured_formatting?.main_text || prediction.description;
                              const address = prediction.structured_formatting?.secondary_text || prediction.description || 'Location';
                              setCustomFoodAddress(prediction.description || name);
                              setCustomFoodAddressSelection({
                                id: prediction.place_id,
                                name,
                                address: prediction.description || address,
                                description: prediction.description || name,
                                source: 'Google Places',
                                lat: Number.isFinite(Number(prediction.lat)) ? Number(prediction.lat) : null,
                                lng: Number.isFinite(Number(prediction.lng)) ? Number(prediction.lng) : null,
                              });
                              setCustomFoodAddressSuggestionsOpen(false);
                              setFoodPredictions([]);
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
              <select className="trip-details__custom-place-select" value={customFoodDateKey} onChange={(e) => setCustomFoodDateKey(e.target.value)} required>
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
                <input type="time" className="trip-details__custom-place-input" value={customFoodStartTime} onChange={(e) => setCustomFoodStartTime(e.target.value)} required />
              </span>
            </label>
          </div>
          <label className="trip-details__custom-place-label">
            <span className="trip-details__custom-place-label-heading">
              Duration <span className="trip-details__custom-place-required">*</span>
            </span>
            <div className="trip-details__custom-place-duration">
              <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customFoodDurationHrs} onChange={(e) => setCustomFoodDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
              <span> hr </span>
              <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customFoodDurationMins} onChange={(e) => setCustomFoodDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
              <span> mins</span>
            </div>
          </label>
          <label className="trip-details__custom-place-label">
            Note (Optional)
            <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customFoodNote} onChange={(e) => setCustomFoodNote(e.target.value)} rows={3} />
          </label>
          <label className="trip-details__custom-place-label">
            Cost (Optional)
            <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customFoodCost} onChange={(e) => setCustomFoodCost(e.target.value)} />
            <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
          </label>
          <label className="trip-details__custom-place-label">
            Travel Documents
            <p className="trip-details__custom-place-docs-hint">
              Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.
            </p>
            <input id="custom-food-docs" type="file" multiple accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp" className="trip-details__custom-place-file-input" onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, 3);
              setCustomFoodTravelDocs(files);
            }} />
            <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-food-docs')?.click()}>
              <Paperclip size={18} aria-hidden /> Attach files
              {customFoodTravelDocs.length > 0 && (
                <span className="trip-details__custom-place-attach-count"> ({customFoodTravelDocs.length})</span>
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
