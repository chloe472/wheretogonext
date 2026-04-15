import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { updateItinerary } from '../../../api/itinerariesApi';
import { mergeItineraryFromApi } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsNotes({
  tripId,
  tripExpenseItems,
  setServerItinerary,
  skipExpenseSaveToastUntilRef,
}) {
  const [notesModalOpen, setNotesModalOpen] = useState(false);
  const [generalNotes, setGeneralNotes] = useState('');
  const [generalAttachments, setGeneralAttachments] = useState([]);
  const [notesActiveTab, setNotesActiveTab] = useState('general');
  const [notesSaving, setNotesSaving] = useState(false);

  const saveGeneralNotesAndDocuments = useCallback(async () => {
    if (!tripId) return;
    setNotesSaving(true);
    try {
      const updated = await updateItinerary(tripId, {
        generalNotes,
        generalAttachments,
        overview: generalNotes,
      });
      if (updated) setServerItinerary((prev) => mergeItineraryFromApi(prev, updated));
      toast.success('General notes saved', { id: 'trip-notes-saved' });
    } catch (e) {
      console.error('Failed to save general notes/documents', e);
      toast.error(e?.message || 'Could not save general notes', { id: 'trip-notes-save-error' });
    } finally {
      setNotesSaving(false);
    }
  }, [tripId, generalNotes, generalAttachments, setServerItinerary]);

  const saveDayNotesAndDocuments = useCallback(async (dayDate, dayLabel) => {
    if (!tripId || !dayDate) return;
    setNotesSaving(true);
    try {
      skipExpenseSaveToastUntilRef.current = Date.now() + 4000;
      const updated = await updateItinerary(tripId, { tripExpenseItems });
      if (updated) setServerItinerary((prev) => mergeItineraryFromApi(prev, updated));
      toast.success(`${dayLabel} notes saved`, { id: 'trip-day-notes-saved' });
    } catch (e) {
      console.error('Failed to save day notes/documents', e);
      toast.error(e?.message || `Could not save ${dayLabel} notes`, { id: 'trip-day-notes-save-error' });
    } finally {
      setNotesSaving(false);
    }
  }, [tripId, tripExpenseItems, setServerItinerary, skipExpenseSaveToastUntilRef]);

  return {
    notesModalOpen,
    setNotesModalOpen,
    generalNotes,
    setGeneralNotes,
    generalAttachments,
    setGeneralAttachments,
    notesActiveTab,
    setNotesActiveTab,
    notesSaving,
    saveGeneralNotesAndDocuments,
    saveDayNotesAndDocuments,
  };
}
