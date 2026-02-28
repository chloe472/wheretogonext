import { useState, useEffect } from 'react';
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
    const dateStr = date.toISOString().slice(0, 10);
    cells.push({ dateStr, day: d, currentMonth: false, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
  }
  for (let d = 1; d <= last.getDate(); d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    cells.push({ dateStr, day: d, currentMonth: true, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const date = new Date(year, month + 1, d);
    const dateStr = date.toISOString().slice(0, 10);
    cells.push({ dateStr, day: d, currentMonth: false, isStart: dateStr === rangeStart, isEnd: dateStr === rangeEnd, inRange: rangeStart && rangeEnd && dateStr >= rangeStart && dateStr <= rangeEnd });
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
  const [calendarOffset, setCalendarOffset] = useState(0);

  useEffect(() => {
    if (open) {
      setModalStart(start);
      setModalEnd(end);
      setCalendarOffset(0);
    }
  }, [open, start, end]);

  const displayStart = displayStartForMonth ?? modalStart ?? null;
  const baseDate = displayStart ? new Date(displayStart) : new Date();

  const handleDateClick = (dateStr) => {
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
                    <button
                      key={`${cell.dateStr}-${cell.currentMonth ? 'cur' : 'other'}-${i}`}
                      type="button"
                      className={`date-range-modal__cell ${!cell.currentMonth ? 'date-range-modal__cell--other' : ''} ${(cell.isStart || cell.isEnd) && cell.currentMonth ? 'date-range-modal__cell--end' : ''} ${cell.inRange ? 'date-range-modal__cell--range' : ''}`}
                      onClick={() => handleDateClick(cell.dateStr)}
                    >
                      {cell.day}
                    </button>
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
