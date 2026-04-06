import { createContext, useContext } from 'react';

export const TripAccessContext = createContext({ readOnly: false });

export function useTripAccess() {
  return useContext(TripAccessContext);
}
