import { useCallback, useState } from 'react';

export function useTripDetailsAddSheet({
  days,
  openSocialImportForDay,
  setAddPlacesDay,
  setAddPlacesOpen,
  setAddFoodDay,
  setFoodSearchQuery,
  setFoodDietaryFilter,
  setFoodSortBy,
  setCustomFoodDateKey,
  setAddFoodOpen,
  setStaySearchQuery,
  setStayTypeFilter,
  setStayStarFilter,
  setStaySortBy,
  setAddStaysOpen,
  setAddTransportDay,
  setAddTransportOpen,
}) {
  const [addSheetDay, setAddSheetDay] = useState(null);
  const [addSheetFromCalendar, setAddSheetFromCalendar] = useState(false);
  const [addSheetAnchor, setAddSheetAnchor] = useState(null);

  const onCloseAddSheet = useCallback(() => {
    setAddSheetDay(null);
    setAddSheetFromCalendar(false);
    setAddSheetAnchor(null);
  }, []);

  const handleAddSheetOptionSelect = useCallback((id) => {
    if (id === 'place') {
      setAddPlacesDay(addSheetDay ?? 1);
      setAddPlacesOpen(true);
    } else if (id === 'food') {
      const day = days.find((d) => d.dayNum === (addSheetDay ?? 1));
      setAddFoodDay(addSheetDay ?? 1);
      setFoodSearchQuery('');
      setFoodDietaryFilter('All');
      setFoodSortBy('Recommended');
      setCustomFoodDateKey(day?.date || days[0]?.date || '');
      setAddFoodOpen(true);
    } else if (id === 'stays') {
      setStaySearchQuery('');
      setStayTypeFilter('All');
      setStayStarFilter('All');
      setStaySortBy('Recommended');
      setAddStaysOpen(true);
    } else if (id === 'transportation') {
      setAddTransportDay(addSheetDay ?? 1);
      setAddTransportOpen(true);
    } else if (id === 'social') {
      openSocialImportForDay(addSheetDay ?? 1);
    }

    setAddSheetDay(null);
    setAddSheetFromCalendar(false);
    setAddSheetAnchor(null);
  }, [
    addSheetDay,
    days,
    openSocialImportForDay,
    setAddPlacesDay,
    setAddPlacesOpen,
    setAddFoodDay,
    setFoodSearchQuery,
    setFoodDietaryFilter,
    setFoodSortBy,
    setCustomFoodDateKey,
    setAddFoodOpen,
    setStaySearchQuery,
    setStayTypeFilter,
    setStayStarFilter,
    setStaySortBy,
    setAddStaysOpen,
    setAddTransportDay,
    setAddTransportOpen,
  ]);

  return {
    addSheetDay,
    setAddSheetDay,
    addSheetFromCalendar,
    setAddSheetFromCalendar,
    addSheetAnchor,
    setAddSheetAnchor,
    onCloseAddSheet,
    handleAddSheetOptionSelect,
  };
}
