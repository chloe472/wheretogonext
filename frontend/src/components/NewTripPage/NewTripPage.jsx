import { useState, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon } from 'lucide-react';
import DateRangePickerModal from '../DateRangePickerModal/DateRangePickerModal';
import DestinationPickerField from './components/DestinationPickerField.jsx';
import CityDayPlanSection from './components/CityDayPlanSection.jsx';
import TripmatesInviteSection from './components/TripmatesInviteSection.jsx';
import { useCityDayPlan } from './hooks/useCityDayPlan.js';
import { useNewTripSubmit } from './hooks/useNewTripSubmit.js';
import { formatTripDates, getTripDayCount } from './lib/newTripPageHelpers.js';
import './NewTripPage.css';

export default function NewTripPage({ user, onLogout: _onLogout }) {
  const navigate = useNavigate();
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateModalOpen, setDateModalOpen] = useState(false);
  const [datesError, setDatesError] = useState('');
  const [invitedEmails, setInvitedEmails] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const whereQueryRef = useRef('');

  const myEmail = String(user?.email || '').trim().toLowerCase();
  const totalTripDays = getTripDayCount(startDate, endDate);

  const cityDayPlan = useCityDayPlan(selectedLocations, totalTripDays);

  const getPendingWhereQuery = useCallback(() => whereQueryRef.current, []);

  const handleStartPlanning = useNewTripSubmit({
    navigate,
    getPendingWhereQuery,
    selectedLocations,
    startDate,
    endDate,
    invitedEmails,
    cityPlanRows: cityDayPlan.cityPlanRows,
    cityDayRanges: cityDayPlan.cityDayRanges,
    cityDayDrafts: cityDayPlan.cityDayDrafts,
    setDatesError,
    setSubmitError,
    setCityRangeError: cityDayPlan.setCityRangeError,
    setSubmitting,
  });

  const handleBackToTrips = (e) => {
    e.preventDefault();
    navigate('/', { replace: true, flushSync: true });

    setTimeout(() => {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;
      if (window.location.pathname !== '/') return;
      const stillOnNewTripView = Boolean(document.querySelector('.new-trip__main'));
      if (stillOnNewTripView) {
        window.location.assign('/');
      }
    }, 220);
  };

  return (
    <div className="new-trip">
      <header className="new-trip__header">
        <Link to="/" className="new-trip__back" aria-label="Back to My Trips" onClick={handleBackToTrips}>
          Back
        </Link>
      </header>

      <main className="new-trip__main">
        <h1 className="new-trip__title">Plan a new trip</h1>

        <form className="new-trip__form" onSubmit={handleStartPlanning}>
          <DestinationPickerField
            selectedLocations={selectedLocations}
            onLocationsChange={setSelectedLocations}
            onClearSubmitError={() => setSubmitError('')}
            onWhereQueryChange={(q) => {
              whereQueryRef.current = q;
            }}
          >
            <CityDayPlanSection
              selectedLocations={selectedLocations}
              totalTripDays={totalTripDays}
              cityPlanRows={cityDayPlan.cityPlanRows}
              cityDayRanges={cityDayPlan.cityDayRanges}
              cityDayDrafts={cityDayPlan.cityDayDrafts}
              cityRangeError={cityDayPlan.cityRangeError}
              defaultCityDayRanges={cityDayPlan.defaultCityDayRanges}
              onCityRangeInputChange={cityDayPlan.handleCityRangeInputChange}
              onCommitCityRangeInput={cityDayPlan.commitCityRangeInput}
              onAddCityPlanRow={cityDayPlan.addCityPlanRow}
              onRemoveCityPlanRow={cityDayPlan.removeCityPlanRow}
              onCityPlanRowLocationKeyChange={cityDayPlan.setCityPlanRowLocationKey}
            />
          </DestinationPickerField>

          <div className="new-trip__field">
            <label className="new-trip__label">Dates</label>
            <button
              type="button"
              className={`new-trip__date-btn ${datesError ? 'new-trip__date-btn--error' : ''}`}
              onClick={() => setDateModalOpen(true)}
              aria-label="Select trip dates"
            >
              <CalendarIcon size={18} className="new-trip__date-icon" aria-hidden />
              {startDate && endDate ? formatTripDates(startDate, endDate) : 'Select start and end date'}
            </button>
            {datesError && <p className="new-trip__error" role="alert">{datesError}</p>}
            <DateRangePickerModal
              open={dateModalOpen}
              start={startDate || null}
              end={endDate || null}
              title="When"
              onApply={(s, e) => {
                setStartDate(s);
                setEndDate(e);
                setDatesError('');
              }}
              onClose={() => setDateModalOpen(false)}
            />
          </div>

          <TripmatesInviteSection
            myEmail={myEmail}
            invitedEmails={invitedEmails}
            onInvitedEmailsChange={setInvitedEmails}
          />

          {submitError && (
            <p className="new-trip__error" role="alert">{submitError}</p>
          )}
          <button type="submit" className="new-trip__submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Start planning'}
          </button>
        </form>
      </main>
    </div>
  );
}
