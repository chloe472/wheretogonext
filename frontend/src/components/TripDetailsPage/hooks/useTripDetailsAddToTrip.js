import { useCallback, useState } from 'react';
import {
  Camera,
  UtensilsCrossed,
  Building2,
  Ticket,
} from 'lucide-react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import {
  addDays,
  buildStayBookingDeepLink,
  convertCurrencyToUsd,
  convertUsdToCurrency,
  createAttachmentFromFile,
  durationMinutesToParts,
  findTimeOverlapItem,
  getDefaultStartTimeForDate,
  normalizeAttachment,
  normalizeExternalUrl,
  parseDateTimeLocal,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsAddToTrip({
  days,
  cityQuery,
  currency,
  exchangeRates,
  tripExpenseItems,
  setTripExpenseItems,
  addPlacesDay,
  addFoodDay,
  addExperiencesDay,
  showInAppNotice,
  setFriendlyDialog,
  setPlaceDetailsView,
  setFoodDetailsView,
  setStayDetailsView,
  setExperienceDetailsView,
  setAddPlacesOpen,
  setAddFoodOpen,
  setAddStaysOpen,
  setAddExperiencesOpen,
}) {
  const [addToTripModalOpen, setAddToTripModalOpen] = useState(false);
  const [addToTripItem, setAddToTripItem] = useState(null);
  const [addToTripDate, setAddToTripDate] = useState('');
  const [addToTripStartTime, setAddToTripStartTime] = useState('07:00');
  const [addToTripDurationHrs, setAddToTripDurationHrs] = useState('1');
  const [addToTripDurationMins, setAddToTripDurationMins] = useState('0');
  const [addToTripCheckInDate, setAddToTripCheckInDate] = useState('');
  const [addToTripCheckInTime, setAddToTripCheckInTime] = useState('15:00');
  const [addToTripCheckOutDate, setAddToTripCheckOutDate] = useState('');
  const [addToTripCheckOutTime, setAddToTripCheckOutTime] = useState('11:00');
  const [addToTripNotes, setAddToTripNotes] = useState('');
  const [addToTripCost, setAddToTripCost] = useState('');
  const [addToTripExternalLink, setAddToTripExternalLink] = useState('');
  const [addToTripTravelDocs, setAddToTripTravelDocs] = useState([]);

  const appendItemToTrip = useCallback(({
    itemType,
    data,
    categoryId,
    category,
    Icon,
    values,
  }) => {
    const isStayCategory = String(categoryId || '').toLowerCase() === 'stays';
    const costNum = parseFloat(values?.cost) || 0;
    const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
    const durationHrsNum = isStayCategory ? 0 : Number(values?.durationHrs || 0);
    const durationMinsNum = isStayCategory ? 0 : Number(values?.durationMins || 0);
    const startTime = isStayCategory
      ? (values?.checkInTime || '15:00')
      : (values?.startTime || '07:00');
    const resolvedDate = isStayCategory
      ? (values?.checkInDate || values?.date)
      : values?.date;

    const checkInDate = isStayCategory ? (values?.checkInDate || resolvedDate) : '';
    const checkInTime = isStayCategory ? (values?.checkInTime || startTime || '15:00') : '';
    const checkOutDate = isStayCategory ? (values?.checkOutDate || checkInDate) : '';
    const checkOutTime = isStayCategory ? (values?.checkOutTime || checkInTime || '11:00') : '';

    const checkInDateTime = isStayCategory ? parseDateTimeLocal(checkInDate, checkInTime) : null;
    const checkOutDateTime = isStayCategory ? parseDateTimeLocal(checkOutDate, checkOutTime) : null;
    const stayDurationMinutes = (isStayCategory && checkInDateTime && checkOutDateTime)
      ? Math.max(0, Math.round((checkOutDateTime.getTime() - checkInDateTime.getTime()) / (1000 * 60)))
      : 0;
    const stayDuration = isStayCategory
      ? durationMinutesToParts(stayDurationMinutes)
      : { durationHrs: durationHrsNum, durationMins: durationMinsNum };

    if (!isStayCategory) {
      const overlapping = findTimeOverlapItem(tripExpenseItems, {
        date: resolvedDate,
        startTime,
        durationHrs: stayDuration.durationHrs,
        durationMins: stayDuration.durationMins,
      });
      if (overlapping) {
        showInAppNotice(`Time overlaps with ${overlapping.name}. Please choose another time slot.`, 'warning');
        return false;
      }
    }

    const docs = Array.isArray(values?.travelDocs)
      ? values.travelDocs
        .map((file, idx) => {
          const normalized = normalizeAttachment(file) || createAttachmentFromFile(file);
          if (!normalized) return null;
          return {
            id: `${data.id || data.name || 'doc'}-${idx}-${Date.now()}`,
            name: normalized.name || `Document ${idx + 1}`,
            type: normalized.type || '',
            url: normalized.url || '',
          };
        })
        .filter(Boolean)
      : [];

    setTripExpenseItems((prev) => [...prev, {
      id: `${itemType}-${data.id}-${Date.now()}`,
      sourcePlaceId: data.id || null,
      name: data.name,
      total: costNumUsd,
      categoryId,
      category,
      date: resolvedDate,
      detail: data.address || data.name,
      Icon,
      lat: data.lat,
      lng: data.lng,
      notes: values?.note || '',
      attachments: docs,
      startTime,
      durationHrs: stayDuration.durationHrs,
      durationMins: stayDuration.durationMins,
      checkInDate: isStayCategory ? checkInDate : undefined,
      checkInTime: isStayCategory ? checkInTime : undefined,
      checkOutDate: isStayCategory ? checkOutDate : undefined,
      checkOutTime: isStayCategory ? checkOutTime : undefined,
      externalLink: normalizeExternalUrl(values?.externalLink || data.website || ''),
      placeImageUrl: resolveImageUrl(
        data.image,
        data.name,
        itemType === 'food' ? 'restaurant' : itemType === 'experience' ? 'activity' : itemType === 'stay' ? 'hotel' : 'landmark',
      ),
      rating: data.rating,
      reviewCount: data.reviewCount,
    }]);

    return true;
  }, [
    currency,
    exchangeRates,
    tripExpenseItems,
    setTripExpenseItems,
    showInAppNotice,
  ]);

  const openAddToTripFromMapMarker = useCallback((marker) => {
    if (!marker) return;

    const markerType = marker.markerType;
    let type = 'place';
    let categoryId = 'places';
    let category = 'Places';
    let Icon = Camera;

    if (markerType === 'food') {
      type = 'food';
      categoryId = 'food';
      category = 'Food & Beverage';
      Icon = UtensilsCrossed;
    } else if (markerType === 'experience') {
      type = 'experience';
      categoryId = 'experiences';
      category = 'Experience';
      Icon = Ticket;
    }

    const data = marker.originalData || {
      id: marker.sourceId || marker.id,
      name: marker.name,
      address: marker.address || cityQuery,
      lat: marker.lat,
      lng: marker.lng,
      image: marker.image,
      website: marker.website || '',
      rating: marker.rating,
      reviewCount: marker.reviewCount,
    };

    const preferredDayNum = markerType === 'food'
      ? addFoodDay
      : markerType === 'experience'
        ? addExperiencesDay
        : addPlacesDay;
    const day = days.find((d) => d.dayNum === preferredDayNum) || days.find((d) => d.dayNum === 1);
    const selectedDate = day?.date || days[0]?.date || '';
    const sourceDurationMins = type === 'experience'
      ? Math.max(1, Math.round((Number(data?.durationHours || 0) || 2) * 60))
      : 60;
    const sourceDurationParts = durationMinutesToParts(sourceDurationMins);

    setAddToTripItem({ type, data, categoryId, category, Icon });
    setAddToTripDate(selectedDate);
    setAddToTripStartTime(getDefaultStartTimeForDate(tripExpenseItems, selectedDate, '07:00', sourceDurationMins));
    setAddToTripDurationHrs(String(sourceDurationParts.durationHrs));
    setAddToTripDurationMins(String(sourceDurationParts.durationMins));
    setAddToTripCheckInDate(selectedDate);
    setAddToTripCheckInTime('15:00');
    setAddToTripCheckOutDate(days.find((d) => d.dayNum === 2)?.date || addDays(selectedDate, 1));
    setAddToTripCheckOutTime('11:00');
    setAddToTripNotes('');
    setAddToTripCost('');
    setAddToTripExternalLink(data.website || '');
    setAddToTripTravelDocs([]);
    setAddToTripModalOpen(true);
  }, [
    cityQuery,
    addFoodDay,
    addExperiencesDay,
    addPlacesDay,
    days,
    tripExpenseItems,
  ]);

  const openAddStayToTrip = useCallback((stay, room = null) => {
    if (!stay) return;

    const day = days.find((d) => d.dayNum === 1);
    const bookingLink = buildStayBookingDeepLink(stay, cityQuery, { currency });
    const defaultCostUsd = Number(room?.price ?? stay.pricePerNight ?? 0);
    const defaultCost = convertUsdToCurrency(defaultCostUsd, currency, exchangeRates);
    const roomLabel = room?.name ? ` • ${room.name}` : '';

    setAddToTripItem({
      type: 'stay',
      data: {
        ...stay,
        website: bookingLink,
      },
      categoryId: 'stays',
      category: 'Stays',
      Icon: Building2,
    });
    setAddToTripDate(day?.date || days[0]?.date || '');
    setAddToTripStartTime('15:00');
    setAddToTripDurationHrs('12');
    setAddToTripDurationMins('0');
    setAddToTripCheckInDate(day?.date || days[0]?.date || '');
    setAddToTripCheckInTime('15:00');
    setAddToTripCheckOutDate(days.find((d) => d.dayNum === 2)?.date || addDays(day?.date || days[0]?.date || '', 1));
    setAddToTripCheckOutTime('11:00');
    setAddToTripNotes(`Stay booking${roomLabel}`.trim());
    setAddToTripCost(defaultCost > 0 ? String(defaultCost) : '');
    setAddToTripExternalLink(bookingLink);
    setAddToTripTravelDocs([]);
    setAddToTripModalOpen(true);
  }, [
    days,
    cityQuery,
    currency,
    exchangeRates,
  ]);

  const openAddToTripFromAiPlace = useCallback((aiPlace) => {
    if (!aiPlace) return;

    const type = aiPlace.type || 'place';
    let categoryId = 'places';
    let category = 'Places';
    let Icon = Camera;

    if (type === 'food') {
      categoryId = 'food';
      category = 'Food & Beverage';
      Icon = UtensilsCrossed;
    } else if (type === 'experience') {
      categoryId = 'experiences';
      category = 'Experience';
      Icon = Ticket;
    }

    setAddToTripItem({
      type,
      data: {
        id: aiPlace.id,
        name: aiPlace.name,
        address: aiPlace.location,
        image: aiPlace.image,
        website: aiPlace.website,
        lat: aiPlace.lat,
        lng: aiPlace.lng,
      },
      categoryId,
      category,
      Icon,
    });

    const day = days.find((d) => d.dayNum === 1) || days[0];
    const selectedDate = day?.date || '';

    setAddToTripDate(selectedDate);
    setAddToTripStartTime('07:00');
    setAddToTripDurationHrs('1');
    setAddToTripDurationMins('0');
    setAddToTripCheckInDate(selectedDate);
    setAddToTripCheckInTime('15:00');
    setAddToTripCheckOutDate(days.find((d) => d.dayNum === 2)?.date || addDays(selectedDate, 1));
    setAddToTripCheckOutTime('11:00');
    setAddToTripNotes('');
    setAddToTripCost('');
    setAddToTripExternalLink(aiPlace.website || '');
    setAddToTripTravelDocs([]);

    setAddToTripModalOpen(true);
  }, [days]);

  const onCloseAddToTrip = useCallback(() => {
    setAddToTripModalOpen(false);
  }, []);

  const handleAddToTripSubmit = useCallback((e) => {
    e.preventDefault();
    if (!addToTripItem) return;

    const data = addToTripItem.data;
    const isStayForm = addToTripItem.type === 'stay';
    if (isStayForm) {
      const checkIn = parseDateTimeLocal(addToTripCheckInDate, addToTripCheckInTime);
      const checkOut = parseDateTimeLocal(addToTripCheckOutDate, addToTripCheckOutTime);
      if (!checkIn || !checkOut || checkOut <= checkIn) {
        setFriendlyDialog({
          open: true,
          title: 'Invalid stay dates',
          message: 'Check-out must be after check-in.',
          showCancel: false,
          confirmText: 'OK',
          cancelText: 'Cancel',
          onConfirm: null,
        });
        return;
      }
    }

    const didAppend = appendItemToTrip({
      itemType: addToTripItem.type,
      data,
      categoryId: addToTripItem.categoryId,
      category: addToTripItem.category,
      Icon: addToTripItem.Icon,
      values: {
        date: addToTripDate,
        startTime: addToTripStartTime,
        durationHrs: parseInt(addToTripDurationHrs, 10) || 0,
        durationMins: parseInt(addToTripDurationMins, 10) || 0,
        checkInDate: addToTripCheckInDate,
        checkInTime: addToTripCheckInTime,
        checkOutDate: addToTripCheckOutDate,
        checkOutTime: addToTripCheckOutTime,
        note: addToTripNotes,
        cost: addToTripCost,
        externalLink: addToTripExternalLink,
        travelDocs: addToTripTravelDocs,
      },
    });
    if (!didAppend) return;

    const addedDayLabel = days.find((day) => day.date === addToTripDate)?.dayNum;
    const addedTargetLabel = isStayForm
      ? 'your trip'
      : addedDayLabel
        ? `Day ${addedDayLabel}`
        : 'your trip';
    showInAppNotice(`Added ${data.name || addToTripItem.category || 'item'} to ${addedTargetLabel}.`, 'success');
    setAddToTripModalOpen(false);
    if (addToTripItem.type === 'place') {
      setPlaceDetailsView(null);
      setAddPlacesOpen(false);
    } else if (addToTripItem.type === 'food') {
      setFoodDetailsView(null);
      setAddFoodOpen(false);
    } else if (addToTripItem.type === 'stay') {
      setStayDetailsView(null);
      setAddStaysOpen(false);
    } else if (addToTripItem.type === 'experience') {
      setExperienceDetailsView(null);
      setAddExperiencesOpen(false);
    }
  }, [
    addToTripItem,
    addToTripCheckInDate,
    addToTripCheckInTime,
    addToTripCheckOutDate,
    addToTripCheckOutTime,
    addToTripDate,
    addToTripStartTime,
    addToTripDurationHrs,
    addToTripDurationMins,
    addToTripNotes,
    addToTripCost,
    addToTripExternalLink,
    addToTripTravelDocs,
    days,
    setFriendlyDialog,
    appendItemToTrip,
    showInAppNotice,
    setPlaceDetailsView,
    setFoodDetailsView,
    setStayDetailsView,
    setExperienceDetailsView,
    setAddPlacesOpen,
    setAddFoodOpen,
    setAddStaysOpen,
    setAddExperiencesOpen,
  ]);

  return {
    addToTripModalOpen,
    setAddToTripModalOpen,
    addToTripItem,
    setAddToTripItem,
    addToTripDate,
    setAddToTripDate,
    addToTripStartTime,
    setAddToTripStartTime,
    addToTripDurationHrs,
    setAddToTripDurationHrs,
    addToTripDurationMins,
    setAddToTripDurationMins,
    addToTripCheckInDate,
    setAddToTripCheckInDate,
    addToTripCheckInTime,
    setAddToTripCheckInTime,
    addToTripCheckOutDate,
    setAddToTripCheckOutDate,
    addToTripCheckOutTime,
    setAddToTripCheckOutTime,
    addToTripNotes,
    setAddToTripNotes,
    addToTripCost,
    setAddToTripCost,
    addToTripExternalLink,
    setAddToTripExternalLink,
    addToTripTravelDocs,
    setAddToTripTravelDocs,
    appendItemToTrip,
    openAddToTripFromMapMarker,
    openAddToTripFromAiPlace,
    openAddStayToTrip,
    onCloseAddToTrip,
    handleAddToTripSubmit,
  };
}
