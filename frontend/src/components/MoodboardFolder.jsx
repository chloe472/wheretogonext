import './MoodboardFolder.css';
import { useEffect, useState } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_FOLDERS } from "./data/mockMoodboard.js";
import DashboardHeader from './DashboardHeader';
import TripHeader from './TripHeader';

export default function MoodboardFolder() {
  const { id: folderId } = useParams();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [reactions, setReactions] = useState({});
  const folder = MOCK_FOLDERS.find(f => f.id === folderId);

  useEffect(() => {
    const savedImages = JSON.parse(localStorage.getItem(folderId + "Images"));
    if (savedImages?.length) {
      setImages(savedImages);
    } else {
      setImages(folder?.images || []);
    }

    const sourceImages = savedImages?.length
      ? savedImages
      : (folder?.images || []);

    const savedReactions = {};
    sourceImages.forEach((_, i) => {
      const pinId = folderId + "-" + i;
      savedReactions[pinId] = JSON.parse(localStorage.getItem(pinId)) || {};
    });
    setReactions(savedReactions);
  }, [folderId, folder]);

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const newImages = [...images, ev.target.result];
        setImages(newImages);
        localStorage.setItem(folderId + "Images", JSON.stringify(newImages));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddUrl = () => {
    if (!urlInput) return;
    const newImages = [...images, urlInput];
    setImages(newImages);
    localStorage.setItem(folderId + "Images", JSON.stringify(newImages));
    setUrlInput("");
    setShowUrlModal(false);
  };

  const handleEmojiClick = (pinId, emoji) => {
    const pinReactions = reactions[pinId] || {};
    const updated = {
      ...reactions,
      [pinId]: { ...pinReactions, [emoji]: (pinReactions[emoji] || 0) + 1 }
    };
    setReactions(updated);
    localStorage.setItem(pinId, JSON.stringify(updated[pinId]));
  };

  return (
    <div className="container">
      <DashboardHeader /> {/* no user/onLogout props */}
      <TripHeader folderName={folder?.name || ""} /> {/* fixed folderName */}

      <div className="folder-header-row">
        <div className="folder-left">
          <button className="back-btn" onClick={() => navigate("/")}>
            &lt;
          </button>
          <div className="folder-title">
            <h1>{folder?.name || folderId}</h1>
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
        {images.map((src, idx) => {
          const pinId = folderId + "-" + idx;
          return (
            <div className="pin" key={pinId}>
              <img src={src} alt={`img-${idx}`} />
              <div className="emoji-popup">
                {["❤️", "😍", "🔥"].map((emoji) => (
                  <span key={emoji} onClick={() => handleEmojiClick(pinId, emoji)}>
                    {emoji}
                  </span>
                ))}
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
              <button onClick={handleAddUrl} id="create-url">Add URL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}