import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteItinerary,
  createItinerary,
  updateItinerary,
  shareItineraryWithFriends,
} from '../../../api/itinerariesApi';
import {
  fetchMyProfile,
  lookupUserByEmail,
  searchUsers,
} from '../../../api/profileApi';

const DIALOG_CLOSED = {
  open: false,
  title: '',
  message: '',
  showCancel: false,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onConfirm: null,
};

export default function useDashboardTripActions({ setMyTrips, refreshTrips, user }) {
  const [publishTarget, setPublishTarget] = useState(null);
  const [coverImageTarget, setCoverImageTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameTitleDraft, setRenameTitleDraft] = useState('');
  const [dialog, setDialog] = useState(DIALOG_CLOSED);

  
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItinerary, setShareItinerary] = useState(null);
  const [shareFriends, setShareFriends] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);

  const closeRenameModal = () => {
    setRenameTarget(null);
    setRenameTitleDraft('');
  };

  const closeDialog = () => setDialog(DIALOG_CLOSED);

  const applyRenameFromModal = async () => {
    const title = renameTitleDraft.trim();
    if (!renameTarget || !title) return;
    try {
      await updateItinerary(String(renameTarget._id), { title });
      setMyTrips((prev) =>
        prev.map((doc) => (String(doc._id) === String(renameTarget._id) ? { ...doc, title } : doc)),
      );
      closeRenameModal();
      toast.success('Trip renamed');
    } catch (err) {
      setDialog({
        ...DIALOG_CLOSED,
        open: true,
        title: 'Could not rename trip',
        message: err?.message || 'Please try again.',
      });
    }
  };

  const handleOpenShareModal = async (rawItinerary) => {
    setShareItinerary(rawItinerary);
    setShareModalOpen(true);
    setShareLoading(true);
    try {
      const profilePayload = await fetchMyProfile().catch(() => null);
      const myId = String(user?.id || user?._id || '');
      const allFriends = Array.isArray(profilePayload?.friends) ? profilePayload.friends : [];
      setShareFriends(allFriends.filter((f) => f.id !== myId));
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareInviteByEmail = async (email, role = 'viewer') => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    if (!tripId) return;
    try {
      const lookup = await lookupUserByEmail(email);
      const userId = lookup?.user?.id ? String(lookup.user.id) : '';
      if (!userId) throw new Error('No account found for that email.');
      const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
      const exists = currentCollabs.some((c) => String(c?.user?.id || c?.userId || '') === userId);
      if (exists) { toast('This person already has access.'); return; }
      const newCollabs = [
        ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
        { userId, email, role },
      ];
      const updated = await updateItinerary(tripId, { collaborators: newCollabs });
      setShareItinerary((prev) => ({ ...prev, ...updated }));
      setMyTrips((prev) => prev.map((t) => String(t._id || t.id) === tripId ? { ...t, ...updated } : t));
      await shareItineraryWithFriends(tripId, [userId]);
      toast.success('Invite sent.');
    } catch (err) {
      throw new Error(err?.message || 'Could not send invite.');
    }
  };

  const handleShareInviteByUser = async (searchUser, role = 'viewer') => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    if (!tripId) return;
    const userId = String(searchUser?.id || '');
    if (!userId) throw new Error('Invalid user.');
    const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
    const exists = currentCollabs.some((c) => String(c?.user?.id || c?.userId || '') === userId);
    if (exists) { toast('This person already has access.'); return; }
    const newCollabs = [
      ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
      { userId, role },
    ];
    const updated = await updateItinerary(tripId, { collaborators: newCollabs });
    setShareItinerary((prev) => ({ ...prev, ...updated }));
    setMyTrips((prev) => prev.map((t) => String(t._id || t.id) === tripId ? { ...t, ...updated } : t));
    await shareItineraryWithFriends(tripId, [userId]);
    toast.success('Invite sent.');
  };

  const handleShareSendToFriends = async (friendIds, roleMap = {}) => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    if (!tripId) return;
    const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
    const existingIds = new Set(currentCollabs.map((c) => String(c?.user?.id || c?.userId || '')).filter(Boolean));
    const toAdd = friendIds.filter((id) => !existingIds.has(String(id)));
    const newCollabs = [
      ...currentCollabs.map((c) => ({ userId: String(c?.user?.id || c?.userId || ''), role: c?.role || 'viewer' })),
      ...toAdd.map((id) => ({ userId: String(id), role: roleMap[id] || 'viewer' })),
    ];
    const updated = await updateItinerary(tripId, { collaborators: newCollabs });
    setShareItinerary((prev) => ({ ...prev, ...updated }));
    setMyTrips((prev) => prev.map((t) => String(t._id || t.id) === tripId ? { ...t, ...updated } : t));
    await shareItineraryWithFriends(tripId, toAdd);
    toast.success(`Trip shared with ${toAdd.length} friend${toAdd.length !== 1 ? 's' : ''}`);
  };

  const handleShareUpdateCollaborator = async (collab, newRole) => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    if (!tripId) return;
    const collabId = String(collab?.user?.id || collab?.userId || '');
    const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
    const updated = await updateItinerary(tripId, {
      collaborators: currentCollabs.map((c) => {
        const cId = String(c?.user?.id || c?.userId || '');
        const match = (collabId && cId === collabId) || (collab?.email && c.email === collab.email);
        const payload = { role: match ? newRole : (c?.role || 'viewer') };
        if (cId) payload.userId = cId;
        if (c?.email) payload.email = c.email;
        return payload;
      }),
    });
    setShareItinerary((prev) => ({ ...prev, ...updated }));
    setMyTrips((prev) => prev.map((t) => String(t._id || t.id) === tripId ? { ...t, ...updated } : t));
  };

  const handleShareRemoveCollaborator = async (collab) => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    if (!tripId) return;
    const collabId = String(collab?.user?.id || collab?.userId || '');
    const currentCollabs = Array.isArray(shareItinerary?.collaborators) ? shareItinerary.collaborators : [];
    const updated = await updateItinerary(tripId, {
      collaborators: currentCollabs
        .filter((c) => {
          const cId = String(c?.user?.id || c?.userId || '');
          return !((collabId && cId === collabId) || (collab?.email && c.email === collab.email));
        })
        .map((c) => {
          const cId = String(c?.user?.id || c?.userId || '');
          const payload = { role: c?.role || 'viewer' };
          if (cId) payload.userId = cId;
          if (c?.email) payload.email = c.email;
          return payload;
        }),
    });
    setShareItinerary((prev) => ({ ...prev, ...updated }));
    setMyTrips((prev) => prev.map((t) => String(t._id || t.id) === tripId ? { ...t, ...updated } : t));
  };

  const handleShareCopyLink = async () => {
    const tripId = String(shareItinerary?._id || shareItinerary?.id || '').trim();
    const url = tripId ? `${window.location.origin}/trip/${encodeURIComponent(tripId)}` : window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Could not copy link.');
    }
  };

  const handleItineraryOwnerMenu = (rawItinerary, action) => {
    if (action === 'share') {
      handleOpenShareModal(rawItinerary);
      return;
    }

    if (action === 'publish') {
      if (rawItinerary?.published && rawItinerary?.visibility === 'public') {
        (async () => {
          try {
            const updated = await updateItinerary(String(rawItinerary?._id ?? rawItinerary?.id ?? ''), {
              published: false,
              visibility: 'private',
              publishedAt: null,
            });
            const updatedId = String(updated?._id ?? updated?.id ?? rawItinerary?._id ?? rawItinerary?.id);
            setMyTrips((prev) => prev.map((trip) => (
              String(trip?._id ?? trip?.id ?? '') === updatedId
                ? { ...trip, ...updated }
                : trip
            )));
            toast.success('Trip moved to private');
          } catch (e) {
            toast.error(e?.message || 'Could not make this trip private.');
          }
        })();
        return;
      }
      setPublishTarget({ itinerary: rawItinerary, initialStep: 1, mode: 'publish' });
      return;
    }

    if (action === 'edit-published-content') {
      setPublishTarget({ itinerary: rawItinerary, initialStep: 1, mode: 'edit' });
      return;
    }

    if (action === 'set-cover-page') {
      setCoverImageTarget(rawItinerary);
      return;
    }

    if (action === 'rename') {
      setRenameTarget(rawItinerary);
      setRenameTitleDraft(String(rawItinerary.title || '').trim() || 'Untitled trip');
      return;
    }

    if (action === 'duplicate') {
      (async () => {
        try {
          await createItinerary({
            title: `${rawItinerary.title || 'Itinerary'} (copy)`,
            overview: rawItinerary.overview || '',
            destination: rawItinerary.destination || '',
            locations: rawItinerary.locations || '',
            startDate: rawItinerary.startDate || '',
            endDate: rawItinerary.endDate || '',
            dates: rawItinerary.dates || '',
            days: rawItinerary.days || 1,
            categories: Array.isArray(rawItinerary.categories) ? rawItinerary.categories : [],
            coverImages: Array.isArray(rawItinerary.coverImages) ? rawItinerary.coverImages : [],
            places: Array.isArray(rawItinerary.places) ? rawItinerary.places : [],
            tripExpenseItems: Array.isArray(rawItinerary.tripExpenseItems) ? rawItinerary.tripExpenseItems : [],
            budget: rawItinerary.budget,
            budgetSpent: rawItinerary.budgetSpent,
            travelers: rawItinerary.travelers,
            status: rawItinerary.status,
            statusClass: rawItinerary.statusClass,
            image: rawItinerary.image,
            placesSaved: rawItinerary.placesSaved,
            published: false,
            visibility: 'private',
          });
          await refreshTrips();
          toast.success('Trip duplicated successfully');
        } catch (e) {
          toast.error(e?.message || 'Could not duplicate trip. Please try again.');
        }
      })();
      return;
    }

    if (action === 'delete') {
      setDialog({
        ...DIALOG_CLOSED,
        open: true,
        title: 'Delete trip',
        message: 'Delete this trip? This cannot be undone.',
        showCancel: true,
        confirmText: 'Delete',
        onConfirm: async () => {
          try {
            await deleteItinerary(String(rawItinerary._id));
            setMyTrips((prev) => prev.filter((x) => String(x._id) !== String(rawItinerary._id)));
            closeDialog();
            toast.success('Trip deleted');
          } catch (e) {
            setDialog({
              ...DIALOG_CLOSED,
              open: true,
              title: 'Delete failed',
              message: e?.message || 'Please try again.',
            });
          }
        },
      });
    }
  };

  return {
    publishTarget,
    setPublishTarget,
    coverImageTarget,
    setCoverImageTarget,
    renameTarget,
    renameTitleDraft,
    setRenameTitleDraft,
    dialog,
    closeDialog,
    closeRenameModal,
    applyRenameFromModal,
    handleItineraryOwnerMenu,
    shareModalOpen,
    setShareModalOpen,
    shareItinerary,
    shareFriends,
    shareLoading,
    searchUsers,
    handleShareInviteByEmail,
    handleShareInviteByUser,
    handleShareSendToFriends,
    handleShareUpdateCollaborator,
    handleShareRemoveCollaborator,
    handleShareCopyLink,
  };
}
