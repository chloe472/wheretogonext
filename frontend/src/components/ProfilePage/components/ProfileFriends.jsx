import { useState } from 'react';
import { Link } from 'react-router-dom';
import { resolveImageUrl } from '../../../lib/imageFallback';

function emailHandle(email) {
  return email ? `@${email.split('@')[0]}` : '';
}

function FriendAvatar({ picture, name }) {
  const [imgError, setImgError] = useState(false);
  if (picture && !imgError) {
    return (
      <img
        src={resolveImageUrl(picture)}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
      />
    );
  }
  return <span>{(name || '?').charAt(0).toUpperCase()}</span>;
}

export default function ProfileFriends({
  isSelf,
  requests,
  requestsLoading,
  outgoingRequests,
  outgoingLoading,
  friendsList,
  onAccept,
  onDecline,
  onRemove,
  onOpenAddFriend,
  displayName,
}) {
  return (
    <>
      <div className="profile-page__section-head">
        <h2 className="profile-page__section-title">{isSelf ? 'My Friends' : 'Friends'}</h2>
        {isSelf && (
          <button
            type="button"
            className="profile-page__btn profile-page__btn--ghost profile-page__add-friend-trigger"
            onClick={onOpenAddFriend}
          >
            Add friend
          </button>
        )}
      </div>
      {isSelf && (
        <div className="profile-page__friend-section">
          <h3 className="profile-page__requests-title">Friend Requests</h3>
          {requestsLoading ? (
            <p className="profile-page__empty">Loading requests...</p>
          ) : requests.length === 0 ? (
            <p className="profile-page__empty">No new requests.</p>
          ) : (
            <ul className="profile-page__requests-list">
              {requests.map((req) => (
                <li key={req.id} className="profile-page__request-card">
                  <Link to={`/profile/${req.from.id}`} className="profile-page__friend-card">
                    <div className="profile-page__friend-avatar">
                      <FriendAvatar picture={req.from.picture} name={req.from.name} />
                    </div>
                    <div className="profile-page__friend-info">
                      <span className="profile-page__friend-name">{req.from.name || 'Traveler'}</span>
                      <span className="profile-page__friend-handle">
                        {req.from.email ? `@${emailHandle(req.from.email)}` : ''}
                      </span>
                    </div>
                  </Link>
                  <div className="profile-page__request-actions">
                    <button type="button" onClick={() => onAccept(req.id)} className="profile-page__btn profile-page__btn--primary">
                      Accept
                    </button>
                    <button type="button" onClick={() => onDecline(req.id)} className="profile-page__btn profile-page__btn--ghost">
                      Decline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      {isSelf && (
        <div className="profile-page__friend-section">
          <h3 className="profile-page__requests-title">Requests Sent</h3>
          {outgoingLoading ? (
            <p className="profile-page__empty">Loading requests...</p>
          ) : outgoingRequests.length === 0 ? (
            <p className="profile-page__empty">No pending requests.</p>
          ) : (
            <ul className="profile-page__requests-list">
              {outgoingRequests.map((req) => (
                <li key={req.id} className="profile-page__request-card">
                  <Link to={`/profile/${req.to.id}`} className="profile-page__friend-card">
                    <div className="profile-page__friend-avatar">
                      <FriendAvatar picture={req.to.picture} name={req.to.name} />
                    </div>
                    <div className="profile-page__friend-info">
                      <span className="profile-page__friend-name">{req.to.name || 'Traveler'}</span>
                      <span className="profile-page__friend-handle">
                        {emailHandle(req.to.email)}
                      </span>
                    </div>
                  </Link>
                  <div className="profile-page__request-actions">
                    <button type="button" onClick={() => onDecline(req.id)} className="profile-page__btn profile-page__btn--ghost">
                      Cancel
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <div className="profile-page__friend-section">
        <h3 className="profile-page__requests-title">{isSelf ? 'Friends' : `${displayName}'s friends`}</h3>
        {friendsList.length === 0 ? (
          <p className="profile-page__empty">
            {isSelf ? 'No friends yet.' : 'No friends to show yet.'}
          </p>
        ) : (
          <ul className="profile-page__friends-list">
            {friendsList.map((friend) => (
              <li key={friend.id}>
                <Link to={`/profile/${friend.id}`} className="profile-page__friend-card">
                  <div className="profile-page__friend-avatar">
                    <FriendAvatar picture={friend.picture} name={friend.name} />
                  </div>
                  <div className="profile-page__friend-info">
                    <span className="profile-page__friend-name">{friend.name || 'Traveler'}</span>
                    <span className="profile-page__friend-handle">
                      {emailHandle(friend.email)}
                    </span>
                  </div>
                </Link>
                {isSelf && (
                  <button
                    type="button"
                    className="profile-page__friend-remove"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onRemove(friend.id);
                    }}
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
