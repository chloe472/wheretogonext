import { useEffect } from 'react';

export function useTripDetailsDayMenuOutsideClose({
  openDayMenuKey,
  setOpenDayMenuKey,
  setDayColorPickerDay,
}) {
  useEffect(() => {
    if (openDayMenuKey == null) return;

    function handleClickOutside(e) {
      if (e.target.closest('[data-day-menu]') == null) {
        setOpenDayMenuKey(null);
        setDayColorPickerDay(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDayMenuKey, setOpenDayMenuKey, setDayColorPickerDay]);
}
