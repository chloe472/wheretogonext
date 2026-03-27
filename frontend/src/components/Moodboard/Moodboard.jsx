import './Moodboard.css';
import { useState } from "react";
import { MOCK_FOLDERS } from "../../data/mockMoodboard.js";
import { useNavigate } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import TripHeader from '../TripHeader/TripHeader';

export default function Moodboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [folders, setFolders] = useState(() => {
    const saved = JSON.parse(localStorage.getItem("folders"));
    return saved?.length ? saved : MOCK_FOLDERS;
  });

  const [newFolderName, setNewFolderName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const saveFolders = (updatedFolders) => {
    setFolders(updatedFolders);
    localStorage.setItem("folders", JSON.stringify(updatedFolders));
  };

  const handleCreate = () => {
    if (!newFolderName.trim()) return;
    const newFolder = {
      id: newFolderName.trim().toLowerCase().replace(/\s+/g, "-"),
      name: newFolderName.trim(),
      images: [],
    };
    const updated = [...folders, newFolder];
    saveFolders(updated);
    setShowCreate(false);
    setNewFolderName("");
  };

  const handleEdit = () => {
    if (!currentFolder || !newFolderName.trim()) return;
    const updated = folders.map((f) =>
      f.id === currentFolder.id ? { ...f, name: newFolderName.trim() } : f
    );
    saveFolders(updated);
    setShowEdit(false);
    setCurrentFolder(null);
  };

  const handleDelete = () => {
    if (!currentFolder) return;
    const updated = folders.filter((f) => f.id !== currentFolder.id);
    saveFolders(updated);
    setShowDelete(false);
    setCurrentFolder(null);
  };

  return (
    <div className="container">
      {/* DashboardHeader gets user info */}
      <DashboardHeader user={user} onLogout={onLogout} />

      {/* TripHeader can show the currently selected folder if any */}
      <TripHeader folderName={currentFolder?.name || ""} />

      <header className="header-section">
        <div className="header-left">
          <h1>Vizualize Your Trip</h1>
          <p>Add and organize images for inspiration</p>
        </div>
        <button className="new-folder" onClick={() => setShowCreate(true)}>
          + New Folder
        </button>
      </header>

      <div className="folder-section">
        {folders.map((folder) => (
          <div
            className="folder-card"
            key={folder.id}
            onClick={() => navigate(`/folder/${folder.id}`)}
          >
            <div className="folder-preview-grid">
              {folder.images.slice(0, 3).map((img, idx) => (
                <img key={idx} src={img} alt={`preview-${idx}`} />
              ))}
              {folder.images.length === 0 && (
                <img src="images/default.jpg" alt="default folder" />
              )}
            </div>

            <div className="folder-info-row">
              <div className="folder-info">
                <h2>{folder.name}</h2>
                <p>{folder.images.length} images</p>
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
                  style={{ display: openMenuId === folder.id ? "block" : "none" }}
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
        ))}
      </div>

      {/* Create Folder Modal */}
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

      {/* Edit Folder Modal */}
      {showEdit && (
        <div className="url">
          <div className="create-folder">
            <h2>Edit Folder</h2>
            <input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder Name"
            />
            <div className="folder-actions">
              <button onClick={() => setShowEdit(false)}>Cancel</button>
              <button onClick={handleEdit}>Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Folder Modal */}
      {showDelete && (
        <div className="url">
          <div className="create-folder">
            <h2>Delete Folder?</h2>
            <p>Are you sure you want to delete this folder?</p>
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
