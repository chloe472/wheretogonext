import TripDetailsCurrencyModal from './TripDetailsCurrencyModal';
import TripDetailsWhereModal from './TripDetailsWhereModal';
import TripDetailsNotesModal from './TripDetailsNotesModal';
import TripDetailsEditPlaceModal from './TripDetailsEditPlaceModal';
import TripDetailsDeleteItemConfirmModal from './TripDetailsDeleteItemConfirmModal';
import TripDetailsOptimizeRouteModal from './TripDetailsOptimizeRouteModal';
import TripDetailsPublicTransportModal from './TripDetailsPublicTransportModal';
import TripDetailsMapDayFilterModal from './TripDetailsMapDayFilterModal';
import TripDetailsAddTransportModal from './TripDetailsAddTransportModal';
import TripDetailsCustomTransportModal from './TripDetailsCustomTransportModal';

export default function TripDetailsSettingsTransportModals({
  currencyModalOpen,
  setCurrencyModalOpen,
  currencyOptions,
  currencyOptionsForModal,
  modalCurrency,
  setModalCurrency,
  setCurrency,
  whereModalOpen,
  setWhereModalOpen,
  whereModalRef,
  whereQuery,
  setWhereQuery,
  whereSuggestionsOpen,
  setWhereSuggestionsOpen,
  whereSuggestionsLoading,
  whereLocationSuggestions,
  whereSelectedLocations,
  setWhereSelectedLocations,
  whereCityPlanRows,
  whereCityDayRanges,
  whereDefaultCityDayRanges,
  whereTotalTripDays,
  whereCityDayDrafts,
  whereCityRangeError,
  setWhereCityRangeError,
  handleWhereCityRangeInputChange,
  commitWhereCityRangeInput,
  addWhereCityPlanRow,
  removeWhereCityPlanRow,
  updateWhereCityPlanRowLocation,
  handleWhereModalApply,
  notesModalOpen,
  setNotesModalOpen,
  days,
  notesActiveTab,
  setNotesActiveTab,
  generalNotes,
  setGeneralNotes,
  generalAttachments,
  setGeneralAttachments,
  tripExpenseItems,
  setTripExpenseItems,
  notesSaving,
  saveGeneralNotesAndDocuments,
  saveDayNotesAndDocuments,
  editPlaceItem,
  setEditPlaceItem,
  pendingDeleteItemId,
  setPendingDeleteItemId,
  currency,
  showInAppNotice,
  canOpenInternalItemOverview,
  openInternalItemOverview,
  handleImageError,
  optimizeRouteModalOpen,
  setOptimizeRouteModalOpen,
  optimizeRouteDay,
  optimizeRouteStartId,
  setOptimizeRouteStartId,
  optimizeRouteEndId,
  setOptimizeRouteEndId,
  publicTransportModalOpen,
  setPublicTransportModalOpen,
  publicTransportSegment,
  mapDayFilterOpen,
  setMapDayFilterOpen,
  mapDayFilterSelected,
  setMapDayFilterSelected,
  addTransportOpen,
  setAddTransportOpen,
  addTransportDay,
  destinationCountry,
  availableTransportCountries,
  appendTransportTripItem,
  setCustomTransportVehicle,
  setAddCustomTransportOpen,
  userCountry,
  addCustomTransportOpen,
  exchangeRates,
  customTransportVehicle,
}) {
  return (
    <>
      {currencyModalOpen && (
        <TripDetailsCurrencyModal
          onClose={() => setCurrencyModalOpen(false)}
          currencyOptions={currencyOptions}
          currencyOptionsForModal={currencyOptionsForModal}
          modalCurrency={modalCurrency}
          setModalCurrency={setModalCurrency}
          onApply={() => {
            setCurrency(modalCurrency);
            setCurrencyModalOpen(false);
          }}
        />
      )}

      {whereModalOpen && (
        <TripDetailsWhereModal
          onClose={() => setWhereModalOpen(false)}
          whereModalRef={whereModalRef}
          whereQuery={whereQuery}
          setWhereQuery={setWhereQuery}
          whereSuggestionsOpen={whereSuggestionsOpen}
          setWhereSuggestionsOpen={setWhereSuggestionsOpen}
          whereSuggestionsLoading={whereSuggestionsLoading}
          whereLocationSuggestions={whereLocationSuggestions}
          whereSelectedLocations={whereSelectedLocations}
          setWhereSelectedLocations={setWhereSelectedLocations}
          whereCityPlanRows={whereCityPlanRows}
          whereCityDayRanges={whereCityDayRanges}
          whereDefaultCityDayRanges={whereDefaultCityDayRanges}
          whereTotalTripDays={whereTotalTripDays}
          whereCityDayDrafts={whereCityDayDrafts}
          whereCityRangeError={whereCityRangeError}
          setWhereCityRangeError={setWhereCityRangeError}
          handleWhereCityRangeInputChange={handleWhereCityRangeInputChange}
          commitWhereCityRangeInput={commitWhereCityRangeInput}
          addWhereCityPlanRow={addWhereCityPlanRow}
          removeWhereCityPlanRow={removeWhereCityPlanRow}
          updateWhereCityPlanRowLocation={updateWhereCityPlanRowLocation}
          onApply={handleWhereModalApply}
        />
      )}

      {notesModalOpen && (
        <TripDetailsNotesModal
          onClose={() => setNotesModalOpen(false)}
          days={days}
          notesActiveTab={notesActiveTab}
          setNotesActiveTab={setNotesActiveTab}
          generalNotes={generalNotes}
          setGeneralNotes={setGeneralNotes}
          generalAttachments={generalAttachments}
          setGeneralAttachments={setGeneralAttachments}
          tripExpenseItems={tripExpenseItems}
          setTripExpenseItems={setTripExpenseItems}
          notesSaving={notesSaving}
          saveGeneralNotesAndDocuments={saveGeneralNotesAndDocuments}
          saveDayNotesAndDocuments={saveDayNotesAndDocuments}
        />
      )}

      {editPlaceItem && (
        <TripDetailsEditPlaceModal
          editPlaceItem={editPlaceItem}
          onClose={() => setEditPlaceItem(null)}
          tripExpenseItems={tripExpenseItems}
          setTripExpenseItems={setTripExpenseItems}
          days={days}
          currency={currency}
          showInAppNotice={showInAppNotice}
          canOpenInternalItemOverview={canOpenInternalItemOverview}
          openInternalItemOverview={openInternalItemOverview}
          handleImageError={handleImageError}
          setPendingDeleteItemId={setPendingDeleteItemId}
        />
      )}

      {pendingDeleteItemId && (
        <TripDetailsDeleteItemConfirmModal
          onClose={() => setPendingDeleteItemId(null)}
          onConfirmDelete={() => {
            setTripExpenseItems((prev) => prev.filter((it) => it.id !== pendingDeleteItemId));
            setPendingDeleteItemId(null);
            setEditPlaceItem(null);
          }}
        />
      )}

      {optimizeRouteModalOpen && optimizeRouteDay && (
        <TripDetailsOptimizeRouteModal
          onClose={() => setOptimizeRouteModalOpen(false)}
          optimizeRouteDay={optimizeRouteDay}
          tripExpenseItems={tripExpenseItems}
          setTripExpenseItems={setTripExpenseItems}
          optimizeRouteStartId={optimizeRouteStartId}
          setOptimizeRouteStartId={setOptimizeRouteStartId}
          optimizeRouteEndId={optimizeRouteEndId}
          setOptimizeRouteEndId={setOptimizeRouteEndId}
          showInAppNotice={showInAppNotice}
        />
      )}

      {publicTransportModalOpen && (
        <TripDetailsPublicTransportModal
          segment={publicTransportSegment}
          onClose={() => setPublicTransportModalOpen(false)}
        />
      )}

      {mapDayFilterOpen && (
        <TripDetailsMapDayFilterModal
          days={days}
          selectedDayNums={mapDayFilterSelected}
          setSelectedDayNums={setMapDayFilterSelected}
          onClose={() => setMapDayFilterOpen(false)}
        />
      )}

      <TripDetailsAddTransportModal
        open={addTransportOpen}
        onClose={() => setAddTransportOpen(false)}
        addTransportDay={addTransportDay}
        days={days}
        destinationCountry={destinationCountry}
        availableTransportCountries={availableTransportCountries}
        appendTransportTripItem={appendTransportTripItem}
        onRequestManualFlight={() => {
          setAddTransportOpen(false);
          setCustomTransportVehicle('Flight');
          setAddCustomTransportOpen(true);
        }}
        defaultHomeCountry={userCountry || 'United States'}
      />

      <TripDetailsCustomTransportModal
        open={addCustomTransportOpen}
        onClose={() => setAddCustomTransportOpen(false)}
        days={days}
        currency={currency}
        exchangeRates={exchangeRates}
        vehicleType={customTransportVehicle}
        onAddTripTransportItem={(item) => setTripExpenseItems((prev) => [...prev, item])}
      />
    </>
  );
}
