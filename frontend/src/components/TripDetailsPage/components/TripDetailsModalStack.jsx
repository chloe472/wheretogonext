import TripDetailsDiscoveryModals from './TripDetailsDiscoveryModals';
import TripDetailsSettingsTransportModals from './TripDetailsSettingsTransportModals';
import TripDetailsTailModals from './TripDetailsTailModals';

export default function TripDetailsModalStack(props) {
  return (
    <>
      <TripDetailsSettingsTransportModals {...props} />
      <TripDetailsDiscoveryModals {...props} />
      <TripDetailsTailModals {...props} />
    </>
  );
}
