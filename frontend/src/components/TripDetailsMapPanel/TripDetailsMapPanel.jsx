import { ChevronDown, ZoomIn, Filter, Info } from 'lucide-react';
import TripMap from '../TripMap/TripMap';

const MAP_VIEWS = ['Default', 'Expand half', 'Expand full'];
const MAP_FILTERS = ['Places', 'Food & Beverages', 'Experiences', 'My Trip'];

export default function TripDetailsMapPanel({
  mapView,
  mapExpandOpen,
  setMapExpandOpen,
  setMapView,
  mapFilter,
  setMapFilter,
  resetMapDays,
  setMapDayFilterOpen,
  mapCenter,
  mapMarkers,
  activeDayNums,
  openAddToTripFromMapMarker,
  openAddPlacesDetailsFromMapMarker,
  panelWidth,
}) {
  return (
    <aside
      className={`trip-details__map-col trip-details__map-col--${mapView.toLowerCase().replace(/\s+/g, '-')}`}
      style={panelWidth ? { width: `${panelWidth}px`, flex: `0 0 ${panelWidth}px` } : undefined}
    >
      <div className="trip-details__map-header">
        <div className="trip-details__map-dropdown-wrap">
          <button
            type="button"
            className="trip-details__map-expand-btn"
            onClick={() => setMapExpandOpen((open) => !open)}
            aria-expanded={mapExpandOpen}
          >
            Expand Map
            <ChevronDown size={14} aria-hidden />
          </button>
          {mapExpandOpen && (
            <>
              <button
                type="button"
                className="trip-details__map-dropdown-backdrop"
                aria-label="Close"
                onClick={() => setMapExpandOpen(false)}
              />
              <div className="trip-details__map-dropdown">
                {MAP_VIEWS.map((view) => (
                  <button
                    key={view}
                    type="button"
                    className={`trip-details__map-dropdown-item ${mapView === view ? 'trip-details__map-dropdown-item--active' : ''}`}
                    onClick={() => {
                      setMapView(view);
                      setMapExpandOpen(false);
                    }}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="trip-details__map-filters">
          {MAP_FILTERS.map((filterItem) => (
            <button
              key={filterItem}
              type="button"
              className={`trip-details__map-filter ${mapFilter === filterItem ? 'trip-details__map-filter--active' : ''}`}
              onClick={() => setMapFilter(filterItem)}
            >
              {filterItem}
            </button>
          ))}
        </div>
      </div>

      <div className="trip-details__map-area">
        <TripMap
          center={mapCenter}
          zoom={11}
          markers={mapMarkers}
          activeDayNums={activeDayNums}
          className="trip-details__trip-map"
          fitBounds={mapMarkers.length > 0}
          resizeKey={mapView}
          popupMode="hover-preview"
          onMarkerAddClick={openAddToTripFromMapMarker}
          onMarkerViewDetails={openAddPlacesDetailsFromMapMarker}
        />
      </div>

      <div className="trip-details__map-controls">
        <button type="button" className="trip-details__map-ctrl">
          <ZoomIn size={14} aria-hidden />
          Zoom into...
        </button>
        <button
          type="button"
          className="trip-details__map-ctrl"
          onClick={() => {
            resetMapDays();
            setMapDayFilterOpen(true);
          }}
        >
          <Filter size={14} aria-hidden />
          Filter days
        </button>
        <div className="trip-details__map-zoom">
          <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom in">+</button>
          <button type="button" className="trip-details__map-zoom-btn" aria-label="Zoom out">−</button>
        </div>
        <button type="button" className="trip-details__map-info" aria-label="Map info">
          <Info size={16} aria-hidden />
        </button>
      </div>
    </aside>
  );
}
