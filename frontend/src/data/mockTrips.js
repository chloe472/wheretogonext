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
];

export function getTripById(id) {
  return MOCK_TRIPS.find((t) => t.id === id) ?? null;
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
