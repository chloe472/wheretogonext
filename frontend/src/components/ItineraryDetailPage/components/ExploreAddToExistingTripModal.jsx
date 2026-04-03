import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ChevronDown } from 'lucide-react';
import { fetchItineraryById, fetchMyItineraries, updateItinerary } from '../../../api/itinerariesApi';
import TripDetailsAddToTripModal from '../../TripDetailsPage/components/TripDetailsAddToTripModal';
import SocialImportLocationMismatchBanner from '../../SocialImportModal/SocialImportLocationMismatchBanner';
import '../../TripDetailsPage/styles/trip-details-modal-shared.css';
import '../../TripDetailsPage/styles/trip-details-custom-place-modal.css';
import '../../TripDetailsPage/styles/trip-details-social-import-modal.css';
import '../exploreAddToTrip.css';
import { computeLocationInsight } from '../../TripDetailsPage/lib/tripLocationMismatch';
import {
  appendDestinationLabelToTripDoc,
  getDefaultStartTimeForDate,
  getDestinationList,
  getTripDaysFromTrip,
  tryAppendItemToExpenseList,
} from '../../TripDetailsPage/lib/tripDetailsPageHelpers';

export default function ExploreAddToExistingTripModal({
  open,
  onClose,
  addToTripItem,
  onSuccess,
}) {
  const [myTrips, setMyTrips] = useState([]);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [targetDoc, setTargetDoc] = useState(null);
  const [tripLoading, setTripLoading] = useState(false);

  const [addToTripDate, setAddToTripDate] = useState('');
  const [addToTripStartTime, setAddToTripStartTime] = useState('07:00');
  const [addToTripDurationHrs, setAddToTripDurationHrs] = useState('1');
  const [addToTripDurationMins, setAddToTripDurationMins] = useState('0');
  const [addToTripCheckInDate, setAddToTripCheckInDate] = useState('');
  const [addToTripCheckInTime, setAddToTripCheckInTime] = useState('15:00');
  const [addToTripCheckOutDate, setAddToTripCheckOutDate] = useState('');
  const [addToTripCheckOutTime, setAddToTripCheckOutTime] = useState('11:00');
  const [addToTripNotes, setAddToTripNotes] = useState('');
  const [addToTripCost, setAddToTripCost] = useState('');
  const [addToTripExternalLink, setAddToTripExternalLink] = useState('');
  const [addToTripTravelDocs, setAddToTripTravelDocs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [tripPickerOpen, setTripPickerOpen] = useState(false);
  const tripPickerRef = useRef(null);

  const days = getTripDaysFromTrip(targetDoc);
  const tripExpenseItems = Array.isArray(targetDoc?.tripExpenseItems) ? targetDoc.tripExpenseItems : [];

  const tripsWithDates = useMemo(
    () => myTrips.filter((t) => t?.startDate && t?.endDate),
    [myTrips],
  );
  const selectedTrip = useMemo(
    () => tripsWithDates.find((t) => String(t._id ?? t.id ?? '') === selectedTripId),
    [tripsWithDates, selectedTripId],
  );
  const selectedTripTitle = selectedTrip?.title?.trim() || 'Untitled trip';

  const exploreLocationInsight = useMemo(() => {
    if (!targetDoc || !addToTripItem?.data) return null;
    const d = addToTripItem.data;
    const sourceLabels = Array.isArray(addToTripItem.sourceItineraryDestinationLabels)
      ? addToTripItem.sourceItineraryDestinationLabels.map((s) => String(s || '').trim()).filter(Boolean)
      : [];
    const locality = String(d.locality || '').trim();
    const address = String(d.address || '').trim();
    const tripLabels = getDestinationList(targetDoc.destination, targetDoc.locations);

    if (locality || address) {
      return computeLocationInsight([{ locality, address }], tripLabels);
    }
    if (sourceLabels.length > 0) {
      return computeLocationInsight(
        sourceLabels.map((lbl) => ({ locality: '', address: lbl })),
        tripLabels,
      );
    }
    return null;
  }, [targetDoc, addToTripItem]);

  const handleAddDetectedDestinationFromExplore = useCallback(
    async (label) => {
      if (!selectedTripId || !targetDoc) return;
      const merged = appendDestinationLabelToTripDoc(targetDoc, label);
      if (!merged.ok) {
        if (merged.reason === 'duplicate') {
          toast(merged.message || 'That destination is already on your trip.');
        }
        return;
      }
      try {
        const updated = await updateItinerary(selectedTripId, {
          destination: merged.destination,
          locations: merged.locations,
        });
        if (updated) {
          setTargetDoc(updated);
        } else {
          const doc = await fetchItineraryById(selectedTripId);
          if (doc) setTargetDoc(doc);
        }
        const raw = String(label || '').trim();
        toast.success(`Added ${raw.split(',')[0].trim()} to your destinations`);
      } catch (e) {
        toast.error(e?.message || 'Could not update trip');
      }
    },
    [selectedTripId, targetDoc],
  );

  const resetFormForTrip = useCallback(
    (doc) => {
      const d = getTripDaysFromTrip(doc);
      const te = Array.isArray(doc?.tripExpenseItems) ? doc.tripExpenseItems : [];
      const first = d[0];
      const selectedDate = first?.date || '';
      const isStay = addToTripItem?.type === 'stay';
      if (isStay) {
        setAddToTripCheckInDate(selectedDate);
        setAddToTripCheckInTime('15:00');
        setAddToTripCheckOutDate(d.find((x) => x.dayNum === 2)?.date || selectedDate);
        setAddToTripCheckOutTime('11:00');
      } else {
        setAddToTripDate(selectedDate);
        setAddToTripStartTime(getDefaultStartTimeForDate(te, selectedDate, '07:00'));
        setAddToTripDurationHrs('1');
        setAddToTripDurationMins('0');
      }
      setAddToTripNotes('');
      setAddToTripCost('');
      setAddToTripExternalLink(String(addToTripItem?.data?.website || '').trim());
      setAddToTripTravelDocs([]);
    },
    [addToTripItem],
  );

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      setTripsLoading(true);
      try {
        const list = await fetchMyItineraries(ac.signal);
        if (cancelled) return;
        setMyTrips(Array.isArray(list) ? list : []);
        const withDates = (Array.isArray(list) ? list : []).filter((t) => t?.startDate && t?.endDate);
        const firstId = withDates[0]?._id ?? withDates[0]?.id ?? '';
        setSelectedTripId(firstId ? String(firstId) : '');
      } catch (e) {
        if (!cancelled && e?.name !== 'AbortError') {
          setMyTrips([]);
          toast.error(e?.message || 'Could not load your trips');
        }
      } finally {
        if (!cancelled) setTripsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [open]);

  useEffect(() => {
    if (!open || !selectedTripId) {
      setTargetDoc(null);
      return;
    }
    let cancelled = false;
    const ac = new AbortController();
    (async () => {
      setTripLoading(true);
      try {
        const doc = await fetchItineraryById(selectedTripId, ac.signal);
        if (cancelled) return;
        setTargetDoc(doc);
      } catch (e) {
        if (!cancelled && e?.name !== 'AbortError') {
          setTargetDoc(null);
          toast.error(e?.message || 'Could not load trip');
        }
      } finally {
        if (!cancelled) setTripLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [open, selectedTripId]);

  useEffect(() => {
    if (!open || !addToTripItem || !targetDoc) return;
    resetFormForTrip(targetDoc);
  }, [open, addToTripItem, targetDoc, resetFormForTrip]);

  useEffect(() => {
    if (!open) setTripPickerOpen(false);
  }, [open]);

  useEffect(() => {
    if (!tripPickerOpen) return undefined;
    function onDocMouseDown(e) {
      if (tripPickerRef.current && !tripPickerRef.current.contains(e.target)) {
        setTripPickerOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === 'Escape') setTripPickerOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [tripPickerOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!addToTripItem || !selectedTripId || !targetDoc) return;

    const currency = String(targetDoc.currency || 'USD');
    const exchangeRates = targetDoc.exchangeRates && typeof targetDoc.exchangeRates === 'object'
      ? targetDoc.exchangeRates
      : {};

    const values = addToTripItem.type === 'stay'
      ? {
        date: addToTripCheckInDate,
        checkInDate: addToTripCheckInDate,
        checkInTime: addToTripCheckInTime,
        checkOutDate: addToTripCheckOutDate,
        checkOutTime: addToTripCheckOutTime,
        note: addToTripNotes,
        cost: addToTripCost,
        externalLink: addToTripExternalLink,
        travelDocs: addToTripTravelDocs,
      }
      : {
        date: addToTripDate,
        startTime: addToTripStartTime,
        durationHrs: parseInt(addToTripDurationHrs, 10) || 0,
        durationMins: parseInt(addToTripDurationMins, 10) || 0,
        note: addToTripNotes,
        cost: addToTripCost,
        externalLink: addToTripExternalLink,
        travelDocs: addToTripTravelDocs,
      };

    const result = tryAppendItemToExpenseList(tripExpenseItems, {
      itemType: addToTripItem.type,
      data: addToTripItem.data,
      categoryId: addToTripItem.categoryId,
      category: addToTripItem.category,
      Icon: addToTripItem.Icon,
      values,
      currency,
      exchangeRates,
    });

    if (!result.ok) {
      toast.error(result.message || 'Could not add this stop');
      return;
    }

    setSaving(true);
    try {
      await updateItinerary(selectedTripId, { tripExpenseItems: result.tripExpenseItems });
      const name = addToTripItem.data?.name || 'Place';
      if (addToTripItem.type === 'stay') {
        toast.success(`Added ${name} to your trip.`);
      } else {
        const dayLabel = days.find((d) => d.date === addToTripDate)?.dayNum;
        toast.success(dayLabel ? `Added ${name} to Day ${dayLabel}.` : `Added ${name} to your trip.`);
      }
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toast.error(err?.message || 'Failed to save to trip');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !addToTripItem) return null;

  return (
    <div className="explore-add-to-trip-layer" role="presentation">
      <button type="button" className="explore-add-to-trip-layer__backdrop" aria-label="Close" onClick={onClose} />
      <div className="explore-add-to-trip-layer__stack">
        <div className="explore-add-to-trip-layer__trip-card">
          <h2 id="explore-add-trip-title" className="explore-add-to-trip-layer__title">Add to your trip</h2>
          <p className="explore-add-to-trip-layer__hint">Pick which trip to add this stop to, then set the day and time.</p>

          {tripsLoading ? (
            <p className="explore-add-to-trip-layer__status">Loading your trips…</p>
          ) : tripsWithDates.length === 0 ? (
            <p className="explore-add-to-trip-layer__status">
              You need a trip with start and end dates.{' '}
              <Link to="/new-trip">Plan a new trip</Link>
              {' '}or open an existing trip and set dates in trip planning.
            </p>
          ) : (
            <div className="explore-add-to-trip-layer__field">
              <span className="explore-add-to-trip-layer__label" id="explore-add-trip-picker-label">
                Trip
              </span>
              <div className="explore-add-to-trip-layer__picker-wrap" ref={tripPickerRef}>
                <button
                  type="button"
                  id="explore-add-trip-picker-trigger"
                  className="explore-add-to-trip-layer__picker-btn"
                  onClick={() => setTripPickerOpen((o) => !o)}
                  disabled={tripLoading || saving}
                  aria-expanded={tripPickerOpen}
                  aria-haspopup="listbox"
                  aria-controls="explore-add-trip-picker-list"
                  aria-labelledby="explore-add-trip-picker-label"
                >
                  <span className="explore-add-to-trip-layer__picker-btn-text">{selectedTripTitle}</span>
                  <ChevronDown size={14} className="explore-add-to-trip-layer__picker-chevron" aria-hidden />
                </button>
                {tripPickerOpen ? (
                  <div
                    id="explore-add-trip-picker-list"
                    className="explore-add-to-trip-layer__picker-dropdown"
                    role="listbox"
                    aria-label="Choose a trip"
                  >
                    {tripsWithDates.map((t) => {
                      const tid = String(t._id ?? t.id ?? '');
                      const isSelected = tid === selectedTripId;
                      return (
                        <button
                          key={tid}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          className={`explore-add-to-trip-layer__picker-option${isSelected ? ' explore-add-to-trip-layer__picker-option--active' : ''}`}
                          onClick={() => {
                            setSelectedTripId(tid);
                            setTripPickerOpen(false);
                          }}
                        >
                          {t.title?.trim() || 'Untitled trip'}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {tripLoading && selectedTripId ? (
          <p className="explore-add-to-trip-layer__status explore-add-to-trip-layer__trip-card">Loading trip…</p>
        ) : null}

        {!tripLoading && selectedTripId && days.length === 0 ? (
          <p className="explore-add-to-trip-layer__status explore-add-to-trip-layer__trip-card">
            This trip has no valid date range. Open{' '}
            <Link to={`/trip/${encodeURIComponent(selectedTripId)}`}>trip planning</Link>
            {' '}and set dates.
          </p>
        ) : null}

        {!tripLoading && selectedTripId && days.length > 0 ? (
          <div className="explore-add-to-trip-layer__modal-wrap">
            <SocialImportLocationMismatchBanner
              locationInsight={exploreLocationInsight}
              onAddDetectedDestination={handleAddDetectedDestinationFromExplore}
            />
            <TripDetailsAddToTripModal
              showBackdrop={false}
              submitting={saving}
              onClose={onClose}
              onSubmit={handleSubmit}
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
