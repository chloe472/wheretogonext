import { useEffect } from 'react';
import { fetchCitySuggestions } from '../../../api/locationsApi';

export function useTripDetailsWhereSuggestions({
  whereModalOpen,
  whereModalRef,
  whereQuery,
  setWhereSuggestionsOpen,
  setWhereLocationSuggestions,
  setWhereSuggestionsLoading,
}) {
  useEffect(() => {
    if (!whereModalOpen) return;

    function handleClickOutside(e) {
      if (whereModalRef.current && !whereModalRef.current.contains(e.target)) {
        setWhereSuggestionsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [whereModalOpen, whereModalRef, setWhereSuggestionsOpen]);

  useEffect(() => {
    if (!whereModalOpen) return () => {};

    const trimmed = whereQuery.trim();
    if (!trimmed) {
      setWhereLocationSuggestions([]);
      setWhereSuggestionsLoading(false);
      return () => {};
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setWhereSuggestionsLoading(true);
      try {
        const next = await fetchCitySuggestions(trimmed, { signal: controller.signal, limit: 12 });
        setWhereLocationSuggestions(Array.isArray(next) ? next : []);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setWhereLocationSuggestions([]);
        }
      } finally {
        setWhereSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [
    whereModalOpen,
    whereQuery,
    setWhereLocationSuggestions,
    setWhereSuggestionsLoading,
  ]);
}
