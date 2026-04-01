export default function MoodboardDeleteImageModal({ show, onCancel, onDelete }) {
  if (!show) return null;

  return (
    <div className="url">
      <div className="create-folder">
        <h2>Delete Image?</h2>
        <p>Are you sure you want to delete this image?</p>
        <div className="folder-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onDelete}>Delete</button>
        </div>
      </div>
    </div>
  );
}
