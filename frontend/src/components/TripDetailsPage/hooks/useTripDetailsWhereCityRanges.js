import { useCallback, useEffect, useMemo } from 'react';
import {
  buildWhereDefaultCityDayRanges,
  getTripDayCount,
  getWhereLocationKey,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsWhereCityRanges({
  whereModalOpen,
  whereSelectedLocations,
  whereCityPlanRows,
  whereModalDisplayStart,
  whereModalDisplayEnd,
  whereCityDayDrafts,
  setWhereCityPlanRows,
  setWhereCityDayRanges,
  setWhereCityDayDrafts,
  setWhereCityRangeError,
}) {
  const whereTotalTripDays = useMemo(
    () => Math.max(1, getTripDayCount(whereModalDisplayStart, whereModalDisplayEnd) || 1),
    [whereModalDisplayStart, whereModalDisplayEnd],
  );

  const whereDefaultCityDayRanges = useMemo(
    () => buildWhereDefaultCityDayRanges(whereSelectedLocations, whereTotalTripDays),
    [whereSelectedLocations, whereTotalTripDays],
  );

  const createWhereCityPlanRowId = useCallback(
    (locationKey) => `${locationKey}::${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    [],
  );

  useEffect(() => {
    if (!whereModalOpen) return;
    const selectedKeys = new Set(whereSelectedLocations.map((loc) => getWhereLocationKey(loc)));
    setWhereCityPlanRows((prev) => {
      const next = (Array.isArray(prev) ? prev : []).filter((row) => selectedKeys.has(row.locationKey));
      whereSelectedLocations.forEach((loc) => {
        const key = getWhereLocationKey(loc);
        if (!next.some((row) => row.locationKey === key)) {
          next.push({ id: createWhereCityPlanRowId(key), locationKey: key });
        }
      });
      return next;
    });
  }, [
    whereModalOpen,
    whereSelectedLocations,
    setWhereCityPlanRows,
    createWhereCityPlanRowId,
  ]);

  useEffect(() => {
    if (!whereModalOpen) return;
    setWhereCityDayRanges((prev) => {
      const next = {};
      whereCityPlanRows.forEach((row) => {
        const fallback = whereDefaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: whereTotalTripDays };
        next[row.id] = prev[row.id] || fallback;
      });
      return next;
    });
  }, [
    whereModalOpen,
    whereCityPlanRows,
    whereDefaultCityDayRanges,
    whereTotalTripDays,
    setWhereCityDayRanges,
  ]);

  useEffect(() => {
    if (!whereModalOpen) return;
    setWhereCityDayDrafts((prev) => {
      const validRowIds = new Set(whereCityPlanRows.map((row) => row.id));
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [rowId] = key.split('::');
        if (validRowIds.has(rowId)) next[key] = value;
      });
      return next;
    });
  }, [whereModalOpen, whereCityPlanRows, setWhereCityDayDrafts]);

  const getWhereCityDraftKey = useCallback(
    (row, field) => `${row.id}::${field}`,
    [],
  );

  const updateWhereCityRange = useCallback((row, field, value) => {
    const maxDay = Math.max(1, whereTotalTripDays || 1);
    const n = Number.parseInt(String(value), 10);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(maxDay, Math.round(n))) : 1;
    setWhereCityDayRanges((prev) => {
      const current = prev[row.id] || whereDefaultCityDayRanges[row.locationKey] || { startDay: 1, endDay: maxDay };
      const next = { ...current, [field]: safe };
      if (next.startDay > next.endDay) {
        if (field === 'startDay') next.endDay = next.startDay;
        if (field === 'endDay') next.startDay = next.endDay;
      }
      return { ...prev, [row.id]: next };
    });
  }, [whereTotalTripDays, setWhereCityDayRanges, whereDefaultCityDayRanges]);

  const handleWhereCityRangeInputChange = useCallback((row, field, value) => {
    const raw = String(value);
    const sanitized = raw.replace(/[^0-9]/g, '');
    const draftKey = getWhereCityDraftKey(row, field);
    if (setWhereCityRangeError) setWhereCityRangeError('');
    setWhereCityDayDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
  }, [getWhereCityDraftKey, setWhereCityDayDrafts, setWhereCityRangeError]);

  const commitWhereCityRangeInput = useCallback((row, field) => {
    const draftKey = getWhereCityDraftKey(row, field);
    const raw = whereCityDayDrafts[draftKey];
    if (raw === undefined) return;

    if (!raw) {
      setWhereCityDayDrafts((prev) => {
        const next = { ...prev };
        delete next[draftKey];
        return next;
      });
      return;
    }

    const maxDay = Math.max(1, whereTotalTripDays || 1);
    const parsed = Number.parseInt(String(raw), 10);
    if (Number.isFinite(parsed) && parsed > maxDay) {
      if (setWhereCityRangeError) {
        setWhereCityRangeError(`Day cannot exceed Day ${maxDay}.`);
      }
      return;
    }

    if (setWhereCityRangeError) setWhereCityRangeError('');

    updateWhereCityRange(row, field, raw);
    setWhereCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, [
    getWhereCityDraftKey,
    whereCityDayDrafts,
    whereTotalTripDays,
    updateWhereCityRange,
    setWhereCityDayDrafts,
    setWhereCityRangeError,
  ]);

  const addWhereCityPlanRow = useCallback((locationKey) => {
    if (!locationKey) return;
    setWhereCityPlanRows((prev) => [
      ...(Array.isArray(prev) ? prev : []),
      { id: createWhereCityPlanRowId(locationKey), locationKey },
    ]);
  }, [setWhereCityPlanRows, createWhereCityPlanRowId]);

  const removeWhereCityPlanRow = useCallback((rowId) => {
    if (!rowId) return;
    setWhereCityPlanRows((prev) => (Array.isArray(prev) ? prev.filter((row) => row.id !== rowId) : prev));
    setWhereCityDayRanges((prev) => {
      const next = { ...prev };
      delete next[rowId];
      return next;
    });
    setWhereCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[`${rowId}::startDay`];
      delete next[`${rowId}::endDay`];
      return next;
    });
  }, [setWhereCityPlanRows, setWhereCityDayRanges, setWhereCityDayDrafts]);

  const updateWhereCityPlanRowLocation = useCallback((rowId, locationKey) => {
    if (!rowId || !locationKey) return;
    setWhereCityPlanRows((prev) => (Array.isArray(prev)
      ? prev.map((row) => (row.id === rowId ? { ...row, locationKey } : row))
      : prev));
  }, [setWhereCityPlanRows]);

  return {
    whereTotalTripDays,
    whereDefaultCityDayRanges,
    getWhereCityDraftKey,
    handleWhereCityRangeInputChange,
    commitWhereCityRangeInput,
    addWhereCityPlanRow,
    removeWhereCityPlanRow,
    updateWhereCityPlanRowLocation,
  };
}
