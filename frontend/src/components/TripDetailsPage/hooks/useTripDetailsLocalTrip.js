import { useEffect, useMemo, useState } from 'react';

export function useTripDetailsLocalTrip(tripData) {
  const [localDestination, setLocalDestination] = useState(null);
  const [localLocations, setLocalLocations] = useState(null);

  const trip = useMemo(() => {
    if (!tripData) return null;
    if (localDestination !== null || localLocations !== null) {
      return {
        ...tripData,
        destination: localDestination ?? tripData.destination,
        locations: localLocations ?? tripData.locations,
      };
    }
    return tripData;
  }, [tripData, localDestination, localLocations]);

  useEffect(() => {
    if (localDestination !== null && tripData?.destination === localDestination) {
      setLocalDestination(null);
    }
    if (localLocations !== null && tripData?.locations === localLocations) {
      setLocalLocations(null);
    }
  }, [tripData, localDestination, localLocations]);

  return { trip, setLocalDestination, setLocalLocations };
}
