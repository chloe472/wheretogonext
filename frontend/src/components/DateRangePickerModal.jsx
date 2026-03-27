import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import './DateRangePickerModal.css';

const WHEN_DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDateRangeLabel(startDate, endDate) {
  if (!startDate || !endDate) return '';
  const s = new Date(startDate);
  const e = new Date(endDate);
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = Math.round((e - s) / (24 * 60 * 60 * 1000)) + 1;
  return `${dayNames[s.getDay()]}, ${s.getDate()} ${MONTH_SHORT[s.getMonth()]} - ${dayNames[e.getDay()]}, ${e.getDate()} ${MONTH_SHORT[e.getMonth()]} - ${days} days`;
}

function toDateKeyLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseDateKey(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function monthKeyFromDate(date) {
  if (!date) return '';
  return `${date.getFullYear()}-${date.getMonth()}`;
}

function inSelectedRange(dateStr, rangeStart, rangeEnd) {
  if (!rangeStart || !rangeEnd) return false;
  const date = parseDateKey(dateStr);
  const start = parseDateKey(rangeStart);
  const end = parseDateKey(rangeEnd);
  if (!date || !start || !end) return false;
  const t = date.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

function getWhenCalendarCells(year, month, rangeStart, rangeEnd) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startOffset = first.getDay();
  const cells = [];
  const prevMonth = new Date(year, month, 0);
  const prevCount = prevMonth.getDate();
  for (let i = 0; i < startOffset; i++) {
    const d = prevCount - startOffset + i + 1;
    const date = new Date(year, month - 1, d);
    const dateStr = toDateKeyLocal(date);
    cells.push({
      dateStr,
      day: d,
      currentMonth: false,
      isStart: dateStr === rangeStart,
      isEnd: dateStr === rangeEnd,
      inRange: inSelectedRange(dateStr, rangeStart, rangeEnd),
    });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({
      dateStr,
      day: d,
      currentMonth: true,
      isStart: dateStr === rangeStart,
      isEnd: dateStr === rangeEnd,
      inRange: inSelectedRange(dateStr, rangeStart, rangeEnd),
    });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const dateStr = toDateKeyLocal(date);
    cells.push({
      dateStr,
      day: d,
      currentMonth: false,
      isStart: dateStr === rangeStart,
      isEnd: dateStr === rangeEnd,
      inRange: inSelectedRange(dateStr, rangeStart, rangeEnd),
    });
  }
  return cells;
}

export default function DateRangePickerModal({
  open,
  start = null,
  end = null,
  onApply,
  onClose,
  title = 'When',
  displayStartForMonth = null,
}) {
  const [modalStart, setModalStart] = useState(start);
  const [modalEnd, setModalEnd] = useState(end);
  const [viewAnchor, setViewAnchor] = useState(null);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const lastDateClickRef = useRef({ dateStr: '', at: 0 });

  useEffect(() => {
    if (open) {
      setModalStart(start);
      setModalEnd(end);
      setViewAnchor(displayStartForMonth ?? start ?? toDateKeyLocal(new Date()));
      setCalendarOffset(0);
    }
  }, [open, start, end, displayStartForMonth]);

  const baseDate = parseDateKey(viewAnchor) ?? new Date();
  const visibleMonthKeys = new Set(
    [0, 1].map((i) => {
      const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarOffset + i, 1);
      return monthKeyFromDate(d);
    }),
  );

  const handleDateClick = (dateStr) => {
    const now = Date.now();
    if (
      lastDateClickRef.current.dateStr === dateStr
      && now - lastDateClickRef.current.at < 250
    ) {
      return;
    }
    lastDateClickRef.current = { dateStr, at: now };

    if (modalStart && modalEnd) {
      setModalStart(dateStr);
      setModalEnd(null);
      return;
    }
    if (!modalStart) {
      setModalStart(dateStr);
      return;
    }
    if (dateStr < modalStart) {
      setModalEnd(modalStart);
      setModalStart(dateStr);
    } else {
      setModalEnd(dateStr);
    }
  };

  const handleDone = () => {
    const s = modalStart;
    const e = modalEnd ?? modalStart;
    if (s && e && s <= e) {
      onApply(s, e);
    }
    onClose();
  };

  const handleClear = () => {
    setModalStart(null);
    setModalEnd(null);
  };

  if (!open) return null;

  return (
    <>
      <button type="button" className="date-range-modal__backdrop" aria-label="Close" onClick={onClose} />
      <div className="date-range-modal" role="dialog" aria-labelledby="date-range-modal-title" aria-modal="true">
        <div className="date-range-modal__head">
          <div>
            <h2 id="date-range-modal-title" className="date-range-modal__title">{title}</h2>
            <p className="date-range-modal__subtitle">
              {formatDateRangeLabel(modalStart, modalEnd ?? modalStart) || 'Select start and end date'}
            </p>
          </div>
          <button type="button" className="date-range-modal__close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="date-range-modal__nav">
          <button type="button" className="date-range-modal__nav-btn" aria-label="Previous months" onClick={() => setCalendarOffset((o) => o - 1)}>
            <ChevronLeft size={20} aria-hidden />
          </button>
          <div className="date-range-modal__nav-months">
            {[0, 1].map((i) => {
              const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarOffset + i, 1);
              return (
                <span key={i} className="date-range-modal__nav-month">{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</span>
              );
            })}
          </div>
          <button type="button" className="date-range-modal__nav-btn" aria-label="Next months" onClick={() => setCalendarOffset((o) => o + 1)}>
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <div className="date-range-modal__calendars">
          {[0, 1].map((i) => {
            const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + calendarOffset + i, 1);
            const y = d.getFullYear();
            const m = d.getMonth();
            const cells = getWhenCalendarCells(y, m, modalStart, modalEnd ?? modalStart);
            return (
              <div key={i} className="date-range-modal__calendar">
                <div className="date-range-modal__weekdays">
                  {WHEN_DAY_LABELS.map((l) => (
                    <span key={l} className="date-range-modal__weekday">{l}</span>
                  ))}
                </div>
                <div className="date-range-modal__grid">
                  {cells.map((cell) => (
                    (() => {
                      const cellDate = parseDateKey(cell.dateStr);
                      const cellMonthKey = monthKeyFromDate(cellDate);
                      const duplicatedInVisiblePanels = !cell.currentMonth && visibleMonthKeys.has(cellMonthKey);
                      const showRange = cell.inRange && !duplicatedInVisiblePanels;
                      const showEnd = (cell.isStart || cell.isEnd) && !duplicatedInVisiblePanels;
                      return (
                        <button
                          key={`${cell.dateStr}-${cell.currentMonth ? 'cur' : 'other'}-${i}`}
                          type="button"
                          className={`date-range-modal__cell ${!cell.currentMonth ? 'date-range-modal__cell--other' : ''} ${showEnd ? 'date-range-modal__cell--end' : ''} ${showRange ? 'date-range-modal__cell--range' : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDateClick(cell.dateStr);
                          }}
                          onDoubleClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          {cell.day}
                        </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="date-range-modal__actions">
          <button type="button" className="date-range-modal__clear" onClick={handleClear}>Clear dates</button>
          <button type="button" className="date-range-modal__done" onClick={handleDone}>Done</button>
        </div>
      </div>
    </>
  );
}
