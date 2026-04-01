import '../styles/moodboard-modal.css';

/**
 * Shared create / edit / delete folder modal.
 * type: 'create' | 'edit' | 'delete'
 */
export default function MoodboardFolderModal({
  type,
  folderName,
  onNameChange,
  onCancel,
  onConfirm,
}) {
  if (type === 'delete') {
    return (
      <div className="url">
        <div className="create-folder">
          <h2>Delete Folder?</h2>
          <p>Are you sure you want to delete this folder?</p>
          <div className="folder-actions">
            <button onClick={onCancel}>Cancel</button>
            <button onClick={onConfirm}>Delete</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="url">
      <div className="create-folder">
        <h2>{type === 'edit' ? 'Edit Folder' : 'New Folder'}</h2>
        <input
          value={folderName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Folder Name"
        />
        <div className="folder-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onConfirm}>{type === 'edit' ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  );
}
