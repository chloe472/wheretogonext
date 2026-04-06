import { useState } from 'react';
import { ChevronDown, Users } from 'lucide-react';
import { lookupUserByEmail } from '../../../api/profileApi';

export default function TripmatesInviteSection({ myEmail, invitedEmails, onInvitedEmailsChange }) {
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [validatingInvite, setValidatingInvite] = useState(false);

  const handleAddInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      setInviteError('');
      return;
    }
    if (email === myEmail) {
      setInviteError('You cannot add your own email as a tripmate.');
      return;
    }
    if (invitedEmails.includes(email)) {
      setInviteError('That tripmate has already been added.');
      return;
    }
    setValidatingInvite(true);
    setInviteError('');
    try {
      await lookupUserByEmail(email);
      onInvitedEmailsChange((prev) => [...prev, email]);
      setInviteEmail('');
    } catch (err) {
      setInviteError(err?.message || 'Could not add that tripmate.');
    } finally {
      setValidatingInvite(false);
    }
  };

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
        <div className="new-trip__friends-wrap">
          <button
            type="button"
            className="new-trip__friends-btn"
            onClick={() => setFriendsOpen((o) => !o)}
            aria-expanded={friendsOpen}
            aria-haspopup="listbox"
          >
            <Users size={18} aria-hidden />
            Friends
            <ChevronDown size={16} aria-hidden />
          </button>
          {friendsOpen && (
            <div className="new-trip__friends-dropdown" role="listbox">
              <p className="new-trip__friends-hint">No friends added yet. Use &quot;+ Invite tripmates&quot; to add by email.</p>
            </div>
          )}
        </div>
      </div>
      {inviteOpen && (
        <div className="new-trip__invite-panel">
          <label htmlFor="invite-email" className="new-trip__label">Invite by email</label>
          <div className="new-trip__invite-input-row">
            <input
              id="invite-email"
              type="email"
              className="new-trip__input"
              placeholder="e.g. friend@example.com"
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (inviteError) setInviteError('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInvite();
                }
              }}
              autoComplete="email"
            />
            <button
              type="button"
              className="new-trip__invite-add-btn"
              onClick={handleAddInvite}
              disabled={validatingInvite}
            >
              {validatingInvite ? 'Adding...' : 'Add'}
            </button>
          </div>
          {inviteError ? (
            <p className="new-trip__error" role="alert">{inviteError}</p>
          ) : null}
          {invitedEmails.length > 0 && (
            <ul className="new-trip__invited-list">
              {invitedEmails.map((email) => (
                <li key={email} className="new-trip__invited-item">
                  <span className="new-trip__invited-email">{email}</span>
                  <button
                    type="button"
                    className="new-trip__invited-remove"
                    onClick={() => onInvitedEmailsChange((prev) => prev.filter((e) => e !== email))}
                    aria-label={`Remove ${email}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
