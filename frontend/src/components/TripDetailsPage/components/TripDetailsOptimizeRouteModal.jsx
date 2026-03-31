import { X } from 'lucide-react';
import {
  getSortedDayItems,
  isStayItem,
  minutesToHHmm,
  reorderByProximity,
  timeToMinutes,
} from '../lib/tripDetailsPageHelpers';

export default function TripDetailsOptimizeRouteModal({
  onClose,
  optimizeRouteDay,
  tripExpenseItems,
  setTripExpenseItems,
  optimizeRouteStartId,
  setOptimizeRouteStartId,
  optimizeRouteEndId,
  setOptimizeRouteEndId,
  showInAppNotice,
}) {
  const dayItems = getSortedDayItems(tripExpenseItems, optimizeRouteDay.date).filter((item) => !isStayItem(item));
  const startItem = dayItems.find((i) => i.id === optimizeRouteStartId) || dayItems[0];
  const endItem = dayItems.find((i) => i.id === optimizeRouteEndId) || dayItems[dayItems.length - 1];

  const handleOptimize = () => {
    if (!optimizeRouteDay || !startItem || !endItem || dayItems.length < 2) {
      onClose();
      return;
    }
    if (String(optimizeRouteStartId) === String(optimizeRouteEndId)) {
      showInAppNotice('Start and end point cannot be the same.', 'warning');
      return;
    }
    const reordered = reorderByProximity(dayItems, optimizeRouteStartId, optimizeRouteEndId);
    const startTimes = new Map();
    const baseStartRaw = String(dayItems[0]?.startTime || '08:00');
    const baseStartMins = /^\d{2}:\d{2}$/.test(baseStartRaw)
      ? timeToMinutes(baseStartRaw)
      : (8 * 60);
    let timeMins = baseStartMins;
    reordered.forEach((it) => {
      startTimes.set(String(it.id), minutesToHHmm(timeMins));
      const durationMins = (it.durationHrs ?? 1) * 60 + (it.durationMins ?? 0);
      timeMins += Math.max(durationMins, 30);
    });
    setTripExpenseItems((prev) => prev.map((it) => {
      if (it.date !== optimizeRouteDay.date || isStayItem(it)) return it;
      const assigned = startTimes.get(String(it.id));
      return assigned ? { ...it, startTime: assigned } : it;
    }));
    showInAppNotice(`Optimized Day ${optimizeRouteDay.dayNum} route.`, 'success');
    onClose();
  };

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__optimize-route-modal" role="dialog" aria-labelledby="optimize-route-title" aria-modal="true">
        <div className="trip-details__optimize-route-head">
          <h2 id="optimize-route-title" className="trip-details__optimize-route-title">Optimize Route</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <p className="trip-details__optimize-route-desc">
          Select a start and end point, and we&apos;ll automatically rearrange everything in between based on proximity to ensure you get the best route possible. If you change your mind, you can revert back to your original route.
        </p>
        <p className="trip-details__optimize-route-day-label">Day {optimizeRouteDay.dayNum}: {optimizeRouteDay.label}</p>
        <div className="trip-details__optimize-route-fields">
          <label className="trip-details__optimize-route-label">
            Start Point
            <select
              className="trip-details__optimize-route-select"
              value={optimizeRouteStartId}
              onChange={(e) => setOptimizeRouteStartId(e.target.value)}
            >
              {dayItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
          <label className="trip-details__optimize-route-label">
            End Point
            <select
              className="trip-details__optimize-route-select"
              value={optimizeRouteEndId}
              onChange={(e) => setOptimizeRouteEndId(e.target.value)}
            >
              {dayItems.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="trip-details__optimize-route-actions">
          <button type="button" className="trip-details__modal-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="trip-details__optimize-route-submit" onClick={handleOptimize}>
            Optimize
          </button>
        </div>
      </div>
    </>
  );
}
