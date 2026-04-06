import { useEffect } from 'react';
import { getNotificationStreamUrl } from '../../../api/notificationsApi';

/**
 * While the trip planner is open, listen for itinerary update notifications and refetch when this trip changed.
 */
export function useTripDetailsPlannerNotificationStream(tripId, userId, refetchItineraryIfNewer) {
  useEffect(() => {
    const uid = String(userId || '').trim();
    const tid = String(tripId || '').trim();
    if (!uid || !tid || typeof refetchItineraryIfNewer !== 'function') return undefined;

    const streamUrl = getNotificationStreamUrl();
    if (!streamUrl) return undefined;

    let es = null;
    let reconnectTimer = null;
    let reconnectDelay = 2000;
    let cancelled = false;

    const handlePayload = (raw) => {
      try {
        const n = typeof raw === 'string' ? JSON.parse(raw) : raw;
        const type = String(n?.type || '');
        const iid = String(n?.meta?.itineraryId || '').trim();
        if (!iid || iid !== tid) return;
        if (type === 'itinerary_updated' || type === 'itinerary_added') {
          refetchItineraryIfNewer();
        }
      } catch {
        /* ignore */
      }
    };

    function connectSSE() {
      if (cancelled) return;
      es = new EventSource(streamUrl);

      es.addEventListener('connected', () => {
        reconnectDelay = 2000;
      });

      es.addEventListener('notification', (e) => {
        if (cancelled) return;
        handlePayload(e.data);
      });

      es.onerror = () => {
        es.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectSSE();
          }, reconnectDelay);
        }
      };
    }

    connectSSE();

    return () => {
      cancelled = true;
      if (es) es.close();
      clearTimeout(reconnectTimer);
    };
  }, [tripId, userId, refetchItineraryIfNewer]);
}
