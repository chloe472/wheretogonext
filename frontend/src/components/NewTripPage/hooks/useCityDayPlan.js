import { useState, useRef, useEffect } from 'react';
import {
  getLocationKey,
  buildDefaultCityDayRanges,
  getCityDayDraftKey,
} from '../lib/newTripPageHelpers.js';

/**
 * State and handlers for multi-city day allocation on the new-trip form.
 */
export function useCityDayPlan(selectedLocations, totalTripDays) {
  const cityPlanRowSeqRef = useRef(0);
  const [cityPlanRows, setCityPlanRows] = useState([]);
  const [cityDayRanges, setCityDayRanges] = useState({});
  const [cityDayDrafts, setCityDayDrafts] = useState({});
  const [cityRangeError, setCityRangeError] = useState('');

  const defaultCityDayRanges = buildDefaultCityDayRanges(selectedLocations, totalTripDays || 1);

  useEffect(() => {
    const selectedKeys = new Set(selectedLocations.map((loc) => getLocationKey(loc)));
    setCityPlanRows((prev) => {
      const next = prev.filter((row) => selectedKeys.has(row.locationKey));
      selectedLocations.forEach((loc) => {
        const key = getLocationKey(loc);
        if (!next.some((row) => row.locationKey === key)) {
          cityPlanRowSeqRef.current += 1;
          next.push({ id: `city-plan-${cityPlanRowSeqRef.current}`, locationKey: key });
        }
      });
      return next;
    });
  }, [selectedLocations]);

  useEffect(() => {
    setCityDayRanges((prev) => {
      const next = {};
      cityPlanRows.forEach((row) => {
        const fallback = defaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: Math.max(1, totalTripDays || 1) };
        next[row.id] = prev[row.id] || fallback;
      });
      return next;
    });
  }, [cityPlanRows, defaultCityDayRanges, totalTripDays]);

  useEffect(() => {
    setCityDayDrafts((prev) => {
      const validRowIds = new Set(cityPlanRows.map((row) => row.id));
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [rowId] = key.split('::');
        if (validRowIds.has(rowId)) {
          next[key] = value;
        }
      });
      return next;
    });
  }, [cityPlanRows]);

  const updateCityRange = (rowId, locationKey, field, value) => {
    if (cityRangeError) setCityRangeError('');
    const maxDay = Math.max(1, totalTripDays || 1);
    const n = Number.parseInt(String(value), 10);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(maxDay, Math.round(n))) : 1;
    setCityDayRanges((prev) => {
      const current = prev[rowId] || defaultCityDayRanges[locationKey] || { startDay: 1, endDay: maxDay };
      const next = { ...current, [field]: safe };
      if (next.startDay > next.endDay) {
        if (field === 'startDay') next.endDay = next.startDay;
        if (field === 'endDay') next.startDay = next.endDay;
      }
      return { ...prev, [rowId]: next };
    });
  };

  const handleCityRangeInputChange = (row, field, value) => {
    const raw = String(value);
    const sanitized = raw.replace(/[^0-9]/g, '');
    const draftKey = getCityDayDraftKey(row.id, field);
    if (cityRangeError) setCityRangeError('');
    setCityDayDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
  };

  const commitCityRangeInput = (row, field) => {
    const draftKey = getCityDayDraftKey(row.id, field);
    const raw = cityDayDrafts[draftKey];

    if (raw === undefined) return;

    if (!raw) {
      setCityDayDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      return;
    }

    const maxDay = Math.max(1, totalTripDays || 1);
    const parsed = Number.parseInt(String(raw), 10);
    if (Number.isFinite(parsed) && parsed > maxDay) {
      setCityRangeError(`Day cannot exceed Day ${maxDay}.`);
      return;
    }

    if (cityRangeError) setCityRangeError('');

    updateCityRange(row.id, row.locationKey, field, raw);
    setCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  };

  const addCityPlanRow = () => {
    if (!selectedLocations.length) return;
    if (cityRangeError) setCityRangeError('');
    cityPlanRowSeqRef.current += 1;
    setCityPlanRows((prev) => [
      ...prev,
      { id: `city-plan-${cityPlanRowSeqRef.current}`, locationKey: getLocationKey(selectedLocations[0]) },
    ]);
  };

  const removeCityPlanRow = (rowId) => {
    if (cityRangeError) setCityRangeError('');
    setCityPlanRows((prev) => prev.filter((row) => row.id !== rowId));
    setCityDayRanges((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[`${rowId}::startDay`];
      delete next[`${rowId}::endDay`];
      return next;
    });
  };

  const setCityPlanRowLocationKey = (rowId, nextKey) => {
    setCityPlanRows((prev) => prev.map((it) => (it.id === rowId ? { ...it, locationKey: nextKey } : it)));
  };

  return {
    cityPlanRows,
    cityDayRanges,
    cityDayDrafts,
    cityRangeError,
    setCityRangeError,
    defaultCityDayRanges,
    handleCityRangeInputChange,
    commitCityRangeInput,
    addCityPlanRow,
    removeCityPlanRow,
    setCityPlanRowLocationKey,
  };
}
