import { useState, useRef, useEffect } from 'react';
import { fetchCitySuggestions } from '../../../api/locationsApi';
import {
  TYPE_LABELS,
  isCityLocation,
  resolveTypedLocation,
  getLocationLabel,
  getLocationKey,
} from '../lib/newTripPageHelpers.js';

export default function DestinationPickerField({
  selectedLocations,
  onLocationsChange,
  onClearSubmitError,
  onWhereQueryChange,
  children,
}) {
  const [whereQuery, setWhereQuery] = useState('');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [whereOpen, setWhereOpen] = useState(false);
  const whereRef = useRef(null);

  useEffect(() => {
    onWhereQueryChange?.(whereQuery);
  }, [whereQuery, onWhereQueryChange]);

  useEffect(() => {
    const trimmed = whereQuery.trim();
    if (!trimmed) {
      setLocationSuggestions([]);
      setSuggestionsLoading(false);
      return () => {};
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const next = await fetchCitySuggestions(trimmed, { signal: controller.signal, limit: 12 });
        setLocationSuggestions(Array.isArray(next) ? next : []);
      } catch (error) {
        if (error?.name !== 'AbortError') {
          setLocationSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 220);

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [whereQuery]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (whereRef.current && !whereRef.current.contains(e.target)) {
        setWhereOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addLocation = (loc) => {
    if (!loc) return;
    onLocationsChange((prev) => {
      const nextKey = getLocationKey(loc);
      if (prev.some((item) => getLocationKey(item) === nextKey)) return prev;
      return [...prev, loc];
    });
    setWhereQuery('');
    setWhereOpen(false);
  };

  const suggestions = locationSuggestions.filter(
    (loc) => isCityLocation(loc)
      && !selectedLocations.some((selected) => getLocationKey(selected) === getLocationKey(loc)),
  );

  const commitPendingLocation = () => {
    const resolved = resolveTypedLocation(whereQuery);
    if (!resolved) return null;
    addLocation(resolved);
    onClearSubmitError?.();
    return resolved;
  };

  return (
    <div className="new-trip__field" ref={whereRef}>
      <label htmlFor="where" className="new-trip__label">Where to?</label>
      <input
        id="where"
        type="text"
        className="new-trip__input new-trip__input--where"
        placeholder="e.g. Paris, Berlin, Tokyo"
        value={whereQuery}
        onChange={(e) => {
          setWhereQuery(e.target.value);
          setWhereOpen(true);
        }}
        onFocus={() => setWhereOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commitPendingLocation();
          }
        }}
        autoComplete="off"
        aria-expanded={whereOpen}
        aria-controls="where-listbox"
        aria-autocomplete="list"
        role="combobox"
        aria-label="Destination"
      />
      {whereOpen && (
        <ul
          id="where-listbox"
          className="new-trip__suggestions"
          role="listbox"
        >
          {suggestionsLoading ? (
            <li className="new-trip__suggestion new-trip__suggestion--empty" role="option">
              Searching cities...
            </li>
          ) : suggestions.length === 0 ? (
            <li className="new-trip__suggestion new-trip__suggestion--empty" role="option">
              No results
            </li>
          ) : (
            suggestions.map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  className="new-trip__suggestion"
                  role="option"
                  aria-selected={selectedLocations.some((item) => getLocationKey(item) === getLocationKey(loc))}
                  onClick={() => addLocation(loc)}
                >
                  <span className="new-trip__suggestion-name">{loc.name}</span>
                  {loc.country && (
                    <span className="new-trip__suggestion-meta">{loc.country}</span>
                  )}
                  <span className={`new-trip__type-badge new-trip__type-badge--${loc.type.toLowerCase()}`}>
                    {TYPE_LABELS[loc.type] || loc.type}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
      {(selectedLocations.length > 0 || whereQuery.trim()) && (
        <div className="new-trip__chips" aria-label="Selected destinations">
          {selectedLocations.map((loc) => (
            <span key={getLocationKey(loc)} className="new-trip__chip">
              {getLocationLabel(loc)}
              <button
                type="button"
                className="new-trip__chip-remove"
                onClick={() => onLocationsChange((prev) => prev.filter((item) => getLocationKey(item) !== getLocationKey(loc)))}
                aria-label={`Remove ${getLocationLabel(loc)}`}
              >
                ×
              </button>
            </span>
          ))}
          {whereQuery.trim() && (
            <button
              type="button"
              className="new-trip__chip new-trip__chip--pending"
              onClick={commitPendingLocation}
              aria-label={`Add ${whereQuery.trim()}`}
            >
              + Add &quot;{whereQuery.trim()}&quot;
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
