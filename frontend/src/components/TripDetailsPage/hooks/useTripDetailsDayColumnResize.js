import { useCallback, useRef } from 'react';
import {
  DAY_COLUMN_DEFAULT_WIDTH,
  DAY_COLUMN_MAX_WIDTH,
  DAY_COLUMN_MIN_WIDTH,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsDayColumnResize({ dayColumnWidths, setDayColumnWidths }) {
  const dayResizeSessionRef = useRef(null);

  const getDayColumnWidth = useCallback(
    (dayNum) => Number(dayColumnWidths[dayNum] || DAY_COLUMN_DEFAULT_WIDTH),
    [dayColumnWidths],
  );

  const getResizeClientX = useCallback((evt) => {
    if (evt?.touches?.[0]?.clientX != null) return Number(evt.touches[0].clientX);
    if (evt?.changedTouches?.[0]?.clientX != null) return Number(evt.changedTouches[0].clientX);
    return Number(evt?.clientX || 0);
  }, []);

  const beginDayColumnResize = useCallback((dayNum, event) => {
    event.preventDefault();
    event.stopPropagation();

    const startX = getResizeClientX(event);
    const startWidth = getDayColumnWidth(dayNum);
    dayResizeSessionRef.current = { dayNum, startX, startWidth };
    document.body.classList.add('trip-details--day-resizing');

    const handleResizeMove = (moveEvent) => {
      const session = dayResizeSessionRef.current;
      if (!session) return;
      const deltaX = getResizeClientX(moveEvent) - session.startX;
      const nextWidth = Math.max(
        DAY_COLUMN_MIN_WIDTH,
        Math.min(DAY_COLUMN_MAX_WIDTH, session.startWidth + deltaX),
      );
      setDayColumnWidths((prev) => ({ ...prev, [session.dayNum]: nextWidth }));
    };

    const handleResizeEnd = () => {
      dayResizeSessionRef.current = null;
      document.body.classList.remove('trip-details--day-resizing');
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
      window.removeEventListener('touchmove', handleResizeMove);
      window.removeEventListener('touchend', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
    window.addEventListener('touchmove', handleResizeMove, { passive: false });
    window.addEventListener('touchend', handleResizeEnd, { passive: false });
  }, [getResizeClientX, getDayColumnWidth, setDayColumnWidths]);

  return {
    getDayColumnWidth,
    beginDayColumnResize,
  };
}
