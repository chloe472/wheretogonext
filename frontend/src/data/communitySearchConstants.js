/**
 * Filter / sort options for the Explore (community itineraries) page.
 * Kept separate from API data — wire selections to GET /api/itineraries query params.
 */

/** Same strings stored on `itinerary.categories` when publishing — single taxonomy for publish + Explore filter. */
export const PUBLISH_CATEGORY_OPTIONS = [
  'Sightseeing',
  'Hiking & Trekking',
  'Adventure',
  'Culture & Art',
  'Outdoor & Nature',
  'Foodie',
  'Luxury',
  'Cruises',
  'Beaches & Sun',
  'Nightlife',
  'Wellness',
  'Shopping',
];

/** Explore sidebar adventure-type tags: "All" clears the filter; other labels match `PUBLISH_CATEGORY_OPTIONS`. */
export const ADVENTURE_TYPES = ['All', ...PUBLISH_CATEGORY_OPTIONS];

export const DURATIONS = ['1-3 days', '3-5 days', '5-7 days', '7-10 days', '10-14 days', '14+ days'];

export const SORT_OPTIONS = ['Most Popular', 'Newest', 'Price: Low to High', 'Price: High to Low', 'Duration'];
