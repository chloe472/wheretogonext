import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  deleteItinerary,
  createItinerary,
  updateItinerary,
} from '../../../api/itinerariesApi';

const DIALOG_CLOSED = {
  open: false,
  title: '',
  message: '',
  showCancel: false,
  confirmText: 'OK',
  cancelText: 'Cancel',
  onConfirm: null,
};

export default function useDashboardTripActions({ setMyTrips, refreshTrips }) {
  const [publishTarget, setPublishTarget] = useState(null);
  const [coverImageTarget, setCoverImageTarget] = useState(null);
  const [renameTarget, setRenameTarget] = useState(null);
  const [renameTitleDraft, setRenameTitleDraft] = useState('');
  const [dialog, setDialog] = useState(DIALOG_CLOSED);

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

  const handleItineraryOwnerMenu = (rawItinerary, action) => {
    if (action === 'share') {
      (async () => {
        const tripId = String(rawItinerary?._id ?? rawItinerary?.id ?? '').trim();
        if (!tripId) {
          toast.error('Trip link is unavailable for this item.');
          return;
        }
        const url = `${window.location.origin}/itineraries/${encodeURIComponent(tripId)}`;
        try {
          if (navigator?.clipboard?.writeText) {
            await navigator.clipboard.writeText(url);
          } else {
            const ta = document.createElement('textarea');
            ta.value = url;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            ta.style.pointerEvents = 'none';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            if (!ok) throw new Error('Copy command failed');
          }
          toast.success('Link copied to clipboard!');
        } catch (e) {
          toast.error(e?.message || 'Could not copy link. Try copying from the address bar.');
        }
      })();
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
  };
}
