import { useMemo, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
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

/** Call invalidateSize when the map container is resized (e.g. expand half/full) so the map fills the new size. */
function MapResizeHandler({ resizeKey }) {
  const map = useMap();
  useEffect(() => {
    if (!resizeKey) return;
    const t = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (_) {
        // ignore
      }
    }, 50);
    return () => clearTimeout(t);
  }, [map, resizeKey]);
  return null;
}

function MapCenterUpdater({ center }) {
  const map = useMap();
  const centerKey = Array.isArray(center) ? `${center[0]},${center[1]}` : '';

  useEffect(() => {
    if (!Array.isArray(center) || center.length !== 2) return;
    const [lat, lng] = center;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    try {
      map.setView([lat, lng], map.getZoom(), { animate: false });
    } catch (_) {
      // ignore
    }
  }, [map, centerKey]);

  return null;
}

function SelectedMarkerFocus({ marker }) {
  const map = useMap();
  const markerKey = marker ? `${marker.id}:${marker.lat},${marker.lng}` : '';

  useEffect(() => {
    if (!marker) return;
    if (!Number.isFinite(marker.lat) || !Number.isFinite(marker.lng)) return;
    try {
      const targetZoom = Math.max(map.getZoom(), 14);
      map.setView([marker.lat, marker.lng], targetZoom, { animate: true });
    } catch (_) {
      // ignore
    }
  }, [map, markerKey]);

  return null;
}

function getDefaultPopupForm(defaultDate = '') {
  return {
    date: defaultDate,
    startTime: '07:00',
    durationHrs: 1,
    durationMins: 0,
    note: '',
    cost: '',
    externalLink: '',
    travelDocs: [],
  };
}

const MAX_TRAVEL_DOC_BYTES = 3 * 1024 * 1024;

export default function TripMap({
  center = [47.6062, -122.3321],
  zoom = 11,
  markers = [],
  activeDayNums = [],
  className = '',
  fitBounds = true,
  resizeKey = '',
  selectedMarkerId = null,
  onMarkerClick = null,
  popupMode = 'basic',
  dayOptions = [],
  defaultPopupDate = '',
  onMarkerAddToTrip = null,
  onMarkerAddClick = null,
  onMarkerViewDetails = null,
}) {
  const markerRefs = useRef({});
  const hoverLeaveTimerRef = useRef(null);
  const [popupForms, setPopupForms] = useState({});
  const [hoveredMarkerId, setHoveredMarkerId] = useState(null);

  const visibleMarkers = useMemo(() => {
    if (!activeDayNums || activeDayNums.length === 0) return markers;
    return markers.filter((m) => m.dayNum != null && activeDayNums.includes(m.dayNum));
  }, [markers, activeDayNums]);

  const selectedMarker = useMemo(
    () => visibleMarkers.find((marker) => String(marker.id) === String(selectedMarkerId)) || null,
    [visibleMarkers, selectedMarkerId],
  );

  const defaultDateValue = useMemo(
    () => defaultPopupDate || dayOptions[0]?.value || '',
    [defaultPopupDate, dayOptions],
  );

  useEffect(() => {
    if (!selectedMarkerId) return;
    const ref = markerRefs.current[String(selectedMarkerId)];
    if (!ref || typeof ref.openPopup !== 'function') return;
    const timeoutId = setTimeout(() => {
      try {
        ref.openPopup();
      } catch (_) {
        // ignore
      }
    }, 60);
    return () => clearTimeout(timeoutId);
  }, [selectedMarkerId, visibleMarkers.length]);

  useEffect(() => () => {
    if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current);
  }, []);

  const getFormState = (markerId) => popupForms[markerId] || getDefaultPopupForm(defaultDateValue);

  const updateFormField = (markerId, key, value) => {
    setPopupForms((prev) => {
      const current = prev[markerId] || getDefaultPopupForm(defaultDateValue);
      return { ...prev, [markerId]: { ...current, [key]: value } };
    });
  };

  const handleMarkerSubmit = (event, marker) => {
    event.preventDefault();
    if (typeof onMarkerAddToTrip !== 'function') return;
    const formData = getFormState(marker.id);
    onMarkerAddToTrip(marker, formData);
  };

  const handleTravelDocsChange = (markerId, files) => {
    const selected = Array.from(files || [])
      .filter((file) => file && file.size <= MAX_TRAVEL_DOC_BYTES)
      .slice(0, 3);
    updateFormField(markerId, 'travelDocs', selected);
  };

  const handleMarkerAddClick = (marker) => {
    if (typeof onMarkerAddClick !== 'function') return;
    onMarkerAddClick(marker);
  };

  const handleMarkerViewDetails = (marker) => {
    if (typeof onMarkerViewDetails !== 'function') return;
    onMarkerViewDetails(marker);
  };

  const clearHoverLeaveTimer = () => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  };

  const keepHoverOpen = (markerId) => {
    clearHoverLeaveTimer();
    setHoveredMarkerId(String(markerId));
  };

  const scheduleHoverClose = (markerId) => {
    clearHoverLeaveTimer();
    hoverLeaveTimerRef.current = setTimeout(() => {
      setHoveredMarkerId((currentId) => (String(currentId) === String(markerId) ? null : currentId));
    }, 180);
  };

  return (
    <div className={`trip-map ${className}`.trim()}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="trip-map__container"
      >
        <MapCenterUpdater center={center} />
        <SelectedMarkerFocus marker={selectedMarker} />
        <MapResizeHandler resizeKey={resizeKey} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {fitBounds && visibleMarkers.length > 0 ? (
          <FitBounds markers={visibleMarkers} />
        ) : null}
        {visibleMarkers.map((m) => (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            ref={(ref) => {
              if (ref) markerRefs.current[String(m.id)] = ref;
              else delete markerRefs.current[String(m.id)];
            }}
            eventHandlers={{
              mouseover: () => {
                if (popupMode !== 'hover-preview') return;
                keepHoverOpen(m.id);
              },
              mouseout: () => {
                if (popupMode !== 'hover-preview') return;
                scheduleHoverClose(m.id);
              },
              click: () => {
                if (popupMode === 'hover-preview') {
                  setHoveredMarkerId(null);
                  handleMarkerAddClick(m);
                  return;
                }
                if (typeof onMarkerClick === 'function') onMarkerClick(m);
              },
            }}
            icon={L.divIcon({
              className: 'trip-map__marker',
              html: `<span class="trip-map__marker-dot" style="background:${
                DAY_COLORS[((m.dayNum || 1) % 5) || 0]
              }"></span>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            {popupMode === 'hover-preview' ? (
              String(hoveredMarkerId) === String(m.id) ? (
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -12]}
                  opacity={1}
                  interactive
                  eventHandlers={{
                    mouseover: () => keepHoverOpen(m.id),
                    mouseout: () => scheduleHoverClose(m.id),
                  }}
                >
                  <div className="trip-map__hover-card" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                    <strong className="trip-map__hover-title">{m.name || 'Place'}</strong>
                    {m.rating ? (
                      <p className="trip-map__hover-rating">⭐ {m.rating} ({(m.reviewCount || 0).toLocaleString()} reviews)</p>
                    ) : null}
                    <button
                      type="button"
                      className="trip-map__hover-details"
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setHoveredMarkerId(null);
                        handleMarkerViewDetails(m);
                      }}
                    >
                      View details
                    </button>
                  </div>
                </Tooltip>
              ) : null
            ) : (
              <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                {m.name || 'Place'}
              </Tooltip>
            )}
            {popupMode === 'hover-preview' ? null : (
              <Popup>
                {popupMode === 'itinerary' ? (
                <div className="trip-map__popup-form-wrap">
                  {m.image ? <img src={m.image} alt={m.name || 'Place'} className="trip-map__popup-image" /> : null}
                  <span className="trip-map__popup-day">Day {m.dayNum}</span>
                  <strong className="trip-map__popup-title">{m.name || 'Place'}</strong>
                  {m.rating ? (
                    <p className="trip-map__popup-rating">⭐ {m.rating} ({(m.reviewCount || 0).toLocaleString()} reviews)</p>
                  ) : null}
                  {m.address ? <p className="trip-map__popup-address">{m.address}</p> : null}
                  <form className="trip-map__popup-form" onSubmit={(e) => handleMarkerSubmit(e, m)}>
                    <label>
                      Date *
                      <select
                        value={getFormState(m.id).date || defaultDateValue}
                        onChange={(e) => updateFormField(m.id, 'date', e.target.value)}
                        required
                      >
                        {dayOptions.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Start time *
                      <input
                        type="time"
                        value={getFormState(m.id).startTime}
                        onChange={(e) => updateFormField(m.id, 'startTime', e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Duration *
                      <div className="trip-map__popup-duration">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={getFormState(m.id).durationHrs}
                          onChange={(e) => updateFormField(m.id, 'durationHrs', Number(e.target.value) || 0)}
                        />
                        <span>hr</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          value={getFormState(m.id).durationMins}
                          onChange={(e) => updateFormField(m.id, 'durationMins', Number(e.target.value) || 0)}
                        />
                        <span>mins</span>
                      </div>
                    </label>
                    <label>
                      Note (Optional)
                      <textarea
                        rows={2}
                        placeholder="Enter your note..."
                        value={getFormState(m.id).note}
                        onChange={(e) => updateFormField(m.id, 'note', e.target.value)}
                      />
                    </label>
                    <label>
                      Cost (Optional)
                      <input
                        type="text"
                        placeholder="US$0.00"
                        value={getFormState(m.id).cost}
                        onChange={(e) => updateFormField(m.id, 'cost', e.target.value)}
                      />
                    </label>
                    <label>
                      External link (optional)
                      <input
                        type="url"
                        placeholder="https://"
                        value={getFormState(m.id).externalLink}
                        onChange={(e) => updateFormField(m.id, 'externalLink', e.target.value)}
                      />
                    </label>
                    <label>
                      Travel Documents
                      <input
                        type="file"
                        multiple
                        accept=".docx,.xlsx,.pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => handleTravelDocsChange(m.id, e.target.files)}
                      />
                      <small className="trip-map__popup-docs-hint">Supported file types: DOCX, XLSX, PDF, JPG, PNG or WEBP (max. 3 MB). Up to 3 files.</small>
                    </label>
                    <div className="trip-map__popup-actions">
                      <button type="button" className="trip-map__popup-secondary" onClick={() => handleMarkerViewDetails(m)}>View details</button>
                      <button type="submit" className="trip-map__popup-submit">Add to itinerary</button>
                    </div>
                  </form>
                </div>
                ) : popupMode === 'preview' ? (
                <div className="trip-map__popup-preview">
                  <span className="trip-map__popup-day">Day {m.dayNum}</span>
                  <strong className="trip-map__popup-title">{m.name || 'Place'}</strong>
                  {m.rating ? (
                    <p className="trip-map__popup-rating">⭐ {m.rating} ({(m.reviewCount || 0).toLocaleString()} reviews)</p>
                  ) : null}
                  {m.address ? <p className="trip-map__popup-address">{m.address}</p> : null}
                  {m.overview ? <p className="trip-map__popup-overview">{m.overview}</p> : null}
                  <button
                    type="button"
                    className="trip-map__popup-submit"
                    onClick={() => handleMarkerAddClick(m)}
                  >
                    Add to trip
                  </button>
                </div>
                ) : (
                <>
                  <span className="trip-map__popup-day">Day {m.dayNum}</span>
                  <strong>{m.name || 'Place'}</strong>
                </>
                )}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
