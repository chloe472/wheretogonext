import { useMemo } from 'react';
import { MONTH_SHORT, getTripDaysFromTrip } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsDerivedState({
  trip,
  dateRange,
  tripExpenseItems,
  whereModalDisplayStart,
  whereModalDisplayEnd,
  mapDayFilterSelected,
}) {
  const displayTrip = useMemo(() => {
    if (!trip) return null;
    const start = dateRange?.startDate ?? trip.startDate;
    const end = dateRange?.endDate ?? trip.endDate;
    return { ...trip, startDate: start, endDate: end };
  }, [trip, dateRange?.startDate, dateRange?.endDate]);

  const days = useMemo(
    () => (trip ? getTripDaysFromTrip(displayTrip ?? trip) : []),
    [trip, displayTrip],
  );

  const spent = useMemo(
    () => (Array.isArray(tripExpenseItems)
      ? tripExpenseItems.reduce((sum, item) => sum + (Number(item?.total) || 0), 0)
      : 0),
    [tripExpenseItems],
  );

  const displayStart = trip ? whereModalDisplayStart : undefined;
  const displayEnd = trip ? whereModalDisplayEnd : undefined;

  const allDayNums = useMemo(() => days.map((day) => day.dayNum), [days]);

  const activeDayNums = useMemo(
    () => (mapDayFilterSelected.length ? mapDayFilterSelected : allDayNums).filter((dayNum) =>
      allDayNums.includes(dayNum),
    ),
    [mapDayFilterSelected, allDayNums],
  );

  const displayDatesLabel = useMemo(() => {
    if (!(displayStart && displayEnd)) return trip?.dates ?? '';

    const start = new Date(displayStart);
    const end = new Date(displayEnd);
    return `${MONTH_SHORT[start.getMonth()]} ${start.getDate()} - ${MONTH_SHORT[end.getMonth()]} ${end.getDate()}`;
  }, [displayStart, displayEnd, trip?.dates]);

  return {
    displayTrip,
    days,
    spent,
    displayStart,
    displayEnd,
    allDayNums,
    activeDayNums,
    displayDatesLabel,
  };
}
