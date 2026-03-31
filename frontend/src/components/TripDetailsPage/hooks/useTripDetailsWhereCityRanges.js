import { useCallback, useEffect, useMemo } from 'react';
import {
  buildWhereDefaultCityDayRanges,
  getTripDayCount,
  getWhereLocationKey,
} from '../lib/tripDetailsPageHelpers';

export function useTripDetailsWhereCityRanges({
  whereModalOpen,
  whereSelectedLocations,
  whereModalDisplayStart,
  whereModalDisplayEnd,
  whereCityDayDrafts,
  setWhereCityDayRanges,
  setWhereCityDayDrafts,
}) {
  const whereTotalTripDays = useMemo(
    () => Math.max(1, getTripDayCount(whereModalDisplayStart, whereModalDisplayEnd) || 1),
    [whereModalDisplayStart, whereModalDisplayEnd],
  );

  const whereDefaultCityDayRanges = useMemo(
    () => buildWhereDefaultCityDayRanges(whereSelectedLocations, whereTotalTripDays),
    [whereSelectedLocations, whereTotalTripDays],
  );

  useEffect(() => {
    if (!whereModalOpen) return;
    setWhereCityDayRanges((prev) => {
      const next = {};
      whereSelectedLocations.forEach((loc) => {
        const key = getWhereLocationKey(loc);
        next[key] = prev[key] || whereDefaultCityDayRanges[key] || { startDay: 1, endDay: whereTotalTripDays };
      });
      return next;
    });
  }, [
    whereModalOpen,
    whereSelectedLocations,
    whereDefaultCityDayRanges,
    whereTotalTripDays,
    setWhereCityDayRanges,
  ]);

  useEffect(() => {
    if (!whereModalOpen) return;
    setWhereCityDayDrafts((prev) => {
      const validKeys = new Set(whereSelectedLocations.map((loc) => getWhereLocationKey(loc)));
      const next = {};
      Object.entries(prev).forEach(([key, value]) => {
        const [locKey] = key.split('::');
        if (validKeys.has(locKey)) next[key] = value;
      });
      return next;
    });
  }, [whereModalOpen, whereSelectedLocations, setWhereCityDayDrafts]);

  const getWhereCityDraftKey = useCallback(
    (loc, field) => `${getWhereLocationKey(loc)}::${field}`,
    [],
  );

  const updateWhereCityRange = useCallback((loc, field, value) => {
    const key = getWhereLocationKey(loc);
    const maxDay = Math.max(1, whereTotalTripDays || 1);
    const n = Number.parseInt(String(value), 10);
    const safe = Number.isFinite(n) ? Math.max(1, Math.min(maxDay, Math.round(n))) : 1;
    setWhereCityDayRanges((prev) => {
      const current = prev[key] || whereDefaultCityDayRanges[key] || { startDay: 1, endDay: maxDay };
      const next = { ...current, [field]: safe };
      if (next.startDay > next.endDay) {
        if (field === 'startDay') next.endDay = next.startDay;
        if (field === 'endDay') next.startDay = next.endDay;
      }
      return { ...prev, [key]: next };
    });
  }, [whereTotalTripDays, setWhereCityDayRanges, whereDefaultCityDayRanges]);

  const handleWhereCityRangeInputChange = useCallback((loc, field, value) => {
    const raw = String(value);
    const sanitized = raw.replace(/[^0-9]/g, '');
    const draftKey = getWhereCityDraftKey(loc, field);
    setWhereCityDayDrafts((prev) => ({ ...prev, [draftKey]: sanitized }));
  }, [getWhereCityDraftKey, setWhereCityDayDrafts]);

  const commitWhereCityRangeInput = useCallback((loc, field) => {
    const draftKey = getWhereCityDraftKey(loc, field);
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

    updateWhereCityRange(loc, field, raw);
    setWhereCityDayDrafts((prev) => {
      const next = { ...prev };
      delete next[draftKey];
      return next;
    });
  }, [
    getWhereCityDraftKey,
    whereCityDayDrafts,
    updateWhereCityRange,
    setWhereCityDayDrafts,
  ]);

  return {
    whereTotalTripDays,
    whereDefaultCityDayRanges,
    getWhereCityDraftKey,
    handleWhereCityRangeInputChange,
    commitWhereCityRangeInput,
  };
}
