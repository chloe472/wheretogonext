import { useCallback, useState } from 'react';
import { Camera, Ticket, UtensilsCrossed } from 'lucide-react';
import { searchAddressSuggestions } from '../lib/tripDetailsLocationData';
import { convertCurrencyToUsd, findTimeOverlapItem } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsCustomItems({
  mapCenter,
  trip,
  tripExpenseItems,
  setTripExpenseItems,
  currency,
  exchangeRates,
  showInAppNotice,
}) {
  const [addCustomPlaceOpen, setAddCustomPlaceOpen] = useState(false);
  const [addCustomFoodOpen, setAddCustomFoodOpen] = useState(false);
  const [addCustomExperienceOpen, setAddCustomExperienceOpen] = useState(false);

  const [customPlaceName, setCustomPlaceName] = useState('');
  const [customPlaceAddress, setCustomPlaceAddress] = useState('');
  const [customPlaceAddressSelection, setCustomPlaceAddressSelection] = useState(null);
  const [customPlaceAddressSuggestionsOpen, setCustomPlaceAddressSuggestionsOpen] = useState(false);
  const [customFoodName, setCustomFoodName] = useState('');
  const [customFoodAddress, setCustomFoodAddress] = useState('');
  const [customFoodAddressSelection, setCustomFoodAddressSelection] = useState(null);
  const [customFoodAddressSuggestionsOpen, setCustomFoodAddressSuggestionsOpen] = useState(false);
  const [customPlaceDateKey, setCustomPlaceDateKey] = useState('');
  const [customFoodDateKey, setCustomFoodDateKey] = useState('');
  const [customPlaceStartTime, setCustomPlaceStartTime] = useState('07:00');
  const [customFoodStartTime, setCustomFoodStartTime] = useState('07:00');
  const [customPlaceDurationHrs, setCustomPlaceDurationHrs] = useState(1);
  const [customFoodDurationHrs, setCustomFoodDurationHrs] = useState(1);
  const [customPlaceDurationMins, setCustomPlaceDurationMins] = useState(0);
  const [customFoodDurationMins, setCustomFoodDurationMins] = useState(0);
  const [customPlaceNote, setCustomPlaceNote] = useState('');
  const [customFoodNote, setCustomFoodNote] = useState('');
  const [customExperienceName, setCustomExperienceName] = useState('');
  const [customExperienceType, setCustomExperienceType] = useState('Attraction');
  const [customExperienceAddress, setCustomExperienceAddress] = useState('');
  const [customExperienceDateKey, setCustomExperienceDateKey] = useState('');
  const [customExperienceStartTime, setCustomExperienceStartTime] = useState('07:00');
  const [customExperienceDurationHrs, setCustomExperienceDurationHrs] = useState(2);
  const [customExperienceDurationMins, setCustomExperienceDurationMins] = useState(0);
  const [customExperienceNote, setCustomExperienceNote] = useState('');
  const [customExperienceCost, setCustomExperienceCost] = useState('');
  const [customExperienceExternalLink, setCustomExperienceExternalLink] = useState('');
  const [customExperienceTravelDocs, setCustomExperienceTravelDocs] = useState([]);
  const [customPlaceCost, setCustomPlaceCost] = useState('');
  const [customFoodCost, setCustomFoodCost] = useState('');
  const [customPlaceImage, setCustomPlaceImage] = useState(null);
  const [customFoodImage, setCustomFoodImage] = useState(null);
  const [customPlaceTravelDocs, setCustomPlaceTravelDocs] = useState([]);
  const [customFoodTravelDocs, setCustomFoodTravelDocs] = useState([]);

  const onCloseAddCustomExperience = useCallback(() => {
    setAddCustomExperienceOpen(false);
  }, []);

  const handleAddCustomExperienceSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const [fallbackLat, fallbackLng] = mapCenter;
      const costNum = parseFloat(customExperienceCost) || 0;
      const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
      const overlapping = findTimeOverlapItem(tripExpenseItems, {
        date: customExperienceDateKey,
        startTime: customExperienceStartTime,
        durationHrs: customExperienceDurationHrs,
        durationMins: customExperienceDurationMins,
      });
      if (overlapping) {
        showInAppNotice(`Time overlaps with ${overlapping.name}. Please choose another time slot.`, 'warning');
        return;
      }
      setTripExpenseItems((prev) => [
        ...prev,
        {
          id: `experience-${Date.now()}`,
          name: customExperienceName,
          total: costNumUsd,
          categoryId: 'experiences',
          category: 'Experience',
          date: customExperienceDateKey,
          detail: `${customExperienceType} · ${customExperienceAddress}`,
          Icon: Ticket,
          lat: fallbackLat,
          lng: fallbackLng,
          notes: customExperienceNote || '',
          attachments: customExperienceTravelDocs.map((file, idx) => ({
            id: `experience-doc-${Date.now()}-${idx}`,
            name: file?.name || `Document ${idx + 1}`,
            size: file?.size || 0,
            type: file?.type || '',
          })),
          startTime: customExperienceStartTime,
          durationHrs: customExperienceDurationHrs,
          durationMins: customExperienceDurationMins,
          externalLink: customExperienceExternalLink || '',
          placeImageUrl: '',
        },
      ]);
      showInAppNotice(`Added ${customExperienceName || 'experience'} to your trip.`, 'success');
      setAddCustomExperienceOpen(false);
    },
    [
      mapCenter,
      customExperienceCost,
      currency,
      exchangeRates,
      tripExpenseItems,
      customExperienceDateKey,
      customExperienceStartTime,
      customExperienceDurationHrs,
      customExperienceDurationMins,
      customExperienceName,
      customExperienceType,
      customExperienceAddress,
      customExperienceNote,
      customExperienceExternalLink,
      customExperienceTravelDocs,
      showInAppNotice,
      setTripExpenseItems,
    ],
  );

  const onCloseAddCustomPlace = useCallback(() => {
    setAddCustomPlaceOpen(false);
  }, []);

  const handleAddCustomPlaceSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const costNum = parseFloat(customPlaceCost) || 0;
      const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
      const resolvedAddress =
        customPlaceAddressSelection ??
        searchAddressSuggestions(trip.destination || trip.locations, customPlaceAddress)[0];
      const [fallbackLat, fallbackLng] = mapCenter;
      const overlapping = findTimeOverlapItem(tripExpenseItems, {
        date: customPlaceDateKey,
        startTime: customPlaceStartTime,
        durationHrs: customPlaceDurationHrs,
        durationMins: customPlaceDurationMins,
      });
      if (overlapping) {
        showInAppNotice(`Time overlaps with ${overlapping.name}. Please choose another time slot.`, 'warning');
        return;
      }
      setTripExpenseItems((prev) => [
        ...prev,
        {
          id: `place-${Date.now()}`,
          name: customPlaceName,
          total: costNumUsd,
          categoryId: 'places',
          category: 'Places',
          date: customPlaceDateKey,
          detail:
            resolvedAddress?.address && resolvedAddress.address !== 'Custom location'
              ? resolvedAddress.address
              : (customPlaceAddress || 'Custom place'),
          Icon: Camera,
          lat: resolvedAddress?.lat ?? fallbackLat,
          lng: resolvedAddress?.lng ?? fallbackLng,
          notes: customPlaceNote || '',
          attachments: [],
          startTime: customPlaceStartTime,
          durationHrs: customPlaceDurationHrs,
          durationMins: customPlaceDurationMins,
          externalLink: '',
          placeImageUrl: '',
          rating: null,
          reviewCount: null,
        },
      ]);
      showInAppNotice(`Added ${customPlaceName || 'place'} to your trip.`, 'success');
      setAddCustomPlaceOpen(false);
      setCustomPlaceName('');
      setCustomPlaceAddress('');
      setCustomPlaceAddressSelection(null);
      setCustomPlaceAddressSuggestionsOpen(false);
      setCustomPlaceCost('');
      setCustomPlaceNote('');
      setCustomPlaceImage(null);
      setCustomPlaceTravelDocs([]);
      setCustomPlaceStartTime('07:00');
      setCustomPlaceDurationHrs(1);
      setCustomPlaceDurationMins(0);
    },
    [
      customPlaceCost,
      currency,
      exchangeRates,
      customPlaceAddressSelection,
      trip,
      customPlaceAddress,
      mapCenter,
      tripExpenseItems,
      customPlaceDateKey,
      customPlaceStartTime,
      customPlaceDurationHrs,
      customPlaceDurationMins,
      customPlaceName,
      customPlaceNote,
      showInAppNotice,
      setTripExpenseItems,
    ],
  );

  const onCloseAddCustomFood = useCallback(() => {
    setAddCustomFoodOpen(false);
  }, []);

  const handleAddCustomFoodSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const costNum = parseFloat(customFoodCost) || 0;
      const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
      const resolvedAddress =
        customFoodAddressSelection ??
        searchAddressSuggestions(trip.destination || trip.locations, customFoodAddress, 'custom-food')[0];
      const [fallbackLat, fallbackLng] = mapCenter;
      const overlapping = findTimeOverlapItem(tripExpenseItems, {
        date: customFoodDateKey,
        startTime: customFoodStartTime,
        durationHrs: customFoodDurationHrs,
        durationMins: customFoodDurationMins,
      });
      if (overlapping) {
        showInAppNotice(`Time overlaps with ${overlapping.name}. Please choose another time slot.`, 'warning');
        return;
      }
      setTripExpenseItems((prev) => [
        ...prev,
        {
          id: `food-${Date.now()}`,
          name: customFoodName,
          total: costNumUsd,
          categoryId: 'food',
          category: 'Food & Beverage',
          date: customFoodDateKey,
          detail:
            resolvedAddress?.address && resolvedAddress.address !== 'Custom location'
              ? resolvedAddress.address
              : (customFoodAddress || 'Custom food & beverage'),
          Icon: UtensilsCrossed,
          lat: resolvedAddress?.lat ?? fallbackLat,
          lng: resolvedAddress?.lng ?? fallbackLng,
          notes: customFoodNote || '',
          attachments: [],
          startTime: customFoodStartTime,
          durationHrs: customFoodDurationHrs,
          durationMins: customFoodDurationMins,
          externalLink: '',
          placeImageUrl: '',
          rating: null,
          reviewCount: null,
        },
      ]);
      showInAppNotice(`Added ${customFoodName || 'food & beverage'} to your trip.`, 'success');
      setAddCustomFoodOpen(false);
      setCustomFoodName('');
      setCustomFoodAddress('');
      setCustomFoodAddressSelection(null);
      setCustomFoodAddressSuggestionsOpen(false);
      setCustomFoodCost('');
      setCustomFoodNote('');
      setCustomFoodImage(null);
      setCustomFoodTravelDocs([]);
      setCustomFoodStartTime('07:00');
      setCustomFoodDurationHrs(1);
      setCustomFoodDurationMins(0);
    },
    [
      customFoodCost,
      currency,
      exchangeRates,
      customFoodAddressSelection,
      trip,
      customFoodAddress,
      mapCenter,
      tripExpenseItems,
      customFoodDateKey,
      customFoodStartTime,
      customFoodDurationHrs,
      customFoodDurationMins,
      customFoodName,
      customFoodNote,
      showInAppNotice,
      setTripExpenseItems,
    ],
  );

  return {
    addCustomPlaceOpen,
    setAddCustomPlaceOpen,
    addCustomFoodOpen,
    setAddCustomFoodOpen,
    addCustomExperienceOpen,
    setAddCustomExperienceOpen,
    customPlaceName,
    setCustomPlaceName,
    customPlaceAddress,
    setCustomPlaceAddress,
    customPlaceAddressSelection,
    setCustomPlaceAddressSelection,
    customPlaceAddressSuggestionsOpen,
    setCustomPlaceAddressSuggestionsOpen,
    customFoodName,
    setCustomFoodName,
    customFoodAddress,
    setCustomFoodAddress,
    customFoodAddressSelection,
    setCustomFoodAddressSelection,
    customFoodAddressSuggestionsOpen,
    setCustomFoodAddressSuggestionsOpen,
    customPlaceDateKey,
    setCustomPlaceDateKey,
    customFoodDateKey,
    setCustomFoodDateKey,
    customPlaceStartTime,
    setCustomPlaceStartTime,
    customFoodStartTime,
    setCustomFoodStartTime,
    customPlaceDurationHrs,
    setCustomPlaceDurationHrs,
    customFoodDurationHrs,
    setCustomFoodDurationHrs,
    customPlaceDurationMins,
    setCustomPlaceDurationMins,
    customFoodDurationMins,
    setCustomFoodDurationMins,
    customPlaceNote,
    setCustomPlaceNote,
    customFoodNote,
    setCustomFoodNote,
    customExperienceName,
    setCustomExperienceName,
    customExperienceType,
    setCustomExperienceType,
    customExperienceAddress,
    setCustomExperienceAddress,
    customExperienceDateKey,
    setCustomExperienceDateKey,
    customExperienceStartTime,
    setCustomExperienceStartTime,
    customExperienceDurationHrs,
    setCustomExperienceDurationHrs,
    customExperienceDurationMins,
    setCustomExperienceDurationMins,
    customExperienceNote,
    setCustomExperienceNote,
    customExperienceCost,
    setCustomExperienceCost,
    customExperienceExternalLink,
    setCustomExperienceExternalLink,
    customExperienceTravelDocs,
    setCustomExperienceTravelDocs,
    customPlaceCost,
    setCustomPlaceCost,
    customFoodCost,
    setCustomFoodCost,
    customPlaceImage,
    setCustomPlaceImage,
    customFoodImage,
    setCustomFoodImage,
    customPlaceTravelDocs,
    setCustomPlaceTravelDocs,
    customFoodTravelDocs,
    setCustomFoodTravelDocs,
    onCloseAddCustomExperience,
    handleAddCustomExperienceSubmit,
    onCloseAddCustomPlace,
    handleAddCustomPlaceSubmit,
    onCloseAddCustomFood,
    handleAddCustomFoodSubmit,
  };
}
