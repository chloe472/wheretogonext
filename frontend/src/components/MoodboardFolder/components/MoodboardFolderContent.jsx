import MoodboardPin from './MoodboardPin';
import MoodboardFolderHeader from './MoodboardFolderHeader';
import MoodboardAiModal from './MoodboardAiModal';
import MoodboardUrlModal from './MoodboardUrlModal';
import MoodboardDeleteImageModal from './MoodboardDeleteImageModal';

export default function MoodboardFolderContent({
  showAiModal,
  aiLoading,
  aiResult,
  aiLocationInsight,
  tripDestination,
  setShowAiModal,
  addToItinerary,
  onAddDetectedDestination,
  folder,
  images,
  tripId,
  handleAnalyzeMoodboard,
  setShowUrlModal,
  navigate,
  handleFileUpload,
  folderId,
  reactions,
  user,
  handleEmojiClick,
  setCurrentImageIdx,
  setShowDeleteModal,
  showUrlModal,
  urlInput,
  setUrlInput,
  handleAddUrl,
  showDeleteModal,
  currentImageIdx,
  handleDeleteImage,
}) {
  return (
    <>
      <MoodboardAiModal
        show={showAiModal}
        aiLoading={aiLoading}
        aiResult={aiResult}
        locationInsight={aiLocationInsight}
        tripDestination={tripDestination}
        onClose={() => setShowAiModal(false)}
        onAddToItinerary={addToItinerary}
        onAddDetectedDestination={onAddDetectedDestination}
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
    </>
  );
}
