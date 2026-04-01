import { useNavigate } from 'react-router-dom';
import { getCoverImageForDestination } from '../../../data/tripDestinationMeta';
import { resolveImageUrl, applyImageFallback } from '../../../lib/imageFallback';

export default function MoodboardFolderCard({
  folder,
  tripId,
  trip,
  openMenuId,
  setOpenMenuId,
  onEdit,
  onDelete,
}) {
  const navigate = useNavigate();
  const fallbackHint = trip?.destination || trip?.locations || 'Trip destination';
  const placeholderUrl = getCoverImageForDestination(trip?.destination, trip?.locations);

  return (
    <div
      className="folder-card"
      onClick={() => navigate(`/trip/${tripId}/moodboard/${folder.id}`)}
    >
      <div className="folder-preview-grid">
        {folder.images?.slice(0, 3).map((img, idx) => (
          <img key={img.id || idx} src={img.url} alt={`preview-${idx}`} />
        ))}
        {(!folder.images || folder.images.length === 0) && (
          <img
            className="folder-placeholder folder-placeholder--photo"
            src={resolveImageUrl(placeholderUrl, fallbackHint, 'destination')}
            alt={fallbackHint}
            onError={(event) => applyImageFallback(event, fallbackHint, 'destination')}
          />
        )}
      </div>

      <div className="folder-info-row">
        <div className="folder-info">
          <h2>{folder.name}</h2>
          <p>{folder.images?.length || 0} images</p>
        </div>
        <div className="folder-menu">
          <button
            className="menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setOpenMenuId(openMenuId === folder.id ? null : folder.id);
            }}
          >
            ⋯
          </button>
          <div
            className="menu-dropdown"
            style={{ display: openMenuId === folder.id ? 'block' : 'none' }}
          >
            <button
              className="menu-item edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(folder);
              }}
            >
              Edit
            </button>
            <button
              className="menu-item delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(folder);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
