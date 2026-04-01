import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchItineraryById } from '../../../api/itinerariesApi';
import {
  fetchMoodboardFolders,
  createMoodboardFolder,
  updateMoodboardFolder,
  deleteMoodboardFolder,
} from '../../../api/moodboardApi';

export function useMoodboard() {
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
      setLoading(true);
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

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    try {
      const updated = await createMoodboardFolder(tripId, newFolderName.trim());
      setFolders(updated);
      setShowCreate(false);
      setNewFolderName('');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!currentFolder || !newFolderName.trim()) return;
    setLoading(true);
    try {
      const updated = await updateMoodboardFolder(tripId, currentFolder.id, newFolderName.trim());
      setFolders(updated);
      setShowEdit(false);
      setCurrentFolder(null);
      setNewFolderName('');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentFolder) return;
    setLoading(true);
    try {
      const updated = await deleteMoodboardFolder(tripId, currentFolder.id);
      setFolders(updated);
      setShowDelete(false);
      setCurrentFolder(null);
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (folder) => {
    setCurrentFolder(folder);
    setNewFolderName(folder.name);
    setShowEdit(true);
    setOpenMenuId(null);
  };

  const openDeleteConfirm = (folder) => {
    setCurrentFolder(folder);
    setShowDelete(true);
    setOpenMenuId(null);
  };

  return {
    tripId,
    trip,
    folders,
    loading,
    error,
    // create modal
    showCreate,
    setShowCreate,
    // edit modal
    showEdit,
    setShowEdit,
    // delete modal
    showDelete,
    setShowDelete,
    // shared name input
    newFolderName,
    setNewFolderName,
    // menu
    openMenuId,
    setOpenMenuId,
    // handlers
    handleCreate,
    handleEdit,
    handleDelete,
    openEdit,
    openDeleteConfirm,
  };
}
