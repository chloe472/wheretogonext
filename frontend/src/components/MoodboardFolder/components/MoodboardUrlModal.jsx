import '../styles/moodboard-image-modal.css';

export default function MoodboardUrlModal({ show, urlInput, onChange, onCancel, onAdd }) {
  if (!show) return null;

  return (
    <div className="url">
      <div className="create-folder">
        <h2>Add from URL</h2>
        <input
          type="text"
          value={urlInput}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        <div className="folder-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onAdd}>Add URL</button>
        </div>
      </div>
    </div>
  );
}
