export default function ProfileShareTripModal({
  open,
  shareTrip,
  shareLoading,
  shareError,
  shareEmail,
  setShareEmail,
  onClose,
  onInvite,
  onRemove,
  onCopy,
}) {
  if (!open) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="share-trip-title">
      <button
        type="button"
        className="profile-page__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="profile-page__share-card">
        <div className="profile-page__modal-head">
          <h2 id="share-trip-title" className="profile-page__modal-title">Share with people</h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="profile-page__modal-body">
          <label className="profile-page__modal-label" htmlFor="share-email">Invite by email</label>
          <div className="profile-page__share-row">
            <input
              id="share-email"
              className="profile-page__modal-input"
              value={shareEmail}
              onChange={(e) => setShareEmail(e.target.value)}
              placeholder="name@email.com"
            />
            <button
              type="button"
              className="profile-page__btn profile-page__btn--primary"
              onClick={onInvite}
              disabled={shareLoading}
            >
              Send invite
            </button>
          </div>
          {shareError && <p className="profile-page__modal-error">{shareError}</p>}
          <div className="profile-page__share-list">
            {shareLoading && <p className="profile-page__empty">Loading collaborators…</p>}
            {!shareLoading && (shareTrip?.collaborators?.length || 0) === 0 && (
              <p className="profile-page__empty">No collaborators yet.</p>
            )}
            {!shareLoading && (shareTrip?.collaborators?.length || 0) > 0 && (
              <ul className="profile-page__collab-list">
                {shareTrip.collaborators.map((c) => (
                  <li key={c.email} className="profile-page__collab-item">
                    <span className="profile-page__collab-email">{c.email}</span>
                    <span className="profile-page__collab-role">Can view</span>
                    <button
                      type="button"
                      className="profile-page__collab-remove"
                      onClick={() => onRemove(c.email)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="profile-page__modal-actions">
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--primary" onClick={onCopy}>
            Copy planner link
          </button>
        </div>
      </div>
    </div>
  );
}
