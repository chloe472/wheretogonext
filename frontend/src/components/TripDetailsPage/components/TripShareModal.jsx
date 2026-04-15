import { useState, useEffect, useRef, useMemo, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { ChevronDown, Globe, X } from 'lucide-react';
import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';
import { collaboratorRoleForApi } from '../lib/tripCollaborationAccess';

const ROLE_LABELS = { viewer: 'Can View', editor: 'Can Edit' };
const LINK_ACCESS_LABELS = { restricted: 'Restricted', anyone: 'Anyone with the link' };
const LINK_PERMISSION_LABELS = { viewer: 'Viewer', editor: 'Editor' };

function isMe(meId, meEmail, rowUserId, rowEmail) {
  const mid = String(meId || '').trim();
  const rid = String(rowUserId || '').trim();
  if (mid && rid && mid === rid) return true;
  const a = String(meEmail || '').trim().toLowerCase();
  const b = String(rowEmail || '').trim().toLowerCase();
  return Boolean(a && b && a === b);
}

function OptionDropdown({
  value,
  onChange,
  disabled,
  labels,
  ariaLabel = 'Options',
  /** When "right", menu aligns to the trigger's right edge (collaborator rows). */
  menuAlign = 'left',
}) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: null, right: null, minWidth: 140 });
  const buttonRef = useRef(null);
  const menuPortalRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const minW = Math.max(140, rect.width);
    const alignRight = menuAlign === 'right';
    const base = {
      minWidth: minW,
      left: alignRight ? null : rect.left,
      right: alignRight ? window.innerWidth - rect.right : null,
    };
    let top = rect.bottom + 6;
    const menuEl = menuPortalRef.current;
    const h = menuEl?.offsetHeight ?? 88;
    if (top + h > window.innerHeight - 10) {
      top = Math.max(10, rect.top - h - 6);
    }
    setMenuPos({ top, ...base });
  }, [menuAlign]);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    let cancelled = false;
    const rafOuter = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!cancelled) updateMenuPosition();
      });
    });

    const onReposition = () => updateMenuPosition();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafOuter);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [open, updateMenuPosition, value]);

  useEffect(() => {
    const handler = (e) => {
      const inBtn = buttonRef.current?.contains(e.target);
      const inMenu = menuPortalRef.current?.contains(e.target);
      if (!inBtn && !inMenu) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (disabled) {
    return <span className="trip-share__role-static">{labels[value] ?? value}</span>;
  }

  const menu = open
    ? createPortal(
      <div
        ref={menuPortalRef}
        className="dashboard__filter-menu dashboard__filter-menu--fixed-portal"
        style={{
          position: 'fixed',
          top: menuPos.top,
          left: menuPos.left != null ? menuPos.left : 'auto',
          right: menuPos.right != null ? menuPos.right : 'auto',
          minWidth: menuPos.minWidth,
          marginTop: 0,
          zIndex: 10050,
        }}
        role="listbox"
        aria-label={ariaLabel}
      >
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="option"
            aria-selected={value === key}
            className={`dashboard__filter-option${value === key ? ' dashboard__filter-option--active' : ''}`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(key); setOpen(false); }}
          >
            {label}
          </button>
        ))}
      </div>,
      document.body,
    )
    : null;

  return (
    <div className="dashboard__filter-dropdown">
      <button
        ref={buttonRef}
        type="button"
        className={`dashboard__filter-btn${open ? ' dashboard__filter-btn--open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="dashboard__filter-btn-text">{labels[value] ?? value}</span>
        <ChevronDown size={14} className="dashboard__filter-chevron" aria-hidden />
      </button>
      {menu}
    </div>
  );
}

function RoleDropdown(props) {
  return <OptionDropdown {...props} labels={ROLE_LABELS} ariaLabel="Access level" />;
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
  readOnly = false,
  friends,
  collaborators,
  owner,
  currentUserId,
  currentUserEmail = '',
  onSaveCollaboratorRoles,
  onRemoveCollaborator,
  onClose,
  onShareWithFriend,
  onInviteByEmail,
  onInviteByUser,
  onInviteUsersBatch,
  onSearchUsers,
  onCopy,
  linkAccess: linkAccessProp = 'restricted',
  linkPermission: linkPermissionProp = 'viewer',
  onLinkSettingsChange,
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

  /** Search picks staged as pills until user clicks Send invite (Google Docs–style). */
  const [pendingInviteUsers, setPendingInviteUsers] = useState([]);

  
  const [pendingRoles, setPendingRoles] = useState({});

  
  useEffect(() => {
    if (!open) {
      setPendingRoles({});
      setPendingInviteUsers([]);
      setInviteQuery('');
      setInviteError('');
      setSearchResults([]);
      setDropdownOpen(false);
    }
  }, [open]);

  const originalRoles = useMemo(() => {
    const map = {};
    (Array.isArray(collaborators) ? collaborators : []).forEach((c) => {
      const uid = String(c?.user?.id || c?.userId || '');
      if (uid) map[uid] = collaboratorRoleForApi(c);
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
      toast.success('Permissions updated successfully');
    } catch (err) {
      toast.error(err?.message || 'Could not update permissions.');
    } finally {
      setRoleSaving(false);
    }
  };

  
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

  const la = String(linkAccessProp || 'restricted');
  const lp = String(linkPermissionProp || 'viewer');

  const generalAccessHint = useMemo(() => {
    if (la === 'restricted') {
      return 'Only people you invite can use this link.';
    }
    if (lp === 'viewer') {
      return 'Anyone on the internet with the link can view.';
    }
    return 'Anyone with the link can view; signed-in users can edit.';
  }, [la, lp]);

  if (!open) return null;

  const ownerName = owner?.name || owner?.email || 'Owner';
  const ownerEmail = owner?.email || '';
  const ownerId = String(owner?._id || owner?.id || '').trim();
  const meId = String(currentUserId || '').trim();
  const meEmail = String(currentUserEmail || '').trim();

  const friendList = Array.isArray(friends) ? friends : [];

  const handleSelectUser = (user) => {
    const userId = String(user?.id || '').trim();
    if (!userId) return;
    setDropdownOpen(false);
    setInviteError('');
    const existsCollab = (Array.isArray(collaborators) ? collaborators : []).some(
      (c) => String(c?.user?.id || c?.userId || '') === userId,
    );
    if (existsCollab) {
      toast('This person already has access.');
      return;
    }
    if (pendingInviteUsers.some((p) => p.id === userId)) return;
    setPendingInviteUsers((prev) => [
      ...prev,
      {
        id: userId,
        name: user.name || 'User',
        email: user.email,
        picture: user.picture,
      },
    ]);
    setInviteQuery('');
  };

  const removePendingInvite = (userId) => {
    setPendingInviteUsers((prev) => prev.filter((p) => p.id !== userId));
  };

  const handleInvite = async () => {
    if (readOnly) return;
    const email = inviteQuery.trim().toLowerCase();
    const hasTypedEmail = email.includes('@');
    if (pendingInviteUsers.length === 0 && !hasTypedEmail) return;

    setInviteSending(true);
    setInviteError('');
    setDropdownOpen(false);
    try {
      if (pendingInviteUsers.length > 0) {
        if (typeof onInviteUsersBatch === 'function') {
          await onInviteUsersBatch(pendingInviteUsers, inviteRole);
        } else {
          for (const u of pendingInviteUsers) {
            await onInviteByUser(u, inviteRole);
          }
        }
        setPendingInviteUsers([]);
      }
      if (hasTypedEmail) {
        await onInviteByEmail(email, inviteRole);
        setInviteQuery('');
      }
    } catch (err) {
      setInviteError(err?.message || 'Could not send invite.');
    } finally {
      setInviteSending(false);
    }
  };

  const isEmail = inviteQuery.includes('@');
  const canSendInvite =
    !readOnly && !inviteSending && (pendingInviteUsers.length > 0 || isEmail);

  const handleLinkAccessChange = async (next) => {
    if (readOnly || !onLinkSettingsChange) return;
    try {
      await onLinkSettingsChange({ linkAccess: next });
      toast.success('General access updated');
    } catch (e) {
      toast.error(e?.message || 'Could not update access');
    }
  };

  const handleLinkPermissionChange = async (next) => {
    if (readOnly || la === 'restricted' || !onLinkSettingsChange) return;
    try {
      await onLinkSettingsChange({ linkPermission: next });
      toast.success('General access updated');
    } catch (e) {
      toast.error(e?.message || 'Could not update access');
    }
  };

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
                  <div className="trip-share__invite-chips-wrap">
                    {pendingInviteUsers.map((u) => (
                      <span key={u.id} className="trip-share__invite-pill">
                        <span className="trip-share__invite-pill-avatar" aria-hidden>
                          <Avatar user={u} />
                        </span>
                        <span className="trip-share__invite-pill-name">{u.name}</span>
                        <button
                          type="button"
                          className="trip-share__invite-pill-remove"
                          onClick={() => removePendingInvite(u.id)}
                          aria-label={`Remove ${u.name}`}
                          disabled={readOnly}
                        >
                          <X size={14} strokeWidth={2.25} aria-hidden />
                        </button>
                      </span>
                    ))}
                    <input
                      className="trip-share__invite-input"
                      type="text"
                      placeholder={pendingInviteUsers.length ? 'Add another…' : 'Invite by name or email'}
                      value={inviteQuery}
                      onChange={(e) => { setInviteQuery(e.target.value); setInviteError(''); }}
                      onFocus={() => { if (searchResults.length > 0) setDropdownOpen(true); }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && canSendInvite) handleInvite();
                      }}
                      autoComplete="off"
                      disabled={readOnly}
                      aria-disabled={readOnly}
                    />
                    {searching && <div className="trip-share__invite-spinner" />}
                  </div>
                  <div className="trip-share__invite-divider" aria-hidden />
                  <div className="trip-share__invite-role-slot">
                    <RoleDropdown
                      value={inviteRole}
                      onChange={setInviteRole}
                      disabled={readOnly}
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="trip-share__send-btn"
                  onClick={handleInvite}
                  disabled={!canSendInvite}
                >
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 8h12M9 3l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {inviteSending ? 'Sending…' : 'Send invite'}
                </button>

                {}
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

          {!loading && typeof onLinkSettingsChange === 'function' && (
            <div className="trip-share__general-access">
              <p className="trip-share__label">General access</p>
              <div className="trip-share__general-access-row">
                <div className="trip-share__general-access-icon" aria-hidden>
                  <Globe size={22} strokeWidth={1.75} />
                </div>
                <div className="trip-share__general-access-main">
                  <div className="trip-share__general-access-controls">
                    <OptionDropdown
                      value={la}
                      onChange={handleLinkAccessChange}
                      disabled={readOnly}
                      labels={LINK_ACCESS_LABELS}
                      ariaLabel="Who can use the link"
                    />
                    <OptionDropdown
                      value={lp}
                      onChange={handleLinkPermissionChange}
                      disabled={readOnly || la === 'restricted'}
                      labels={LINK_PERMISSION_LABELS}
                      ariaLabel="Link permission"
                    />
                  </div>
                  <p className="trip-share__general-access-hint">{generalAccessHint}</p>
                </div>
              </div>
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
                    disabled={readOnly}
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
                      <span className="trip-share__collab-name">
                        {ownerName}
                        {isMe(meId, meEmail, ownerId, ownerEmail) ? (
                          <span className="trip-share__you-suffix"> (You)</span>
                        ) : null}
                      </span>
                      {ownerEmail && <span className="trip-share__collab-sub">{ownerEmail}</span>}
                    </div>
                    <span className="trip-share__owner-badge">Owner</span>
                  </li>
                )}
                {Array.isArray(collaborators) && collaborators.map((collab) => {
                  const user = collab?.user || {};
                  const userId = String(user?.id || collab?.userId || '');
                  const currentRole = pendingRoles[userId] ?? collaboratorRoleForApi(collab);
                  const isOwner = ownerId && userId && ownerId === userId;
                  const isSelf =
                    isMe(meId, meEmail, userId, user?.email || collab?.email);
                  const lockAccess = isOwner || isSelf;
                  const roleControlsDisabled = lockAccess || readOnly;
                  return (
                    <li key={userId} className="trip-share__collab-item">
                      <Avatar user={user} />
                      <div className="trip-share__collab-info">
                        <span className="trip-share__collab-name">
                          {user?.name || 'Tripmate'}
                          {isSelf ? <span className="trip-share__you-suffix"> (You)</span> : null}
                        </span>
                        {user?.email && <span className="trip-share__collab-sub">{user.email}</span>}
                      </div>
                      <RoleDropdown
                        value={currentRole}
                        onChange={(role) => setPendingRoles((prev) => ({ ...prev, [userId]: role }))}
                        disabled={roleControlsDisabled}
                        menuAlign="right"
                      />
                      {!lockAccess && !readOnly && (
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
