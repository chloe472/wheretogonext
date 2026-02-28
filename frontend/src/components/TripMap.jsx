import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TripMap.css';

const DAY_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#ea580c'];

function FitBounds({ markers }) {
  const map = useMap();
  const key = markers?.length ? markers.map((m) => `${m.lat},${m.lng}`).join('|') : '';
  useEffect(() => {
    if (!markers || markers.length === 0) return;
    try {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    } catch (_) {
      // ignore
    }
  }, [map, key]);
  return null;
}

export default function TripMap({
  center = [47.6062, -122.3321],
  zoom = 11,
  markers = [],
  activeDayNums = [],
  className = '',
  fitBounds = true,
}) {
  const visibleMarkers = useMemo(() => {
    if (!activeDayNums || activeDayNums.length === 0) return markers;
    return markers.filter((m) => m.dayNum != null && activeDayNums.includes(m.dayNum));
  }, [markers, activeDayNums]);

  return (
    <div className={`trip-map ${className}`.trim()}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="trip-map__container"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {fitBounds && visibleMarkers.length > 0 ? (
          <FitBounds markers={visibleMarkers} />
        ) : null}
        {visibleMarkers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={L.divIcon({
              className: 'trip-map__marker',
              html: `<span class="trip-map__marker-dot" style="background:${
                DAY_COLORS[((m.dayNum || 1) % 5) || 0]
              }"></span>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <span className="trip-map__popup-day">Day {m.dayNum}</span>
              <strong>{m.name || 'Place'}</strong>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
