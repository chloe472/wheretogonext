import { useState, useEffect } from 'react';
import { Pencil, Share2, UserMinus, UserPlus } from 'lucide-react';

export default function ProfileHeader({
  picture,
  displayName,
  profile,
  socialsList,
  interestsList,
  flagForCountry,
  platformIcon,
  isSelf,
  requestStatus,
  isFriend,
  friendLoading,
  incomingRequestId,
  onEdit,
  onAcceptRequest,
  onDeclineRequest,
  onFriendToggle,
  onShare,
  resolveImageUrl,
}) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [picture]);

  return (
    <header className="profile-page__header">
      <div className="profile-page__avatar-wrap">
        <div className="profile-page__avatar-border">
          <div className="profile-page__avatar-inner">
            {picture && !imgError ? (
              <img
                src={resolveImageUrl(picture)}
                alt=""
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="profile-page__avatar-placeholder">
                {(displayName || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="profile-page__identity">
        <h1 className="profile-page__name">{displayName}</h1>
        {profile?.intro && (
          <p className="profile-page__subtitle profile-page__subtitle--intro">{profile.intro}</p>
        )}
        {socialsList.length > 0 && (
          <div className="profile-page__socials-display">
            {socialsList.map((s, idx) => (
              <span key={`${s.platform}-${idx}`} className="profile-page__social-row">
                <span className="profile-page__social-icon profile-page__social-icon--row">
                  {platformIcon(s.platform)}
                </span>
                <span className="profile-page__social-row-text">
                  <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                  {(s.handle || s.url) && (
                    <span className="profile-page__social-handle">{s.handle || s.url}</span>
                  )}
                </span>
              </span>
            ))}
          </div>
        )}
        {profile?.nationality && (
          <div className="profile-page__meta profile-page__meta--stack">
            <span className="profile-page__meta-label">Nationality</span>
            <span className="profile-page__meta-value">
              {`${flagForCountry(profile.nationality)} ${profile.nationality}`}
            </span>
          </div>
        )}
        {interestsList.length > 0 && (
          <div className="profile-page__chips">
            {interestsList.map((interest) => (
              <span key={interest} className="profile-page__chip">{interest}</span>
            ))}
          </div>
        )}
        {!profile?.intro && (
          <p className="profile-page__subtitle profile-page__subtitle--intro profile-page__subtitle--placeholder">
            Add a short intro about your travel style.
          </p>
        )}
      </div>
      <div className="profile-page__actions">
        {isSelf && (
          <button type="button" className="profile-page__btn profile-page__btn--primary" onClick={onEdit}>
            <Pencil size={16} aria-hidden />
            <span>Edit profile</span>
          </button>
        )}
        {!isSelf && requestStatus === 'incoming' && (
          <div className="profile-page__incoming-actions">
            <button
              type="button"
              className="profile-page__btn profile-page__btn--primary"
              onClick={() => onAcceptRequest(incomingRequestId)}
            >
              Accept
            </button>
            <button
              type="button"
              className="profile-page__btn profile-page__btn--ghost"
              onClick={() => onDeclineRequest(incomingRequestId)}
            >
              Decline
            </button>
          </div>
        )}
        {!isSelf && requestStatus !== 'incoming' && (
          <button
            type="button"
            className={`profile-page__btn ${isFriend ? 'profile-page__btn--ghost' : 'profile-page__btn--primary'}`}
            onClick={onFriendToggle}
            disabled={friendLoading}
          >
            {isFriend || requestStatus === 'outgoing' ? (
              <UserMinus size={16} aria-hidden />
            ) : (
              <UserPlus size={16} aria-hidden />
            )}
            <span>
              {isFriend
                ? 'Unfriend'
                : requestStatus === 'outgoing'
                  ? 'Request sent'
                  : 'Add friend'}
            </span>
          </button>
        )}
        <button type="button" className="profile-page__btn" onClick={onShare}>
          <Share2 size={16} aria-hidden />
          <span>Share</span>
        </button>
      </div>
    </header>
  );
}
