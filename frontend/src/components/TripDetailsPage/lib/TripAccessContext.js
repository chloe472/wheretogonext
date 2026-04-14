import { createContext, useContext } from 'react';

export const TripAccessContext = createContext({ readOnly: false, canPublish: false });

export function useTripAccess() {
  return useContext(TripAccessContext);
}
