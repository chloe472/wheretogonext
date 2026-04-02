import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { TRIP_FILTERS } from '../lib/dashboardTripUtils';
import DashboardTripCard from './DashboardTripCard';
import './DashboardTripsSection.css';

const TRIPS_PER_PAGE = 9;

export default function DashboardTripsSection({
  tripFilter,
  setTripFilter,
  openTripFilterDropdown,
  setOpenTripFilterDropdown,
  tripFilterDropdownRef,
  myTripsLoading,
  myTrips,
  filteredTrips,
  tripStatuses,
  openOwnerMenuId,
  openStatusDropdownId,
  ownerMenuRef,
  statusDropdownRef,
  destinationCoverByQuery,
  setOpenOwnerMenuId,
  setOpenStatusDropdownId,
  setTripStatus,
  handleItineraryOwnerMenu,
  onOpenTrip,
}) {
  const [tripListPage, setTripListPage] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredTrips.length / TRIPS_PER_PAGE)),
    [filteredTrips.length],
  );

  const maxPageIndex = Math.max(0, totalPages - 1);
  const safePage = Math.min(tripListPage, maxPageIndex);
  const paginatedTrips = useMemo(() => {
    const start = safePage * TRIPS_PER_PAGE;
    return filteredTrips.slice(start, start + TRIPS_PER_PAGE);
  }, [filteredTrips, safePage]);

  useEffect(() => {
    setTripListPage(0);
  }, [tripFilter]);

  useEffect(() => {
    const maxP = Math.max(0, Math.ceil(filteredTrips.length / TRIPS_PER_PAGE) - 1);
    setTripListPage((p) => Math.min(p, maxP));
  }, [filteredTrips.length]);

  const currentPageDisplay = safePage + 1;
  const showPagination = !myTripsLoading && filteredTrips.length > TRIPS_PER_PAGE;

  return (
    <section className="dashboard__trips" id="my-trips">
      <h2 className="dashboard__section-title">Your Trips</h2>
      <p className="dashboard__trips-hint">
        Plan trips, publish to Explore, or share from the menu on each card.
      </p>
      <div className="dashboard__filters">
        <label htmlFor="trip-filter" className="dashboard__filter-label">Filter:</label>
        <div className="dashboard__filter-dropdown" ref={tripFilterDropdownRef}>
          <button
            id="trip-filter"
            type="button"
            className={`dashboard__filter-btn ${openTripFilterDropdown ? 'dashboard__filter-btn--open' : ''}`}
            aria-haspopup="listbox"
            aria-expanded={openTripFilterDropdown}
            onClick={() => setOpenTripFilterDropdown((o) => !o)}
          >
            <span className="dashboard__filter-btn-text">{tripFilter}</span>
            <ChevronDown size={14} className="dashboard__filter-chevron" aria-hidden />
          </button>
          {openTripFilterDropdown && (
            <div className="dashboard__filter-menu" role="listbox" aria-label="Trip filter">
              {TRIP_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  role="option"
                  aria-selected={tripFilter === filter}
                  className={`dashboard__filter-option ${tripFilter === filter ? 'dashboard__filter-option--active' : ''}`}
                  onClick={() => {
                    setTripFilter(filter);
                    setOpenTripFilterDropdown(false);
                  }}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {myTripsLoading && <p className="dashboard__trips-status">Loading your trips…</p>}
      {!myTripsLoading && myTrips.length === 0 && (
        <p className="dashboard__trips-empty">No trips yet. Start with &quot;New Trip&quot; above.</p>
      )}
      {!myTripsLoading && myTrips.length > 0 && filteredTrips.length === 0 && (
        <p className="dashboard__trips-empty">No trips match this filter.</p>
      )}

      <ul className="dashboard__trip-list">
        {!myTripsLoading && paginatedTrips.map((trip) => (
          <DashboardTripCard
            key={trip.id}
            trip={trip}
            tripStatuses={tripStatuses}
            openOwnerMenuId={openOwnerMenuId}
            openStatusDropdownId={openStatusDropdownId}
            ownerMenuRef={ownerMenuRef}
            statusDropdownRef={statusDropdownRef}
            destinationCoverByQuery={destinationCoverByQuery}
            setOpenOwnerMenuId={setOpenOwnerMenuId}
            setOpenStatusDropdownId={setOpenStatusDropdownId}
            setTripStatus={setTripStatus}
            handleItineraryOwnerMenu={handleItineraryOwnerMenu}
            onOpenTrip={onOpenTrip}
          />
        ))}
      </ul>

      {showPagination ? (
        <nav className="dashboard__trip-pagination" aria-label="Trip list pages">
          <button
            type="button"
            className="dashboard__trip-pagination-btn"
            onClick={() => setTripListPage((p) => Math.max(0, p - 1))}
            disabled={safePage <= 0}
            aria-label="Previous page"
          >
            <ChevronLeft size={18} aria-hidden />
            Previous
          </button>
          <span className="dashboard__trip-pagination-meta">
            Page {currentPageDisplay} of {totalPages}
          </span>
          <button
            type="button"
            className="dashboard__trip-pagination-btn"
            onClick={() => setTripListPage((p) => Math.min(maxPageIndex, p + 1))}
            disabled={safePage >= totalPages - 1}
            aria-label="Next page"
          >
            Next
            <ChevronRight size={18} aria-hidden />
          </button>
        </nav>
      ) : null}
    </section>
  );
}
