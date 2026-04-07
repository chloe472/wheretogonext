import {
  resolveTripCardCoverImage,
  getFlagImageForDestination,
  formatTripCardDateRange,
} from '../../../data/tripDestinationMeta';
import { resolveImageUrl } from '../../../lib/imageFallback';


export function mapItineraryToTripRow(raw) {
  const id = String(raw._id ?? raw.id ?? '');
  const destination = String(raw.destination || '').trim();
  const locations = String(raw.locations || '').trim();
  const image = resolveTripCardCoverImage(raw);
  const dateLabel = formatTripCardDateRange(raw.startDate, raw.endDate, raw.dates);
  const flagImage = getFlagImageForDestination(destination, locations);
  return {
    raw,
    id,
    title: raw.title || '',
    dateLabel,
    image,
    flagImage,
    status: raw.status || 'Planning',
    endDate: raw.endDate || '',
    startDate: raw.startDate || '',
    isSharedWithMe: Boolean(raw?.__sharedWithMe),
    isPublishedToCommunity: Boolean(raw?.published && raw?.visibility === 'public'),
  };
}

export function resolveDashboardTripImage(trip, destinationCover = '') {
  const cover0 = String(trip?.raw?.coverImages?.[0] || '').trim();
  const explicitPrimary = String(trip?.raw?.image || '').trim();
  const primary = String(trip?.image || '').trim();
  if (cover0) {
    const resolvedCover = resolveImageUrl(cover0, trip?.title || 'Trip cover', 'trip');
    if (resolvedCover && !resolvedCover.startsWith('data:image/')) return resolvedCover;
  }
  if (destinationCover) {
    const resolvedDiscovery = resolveImageUrl(destinationCover, trip?.title || 'Trip cover', 'trip');
    if (resolvedDiscovery && !resolvedDiscovery.startsWith('data:image/')) return resolvedDiscovery;
  }
  if (explicitPrimary) {
    const resolvedPrimary = resolveImageUrl(explicitPrimary, trip?.title || 'Trip cover', 'trip');
    if (resolvedPrimary && !resolvedPrimary.startsWith('data:image/')) return resolvedPrimary;
  }
  if (primary) {
    const resolvedPrimary = resolveImageUrl(primary, trip?.title || 'Trip cover', 'trip');
    if (resolvedPrimary && !resolvedPrimary.startsWith('data:image/')) return resolvedPrimary;
  }
  return resolveImageUrl('', trip?.title || 'Trip cover', 'trip');
}

export function getTripDestinationQuery(rawTrip = {}) {
  const direct = String(rawTrip?.destination || '').trim();
  if (direct) return direct;
  const locations = String(rawTrip?.locations || '').trim();
  if (!locations) return '';
  const first = locations.split(';')[0] || locations;
  return String(first).trim();
}

export function pickDiscoveryCoverImage(data = {}) {
  const buckets = [
    Array.isArray(data?.places) ? data.places : [],
    Array.isArray(data?.stays) ? data.stays : [],
    Array.isArray(data?.foods) ? data.foods : [],
    Array.isArray(data?.experiences) ? data.experiences : [],
  ];

  for (const bucket of buckets) {
    for (const item of bucket) {
      const direct = String(item?.image || '').trim();
      if (direct) return direct;
      if (Array.isArray(item?.images) && item.images.length > 0) {
        const first = String(item.images[0] || '').trim();
        if (first) return first;
      }
    }
  }
  return '';
}

export const TRIP_FILTERS = ['All', 'Upcoming', 'Past'];

export const TRIP_STATUS_OPTIONS = [
  {
    value: 'Planning',
    class: 'trip-card__status--planning',
    optionClass: 'trip-card__status-option--planning',
    dotColor: '#fdba74',
  },
  {
    value: 'Upcoming',
    class: 'trip-card__status--upcoming',
    optionClass: 'trip-card__status-option--upcoming',
    dotColor: '#0d9488',
  },
  {
    value: 'Dreaming',
    class: 'trip-card__status--dreaming',
    optionClass: 'trip-card__status-option--dreaming',
    dotColor: '#7c3aed',
  },
];

export function getStatusClass(status) {
  const opt = TRIP_STATUS_OPTIONS.find((o) => o.value === status);
  return opt ? opt.class : 'trip-card__status--planning';
}

function parseTripDate(dateStr) {
  const s = String(dateStr || '').trim();
  if (!s) return null;

  const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const d = new Date(`${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}T12:00:00`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

  const rangeStart = s.split(' - ')[0]?.trim() || s;
  const parsed = new Date(rangeStart);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

export function resolveTripStartDate(trip) {
  if (!trip) return null;
  const candidates = [
    trip.startDate,
    trip.raw?.startDate,
    trip.raw?.dates,
    trip.dateLabel,
  ];
  for (const candidate of candidates) {
    const parsed = parseTripDate(candidate);
    if (parsed) return parsed;
  }
  return null;
}

export function formatDepartureDistance(startDate, todayDate) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const deltaDays = Math.floor((startDate.getTime() - todayDate.getTime()) / msPerDay);

  if (deltaDays <= 0) return 'Departs today';
  if (deltaDays === 1) return 'Departs tomorrow';
  if (deltaDays < 30) return `Departure in ${deltaDays} days`;

  const months = Math.round(deltaDays / 30.44);
  if (months <= 1) return 'Departure in 1 month';
  return `Departure in ${months} months`;
}

export function parseIsoDate(value) {
  const s = String(value || '').trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

export function formatRelativeTime(date, now = new Date()) {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));

  if (diffSec < 60) return 'just now';
  const minutes = Math.floor(diffSec / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}
