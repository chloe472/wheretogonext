import { useCallback, useState } from 'react';
import { Ticket } from 'lucide-react';
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
  setExperienceDetailsView,
  setAddExperiencesOpen,
}) {
  const [experienceBookingModalOpen, setExperienceBookingModalOpen] = useState(false);
  const [bookingExperience, setBookingExperience] = useState(null);
  const [bookingOption, setBookingOption] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [bookingStartTime, setBookingStartTime] = useState('07:00');
  const [bookingTravellers, setBookingTravellers] = useState(2);
  const [bookingNotes, setBookingNotes] = useState('');

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

  const onCloseExperienceBooking = useCallback(() => {
    setExperienceBookingModalOpen(false);
  }, []);

  const handleExperienceBookingSubmit = useCallback((e) => {
    e.preventDefault();
    if (!bookingExperience || !bookingOption) return;

    const parsedDurationHours = Number(bookingExperience.durationHours);
    const fallbackDurationHours =
      Number.isFinite(parsedDurationHours) && parsedDurationHours > 0 ? parsedDurationHours : 2;
    const fallbackDurationMins = Math.max(1, Math.round(fallbackDurationHours * 60));
    const fallbackDurationParts = durationMinutesToParts(fallbackDurationMins);
    const overlapping = findTimeOverlapItem(tripExpenseItems, {
      date: bookingDate,
      startTime: bookingStartTime,
      durationHrs: fallbackDurationParts.durationHrs,
      durationMins: fallbackDurationParts.durationMins,
    });
    if (overlapping) {
      showInAppNotice(`Time overlaps with ${overlapping.name}. Please choose another time slot.`, 'warning');
      return;
    }

    const optionLabel = bookingOption.option || bookingOption.name || bookingOption.type || 'Experience package';
    const totalCost = bookingOption.price * bookingTravellers;
    setTripExpenseItems((prev) => [
      ...prev,
      {
        id: `experience-${bookingExperience.id}-${bookingOption.id}-${Date.now()}`,
        name: bookingExperience.name,
        total: totalCost,
        categoryId: 'experiences',
        category: 'Experience',
        date: bookingDate,
        detail: `${optionLabel} - ${bookingTravellers} traveller${bookingTravellers !== 1 ? 's' : ''}`,
        Icon: Ticket,
        lat: bookingExperience.lat,
        lng: bookingExperience.lng,
        notes: bookingNotes,
        attachments: [],
        startTime: bookingStartTime,
        durationHrs: fallbackDurationParts.durationHrs,
        durationMins: fallbackDurationParts.durationMins,
        externalLink: '',
        placeImageUrl: bookingExperience.image,
        rating: bookingExperience.rating,
        reviewCount: bookingExperience.reviewCount,
        experienceType: bookingExperience.type,
        bookingOption: optionLabel,
        travellers: bookingTravellers,
        pricePerTraveller: bookingOption.price,
      },
    ]);

    setExperienceBookingModalOpen(false);
    setExperienceDetailsView(null);
    setAddExperiencesOpen(false);
    setBookingExperience(null);
    setBookingOption(null);
    setBookingDate('');
    setBookingStartTime('07:00');
    setBookingTravellers(2);
    setBookingNotes('');
  }, [
    bookingExperience,
    bookingOption,
    bookingDate,
    bookingStartTime,
    bookingTravellers,
    bookingNotes,
    tripExpenseItems,
    showInAppNotice,
    setTripExpenseItems,
    setExperienceDetailsView,
    setAddExperiencesOpen,
  ]);

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
    experienceBookingModalOpen,
    setExperienceBookingModalOpen,
    bookingExperience,
    setBookingExperience,
    bookingOption,
    setBookingOption,
    bookingDate,
    setBookingDate,
    bookingStartTime,
    setBookingStartTime,
    bookingTravellers,
    setBookingTravellers,
    bookingNotes,
    setBookingNotes,
    onCloseExperienceBooking,
    handleExperienceBookingSubmit,
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
