import { fetchItineraryById } from '../../../api/itinerariesApi';

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const TYPE_LABELS = { City: 'City', Country: 'Country', Province: 'Province' };

export function formatTripDates(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

export function isCityLocation(loc) {
  return String(loc?.type || '').toLowerCase() === 'city';
}

export function resolveTypedLocation(query) {
  const value = String(query || '').trim();
  if (!value) return null;

  const [name, ...rest] = value.split(',').map((part) => part.trim()).filter(Boolean);
  return {
    id: `custom-location-${Date.now()}`,
    name: name || value,
    country: rest.join(', ') || undefined,
    type: 'City',
  };
}

export function getLocationLabel(loc) {
  return loc?.country ? `${loc.name}, ${loc.country}` : String(loc?.name || '').trim();
}

export function getLocationKey(loc) {
  return getLocationLabel(loc).toLowerCase();
}

export function getTripDayCount(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(`${String(startDate).slice(0, 10)}T12:00:00`);
  const end = new Date(`${String(endDate).slice(0, 10)}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

export function buildDefaultCityDayRanges(locations, totalDays) {
  const days = Math.max(1, Number(totalDays) || 1);
  const list = Array.isArray(locations) ? locations : [];
  if (list.length === 0) return {};

  const base = Math.floor(days / list.length);
  const rem = days % list.length;
  const ranges = {};
  let cursor = 1;

  list.forEach((loc, idx) => {
    const size = base + (idx < rem ? 1 : 0);
    const startDay = cursor;
    const endDay = Math.min(days, cursor + Math.max(1, size) - 1);
    ranges[getLocationKey(loc)] = { startDay, endDay };
    cursor = endDay + 1;
  });

  return ranges;
}

export function extractItineraryId(itinerary) {
  if (!itinerary) return '';
  const raw = itinerary._id ?? itinerary.id ?? itinerary?.itinerary?._id ?? itinerary?.itinerary?.id;
  if (raw == null) return '';
  if (typeof raw === 'string' || typeof raw === 'number') return String(raw);
  if (typeof raw === 'object') {
    if (raw.$oid) return String(raw.$oid);
    if (typeof raw.toString === 'function') {
      const value = raw.toString();
      if (value && value !== '[object Object]') return value;
    }
  }
  return '';
}

export async function waitForItineraryReadable(itineraryId, attempts = 12, delayMs = 400) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const doc = await fetchItineraryById(itineraryId);
      if (doc) return doc;
    } catch (error) {
      const message = String(error?.message || '').toLowerCase();
      const isTransient = message.includes('404') || message.includes('not found');
      if (!isTransient && attempt >= 2) {
        break;
      }
    }

    if (attempt < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }
  return null;
}

export function getCityDayDraftKey(rowId, field) {
  return `${rowId}::${field}`;
}


export function buildCitySegmentsForSubmit(allLocations, dayCount, cityPlanRows, cityDayRanges, cityDayDrafts) {
  const fallbackRanges = buildDefaultCityDayRanges(allLocations, dayCount);
  if (allLocations.length <= 1) {
    return {
      ok: true,
      segments: [{
        city: String(allLocations[0]?.name || '').trim(),
        locationLabel: getLocationLabel(allLocations[0]),
        startDay: 1,
        endDay: dayCount,
      }],
    };
  }

  const allLocationKeys = allLocations.map((loc) => getLocationKey(loc));
  const effectiveRows = cityPlanRows
    .filter((row) => allLocationKeys.includes(row.locationKey));
  allLocations.forEach((loc) => {
    const key = getLocationKey(loc);
    if (!effectiveRows.some((row) => row.locationKey === key)) {
      effectiveRows.push({ id: `virtual-${key}`, locationKey: key });
    }
  });

  const citySegments = effectiveRows.map((row) => {
    const loc = allLocations.find((item) => getLocationKey(item) === row.locationKey) || allLocations[0];
    const key = getLocationKey(loc);
    const selected = cityDayRanges[row.id] || fallbackRanges[key] || { startDay: 1, endDay: dayCount };
    const startDraft = cityDayDrafts[getCityDayDraftKey(row.id, 'startDay')];
    const endDraft = cityDayDrafts[getCityDayDraftKey(row.id, 'endDay')];
    const startSource = startDraft !== undefined && startDraft !== '' ? startDraft : selected.startDay;
    const endSource = endDraft !== undefined && endDraft !== '' ? endDraft : selected.endDay;
    const startDay = Math.max(1, Math.min(dayCount, Number(startSource) || 1));
    const endDay = Math.max(1, Math.min(dayCount, Number(endSource) || dayCount));
    return {
      city: String(loc.name || '').trim(),
      locationLabel: getLocationLabel(loc),
      startDay: Math.min(startDay, endDay),
      endDay: Math.max(startDay, endDay),
    };
  }).sort((a, b) => a.startDay - b.startDay);

  if (citySegments.length > 0) {
    if (citySegments[0].startDay !== 1) {
      const firstCity = citySegments[0].city || citySegments[0].locationLabel || 'the first city';
      return {
        ok: false,
        error: `City ranges must start at Day 1. ${firstCity} currently starts at Day ${citySegments[0].startDay}.`,
      };
    }

    const last = citySegments[citySegments.length - 1];
    if (last.endDay !== dayCount) {
      return {
        ok: false,
        error: `City ranges must end at Day ${dayCount}. Current end day is Day ${last.endDay}.`,
      };
    }
  }

  return { ok: true, segments: citySegments };
}
