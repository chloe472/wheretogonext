import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { searchUsers, fetchMyProfile } from '../../../api/profileApi';
import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';

function UserAvatar({ user, className }) {
  if (!user) return null;
  return user.picture ? (
    <img
      src={resolveImageUrl(user.picture)}
      alt=""
      referrerPolicy="no-referrer"
      crossOrigin="anonymous"
      onError={applyImageFallback}
      className={className}
    />
  ) : (
    <div className={`${className} ${className}--placeholder`}>
      {(user.name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

export default function TripmatesInviteSection({ myEmail, invitedEmails, onInvitedEmailsChange }) {
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false);
  const [friends, setFriends] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);

  const friendsDropdownRef = useRef(null);
  const inviteWrapRef = useRef(null);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);

  
  useEffect(() => {
    setFriendsLoading(true);
    fetchMyProfile()
      .then((data) => setFriends(Array.isArray(data?.friends) ? data.friends : []))
      .catch(() => setFriends([]))
      .finally(() => setFriendsLoading(false));
  }, []);

  
  useEffect(() => {
    const q = inviteQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchDropdownOpen(false);
      setSearching(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      setSearching(true);
      try {
        const data = await searchUsers(q, { signal: abortRef.current.signal });
        const results = Array.isArray(data?.users) ? data.users : [];
        setSearchResults(results);
        setSearchDropdownOpen(true);
      } catch (err) {
        if (err?.name !== 'AbortError') setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [inviteQuery]);

  
  useEffect(() => {
    if (!friendsOpen) return;
    const handleClick = (e) => {
      if (friendsDropdownRef.current && !friendsDropdownRef.current.contains(e.target)) {
        setFriendsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [friendsOpen]);

  
  useEffect(() => {
    if (!searchDropdownOpen) return;
    const handleClick = (e) => {
      if (inviteWrapRef.current && !inviteWrapRef.current.contains(e.target)) {
        setSearchDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [searchDropdownOpen]);

  const handleSelectUser = (user) => {
    const email = String(user.email || '').trim().toLowerCase();
    if (!email) return;
    if (email === myEmail) {
      setInviteError('You cannot add yourself as a tripmate.');
      setSearchDropdownOpen(false);
      return;
    }
    setSearchDropdownOpen(false);
    setInviteQuery('');
    setInviteError('');
    if (!invitedEmails.includes(email)) {
      onInvitedEmailsChange((prev) => [...prev, email]);
    }
  };

  const handleAddFriend = (friend) => {
    const email = String(friend.email || '').trim().toLowerCase();
    if (!email || email === myEmail) return;
    if (invitedEmails.includes(email)) {
      onInvitedEmailsChange((prev) => prev.filter((e) => e !== email));
    } else {
      onInvitedEmailsChange((prev) => [...prev, email]);
    }
  };

  const addedEmails = new Set(invitedEmails);

  
  const allKnownUsers = [...friends, ...searchResults];
  const getUserForEmail = (email) =>
    allKnownUsers.find((u) => String(u.email || '').trim().toLowerCase() === email);

  return (
    <div className="new-trip__invite-section">
      <div className="new-trip__invite-row">
        <button
          type="button"
          className="new-trip__invite"
          onClick={() => setInviteOpen((o) => !o)}
          aria-expanded={inviteOpen}
        >
          + Invite tripmates
        </button>
        <div className="new-trip__friends-wrap" ref={friendsDropdownRef}>
          <button
            type="button"
            className="new-trip__friends-btn"
            onClick={() => setFriendsOpen((o) => !o)}
            aria-expanded={friendsOpen}
            aria-haspopup="listbox"
          >
            <Users size={18} aria-hidden />
            Friends
            {invitedEmails.some((e) => friends.some((f) => String(f.email || '').trim().toLowerCase() === e)) && (
              <span className="new-trip__friends-count">
                {invitedEmails.filter((e) => friends.some((f) => String(f.email || '').trim().toLowerCase() === e)).length}
              </span>
            )}
            <ChevronDown size={16} aria-hidden />
          </button>
          {friendsOpen && (
            <div className="new-trip__friends-dropdown" role="listbox">
              {friendsLoading && <p className="new-trip__friends-hint">Loading friends…</p>}
              {!friendsLoading && friends.length === 0 && (
                <p className="new-trip__friends-hint">
                  No friends added yet. Use &quot;+ Invite tripmates&quot; to search by name or email.
                </p>
              )}
              {!friendsLoading && friends.length > 0 && (
                <>
                  <p className="new-trip__friends-label">Add tripmates from friends</p>
                  <div className="new-trip__friends-grid">
                    {friends.map((friend) => {
                      const email = String(friend.email || '').trim().toLowerCase();
                      const isAdded = email && addedEmails.has(email);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          className={`new-trip__friend-card${isAdded ? ' new-trip__friend-card--added' : ''}`}
                          onClick={() => handleAddFriend(friend)}
                          title={friend.name}
                        >
                          <UserAvatar user={friend} className="new-trip__friend-avatar" />
                          <span className="new-trip__friend-name">{friend.name || 'Friend'}</span>
                          {isAdded && <span className="new-trip__friend-check">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {inviteOpen && (
        <div className="new-trip__invite-panel">
          <label htmlFor="invite-search" className="new-trip__label">Search by name or email</label>
          <div className="new-trip__invite-search-wrap" ref={inviteWrapRef}>
            <div className="new-trip__invite-field">
              <input
                id="invite-search"
                type="text"
                className="new-trip__invite-input"
                placeholder=""
                value={inviteQuery}
                onChange={(e) => {
                  setInviteQuery(e.target.value);
                  setInviteError('');
                }}
                onFocus={() => { if (searchResults.length > 0) setSearchDropdownOpen(true); }}
                autoComplete="off"
              />
              {searching && <div className="new-trip__invite-spinner" />}
            </div>

            {searchDropdownOpen && (
              <ul className="new-trip__invite-dropdown">
                {searchResults.length === 0 && !searching && (
                  <li className="new-trip__invite-dropdown-empty">No users found</li>
                )}
                {searchResults.map((user) => {
                  const email = String(user.email || '').trim().toLowerCase();
                  const isAdded = email && addedEmails.has(email);
                  return (
                    <li key={user.id}>
                      <button
                        type="button"
                        className={`new-trip__invite-result${isAdded ? ' new-trip__invite-result--added' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectUser(user)}
                      >
                        <UserAvatar user={user} className="new-trip__invite-avatar" />
                        <div className="new-trip__invite-result-info">
                          <span className="new-trip__invite-result-name">{user.name}</span>
                          {user.email && (
                            <span className="new-trip__invite-result-email">{user.email}</span>
                          )}
                        </div>
                        {isAdded && <span className="new-trip__invite-result-check">✓ Added</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {inviteError && <p className="new-trip__error" role="alert">{inviteError}</p>}

          {invitedEmails.length > 0 && (
            <ul className="new-trip__invited-list">
              {invitedEmails.map((email) => {
                const user = getUserForEmail(email);
                return (
                  <li key={email} className="new-trip__invited-item">
                    {user ? (
                      <>
                        <UserAvatar user={user} className="new-trip__invited-avatar" />
                        <div className="new-trip__invited-info">
                          <span className="new-trip__invited-name">{user.name}</span>
                          <span className="new-trip__invited-email">{email}</span>
                        </div>
                      </>
                    ) : (
                      <span className="new-trip__invited-email">{email}</span>
                    )}
                    <button
                      type="button"
                      className="new-trip__invited-remove"
                      onClick={() => onInvitedEmailsChange((prev) => prev.filter((e) => e !== email))}
                      aria-label={`Remove ${email}`}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
