import { Camera, Plus } from 'lucide-react';
import TripDetailsMapPanel from '../../TripDetailsMapPanel/TripDetailsMapPanel';
import {
  CALENDAR_DAY_COLUMN_DEFAULT_WIDTH,
  CALENDAR_GUTTER_WIDTH,
  CALENDAR_HOURS,
  CALENDAR_START_HOUR,
  DAY_COLUMN_MAX_WIDTH,
  DAY_COLUMN_MIN_WIDTH,
  formatTimeRange,
  getCalendarEventLayouts,
  getCalendarEventPosition,
  getCategoryStyle,
  isEditableItineraryItem,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsCalendarView({
  tripDestination,
  days,
  tripExpenseItems,
  calendarScrollLeft,
  setCalendarScrollLeft,
  calendarTimelineRef,
  calendarDragOverDayNum,
  setCalendarDragOverDayNum,
  handleCalendarDayDragOver,
  handleCalendarDayDrop,
  calendarDraggingItemId,
  calendarResizingItemId,
  handleCalendarDragStart,
  handleCalendarDragEnd,
  handleCalendarResizeStart,
  setEditPlaceItem,
  setAddSheetFromCalendar,
  setAddSheetDay,
  setAddSheetAnchor,
  mapPanelProps,
}) {
  const dayColumnWidth = Math.min(DAY_COLUMN_MAX_WIDTH, Math.max(DAY_COLUMN_MIN_WIDTH, CALENDAR_DAY_COLUMN_DEFAULT_WIDTH));
  const calendarColumnsWidth = dayColumnWidth * days.length;

  return (
    <div className="trip-details__calendar-view">
      <div className="trip-details__calendar-content">
        <>
          <div className="trip-details__calendar-day-tabs-row">
            <div className="trip-details__calendar-day-tabs-spacer" aria-hidden style={{ width: `${CALENDAR_GUTTER_WIDTH}px` }} />
            <div className="trip-details__calendar-day-tabs-viewport">
              <div
                className="trip-details__calendar-day-tabs"
                style={{ width: `${calendarColumnsWidth}px`, transform: `translateX(-${calendarScrollLeft}px)` }}
              >
                {days.map((day) => (
                  <div
                    key={day.dayNum}
                    className="trip-details__calendar-day-tab"
                    style={{ width: `${dayColumnWidth}px`, minWidth: `${dayColumnWidth}px`, maxWidth: `${dayColumnWidth}px` }}
                  >
                    <span className="trip-details__calendar-day-tab-title">Day {day.dayNum}: {day.label}</span>
                    <span className="trip-details__calendar-day-tab-city">{tripDestination}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div
            className="trip-details__calendar-timeline-wrap"
            ref={calendarTimelineRef}
            onScroll={(e) => setCalendarScrollLeft(e.currentTarget.scrollLeft)}
          >
            <div className="trip-details__calendar-times" style={{ width: `${CALENDAR_GUTTER_WIDTH}px` }}>
              <div className="trip-details__calendar-time-row trip-details__calendar-time-row--all-day">
                <span className="trip-details__calendar-time-label">All day</span>
              </div>
              {Array.from({ length: CALENDAR_HOURS }, (_, i) => i + CALENDAR_START_HOUR).map((h) => (
                <div key={h} className="trip-details__calendar-time-row">
                  <span className="trip-details__calendar-time-label">{String(h).padStart(2, '0')}:00</span>
                </div>
              ))}
            </div>
            <div className="trip-details__calendar-grid" style={{ width: `${calendarColumnsWidth}px`, minWidth: `${calendarColumnsWidth}px` }}>
              {days.map((day) => (
                <div
                  key={day.dayNum}
                  className="trip-details__calendar-day-col"
                  style={{ width: `${dayColumnWidth}px`, minWidth: `${dayColumnWidth}px`, maxWidth: `${dayColumnWidth}px` }}
                >
                  <div
                    className={`trip-details__calendar-day-col-content ${calendarDragOverDayNum === day.dayNum ? 'trip-details__calendar-day-col-content--drop-target' : ''}`}
                    onDragOver={(e) => handleCalendarDayDragOver(e, day.dayNum)}
                    onDrop={(e) => handleCalendarDayDrop(e, day)}
                    onDragLeave={() => {
                      if (calendarDragOverDayNum === day.dayNum) setCalendarDragOverDayNum(null);
                    }}
                  >
                    <div className="trip-details__calendar-all-day-cell" aria-hidden />
                    {Array.from({ length: CALENDAR_HOURS }, (_, i) => (
                      <div key={i} className="trip-details__calendar-cell" />
                    ))}
                    <div className="trip-details__calendar-events">
                      {getCalendarEventLayouts(tripExpenseItems, day.date).map(({ item, style: laneStyle }) => {
                        const style = getCategoryStyle(item);
                        const IconComponent = (typeof item.Icon === 'function' || typeof item.Icon === 'string')
                          ? item.Icon
                          : Camera;
                        const timeRange = formatTimeRange(item);
                        const { top, height } = getCalendarEventPosition(item);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`trip-details__calendar-event ${calendarDraggingItemId === item.id ? 'trip-details__calendar-event--dragging' : ''} ${calendarResizingItemId === item.id ? 'trip-details__calendar-event--resizing' : ''}`}
                            draggable
                            onDragStart={(e) => handleCalendarDragStart(e, item.id)}
                            onDragEnd={handleCalendarDragEnd}
                            style={{
                              top: `${top}px`,
                              height: `${height}px`,
                              ...laneStyle,
                              backgroundColor: `${style.color}18`,
                              borderLeftColor: style.color,
                            }}
                            onClick={() => isEditableItineraryItem(item) && setEditPlaceItem(item)}
                          >
                            <span className="trip-details__calendar-event-time">{timeRange}</span>
                            <span className="trip-details__calendar-event-icon" style={{ color: style.color }}>
                              <IconComponent size={14} aria-hidden />
                            </span>
                            <span className="trip-details__calendar-event-name">{item.name}</span>
                            <span
                              className="trip-details__calendar-event-resize"
                              role="presentation"
                              onMouseDown={(e) => handleCalendarResizeStart(e, item)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
        <button
          type="button"
          className="trip-details__calendar-fab"
          aria-label="Add to trip"
          onClick={() => { setAddSheetFromCalendar(true); setAddSheetDay(1); setAddSheetAnchor(null); }}
        >
          <Plus size={24} aria-hidden />
        </button>
      </div>
      <TripDetailsMapPanel {...mapPanelProps} />
    </div>
  );
}
