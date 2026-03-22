import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const TILE_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Default marker icons (Vite / bundler friendly)
const _icon = L.Icon.Default.prototype;
delete _icon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function FitBounds({ places }) {
  const map = useMap();
  useEffect(() => {
    const pts = places.filter((p) => p.lat != null && p.lng != null);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView([pts[0].lat, pts[0].lng], 13);
      return;
    }
    const b = L.latLngBounds(pts.map((p) => [p.lat, p.lng]));
    map.fitBounds(b, { padding: [48, 48], maxZoom: 14 });
  }, [map, places]);
  return null;
}

export default function ItineraryPlacesMap({ places, className = '', height = 280 }) {
  const pts = Array.isArray(places) ? places.filter((p) => p.lat != null && p.lng != null) : [];
  const center = pts.length ? [pts[0].lat, pts[0].lng] : [15, 105];
  const zoom = pts.length ? 11 : 3;

  return (
    <div className={className} style={{ height, borderRadius: 12, overflow: 'hidden' }}>
      <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        <FitBounds places={pts} />
        {pts.map((p, i) => (
          <Marker key={`${p.name}-${i}`} position={[p.lat, p.lng]}>
            <Popup>
              <strong>{p.name || 'Place'}</strong>
              {p.address ? <div style={{ fontSize: 12, marginTop: 4 }}>{p.address}</div> : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
