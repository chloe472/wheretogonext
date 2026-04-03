import { platformIcon } from './profileSocialUtils';
import { PUBLISH_CATEGORY_OPTIONS } from '../../data/communitySearchConstants';
import { resolveImageUrl, applyImageFallback } from '../../lib/imageFallback';

export default function ProfileEditModal({
  open,
  onClose,
  photoPreview,
  picture,
  displayName,
  photoFile,
  setPhotoFile,
  setPhotoPreview,
  editDraft,
  setEditDraft,
  socialDraft,
  setSocialDraft,
  commitSocialDraft,
  editError,
  editSaving,
  photoUploading,
  removeProfilePhoto,
  saveProfile,
  countries,
  flagForCountry,
}) {
  if (!open) return null;

  return (
    <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
      <button
        type="button"
        className="profile-page__modal-backdrop"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="profile-page__modal-card">
        <div className="profile-page__modal-head">
          <h2 id="edit-profile-title" className="profile-page__modal-title">Edit profile</h2>
          <button type="button" className="profile-page__modal-close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="profile-page__modal-body">
          <div className="profile-page__edit-grid profile-page__edit-grid--stacked">
            <div className="profile-page__edit-avatar profile-page__edit-avatar--top">
              <div className="profile-page__avatar-border">
                <div className="profile-page__avatar-inner">
                  {photoPreview || picture ? (
                    <img
                      src={photoPreview || resolveImageUrl(picture)}
                      alt=""
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={applyImageFallback}
                    />
                  ) : (
                    <div className="profile-page__avatar-placeholder">
                      {(displayName || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <label className="profile-page__upload-btn">
                {photoFile ? photoFile.name : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setPhotoFile(file);
                    if (photoPreview) URL.revokeObjectURL(photoPreview);
                    setPhotoPreview(file ? URL.createObjectURL(file) : null);
                  }}
                />
              </label>
              {(photoPreview || picture) && (
                <button
                  type="button"
                  className="profile-page__upload-btn profile-page__upload-btn--ghost"
                  onClick={removeProfilePhoto}
                  disabled={photoUploading}
                >
                  Remove photo
                </button>
              )}
            </div>
            <div className="profile-page__edit-fields">
              <label className="profile-page__modal-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className="profile-page__modal-input"
                value={editDraft.name}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />

              <label className="profile-page__modal-label" htmlFor="profile-intro">
                Intro
              </label>
              <textarea
                id="profile-intro"
                className="profile-page__modal-textarea"
                rows={4}
                value={editDraft.intro}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, intro: e.target.value }))}
                placeholder="Introduce yourself..."
              />
              <label className="profile-page__modal-label">
                Interested in
              </label>
              <div className="profile-page__interests-grid">
                {PUBLISH_CATEGORY_OPTIONS.map((option) => {
                  const selected = editDraft.interests.includes(option);
                  return (
                    <button
                      key={option}
                      type="button"
                      className={`profile-page__interest-pill${selected ? ' profile-page__interest-pill--selected' : ''}`}
                      onClick={() => setEditDraft((prev) => ({
                        ...prev,
                        interests: selected
                          ? prev.interests.filter((i) => i !== option)
                          : [...prev.interests, option],
                      }))}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
              <label className="profile-page__modal-label" htmlFor="profile-nationality">
                Nationality
              </label>
              <select
                id="profile-nationality"
                className="profile-page__modal-input profile-page__modal-select"
                value={editDraft.nationality}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, nationality: e.target.value }))}
              >
                <option value="">Select nationality</option>
                {!countries.some((c) => c.label === editDraft.nationality) && editDraft.nationality && (
                  <option value={editDraft.nationality}>{editDraft.nationality}</option>
                )}
                {countries.map((c) => (
                  <option key={c.code} value={c.label}>{`${c.label} ${flagForCountry(c.label)}`}</option>
                ))}
              </select>
              <div className="profile-page__socials-edit">
                <p className="profile-page__modal-label">Social Profiles</p>
                <div className="profile-page__social-input">
                  <div className="profile-page__social-input-icon">
                    {platformIcon(socialDraft.platform)}
                  </div>
                  <input
                    className="profile-page__modal-input profile-page__social-platform"
                    list="social-platforms"
                    value={socialDraft.platform}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, platform: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="Platform"
                  />
                  <input
                    className="profile-page__modal-input profile-page__social-handle-input"
                    value={socialDraft.value}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, value: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="@handle or https://"
                  />
                  <button
                    type="button"
                    className="profile-page__social-add-btn"
                    onClick={commitSocialDraft}
                  >
                    Add
                  </button>
                </div>
                {editDraft.socials.length > 0 && (
                  <ul className="profile-page__socials-list">
                    {editDraft.socials.map((s) => (
                      <li key={s.id} className="profile-page__social-pill">
                        <span className="profile-page__social-icon">{platformIcon(s.platform)}</span>
                        <div className="profile-page__social-text">
                          <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                          <span className="profile-page__social-handle">
                            {(s.handle || s.url) ? `${s.handle || s.url}` : 'Not set'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="profile-page__social-remove profile-page__social-remove--pill"
                          onClick={() => {
                            const next = editDraft.socials.filter((x) => x.id !== s.id);
                            setEditDraft((prev) => ({ ...prev, socials: next }));
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <datalist id="social-platforms">
                  <option value="Facebook" />
                  <option value="Instagram" />
                  <option value="TikTok" />
                  <option value="X (Twitter)" />
                  <option value="YouTube" />
                  <option value="LinkedIn" />
                  <option value="Pinterest" />
                  <option value="Threads" />
                </datalist>
              </div>
              {editError && <p className="profile-page__modal-error">{editError}</p>}
            </div>
          </div>
        </div>
        <div className="profile-page__modal-actions">
          <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="profile-page__modal-btn profile-page__modal-btn--primary"
            onClick={saveProfile}
            disabled={editSaving || photoUploading}
          >
            {editSaving || photoUploading ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
