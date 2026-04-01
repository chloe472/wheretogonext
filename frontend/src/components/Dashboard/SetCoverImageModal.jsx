import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { updateItinerary, uploadItineraryImage } from '../../api/itinerariesApi';
import { resolveImageUrl } from '../../lib/imageFallback';
import './SetCoverImageModal.css';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function validateFile(file) {
  if (!file || !(file instanceof File)) return 'Invalid file.';
  if (file.size > MAX_BYTES) return 'Image must be 5MB or smaller.';
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Allowed types: SVG, PNG, JPG, WEBP, GIF.';
  }
  return '';
}

export default function SetCoverImageModal({ open, itinerary, onClose, onSaved }) {
  const inputRef = useRef(null);
  const previewUrlRef = useRef('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const existingCover = useMemo(() => {
    const firstCover = String(itinerary?.coverImages?.[0] || '').trim();
    if (firstCover) {
      return resolveImageUrl(firstCover, itinerary?.title || 'Trip cover', 'trip');
    }
    const legacyImage = String(itinerary?.image || '').trim();
    if (legacyImage) {
      return resolveImageUrl(legacyImage, itinerary?.title || 'Trip cover', 'trip');
    }
    return '';
  }, [itinerary]);

  useEffect(() => {
    if (!open) return undefined;
    setSelectedFile(null);
    setError('');
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = '';
    }
    setPreviewUrl('');
    return undefined;
  }, [open]);

  useEffect(() => () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
  }, []);

  const handleSelectFile = (file) => {
    const nextFile = Array.isArray(file) ? file[0] : file;
    const validation = validateFile(nextFile);
    if (validation) {
      setError(validation);
      return;
    }
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }
    const nextPreview = URL.createObjectURL(nextFile);
    previewUrlRef.current = nextPreview;
    setSelectedFile(nextFile);
    setPreviewUrl(nextPreview);
    setError('');
  };

  const handleSave = async () => {
    if (!itinerary?._id) return;
    if (!selectedFile) {
      setError('Please upload one image for the cover.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const uploadedUrl = await uploadItineraryImage(selectedFile);
      const existingCoverImages = Array.isArray(itinerary?.coverImages)
        ? itinerary.coverImages.map((item) => String(item || '').trim()).filter(Boolean)
        : [];
      const remainingImages = existingCoverImages.slice(1).filter((url) => url !== uploadedUrl);
      const nextCoverImages = [uploadedUrl, ...remainingImages];
      const updated = await updateItinerary(String(itinerary._id), {
        coverImages: nextCoverImages,
        image: uploadedUrl,
      });
      toast.success('Cover image updated');
      onSaved?.(updated);
      onClose?.();
    } catch (err) {
      const message = err?.message || 'Failed to save cover image.';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !itinerary) return null;

  return (
    <div className="set-cover-modal" role="presentation">
      <button type="button" className="set-cover-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="set-cover-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="set-cover-modal-title">
        <div className="set-cover-modal__head">
          <h2 id="set-cover-modal-title" className="set-cover-modal__title">Set Cover Image</h2>
          <button type="button" className="set-cover-modal__close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <p className="set-cover-modal__lead">
          Upload one image to use as the trip cover. This image will also appear in the publish flow later.
        </p>

        <div
          className="set-cover-modal__drop"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleSelectFile(e.dataTransfer?.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
          role="button"
          tabIndex={0}
        >
          <ImagePlus size={30} aria-hidden />
          <span>Drag & drop one image here, or click to browse</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          className="set-cover-modal__file-input"
          accept="image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
          onChange={(e) => {
            handleSelectFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />

        {error ? <p className="set-cover-modal__error" role="alert">{error}</p> : null}

        <div className="set-cover-modal__preview-stack">
          {previewUrl ? (
            <div className="set-cover-modal__preview-block">
              <p className="set-cover-modal__preview-label">New cover</p>
              <img src={previewUrl} alt="" className="set-cover-modal__preview-image" />
            </div>
          ) : null}
          {existingCover ? (
            <div className="set-cover-modal__preview-block">
              <p className="set-cover-modal__preview-label">{previewUrl ? 'Current cover' : 'Current saved cover'}</p>
              <img src={existingCover} alt="" className="set-cover-modal__preview-image" />
            </div>
          ) : null}
        </div>

        <div className="set-cover-modal__footer">
          <button type="button" className="set-cover-modal__btn set-cover-modal__btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="set-cover-modal__btn set-cover-modal__btn--primary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="set-cover-modal__spin" size={18} aria-hidden />
                Saving...
              </>
            ) : 'Save cover image'}
          </button>
        </div>
      </div>
    </div>
  );
}
