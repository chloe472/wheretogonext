import './DashboardRenameModal.css';

export default function DashboardRenameModal({
  open,
  renameTitleDraft,
  setRenameTitleDraft,
  onClose,
  onSave,
}) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className="dashboard__rename-backdrop"
        aria-label="Close rename dialog"
        onClick={onClose}
      />
      <div
        className="dashboard__rename-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-rename-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="dashboard-rename-title" className="dashboard__rename-title">
          Rename trip
        </h2>
        <label htmlFor="dashboard-rename-input" className="dashboard__rename-label">
          Trip name
        </label>
        <input
          id="dashboard-rename-input"
          type="text"
          className="dashboard__rename-input"
          value={renameTitleDraft}
          onChange={(e) => setRenameTitleDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onSave();
            }
            if (e.key === 'Escape') {
              onClose();
            }
          }}
          autoFocus
        />
        <div className="dashboard__rename-actions">
          <button
            type="button"
            className="dashboard__rename-cancel"
            onClick={onClose}
          >
            Cancel
          </button>
          <button type="button" className="dashboard__rename-save" onClick={onSave}>
            Save
          </button>
        </div>
      </div>
    </>
  );
}
