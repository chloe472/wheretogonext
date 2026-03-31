import TripDetailsBudgetModal from './TripDetailsBudgetModal';
import TripDetailsAddSheet from './TripDetailsAddSheet';
import TripDetailsAddToTripModal from './TripDetailsAddToTripModal';
import TripDetailsExperienceBookingModal from './TripDetailsExperienceBookingModal';
import TripDetailsStayBookingModal from './TripDetailsStayBookingModal';
import {
  TripDetailsFriendlyDialogLayer,
  TripDetailsSocialImportLayer,
} from './TripDetailsOverlays';

export default function TripDetailsTailModals({
  budgetModalOpen,
  setBudgetModalOpen,
  trip,
  currency,
  exchangeRates,
  tripExpenseItems,
  expenseSortBy,
  setExpenseSortBy,
  addSheetDay,
  addSheetFromCalendar,
  addSheetAnchor,
  onCloseAddSheet,
  handleAddSheetOptionSelect,
  socialImportModalProps,
  resolveImageUrl,
  onImageError,
  onAddDetectedDestinationFromSocial,
  addToTripModalOpen,
  addToTripItem,
  onCloseAddToTrip,
  handleAddToTripSubmit,
  days,
  addToTripDate,
  setAddToTripDate,
  addToTripStartTime,
  setAddToTripStartTime,
  addToTripDurationHrs,
  setAddToTripDurationHrs,
  addToTripDurationMins,
  setAddToTripDurationMins,
  addToTripCheckInDate,
  setAddToTripCheckInDate,
  addToTripCheckInTime,
  setAddToTripCheckInTime,
  addToTripCheckOutDate,
  setAddToTripCheckOutDate,
  addToTripCheckOutTime,
  setAddToTripCheckOutTime,
  addToTripNotes,
  setAddToTripNotes,
  addToTripCost,
  setAddToTripCost,
  addToTripExternalLink,
  setAddToTripExternalLink,
  addToTripTravelDocs,
  setAddToTripTravelDocs,
  experienceBookingModalOpen,
  bookingExperience,
  bookingOption,
  onCloseExperienceBooking,
  handleExperienceBookingSubmit,
  bookingDate,
  setBookingDate,
  bookingStartTime,
  setBookingStartTime,
  bookingTravellers,
  setBookingTravellers,
  bookingNotes,
  setBookingNotes,
  stayBookingModalOpen,
  stayBookingTarget,
  onCloseStayBooking,
  handleStayBookingSubmit,
  cityQuery,
  stayBookingCheckInDate,
  setStayBookingCheckInDate,
  stayBookingCheckOutDate,
  setStayBookingCheckOutDate,
  stayBookingAdults,
  setStayBookingAdults,
  stayBookingChildren,
  setStayBookingChildren,
  stayBookingRooms,
  setStayBookingRooms,
  friendlyDialog,
  setFriendlyDialog,
}) {
  return (
    <>
      {budgetModalOpen && (
        <TripDetailsBudgetModal
          onClose={() => setBudgetModalOpen(false)}
          trip={trip}
          currency={currency}
          exchangeRates={exchangeRates}
          tripExpenseItems={tripExpenseItems}
          expenseSortBy={expenseSortBy}
          setExpenseSortBy={setExpenseSortBy}
        />
      )}

      {addSheetDay !== null && (
        <TripDetailsAddSheet
          addSheetDay={addSheetDay}
          addSheetFromCalendar={addSheetFromCalendar}
          addSheetAnchor={addSheetAnchor}
          onClose={onCloseAddSheet}
          onOptionSelect={handleAddSheetOptionSelect}
        />
      )}

      <TripDetailsSocialImportLayer
        socialImportModalProps={socialImportModalProps}
        resolveImageUrl={resolveImageUrl}
        onImageError={onImageError}
        onAddDetectedDestination={onAddDetectedDestinationFromSocial}
      />

      {addToTripModalOpen && addToTripItem && (
        <TripDetailsAddToTripModal
          onClose={onCloseAddToTrip}
          onSubmit={handleAddToTripSubmit}
          addToTripItem={addToTripItem}
          days={days}
          tripExpenseItems={tripExpenseItems}
          addToTripDate={addToTripDate}
          setAddToTripDate={setAddToTripDate}
          addToTripStartTime={addToTripStartTime}
          setAddToTripStartTime={setAddToTripStartTime}
          addToTripDurationHrs={addToTripDurationHrs}
          setAddToTripDurationHrs={setAddToTripDurationHrs}
          addToTripDurationMins={addToTripDurationMins}
          setAddToTripDurationMins={setAddToTripDurationMins}
          addToTripCheckInDate={addToTripCheckInDate}
          setAddToTripCheckInDate={setAddToTripCheckInDate}
          addToTripCheckInTime={addToTripCheckInTime}
          setAddToTripCheckInTime={setAddToTripCheckInTime}
          addToTripCheckOutDate={addToTripCheckOutDate}
          setAddToTripCheckOutDate={setAddToTripCheckOutDate}
          addToTripCheckOutTime={addToTripCheckOutTime}
          setAddToTripCheckOutTime={setAddToTripCheckOutTime}
          addToTripNotes={addToTripNotes}
          setAddToTripNotes={setAddToTripNotes}
          addToTripCost={addToTripCost}
          setAddToTripCost={setAddToTripCost}
          addToTripExternalLink={addToTripExternalLink}
          setAddToTripExternalLink={setAddToTripExternalLink}
          addToTripTravelDocs={addToTripTravelDocs}
          setAddToTripTravelDocs={setAddToTripTravelDocs}
        />
      )}

      {experienceBookingModalOpen && bookingExperience && bookingOption && (
        <TripDetailsExperienceBookingModal
          onClose={onCloseExperienceBooking}
          onSubmit={handleExperienceBookingSubmit}
          bookingExperience={bookingExperience}
          bookingOption={bookingOption}
          days={days}
          tripExpenseItems={tripExpenseItems}
          bookingDate={bookingDate}
          setBookingDate={setBookingDate}
          bookingStartTime={bookingStartTime}
          setBookingStartTime={setBookingStartTime}
          bookingTravellers={bookingTravellers}
          setBookingTravellers={setBookingTravellers}
          bookingNotes={bookingNotes}
          setBookingNotes={setBookingNotes}
        />
      )}

      {stayBookingModalOpen && stayBookingTarget && (
        <TripDetailsStayBookingModal
          onClose={onCloseStayBooking}
          onSubmit={handleStayBookingSubmit}
          stayBookingTarget={stayBookingTarget}
          cityQuery={cityQuery}
          stayBookingCheckInDate={stayBookingCheckInDate}
          setStayBookingCheckInDate={setStayBookingCheckInDate}
          stayBookingCheckOutDate={stayBookingCheckOutDate}
          setStayBookingCheckOutDate={setStayBookingCheckOutDate}
          stayBookingAdults={stayBookingAdults}
          setStayBookingAdults={setStayBookingAdults}
          stayBookingChildren={stayBookingChildren}
          setStayBookingChildren={setStayBookingChildren}
          stayBookingRooms={stayBookingRooms}
          setStayBookingRooms={setStayBookingRooms}
        />
      )}
      <TripDetailsFriendlyDialogLayer
        friendlyDialog={friendlyDialog}
        setFriendlyDialog={setFriendlyDialog}
      />
    </>
  );
}
