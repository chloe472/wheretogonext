import { useCallback, useEffect, useRef, useState } from 'react';
import TripDetailsMapPanel from '../../TripDetailsMapPanel/TripDetailsMapPanel';
import TripDetailsCalendarView from './TripDetailsCalendarView';
import TripDetailsKanbanDayColumn from './TripDetailsKanbanDayColumn';

const MAP_PANEL_MIN_WIDTH = 200;
const KANBAN_PANEL_MIN_WIDTH = 400;
const MAP_PANEL_DEFAULT_WIDTH = 320;
const RESIZE_HANDLE_WIDTH = 14;

export default function TripDetailsMainBody({
  viewMode,
  visibleDays,
  days,
  tripDestination,
  tripExpenseItems,
  currency,
  exchangeRates,
  openDayMenuKey,
  setOpenDayMenuKey,
  dayColors,
  setDayColors,
  dayColorPickerDay,
  setDayColorPickerDay,
  dayTitles,
  setDayTitle,
  getDayColumnWidth,
  beginDayColumnResize,
  displayStart,
  displayEnd,
  setDateRange,
  setOptimizeRouteDay,
  setOptimizeRouteStartId,
  setOptimizeRouteEndId,
  setOptimizeRouteModalOpen,
  setMapDayFilterSelected,
  setMapDayFilterOpen,
  skipExpenseSaveToastUntilRef,
  setTripExpenseItems,
  setDayTitles,
  setDayColumnWidths,
  showInAppNotice,
  openInternalItemOverview,
  handleImageError,
  transportModeBySegment,
  setTransportModeBySegment,
  openTravelDropdownKey,
  setOpenTravelDropdownKey,
  travelTimeCache,
  setTravelTimeCache,
  setEditPlaceItem,
  setPublicTransportSegment,
  setPublicTransportModalOpen,
  setAddSheetFromCalendar,
  setAddSheetDay,
  setAddSheetAnchor,
  setPendingDeleteItemId,
  tripDetailsMapPanelProps,
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
  kanbanDraggingDayNum,
  kanbanDragOverDayNum,
  handleKanbanDayDragStart,
  handleKanbanDayDragEnter,
  handleKanbanDayDragEnd,
  handleKanbanDayDrop,
}) {
  const kanbanColumnsRef = useRef(null);
  const mapResizeSessionRef = useRef(null);
  const [mapPanelWidth, setMapPanelWidth] = useState(MAP_PANEL_DEFAULT_WIDTH);

  const clampMapPanelWidth = useCallback((proposedWidth) => {
    const containerWidth = Number(kanbanColumnsRef.current?.clientWidth || 0);
    if (!containerWidth) return Math.max(MAP_PANEL_MIN_WIDTH, proposedWidth);
    const maxWidth = Math.max(
      MAP_PANEL_MIN_WIDTH,
      containerWidth - KANBAN_PANEL_MIN_WIDTH - RESIZE_HANDLE_WIDTH,
    );
    return Math.min(maxWidth, Math.max(MAP_PANEL_MIN_WIDTH, proposedWidth));
  }, []);

  useEffect(() => {
    if (viewMode !== 'kanban') return undefined;

    const applyPresetWidth = () => {
      const containerWidth = Number(kanbanColumnsRef.current?.clientWidth || window.innerWidth || 0);
      if (!containerWidth) return;
      const availableWidth = Math.max(
        MAP_PANEL_MIN_WIDTH,
        containerWidth - KANBAN_PANEL_MIN_WIDTH - RESIZE_HANDLE_WIDTH,
      );

      if (tripDetailsMapPanelProps.mapView === 'Expand full') {
        setMapPanelWidth(availableWidth);
        return;
      }
      if (tripDetailsMapPanelProps.mapView === 'Expand half') {
        setMapPanelWidth(clampMapPanelWidth(Math.round(containerWidth * 0.5)));
        return;
      }
      setMapPanelWidth(clampMapPanelWidth(MAP_PANEL_DEFAULT_WIDTH));
    };

    applyPresetWidth();
    window.addEventListener('resize', applyPresetWidth);
    return () => window.removeEventListener('resize', applyPresetWidth);
  }, [viewMode, tripDetailsMapPanelProps.mapView, clampMapPanelWidth]);

  const beginMapPanelResize = useCallback((event) => {
    if (viewMode !== 'kanban') return;
    event.preventDefault();
    event.stopPropagation();

    const getClientX = (evt) => Number(evt?.clientX || 0);
    mapResizeSessionRef.current = {
      startX: getClientX(event),
      startWidth: mapPanelWidth,
    };
    document.body.classList.add('trip-details--panel-resizing');

    const handleResizeMove = (moveEvent) => {
      const session = mapResizeSessionRef.current;
      if (!session) return;
      const deltaX = session.startX - getClientX(moveEvent);
      setMapPanelWidth(clampMapPanelWidth(session.startWidth + deltaX));
    };

    const handleResizeEnd = () => {
      mapResizeSessionRef.current = null;
      document.body.classList.remove('trip-details--panel-resizing');
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, [viewMode, mapPanelWidth, clampMapPanelWidth]);

  return (
    <div className="trip-details__body">
      {viewMode === 'kanban' ? (
        <div className="trip-details__columns" ref={kanbanColumnsRef}>
          <div className="trip-details__columns-scroll">
            {visibleDays.map((day) => (
              <TripDetailsKanbanDayColumn
                key={day.dayNum}
                day={day}
                daysCount={days.length}
                tripExpenseItems={tripExpenseItems}
                currency={currency}
                exchangeRates={exchangeRates}
                openDayMenuKey={openDayMenuKey}
                setOpenDayMenuKey={setOpenDayMenuKey}
                dayColors={dayColors}
                setDayColors={setDayColors}
                dayColorPickerDay={dayColorPickerDay}
                setDayColorPickerDay={setDayColorPickerDay}
                dayTitles={dayTitles}
                setDayTitle={setDayTitle}
                getDayColumnWidth={getDayColumnWidth}
                beginDayColumnResize={beginDayColumnResize}
                displayStart={displayStart}
                displayEnd={displayEnd}
                setDateRange={setDateRange}
                setOptimizeRouteDay={setOptimizeRouteDay}
                setOptimizeRouteStartId={setOptimizeRouteStartId}
                setOptimizeRouteEndId={setOptimizeRouteEndId}
                setOptimizeRouteModalOpen={setOptimizeRouteModalOpen}
                setMapDayFilterSelected={setMapDayFilterSelected}
                setMapDayFilterOpen={setMapDayFilterOpen}
                skipExpenseSaveToastUntilRef={skipExpenseSaveToastUntilRef}
                setTripExpenseItems={setTripExpenseItems}
                setDayTitles={setDayTitles}
                setDayColumnWidths={setDayColumnWidths}
                showInAppNotice={showInAppNotice}
                openInternalItemOverview={openInternalItemOverview}
                handleImageError={handleImageError}
                transportModeBySegment={transportModeBySegment}
                setTransportModeBySegment={setTransportModeBySegment}
                openTravelDropdownKey={openTravelDropdownKey}
                setOpenTravelDropdownKey={setOpenTravelDropdownKey}
                travelTimeCache={travelTimeCache}
                setTravelTimeCache={setTravelTimeCache}
                setEditPlaceItem={setEditPlaceItem}
                setPublicTransportSegment={setPublicTransportSegment}
                setPublicTransportModalOpen={setPublicTransportModalOpen}
                setAddSheetFromCalendar={setAddSheetFromCalendar}
                setAddSheetDay={setAddSheetDay}
                setAddSheetAnchor={setAddSheetAnchor}
                setPendingDeleteItemId={setPendingDeleteItemId}
                kanbanDraggingDayNum={kanbanDraggingDayNum}
                kanbanDragOverDayNum={kanbanDragOverDayNum}
                handleKanbanDayDragStart={handleKanbanDayDragStart}
                handleKanbanDayDragEnter={handleKanbanDayDragEnter}
                handleKanbanDayDragEnd={handleKanbanDayDragEnd}
                handleKanbanDayDrop={handleKanbanDayDrop}
              />
            ))}
          </div>
          <button
            type="button"
            className="trip-details__panel-resize-handle"
            aria-label="Resize map panel"
            onMouseDown={beginMapPanelResize}
          >
            <span className="trip-details__panel-resize-grip" aria-hidden />
          </button>
          <TripDetailsMapPanel
            {...tripDetailsMapPanelProps}
            panelWidth={mapPanelWidth}
          />
        </div>
      ) : (
        <TripDetailsCalendarView
          tripDestination={tripDestination}
          days={days}
          tripExpenseItems={tripExpenseItems}
          calendarScrollLeft={calendarScrollLeft}
          setCalendarScrollLeft={setCalendarScrollLeft}
          calendarTimelineRef={calendarTimelineRef}
          calendarDragOverDayNum={calendarDragOverDayNum}
          setCalendarDragOverDayNum={setCalendarDragOverDayNum}
          handleCalendarDayDragOver={handleCalendarDayDragOver}
          handleCalendarDayDrop={handleCalendarDayDrop}
          calendarDraggingItemId={calendarDraggingItemId}
          calendarResizingItemId={calendarResizingItemId}
          handleCalendarDragStart={handleCalendarDragStart}
          handleCalendarDragEnd={handleCalendarDragEnd}
          handleCalendarResizeStart={handleCalendarResizeStart}
          setEditPlaceItem={setEditPlaceItem}
          setAddSheetFromCalendar={setAddSheetFromCalendar}
          setAddSheetDay={setAddSheetDay}
          setAddSheetAnchor={setAddSheetAnchor}
          mapPanelProps={tripDetailsMapPanelProps}
        />
      )}
    </div>
  );
}
