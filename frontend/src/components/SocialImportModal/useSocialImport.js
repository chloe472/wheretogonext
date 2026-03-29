import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Camera } from 'lucide-react';
import { fetchDiscoveryData } from '../../api/discoveryApi';
import { placeKeySocialImport } from './socialImportUtils';

/**
 * State and handlers for "Import from social media" (Add to trip sheet).
 * Must be called after `appendItemToTrip` is defined in the parent.
 */
export function useSocialImport({
  appendItemToTrip,
  days,
  cityQuery,
  discoveryData,
  filteredPlaces,
}) {
  const [socialImportOpen, setSocialImportOpen] = useState(false);
  const [socialImportDay, setSocialImportDay] = useState(1);
  const [socialImportStep, setSocialImportStep] = useState('input');
  const [socialImportUrl, setSocialImportUrl] = useState('');
  const [socialImportFiles, setSocialImportFiles] = useState([]);
  const [socialImportFilePreviews, setSocialImportFilePreviews] = useState([]);
  const [socialImportResults, setSocialImportResults] = useState([]);
  const [socialImportSelected, setSocialImportSelected] = useState(() => new Set());
  const socialImportFileInputRef = useRef(null);

  const resetSocialImportModal = useCallback(() => {
    setSocialImportOpen(false);
    setSocialImportStep('input');
    setSocialImportUrl('');
    setSocialImportFiles([]);
    setSocialImportFilePreviews([]);
    setSocialImportResults([]);
    setSocialImportSelected(new Set());
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
    await new Promise((r) => setTimeout(r, 1400));
    try {
      let places = [];
      if (Array.isArray(discoveryData?.places) && discoveryData.places.length > 0) {
        places = filteredPlaces.slice(0, 12);
      } else {
        const data = await fetchDiscoveryData(cityQuery, 28);
        const raw = Array.isArray(data.places) ? data.places : [];
        const scorePlace = (p) =>
          Number(p.recommendedScore || 0)
          + Number(p.rating || 0) * 8
          + Math.log10(Number(p.reviewCount || 0) + 1) * 5;
        places = [...raw].sort((a, b) => scorePlace(b) - scorePlace(a)).slice(0, 12);
      }
      if (places.length === 0) {
        toast.error('No places found for this destination. Try again later.');
        setSocialImportStep('input');
        return;
      }
      setSocialImportResults(places);
      const defaultSel = new Set(places.slice(0, 5).map((p, i) => placeKeySocialImport(p, i)));
      setSocialImportSelected(defaultSel);
      setSocialImportStep('results');
    } catch (e) {
      toast.error(e?.message || 'Could not load suggestions');
      setSocialImportStep('input');
    }
  }, [socialImportUrl, socialImportFiles, cityQuery, discoveryData?.places, filteredPlaces]);

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
    },
  };
}
