import { useMemo, useState } from 'react';
import MoodboardPin from './MoodboardPin';
import MoodboardFolderHeader from './MoodboardFolderHeader';
import MoodboardAiModal from './MoodboardAiModal';
import MoodboardUrlModal from './MoodboardUrlModal';
import MoodboardDeleteImageModal from './MoodboardDeleteImageModal';
import MoodboardReactionsModal from './MoodboardReactionsModal';

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
  const [activeReactionPin, setActiveReactionPin] = useState(null);

  const activeReactionImage = useMemo(() => {
    if (!activeReactionPin) return null;
    const idx = Number(activeReactionPin?.idx);
    if (!Number.isInteger(idx) || idx < 0 || idx >= images.length) return null;
    return images[idx] || null;
  }, [activeReactionPin, images]);

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
                onOpenReactions={() => setActiveReactionPin({ pinId, idx })}
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

        <MoodboardReactionsModal
          show={Boolean(activeReactionPin)}
          image={activeReactionImage}
          pinId={activeReactionPin?.pinId}
          reactions={reactions[activeReactionPin?.pinId] || {}}
          currentUserName={user?.name || ''}
          onClose={() => setActiveReactionPin(null)}
          onToggleEmoji={(emoji) => {
            if (!activeReactionPin || !activeReactionImage?.id) return;
            handleEmojiClick(activeReactionPin.pinId, emoji, activeReactionImage.id);
          }}
        />
      </div>
    </>
  );
}
