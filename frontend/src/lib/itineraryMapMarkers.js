
const MAP_CATEGORY_IDS = new Set(['places', 'food', 'experiences', 'stays']);

function dayNumberFromStartAndItemDate(startDateStr, itemDateStr) {
  const s = String(startDateStr || '').trim().slice(0, 10);
  const d = String(itemDateStr || '').trim().slice(0, 10);
  if (!s || !d) return 1;
  const start = new Date(`${s}T12:00:00`);
  const item = new Date(`${d}T12:00:00`);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(item.getTime())) return 1;
  const diff = Math.round((item - start) / 86400000);
  return Math.max(1, diff + 1);
}

function normalizeCoord(lat, lng) {
  const la = Number(lat);
  const ln = Number(lng);
  if (!Number.isFinite(la) || !Number.isFinite(ln)) return null;
  return { lat: la, lng: ln };
}

function dedupKey(m) {
  return `${m.lat.toFixed(5)},${m.lng.toFixed(5)},${String(m.name || '').trim().toLowerCase().slice(0, 48)}`;
}


export function buildItineraryMapMarkers(itinerary) {
  if (!itinerary) {
    return { markers: [], center: [20, 0] };
  }

  const startDate = itinerary.startDate != null ? String(itinerary.startDate).trim() : '';
  const markers = [];
  const seen = new Set();

  const push = (m) => {
    const k = dedupKey(m);
    if (seen.has(k)) return;
    seen.add(k);
    markers.push(m);
  };

  const items = Array.isArray(itinerary.tripExpenseItems) ? itinerary.tripExpenseItems : [];
  items.forEach((i, idx) => {
    const cid = String(i?.categoryId || '').toLowerCase();
    if (!MAP_CATEGORY_IDS.has(cid)) return;
    const coords = normalizeCoord(i.lat, i.lng);
    if (!coords) return;
    const itemDate =
      cid === 'stays'
        ? String(i.checkInDate || i.date || '').trim()
        : String(i.date || '').trim();
    const dayNum =
      i.dayNum != null && Number.isFinite(Number(i.dayNum))
        ? Math.max(1, Number(i.dayNum))
        : dayNumberFromStartAndItemDate(startDate, itemDate);
    push({
      id: i.id != null ? String(i.id) : `te-${idx}-${coords.lat}-${coords.lng}`,
      name: String(i.name || '').trim() || 'Place',
      lat: coords.lat,
      lng: coords.lng,
      dayNum,
      address: String(i.detail != null ? i.detail : i.address || '').trim(),
      rating: Number.isFinite(Number(i.rating)) ? Number(i.rating) : null,
      reviewCount: Number.isFinite(Number(i.reviewCount)) ? Number(i.reviewCount) : null,
      website: String(i.externalLink || i.website || '').trim(),
      overview: String(i.notes || '').trim(),
      markerType: 'trip',
      originalData: i,
    });
  });

  const places = Array.isArray(itinerary.places) ? itinerary.places : [];
  places.forEach((p, idx) => {
    const coords = normalizeCoord(p.lat, p.lng);
    if (!coords) return;
    const dayNum =
      p.dayNumber != null && Number.isFinite(Number(p.dayNumber))
        ? Math.max(1, Number(p.dayNumber))
        : 1;
    push({
      id: p.id != null ? String(p.id) : `place-${idx}-${coords.lat}-${coords.lng}`,
      name: String(p.name || '').trim() || 'Place',
      lat: coords.lat,
      lng: coords.lng,
      dayNum,
      address: String(p.address || '').trim(),
      rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : null,
      reviewCount: Number.isFinite(Number(p.reviewCount)) ? Number(p.reviewCount) : null,
      website: String(p.website || '').trim(),
      overview: String(p.notes || '').trim(),
      markerType: 'trip',
      originalData: p,
    });
  });

  let center;
  if (markers.length > 0) {
    center = [markers[0].lat, markers[0].lng];
  } else {
    center = [20, 0];
  }

  return { markers, center };
}
