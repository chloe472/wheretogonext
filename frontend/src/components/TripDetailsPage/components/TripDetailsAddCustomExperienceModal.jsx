import { Paperclip, X } from 'lucide-react';
import { EXPERIENCE_TYPES, getDefaultStartTimeForDate } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddCustomExperienceModal({
  onClose,
  onSubmit,
  days,
  tripExpenseItems,
  currency,
  customExperienceName,
  setCustomExperienceName,
  customExperienceType,
  setCustomExperienceType,
  customExperienceAddress,
  setCustomExperienceAddress,
  customExperienceDateKey,
  setCustomExperienceDateKey,
  customExperienceStartTime,
  setCustomExperienceStartTime,
  customExperienceDurationHrs,
  setCustomExperienceDurationHrs,
  customExperienceDurationMins,
  setCustomExperienceDurationMins,
  customExperienceNote,
  setCustomExperienceNote,
  customExperienceCost,
  setCustomExperienceCost,
  customExperienceExternalLink,
  setCustomExperienceExternalLink,
  customExperienceTravelDocs,
  setCustomExperienceTravelDocs,
}) {
  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__custom-place-modal" role="dialog" aria-labelledby="custom-experience-title" aria-modal="true">
        <div className="trip-details__custom-place-head">
          <h2 id="custom-experience-title" className="trip-details__custom-place-title">
            Add Custom Experience
          </h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <form className="trip-details__custom-place-form" onSubmit={onSubmit}>
          <div className="trip-details__custom-place-row">
            <label className="trip-details__custom-place-label">
              <span className="trip-details__custom-place-label-heading">
                Experience name <span className="trip-details__custom-place-required">*</span>
              </span>
              <input type="text" className="trip-details__custom-place-input" placeholder="Enter experience name" value={customExperienceName} onChange={(e) => setCustomExperienceName(e.target.value)} required />
            </label>
            <label className="trip-details__custom-place-label">
              <span className="trip-details__custom-place-label-heading">
                Experience type <span className="trip-details__custom-place-required">*</span>
              </span>
              <select className="trip-details__custom-place-select" value={customExperienceType} onChange={(e) => setCustomExperienceType(e.target.value)} required>
                {EXPERIENCE_TYPES.filter((type) => type !== 'All').map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="trip-details__custom-place-label">
            <span className="trip-details__custom-place-label-heading">
              Address / meeting point <span className="trip-details__custom-place-required">*</span>
            </span>
            <input type="text" className="trip-details__custom-place-input" placeholder="Enter meeting point or location" value={customExperienceAddress} onChange={(e) => setCustomExperienceAddress(e.target.value)} required />
          </label>
          <div className="trip-details__custom-place-row">
            <label className="trip-details__custom-place-label">
              <span className="trip-details__custom-place-label-heading">
                Date <span className="trip-details__custom-place-required">*</span>
              </span>
              <select
                className="trip-details__custom-place-select"
                value={customExperienceDateKey}
                onChange={(e) => {
                  const nextDate = e.target.value;
                  const durationMinutes = Number(customExperienceDurationHrs || 0) * 60 + Number(customExperienceDurationMins || 0);
                  setCustomExperienceDateKey(nextDate);
                  setCustomExperienceStartTime(
                    getDefaultStartTimeForDate(tripExpenseItems, nextDate, '07:00', durationMinutes),
                  );
                }}
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
              <input type="time" className="trip-details__custom-place-input" value={customExperienceStartTime} onChange={(e) => setCustomExperienceStartTime(e.target.value)} required />
            </label>
          </div>
          <label className="trip-details__custom-place-label">
            <span className="trip-details__custom-place-label-heading">
              Duration <span className="trip-details__custom-place-required">*</span>
            </span>
            <div className="trip-details__custom-place-duration">
              <input type="number" min={0} max={23} className="trip-details__custom-place-duration-input" value={customExperienceDurationHrs} onChange={(e) => setCustomExperienceDurationHrs(Number(e.target.value) || 0)} aria-label="Hours" />
              <span> hr </span>
              <input type="number" min={0} max={59} className="trip-details__custom-place-duration-input" value={customExperienceDurationMins} onChange={(e) => setCustomExperienceDurationMins(Number(e.target.value) || 0)} aria-label="Minutes" />
              <span> mins</span>
            </div>
          </label>
          <label className="trip-details__custom-place-label">
            Note (Optional)
            <textarea className="trip-details__custom-place-textarea" placeholder="Enter your note..." value={customExperienceNote} onChange={(e) => setCustomExperienceNote(e.target.value)} rows={3} />
          </label>
          <label className="trip-details__custom-place-label">
            Cost (Optional)
            <input type="number" step="0.01" min={0} className="trip-details__custom-place-input" placeholder="0" value={customExperienceCost} onChange={(e) => setCustomExperienceCost(e.target.value)} />
            <span className="trip-details__custom-place-currency-hint">{currency} — adds to trip budget</span>
          </label>
          <label className="trip-details__custom-place-label">
            External link (Optional)
            <input type="url" className="trip-details__custom-place-input" placeholder="https://" value={customExperienceExternalLink} onChange={(e) => setCustomExperienceExternalLink(e.target.value)} />
          </label>
          <label className="trip-details__custom-place-label">
            Travel Documents
            <p className="trip-details__custom-place-docs-hint">
              Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.
            </p>
            <input id="custom-experience-docs" type="file" multiple accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp" className="trip-details__custom-place-file-input" onChange={(e) => {
              const files = Array.from(e.target.files || []).slice(0, 3);
              setCustomExperienceTravelDocs(files);
            }} />
            <button type="button" className="trip-details__custom-place-attach" onClick={() => document.getElementById('custom-experience-docs')?.click()}>
              <Paperclip size={18} aria-hidden /> Attach files
              {customExperienceTravelDocs.length > 0 && (
                <span className="trip-details__custom-place-attach-count"> ({customExperienceTravelDocs.length})</span>
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
