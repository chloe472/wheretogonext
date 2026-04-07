import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { analyzeSocialImport } from '../../api/socialImportApi';
import { placeKeySocialImport } from './socialImportUtils';
import { getDefaultStartTimeForDate } from '../TripDetailsPage/lib/tripDetailsPageHelpers';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      resolve('');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(reader.error || new Error('Could not read image file.'));
    reader.readAsDataURL(file);
  });
}


export function useSocialImport({
  appendItemToTrip,
  days,
  cityQuery,
  tripDestinations = [],
  tripExpenseItems = [],
}) {
  const [socialImportOpen, setSocialImportOpen] = useState(false);
  const [socialImportDay, setSocialImportDay] = useState(1);
  const [socialImportStep, setSocialImportStep] = useState('input');
  const [socialImportFiles, setSocialImportFiles] = useState([]);
  const [socialImportFilePreviews, setSocialImportFilePreviews] = useState([]);
  const [socialImportResults, setSocialImportResults] = useState([]);
  const [socialImportSelected, setSocialImportSelected] = useState(() => new Set());
  const [socialImportLocationInsight, setSocialImportLocationInsight] = useState(null);
  const socialImportFileInputRef = useRef(null);

  const resetSocialImportModal = useCallback(() => {
    setSocialImportOpen(false);
    setSocialImportStep('input');
    setSocialImportFiles([]);
    setSocialImportFilePreviews([]);
    setSocialImportResults([]);
    setSocialImportSelected(new Set());
    setSocialImportLocationInsight(null);
    if (socialImportFileInputRef.current) socialImportFileInputRef.current.value = '';
  }, []);

  const openSocialImportForDay = useCallback((dayNum) => {
    setSocialImportDay(dayNum ?? 1);
    setSocialImportStep('input');
    setSocialImportFiles([]);
    setSocialImportResults([]);
    setSocialImportSelected(new Set());
    if (socialImportFileInputRef.current) socialImportFileInputRef.current.value = '';
    setSocialImportOpen(true);
  }, []);

  useEffect(() => {
    const next = (Array.isArray(socialImportFiles) ? socialImportFiles : [])
      .map((file) => {
        try {
          return { file, url: URL.createObjectURL(file) };
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    setSocialImportFilePreviews(next);
    return () => {
      next.forEach((p) => {
        try { URL.revokeObjectURL(p.url); } catch {  }
      });
    };
  }, [socialImportFiles]);

  const removeSocialImportFileAt = useCallback((index) => {
    setSocialImportFiles((prev) => {
      const list = Array.isArray(prev) ? [...prev] : [];
      list.splice(index, 1);
      return list;
    });
  }, []);

  const runSocialImportAnalysis = useCallback(async () => {
    const hasFiles = socialImportFiles.length > 0;
    if (!hasFiles) {
      toast.error('Upload at least one screenshot, then press Next.');
      return;
    }
    if (!cityQuery) {
      toast.error('Set your trip destination first so we can suggest nearby places.');
      return;
    }
    setSocialImportStep('analyzing');
    try {
      const data = await analyzeSocialImport({
        destination: cityQuery,
        tripDestinations,
        imageFiles: socialImportFiles,
      });
      setSocialImportLocationInsight(data.locationInsight || null);
      const places = Array.isArray(data.places) ? data.places : [];
      if (places.length === 0) {
        toast.error(data.warning || 'No matching places found. Try clearer screenshots.');
        setSocialImportStep('input');
        return;
      }
      if (data.warning) {
        toast(data.warning, { icon: 'ℹ️' });
      }
      setSocialImportResults(places);
      const defaultSel = new Set(places.slice(0, 5).map((p, i) => placeKeySocialImport(p, i)));
      setSocialImportSelected(defaultSel);
      setSocialImportStep('results');
    } catch (e) {
      if (e?.status === 422 && (e?.code === 'LLM_REQUIRED' || e?.code === 'OPENAI_REQUIRED')) {
        toast.error(
          'Screenshot analysis needs GEMINI_API_KEY in the backend .env.',
          { duration: 6000 },
        );
      } else {
        toast.error(e?.message || 'Could not analyze this post. Try again.');
      }
      setSocialImportStep('input');
    }
  }, [socialImportFiles, cityQuery, tripDestinations]);

  const toggleSocialImportPlace = useCallback((key) => {
    setSocialImportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const addSocialImportPlacesToTrip = useCallback(async () => {
    const dateForDay = days.find((d) => d.dayNum === socialImportDay)?.date || days[0]?.date;
    if (!dateForDay) {
      toast.error('Could not resolve a day for this trip.');
      return;
    }
    const selected = socialImportResults.filter((p, idx) => socialImportSelected.has(placeKeySocialImport(p, idx)));
    if (selected.length === 0) {
      toast.error('Select at least one place to add.');
      return;
    }
    const note = 'Imported from social (screenshots)';
    const durationHrs = 1;
    const durationMins = 30;
    const durationMinutes = durationHrs * 60 + durationMins;
    const stagedDayItems = [...tripExpenseItems];
    let addedCount = 0;
    let failedCount = 0;
    for (const place of selected) {
      const startTime = getDefaultStartTimeForDate(stagedDayItems, dateForDay, '10:00', durationMinutes);
      let persistedImage = place.image || '';

      if (!persistedImage && Number.isInteger(place?.imageIndex)) {
        try {
          persistedImage = await fileToDataUrl(socialImportFiles[place.imageIndex]);
        } catch {
          persistedImage = '';
        }
      }

      const didAppend = appendItemToTrip({
        itemType: 'place',
        data: {
          id: place.id || place.name,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          reviewCount: place.reviewCount,
          image: persistedImage,
        },
        categoryId: 'places',
        category: 'Places',
        Icon: Camera,
        values: {
          date: dateForDay,
          startTime,
          durationHrs,
          durationMins,
          note,
          cost: '',
          externalLink: '',
        },
      });
      if (didAppend) {
        addedCount += 1;
        stagedDayItems.push({
          date: dateForDay,
          startTime,
          durationHrs,
          durationMins,
          categoryId: 'places',
          name: place.name,
        });
      } else {
        failedCount += 1;
      }
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} place${addedCount === 1 ? '' : 's'} to Day ${socialImportDay}.`);
    }
    if (failedCount > 0) {
      toast.error(
        `${failedCount} place${failedCount === 1 ? '' : 's'} could not be added. Check for time conflicts and try again.`,
      );
    }
    if (addedCount > 0) {
      resetSocialImportModal();
    }
  }, [
    appendItemToTrip,
    days,
    socialImportDay,
    socialImportFiles,
    socialImportResults,
    socialImportSelected,
    tripExpenseItems,
    resetSocialImportModal,
  ]);

  const appendFiles = useCallback((incoming) => {
    setSocialImportFiles((prev) => {
      const base = Array.isArray(prev) ? prev : [];
      return [...base, ...incoming].slice(0, 8);
    });
  }, []);

  return {
    openSocialImportForDay,
    resetSocialImportModal,
    socialImportModalProps: {
      isOpen: socialImportOpen,
      onClose: resetSocialImportModal,
      step: socialImportStep,
      onStepChange: setSocialImportStep,
      day: socialImportDay,
      cityQuery,
      files: socialImportFiles,
      onFilesAppend: appendFiles,
      filePreviews: socialImportFilePreviews,
      fileInputRef: socialImportFileInputRef,
      onRemoveFileAt: removeSocialImportFileAt,
      onRunAnalysis: runSocialImportAnalysis,
      results: socialImportResults,
      selectedKeys: socialImportSelected,
      onTogglePlace: toggleSocialImportPlace,
      onAddSelectedToTrip: addSocialImportPlacesToTrip,
      locationInsight: socialImportLocationInsight,
    },
  };
}
