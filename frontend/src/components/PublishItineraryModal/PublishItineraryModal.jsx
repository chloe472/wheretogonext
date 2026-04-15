import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { X, Check, Loader2, ImagePlus, MoreVertical } from 'lucide-react';
import { publishItinerary, uploadItineraryImage } from '../../api/itinerariesApi';
import { PUBLISH_TO_EXPLORE_DISABLED_HINT } from '../TripDetailsPage/lib/tripCollaborationAccess';
import { PUBLISH_CATEGORY_OPTIONS } from '../../data/communitySearchConstants';
import { resolveImageUrl } from '../../lib/imageFallback';
import './PublishItineraryModal.css';

export { PUBLISH_CATEGORY_OPTIONS };

const MAX_OVERVIEW = 1000;
const MIN_IMAGES = 3;
const MAX_IMAGES = 15;
const MAX_BYTES = 5 * 1024 * 1024;

const DRAFT_STORAGE_PREFIX = 'wtg.publishDraft.v1';

const PUBLISH_STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Photos' },
];

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

function newId() {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `img-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function validateFile(file) {
  if (!file || !(file instanceof File)) return 'Invalid file';
  if (file.size > MAX_BYTES) return 'Each file must be 5MB or smaller.';
  if (!ALLOWED_TYPES.has(file.type)) {
    return 'Allowed types: SVG, PNG, JPG, WEBP, GIF.';
  }
  return null;
}

function draftKeyForItineraryId(itineraryId) {
  const id = String(itineraryId || '').trim();
  return id ? `${DRAFT_STORAGE_PREFIX}:${id}` : '';
}

function loadDraft(itineraryId) {
  try {
    if (typeof localStorage === 'undefined') return null;
    const key = draftKeyForItineraryId(itineraryId);
    if (!key) return null;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveDraft(itineraryId, patch = {}) {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = draftKeyForItineraryId(itineraryId);
    if (!key) return;
    const prev = loadDraft(itineraryId) || {};
    const next = { ...prev, ...patch, updatedAt: Date.now() };
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function clearDraft(itineraryId) {
  try {
    if (typeof localStorage === 'undefined') return;
    const key = draftKeyForItineraryId(itineraryId);
    if (!key) return;
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}


export default function PublishItineraryModal({
  open,
  onClose,
  itinerary,
  onPublished,
  initialStep = 1,
  mode = 'publish',
}) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [photoError, setPhotoError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openKebab, setOpenKebab] = useState(null);
  
  const [farthestStep, setFarthestStep] = useState(1);
  const fileInputRef = useRef(null);
  const revokeUrls = useRef([]);

  const resetFromItinerary = useCallback(() => {
    if (!itinerary) return;
    const itineraryId = String(itinerary?._id || itinerary?.id || '').trim();
    const nextStep = initialStep === 2 ? 2 : 1;
    setStep(nextStep);
    setFarthestStep(nextStep);
    setSuccess(false);
    setTitle(String(itinerary.title || '').trim());
    setOverview(String(itinerary.overview || '').slice(0, MAX_OVERVIEW));
    setCategories(Array.isArray(itinerary.categories) ? [...itinerary.categories] : []);
    setPhotoError('');
    setSubmitError('');
    revokeUrls.current.forEach((u) => URL.revokeObjectURL(u));
    revokeUrls.current = [];

    const itineraryRemote = Array.isArray(itinerary.coverImages)
      ? itinerary.coverImages.filter(Boolean).map((u) => String(u))
      : [];
    const draft = loadDraft(itineraryId);
    const draftRemote = Array.isArray(draft?.remoteCoverImages)
      ? draft.remoteCoverImages.map((u) => String(u)).filter(Boolean)
      : null;
    const remoteFinal = Array.isArray(draftRemote)
      ? draftRemote.filter((u) => itineraryRemote.includes(u))
      : itineraryRemote;

    const existing = remoteFinal.map((url) => ({
          id: newId(),
          kind: 'remote',
          url: String(url),
        }));
    setImages(existing);
  }, [itinerary, initialStep]);

  useEffect(() => {
    if (open && itinerary) {
      resetFromItinerary();
    }
  }, [open, itinerary, resetFromItinerary]);

  useEffect(() => {
    return () => {
      revokeUrls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  useEffect(() => {
    if (!openKebab) return;
    function handle(e) {
      if (!e.target.closest('.publish-modal__tile-menu')) {
        setOpenKebab(null);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [openKebab]);

  const toggleCategory = (cat) => {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  };

  const addFiles = (fileList) => {
    setPhotoError('');
    const files = Array.from(fileList || []);
    const next = [...images];
    for (const file of files) {
      if (next.length >= MAX_IMAGES) {
        setPhotoError(`You can upload at most ${MAX_IMAGES} images.`);
        break;
      }
      const err = validateFile(file);
      if (err) {
        setPhotoError(err);
        continue;
      }
      const preview = URL.createObjectURL(file);
      revokeUrls.current.push(preview);
      next.push({ id: newId(), kind: 'file', file, preview });
    }
    setImages(next);
  };

  const removeImage = (id) => {
    setImages((prev) => {
      const found = prev.find((x) => x.id === id);
      if (found?.kind === 'remote' && found.url) {
        const itineraryId = String(itinerary?._id || itinerary?.id || '').trim();
        if (itineraryId) {
          const remoteAfter = prev
            .filter((x) => x.kind === 'remote' && x.id !== id)
            .map((x) => String(x.url))
            .filter(Boolean);
          saveDraft(itineraryId, { remoteCoverImages: remoteAfter });
        }
      }
      if (found?.kind === 'file' && found.preview) {
        URL.revokeObjectURL(found.preview);
        revokeUrls.current = revokeUrls.current.filter((u) => u !== found.preview);
      }
      return prev.filter((x) => x.id !== id);
    });
    setOpenKebab(null);
  };

  const setAsThumbnail = (id) => {
    setImages((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx <= 0) return prev;
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
      const itineraryId = String(itinerary?._id || itinerary?.id || '').trim();
      if (itineraryId) {
        const remoteAfter = copy
          .filter((x) => x.kind === 'remote')
          .map((x) => String(x.url))
          .filter(Boolean);
        saveDraft(itineraryId, { remoteCoverImages: remoteAfter });
      }
      return copy;
    });
    setOpenKebab(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addFiles(e.dataTransfer?.files);
  };

  const goNext = () => {
    setSubmitError('');
    if (step === 1) {
      if (!title.trim()) {
        setSubmitError('Please enter a title.');
        return;
      }
      setFarthestStep((f) => Math.max(f, 2));
      setStep(2);
      return;
    }
    if (step === 2) {
      if (images.length < MIN_IMAGES) {
        setPhotoError(`Add at least ${MIN_IMAGES} images to continue.`);
        return;
      }
      setPhotoError('');
    }
  };

  const goToStep = (n) => {
    if (n < 1 || n > 2 || n > farthestStep) return;
    setSubmitError('');
    setPhotoError('');
    setOpenKebab(null);
    setStep(n);
  };

  const goBack = () => {
    setSubmitError('');
    setPhotoError('');
    if (step > 1) setStep((s) => s - 1);
  };

  const handlePublish = async () => {
    if (!itinerary?._id) return;
    if (images.length < MIN_IMAGES) {
      setPhotoError(`Add at least ${MIN_IMAGES} images to continue.`);
      return;
    }
    setSubmitting(true);
    setSubmitError('');
    try {
      const coverUrls = [];
      for (const img of images) {
        if (img.kind === 'remote') {
          coverUrls.push(img.url);
        } else {
          const url = await uploadItineraryImage(img.file);
          coverUrls.push(url);
        }
      }
      await publishItinerary(String(itinerary._id), {
        visibility: itinerary?.published && itinerary?.visibility === 'public'
          ? 'public'
          : 'public',
        title: title.trim(),
        overview: overview.slice(0, MAX_OVERVIEW),
        categories,
        coverImages: coverUrls,
      });
      toast.success(mode === 'edit' ? 'Published itinerary updated!' : 'Itinerary published!');
      clearDraft(String(itinerary?._id || itinerary?.id || '').trim());
      setSuccess(true);
      onPublished?.();
    } catch (e) {
      const rawMsg = String(e?.message || '');
      const permissionDenied = /only the owner or an editor collaborator can publish|not allowed to publish this itinerary/i.test(
        rawMsg,
      );
      const friendlyMsg = permissionDenied
        ? `${PUBLISH_TO_EXPLORE_DISABLED_HINT} If you need access, ask the owner to make you an editor.`
        : rawMsg;
      toast.error(
        permissionDenied
          ? friendlyMsg
          : (mode === 'edit' ? 'Failed to update published itinerary' : 'Failed to publish'),
      );
      setSubmitError(
        friendlyMsg || (mode === 'edit' ? 'Update failed' : 'Publish failed'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !itinerary) return null;

  const isEditMode = mode === 'edit';
  const titleText = success
    ? (isEditMode ? 'Updated' : 'Published')
    : (isEditMode ? 'Edit Published Content' : 'Publish To Community');
  const successText = isEditMode ? 'Your published itinerary is updated.' : 'Your itinerary is live.';
  const successHint = 'You can open its public page anytime to see how it looks.';
  const publishedItineraryId = String(itinerary?._id || itinerary?.id || '').trim();
  const viewItineraryTo = publishedItineraryId ? `/itineraries/${publishedItineraryId}` : '';
  const submitLabel = isEditMode ? 'Save changes' : 'Publish';

  return (
    <div className="publish-modal" role="presentation">
      <button type="button" className="publish-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="publish-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
        <div className="publish-modal__head">
          <h2 id="publish-modal-title" className="publish-modal__title">
            {titleText}
          </h2>
          <button type="button" className="publish-modal__close" onClick={onClose} aria-label="Close">
            <X size={22} />
          </button>
        </div>

        {!success && (
          <nav className="publish-modal__steps" aria-label="Publish steps">
            {PUBLISH_STEPS.map(({ id, label }) => {
              const reachable = id <= farthestStep;
              const isCurrent = step === id;
              const isPast = step > id;
              const isFutureReachable = id > step && id <= farthestStep;
              return (
                <button
                  key={id}
                  type="button"
                  className={[
                    'publish-modal__step',
                    isCurrent ? 'publish-modal__step--current' : '',
                    isPast ? 'publish-modal__step--past' : '',
                    isFutureReachable ? 'publish-modal__step--future' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => goToStep(id)}
                  disabled={!reachable}
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${id}. ${label}${!reachable ? ' (complete previous steps first)' : ''}`}
                >
                  <span className="publish-modal__step-inner" aria-hidden>
                    <span className="publish-modal__step-num">{id}</span>
                    <span className="publish-modal__step-sep">·</span>
                    <span className="publish-modal__step-label">{label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {success ? (
          <div className="publish-modal__success">
            <div className="publish-modal__success-icon" aria-hidden>
              <Check size={40} strokeWidth={3} />
            </div>
            <p className="publish-modal__success-text">{successText}</p>
            <p className="publish-modal__success-hint">{successHint}</p>
            <div className="publish-modal__success-actions">
              {viewItineraryTo ? (
                <Link
                  to={viewItineraryTo}
                  className="publish-modal__btn publish-modal__btn--primary"
                  onClick={onClose}
                >
                  View itinerary
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="publish-modal__body">
                <label className="publish-modal__label" htmlFor="pub-title">Title</label>
                <input
                  id="pub-title"
                  className="publish-modal__input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={200}
                />
                <label className="publish-modal__label" htmlFor="pub-overview">Overview</label>
                <textarea
                  id="pub-overview"
                  className="publish-modal__textarea"
                  rows={6}
                  value={overview}
                  onChange={(e) => setOverview(e.target.value.slice(0, MAX_OVERVIEW))}
                  maxLength={MAX_OVERVIEW}
                />
                <p className="publish-modal__hint">{overview.length} / {MAX_OVERVIEW}</p>
                <p className="publish-modal__label">Categories</p>
                <div className="publish-modal__chips">
                  {PUBLISH_CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`publish-modal__chip ${categories.includes(cat) ? 'publish-modal__chip--active' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="publish-modal__body">
                <p className="publish-modal__lead">
                  Add {MIN_IMAGES}–{MAX_IMAGES} photos (max 5MB each). First image is the cover.
                </p>
                <div
                  className="publish-modal__drop"
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
                  role="button"
                  tabIndex={0}
                >
                  <ImagePlus size={32} aria-hidden />
                  <span>Drag & drop images here, or click to browse</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="publish-modal__file-input"
                  accept="image/svg+xml,image/png,image/jpeg,image/webp,image/gif"
                  multiple
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                {photoError && (
                  <p className="publish-modal__error" role="alert">{photoError}</p>
                )}
                <div className="publish-modal__grid">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`publish-modal__tile${openKebab === img.id ? ' publish-modal__tile--menu-open' : ''}`}
                    >
                      <div className="publish-modal__tile-img-wrap">
                        <div className="publish-modal__tile-img-crop">
                          <img
                            src={img.kind === 'remote' ? resolveImageUrl(img.url, title || itinerary?.title || 'Itinerary', 'itinerary') : img.preview}
                            alt=""
                            className="publish-modal__tile-img"
                          />
                          {idx === 0 && (
                            <span className="publish-modal__cover-badge">Cover image</span>
                          )}
                        </div>
                        <div className="publish-modal__tile-menu" data-stop-card-nav>
                          <button
                            type="button"
                            className="publish-modal__kebab"
                            aria-label="Image options"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenKebab((k) => (k === img.id ? null : img.id));
                            }}
                          >
                            <MoreVertical size={18} />
                          </button>
                          {openKebab === img.id && (
                            <ul
                              className={`publish-modal__menu${idx === 0 ? ' publish-modal__menu--flip' : ''}`}
                              role="menu"
                            >
                              <li>
                                <button type="button" role="menuitem" onClick={() => setAsThumbnail(img.id)}>
                                  Set as thumbnail
                                </button>
                              </li>
                              <li>
                                <button type="button" role="menuitem" onClick={() => removeImage(img.id)}>
                                  Remove
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="publish-modal__footer">
              {step > 1 && (
                <button type="button" className="publish-modal__btn publish-modal__btn--ghost" onClick={goBack}>
                  Back
                </button>
              )}
              <div className="publish-modal__footer-spacer" />
              {step < 2 ? (
                <button type="button" className="publish-modal__btn publish-modal__btn--primary" onClick={goNext}>
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  className="publish-modal__btn publish-modal__btn--primary"
                  onClick={handlePublish}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="publish-modal__spin" size={18} aria-hidden />
                      {isEditMode ? 'Saving…' : 'Publishing…'}
                    </>
                  ) : (
                    submitLabel
                  )}
                </button>
              )}
            </div>
            {step === 1 && submitError && (
              <p className="publish-modal__error publish-modal__error--footer" role="alert">{submitError}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
