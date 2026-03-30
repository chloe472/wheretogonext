import './MoodboardFolder.css';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { fetchMoodboardFolder, addMoodboardImage, deleteMoodboardImage } from '../../api/moodboardApi';
import { fetchItineraryById } from '../../api/itinerariesApi';
import TripHeader from '../TripDetailsHeader/TripDetailsHeader';

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

  // Load folder and trip
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
          initReactions[pinId] = img.reactions || {}; // { "❤️": ["user1", "user2"] }
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

  // Emoji click toggle
  const handleEmojiClick = (pinId, emoji) => {
    if (!user?.name) return;
    
    setReactions(prev => {
      const current = prev[pinId] || {};
      const reactedUsers = current[emoji] || [];

      const alreadyReacted = reactedUsers.includes(user.name);
      const updatedUsers = alreadyReacted
        ? reactedUsers.filter(u => u !== user.name)
        : [...reactedUsers, user.name];

      const updatedCurrent = { ...current };
      if (updatedUsers.length > 0) {
        updatedCurrent[emoji] = updatedUsers;
      } else {
        delete updatedCurrent[emoji];
      }

      return {
        ...prev,
        [pinId]: updatedCurrent
      };
    });
  };

  // Delete image
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

  // Add from URL
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

  // Upload files
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
      {trip && (
        <TripHeader
          trip={trip}
          spent={trip.budgetSpent || 0}
          currency="SGD"
          onNotesOpen={() => console.log('Open Notes modal')}
        />
      )}

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

          {/* Combined dropdown */}
          <div className="folder-right">
            <div className="dropdown">
              <button className="upload-dropdown-btn">Add Image ▾</button>
              <div className="dropdown-content">
                <button onClick={() => document.getElementById("file-input").click()}>
                  Upload from Device
                </button>
                <button onClick={() => setShowUrlModal(true)}>
                  Add from URL
                </button>
              </div>
            </div>
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
                  {Object.entries(reactions[pinId] || {}).map(([emoji, users]) => (
                    <span key={emoji} title={users.map(u => u.name || u).join(", ")}>
                      {emoji} {users.length}
                    </span>
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