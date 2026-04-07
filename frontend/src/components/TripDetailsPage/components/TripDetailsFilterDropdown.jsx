import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function TripDetailsFilterDropdown({
  value,
  options,
  onChange,
  ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const normalizedOptions = useMemo(
    () => options.map((option) => (
      typeof option === 'string'
        ? { value: option, label: option }
        : { value: option.value, label: option.label }
    )),
    [options],
  );

  const selectedOption = normalizedOptions.find((option) => option.value === value);
  const selectedLabel = selectedOption ? selectedOption.label : String(value ?? '');

  return (
    <div className="trip-details__add-places-dropdown" ref={dropdownRef}>
      <button
        type="button"
        className={`trip-details__add-places-filter-btn ${open ? 'trip-details__add-places-filter-btn--open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="trip-details__add-places-filter-btn-text">{selectedLabel}</span>
        <ChevronDown size={14} className="trip-details__add-places-filter-chevron" aria-hidden />
      </button>
      {open && (
        <div className="trip-details__add-places-filter-menu" role="listbox" aria-label={ariaLabel}>
          {normalizedOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              className={`trip-details__add-places-filter-option ${value === option.value ? 'trip-details__add-places-filter-option--active' : ''}`}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}