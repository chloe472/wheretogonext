import './Moodboard.css';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import { fetchItineraryById } from '../../api/itinerariesApi';
import {
  fetchMoodboardFolders,
  createMoodboardFolder,
  updateMoodboardFolder,
  deleteMoodboardFolder,
} from '../../api/moodboardApi';

export default function Moodboard({ user, onLogout }) {
  const navigate = useNavigate();
  const { tripId } = useParams();

  const [trip, setTrip] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newFolderName, setNewFolderName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!tripId) return;
      setLoading(true);
      setError('');
      try {
        const [tripData, folderData] = await Promise.all([
          fetchItineraryById(tripId),
          fetchMoodboardFolders(tripId),
        ]);
        setTrip(tripData);
        setFolders(folderData);
      } catch (err) {
        setError(err.message || 'Failed to load moodboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tripId]);

  const saveFolders = (updatedFolders) => {
    setFolders(updatedFolders);
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updated = await createMoodboardFolder(tripId, newFolderName.trim());
      saveFolders(updated);
      setShowCreate(false);
      setNewFolderName('');
    } catch (err) {
      setError(err.message || 'Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!currentFolder || !newFolderName.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updated = await updateMoodboardFolder(
        tripId,
        currentFolder.id,
        newFolderName.trim()
      );
      saveFolders(updated);
      setShowEdit(false);
      setCurrentFolder(null);
      setNewFolderName('');
    } catch (err) {
      setError(err.message || 'Failed to rename folder');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFolder) return;
    setLoading(true);
    setError('');
    try {
      const updated = await deleteMoodboardFolder(tripId, currentFolder.id);
      saveFolders(updated);
      setShowDelete(false);
      setCurrentFolder(null);
    } catch (err) {
      setError(err.message || 'Failed to delete folder');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="moodboard-page">
      {/* 🔥 FULL WIDTH HEADERS */}
      <DashboardHeader user={user} onLogout={onLogout} />
      <TripHeader trip={trip} />

      {/* 🔥 CONTENT ONLY */}
      <div className="container">
        <header className="header-section">
          <div className="header-left">
            <h1>Visualize Your Trip</h1>
            <p>Add and organize images for inspiration</p>
          </div>
          <button className="new-folder" onClick={() => setShowCreate(true)}>
            + New Folder
          </button>
        </header>

        {error && <div className="moodboard-error">{error}</div>}
        {loading && <div className="moodboard-loading">Loading moodboard…</div>}

        <div className="folder-section">
          {folders.length === 0 && !loading ? (
            <div className="folder-empty">
              <p>No folders yet. Create one to start collecting images.</p>
            </div>
          ) : (
            folders.map((folder) => (
              <div
                className="folder-card"
                key={folder.id}
                onClick={() =>
                  navigate(`/trip/${tripId}/moodboard/${folder.id}`)
                }
              >
                <div className="folder-preview-grid">
                  {Array.isArray(folder.images) &&
                    folder.images.slice(0, 3).map((img, idx) => (
                      <img
                        key={img.id || idx}
                        src={img.url}
                        alt={`preview-${idx}`}
                      />
                    ))}

                  {(!folder.images || folder.images.length === 0) && (
                    <div className="folder-placeholder"></div>
                  )}
                </div>

                <div className="folder-info-row">
                  <div className="folder-info">
                    <h2>{folder.name}</h2>
                    <p>
                      {Array.isArray(folder.images)
                        ? folder.images.length
                        : 0}{' '}
                      images
                    </p>
                  </div>

                  <div className="folder-menu">
                    <button
                      className="menu-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(
                          openMenuId === folder.id ? null : folder.id
                        );
                      }}
                    >
                      ⋯
                    </button>

                    <div
                      className="menu-dropdown"
                      style={{
                        display:
                          openMenuId === folder.id ? 'block' : 'none',
                      }}
                    >
                      <button
                        className="menu-item edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentFolder(folder);
                          setNewFolderName(folder.name);
                          setShowEdit(true);
                          setOpenMenuId(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="menu-item delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentFolder(folder);
                          setShowDelete(true);
                          setOpenMenuId(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 🔥 POPUPS ABOVE EVERYTHING */}
      {showCreate && (
        <div className="url">
          <div className="create-folder">
            <h2>New Folder</h2>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
            />
            <div className="folder-actions">
              <button onClick={() => setShowCreate(false)}>Cancel</button>
              <button onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="url">
          <div className="create-folder">
            <h2>Edit Folder</h2>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <div className="folder-actions">
              <button onClick={() => setShowEdit(false)}>Cancel</button>
              <button onClick={handleEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div className="url">
          <div className="create-folder">
            <h2>Delete Folder?</h2>
            <p>Are you sure?</p>
            <div className="folder-actions">
              <button onClick={() => setShowDelete(false)}>Cancel</button>
              <button onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}