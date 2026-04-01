import './styles/moodboard-folder-shell.css';
import TripHeader from '../TripDetailsHeader/TripDetailsHeader';
import { useMoodboardFolder } from './hooks';
import {
  MoodboardPin,
  MoodboardFolderHeader,
  MoodboardAiModal,
  MoodboardUrlModal,
  MoodboardDeleteImageModal,
} from './components';

export default function MoodboardFolder({ user }) {
  const {
    tripId,
    folderId,
    trip,
    folder,
    images,
    reactions,
    loading,
    error,
    urlInput,
    setUrlInput,
    showUrlModal,
    setShowUrlModal,
    showDeleteModal,
    setShowDeleteModal,
    currentImageIdx,
    setCurrentImageIdx,
    aiResult,
    showAiModal,
    setShowAiModal,
    aiLoading,
    handleEmojiClick,
    handleDeleteImage,
    handleAddUrl,
    handleFileUpload,
    handleAnalyzeMoodboard,
    addToItinerary,
    navigate,
  } = useMoodboardFolder(user);

  if (loading) return <div className="moodboard-loading">Loading folder…</div>;
  if (error) return <div className="moodboard-error">{error}</div>;

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

      <MoodboardAiModal
        show={showAiModal}
        aiLoading={aiLoading}
        aiResult={aiResult}
        onClose={() => setShowAiModal(false)}
        onAddToItinerary={addToItinerary}
      />

      <div className="container">
        <MoodboardFolderHeader
          folder={folder}
          images={images}
          tripId={tripId}
          onAnalyze={handleAnalyzeMoodboard}
          onAddUrl={() => setShowUrlModal(true)}
          navigate={navigate}
        />

        <input
          type="file"
          id="file-input"
          accept="image/*"
          multiple
          hidden
          onChange={handleFileUpload}
        />

        <div className="pinterest">
          {images.map((img, idx) => {
            const pinId = folderId + '-' + idx;
            return (
              <MoodboardPin
                key={pinId}
                img={img}
                idx={idx}
                pinId={pinId}
                reactions={reactions}
                user={user}
                onEmojiClick={handleEmojiClick}
                onDeleteClick={() => {
                  setCurrentImageIdx(idx);
                  setShowDeleteModal(true);
                }}
              />
            );
          })}
        </div>

        <MoodboardUrlModal
          show={showUrlModal}
          urlInput={urlInput}
          onChange={setUrlInput}
          onCancel={() => setShowUrlModal(false)}
          onAdd={handleAddUrl}
        />

        <MoodboardDeleteImageModal
          show={showDeleteModal && currentImageIdx !== null}
          onCancel={() => setShowDeleteModal(false)}
          onDelete={handleDeleteImage}
        />
      </div>
    </div>
  );
}

