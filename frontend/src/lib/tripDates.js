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

export function formatTripDates(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const s = new Date(startDate);
  const e = new Date(endDate);
  return `${MONTH_SHORT[s.getMonth()]} ${s.getDate()} - ${MONTH_SHORT[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
}

