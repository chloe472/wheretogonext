export default function ProfileRenameTripModal({
  renameTarget,
  renameTitleDraft,
  setRenameTitleDraft,
  onClose,
  onSave,
}) {
  if (!renameTarget) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="rename-trip-title">
      <button
        type="button"
        className="profile-page__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="profile-page__modal-card profile-page__modal-card--compact">
        <div className="profile-page__modal-head">
          <h2 id="rename-trip-title" className="profile-page__modal-title">Rename trip</h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="profile-page__modal-body">
          <label className="profile-page__form-label">
            Trip name
            <input
              className="profile-page__input"
              type="text"
              value={renameTitleDraft}
              onChange={(e) => setRenameTitleDraft(e.target.value)}
            />
          </label>
        </div>
        <div className="profile-page__modal-actions">
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--primary" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
