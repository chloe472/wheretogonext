import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  Share2,
  Eye,
  MessageCircle,
  Heart,
  Plus,
  ChevronDown,
  ChevronRight,
  X,
  User,
  Send,
  Reply,
} from 'lucide-react';
import {
  fetchItineraryById,
  fetchItineraryComments,
  postItineraryComment,
  toggleCommentLike,
  fetchPublicItineraries,
  mapItineraryToCard,
} from '../api/itinerariesApi';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import { formatViewCount } from '../lib/formatViewCount';
import ItineraryPlacesMap from './ItineraryPlacesMap';
import ItineraryCard from './ItineraryCard';
import DashboardHeader from './DashboardHeader';
import './ItineraryDetailPage.css';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'map', label: 'Map' },
  { id: 'itinerary', label: 'Itinerary' },
  { id: 'comments', label: 'Comments' },
];

const OVERVIEW_PREVIEW = 320;

function formatPublished(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '—';
  }
}

function buildCommentTree(flat) {
  const map = new Map();
  flat.forEach((c) => map.set(c.id, { ...c, children: [] }));
  const roots = [];
  flat.forEach((c) => {
    const node = map.get(c.id);
    if (c.parentId && map.has(c.parentId)) {
      map.get(c.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

/** First grapheme of display name for avatar fallback */
function commentAuthorInitial(displayName) {
  const s = String(displayName || '').trim();
  if (!s) return '?';
  const chars = [...s];
  return chars[0] ? chars[0].toUpperCase() : '?';
}

function CommentAvatar({ userName, userPicture, userId, nested }) {
  const [imgFailed, setImgFailed] = useState(false);
  const pic = String(userPicture || '').trim();

  useEffect(() => {
    setImgFailed(false);
  }, [pic]);

  const initial = commentAuthorInitial(userName);
  const showImg = Boolean(pic) && !imgFailed;

  const avatarClass = `itinerary-detail__comment-avatar ${nested ? 'itinerary-detail__comment-avatar--nested' : ''}`;
  if (userId) {
    return (
      <Link to={`/profile/${userId}`} className={avatarClass} aria-label={`View ${userName || 'user'} profile`}>
        {showImg ? (
          <img
            src={resolveImageUrl(pic, userName, 'avatar')}
            alt=""
            className="itinerary-detail__comment-avatar-img"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="itinerary-detail__comment-avatar-fallback">{initial}</span>
        )}
      </Link>
    );
  }
  return (
    <span className={avatarClass} aria-hidden>
      {showImg ? (
        <img
          src={resolveImageUrl(pic, userName, 'avatar')}
          alt=""
          className="itinerary-detail__comment-avatar-img"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="itinerary-detail__comment-avatar-fallback">{initial}</span>
      )}
    </span>
  );
}

function CommentBranch({
  node,
  itineraryId,
  user,
  depth,
  onLike,
  onReply,
  likingId,
}) {
  const [openReply, setOpenReply] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const submitReply = async () => {
    const t = replyText.trim();
    if (!t || !user) return;
    setSending(true);
    try {
      await postItineraryComment(itineraryId, t, node.id);
      setReplyText('');
      setOpenReply(false);
      onReply();
    } catch (e) {
      alert(e.message || 'Failed to reply');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={`itinerary-detail__comment ${depth > 0 ? 'itinerary-detail__comment--nested' : ''}`}>
      <div className="itinerary-detail__comment-head">
        <CommentAvatar
          userName={node.userName}
          userPicture={node.userPicture}
          userId={node.userId}
          nested={depth > 0}
        />
        <div className="itinerary-detail__comment-head-main">
          <span className="itinerary-detail__comment-author">{node.userName || 'User'}</span>
          <span className="itinerary-detail__comment-date">
            {node.createdAt ? formatPublished(node.createdAt) : ''}
          </span>
        </div>
      </div>
      <p className="itinerary-detail__comment-body">{node.body}</p>
      <div className="itinerary-detail__comment-actions">
        <button
          type="button"
          className={`itinerary-detail__comment-like ${node.likedByMe ? 'itinerary-detail__comment-like--on' : ''}`}
          onClick={() => onLike(node.id)}
          disabled={!user || likingId === node.id}
          aria-pressed={node.likedByMe}
        >
          <Heart size={16} aria-hidden fill={node.likedByMe ? 'currentColor' : 'none'} />
          <span>{node.likeCount ?? 0}</span>
        </button>
        {user && (
          <button type="button" className="itinerary-detail__comment-reply-btn" onClick={() => setOpenReply((o) => !o)}>
            <Reply size={16} aria-hidden />
            Reply
          </button>
        )}
      </div>
      {openReply && user && (
        <div className="itinerary-detail__reply-box">
          <textarea
            className="itinerary-detail__textarea itinerary-detail__textarea--small"
            rows={2}
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button
            type="button"
            className="itinerary-detail__btn itinerary-detail__btn--small"
            disabled={sending || !replyText.trim()}
            onClick={submitReply}
          >
            Post reply
          </button>
        </div>
      )}
      {node.children?.length > 0 && (
        <div className="itinerary-detail__comment-children">
          {node.children.map((ch) => (
            <CommentBranch
              key={ch.id}
              node={ch}
              itineraryId={itineraryId}
              user={user}
              depth={depth + 1}
              onLike={onLike}
              onReply={onReply}
              likingId={likingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ItineraryDetailPage({ user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState(null);
  const [comments, setComments] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewExpanded, setOverviewExpanded] = useState(false);
  const [photosOpen, setPhotosOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [likingId, setLikingId] = useState(null);
  const [shareDone, setShareDone] = useState(false);

  const loadComments = useCallback(async () => {
    if (!id) return;
    const list = await fetchItineraryComments(id);
    setComments(list);
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();
    async function run() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const data = await fetchItineraryById(id, ac.signal);
        if (cancelled) return;
        setItinerary(data);
      } catch (e) {
        if (e.name === 'AbortError') return;
        setError(e.message || 'Failed to load');
        setItinerary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [id]);

  useEffect(() => {
    if (!itinerary?._id) return;
    let cancelled = false;
    (async () => {
      try {
        await loadComments();
      } catch {
        if (!cancelled) setComments([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itinerary?._id, loadComments]);

  useEffect(() => {
    if (!itinerary?.categories?.length) {
      setSimilar([]);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      try {
        const cats = itinerary.categories.slice(0, 4).join(',');
        const rows = await fetchPublicItineraries(
          {
            sort: 'most-popular',
            categories: cats,
            exclude: String(itinerary._id),
            limit: 4,
          },
          ac.signal
        );
        if (cancelled) return;
        setSimilar(rows.map(mapItineraryToCard));
      } catch {
        if (!cancelled) setSimilar([]);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [itinerary?._id, itinerary?.categories]);

  const places = itinerary?.places || [];
  const coverImages = useMemo(
    () => (Array.isArray(itinerary?.coverImages) ? itinerary.coverImages.filter(Boolean) : []),
    [itinerary]
  );

  const daysGrouped = useMemo(() => {
    const map = {};
    places.forEach((p, idx) => {
      const d = Math.max(1, Number(p.dayNumber) || 1);
      if (!map[d]) map[d] = [];
      map[d].push({ ...p, _idx: idx });
    });
    return Object.keys(map)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => ({ day: Number(k), stops: map[k] }));
  }, [places]);

  const daysWithNumbers = useMemo(() => {
    let n = 0;
    return daysGrouped.map((d) => ({
      day: d.day,
      stops: d.stops.map((s) => ({ ...s, _num: ++n })),
    }));
  }, [daysGrouped]);

  const [openDays, setOpenDays] = useState(() => new Set());
  useEffect(() => {
    if (daysGrouped.length) {
      setOpenDays(new Set(daysGrouped.map((d) => d.day)));
    }
  }, [daysGrouped]);

  const toggleDay = (day) => {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) next.delete(day);
      else next.add(day);
      return next;
    });
  };

  const overviewText = itinerary?.overview || '';
  const displayOverview =
    overviewText.length <= OVERVIEW_PREVIEW || overviewExpanded
      ? overviewText
      : `${overviewText.slice(0, OVERVIEW_PREVIEW)}…`;

  const commentTree = useMemo(() => buildCommentTree(comments), [comments]);

  const handleShare = async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(url);
      setShareDone(true);
      setTimeout(() => setShareDone(false), 2000);
    } catch {
      setShareDone(false);
    }
  };

  const handlePostComment = async () => {
    const t = newComment.trim();
    if (!t || !user || !id) return;
    setPosting(true);
    try {
      await postItineraryComment(id, t);
      setNewComment('');
      await loadComments();
      setItinerary((prev) =>
        prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev
      );
    } catch (e) {
      alert(e.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (commentId) => {
    if (!user || !id) {
      alert('Log in to like comments');
      return;
    }
    setLikingId(commentId);
    try {
      const { likeCount, likedByMe } = await toggleCommentLike(id, commentId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, likeCount, likedByMe } : c
        )
      );
    } catch (e) {
      alert(e.message || 'Failed');
    } finally {
      setLikingId(null);
    }
  };

  if (loading) {
    return (
      <div className="itinerary-detail">
        <DashboardHeader user={user} onLogout={onLogout} activeNav="explore" />
        <div className="itinerary-detail--center">
          <p>Loading itinerary…</p>
        </div>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="itinerary-detail">
        <DashboardHeader user={user} onLogout={onLogout} activeNav="explore" />
        <div className="itinerary-detail--center">
          <p>{error || 'Itinerary not found.'}</p>
          <Link to="/search">Back to Explore</Link>
        </div>
      </div>
    );
  }

  const published = itinerary.publishedAt || itinerary.createdAt;
  const tags = Array.isArray(itinerary.categories) ? itinerary.categories : [];
  const views = Number(itinerary.viewCount) || 0;
  const commentCount = Number(itinerary.commentCount) || comments.length;

  return (
    <div className="itinerary-detail">
      <DashboardHeader user={user} onLogout={onLogout} activeNav="explore" />

      <div className="itinerary-detail__layout">
        <main className="itinerary-detail__main">
          <section className="itinerary-detail__hero">
            <h1 className="itinerary-detail__title">{itinerary.title}</h1>
            <div className="itinerary-detail__meta-row">
              <span className="itinerary-detail__meta">Published {formatPublished(published)}</span>
              <span className="itinerary-detail__meta itinerary-detail__meta--icon">
                <Eye size={16} aria-hidden /> {formatViewCount(views)}
              </span>
              <span className="itinerary-detail__meta itinerary-detail__meta--icon">
                <MessageCircle size={16} aria-hidden /> {commentCount}
              </span>
              <button type="button" className="itinerary-detail__share" onClick={handleShare}>
                <Share2 size={16} aria-hidden />
                {shareDone ? 'Copied!' : 'Share'}
              </button>
            </div>
            {tags.length > 0 && (
              <div className="itinerary-detail__tags">
                {tags.map((t) => (
                  <span key={t} className="itinerary-detail__tag">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {coverImages.length > 0 && (
              <div className="itinerary-detail__photo-grid">
                <div className="itinerary-detail__photo-main">
                  <img
                    src={resolveImageUrl(coverImages[0], itinerary.title, 'itinerary')}
                    alt=""
                    onError={(e) => applyImageFallback(e)}
                  />
                </div>
                {coverImages.length > 1 && (
                  <div className="itinerary-detail__photo-stack">
                    {coverImages.slice(1, 3).map((src, i) => (
                      <div key={i} className="itinerary-detail__photo-stack-item">
                        <img
                          src={resolveImageUrl(src, itinerary.title, 'itinerary')}
                          alt=""
                          onError={(e) => applyImageFallback(e)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {coverImages.length > 0 && (
              <button type="button" className="itinerary-detail__see-photos" onClick={() => setPhotosOpen(true)}>
                See all photos ({coverImages.length})
              </button>
            )}
          </section>

          <div className="itinerary-detail__tabs" role="tablist" aria-label="Itinerary sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`itinerary-detail__tab ${activeTab === tab.id ? 'itinerary-detail__tab--active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="itinerary-detail__tab-panels">
            {activeTab === 'overview' && (
              <section className="itinerary-detail__panel" aria-labelledby="tab-overview">
                <div className="itinerary-detail__overview">
                  {overviewText ? (
                    <>
                      <p className="itinerary-detail__overview-text">{displayOverview}</p>
                      {overviewText.length > OVERVIEW_PREVIEW && (
                        <button
                          type="button"
                          className="itinerary-detail__read-more"
                          onClick={() => setOverviewExpanded((e) => !e)}
                        >
                          {overviewExpanded ? 'Read less' : 'Read more'}
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="itinerary-detail__muted">No overview yet.</p>
                  )}
                </div>
                <h3 className="itinerary-detail__h3">Map</h3>
                <ItineraryPlacesMap places={places} className="itinerary-detail__map-embed" height={300} />
              </section>
            )}

            {activeTab === 'map' && (
              <section className="itinerary-detail__panel">
                <ItineraryPlacesMap places={places} height={420} />
                {places.filter((p) => p.lat != null && p.lng != null).length === 0 && (
                  <p className="itinerary-detail__muted itinerary-detail__map-hint">
                    Places need latitude & longitude to appear on the map. Edit the itinerary to add coordinates.
                  </p>
                )}
              </section>
            )}

            {activeTab === 'itinerary' && (
              <section className="itinerary-detail__panel">
                {daysWithNumbers.length === 0 ? (
                  <p className="itinerary-detail__muted">No stops yet.</p>
                ) : (
                  daysWithNumbers.map(({ day, stops }) => (
                    <div key={day} className="itinerary-detail__day">
                      <button
                        type="button"
                        className="itinerary-detail__day-header"
                        onClick={() => toggleDay(day)}
                        aria-expanded={openDays.has(day)}
                      >
                        {openDays.has(day) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                        <span>Day {day}</span>
                        <span className="itinerary-detail__day-count">{stops.length} stops</span>
                      </button>
                      {openDays.has(day) && (
                        <ul className="itinerary-detail__stops">
                          {stops.map((p) => {
                            const n = p._num;
                            return (
                              <li key={`${day}-${n}-${p.name}`} className="itinerary-detail__stop">
                                <div className="itinerary-detail__stop-badge">{n}</div>
                                <div className="itinerary-detail__stop-body">
                                  <div className="itinerary-detail__stop-top">
                                    <h4 className="itinerary-detail__stop-name">{p.name || 'Place'}</h4>
                                    <div className="itinerary-detail__stop-actions">
                                      <button type="button" className="itinerary-detail__icon-btn" aria-label="Save place">
                                        <Heart size={18} />
                                      </button>
                                      <button type="button" className="itinerary-detail__icon-btn" aria-label="Add to trip">
                                        <Plus size={18} />
                                      </button>
                                    </div>
                                  </div>
                                  {p.category && (
                                    <span className="itinerary-detail__stop-cat">{p.category}</span>
                                  )}
                                  {p.rating != null && (
                                    <p className="itinerary-detail__stop-rating">
                                      ★ {p.rating}
                                      {p.reviewCount != null ? ` (${p.reviewCount} reviews)` : ''}
                                    </p>
                                  )}
                                  {p.address && <p className="itinerary-detail__stop-addr">{p.address}</p>}
                                  {p.timeSlot && (
                                    <p className="itinerary-detail__stop-time">{p.timeSlot}</p>
                                  )}
                                  {p.notes && <p className="itinerary-detail__stop-notes">{p.notes}</p>}
                                  {p.image && (
                                    <img
                                      className="itinerary-detail__stop-thumb"
                                      src={resolveImageUrl(p.image, p.name, 'landmark')}
                                      alt=""
                                      onError={(e) => applyImageFallback(e)}
                                    />
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </section>
            )}

            {activeTab === 'comments' && (
              <section className="itinerary-detail__panel">
                {user ? (
                  <div className="itinerary-detail__composer">
                    <textarea
                      className="itinerary-detail__textarea"
                      rows={3}
                      placeholder="Share your thoughts…"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <button
                      type="button"
                      className="itinerary-detail__btn"
                      disabled={posting || !newComment.trim()}
                      onClick={handlePostComment}
                    >
                      <Send size={16} aria-hidden />
                      Post comment
                    </button>
                  </div>
                ) : (
                  <p className="itinerary-detail__muted">Log in to join the conversation.</p>
                )}
                <div className="itinerary-detail__comments">
                  {commentTree.map((node) => (
                    <CommentBranch
                      key={node.id}
                      node={node}
                      itineraryId={id}
                      user={user}
                      depth={0}
                      onLike={handleLike}
                      onReply={loadComments}
                      likingId={likingId}
                    />
                  ))}
                  {commentTree.length === 0 && (
                    <p className="itinerary-detail__muted">No comments yet. Be the first!</p>
                  )}
                </div>
              </section>
            )}
          </div>

          {similar.length > 0 && (
            <section className="itinerary-detail__similar">
              <h2 className="itinerary-detail__similar-title">See other similar itineraries</h2>
              <div className="itinerary-detail__similar-grid">
                {similar.map((it) => (
                  <ItineraryCard
                    key={it.id}
                    itineraryId={it.id}
                    title={it.title}
                    coverImages={it.coverImages}
                    views={it.views}
                    durationLabel={it.duration}
                    placesCount={it.placesCount}
                    creatorName={it.creator}
                    creatorAvatar={it.creatorAvatar}
                    creatorId={it.creatorId}
                  />
                ))}
              </div>
            </section>
          )}
        </main>

        <aside className="itinerary-detail__sidebar">
          <div className="itinerary-detail__cta">
            <button
              type="button"
              className="itinerary-detail__customize"
              onClick={() => navigate('/new-trip', { state: { fromItineraryId: id } })}
            >
              Customize trip
            </button>
            <p className="itinerary-detail__cta-hint">Start from this plan and make it yours.</p>
          </div>
          <div className="itinerary-detail__creator-card">
            <Link
              to={itinerary.creator?._id ? `/profile/${itinerary.creator._id}` : '#'}
              className="itinerary-detail__creator-avatar"
              aria-label={`View ${itinerary.creator?.name || 'creator'} profile`}
              onClick={(e) => {
                if (!itinerary.creator?._id) e.preventDefault();
              }}
            >
              {itinerary.creator?.picture ? (
                <img
                  src={resolveImageUrl(itinerary.creator.picture, itinerary.creator.name, 'avatar')}
                  alt=""
                  onError={(e) => applyImageFallback(e)}
                />
              ) : (
                <User size={28} />
              )}
            </Link>
            <h3 className="itinerary-detail__creator-name">
              {itinerary.creator?.name || itinerary.creator?.username || 'Creator'}
            </h3>
            {itinerary.destination ? (
              <p className="itinerary-detail__creator-meta">{itinerary.destination}</p>
            ) : null}
          </div>
        </aside>
      </div>

      {photosOpen && (
        <div className="itinerary-detail__modal" role="dialog" aria-modal="true" aria-label="All photos">
          <button type="button" className="itinerary-detail__modal-backdrop" onClick={() => setPhotosOpen(false)} aria-label="Close" />
          <div className="itinerary-detail__modal-content">
            <div className="itinerary-detail__modal-head">
              <h2>Photos</h2>
              <button type="button" className="itinerary-detail__modal-close" onClick={() => setPhotosOpen(false)} aria-label="Close">
                <X size={22} />
              </button>
            </div>
            <div className="itinerary-detail__modal-grid">
              {coverImages.map((src, i) => (
                <img
                  key={i}
                  src={resolveImageUrl(src, itinerary.title, 'itinerary')}
                  alt=""
                  onError={(e) => applyImageFallback(e)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
