import { useEffect, useRef, useState } from 'react';
import { getTripDaysFromTrip } from '../lib/tripDetailsPageHelpers';

export function useTripDetailsTitleChrome({ trip, tripId, locationUpdateKey }) {
  const [titleDropdownOpen, setTitleDropdownOpen] = useState(false);
  const [titleEditing, setTitleEditing] = useState(false);
  const [titleEditValue, setTitleEditValue] = useState('');
  const [titleDisplay, setTitleDisplay] = useState('');
  const titleDropdownRef = useRef(null);
  const titleLastClickRef = useRef(0);

  useEffect(() => {
    if (trip) {
      const d = getTripDaysFromTrip(trip);
      setTitleDisplay(trip.title ?? `${d.length} days to ${trip.destination}`);
    }
  }, [tripId, trip?.destination, locationUpdateKey, trip]);

  useEffect(() => {
    if (!titleDropdownOpen) return;
    function handleClickOutside(e) {
      if (titleDropdownRef.current && !titleDropdownRef.current.contains(e.target)) {
        setTitleDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [titleDropdownOpen]);

  return {
    titleDropdownOpen,
    setTitleDropdownOpen,
    titleEditing,
    setTitleEditing,
    titleEditValue,
    setTitleEditValue,
    titleDisplay,
    setTitleDisplay,
    titleDropdownRef,
    titleLastClickRef,
  };
}
