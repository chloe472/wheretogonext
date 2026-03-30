import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { analyzeSocialImport } from '../../api/socialImportApi';
import { placeKeySocialImport } from './socialImportUtils';

/**
 * State and handlers for "Import from social media" (Add to trip sheet).
 * Must be called after `appendItemToTrip` is defined in the parent.
 */
export function useSocialImport({
  appendItemToTrip,
  days,
  cityQuery,
}) {
  const [socialImportOpen, setSocialImportOpen] = useState(false);
  const [socialImportDay, setSocialImportDay] = useState(1);
  const [socialImportStep, setSocialImportStep] = useState('input');
  const [socialImportUrl, setSocialImportUrl] = useState('');
  const [socialImportFiles, setSocialImportFiles] = useState([]);
  const [socialImportFilePreviews, setSocialImportFilePreviews] = useState([]);
  const [socialImportResults, setSocialImportResults] = useState([]);
  const [socialImportSelected, setSocialImportSelected] = useState(() => new Set());
  const [socialImportLocationInsight, setSocialImportLocationInsight] = useState(null);
  const socialImportFileInputRef = useRef(null);

  const resetSocialImportModal = useCallback(() => {
    setSocialImportOpen(false);
    setSocialImportStep('input');
    setSocialImportUrl('');
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
    setSocialImportUrl('');
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
        try { URL.revokeObjectURL(p.url); } catch { /* ignore */ }
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
    const hasLink = socialImportUrl.trim().length > 0;
    const hasFiles = socialImportFiles.length > 0;
    if (!hasLink && !hasFiles) {
      toast.error('Paste a link or upload at least one screenshot, then press Next.');
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
        url: socialImportUrl,
        imageFiles: socialImportFiles,
      });
      if (data.warning) {
        toast(data.warning, { icon: 'ℹ️' });
      }
      setSocialImportLocationInsight(data.locationInsight || null);
      const places = Array.isArray(data.places) ? data.places : [];
      if (places.length === 0) {
        toast.error(data.warning || 'No matching places found. Try another link or clearer screenshots.');
        setSocialImportStep('input');
        return;
      }
      setSocialImportResults(places);
      const defaultSel = new Set(places.slice(0, 5).map((p, i) => placeKeySocialImport(p, i)));
      setSocialImportSelected(defaultSel);
      setSocialImportStep('results');
    } catch (e) {
      if (e?.status === 422 && (e?.code === 'LLM_REQUIRED' || e?.code === 'OPENAI_REQUIRED')) {
        toast.error(
          'Screenshot analysis needs GEMINI_API_KEY or OPENAI_API_KEY in the server .env (backend), not only the frontend. Or add a post link together with your images.',
          { duration: 6000 },
        );
      } else {
        toast.error(e?.message || 'Could not analyze this post. Try again.');
      }
      setSocialImportStep('input');
    }
  }, [socialImportUrl, socialImportFiles, cityQuery]);

  const toggleSocialImportPlace = useCallback((key) => {
    setSocialImportSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const addSocialImportPlacesToTrip = useCallback(() => {
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
    const note = socialImportUrl.trim()
      ? `Imported from social (${socialImportUrl.trim().slice(0, 120)}${socialImportUrl.length > 120 ? '…' : ''})`
      : 'Imported from social (screenshots)';
    selected.forEach((place) => {
      appendItemToTrip({
        itemType: 'place',
        data: {
          id: place.id || place.name,
          name: place.name,
          address: place.address,
          lat: place.lat,
          lng: place.lng,
          rating: place.rating,
          reviewCount: place.reviewCount,
          image: place.image,
        },
        categoryId: 'places',
        category: 'Places',
        Icon: Camera,
        values: {
          date: dateForDay,
          startTime: '10:00',
          durationHrs: '1',
          durationMins: '30',
          note,
          cost: '',
          externalLink: socialImportUrl.trim() || '',
        },
      });
    });
    toast.success(`Added ${selected.length} place${selected.length === 1 ? '' : 's'} to Day ${socialImportDay}`);
    resetSocialImportModal();
  }, [
    appendItemToTrip,
    days,
    socialImportDay,
    socialImportResults,
    socialImportSelected,
    socialImportUrl,
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
      url: socialImportUrl,
      onUrlChange: setSocialImportUrl,
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
