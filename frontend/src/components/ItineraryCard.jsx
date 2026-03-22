import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Eye, User, MoreVertical } from 'lucide-react';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import { formatViewCount } from '../lib/formatViewCount';
import './ItineraryCard.css';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string[]} [props.coverImages]
 * @param {number} props.views
 * @param {string} props.durationLabel e.g. "2 days"
 * @param {number} props.placesCount
 * @param {string} props.creatorName
 * @param {string|null} [props.creatorAvatar]
 * @param {string} [props.itineraryId] — navigates to detail when card is clicked (carousel buttons excluded)
 * @param {boolean} [props.ownerMenu] — show kebab with Share / Publish / Duplicate / Delete
 * @param {function(string): void} [props.onOwnerMenu]
 */
export default function ItineraryCard({
  title,
  coverImages = [],
  views,
  durationLabel,
  placesCount,
  creatorName,
  creatorAvatar,
  itineraryId,
  ownerMenu = false,
  onOwnerMenu,
}) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function close(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);
  const slides = useMemo(() => {
    const list = Array.isArray(coverImages) ? coverImages.filter(Boolean) : [];
    return list.length > 0 ? list : [''];
  }, [coverImages]);

  const [index, setIndex] = useState(0);
  const len = slides.length;
  const safeIndex = ((index % len) + len) % len;
  const currentSrc = slides[safeIndex];

  const go = (delta) => {
    setIndex((i) => {
      const next = i + delta;
      return ((next % len) + len) % len;
    });
  };

  const handleCardNav = (e) => {
    if (!itineraryId) return;
    if (e.target.closest('button')) return;
    if (e.target.closest('[data-stop-card-nav]')) return;
    navigate(`/itineraries/${encodeURIComponent(itineraryId)}`);
  };

  const onCardKeyDown = (e) => {
    if (!itineraryId) return;
    if (e.key === 'Enter' || e.key === ' ') {
      if (e.target.closest('button')) return;
      if (e.target.closest('[data-stop-card-nav]')) return;
      e.preventDefault();
      navigate(`/itineraries/${encodeURIComponent(itineraryId)}`);
    }
  };

  return (
    <article
      className={`itinerary-card ${itineraryId ? 'itinerary-card--clickable' : ''}`}
      onClick={handleCardNav}
      onKeyDown={onCardKeyDown}
      role={itineraryId ? 'link' : undefined}
      tabIndex={itineraryId ? 0 : undefined}
      aria-label={itineraryId ? `Open itinerary: ${title}` : undefined}
    >
      <div className="itinerary-card__media">
        {ownerMenu && (
          <div className="itinerary-card__owner-wrap" data-stop-card-nav ref={menuRef}>
            <button
              type="button"
              className="itinerary-card__kebab"
              aria-label="Itinerary options"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((o) => !o);
              }}
            >
              <MoreVertical size={18} aria-hidden />
            </button>
            {menuOpen && (
              <ul className="itinerary-card__owner-menu" role="menu">
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onOwnerMenu?.('share');
                    }}
                  >
                    Share
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onOwnerMenu?.('publish');
                    }}
                  >
                    Publish
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onOwnerMenu?.('duplicate');
                    }}
                  >
                    Duplicate
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="itinerary-card__owner-menu--danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onOwnerMenu?.('delete');
                    }}
                  >
                    Delete
                  </button>
                </li>
              </ul>
            )}
          </div>
        )}
        <div className="itinerary-card__carousel">
          {len > 1 && (
            <button
              type="button"
              className="itinerary-card__nav itinerary-card__nav--prev"
              aria-label="Previous photo"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
            >
              <ChevronLeft size={20} aria-hidden />
            </button>
          )}
          <div className="itinerary-card__slide">
            <img
              key={safeIndex}
              src={resolveImageUrl(currentSrc, title, 'itinerary')}
              alt=""
              className="itinerary-card__img"
              data-image-hint={title || ''}
              data-image-topic="itinerary"
              onError={(e) => applyImageFallback(e)}
            />
          </div>
          {len > 1 && (
            <button
              type="button"
              className="itinerary-card__nav itinerary-card__nav--next"
              aria-label="Next photo"
              onClick={(e) => { e.stopPropagation(); go(1); }}
            >
              <ChevronRight size={20} aria-hidden />
            </button>
          )}
        </div>

        <div className="itinerary-card__views" aria-label="Views">
          <Eye size={16} aria-hidden />
          <span>{formatViewCount(views)}</span>
        </div>

        {len > 1 && (
          <div className="itinerary-card__dots" role="tablist" aria-label="Photos">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                className={`itinerary-card__dot ${i === safeIndex ? 'itinerary-card__dot--active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIndex(i); }}
                aria-label={`Photo ${i + 1} of ${len}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="itinerary-card__body">
        <h3 className="itinerary-card__title">{title}</h3>
        <div className="itinerary-card__pills">
          <span className="itinerary-card__pill">{durationLabel}</span>
          <span className="itinerary-card__pill">
            {placesCount} {placesCount === 1 ? 'place' : 'places'}
          </span>
        </div>
        <div className="itinerary-card__creator">
          <span className="itinerary-card__avatar">
            {creatorAvatar ? (
              <img
                src={resolveImageUrl(creatorAvatar, creatorName, 'avatar')}
                alt=""
                className="itinerary-card__avatar-img"
                onError={(e) => applyImageFallback(e)}
              />
            ) : (
              <User size={14} aria-hidden />
            )}
          </span>
          <span className="itinerary-card__creator-name">{creatorName}</span>
        </div>
      </div>
    </article>
  );
}
