import TripDetailsMapPanel from '../../TripDetailsMapPanel/TripDetailsMapPanel';
import TripDetailsCalendarView from './TripDetailsCalendarView';
import TripDetailsKanbanDayColumn from './TripDetailsKanbanDayColumn';

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
}) {
  return (
    <div className="trip-details__body">
      {viewMode === 'kanban' ? (
        <div className="trip-details__columns">
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
              />
            ))}
          </div>
          <TripDetailsMapPanel {...tripDetailsMapPanelProps} />
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
