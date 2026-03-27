import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { X, Check, Loader2, ImagePlus, MoreVertical } from 'lucide-react';
import { publishItinerary, uploadItineraryImage } from '../../api/itinerariesApi';
import { PUBLISH_CATEGORY_OPTIONS } from '../../data/communitySearchConstants';
import './PublishItineraryModal.css';

export { PUBLISH_CATEGORY_OPTIONS };

const MAX_OVERVIEW = 1000;
const MIN_IMAGES = 3;
const MAX_IMAGES = 15;
const MAX_BYTES = 5 * 1024 * 1024;

const PUBLISH_STEPS = [
  { id: 1, label: 'Details' },
  { id: 2, label: 'Photos' },
  { id: 3, label: 'Visibility' },
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

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {object} props.itinerary — raw itinerary from API (must include _id)
 * @param {function} [props.onPublished]
 */
export default function PublishItineraryModal({ open, onClose, itinerary, onPublished }) {
  const [step, setStep] = useState(1);
  const [success, setSuccess] = useState(false);
  const [title, setTitle] = useState('');
  const [overview, setOverview] = useState('');
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [visibility, setVisibility] = useState('private');
  const [photoError, setPhotoError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [openKebab, setOpenKebab] = useState(null);
  /** Highest step the user has reached via Next (breadcrumbs can only go to steps ≤ this). */
  const [farthestStep, setFarthestStep] = useState(1);
  const fileInputRef = useRef(null);
  const revokeUrls = useRef([]);

  const resetFromItinerary = useCallback(() => {
    if (!itinerary) return;
    setStep(1);
    setFarthestStep(1);
    setSuccess(false);
    setTitle(String(itinerary.title || '').trim());
    setOverview(String(itinerary.overview || '').slice(0, MAX_OVERVIEW));
    setCategories(Array.isArray(itinerary.categories) ? [...itinerary.categories] : []);
    setVisibility('private');
    setPhotoError('');
    setSubmitError('');
    revokeUrls.current.forEach((u) => URL.revokeObjectURL(u));
    revokeUrls.current = [];
    const existing = Array.isArray(itinerary.coverImages)
      ? itinerary.coverImages.filter(Boolean).map((url) => ({
          id: newId(),
          kind: 'remote',
          url: String(url),
        }))
      : [];
    setImages(existing);
  }, [itinerary]);

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
      setFarthestStep((f) => Math.max(f, 3));
      setStep(3);
    }
  };

  const goToStep = (n) => {
    if (n < 1 || n > 3 || n > farthestStep) return;
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
        visibility,
        title: title.trim(),
        overview: overview.slice(0, MAX_OVERVIEW),
        categories,
        coverImages: coverUrls,
      });
      toast.success('Itinerary published!');
      setSuccess(true);
      onPublished?.();
    } catch (e) {
      toast.error('Failed to publish');
      setSubmitError(e?.message || 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open || !itinerary) return null;

  return (
    <div className="publish-modal" role="presentation">
      <button type="button" className="publish-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="publish-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="publish-modal-title">
        <div className="publish-modal__head">
          <h2 id="publish-modal-title" className="publish-modal__title">
            {success ? 'Published' : 'Publish itinerary'}
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
            <p className="publish-modal__success-text">Your itinerary is live.</p>
            <button type="button" className="publish-modal__btn publish-modal__btn--primary" onClick={onClose}>
              Done
            </button>
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
                            src={img.kind === 'remote' ? img.url : img.preview}
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

            {step === 3 && (
              <div className="publish-modal__body">
                <p className="publish-modal__label">Who can see this itinerary?</p>
                <label className="publish-modal__radio">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                  />
                  <span>Private — only you</span>
                </label>
                <label className="publish-modal__radio">
                  <input
                    type="radio"
                    name="vis"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                  />
                  <span>Public — anyone on Explore</span>
                </label>
                {submitError && <p className="publish-modal__error" role="alert">{submitError}</p>}
              </div>
            )}

            <div className="publish-modal__footer">
              {step > 1 && (
                <button type="button" className="publish-modal__btn publish-modal__btn--ghost" onClick={goBack}>
                  Back
                </button>
              )}
              <div className="publish-modal__footer-spacer" />
              {step < 3 ? (
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
                      Publishing…
                    </>
                  ) : (
                    'Publish'
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
