import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Copy, User } from 'lucide-react';
import { fetchDiscoveryData } from '../api/discoveryApi';
import { fetchItineraryEngagement, recordItineraryView } from '../api/itineraryEngagementApi';
import { createTrip } from '../api/tripsApi';
import TripMap from './TripMap';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import './PublicItineraryDetailsPage.css';

function isoDate(d) {
  return new Date(d).toISOString().slice(0, 10);
}

function addDays(dateIso, delta) {
  const d = new Date(`${dateIso}T00:00:00`);
  d.setDate(d.getDate() + delta);
  return isoDate(d);
}

function formatTripDates(startIso, endIso) {
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const s = new Date(`${startIso}T00:00:00`);
  const e = new Date(`${endIso}T00:00:00`);
  return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

function deriveNumDays(itinerary) {
  const fromDuration = parseInt(itinerary?.duration, 10);
  if (Number.isFinite(fromDuration) && fromDuration > 0) return fromDuration;
  const maxDay = Math.max(
    1,
    ...(Array.isArray(itinerary?.places) ? itinerary.places.map((p) => Number(p?.dayNum || 1) || 1) : [1]),
  );
  return maxDay;
}

function getAllImages(itinerary) {
  const images = [];
  if (itinerary?.image) images.push(itinerary.image);
  const placeImages = Array.isArray(itinerary?.places)
    ? itinerary.places.map((p) => p?.image).filter(Boolean)
    : [];
  images.push(...placeImages);
  return [...new Set(images)].slice(0, 12);
}

function deriveDestinationFromId(itineraryId) {
  const raw = String(itineraryId || '').trim();
  if (!raw) return '';
  if (!raw.startsWith('community-')) return '';
  const withoutPrefix = raw.slice('community-'.length);
  const lastDash = withoutPrefix.lastIndexOf('-');
  if (lastDash <= 0) return withoutPrefix.replace(/-/g, ' ');
  const slug = withoutPrefix.slice(0, lastDash);
  return slug.replace(/-/g, ' ');
}

export default function PublicItineraryDetailsPage({ user, onLogout }) {
  const { itineraryId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const destinationFromState = location?.state?.destination || '';
  const destinationFromId = useMemo(() => deriveDestinationFromId(itineraryId), [itineraryId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [itinerary, setItinerary] = useState(null);
  const [engagement, setEngagement] = useState({ views: 0, commentsCount: 0 });

  const destination = useMemo(() => {
    return (
      itinerary?.destination
      || destinationFromState
      || destinationFromId
      || ''
    );
  }, [itinerary?.destination, destinationFromState, destinationFromId]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!itineraryId) return;
      if (!destination) {
        setError('Missing destination for this itinerary.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const data = await fetchDiscoveryData(destination, 24);
        if (cancelled) return;
        const list = Array.isArray(data?.communityItineraries) ? data.communityItineraries : [];
        const found = list.find((it) => String(it.id) === String(itineraryId)) || null;
        if (!found) {
          setItinerary(null);
          setError('Itinerary not found.');
          setLoading(false);
          return;
        }
        setItinerary(found);
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || 'Failed to load itinerary');
        setItinerary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [itineraryId, destination]);

  useEffect(() => {
    let cancelled = false;
    async function loadEngagement() {
      if (!itineraryId) return;
      try {
        const data = await fetchItineraryEngagement(itineraryId);
        if (!cancelled) setEngagement({ views: Number(data?.views || 0), commentsCount: Number(data?.commentsCount || 0) });
      } catch {
        // ignore
      }
    }
    loadEngagement();
    return () => {
      cancelled = true;
    };
  }, [itineraryId]);

  useEffect(() => {
    let cancelled = false;
    async function bumpView() {
      if (!itineraryId) return;
      try {
        const data = await recordItineraryView(itineraryId, destination);
        if (!cancelled && data?.views != null) {
          setEngagement((prev) => ({ ...prev, views: Number(data.views || 0) }));
        }
      } catch {
        // ignore
      }
    }
    if (destination) bumpView();
    return () => {
      cancelled = true;
    };
  }, [itineraryId, destination]);

  const images = useMemo(() => getAllImages(itinerary), [itinerary]);

  const mapCenter = useMemo(() => {
    const first = Array.isArray(itinerary?.places) ? itinerary.places.find((p) => p?.lat != null && p?.lng != null) : null;
    return first ? [first.lat, first.lng] : [47.6062, -122.3321];
  }, [itinerary]);

  const mapMarkers = useMemo(() => {
    return (Array.isArray(itinerary?.places) ? itinerary.places : [])
      .filter((p) => p?.lat != null && p?.lng != null)
      .map((p, idx) => ({
        id: p.id || p.placeId || `it-${idx}`,
        markerType: 'trip',
        name: p.name,
        lat: p.lat,
        lng: p.lng,
        dayNum: Number(p.dayNum || 1) || 1,
        address: p.address || destination,
        image: resolveImageUrl(p.image, p.name, 'landmark'),
        rating: p.rating,
        reviewCount: p.reviewCount,
        overview: p.overview || '',
        website: p.website || '',
      }));
  }, [itinerary, destination]);

  const handleCopyLink = async () => {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = link;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
  };

  const handleCustomiseTrip = () => {
    if (!itinerary) return;

    const days = deriveNumDays(itinerary);
    const startDate = isoDate(new Date());
    const endDate = addDays(startDate, days - 1);
    const dayToDate = new Map();
    for (let d = 1; d <= days; d += 1) {
      dayToDate.set(d, addDays(startDate, d - 1));
    }

    const places = Array.isArray(itinerary.places) ? itinerary.places : [];
    const tripExpenseItems = places.map((p, idx) => {
      const dayNum = Number(p?.dayNum || 1) || 1;
      const date = dayToDate.get(dayNum) || startDate;
      const durationHrs = Number(p?.durationHrs || 1) || 1;

      return {
        id: `place-${p?.id || p?.placeId || idx}-${Date.now()}-${idx}`,
        name: p?.name || 'Place',
        total: 0,
        categoryId: 'places',
        category: 'Places',
        date,
        detail: p?.address || p?.name || destination,
        lat: p?.lat,
        lng: p?.lng,
        notes: p?.note || '',
        attachments: [],
        startTime: '09:00',
        durationHrs,
        durationMins: 0,
        externalLink: p?.website || '',
        placeImageUrl: resolveImageUrl(p?.image, p?.name, 'landmark'),
        rating: p?.rating,
        reviewCount: p?.reviewCount,
      };
    });

    const trip = {
      title: `Trip to ${destination || itinerary.title || 'Custom trip'}`,
      destination: destination || '',
      dates: formatTripDates(startDate, endDate),
      startDate,
      endDate,
      locations: destination || '',
      placesSaved: tripExpenseItems.length,
      budget: '$0',
      budgetSpent: 0,
      travelers: 1,
      status: 'Planning',
      statusClass: 'trip-card__status--planning',
      image: resolveImageUrl(itinerary.image, itinerary.title, 'itinerary'),
      tripExpenseItems,
      sourceItineraryId: itinerary.id,
    };

    createTrip(trip)
      .then((res) => {
        const id = res?.trip?._id || res?.trip?.id;
        if (id) navigate(`/trip/${id}`);
      })
      .catch(() => {
        // ignore for now; could surface toast
      });
  };

  if (loading) {
    return (
      <div className="public-itinerary">
        <header className="public-itinerary__header">
          <Link to="/search" className="public-itinerary__back">← Explore</Link>
        </header>
        <main className="public-itinerary__main">
          <p className="public-itinerary__empty">Loading itinerary…</p>
        </main>
      </div>
    );
  }

  if (error || !itinerary) {
    return (
      <div className="public-itinerary">
        <header className="public-itinerary__header">
          <Link to="/search" className="public-itinerary__back">← Explore</Link>
        </header>
        <main className="public-itinerary__main">
          <p className="public-itinerary__empty">{error || 'Itinerary not found.'}</p>
        </main>
      </div>
    );
  }

  return (
    <div className="public-itinerary">
      <header className="public-itinerary__header">
        <Link to="/search" className="public-itinerary__back">← Explore</Link>
        <div className="public-itinerary__header-actions">
          <button type="button" className="public-itinerary__btn" onClick={handleCopyLink}>
            <Copy size={16} aria-hidden /> Copy link
          </button>
          <button type="button" className="public-itinerary__btn public-itinerary__btn--taupe" onClick={handleCustomiseTrip}>
            Customise trip
          </button>
          <div className="public-itinerary__user">
            <span className="public-itinerary__user-avatar"><User size={16} aria-hidden /></span>
            <span className="public-itinerary__user-name">{user?.name || 'You'}</span>
          </div>
        </div>
      </header>

      <main className="public-itinerary__main">
        <h1 className="public-itinerary__title">{itinerary.title}</h1>

        <div className="public-itinerary__meta">
          <span>Posted {itinerary.publishedAt ? new Date(itinerary.publishedAt).toLocaleDateString() : 'Recently'}</span>
          <span>•</span>
          <span>{engagement.views.toLocaleString()} views</span>
          <span>•</span>
          <span>{engagement.commentsCount.toLocaleString()} comments</span>
        </div>

        <section className="public-itinerary__collage" aria-label="Photos">
          <div className="public-itinerary__collage-grid">
            {images.slice(0, 5).map((src) => (
              <img
                key={src}
                src={resolveImageUrl(src, itinerary.title, 'itinerary')}
                alt=""
                className="public-itinerary__collage-img"
                onError={(e) => applyImageFallback(e)}
              />
            ))}
          </div>
        </section>

        <section className="public-itinerary__section">
          <h2 className="public-itinerary__section-title">Map</h2>
          <TripMap center={mapCenter} markers={mapMarkers} popupMode="basic" fitBounds resizeKey={`it-${itinerary.id}`} />
        </section>

        <section className="public-itinerary__section">
          <h2 className="public-itinerary__section-title">Itinerary</h2>
          <div className="public-itinerary__places">
            {(Array.isArray(itinerary.places) ? itinerary.places : []).map((p, idx) => (
              <article key={p.id || `${p.name}-${idx}`} className="public-itinerary__place">
                <img
                  src={resolveImageUrl(p.image, p.name, 'landmark')}
                  alt=""
                  className="public-itinerary__place-img"
                  onError={(e) => applyImageFallback(e)}
                />
                <div className="public-itinerary__place-body">
                  <div className="public-itinerary__place-top">
                    <strong className="public-itinerary__place-name">{p.name}</strong>
                    <span className="public-itinerary__place-day">Day {p.dayNum || 1}</span>
                  </div>
                  {p.address && <p className="public-itinerary__place-address">{p.address}</p>}
                  {p.note && <p className="public-itinerary__place-note">{p.note}</p>}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

