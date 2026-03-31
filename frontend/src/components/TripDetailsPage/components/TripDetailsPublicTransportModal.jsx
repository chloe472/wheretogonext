import { useEffect, useState } from 'react';
import { Bus, Footprints, MapPin, Train, X } from 'lucide-react';

export default function TripDetailsPublicTransportModal({ onClose, segment }) {
  const [directions, setDirections] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(segment?.fromLat && segment?.toLat));

  useEffect(() => {
    if (!segment?.fromLat || !segment?.toLat) {
      setLoading(false);
      setDirections(null);
      return;
    }

    const fetchTransitDirections = () => {
      setLoading(true);
      setDirections(null);

      const waitForGoogleMaps = (callback, maxAttempts = 20) => {
        let attempts = 0;
        const checkInterval = setInterval(() => {
          attempts += 1;
          if (window.google && window.google.maps && window.google.maps.DirectionsService) {
            clearInterval(checkInterval);
            callback();
          } else if (attempts >= maxAttempts) {
            clearInterval(checkInterval);
            console.error('Google Maps SDK failed to load after', attempts, 'attempts');
            setLoading(false);
          }
        }, 200);
      };

      waitForGoogleMaps(() => {
        try {
          const service = new google.maps.DirectionsService();
          const origin = new google.maps.LatLng(segment.fromLat, segment.fromLng);
          const destination = new google.maps.LatLng(segment.toLat, segment.toLng);

          console.log('Requesting transit directions from', segment.fromLat, segment.fromLng, 'to', segment.toLat, segment.toLng);

          const departureTime = new Date();
          departureTime.setMinutes(departureTime.getMinutes() + 5);

          service.route({
            origin,
            destination,
            travelMode: google.maps.TravelMode.TRANSIT,
            transitOptions: {
              departureTime,
              modes: [
                google.maps.TransitMode.BUS,
                google.maps.TransitMode.RAIL,
                google.maps.TransitMode.SUBWAY,
                google.maps.TransitMode.TRAIN,
                google.maps.TransitMode.TRAM,
              ],
              routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS,
            },
            provideRouteAlternatives: false,
          }, (result, status) => {
            console.log('Transit directions response:', status, result);

            if (status === 'OK' && result?.routes?.[0]) {
              const route = result.routes[0];
              const steps = route.legs?.[0]?.steps || [];
              const hasTransit = steps.some((step) => step.travel_mode === 'TRANSIT');

              console.log('Transit route found:', route);
              console.log('Steps:', steps.map((s) => ({ mode: s.travel_mode, duration: s.duration?.text })));
              console.log('Has transit steps:', hasTransit);

              if (hasTransit) {
                setDirections(route);
              } else {
                console.warn('Route returned only walking steps - no transit available');
                setDirections(null);
              }
            } else if (status === 'ZERO_RESULTS') {
              console.log('No transit routes available between these locations');
              setDirections(null);
            } else {
              console.error('Transit directions error:', status, result);
              setDirections(null);
            }
            setLoading(false);
          });
        } catch (error) {
          console.error('Error fetching transit directions:', error);
          setLoading(false);
        }
      });
    };

    fetchTransitDirections();
  }, [segment]);

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__public-transport-modal" role="dialog" aria-labelledby="public-transport-title" aria-modal="true">
        <div className="trip-details__public-transport-head">
          <MapPin size={24} className="trip-details__public-transport-head-icon" aria-hidden />
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <h2 id="public-transport-title" className="trip-details__public-transport-title">Public Transport Directions</h2>
        <p className="trip-details__public-transport-subtitle">See detailed MRT, bus, and train routes between places.</p>

        {loading && (
          <div className="trip-details__public-transport-loading">
            <p>Loading transit directions...</p>
          </div>
        )}

        {!loading && !directions && (
          <div className="trip-details__public-transport-error">
            <p>No public transport route found.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--wtg-text-muted)' }}>
              Switch to driving or walking.
            </p>
          </div>
        )}

        {!loading && directions && (
          <div className="trip-details__public-transport-route">
            <div className="trip-details__public-transport-step">
              <span className="trip-details__public-transport-dot" aria-hidden />
              <div>
                <strong className="trip-details__public-transport-step-title">Departure location</strong>
                <p className="trip-details__public-transport-step-detail">{segment.fromName || 'Departure address'}</p>
              </div>
            </div>

            {directions.legs?.[0]?.steps?.map((step, stepIdx) => {
              const travelMode = step.travel_mode;
              const isTransit = travelMode === 'TRANSIT';
              const isWalking = travelMode === 'WALKING';
              const transitDetails = step.transit_details || step.transitDetails || step.transit || null;
              const distance = step.distance?.text || '';
              const duration = step.duration?.text || '';

              return (
                <div key={stepIdx}>
                  <div className="trip-details__public-transport-connector" />

                  {isWalking && (
                    <div className="trip-details__public-transport-step trip-details__public-transport-step--walk">
                      <Footprints size={18} aria-hidden />
                      <span>Walk</span>
                      <span className="trip-details__public-transport-step-meta">
                        {duration} ({distance})
                      </span>
                    </div>
                  )}

                  {isTransit && transitDetails && (
                    <>
                      <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                      <div className="trip-details__public-transport-step">
                        <span className="trip-details__public-transport-dot trip-details__public-transport-dot--highlight" aria-hidden />
                        <strong className="trip-details__public-transport-step-title">
                          {transitDetails.departure_stop?.name || transitDetails.departureStop?.name || 'Station'}
                        </strong>
                      </div>

                      <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                      <div className="trip-details__public-transport-step trip-details__public-transport-step--transit">
                        {(() => {
                          const vehicleType = (transitDetails.line?.vehicle?.type || '').toLowerCase();
                          const TransitIcon = vehicleType.includes('bus') ? Bus : Train;
                          return <TransitIcon size={18} aria-hidden />;
                        })()}
                        {transitDetails.line?.short_name && (
                          <span
                            className="trip-details__public-transport-line"
                            style={{
                              backgroundColor: transitDetails.line.color
                                ? (transitDetails.line.color.startsWith('#') ? transitDetails.line.color : `#${transitDetails.line.color}`)
                                : '#dc2626',
                              color: transitDetails.line.text_color
                                ? (transitDetails.line.text_color.startsWith('#') ? transitDetails.line.text_color : `#${transitDetails.line.text_color}`)
                                : '#ffffff',
                            }}
                          >
                            {transitDetails.line.short_name}
                          </span>
                        )}
                        <span>
                          {transitDetails.line?.name || transitDetails.line?.vehicle?.name || 'Transit'}
                        </span>
                        <span className="trip-details__public-transport-step-meta">
                          {duration} ({distance})
                          {(transitDetails.num_stops || transitDetails.numStops) && ` • ${transitDetails.num_stops || transitDetails.numStops} stops`}
                        </span>
                      </div>

                      <div className="trip-details__public-transport-connector trip-details__public-transport-connector--highlight" />
                      <div className="trip-details__public-transport-step">
                        <span className="trip-details__public-transport-dot" aria-hidden />
                        <strong className="trip-details__public-transport-step-title">
                          {transitDetails.arrival_stop?.name || transitDetails.arrivalStop?.name || 'Station'}
                        </strong>
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            <div className="trip-details__public-transport-step">
              <span className="trip-details__public-transport-dot" aria-hidden />
              <div>
                <strong className="trip-details__public-transport-step-title">Arrival location</strong>
                <p className="trip-details__public-transport-step-detail">{segment.toName || 'Arrival address'}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
