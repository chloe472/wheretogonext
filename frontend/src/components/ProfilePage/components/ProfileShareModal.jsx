import { useState, useEffect, useRef } from 'react';
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

export default function ProfileShareModal({
  open,
  friends,
  selectedFriendIds,
  sending,
  onToggleFriend,
  onSend,
  onCopy,
  onClose,
  onInviteByEmail,
  onInviteByUser,
  onSearchUsers,
}) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const q = inviteQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setDropdownOpen(false);
      setSearching(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const data = await onSearchUsers(q, { signal: abortRef.current.signal });
        setSearchResults(Array.isArray(data?.users) ? data.users : []);
        setDropdownOpen(true);
      } catch (err) {
        if (err?.name !== 'AbortError') setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [inviteQuery, onSearchUsers]);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!open) return null;

  const friendList = Array.isArray(friends) ? friends : [];
  const selected = Array.isArray(selectedFriendIds) ? selectedFriendIds : [];
  const isEmail = inviteQuery.includes('@');

  const handleSelectUser = async (u) => {
    setDropdownOpen(false);
    setInviteQuery('');
    setInviteError('');
    setInviteSending(true);
    try {
      await onInviteByUser(u);
    } catch (err) {
      setInviteError(err?.message || 'Could not send invite.');
    } finally {
      setInviteSending(false);
    }
  };

  const handleInvite = async () => {
    const email = inviteQuery.trim().toLowerCase();
    if (!email) return;
    setInviteSending(true);
    setInviteError('');
    setDropdownOpen(false);
    try {
      await onInviteByEmail(email);
      setInviteQuery('');
    } catch (err) {
      setInviteError(err?.message || 'Could not send invite.');
    } finally {
      setInviteSending(false);
    }
  };

  return (
    <div className="trip-share__overlay" role="dialog" aria-modal="true" aria-labelledby="profile-share-title">
      <button type="button" className="trip-share__backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-share__card">
        <div className="trip-share__head">
          <h2 id="profile-share-title" className="trip-share__title">Share profile</h2>
          <button type="button" className="trip-share__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="trip-share__body">
          {}
          <div className="trip-share__invite-section">
            <div className="trip-share__invite-row-wrap" ref={wrapRef}>
              <div className="trip-share__invite-field">
                <input
                  className="trip-share__invite-input"
                  type="text"
                  placeholder="Invite by name or email"
                  value={inviteQuery}
                  onChange={(e) => { setInviteQuery(e.target.value); setInviteError(''); }}
                  onFocus={() => { if (searchResults.length > 0) setDropdownOpen(true); }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && isEmail) handleInvite(); }}
                  autoComplete="off"
                />
                {searching && <div className="trip-share__invite-spinner" />}
              </div>
              <button
                type="button"
                className="trip-share__send-btn"
                onClick={handleInvite}
                disabled={inviteSending || !isEmail}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {inviteSending ? 'Sending…' : 'Send invite'}
              </button>

              {dropdownOpen && searchResults.length > 0 && (
                <ul className="trip-share__search-dropdown">
                  {searchResults.map((u) => (
                    <li key={u.id}>
                      <button
                        type="button"
                        className="trip-share__search-result"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectUser(u)}
                      >
                        <Avatar user={u} />
                        <span className="trip-share__search-name">{u.name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {inviteError && <p className="trip-share__invite-error">{inviteError}</p>}
          </div>

          {}
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
