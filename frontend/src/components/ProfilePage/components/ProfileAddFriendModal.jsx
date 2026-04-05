import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';

export default function ProfileAddFriendModal({
  open,
  onClose,
  addFriendValue,
  setAddFriendValue,
  addFriendResults,
  addFriendSelectedId,
  setAddFriendSelectedId,
  addFriendError,
  setAddFriendError,
  addFriendLoading,
  addFriendSearching,
  submitAddFriend,
}) {
  if (!open) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="add-friend-title">
      <button
        type="button"
        className="profile-page__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="profile-page__modal-card profile-page__modal-card--compact">
        <div className="profile-page__modal-head">
          <h2 id="add-friend-title" className="profile-page__modal-title">Add friend</h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="profile-page__modal-body">
          <div className="add-friend-search-wrap">
            <input
              className="profile-page__modal-input add-friend-search-input"
              type="text"
              placeholder="Search by name or email…"
              value={addFriendValue}
              autoFocus
              onChange={(e) => {
                setAddFriendValue(e.target.value);
                setAddFriendSelectedId(null);
                setAddFriendError('');
              }}
              onKeyDown={(e) => { if (e.key === 'Enter' && addFriendSelectedId) submitAddFriend(); }}
            />
            {addFriendSearching && (
              <div className="add-friend-status add-friend-status--searching">Searching…</div>
            )}
            {!addFriendSearching && addFriendError && addFriendValue.trim().length >= 2 && (
              <div className="add-friend-status add-friend-status--empty">{addFriendError}</div>
            )}
            {!addFriendSearching && addFriendResults.length > 0 && (
              <div className="add-friend-results">
                {addFriendResults.map((u) => {
                  const selected = addFriendSelectedId === u.id;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      className={`add-friend-preview${selected ? ' add-friend-preview--selected' : ''}`}
                      onClick={() => setAddFriendSelectedId((prev) => (prev === u.id ? null : u.id))}
                    >
                      <div className="add-friend-preview__avatar">
                        {u.picture
                          ? (
                            <img
                              src={resolveImageUrl(u.picture)}
                              alt=""
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                              onError={applyImageFallback}
                            />
                          )
                          : <span>{(u.name || '?')[0].toUpperCase()}</span>
                        }
                      </div>
                      <div className="add-friend-preview__info">
                        <span className="add-friend-preview__name">{u.name || 'Traveler'}</span>
                        {u.email && (
                          <span className="add-friend-preview__handle">@{u.email.split('@')[0]}</span>
                        )}
                      </div>
                      {selected && <span className="add-friend-preview__check">✓</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <div className="profile-page__modal-actions">
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="profile-page__modal-btn profile-page__modal-btn--primary"
            onClick={submitAddFriend}
            disabled={addFriendLoading || !addFriendSelectedId}
          >
            {addFriendLoading ? 'Sending…' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  );
}
