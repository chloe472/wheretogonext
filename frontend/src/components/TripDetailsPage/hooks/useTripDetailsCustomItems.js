import { useCallback, useState } from 'react';
import { Camera, UtensilsCrossed } from 'lucide-react';
import { convertCurrencyToUsd, findTimeOverlapItem, createAttachmentFromFile } from '../lib/tripDetailsPageHelpers';

function fileToDataUrl(file) {
  if (!(file instanceof File)) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

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
  const [customPlaceCost, setCustomPlaceCost] = useState('');
  const [customFoodCost, setCustomFoodCost] = useState('');
  const [customPlaceImage, setCustomPlaceImage] = useState(null);
  const [customFoodImage, setCustomFoodImage] = useState(null);
  const [customPlaceTravelDocs, setCustomPlaceTravelDocs] = useState([]);
  const [customFoodTravelDocs, setCustomFoodTravelDocs] = useState([]);

  const onCloseAddCustomPlace = useCallback(() => {
    setAddCustomPlaceOpen(false);
  }, []);

  const handleAddCustomPlaceSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const costNum = parseFloat(customPlaceCost) || 0;
      const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
      const [fallbackLat, fallbackLng] = mapCenter;
      const resolvedAddress = customPlaceAddressSelection ?? {
        name: customPlaceAddress,
        address: customPlaceAddress,
        lat: fallbackLat,
        lng: fallbackLng,
        source: 'Manual input',
      };
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

      let placeImageUrl = '';
      try {
        placeImageUrl = await fileToDataUrl(customPlaceImage);
      } catch {
        showInAppNotice('Could not read the selected image. Please try another file.', 'warning');
      }

      // Handle travel docs: convert files to attachments
      const attachments = customPlaceTravelDocs.map((f) => createAttachmentFromFile(f));

      setTripExpenseItems((prev) => [
        ...prev,
        {
          id: `place-${Date.now()}`,
          name: customPlaceName,
          total: costNumUsd,
          categoryId: 'places',
          category: 'Places',
          date: customPlaceDateKey,
          detail: resolvedAddress?.address || customPlaceAddress || 'Custom place',
          Icon: Camera,
          lat: resolvedAddress?.lat ?? fallbackLat,
          lng: resolvedAddress?.lng ?? fallbackLng,
          notes: customPlaceNote || '',
          attachments,
          startTime: customPlaceStartTime,
          durationHrs: customPlaceDurationHrs,
          durationMins: customPlaceDurationMins,
          externalLink: '',
          placeImageUrl,
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
      customPlaceAddress,
      mapCenter,
      tripExpenseItems,
      customPlaceDateKey,
      customPlaceStartTime,
      customPlaceDurationHrs,
      customPlaceDurationMins,
      customPlaceName,
      customPlaceNote,
      customPlaceImage,
      customPlaceTravelDocs,
      showInAppNotice,
      setTripExpenseItems,
    ],
  );

  const onCloseAddCustomFood = useCallback(() => {
    setAddCustomFoodOpen(false);
  }, []);

  const handleAddCustomFoodSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const costNum = parseFloat(customFoodCost) || 0;
      const costNumUsd = convertCurrencyToUsd(costNum, currency, exchangeRates);
      const [fallbackLat, fallbackLng] = mapCenter;
      const resolvedAddress = customFoodAddressSelection ?? {
        name: customFoodAddress,
        address: customFoodAddress,
        lat: fallbackLat,
        lng: fallbackLng,
        source: 'Manual input',
      };
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

      let placeImageUrl = '';
      try {
        placeImageUrl = await fileToDataUrl(customFoodImage);
      } catch {
        showInAppNotice('Could not read the selected image. Please try another file.', 'warning');
      }

      // Handle travel docs: convert files to attachments
      const attachments = customFoodTravelDocs.map((f) => createAttachmentFromFile(f));

      setTripExpenseItems((prev) => [
        ...prev,
        {
          id: `food-${Date.now()}`,
          name: customFoodName,
          total: costNumUsd,
          categoryId: 'food',
          category: 'Food & Beverage',
          date: customFoodDateKey,
          detail: resolvedAddress?.address || customFoodAddress || 'Custom food & beverage',
          Icon: UtensilsCrossed,
          lat: resolvedAddress?.lat ?? fallbackLat,
          lng: resolvedAddress?.lng ?? fallbackLng,
          notes: customFoodNote || '',
          attachments,
          startTime: customFoodStartTime,
          durationHrs: customFoodDurationHrs,
          durationMins: customFoodDurationMins,
          externalLink: '',
          placeImageUrl,
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
      customFoodAddress,
      mapCenter,
      tripExpenseItems,
      customFoodDateKey,
      customFoodStartTime,
      customFoodDurationHrs,
      customFoodDurationMins,
      customFoodName,
      customFoodNote,
      customFoodImage,
      customFoodTravelDocs,
      showInAppNotice,
      setTripExpenseItems,
    ],
  );

  return {
    addCustomPlaceOpen,
    setAddCustomPlaceOpen,
    addCustomFoodOpen,
    setAddCustomFoodOpen,
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
    onCloseAddCustomPlace,
    handleAddCustomPlaceSubmit,
    onCloseAddCustomFood,
    handleAddCustomFoodSubmit,
  };
}
