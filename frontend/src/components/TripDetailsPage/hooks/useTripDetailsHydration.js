import { useEffect } from 'react';

export function useTripDetailsHydration({
  tripId,
  tripData,
  setTripExpenseItems,
  setGeneralNotes,
  setGeneralAttachments,
  hydratedTripItemsForIdRef,
}) {
  useEffect(() => {
    if (!tripData) return;

    const persistedItems = Array.isArray(tripData?.tripExpenseItems)
      ? tripData.tripExpenseItems.map((item) => ({
        ...item,
        attachments: Array.isArray(item?.attachments) ? item.attachments : [],
      }))
      : [];

    setTripExpenseItems(persistedItems);
    setGeneralNotes(String(tripData?.generalNotes ?? tripData?.overview ?? ''));
    setGeneralAttachments(Array.isArray(tripData?.generalAttachments) ? tripData.generalAttachments : []);
    hydratedTripItemsForIdRef.current = tripId;
  }, [
    tripId,
    tripData,
    setTripExpenseItems,
    setGeneralNotes,
    setGeneralAttachments,
    hydratedTripItemsForIdRef,
  ]);
}
