import { useEffect, useMemo, useState } from 'react';
import { fetchMyItineraries, fetchSharedWithMeItineraries } from '../../../api/itinerariesApi';
import { fetchDiscoveryData } from '../../../api/discoveryApi';
import {
  mapItineraryToTripRow,
  getTripDestinationQuery,
  pickDiscoveryCoverImage,
} from '../lib/dashboardTripUtils';

function mergeDashboardTrips(mineRows, sharedRows) {
  const mine = Array.isArray(mineRows) ? mineRows : [];
  const shared = (Array.isArray(sharedRows) ? sharedRows : []).map((row) => ({
    ...row,
    __sharedWithMe: true,
  }));

  const mergedById = new Map();
  [...shared, ...mine].forEach((row) => {
    const key = String(row?._id ?? row?.id ?? '');
    if (key) mergedById.set(key, row);
  });

  return Array.from(mergedById.values()).sort(
    (a, b) => new Date(b?.updatedAt || b?.createdAt || 0) - new Date(a?.updatedAt || a?.createdAt || 0),
  );
}

export default function useDashboardTrips() {
  const [myTrips, setMyTrips] = useState([]);
  const [myTripsLoading, setMyTripsLoading] = useState(true);
  const [destinationCoverByQuery, setDestinationCoverByQuery] = useState({});

  const tripRows = useMemo(() => myTrips.map(mapItineraryToTripRow), [myTrips]);

  useEffect(() => {
    let cancelled = false;

    const neededQueries = Array.from(
      new Set(
        (Array.isArray(myTrips) ? myTrips : [])
          .map((trip) => getTripDestinationQuery(trip))
          .map((q) => q.trim())
          .filter((q) => q && !destinationCoverByQuery[q]),
      ),
    );

    if (neededQueries.length === 0) return undefined;

    async function loadCovers() {
      const updates = {};
      await Promise.all(
        neededQueries.map(async (query) => {
          try {
            const data = await fetchDiscoveryData(query, 8);
            const cover = pickDiscoveryCoverImage(data);
            if (cover) updates[query] = cover;
          } catch {
            // ignore cover lookup failures; destination fallback image remains in use
          }
        }),
      );

      if (!cancelled && Object.keys(updates).length > 0) {
        setDestinationCoverByQuery((prev) => ({ ...prev, ...updates }));
      }
    }

    loadCovers();
    return () => {
      cancelled = true;
    };
  }, [myTrips, destinationCoverByQuery]);

  useEffect(() => {
    let cancelled = false;

    async function loadTrips() {
      setMyTripsLoading(true);
      try {
        const [mineRows, sharedRows] = await Promise.all([
          fetchMyItineraries(),
          fetchSharedWithMeItineraries(),
        ]);

        if (cancelled) return;
        setMyTrips(mergeDashboardTrips(mineRows, sharedRows));
      } catch {
        if (!cancelled) setMyTrips([]);
      } finally {
        if (!cancelled) setMyTripsLoading(false);
      }
    }

    loadTrips();
    return () => {
      cancelled = true;
    };
  }, []);

  const refreshTrips = async () => {
    const [mineRows, sharedRows] = await Promise.all([
      fetchMyItineraries(),
      fetchSharedWithMeItineraries(),
    ]);
    setMyTrips(mergeDashboardTrips(mineRows, sharedRows));
  };

  return {
    myTrips,
    setMyTrips,
    myTripsLoading,
    tripRows,
    destinationCoverByQuery,
    refreshTrips,
  };
}
