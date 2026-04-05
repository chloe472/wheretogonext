import DashboardTripCard from '../../Dashboard/components/DashboardTripCard';
import { mapItineraryToTripRow } from '../../Dashboard/lib/dashboardTripUtils';

export default function ProfileTrips({
  isSelf,
  trips,
  openOwnerMenuId,
  openStatusDropdownId,
  statusDropdownRef,
  ownerMenuRef,
  tripStatuses,
  setOpenOwnerMenuId,
  setOpenStatusDropdownId,
  setTripStatus,
  handleItineraryOwnerMenu,
  onTripOpen,
  getTripLink,
}) {
  return (
    <>
      <h2 className="profile-page__section-title">{isSelf ? 'My Trips' : 'Trips'}</h2>
      {trips.length === 0 ? (
        <p className="profile-page__empty">
          {isSelf ? 'No trips yet.' : 'No trips yet for this traveler.'}
        </p>
      ) : (
        <ul className="dashboard__trip-list profile-page__trip-grid">
          {trips.map((trip) => {
            const row = mapItineraryToTripRow(trip);
            return (
              <DashboardTripCard
                key={row.id}
                trip={row}
                tripStatuses={tripStatuses}
                openOwnerMenuId={isSelf ? openOwnerMenuId : null}
                openStatusDropdownId={openStatusDropdownId}
                ownerMenuRef={ownerMenuRef}
                statusDropdownRef={statusDropdownRef}
                destinationCoverByQuery={{}}
                setOpenOwnerMenuId={setOpenOwnerMenuId}
                setOpenStatusDropdownId={setOpenStatusDropdownId}
                setTripStatus={setTripStatus}
                handleItineraryOwnerMenu={handleItineraryOwnerMenu}
                onOpenTrip={() => onTripOpen(getTripLink(trip))}
              />
            );
          })}
        </ul>
      )}
    </>
  );
}
