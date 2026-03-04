/**
 * Shared mock trip data for Dashboard and TripDetailsPage.
 * In a real app this would come from an API.
 */
export const MOCK_TRIPS = [
  {
    id: '1',
    title: 'Summer Europe Adventure',
    destination: 'Paris',
    dates: 'Jun 15 - Jul 2, 2026',
    startDate: '2026-06-15',
    endDate: '2026-07-02',
    locations: 'Paris, Rome, Barcelona',
    placesSaved: 47,
    budget: '$3.2k',
    budgetSpent: 0,
    travelers: 4,
    status: 'Planning',
    statusClass: 'trip-card__status--planning',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=240&fit=crop',
  },
  {
    id: '2',
    title: 'Tokyo Spring Cherry Blossoms',
    destination: 'Tokyo',
    dates: 'Mar 20 - Apr 5, 2027',
    startDate: '2027-03-20',
    endDate: '2027-04-05',
    locations: 'Tokyo, Kyoto, Osaka',
    placesSaved: 23,
    budget: '$4.5k',
    budgetSpent: 0,
    travelers: 2,
    status: 'Upcoming',
    statusClass: 'trip-card__status--upcoming',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=240&fit=crop',
  },
  {
    id: '3',
    title: '7 days to Seattle',
    destination: 'Seattle',
    dates: 'Mar 23 - Mar 29, 2026',
    startDate: '2026-03-23',
    endDate: '2026-03-29',
    locations: 'Seattle',
    placesSaved: 12,
    budget: '$1.5k',
    budgetSpent: 0,
    travelers: 2,
    status: 'Planning',
    statusClass: 'trip-card__status--planning',
    image: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?w=400&h=240&fit=crop',
  },
  {
    id: '4',
    title: 'Bali Wellness Retreat',
    destination: 'Bali',
    dates: 'Aug 10 - Aug 24, 2026',
    startDate: '2026-08-10',
    endDate: '2026-08-24',
    locations: 'Ubud, Seminyak, Canggu',
    placesSaved: 15,
    budget: '$2.8k',
    budgetSpent: 0,
    travelers: 1,
    status: 'Dreaming',
    statusClass: 'trip-card__status--dreaming',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=240&fit=crop',
  },
  {
    id: '5',
    title: 'New Year in Paris',
    destination: 'Paris',
    dates: 'Dec 28, 2024 - Jan 4, 2025',
    startDate: '2024-12-28',
    endDate: '2025-01-04',
    locations: 'Paris',
    placesSaved: 8,
    budget: '$2k',
    budgetSpent: 1850,
    travelers: 2,
    status: 'Planning',
    statusClass: 'trip-card__status--planning',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=240&fit=crop',
  },
];

const TRIPS_STORAGE_KEY = 'wheretogonext_trips_store';

function loadTripStore() {
  if (typeof window === 'undefined') {
    return { userTrips: [], mockOverrides: {} };
  }
  try {
    const raw = window.localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return { userTrips: [], mockOverrides: {} };
    const parsed = JSON.parse(raw);
    return {
      userTrips: Array.isArray(parsed?.userTrips) ? parsed.userTrips : [],
      mockOverrides: parsed?.mockOverrides && typeof parsed.mockOverrides === 'object' ? parsed.mockOverrides : {},
    };
  } catch {
    return { userTrips: [], mockOverrides: {} };
  }
}

function saveTripStore() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      TRIPS_STORAGE_KEY,
      JSON.stringify({
        userTrips,
        mockOverrides,
      }),
    );
  } catch {
    // Ignore storage write failures (e.g., quota exceeded/private mode).
  }
}

const storedTripStore = loadTripStore();

/** User-created trips (from "Start planning"); merged with MOCK_TRIPS for dashboard and getTripById */
const userTrips = Array.isArray(storedTripStore.userTrips) ? storedTripStore.userTrips : [];
const mockOverrides = storedTripStore.mockOverrides && typeof storedTripStore.mockOverrides === 'object'
  ? storedTripStore.mockOverrides
  : {};

function getResolvedMockTrips() {
  return MOCK_TRIPS.map((trip) => ({ ...trip, ...(mockOverrides[trip.id] || {}) }));
}

export function getAllTrips() {
  return [...getResolvedMockTrips(), ...userTrips];
}

export function getTripById(id) {
  const userTrip = userTrips.find((t) => t.id === id);
  if (userTrip) return userTrip;
  return getResolvedMockTrips().find((t) => t.id === id) ?? null;
}

/** Add a newly created trip (from New Trip flow) and return it. */
export function addTrip(trip) {
  userTrips.push(trip);
  saveTripStore();
  return trip;
}

/** Update an existing trip by id. Mutates the trip in place (works for both MOCK_TRIPS and userTrips). */
export function updateTrip(id, updates) {
  const userTrip = userTrips.find((x) => x.id === id);
  if (userTrip) {
    Object.assign(userTrip, updates);
    saveTripStore();
    return userTrip;
  }

  const seedTrip = MOCK_TRIPS.find((x) => x.id === id);
  if (!seedTrip) return null;

  mockOverrides[id] = {
    ...(mockOverrides[id] || {}),
    ...updates,
  };
  saveTripStore();
  return { ...seedTrip, ...mockOverrides[id] };
}

/** Remove a trip from userTrips by id. Returns true if removed; false if not in userTrips (e.g. seed trip). */
export function deleteTrip(id) {
  const i = userTrips.findIndex((x) => x.id === id);
  if (i === -1) return false;
  userTrips.splice(i, 1);
  saveTripStore();
  return true;
}

/** Get array of day labels for a trip (e.g. [{ dayNum: 1, label: 'Mon, Mar 23' }, ...]) */
export function getTripDays(trip) {
  if (!trip?.startDate || !trip?.endDate) return [];
  const start = new Date(trip.startDate);
  const end = new Date(trip.endDate);
  const days = [];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      dayNum: days.length + 1,
      date: d.toISOString().slice(0, 10),
      label: `${dayLabels[d.getDay()]}, ${monthShort[d.getMonth()]} ${d.getDate()}`,
    });
  }
  return days;
}
