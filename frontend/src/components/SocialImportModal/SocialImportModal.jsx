import { X, Plus, Loader2 } from 'lucide-react';
import { placeKeySocialImport } from './socialImportUtils';
import SocialImportLocationMismatchBanner from './SocialImportLocationMismatchBanner';


export default function SocialImportModal({
  isOpen,
  onClose,
  step,
  onStepChange,
  day,
  cityQuery,
  files,
  onFilesAppend,
  filePreviews,
  fileInputRef,
  onRemoveFileAt,
  onRunAnalysis,
  results,
  selectedKeys,
  onTogglePlace,
  onAddSelectedToTrip,
  resolveImageUrl,
  onImageError,
  locationInsight,
  onAddDetectedDestination,
}) {
  if (!isOpen) return null;

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div
        className="trip-details__custom-place-modal trip-details__social-import-modal"
        role="dialog"
        aria-labelledby="social-import-title"
        aria-modal="true"
      >
        <div className="trip-details__custom-place-head">
          <h2 id="social-import-title" className="trip-details__custom-place-title">Import from social media</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>

        {step === 'input' && (
          <div className="trip-details__social-import-body">
            <p className="trip-details__social-import-meta">
              Day {day}
              {cityQuery ? (
                <>
                  {' '}
                  · Matching places near <strong>{cityQuery}</strong>
                </>
              ) : null}
            </p>
            <p className="trip-details__social-import-hint">
              Upload screenshots from TikTok, Instagram, Pinterest, or anywhere else and we&apos;ll detect places from them.
            </p>
            <div className="trip-details__social-import-field">
              <span className="trip-details__custom-place-label">Screenshots</span>
              <div className="trip-details__social-import-upload-wrap">
                {filePreviews.length > 0 ? (
                  <div className="trip-details__social-import-preview-row">
                    {filePreviews.map((p, idx) => (
                      <div key={p.url} className="trip-details__social-import-preview-tile">
                        <img
                          src={p.url}
                          alt=""
                          className="trip-details__social-import-preview-img"
                          loading="lazy"
                          decoding="async"
                        />
                        <button
                          type="button"
                          className="trip-details__social-import-preview-remove"
                          aria-label="Remove image"
                          onClick={() => onRemoveFileAt(idx)}
                        >
                          <X size={14} aria-hidden />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <label className="trip-details__social-import-add-tile" htmlFor="social-import-files">
                  <input
                    id="social-import-files"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="trip-details__social-import-file-input"
                    onChange={(e) => {
                      const incoming = Array.from(e.target.files || []);
                      if (!incoming.length) return;
                      onFilesAppend(incoming);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  />
                  <span className="trip-details__social-import-add-inner">
                    <Plus size={32} strokeWidth={1.35} className="trip-details__social-import-plus" aria-hidden />
                    <span className="trip-details__social-import-add-caption">Add image</span>
                  </span>
                </label>
              </div>
              {files.length > 0 ? (
                <p className="trip-details__social-import-file-count">{files.length} image(s) selected</p>
              ) : null}
            </div>
            <div className="trip-details__custom-place-actions">
              <button type="button" className="trip-details__custom-place-cancel" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="trip-details__custom-place-submit" onClick={() => onRunAnalysis()}>
                Next
              </button>
            </div>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="trip-details__social-import-analyzing" aria-busy="true">
            <Loader2 size={36} className="trip-details__social-import-spinner" aria-hidden />
            <p>Analyzing your screenshots…</p>
            <p className="trip-details__social-import-analyzing-sub">
              Finding popular places near {cityQuery || 'your destination'}.
            </p>
          </div>
        )}

        {step === 'results' && (
          <div className="trip-details__social-import-body">
            <SocialImportLocationMismatchBanner
              locationInsight={locationInsight}
              onAddDetectedDestination={onAddDetectedDestination}
            />
            <p className="trip-details__social-import-results-intro">
              {locationInsight?.mismatch
                ? (
                  <>
                    Select places below to add to <strong>Day {day}</strong> on your itinerary (even if they’re outside {cityQuery || 'your trip city'}). You can remove any before adding.
                  </>
                )
                : (
                  <>
                    Select places to add to <strong>Day {day}</strong>. You can remove any before adding.
                  </>
                )}
            </p>
            <ul className="trip-details__social-import-list">
              {results.map((place, idx) => {
                const key = placeKeySocialImport(place, idx);
                const fallbackPreviewUrl =
                  Number.isInteger(place?.imageIndex) && filePreviews[place.imageIndex]?.url
                    ? filePreviews[place.imageIndex].url
                    : '';
                const resultImageUrl = place.image || fallbackPreviewUrl;
                return (
                  <li key={key} className="trip-details__social-import-row">
                    <label className="trip-details__social-import-label">
                      <input
                        type="checkbox"
                        className="trip-details__social-import-checkbox"
                        checked={selectedKeys.has(key)}
                        onChange={() => onTogglePlace(key)}
                      />
                      <img
                        src={resolveImageUrl(resultImageUrl, place.name, 'landmark')}
                        alt=""
                        className="trip-details__social-import-thumb"
                        onError={onImageError}
                      />
                      <span className="trip-details__social-import-row-text">
                        <span className="trip-details__social-import-name">{place.name}</span>
                        <span className="trip-details__social-import-address">{place.address || cityQuery}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="trip-details__custom-place-actions">
              <button type="button" className="trip-details__custom-place-cancel" onClick={() => onStepChange('input')}>
                Back
              </button>
              <button type="button" className="trip-details__custom-place-submit" onClick={onAddSelectedToTrip}>
                Add selected to itinerary
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
