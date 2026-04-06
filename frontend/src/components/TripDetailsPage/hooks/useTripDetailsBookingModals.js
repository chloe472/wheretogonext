import { useCallback, useState } from 'react';
import {
  addDays,
  buildStayBookingDeepLink,
  durationMinutesToParts,
  findTimeOverlapItem,
  toIsoDateLocal,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsBookingModals({
  days,
  cityQuery,
  currency,
  tripExpenseItems,
  setTripExpenseItems,
  showInAppNotice,
}) {
  const [stayBookingModalOpen, setStayBookingModalOpen] = useState(false);
  const [stayBookingTarget, setStayBookingTarget] = useState(null);
  const [stayBookingCheckInDate, setStayBookingCheckInDate] = useState('');
  const [stayBookingCheckOutDate, setStayBookingCheckOutDate] = useState('');
  const [stayBookingAdults, setStayBookingAdults] = useState(2);
  const [stayBookingChildren, setStayBookingChildren] = useState(0);
  const [stayBookingRooms, setStayBookingRooms] = useState(1);

  const openStayBookingModal = useCallback((stay) => {
    if (!stay) return;

    const fallbackCheckIn = days[0]?.date || toIsoDateLocal(new Date());
    const fallbackCheckOut = days[1]?.date || addDays(fallbackCheckIn, 1);
    const fromTripWindow = stay?.checkInDate || stay?.checkOutDate
      ? { checkInDate: stay?.checkInDate || '', checkOutDate: stay?.checkOutDate || '' }
      : null;
    const defaultCheckIn = fromTripWindow?.checkInDate || fallbackCheckIn;
    const proposedCheckOut = fromTripWindow?.checkOutDate || fallbackCheckOut;
    const defaultCheckOut = proposedCheckOut > defaultCheckIn ? proposedCheckOut : addDays(defaultCheckIn, 1);

    setStayBookingTarget(stay);
    setStayBookingCheckInDate(defaultCheckIn);
    setStayBookingCheckOutDate(defaultCheckOut);
    setStayBookingAdults(2);
    setStayBookingChildren(0);
    setStayBookingRooms(1);
    setStayBookingModalOpen(true);
  }, [days]);

  const onCloseStayBooking = useCallback(() => {
    setStayBookingModalOpen(false);
  }, []);

  const handleStayBookingSubmit = useCallback((e) => {
    e.preventDefault();
    if (!stayBookingTarget) return;

    const resolvedCheckOut =
      stayBookingCheckOutDate > stayBookingCheckInDate
        ? stayBookingCheckOutDate
        : addDays(stayBookingCheckInDate, 1);

    const bookingLink = buildStayBookingDeepLink(stayBookingTarget, cityQuery, {
      checkInDate: stayBookingCheckInDate,
      checkOutDate: resolvedCheckOut,
      adults: stayBookingAdults,
      children: stayBookingChildren,
      rooms: stayBookingRooms,
      currency,
    });

    window.open(bookingLink, '_blank', 'noopener,noreferrer');
    setStayBookingModalOpen(false);
  }, [
    stayBookingTarget,
    stayBookingCheckOutDate,
    stayBookingCheckInDate,
    cityQuery,
    stayBookingAdults,
    stayBookingChildren,
    stayBookingRooms,
    currency,
  ]);

  return {
    stayBookingModalOpen,
    setStayBookingModalOpen,
    stayBookingTarget,
    setStayBookingTarget,
    stayBookingCheckInDate,
    setStayBookingCheckInDate,
    stayBookingCheckOutDate,
    setStayBookingCheckOutDate,
    stayBookingAdults,
    setStayBookingAdults,
    stayBookingChildren,
    setStayBookingChildren,
    stayBookingRooms,
    setStayBookingRooms,
    openStayBookingModal,
    onCloseStayBooking,
    handleStayBookingSubmit,
  };
}
