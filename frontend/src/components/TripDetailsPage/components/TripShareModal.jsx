import { useState, useEffect, useRef, useMemo } from 'react';
import toast from 'react-hot-toast';
import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';

const ROLE_LABELS = { viewer: 'Can View', editor: 'Can Edit' };

function RoleDropdown({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (disabled) {
    return <span className="trip-share__role-static">{ROLE_LABELS[value] ?? value}</span>;
  }

  return (
    <div className="trip-share__role-dropdown" ref={ref}>
      <button
        type="button"
        className={`trip-share__role-btn${open ? ' trip-share__role-btn--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{ROLE_LABELS[value] ?? value}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="trip-share__role-menu" role="listbox">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              type="button"
              role="option"
              aria-selected={value === role}
              className={`trip-share__role-option${value === role ? ' trip-share__role-option--active' : ''}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(role); setOpen(false); }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  collaborators,
  owner,
  currentUserId,
  onSaveCollaboratorRoles,
  onRemoveCollaborator,
  onClose,
  onShareWithFriend,
  onInviteByEmail,
  onInviteByUser,
  onSearchUsers,
  onCopy,
}) {
  const [inviteQuery, setInviteQuery] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const wrapRef = useRef(null);
  const [roleSaving, setRoleSaving] = useState(false);

  // Local role edits: userId → role
  const [pendingRoles, setPendingRoles] = useState({});

  // Reset pending roles when the modal opens or closes
  useEffect(() => {
    if (!open) setPendingRoles({});
  }, [open]);

  const originalRoles = useMemo(() => {
    const map = {};
    (Array.isArray(collaborators) ? collaborators : []).forEach((c) => {
      const uid = String(c?.user?.id || c?.userId || '');
      if (uid) map[uid] = c?.role || 'viewer';
    });
    return map;
  }, [collaborators]);

  const hasRoleChanges = Object.keys(pendingRoles).some(
    (uid) => pendingRoles[uid] !== originalRoles[uid],
  );

  const handleSaveRoles = async () => {
    if (!hasRoleChanges) {
      onClose?.();
      return;
    }
    setRoleSaving(true);
    try {
      await onSaveCollaboratorRoles(pendingRoles);
      setPendingRoles({});
      toast.success('Access updated successfully');
    } finally {
      setRoleSaving(false);
    }
  };

  // Debounced search as user types
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

  // Close dropdown on outside click
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

  const ownerName = owner?.name || owner?.username || owner?.email || 'Owner';
  const ownerEmail = owner?.email || '';
  const ownerId = String(owner?._id || owner?.id || '').trim();
  const meId = String(currentUserId || '').trim();

  const friendList = Array.isArray(friends) ? friends : [];

  const handleSelectUser = async (user) => {
    setDropdownOpen(false);
    setInviteQuery('');
    setInviteError('');
    setInviteSending(true);
    try {
      await onInviteByUser(user, inviteRole);
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
      await onInviteByEmail(email, inviteRole);
      setInviteQuery('');
      setInviteRole('viewer');
    } catch (err) {
      setInviteError(err?.message || 'Could not send invite.');
    } finally {
      setInviteSending(false);
    }
  };

  const isEmail = inviteQuery.includes('@');

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

          {!loading && (
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
                  <div className="trip-share__invite-divider" />
                  <select
                    className="trip-share__invite-role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    aria-label="Access level"
                  >
                    <option value="viewer">Can View</option>
                    <option value="editor">Can Edit</option>
                  </select>
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

                {/* Search results dropdown */}
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
          )}

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

          {!loading && (owner || (Array.isArray(collaborators) && collaborators.length > 0)) && (
            <div className="trip-share__collab-section">
              <p className="trip-share__label">People with access</p>
              <ul className="trip-share__collab-list">
                {owner && (
                  <li className="trip-share__collab-item">
                    <Avatar user={owner} />
                    <div className="trip-share__collab-info">
                      <span className="trip-share__collab-name">{ownerName}</span>
                      {ownerEmail && <span className="trip-share__collab-sub">{ownerEmail}</span>}
                    </div>
                    <span className="trip-share__owner-badge">Owner</span>
                  </li>
                )}
                {Array.isArray(collaborators) && collaborators.map((collab) => {
                  const user = collab?.user || {};
                  const userId = String(user?.id || collab?.userId || '');
                  const currentRole = pendingRoles[userId] ?? collab?.role ?? 'viewer';
                  const isOwner = ownerId && userId && ownerId === userId;
                  const isSelf = meId && userId && meId === userId;
                  const lockAccess = isOwner || isSelf;
                  return (
                    <li key={userId} className="trip-share__collab-item">
                      <Avatar user={user} />
                      <div className="trip-share__collab-info">
                        <span className="trip-share__collab-name">{user?.name || 'Tripmate'}</span>
                        {user?.email && <span className="trip-share__collab-sub">{user.email}</span>}
                      </div>
                      <RoleDropdown
                        value={currentRole}
                        onChange={(role) => setPendingRoles((prev) => ({ ...prev, [userId]: role }))}
                        disabled={lockAccess}
                      />
                      {!lockAccess && (
                        <button
                          type="button"
                          className="trip-share__collab-remove"
                          onClick={() => onRemoveCollaborator(userId)}
                          aria-label={`Remove ${user?.name || 'tripmate'}`}
                        >
                          Remove
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="trip-share__footer">
          <button type="button" className="trip-share__footer-btn trip-share__footer-btn--primary" onClick={onCopy}>
            Copy link
          </button>
          <button
            type="button"
            className="trip-share__footer-btn trip-share__footer-btn--primary"
            onClick={handleSaveRoles}
            disabled={roleSaving}
          >
            {roleSaving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
