import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';

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

export default function TripShareModal({
  open,
  loading,
  friends,
  onClose,
  onShareWithFriend,
  onCopy,
}) {
  if (!open) return null;

  const friendList = Array.isArray(friends) ? friends : [];

  return (
    <div className="trip-share__overlay" role="dialog" aria-modal="true" aria-labelledby="trip-share-title">
      <button
        type="button"
        className="trip-share__backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="trip-share__card">
        <div className="trip-share__head">
          <h2 id="trip-share-title" className="trip-share__title">Share trip</h2>
          <button type="button" className="trip-share__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="trip-share__body">
          {loading && <p className="trip-share__empty">Loading…</p>}
          {!loading && friendList.length > 0 && (
            <div className="trip-share__friends-section">
              <p className="trip-share__label">Share with friends</p>
              <div className="trip-share__friends-grid">
                {friendList.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    className="trip-share__friend-btn"
                    onClick={() => onShareWithFriend(friend)}
                    title={`Share with ${friend.name}`}
                  >
                    <Avatar user={friend} />
                    <span className="trip-share__friend-name">{friend.name || 'Friend'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!loading && friendList.length === 0 && (
            <p className="trip-share__empty">Add friends to share trips with them.</p>
          )}
        </div>

        <div className="trip-share__footer">
          <button type="button" className="trip-share__footer-btn trip-share__footer-btn--ghost" onClick={onClose}>
            Close
          </button>
          <button type="button" className="trip-share__footer-btn trip-share__footer-btn--primary" onClick={onCopy}>
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}
