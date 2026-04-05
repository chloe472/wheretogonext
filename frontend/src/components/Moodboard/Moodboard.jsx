import './styles/moodboard.css';
import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import TripHeader from '../TripDetailsPage/components/TripDetailsHeader';
import { updateItinerary, deleteItinerary } from '../../api/itinerariesApi';
import { useMoodboard } from './hooks';
import { useTripDetailsWhereSuggestions } from '../TripDetailsPage/hooks/useTripDetailsWhereSuggestions';
import { useTripDetailsExchangeRates } from '../TripDetailsPage/hooks/useTripDetailsExchangeRates';
import { MoodboardContent, MoodboardTripOverlays } from './components';
import '../TripDetailsPage/styles/trip-details-modal-shared.css';
import '../TripDetailsPage/styles/trip-details-where-modal.css';
import '../TripDetailsPage/styles/trip-details-currency-modal.css';
import '../TripDetailsPage/styles/trip-details-when-date-modal.css';

export default function Moodboard({ user, onLogout }) {
  const {
    tripId,
    trip,
    setTrip,
    folders,
    loading,
    error,
    showCreate,
    setShowCreate,
    showEdit,
    setShowEdit,
    showDelete,
    setShowDelete,
    newFolderName,
    setNewFolderName,
    openMenuId,
    setOpenMenuId,
    handleCreate,
    handleEdit,
    handleDelete,
    openEdit,
    openDeleteConfirm,
  } = useMoodboard();
  const navigate = useNavigate();

  const titleDropdownRef = useRef(null);
  const titleLastClickRef = useRef(0);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban');

  const whereModalRef = useRef(null);
  const [whereModalOpen, setWhereModalOpen] = useState(false);
  const [whereQuery, setWhereQuery] = useState('');
  const [whereSuggestionsOpen, setWhereSuggestionsOpen] = useState(false);
  const [whereSelectedLocations, setWhereSelectedLocations] = useState([]);
  const [whereCityDayRanges] = useState({});
  const [whereCityDayDrafts, setWhereCityDayDrafts] = useState({});
  const [whereCityRangeError, setWhereCityRangeError] = useState('');

  const [dateModalOpen, setDateModalOpen] = useState(false);

  const [currencyModalOpen, setCurrencyModalOpen] = useState(false);
  const [modalCurrency, setModalCurrency] = useState('USD');
  const [deleteTripModalOpen, setDeleteTripModalOpen] = useState(false);

  const [whereLocationSuggestions, setWhereLocationSuggestions] = useState([]);
  const [whereSuggestionsLoading, setWhereSuggestionsLoading] = useState(false);

  useTripDetailsWhereSuggestions({
    whereModalOpen,
    whereModalRef,
    whereQuery,
    setWhereSuggestionsOpen,
    setWhereLocationSuggestions,
    setWhereSuggestionsLoading,
  });

  const { exchangeRates, loadExchangeRates, currencyOptions, currencyOptionsForModal } = useTripDetailsExchangeRates();

  const displayDatesLabel = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return trip?.dates || 'Set dates';
    const start = new Date(`${String(trip.startDate).slice(0, 10)}T12:00:00`);
    const end = new Date(`${String(trip.endDate).slice(0, 10)}T12:00:00`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) return trip?.dates || 'Set dates';
    const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthShort[start.getMonth()]} ${start.getDate()} - ${monthShort[end.getMonth()]} ${end.getDate()}`;
  }, [trip?.startDate, trip?.endDate, trip?.dates]);

  const daysLength = useMemo(() => {
    if (!trip?.startDate || !trip?.endDate) return 0;
    const start = new Date(`${String(trip.startDate).slice(0, 10)}T12:00:00`);
    const end = new Date(`${String(trip.endDate).slice(0, 10)}T12:00:00`);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end < start) return 0;
    return Math.round((end - start) / 86400000) + 1;
  }, [trip?.startDate, trip?.endDate]);

  const titleDisplay = trip?.title || `${daysLength || 1} days to ${trip?.destination || 'your trip'}`;
  const headerCurrency = String(trip?.currency || 'USD').toUpperCase();

  const handleCommitTripTitle = async (nextTitle) => {
    const title = String(nextTitle || '').trim();
    if (!title || !tripId) return;
    try {
      const updated = await updateItinerary(tripId, { title });
      if (updated) setTrip((prev) => ({ ...(prev || {}), ...updated }));
      toast.success('Changes saved', { id: 'trip-details-saved' });
    } catch (err) {
      toast.error(err?.message || 'Failed to rename trip');
    }
  };

  const handleRequestDeleteTrip = () => {
    setDeleteTripModalOpen(true);
  };

  const handleConfirmDeleteTrip = async () => {
    if (!tripId) return;
    setDeleteTripModalOpen(false);
    try {
      await deleteItinerary(tripId);
      toast.success('Trip deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err?.message || 'Failed to delete trip');
    }
  };

  const applyTripUpdate = async (payload, successMessage) => {
    if (!tripId) return;
    try {
      const updated = await updateItinerary(tripId, payload);
      if (updated) setTrip((prev) => ({ ...(prev || {}), ...updated }));
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      toast.error(err?.message || 'Failed to update trip');
    }
  };

  const handleBudgetDetailsClick = async () => {
    const current = Number(trip?.budgetSpent ?? 0);
    const input = window.prompt('Update spent amount (numbers only):', Number.isFinite(current) ? String(current) : '0');
    if (input == null) return;
    const value = Number(input.trim());
    if (!Number.isFinite(value) || value < 0) {
      toast.error('Please enter a valid non-negative amount');
      return;
    }
    await applyTripUpdate({ budgetSpent: value }, 'Changes saved');
  };

  const handleOpenWhereModal = async () => {
    const currentLocations = String(trip?.locations || trip?.destination || '').trim();
    const seed = currentLocations
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((name, i) => ({ id: `manual-${i}`, name, type: 'City', country: '' }));
    setWhereSelectedLocations(seed);
    setWhereQuery('');
    setWhereSuggestionsOpen(false);
    setWhereCityRangeError('');
    setWhereModalOpen(true);
  };

  const handleApplyWhereModal = async () => {
    const picked = whereSelectedLocations.map((loc) => String(loc?.name || '').trim()).filter(Boolean);
    const manual = String(whereQuery || '').trim();
    const nextList = manual ? [...picked, manual] : picked;
    const locations = nextList.join('; ').trim();
    if (!locations) {
      toast.error('Location cannot be empty');
      return;
    }
    const destination = locations.split(';')[0]?.split(',')[0]?.trim() || locations;
    await applyTripUpdate({ destination, locations }, 'Location updated');
    setWhereModalOpen(false);
  };

  const handleOpenDateModal = async () => {
    setDateModalOpen(true);
  };

  const handleApplyDateModal = async (s, e) => {
    const startDate = String(s || '').trim();
    const endDate = String(e || '').trim();
    const isoRe = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoRe.test(startDate) || !isoRe.test(endDate)) {
      toast.error('Use YYYY-MM-DD format');
      return;
    }
    if (new Date(`${endDate}T12:00:00`) < new Date(`${startDate}T12:00:00`)) {
      toast.error('End date must be after or equal to start date');
      return;
    }
    await applyTripUpdate({ startDate, endDate, dates: `${startDate} - ${endDate}` }, 'Changes saved');
    setDateModalOpen(false);
  };

  const handleOpenCurrencyModal = async () => {
    setModalCurrency(String(trip?.currency || 'USD').toUpperCase());
    setCurrencyModalOpen(true);
  };

  const handleApplyCurrencyModal = async () => {
    const code = String(modalCurrency || '').toUpperCase();
    if (!/^[A-Z]{3}$/.test(code)) {
      toast.error('Please choose a valid 3-letter currency code');
      return;
    }
    await applyTripUpdate({ currency: code }, 'Currency updated');
    setCurrencyModalOpen(false);
  };

  const redirectToTripDetails = () => navigate(`/trip/${tripId}`);
  const whereTotalTripDays = Math.max(1, daysLength || 1);

  return (
    <div className="moodboard-page">
      {trip && (
        <TripHeader
          trip={trip}
          tripId={tripId}
          daysLength={daysLength}
          titleDropdownRef={titleDropdownRef}
          titleLastClickRef={titleLastClickRef}
          titleEditing={titleEditing}
          setTitleEditing={setTitleEditing}
          titleEditValue={titleEditValue}
          setTitleEditValue={setTitleEditValue}
          titleDisplay={titleDisplay}
          titleDropdownOpen={titleDropdownOpen}
          setTitleDropdownOpen={setTitleDropdownOpen}
          onCommitTripTitle={handleCommitTripTitle}
          onRequestDeleteTrip={handleRequestDeleteTrip}
          spent={trip.budgetSpent || 0}
          currency={headerCurrency}
          exchangeRates={exchangeRates}
          onBudgetDetailsClick={handleBudgetDetailsClick}
          onOpenWhereModal={handleOpenWhereModal}
          displayDatesLabel={displayDatesLabel}
          onOpenDateModal={handleOpenDateModal}
          currencyOptions={currencyOptions}
          loadExchangeRates={loadExchangeRates}
          onOpenCurrencyModal={handleOpenCurrencyModal}
          onOpenNotesModal={redirectToTripDetails}
          onOpenRouteIdeas={redirectToTripDetails}
          viewMode={viewMode}
          setViewMode={(mode) => mode === 'calendar' ? navigate(`/trip/${tripId}?view=calendar`) : navigate(`/trip/${tripId}`)}
        />
      )}

      <MoodboardContent
        tripId={tripId}
        trip={trip}
        onBack={redirectToTripDetails}
        folders={folders}
        loading={loading}
        error={error}
        setShowCreate={setShowCreate}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
        openEdit={openEdit}
        openDeleteConfirm={openDeleteConfirm}
        showCreate={showCreate}
        showEdit={showEdit}
        showDelete={showDelete}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        setShowEdit={setShowEdit}
        setShowDelete={setShowDelete}
        handleCreate={handleCreate}
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      <MoodboardTripOverlays
        deleteTripModalOpen={deleteTripModalOpen}
        closeDeleteTripModal={() => setDeleteTripModalOpen(false)}
        confirmDeleteTrip={handleConfirmDeleteTrip}
        whereModalOpen={whereModalOpen}
        closeWhereModal={() => setWhereModalOpen(false)}
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
        whereTotalTripDays={whereTotalTripDays}
        whereCityDayDrafts={whereCityDayDrafts}
        whereCityRangeError={whereCityRangeError}
        setWhereCityRangeError={setWhereCityRangeError}
        setWhereCityDayDrafts={setWhereCityDayDrafts}
        applyWhereModal={handleApplyWhereModal}
        dateModalOpen={dateModalOpen}
        trip={trip}
        applyDateModal={handleApplyDateModal}
        closeDateModal={() => setDateModalOpen(false)}
        currencyModalOpen={currencyModalOpen}
        closeCurrencyModal={() => setCurrencyModalOpen(false)}
        currencyOptions={currencyOptions}
        currencyOptionsForModal={currencyOptionsForModal}
        modalCurrency={modalCurrency}
        setModalCurrency={setModalCurrency}
        applyCurrencyModal={handleApplyCurrencyModal}
      />
    </div>
  );
}