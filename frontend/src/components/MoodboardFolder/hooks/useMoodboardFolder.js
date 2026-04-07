import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetchMoodboardFolder,
  addMoodboardImage,
  deleteMoodboardImage,
  reactToMoodboardImage,
} from '../../../api/moodboardApi';
import { fetchItineraryById } from '../../../api/itinerariesApi';

export function useMoodboardFolder(user) {
  const { tripId, folderId } = useParams();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [folder, setFolder] = useState(null);
  const [images, setImages] = useState([]);
  const [reactions, setReactions] = useState({});
  const [urlInput, setUrlInput] = useState('');
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentImageIdx, setCurrentImageIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  
  const [aiResult, setAiResult] = useState(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const loadFolder = async () => {
      setLoading(true);
      try {
        const [folderData, tripData] = await Promise.all([
          fetchMoodboardFolder(tripId, folderId),
          fetchItineraryById(tripId),
        ]);
        setFolder(folderData);
        setImages(folderData.images || []);
        setTrip(tripData);

        const initReactions = {};
        (folderData.images || []).forEach((img, idx) => {
          const pinId = folderId + '-' + idx;
          initReactions[pinId] = { ...img.reactions };
        });
        setReactions(initReactions);
      } catch (err) {
        console.error(err);
        setError('Failed to load folder');
      } finally {
        setLoading(false);
      }
    };

    if (tripId && folderId) loadFolder();
  }, [tripId, folderId]);

  const handleEmojiClick = async (pinId, emoji, imageId) => {
    if (!user?.name) return;
    setReactions((prev) => {
      const current = prev[pinId] || {};
      const reactedUsers = Array.isArray(current[emoji]) ? current[emoji] : [];
      const alreadyReacted = reactedUsers.includes(user.name);
      const updatedUsers = alreadyReacted
        ? reactedUsers.filter((u) => u !== user.name)
        : [...reactedUsers, user.name];
      return { ...prev, [pinId]: { ...current, [emoji]: updatedUsers } };
    });
    try {
      await reactToMoodboardImage(tripId, folderId, imageId, emoji, user.name);
    } catch (err) {
      console.error(err);
      toast.error('Failed to update reaction');
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
      toast.success('Image deleted');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to delete image');
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      const newImage = await addMoodboardImage(tripId, folderId, urlInput.trim());
      setImages((prev) => [...prev, newImage]);
      setUrlInput('');
      setShowUrlModal(false);
      toast.success('Image added');
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Failed to add image');
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const newImage = await addMoodboardImage(tripId, folderId, ev.target.result);
                    toast.success('Image uploaded');
          setImages((prev) => [...prev, newImage]);
        } catch (err) {
          console.error(err);
          toast.error(err?.message || 'Failed to upload image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyzeMoodboard = async () => {
    if (images.length === 0) {
      toast.error('Add some images before analysing');
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    setShowAiModal(true);
    try {
      const tripDestinations = String(trip?.locations || trip?.destination || '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean);
      const res = await fetch('/api/moodboard-analysis/analyze-moodboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          destination: trip?.destination || '',
          tripDestinations,
        }),
      });
      const data = await res.json();
      setAiResult(data);
      toast.success('Analysis complete');
    } catch (err) {
      console.error(err);
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const addToItinerary = (place) => {
    navigate(`/trip/${tripId}`, { state: { aiPlaces: [place] } });
  };

  return {
    tripId,
    folderId,
    trip,
    setTrip,
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
  };
}
