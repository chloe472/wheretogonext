import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAP_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const MAP_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const redFlagIcon = L.divIcon({
  className: 'profile-page__leaflet-marker',
  html: '<span class="profile-page__leaflet-pin"></span>',
  iconSize: [30, 36],
  iconAnchor: [15, 34],
  tooltipAnchor: [0, -20],
});

export default function ProfileOverview({
  isSelf,
  displayName,
  countriesCount,
  citiesCount,
  onViewDestinations,
  onAddDestination,
  geoLoading,
  geoError,
  geoData,
  mapFlags,
}) {
  return (
    <>
      <div className="profile-page__map-header">
        <div>
          <h2 className="profile-page__section-title profile-page__section-title--inline">
            {isSelf ? 'My Destinations' : `${displayName}'s Destinations`}
          </h2>
          <div className="profile-page__map-stats">
            <div className="profile-page__map-stat">
              <span className="profile-page__map-stat-number">{countriesCount}</span>
              <span className="profile-page__map-stat-label">Countries</span>
            </div>
            <span className="profile-page__map-stat-divider">·</span>
            <div className="profile-page__map-stat">
              <span className="profile-page__map-stat-number">{citiesCount}</span>
              <span className="profile-page__map-stat-label">Cities</span>
            </div>
          </div>
        </div>
        <div className="profile-page__map-actions">
          <button
            type="button"
            className="profile-page__map-add profile-page__map-add--secondary"
            onClick={onViewDestinations}
          >
            View destinations
          </button>
          {isSelf && (
            <button
              type="button"
              className="profile-page__map-add"
              onClick={onAddDestination}
            >
              + Add destination
            </button>
          )}
        </div>
      </div>
      <div className="profile-page__map-card">
        {geoLoading && (
          <div className="profile-page__map-empty">Loading map…</div>
        )}
        {geoError && !geoLoading && (
          <div className="profile-page__map-empty">{geoError}</div>
        )}
        {!geoLoading && !geoError && (
          <MapContainer
            center={[20, 0]}
            zoom={2}
            minZoom={1}
            scrollWheelZoom
            className="profile-page__map"
          >
            <TileLayer attribution={MAP_ATTRIBUTION} url={MAP_TILE_URL} />
            {geoData && (
              <GeoJSON
                data={geoData}
                style={{
                  color: '#d9c7b5',
                  weight: 1,
                  fillColor: '#f8f3ee',
                  fillOpacity: 0.7,
                }}
              />
            )}
            {mapFlags.map((flag) => (
              <Marker key={flag.name} position={flag.position} icon={redFlagIcon}>
                <Tooltip>{flag.name}</Tooltip>
              </Marker>
            ))}
          </MapContainer>
        )}
        {!geoLoading && !geoError && mapFlags.length === 0 && (
          <div className="profile-page__map-empty profile-page__map-empty--overlay">
            {isSelf
              ? 'Add a destination or create a trip to start your travel map.'
              : 'No destinations yet.'}
          </div>
        )}
      </div>
    </>
  );
}
