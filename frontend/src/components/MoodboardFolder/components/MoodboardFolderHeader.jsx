import '../styles/moodboard-folder-header.css';

export default function MoodboardFolderHeader({
  folder,
  images,
  tripId,
  onAnalyze,
  onAddUrl,
  navigate,
}) {
  return (
    <div className="folder-header-row">
      <div className="folder-left">
        <button className="back-btn" onClick={() => navigate(`/trip/${tripId}/moodboard`)}>
          &lt;
        </button>
        <div className="folder-title">
          <h1>{folder?.name}</h1>
          <p>{images.length} images</p>
        </div>
      </div>

      <div className="folder-right">
        <button onClick={onAnalyze} className="analyze-btn">
          ✨ AI Analyze
        </button>

        <div className="dropdown">
          <button className="upload-dropdown-btn">Add Image ▾</button>
          <div className="dropdown-content">
            <button onClick={() => document.getElementById('file-input').click()}>
              Upload from Device
            </button>
            <button onClick={onAddUrl}>Add from URL</button>
          </div>
        </div>
      </div>
    </div>
  );
}
