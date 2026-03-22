/**
 * Filter / sort options for the Explore (community itineraries) page.
 * Kept separate from API data — wire selections to GET /api/itineraries query params.
 */
export const ADVENTURE_TYPES = [
  'All',
  'Staycation',
  'Hiking & Trekking',
  'Adventure',
  'Culture & Art',
  'Gardens & Museums',
  'Foodie',
  'Luxury',
  'Cruises',
  'Relaxation & Spa',
  'City Life',
  'Wellness',
  'Shopping',
];

export const DURATIONS = ['1-3 days', '3-5 days', '5-7 days', '7-10 days', '10-14 days', '14+ days'];

export const SORT_OPTIONS = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Duration'];

/** UI-only; real itineraries do not include nationality yet — selection does not filter API results. */
export const CREATOR_NATIONALITIES = ['Singaporean', 'Vietnamese', 'Thai', 'Indian', 'Cambodian', 'American'];
