import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';

function Avatar({ user }) {
  if (!user) return null;
  return user.picture ? (
    <img
      src={resolveImageUrl(user.picture)}
      alt=""
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={applyImageFallback}
      className="trip-share__friend-avatar"
    />
  ) : (
    <div className="trip-share__friend-avatar trip-share__friend-avatar--placeholder">
      {(user.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function ProfileShareModal({
  open,
  friends,
  selectedFriendIds,
  sending,
  onToggleFriend,
  onSend,
  onCopy,
  onClose,
}) {
  if (!open) return null;

  const friendList = Array.isArray(friends) ? friends : [];
  const selected = Array.isArray(selectedFriendIds) ? selectedFriendIds : [];

  return (
    <div className="trip-share__overlay" role="dialog" aria-modal="true" aria-labelledby="profile-share-title">
      <button
        type="button"
        className="trip-share__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="trip-share__card">
        <div className="trip-share__head">
          <h2 id="profile-share-title" className="trip-share__title">Share profile</h2>
          <button type="button" className="trip-share__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="trip-share__body">
          {friendList.length > 0 && (
            <div className="trip-share__friends-section">
              <p className="trip-share__label">Share with friends</p>
              <div className="trip-share__friends-grid">
                {friendList.map((friend) => {
                  const isSelected = selected.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={`trip-share__friend-btn${isSelected ? ' trip-share__friend-btn--shared' : ''}`}
                      onClick={() => onToggleFriend(friend.id)}
                      title={friend.name}
                    >
                      <Avatar user={friend} />
                      <span className="trip-share__friend-name">{friend.name || 'Friend'}</span>
                      {isSelected && <span className="trip-share__friend-check">✓</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {friendList.length === 0 && (
            <p className="trip-share__empty">Add friends to notify them about your profile.</p>
          )}
        </div>

        <div className="trip-share__footer">
          <button type="button" className="trip-share__footer-btn trip-share__footer-btn--ghost" onClick={onCopy}>
            Copy link
          </button>
          {friendList.length > 0 && (
            <button
              type="button"
              className="trip-share__footer-btn trip-share__footer-btn--primary"
              onClick={onSend}
              disabled={sending || selected.length === 0}
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
