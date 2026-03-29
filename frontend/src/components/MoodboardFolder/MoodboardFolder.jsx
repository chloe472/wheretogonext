import './MoodboardFolder.css';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import { fetchMoodboardFolder, addMoodboardImage, deleteMoodboardImage } from '../../api/moodboardApi';
import { fetchItineraryById } from '../../api/itinerariesApi';

export default function MoodboardFolder({ user, onLogout }) {
  const { tripId, folderId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [reactions, setReactions] = useState({});
  const [urlInput, setUrlInput] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load folder and trip from DB
  useEffect(() => {
    const loadFolder = async () => {
      setLoading(true);
      try {
        const [folderData, tripData] = await Promise.all([
          fetchMoodboardFolder(tripId, folderId),
          fetchItineraryById(tripId)
        ]);

        setFolder(folderData);
        setImages(folderData.images || []);
        setTrip(tripData);

        // Initialize reactions
        const initReactions = {};
        (folderData.images || []).forEach((img, idx) => {
          const pinId = folderId + "-" + idx;
          initReactions[pinId] = img.reactions || {};
        });
        setReactions(initReactions);
      } catch (err) {
        console.error(err);
        setError("Failed to load folder");
      } finally {
        setLoading(false);
      }
    };

    if (tripId && folderId) loadFolder();
  }, [tripId, folderId]);

  const handleEmojiClick = async (pinId, emoji) => {
    try {
      const updated = {
        ...reactions,
        [pinId]: { ...reactions[pinId], [emoji]: (reactions[pinId]?.[emoji] || 0) + 1 }
      };
      setReactions(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteImage = async () => {
    if (currentImageIdx === null) return;
    const imageToDelete = images[currentImageIdx];
    try {
      const updatedImages = await deleteMoodboardImage(tripId, folderId, imageToDelete.id);
      setImages(updatedImages);
      setCurrentImageIdx(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to delete image.");
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      const updatedImages = await addMoodboardImage(tripId, folderId, urlInput.trim());
      setImages(updatedImages);
      setUrlInput("");
      setShowUrlModal(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add image.");
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (let file of files) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const updatedImages = await addMoodboardImage(tripId, folderId, ev.target.result);
          setImages(updatedImages);
        } catch (err) {
          console.error(err);
          alert("Failed to upload image.");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) return <div className="moodboard-loading">Loading folder…</div>;
  if (error) return <div className="moodboard-error">{error}</div>;

  return (
    <div className="moodboard-page">
      <DashboardHeader user={user} onLogout={onLogout} />
      <TripHeader trip={trip} />

      <div className="container">
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
            <button className="upload" onClick={() => document.getElementById("file-input").click()}>
              Upload
            </button>
            <button className="add-url" onClick={() => setShowUrlModal(true)}>
              Add from URL
            </button>
            <input
              type="file"
              id="file-input"
              accept="image/*"
              multiple
              hidden
              onChange={handleFileUpload}
            />
          </div>
        </div>

        <div className="pinterest">
          {images.map((img, idx) => {
            const pinId = folderId + "-" + idx;
            return (
              <div className="pin" key={pinId}>
                <img src={img.url || img} alt={`img-${idx}`} />
                
                <div className="emoji-delete-row">
                  <div className="emoji-popup">
                    {["❤️", "😍", "🔥"].map((emoji) => (
                      <span key={emoji} onClick={() => handleEmojiClick(pinId, emoji)}>
                        {emoji}
                      </span>
                    ))}
                  </div>

                  <button
                    className="pin-delete-btn"
                    onClick={() => { setCurrentImageIdx(idx); setShowDeleteModal(true); }}
                    title="Delete image"
                  >
                    ✕
                  </button>
                </div>

                <div className="pin-reactions">
                  {Object.entries(reactions[pinId] || {}).map(([emoji, count]) => (
                    <span key={emoji}>{emoji} {count}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {showUrlModal && (
          <div className="url">
            <div className="create-folder">
              <h2>Add from URL</h2>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <div className="folder-actions">
                <button onClick={() => setShowUrlModal(false)}>Cancel</button>
                <button onClick={handleAddUrl}>Add URL</button>
              </div>
            </div>
          </div>
        )}

        {showDeleteModal && currentImageIdx !== null && (
          <div className="url">
            <div className="create-folder">
              <h2>Delete Image?</h2>
              <p>Are you sure you want to delete this image?</p>
              <div className="folder-actions">
                <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
                <button onClick={handleDeleteImage}>Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}