import { useCallback, useEffect, useState } from 'react';
import { Camera, UtensilsCrossed } from 'lucide-react';
import { loadGoogleMapsScript } from '../../../lib/loadGoogleMaps';
import {
  convertCurrencyToUsd,
  findTimeOverlapItem,
  createAttachmentFromFile,
  getDefaultStartTimeForDate,
} from '../lib/tripDetailsPageHelpers';

function fileToDataUrl(file) {
  if (!(file instanceof File)) return Promise.resolve('');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

async function geocodeAddressWithGoogle(address) {
  const q = String(address || '').trim();
  if (!q) return null;

  try {
    if (!window.google?.maps?.Geocoder) {
      await loadGoogleMapsScript();
    }
  } catch {
    
  }

  if (!window.google?.maps?.Geocoder) return null;

  return new Promise((resolve) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: q }, (results, status) => {
      const okStatus = window.google?.maps?.GeocoderStatus?.OK || 'OK';
      if (status !== okStatus && status !== 'OK') {
        resolve(null);
        return;
      }
      const loc = results?.[0]?.geometry?.location;
      if (!loc || typeof loc.lat !== 'function' || typeof loc.lng !== 'function') {
        resolve(null);
        return;
      }
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

async function geocodeAddressWithOpenMeteo(address) {
  const q = String(address || '').trim();
  if (!q) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=1&language=en&format=json`;

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const first = Array.isArray(data?.results) ? data.results[0] : null;
    if (!first || typeof first.latitude !== 'number' || typeof first.longitude !== 'number') return null;
    return { lat: first.latitude, lng: first.longitude };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function resolveCoordsFromPlaceId(placeId) {
  const id = String(placeId || '').trim();
  if (!id) return null;

  try {
    if (!window.google?.maps?.places?.PlacesService) {
      await loadGoogleMapsScript();
    }
  } catch {
    return null;
  }

  if (!window.google?.maps?.places?.PlacesService) return null;

  return new Promise((resolve) => {
    const div = document.createElement('div');
    div.style.display = 'none';
    document.body.appendChild(div);
    const service = new window.google.maps.places.PlacesService(div);

    service.getDetails({ placeId: id, fields: ['geometry.location'] }, (result, status) => {
      try {
        div.remove();
      } catch {
        
      }

      if (status !== window.google.maps.places.PlacesServiceStatus.OK) {
        resolve(null);
        return;
      }
      const loc = result?.geometry?.location;
      if (!loc || typeof loc.lat !== 'function' || typeof loc.lng !== 'function') {
        resolve(null);
        return;
      }
      resolve({ lat: loc.lat(), lng: loc.lng() });
    });
  });
}

async function resolveAddressCoordinates(address, existingSelection, fallbackLat, fallbackLng) {
  const selectedLat = existingSelection?.lat;
  const selectedLng = existingSelection?.lng;
  if (Number.isFinite(selectedLat) && Number.isFinite(selectedLng)) {
    return { lat: selectedLat, lng: selectedLng };
  }

  const placeIdCoords = await resolveCoordsFromPlaceId(existingSelection?.id);
  if (placeIdCoords) return placeIdCoords;

  const googleCoords = await geocodeAddressWithGoogle(address);
  if (googleCoords) return googleCoords;

  const openMeteoCoords = await geocodeAddressWithOpenMeteo(address);
  if (openMeteoCoords) return openMeteoCoords;

  return { lat: fallbackLat, lng: fallbackLng };
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

  useEffect(() => {
    if (!customPlaceDateKey) return;
    const desiredMinutes = (Number(customPlaceDurationHrs) || 0) * 60 + (Number(customPlaceDurationMins) || 0);
    const next = getDefaultStartTimeForDate(tripExpenseItems, customPlaceDateKey, '07:00', desiredMinutes || 60);
    setCustomPlaceStartTime(next);
  }, [customPlaceDateKey, customPlaceDurationHrs, customPlaceDurationMins, tripExpenseItems]);

  useEffect(() => {
    if (!customFoodDateKey) return;
    const desiredMinutes = (Number(customFoodDurationHrs) || 0) * 60 + (Number(customFoodDurationMins) || 0);
    const next = getDefaultStartTimeForDate(tripExpenseItems, customFoodDateKey, '07:00', desiredMinutes || 60);
    setCustomFoodStartTime(next);
  }, [customFoodDateKey, customFoodDurationHrs, customFoodDurationMins, tripExpenseItems]);

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
      const resolvedCoords = await resolveAddressCoordinates(
        customPlaceAddress || resolvedAddress?.address,
        resolvedAddress,
        fallbackLat,
        fallbackLng,
      );
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
          lat: resolvedCoords.lat,
          lng: resolvedCoords.lng,
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
      const resolvedCoords = await resolveAddressCoordinates(
        customFoodAddress || resolvedAddress?.address,
        resolvedAddress,
        fallbackLat,
        fallbackLng,
      );
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
          lat: resolvedCoords.lat,
          lng: resolvedCoords.lng,
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
