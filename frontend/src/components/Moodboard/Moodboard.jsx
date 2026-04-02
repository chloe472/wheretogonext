import './styles/moodboard.css';
import TripHeader from '../TripDetailsHeader/TripDetailsHeader';
import { useMoodboard } from './hooks';
import { MoodboardFolderCard, MoodboardFolderModal } from './components';

export default function Moodboard({ user, onLogout }) {
  const {
    tripId,
    trip,
    folders,
    loading,
    error,
    showCreate,
    setShowCreate,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    newFolderName,
    setNewFolderName,
    openMenuId,
    setOpenMenuId,
    handleCreate,
    handleEdit,
    handleDelete,
    openEdit,
    openDeleteConfirm,
  } = useMoodboard();

  return (
    <div className="moodboard-page">
      {trip && (
        <TripHeader
          trip={trip}
          spent={trip.budgetSpent || 0}
          currency="SGD"
          onNotesOpen={() => console.log('Open Notes modal')}
        />
      )}

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
              <div className="empty-visual">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="empty-box" />
                ))}
              </div>
                
              <h3>No folders yet</h3>
              <p>Create folders to collect images, moodboards, and ideas for each part of your trip.</p>
            </div>
          ) : (
            folders.map((folder) => (
              <MoodboardFolderCard
                key={folder.id}
                folder={folder}
                tripId={tripId}
                trip={trip}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
                onEdit={openEdit}
                onDelete={openDeleteConfirm}
              />
            ))
          )}
        </div>

        {showCreate && (
          <MoodboardFolderModal
            type="create"
            folderName={newFolderName}
            onNameChange={setNewFolderName}
            onCancel={() => setShowCreate(false)}
            onConfirm={handleCreate}
          />
        )}

        {showEdit && (
          <MoodboardFolderModal
            type="edit"
            folderName={newFolderName}
            onNameChange={setNewFolderName}
            onCancel={() => setShowEdit(false)}
            onConfirm={handleEdit}
          />
        )}

        {showDelete && (
          <MoodboardFolderModal
            type="delete"
            folderName={newFolderName}
            onNameChange={setNewFolderName}
            onCancel={() => setShowDelete(false)}
            onConfirm={handleDelete}
          />
        )}
      </div>
    </div>
  );
}