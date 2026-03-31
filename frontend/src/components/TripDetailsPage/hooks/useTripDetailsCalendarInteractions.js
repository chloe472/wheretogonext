import { useCallback, useRef, useState } from 'react';
import {
  CALENDAR_DRAG_SNAP_MINS,
  CALENDAR_ROW_HEIGHT,
  clamp,
  durationMinutesToParts,
  getCalendarDropStartTime,
  timeToMinutes,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsCalendarInteractions({ setTripExpenseItems }) {
  const [calendarDraggingItemId, setCalendarDraggingItemId] = useState(null);
  const [calendarResizingItemId, setCalendarResizingItemId] = useState(null);
  const [calendarDragOverDayNum, setCalendarDragOverDayNum] = useState(null);
  const calendarResizeSessionRef = useRef(null);

  const handleCalendarDragStart = useCallback((e, itemId) => {
    setCalendarDraggingItemId(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(itemId));
  }, []);

  const handleCalendarDragEnd = useCallback(() => {
    setCalendarDraggingItemId(null);
    setCalendarDragOverDayNum(null);
  }, []);

  const handleCalendarDayDragOver = useCallback((e, dayNum) => {
    setCalendarDragOverDayNum((currentDragging) => {
      if (calendarDraggingItemId == null) return currentDragging;
      return dayNum;
    });
    if (!calendarDraggingItemId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, [calendarDraggingItemId]);

  const handleCalendarDayDrop = useCallback((e, day) => {
    const dragId = calendarDraggingItemId || e.dataTransfer.getData('text/plain');
    if (!dragId) return;

    e.preventDefault();
    const startTime = getCalendarDropStartTime(e.clientY, e.currentTarget.getBoundingClientRect());
    setTripExpenseItems((prev) => prev.map((it) => (
      String(it.id) === String(dragId)
        ? { ...it, date: day.date, startTime }
        : it
    )));

    setCalendarDraggingItemId(null);
    setCalendarDragOverDayNum(null);
  }, [calendarDraggingItemId, setTripExpenseItems]);

  const handleCalendarResizeStart = useCallback((e, item) => {
    e.preventDefault();
    e.stopPropagation();
    const startDuration = Math.max(
      CALENDAR_DRAG_SNAP_MINS,
      (Number(item.durationHrs ?? 0) * 60) + Number(item.durationMins ?? 0),
    );
    calendarResizeSessionRef.current = {
      itemId: item.id,
      startClientY: e.clientY,
      startDuration,
      startMinutes: timeToMinutes(item.startTime || '00:00'),
    };
    setCalendarResizingItemId(item.id);

    const onMouseMove = (moveEvent) => {
      const session = calendarResizeSessionRef.current;
      if (!session) return;
      const deltaRaw = ((moveEvent.clientY - session.startClientY) / CALENDAR_ROW_HEIGHT) * 60;
      const snappedDelta = Math.round(deltaRaw / CALENDAR_DRAG_SNAP_MINS) * CALENDAR_DRAG_SNAP_MINS;
      const maxDuration = Math.max(
        CALENDAR_DRAG_SNAP_MINS,
        (24 * 60) - session.startMinutes,
      );
      const nextDuration = clamp(
        session.startDuration + snappedDelta,
        CALENDAR_DRAG_SNAP_MINS,
        maxDuration,
      );
      const { durationHrs, durationMins } = durationMinutesToParts(nextDuration);
      setTripExpenseItems((prev) => prev.map((it) => (
        String(it.id) === String(session.itemId)
          ? { ...it, durationHrs, durationMins }
          : it
      )));
    };

    const onMouseUp = () => {
      calendarResizeSessionRef.current = null;
      setCalendarResizingItemId(null);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [setTripExpenseItems]);

  return {
    calendarDraggingItemId,
    calendarResizingItemId,
    calendarDragOverDayNum,
    setCalendarDragOverDayNum,
    handleCalendarDragStart,
    handleCalendarDragEnd,
    handleCalendarDayDragOver,
    handleCalendarDayDrop,
    handleCalendarResizeStart,
  };
}
