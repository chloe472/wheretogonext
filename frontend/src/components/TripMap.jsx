import { useMemo, useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { resolveImageUrl, applyImageFallback } from '../lib/imageFallback';
import './TripMap.css';

const DAY_COLORS = ['#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#ea580c'];
// Colorful raster basemap (Carto Voyager) — good OSM-derived colored style without API key
const ENGLISH_TILE_URL = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';
const ENGLISH_TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const MARKER_VARIANTS = {
  sight: { className: 'trip-map__marker-pin--sight', glyph: '🏰' },
  shopping: { className: 'trip-map__marker-pin--shopping', glyph: '🛍️' },
  food: { className: 'trip-map__marker-pin--food', glyph: '🍸' },
  nature: { className: 'trip-map__marker-pin--nature', glyph: '🌲' },
  experience: { className: 'trip-map__marker-pin--experience', glyph: '⭐' },
  trip: { className: 'trip-map__marker-pin--trip', glyph: '•' },
};

function inferMarkerVariant(marker) {
  if (!marker) return 'sight';

  const markerType = String(marker.markerType || '').toLowerCase();
  if (markerType === 'food') return 'food';
  if (markerType === 'experience') return 'experience';
  if (markerType === 'trip') return 'trip';

  const tags = Array.isArray(marker.tags)
    ? marker.tags
    : Array.isArray(marker.originalData?.tags)
      ? marker.originalData.tags
      : [];

  const typeHints = [
    marker.markerCategory,
    marker.type,
    marker.originalData?.type,
    ...tags,
    marker.name,
    marker.address,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/(food|restaurant|dining|cafe|bar|drink|cocktail)/.test(typeHints)) return 'food';
  if (/(shop|shopping|mall|market|boutique|store)/.test(typeHints)) return 'shopping';
  if (/(park|garden|nature|trail|forest|mountain|beach|waterfall)/.test(typeHints)) return 'nature';

  return 'sight';
}

function getMarkerIcon(marker) {
  const variantKey = inferMarkerVariant(marker);
  const variant = MARKER_VARIANTS[variantKey] || MARKER_VARIANTS.sight;
  const dayColor = DAY_COLORS[((Number(marker?.dayNum) || 1) % 5) || 0];
  const styleAttr = variantKey === 'trip' ? ` style=\"background:${dayColor}\"` : '';

  return L.divIcon({
    className: 'trip-map__marker',
    html: `<span class=\"trip-map__marker-pin ${variant.className}\"${styleAttr}><span class=\"trip-map__marker-glyph\">${variant.glyph}</span></span>`,
    iconSize: [28, 36],
    iconAnchor: [14, 34],
    popupAnchor: [0, -30],
  });
}

function FitBounds({ markers, disabled = false }) {
  const map = useMap();
  const key = markers?.length ? markers.map((m) => `${m.lat},${m.lng}`).join('|') : '';
  useEffect(() => {
    if (disabled) return;
    if (!markers || markers.length === 0) return;
    try {
      if (markers.length === 1) {
        const m = markers[0];
        map.setView([m.lat, m.lng], 13, { animate: false });
        return;
      }
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 14 });
    } catch (_) {
      // ignore
    }
  }, [map, key, disabled]);
  return null;
}

/** Call invalidateSize when the map container is resized (e.g. expand half/full) so the map fills the new size. */
function MapResizeHandler({ resizeKey }) {
  const map = useMap();

  const invalidateMapSize = () => {
    try {
      map.invalidateSize({ pan: false, animate: false });
    } catch (_) {
      // ignore
    }
  };

  useEffect(() => {
    // Handle explicit layout mode changes (Default/Expand half/Expand full).
    const t = setTimeout(() => invalidateMapSize(), resizeKey ? 50 : 0);
    return () => clearTimeout(t);
  }, [map, resizeKey]);

  useEffect(() => {
    const container = map.getContainer?.();
    if (!container || typeof ResizeObserver === 'undefined') return undefined;

    let rafId = 0;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        invalidateMapSize();
        rafId = 0;
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [map]);

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

  const handleImageError = (event) => {
    applyImageFallback(event);
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
          attribution={ENGLISH_TILE_ATTRIBUTION}
          url={ENGLISH_TILE_URL}
        />
        {fitBounds && visibleMarkers.length > 0 ? (
          <FitBounds markers={visibleMarkers} disabled={Boolean(selectedMarker)} />
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
            icon={getMarkerIcon(m)}
          >
            {popupMode === 'hover-preview' ? (
              (String(hoveredMarkerId) === String(m.id) || String(selectedMarkerId) === String(m.id)) ? (
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
                    <img
                      src={resolveImageUrl(m.image, m.name, m.markerType || 'place')}
                      alt={m.name || 'Place'}
                      className="trip-map__popup-image"
                      data-image-hint={m.name || ''}
                      data-image-topic={m.markerType || 'place'}
                      onError={handleImageError}
                    />
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