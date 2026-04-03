import FriendlyModal from '../../FriendlyModal/FriendlyModal';
import TripDetailsWhereModal from '../../TripDetailsPage/components/TripDetailsWhereModal';
import TripDetailsCurrencyModal from '../../TripDetailsPage/components/TripDetailsCurrencyModal';
import DateRangePickerModal from '../../DateRangePickerModal/DateRangePickerModal';

export default function MoodboardTripOverlays({
  deleteTripModalOpen,
  closeDeleteTripModal,
  confirmDeleteTrip,
  whereModalOpen,
  closeWhereModal,
  whereModalRef,
  whereQuery,
  setWhereQuery,
  whereSuggestionsOpen,
  setWhereSuggestionsOpen,
  whereSuggestionsLoading,
  whereLocationSuggestions,
  whereSelectedLocations,
  setWhereSelectedLocations,
  whereCityDayRanges,
  whereTotalTripDays,
  whereCityDayDrafts,
  whereCityRangeError,
  setWhereCityRangeError,
  setWhereCityDayDrafts,
  applyWhereModal,
  dateModalOpen,
  trip,
  applyDateModal,
  closeDateModal,
  currencyModalOpen,
  closeCurrencyModal,
  currencyOptions,
  currencyOptionsForModal,
  modalCurrency,
  setModalCurrency,
  applyCurrencyModal,
}) {
  return (
    <>
      <FriendlyModal
        open={deleteTripModalOpen}
        title="Delete trip"
        message="Delete this trip? This cannot be undone."
        showCancel
        confirmText="Delete"
        cancelText="Cancel"
        onClose={closeDeleteTripModal}
        onConfirm={confirmDeleteTrip}
      />

      {whereModalOpen && (
        <TripDetailsWhereModal
          onClose={closeWhereModal}
          whereModalRef={whereModalRef}
          whereQuery={whereQuery}
          setWhereQuery={setWhereQuery}
          whereSuggestionsOpen={whereSuggestionsOpen}
          setWhereSuggestionsOpen={setWhereSuggestionsOpen}
          whereSuggestionsLoading={whereSuggestionsLoading}
          whereLocationSuggestions={whereLocationSuggestions}
          whereSelectedLocations={whereSelectedLocations}
          setWhereSelectedLocations={setWhereSelectedLocations}
          whereCityDayRanges={whereCityDayRanges}
          whereDefaultCityDayRanges={{}}
          whereTotalTripDays={whereTotalTripDays}
          whereCityDayDrafts={whereCityDayDrafts}
          whereCityRangeError={whereCityRangeError}
          setWhereCityRangeError={setWhereCityRangeError}
          handleWhereCityRangeInputChange={(loc, field, value) => {
            const key = `${String(loc?.name || '').toLowerCase()}::${field}`;
            setWhereCityDayDrafts((prev) => ({ ...prev, [key]: value }));
          }}
          commitWhereCityRangeInput={() => {}}
          onApply={applyWhereModal}
        />
      )}

      <DateRangePickerModal
        open={dateModalOpen}
        start={trip?.startDate || null}
        end={trip?.endDate || null}
        displayStartForMonth={trip?.startDate || null}
        onApply={applyDateModal}
        onClose={closeDateModal}
        title="When"
      />

      {currencyModalOpen && (
        <TripDetailsCurrencyModal
          onClose={closeCurrencyModal}
          currencyOptions={currencyOptions}
          currencyOptionsForModal={currencyOptionsForModal}
          modalCurrency={modalCurrency}
          setModalCurrency={setModalCurrency}
          onApply={applyCurrencyModal}
        />
      )}
    </>
  );
}
