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
