import { useCallback } from 'react';
import { Camera, UtensilsCrossed } from 'lucide-react';
import { resolveImageUrl } from '../../../lib/imageFallback';
import {
  durationMinutesToParts,
  resolveSmartDurationMinutes,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsBulkItineraryAdd({
  days,
  cityQuery,
  tripExpenseItems,
  setTripExpenseItems,
  showInAppNotice,
}) {
  return useCallback((itineraryPlaces = []) => {
    if (!Array.isArray(itineraryPlaces) || itineraryPlaces.length === 0) {
      showInAppNotice('No places found in this itinerary.', 'warning');
      return;
    }

    const normalize = (value) => String(value || '').trim().toLowerCase();
    const dayDateByNum = new Map((days || []).map((d) => [Number(d.dayNum), d.date]));
    const nonFoodCountsByDay = new Map();
    const foodCountsByDay = new Map();
    const mealCycleByDay = ['breakfast', 'lunch', 'dinner'];
    const mealStartMinutes = {
      breakfast: 8 * 60,
      lunch: (12 * 60) + 30,
      dinner: 19 * 60,
    };
    const defaultNonFoodStartMinutes = [
      (9 * 60) + 30,
      11 * 60,
      14 * 60,
      16 * 60,
      (17 * 60) + 30,
    ];

    const minutesToTime = (mins) => {
      const safe = Math.max(0, Math.min(23 * 60 + 59, Math.round(Number(mins) || 0)));
      const h = String(Math.floor(safe / 60)).padStart(2, '0');
      const m = String(safe % 60).padStart(2, '0');
      return `${h}:${m}`;
    };

    const existingKeys = new Set(
      (tripExpenseItems || []).map((item) => {
        const latKey = Number(item?.lat || 0).toFixed(4);
        const lngKey = Number(item?.lng || 0).toFixed(4);
        return `${normalize(item?.name)}|${String(item?.date || '')}|${latKey}|${lngKey}`;
      }),
    );

    const placesSorted = [...itineraryPlaces].sort((a, b) => Number(a?.dayNum || 1) - Number(b?.dayNum || 1));
    const toAppend = [];

    placesSorted.forEach((place, idx) => {
      const dayNum = Math.max(1, Number(place?.dayNum || 1));
      const fallbackDay = days[idx % Math.max(days.length, 1)]?.date || days[0]?.date || '';
      const itemDate = dayDateByNum.get(dayNum) || fallbackDay;
      const isFoodStop = String(place?.itemType || place?.category || '')
        .trim()
        .toLowerCase()
        .includes('food');

      let startTimeValue = '09:30';
      if (isFoodStop) {
        const foodSlot = foodCountsByDay.get(dayNum) || 0;
        foodCountsByDay.set(dayNum, foodSlot + 1);

        const anchorMeal = mealCycleByDay[(dayNum - 1) % mealCycleByDay.length];
        const mealOrder = anchorMeal === 'breakfast'
          ? ['breakfast', 'lunch', 'dinner']
          : anchorMeal === 'lunch'
            ? ['lunch', 'dinner', 'breakfast']
            : ['dinner', 'breakfast', 'lunch'];
        const selectedMeal = mealOrder[foodSlot % mealOrder.length];
        startTimeValue = minutesToTime(mealStartMinutes[selectedMeal]);
      } else {
        const nonFoodSlot = nonFoodCountsByDay.get(dayNum) || 0;
        nonFoodCountsByDay.set(dayNum, nonFoodSlot + 1);

        const base = defaultNonFoodStartMinutes[nonFoodSlot % defaultNonFoodStartMinutes.length];
        const overflow = Math.floor(nonFoodSlot / defaultNonFoodStartMinutes.length) * 90;
        startTimeValue = minutesToTime(base + overflow);
      }

      const latKey = Number(place?.lat || 0).toFixed(4);
      const lngKey = Number(place?.lng || 0).toFixed(4);
      const dedupeKey = `${normalize(place?.name)}|${String(itemDate || '')}|${latKey}|${lngKey}`;
      if (existingKeys.has(dedupeKey)) return;

      existingKeys.add(dedupeKey);
      const itemType = String(place?.itemType || '').toLowerCase() === 'food' ? 'food' : 'place';
      const categoryId = itemType === 'food' ? 'food' : 'places';
      const category = itemType === 'food' ? 'Food & Beverage' : 'Places';
      const icon = itemType === 'food' ? UtensilsCrossed : Camera;
      const estimatedDurationMinutes = Math.max(
        30,
        Number(place?.durationMinutes)
        || Number(place?.durationMinsTotal)
        || resolveSmartDurationMinutes(place),
      );
      const estimatedDurationParts = durationMinutesToParts(estimatedDurationMinutes);
      toAppend.push({
        id: `place-${place?.id || idx}-${Date.now()}-${idx}`,
        sourcePlaceId: place?.id || null,
        name: place?.name || `Place ${idx + 1}`,
        total: 0,
        categoryId,
        category,
        date: itemDate,
        detail: place?.address || place?.name || cityQuery,
        Icon: icon,
        lat: place?.lat,
        lng: place?.lng,
        notes: '',
        attachments: [],
        startTime: startTimeValue,
        durationHrs: estimatedDurationParts.durationHrs,
        durationMins: estimatedDurationParts.durationMins,
        externalLink: place?.website || '',
        placeImageUrl: resolveImageUrl(place?.image, place?.name, itemType === 'food' ? 'restaurant' : 'landmark'),
        rating: place?.rating,
        reviewCount: place?.reviewCount,
      });
    });

    if (toAppend.length === 0) {
      showInAppNotice('These itinerary places are already in your trip.', 'warning');
      return;
    }

    setTripExpenseItems((prev) => [...prev, ...toAppend]);
    showInAppNotice(`Added ${toAppend.length} stop${toAppend.length === 1 ? '' : 's'} to your itinerary page.`, 'success');
  }, [days, cityQuery, tripExpenseItems, setTripExpenseItems, showInAppNotice]);
}
