/**
 * Normalize a published itinerary stop or map marker into the shape TripDetails place-detail UI expects.
 */
export function publishedStopToDetailPlace(raw, index = 0) {
  const p = raw || {};
  const id = p.id != null ? String(p.id) : `pub-place-${index}`;
  const cat = String(p.category || '').toLowerCase();
  const itemType = cat.includes('food') || cat.includes('restaurant') || cat.includes('dining') ? 'food' : 'place';

  return {
    id,
    name: String(p.name || '').trim() || 'Place',
    rating: Number.isFinite(Number(p.rating)) ? Number(p.rating) : null,
    reviewCount: Number.isFinite(Number(p.reviewCount)) ? Number(p.reviewCount) : null,
    image: p.image || null,
    images: Array.isArray(p.images) ? p.images : [],
    overview: String(p.overview || p.notes || '').trim(),
    whyVisit: Array.isArray(p.whyVisit) ? p.whyVisit : [],
    address: String(p.address || '').trim(),
    locality: String(p.locality || '').trim() || null,
    hours: p.hours && typeof p.hours === 'object' ? p.hours : null,
    isOpenNow: p.isOpenNow,
    website: String(p.website || '').trim(),
    googleMapsReviewUrl: String(p.googleMapsReviewUrl || '').trim(),
    lat: Number.isFinite(Number(p.lat)) ? Number(p.lat) : null,
    lng: Number.isFinite(Number(p.lng)) ? Number(p.lng) : null,
    itemType,
  };
}

export function mapMarkerToDetailPlace(marker) {
  if (!marker) return null;
  const o = marker.originalData || {};
  const merged = {
    ...o,
    name: marker.name || o.name,
    lat: marker.lat ?? o.lat,
    lng: marker.lng ?? o.lng,
    locality: o.locality ?? marker.locality,
    address: marker.address || o.address,
    rating: marker.rating ?? o.rating,
    reviewCount: marker.reviewCount ?? o.reviewCount,
    image: marker.image || o.image,
    website: marker.website || o.website,
  };
  return publishedStopToDetailPlace(merged, 0);
}
