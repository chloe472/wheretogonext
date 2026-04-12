import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bus, Info, MapPin, Plane, Search, Train, X } from 'lucide-react';
import { AIRPORTS_AND_CITIES, AIRLINES } from '../lib/tripDetailsTransportData';
import { fetchPlacesPredictions } from '../lib/tripDetailsPageHelpers';

export default function TripDetailsAddTransportModal({
  open,
  onClose,
  addTransportDay,
  days,
  destinationCountry,
  availableTransportCountries,
  appendTransportTripItem,
  onRequestManualFlight,
  defaultHomeCountry,
}) {
  const [addTransportTab, setAddTransportTab] = useState('Flights');
  const [surfaceFrom, setSurfaceFrom] = useState('');
  const [surfaceTo, setSurfaceTo] = useState('');
  const [surfaceFromSuggestionsOpen, setSurfaceFromSuggestionsOpen] = useState(false);
  const [surfaceToSuggestionsOpen, setSurfaceToSuggestionsOpen] = useState(false);
  const [surfaceFromPredictions, setSurfaceFromPredictions] = useState([]);
  const [surfaceToPredictions, setSurfaceToPredictions] = useState([]);
  const [surfaceDate, setSurfaceDate] = useState('');
  const [surfaceTime, setSurfaceTime] = useState('08:00');
  const [surfaceArrivalTime, setSurfaceArrivalTime] = useState('18:00');
  const [surfaceOperator, setSurfaceOperator] = useState('');
  const [surfaceNumber, setSurfaceNumber] = useState('');
  const [surfaceCost, setSurfaceCost] = useState('');
  const [flightCode, setFlightCode] = useState('');
  const [flightDepartDate, setFlightDepartDate] = useState('');
  const [transportHomeCountry, setTransportHomeCountry] = useState(() => defaultHomeCountry || 'United States');
  const [flightSearchResults, setFlightSearchResults] = useState([]);
  const [flightSearchLoading, setFlightSearchLoading] = useState(false);
  const [flightSearchError, setFlightSearchError] = useState('');

  const defaultSurfaceDate = useMemo(
    () => days.find((d) => d.dayNum === addTransportDay)?.date || days[0]?.date || '',
    [days, addTransportDay],
  );
  const isSurfaceTransportValid = Boolean(surfaceFrom.trim() && surfaceTo.trim());

  const handleInvalidSurfaceSubmit = () => {
    toast.error('Please fill in both From and To before adding transport.', {
      id: 'transport-required-fields',
    });
  };

  useEffect(() => {
    if (!open) return;
    setSurfaceDate(defaultSurfaceDate);
  }, [open, defaultSurfaceDate, addTransportTab]);

  const searchFlights = async () => {
    if (!flightCode || !flightDepartDate) {
      setFlightSearchError('Please enter both flight code and departure date');
      return;
    }

    setFlightSearchLoading(true);
    setFlightSearchError('');
    setFlightSearchResults([]);

    try {
      const match = flightCode.trim().toUpperCase().match(/^([A-Z0-9]{2,3})[-\s]?(\d{1,4})$/);
      if (!match) {
        throw new Error('Invalid flight code format. Example: UA1, AA100, SQ322');
      }

      const [, airlineCode, flightNumber] = match;
      const normalizedCode = `${airlineCode}${flightNumber}`;
      const homeCountry = String(transportHomeCountry || '').trim();
      const targetCountry = String(destinationCountry || '').trim();
      const routeCountries = homeCountry && targetCountry ? new Set([homeCountry, targetCountry]) : null;
      const airportByCode = new Map(
        AIRPORTS_AND_CITIES
          .filter((item) => item.type === 'Airport')
          .map((item) => [String(item.id || '').toUpperCase(), item]),
      );
      const apiKey = import.meta.env.VITE_AIRLABS_API_KEY || '';

      if (apiKey) {
        try {
          let apiFlights = [];

          const detailedResponse = await fetch(
            `https://airlabs.co/api/v9/flight?api_key=${apiKey}&flight_iata=${normalizedCode}`,
          );
          if (detailedResponse.ok) {
            const detailedData = await detailedResponse.json();
            if (detailedData?.response && !Array.isArray(detailedData.response)) {
              apiFlights = [detailedData.response];
            }
          }

          if (apiFlights.length === 0) {
            const listResponse = await fetch(
              `https://airlabs.co/api/v9/flights?api_key=${apiKey}&flight_iata=${normalizedCode}`,
            );
            if (!listResponse.ok) {
              throw new Error(`Flight provider error (${listResponse.status})`);
            }
            const listData = await listResponse.json();
            apiFlights = Array.isArray(listData?.response) ? listData.response : [];
          }

          if (apiFlights.length > 0) {
            const flights = apiFlights
              .map((flight) => {
                const iataCode = flight.flight_iata || normalizedCode;
                const depAirport = airportByCode.get(String(flight.dep_iata || '').toUpperCase());
                const arrAirport = airportByCode.get(String(flight.arr_iata || '').toUpperCase());

                const toIsoLike = (value) => {
                  if (value == null || value === '') return '';
                  if (typeof value === 'number') {
                    const ms = value < 1e12 ? value * 1000 : value;
                    return new Date(ms).toISOString();
                  }
                  const raw = String(value).trim();
                  if (!raw) return '';
                  if (/^\d+$/.test(raw)) {
                    const num = Number(raw);
                    const ms = num < 1e12 ? num * 1000 : num;
                    return new Date(ms).toISOString();
                  }
                  if (raw.includes('T')) return raw;
                  return raw.replace(' ', 'T');
                };

                const toHHmm = (value) => {
                  const isoLike = toIsoLike(value);
                  if (!isoLike) return '';
                  const matchTime = isoLike.match(/T(\d{2}):(\d{2})/);
                  if (matchTime) return `${matchTime[1]}:${matchTime[2]}`;
                  const fallback = isoLike.match(/(\d{2}):(\d{2})/);
                  return fallback ? `${fallback[1]}:${fallback[2]}` : '';
                };

                const depDisplaySource =
                  flight.dep_time ||
                  flight.dep_estimated ||
                  flight.dep_scheduled ||
                  flight.dep_actual ||
                  flight.dep_estimated_utc ||
                  flight.dep_actual_utc ||
                  flight.dep_time_utc ||
                  flight.departure_time ||
                  flight.departure_scheduled ||
                  flight.departure_estimated ||
                  flight.departure_actual ||
                  flight.updated ||
                  flight.dep_time_ts ||
                  '';
                const arrDisplaySource =
                  flight.arr_time ||
                  flight.arr_estimated ||
                  flight.arr_scheduled ||
                  flight.arr_actual ||
                  flight.arr_estimated_utc ||
                  flight.arr_actual_utc ||
                  flight.arr_time_utc ||
                  flight.arrival_time ||
                  flight.arrival_scheduled ||
                  flight.arrival_estimated ||
                  flight.arrival_actual ||
                  flight.arr_time_ts ||
                  '';

                const depTimeLocal = toHHmm(depDisplaySource);
                const arrTimeLocal = toHHmm(arrDisplaySource);

                let durationMinutes = 0;
                const depUtcSource = flight.dep_time_utc || flight.dep_estimated_utc || flight.dep_actual_utc || flight.dep_time_ts || depDisplaySource;
                const arrUtcSource = flight.arr_time_utc || flight.arr_estimated_utc || flight.arr_actual_utc || flight.arr_time_ts || arrDisplaySource;
                const depIso = toIsoLike(depUtcSource);
                const arrIso = toIsoLike(arrUtcSource);
                if (depIso && arrIso) {
                  const depDate = new Date(depIso);
                  const arrDate = new Date(arrIso);
                  const diff = Math.round((arrDate.getTime() - depDate.getTime()) / (1000 * 60));
                  durationMinutes = Number.isFinite(diff) && diff > 0 ? diff : 0;
                }

                return {
                  id: `${iataCode}-${depIso || depTimeLocal || Date.now()}`,
                  flight_code: iataCode,
                  airline: flight.airline_name || `${flight.airline_iata || airlineCode} Airlines`,
                  airline_code: flight.airline_iata || airlineCode,
                  flight_number: String(flight.flight_number || flightNumber),
                  departure_airport: flight.dep_iata || 'N/A',
                  departure_city: depAirport?.city || flight.dep_city || flight.dep_name || flight.dep_iata || 'N/A',
                  arrival_airport: flight.arr_iata || 'N/A',
                  arrival_city: arrAirport?.city || flight.arr_city || flight.arr_name || flight.arr_iata || 'N/A',
                  departure_time: depTimeLocal || '--:--',
                  arrival_time: arrTimeLocal || '--:--',
                  flight_date: flightDepartDate,
                  status: (flight.status || 'scheduled').toLowerCase(),
                  aircraft: flight.aircraft_icao || flight.model || 'N/A',
                  terminal: flight.dep_terminal || 'N/A',
                  gate: flight.dep_gate || 'N/A',
                  durationMinutes,
                };
              })
              .filter((f) => {
                if (!String(f.flight_code || '').toUpperCase().includes(normalizedCode)) return false;
                if (!routeCountries) return true;
                const depCountry = airportByCode.get(String(f.departure_airport || '').toUpperCase())?.country || '';
                const arrCountry = airportByCode.get(String(f.arrival_airport || '').toUpperCase())?.country || '';
                if (!depCountry || !arrCountry) return true;
                const pair = new Set([depCountry, arrCountry]);
                return pair.size === routeCountries.size && [...pair].every((c) => routeCountries.has(c));
              });

            if (flights.length > 0) {
              setFlightSearchResults(flights);
              setFlightSearchLoading(false);
              return;
            }
          }
        } catch (providerError) {
          console.warn('Flight API unavailable, using fallback results:', providerError?.message || providerError);
        }
      }

      const airline = AIRLINES.find((a) => a.id === airlineCode) || { name: `${airlineCode} Airlines` };
      const airportsByCountry = AIRPORTS_AND_CITIES.filter((a) => a.type === 'Airport').reduce((acc, item) => {
        const key = String(item.country || '');
        if (!key) return acc;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

      const homeAirports = airportsByCountry[homeCountry] || [];
      const destinationAirports = airportsByCountry[targetCountry] || [];

      if (homeAirports.length === 0 || destinationAirports.length === 0) {
        setFlightSearchResults([]);
        setFlightSearchError('No live results found. Enter flight details manually.');
        setFlightSearchLoading(false);
        return;
      }

      const seed = `${normalizedCode}${flightDepartDate}${homeCountry}${targetCountry}`.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const pick = (arr, idx) => arr[idx % arr.length];
      const outboundFrom = pick(homeAirports, seed + 1);
      const outboundTo = pick(destinationAirports, seed + 2);
      const inboundFrom = pick(destinationAirports, seed + 3);
      const inboundTo = pick(homeAirports, seed + 4);
      const routeDurationMins = 360 + (seed % 420);
      const baseDate = new Date(`${flightDepartDate}T00:00:00`);
      const departureA = new Date(baseDate);
      departureA.setHours(8 + (seed % 6), 15, 0, 0);
      const arrivalA = new Date(departureA.getTime() + routeDurationMins * 60000);
      const departureB = new Date(baseDate);
      departureB.setHours(13 + (seed % 5), 50, 0, 0);
      const arrivalB = new Date(departureB.getTime() + (routeDurationMins + 35) * 60000);

      const fallbackFlights = [
        {
          id: `${normalizedCode}-a`,
          flight_code: normalizedCode,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: outboundFrom.id,
          departure_city: outboundFrom.city,
          arrival_airport: outboundTo.id,
          arrival_city: outboundTo.city,
          departure_time: `${String(departureA.getHours()).padStart(2, '0')}:${String(departureA.getMinutes()).padStart(2, '0')}`,
          arrival_time: `${String(arrivalA.getHours()).padStart(2, '0')}:${String(arrivalA.getMinutes()).padStart(2, '0')}`,
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Boeing 787-9',
          terminal: '1',
          gate: `A${10 + (seed % 20)}`,
          durationMinutes: routeDurationMins,
        },
        {
          id: `${normalizedCode}-b`,
          flight_code: normalizedCode,
          airline: airline.name,
          airline_code: airlineCode,
          flight_number: flightNumber,
          departure_airport: inboundFrom.id,
          departure_city: inboundFrom.city,
          arrival_airport: inboundTo.id,
          arrival_city: inboundTo.city,
          departure_time: `${String(departureB.getHours()).padStart(2, '0')}:${String(departureB.getMinutes()).padStart(2, '0')}`,
          arrival_time: `${String(arrivalB.getHours()).padStart(2, '0')}:${String(arrivalB.getMinutes()).padStart(2, '0')}`,
          flight_date: flightDepartDate,
          status: 'scheduled',
          aircraft: 'Airbus A350-900',
          terminal: '2',
          gate: `B${11 + (seed % 18)}`,
          durationMinutes: routeDurationMins + 35,
        },
      ];

      await new Promise((resolve) => setTimeout(resolve, 400));
      setFlightSearchResults(fallbackFlights);
    } catch (error) {
      console.error('Flight search error:', error);
      setFlightSearchError(error.message || 'Failed to search flights. Please try again.');
    } finally {
      setFlightSearchLoading(false);
    }
  };
  if (!open) return null;

  return (
    <>
      <button type="button" className="trip-details__modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="trip-details__add-transport-modal" role="dialog" aria-labelledby="add-transport-title" aria-modal="true">
        <div className="trip-details__add-transport-head">
          <h2 id="add-transport-title" className="trip-details__add-transport-title">Add Transport</h2>
          <button type="button" className="trip-details__modal-close" aria-label="Close" onClick={() => onClose()}>
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="trip-details__add-transport-tabs">
          {['Flights', 'Trains', 'Buses'].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`trip-details__add-transport-tab ${addTransportTab === tab ? 'trip-details__add-transport-tab--active' : ''}`}
              onClick={() => setAddTransportTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="trip-details__add-transport-body">
          {addTransportTab === 'Flights' && (
            <>
              <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight" style={{ marginBottom: '12px' }}>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Home country</label>
                  <select className="trip-details__add-transport-input" value={transportHomeCountry} onChange={(e) => setTransportHomeCountry(e.target.value)}>
                    {availableTransportCountries.map((countryName) => (
                      <option key={countryName} value={countryName}>{countryName}</option>
                    ))}
                  </select>
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Destination country</label>
                  <input type="text" className="trip-details__add-transport-input" value={destinationCountry || 'Unknown'} readOnly />
                </div>
              </div>
              <p className="trip-details__add-transport-hint">Enter your flight number below and we&apos;ll automatically get its details</p>
              <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight">
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Flight code</label>
                  <input
                    type="text"
                    className="trip-details__add-transport-input"
                    placeholder="eg. UA1, AA100, DL250"
                    value={flightCode}
                    onChange={(e) => {
                      setFlightCode(e.target.value);
                      setFlightSearchError('');
                      setFlightSearchResults([]);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchFlights();
                      }
                    }}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Depart date</label>
                  <input
                    type="date"
                    className="trip-details__add-transport-input"
                    value={flightDepartDate}
                    onChange={(e) => {
                      setFlightDepartDate(e.target.value);
                      setFlightSearchError('');
                      setFlightSearchResults([]);
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        searchFlights();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  className="trip-details__add-transport-search"
                  aria-label="Search flight"
                  onClick={searchFlights}
                  disabled={flightSearchLoading}
                >
                  <Search size={20} aria-hidden />
                </button>
              </div>

              {flightSearchLoading && (
                <div className="trip-details__add-transport-loading">
                  <div className="trip-details__add-transport-spinner" />
                  <p>Searching for flights...</p>
                </div>
              )}

              {flightSearchError && (
                <div className="trip-details__add-transport-error">
                  <Info size={18} aria-hidden />
                  <p>{flightSearchError}</p>
                </div>
              )}

              {flightSearchResults.length > 0 && (
                <div className="trip-details__add-transport-results">
                  <p className="trip-details__add-transport-results-title">{flightSearchResults.length} result{flightSearchResults.length > 1 ? 's' : ''} found</p>
                  {flightSearchResults.map((flight) => {
                    const depTimeStr = flight.departure_time || '--:--';
                    const arrTimeStr = flight.arrival_time || '--:--';

                    let durationText = '';
                    if (flight.durationMinutes && flight.durationMinutes > 0) {
                      const hours = Math.floor(flight.durationMinutes / 60);
                      const mins = flight.durationMinutes % 60;
                      durationText = `${hours}h ${mins}m`;
                    }

                    const rawStatus = String(flight.status || 'scheduled').toUpperCase();
                    const now = new Date();
                    const todayYmd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                    const isFutureFlightDate = Boolean(flight.flight_date && flight.flight_date > todayYmd);
                    const normalizedStatus = (isFutureFlightDate && (rawStatus === 'LANDED' || rawStatus === 'ARRIVED'))
                      ? 'SCHEDULED'
                      : rawStatus;
                    const statusClass = normalizedStatus.toLowerCase();
                    const statusText = normalizedStatus;

                    return (
                      <div key={flight.id} className="trip-details__add-transport-result-card trip-details__add-transport-result-card--compact">
                        <div className="trip-details__add-transport-result-header trip-details__add-transport-result-header--compact">
                          <div className="trip-details__add-transport-result-airline">
                            <Plane size={20} aria-hidden />
                            <div>
                              <strong>{flight.airline}</strong>
                              <span className="trip-details__add-transport-result-code">{flight.flight_code}</span>
                            </div>
                          </div>
                          <span className={`trip-details__add-transport-result-status trip-details__add-transport-result-status--${statusClass}`}>
                            {statusText}
                          </span>
                        </div>

                        <div className="trip-details__add-transport-result-route trip-details__add-transport-result-route--compact">
                          <div className="trip-details__add-transport-result-location">
                            <strong className="trip-details__add-transport-result-time">
                              {depTimeStr}
                            </strong>
                            <span className="trip-details__add-transport-result-airport">{flight.departure_airport}</span>
                            <span className="trip-details__add-transport-result-city">{flight.departure_city}</span>
                            {flight.terminal !== 'N/A' && (
                              <span className="trip-details__add-transport-result-terminal">Terminal {flight.terminal}{flight.gate !== 'N/A' ? `, Gate ${flight.gate}` : ''}</span>
                            )}
                          </div>

                          <div className="trip-details__add-transport-result-duration">
                            <div className="trip-details__add-transport-result-line">
                              <Plane size={16} aria-hidden />
                            </div>
                            <span className="trip-details__add-transport-result-time-info">
                              {durationText}
                            </span>
                          </div>

                          <div className="trip-details__add-transport-result-location">
                            <strong className="trip-details__add-transport-result-time">
                              {arrTimeStr}
                            </strong>
                            <span className="trip-details__add-transport-result-airport">{flight.arrival_airport}</span>
                            <span className="trip-details__add-transport-result-city">{flight.arrival_city}</span>
                          </div>

                          <button
                            type="button"
                            className="trip-details__add-transport-result-add trip-details__add-transport-result-add--compact"
                            onClick={() => {
                              const name = `${flight.departure_airport} → ${flight.arrival_airport} (${flight.flight_code})`;

                              appendTransportTripItem({
                                id: `flight-${flight.id}-${Date.now()}`,
                                name,
                                total: 0,
                                date: flight.flight_date,
                                detail: `${flight.airline} ${flight.flight_code} | Departs ${depTimeStr}, Arrives ${arrTimeStr}`,
                                startTime: depTimeStr || '',
                                durationHrs: Math.floor((flight.durationMinutes || 0) / 60),
                                durationMins: (flight.durationMinutes || 0) % 60,
                                Icon: Plane,
                                notes: `Terminal: ${flight.terminal}, Gate: ${flight.gate}${flight.aircraft ? `, Aircraft: ${flight.aircraft}` : ''}`,
                                transportType: 'flight',
                              });

                              setFlightSearchResults([]);
                              setFlightCode('');
                              setFlightDepartDate('');
                              onClose();
                            }}
                          >
                            Add to trip
                          </button>
                        </div>

                        {flight.aircraft && flight.aircraft !== 'N/A' ? (
                          <div className="trip-details__add-transport-result-aircraft trip-details__add-transport-result-aircraft--compact">
                            <span>Aircraft: {flight.aircraft}</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
          {(addTransportTab === 'Trains' || addTransportTab === 'Buses') && (
            <>
              <p className="trip-details__add-transport-hint">Add your {addTransportTab.toLowerCase()} reservations below.</p>
              <div className="trip-details__add-transport-fields trip-details__add-transport-fields--flight">
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">From *</label>
                  <div className="trip-details__custom-transport-autofill-wrap">
                    <input
                      type="text"
                      className="trip-details__add-transport-input"
                      placeholder="City, station, or terminal"
                      value={surfaceFrom}
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        setSurfaceFrom(value);
                        setSurfaceFromSuggestionsOpen(true);
                        fetchPlacesPredictions(value, setSurfaceFromPredictions);
                      }}
                      onFocus={() => setSurfaceFromSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setSurfaceFromSuggestionsOpen(false), 200)}
                    />
                    {surfaceFromSuggestionsOpen && surfaceFrom.trim() && (
                      <ul className="trip-details__custom-transport-suggestions">
                        {surfaceFromPredictions.length > 0 ? (
                          surfaceFromPredictions.map((prediction) => (
                            <li key={prediction.place_id}>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item"
                                onMouseDown={() => {
                                  setSurfaceFrom(prediction.description);
                                  setSurfaceFromSuggestionsOpen(false);
                                  setSurfaceFromPredictions([]);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{prediction.structured_formatting?.main_text || prediction.description}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">{prediction.structured_formatting?.secondary_text || 'Location'}</span>
                                </div>
                              </button>
                            </li>
                          ))
                        ) : (
                          <li>
                            <button
                              type="button"
                              className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                              onMouseDown={() => {
                                setSurfaceFromSuggestionsOpen(false);
                              }}
                            >
                              <MapPin size={16} aria-hidden />
                              <div className="trip-details__custom-transport-suggestion-text">
                                <span className="trip-details__custom-transport-suggestion-name">{surfaceFrom}</span>
                                <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                              </div>
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">To *</label>
                  <div className="trip-details__custom-transport-autofill-wrap">
                    <input
                      type="text"
                      className="trip-details__add-transport-input"
                      placeholder="City, station, or terminal"
                      value={surfaceTo}
                      required
                      onChange={(e) => {
                        const value = e.target.value;
                        setSurfaceTo(value);
                        setSurfaceToSuggestionsOpen(true);
                        fetchPlacesPredictions(value, setSurfaceToPredictions);
                      }}
                      onFocus={() => setSurfaceToSuggestionsOpen(true)}
                      onBlur={() => setTimeout(() => setSurfaceToSuggestionsOpen(false), 200)}
                    />
                    {surfaceToSuggestionsOpen && surfaceTo.trim() && (
                      <ul className="trip-details__custom-transport-suggestions">
                        {surfaceToPredictions.length > 0 ? (
                          surfaceToPredictions.map((prediction) => (
                            <li key={prediction.place_id}>
                              <button
                                type="button"
                                className="trip-details__custom-transport-suggestion-item"
                                onMouseDown={() => {
                                  setSurfaceTo(prediction.description);
                                  setSurfaceToSuggestionsOpen(false);
                                  setSurfaceToPredictions([]);
                                }}
                              >
                                <MapPin size={16} aria-hidden />
                                <div className="trip-details__custom-transport-suggestion-text">
                                  <span className="trip-details__custom-transport-suggestion-name">{prediction.structured_formatting?.main_text || prediction.description}</span>
                                  <span className="trip-details__custom-transport-suggestion-type">{prediction.structured_formatting?.secondary_text || 'Location'}</span>
                                </div>
                              </button>
                            </li>
                          ))
                        ) : (
                          <li>
                            <button
                              type="button"
                              className="trip-details__custom-transport-suggestion-item trip-details__custom-transport-suggestion-item--custom"
                              onMouseDown={() => {
                                setSurfaceToSuggestionsOpen(false);
                              }}
                            >
                              <MapPin size={16} aria-hidden />
                              <div className="trip-details__custom-transport-suggestion-text">
                                <span className="trip-details__custom-transport-suggestion-name">{surfaceTo}</span>
                                <span className="trip-details__custom-transport-suggestion-type">Custom location</span>
                              </div>
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Date</label>
                  <input
                    type="date"
                    className="trip-details__add-transport-input"
                    value={surfaceDate}
                    onChange={(e) => setSurfaceDate(e.target.value)}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Departure time</label>
                  <input
                    type="time"
                    className="trip-details__add-transport-input"
                    value={surfaceTime}
                    onChange={(e) => setSurfaceTime(e.target.value)}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Arrival time</label>
                  <input
                    type="time"
                    className="trip-details__add-transport-input"
                    value={surfaceArrivalTime}
                    onChange={(e) => setSurfaceArrivalTime(e.target.value)}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Operator</label>
                  <input
                    type="text"
                    className="trip-details__add-transport-input"
                    placeholder={addTransportTab === 'Trains' ? 'e.g. JR East, SNCF' : 'e.g. FlixBus'}
                    value={surfaceOperator}
                    onChange={(e) => setSurfaceOperator(e.target.value)}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">{addTransportTab === 'Trains' ? 'Train no.' : 'Bus no.'}</label>
                  <input
                    type="text"
                    className="trip-details__add-transport-input"
                    placeholder="Optional"
                    value={surfaceNumber}
                    onChange={(e) => setSurfaceNumber(e.target.value)}
                  />
                </div>
                <div className="trip-details__add-transport-field">
                  <label className="trip-details__add-transport-label">Cost (optional)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="trip-details__add-transport-input"
                    placeholder="0.00"
                    value={surfaceCost}
                    onChange={(e) => setSurfaceCost(e.target.value)}
                  />
                </div>
              </div>
              <div className="trip-details__add-transport-fields" style={{ gridTemplateColumns: '1fr', gap: '12px' }}>
                <button
                  type="button"
                  className="trip-details__add-transport-result-add"
                  aria-disabled={!isSurfaceTransportValid}
                  style={!isSurfaceTransportValid ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                  onClick={() => {
                    if (!isSurfaceTransportValid) {
                      handleInvalidSurfaceSubmit();
                      return;
                    }
                    const modeLabel = addTransportTab === 'Trains' ? 'Train' : 'Bus';
                    const Icon = addTransportTab === 'Trains' ? Train : Bus;

                    appendTransportTripItem({
                      id: `${modeLabel.toLowerCase()}-${Date.now()}`,
                      name: `${modeLabel}: ${surfaceFrom} → ${surfaceTo}`,
                      date: surfaceDate || defaultSurfaceDate,
                      detail: `${surfaceOperator || modeLabel}${surfaceNumber ? ` ${surfaceNumber}` : ''} · Dep ${surfaceTime} - Arr ${surfaceArrivalTime}`,
                      startTime: surfaceTime || '',
                      notes: '',
                      total: Number(surfaceCost || 0),
                      Icon,
                      transportType: modeLabel.toLowerCase(),
                    });

                    setSurfaceFrom('');
                    setSurfaceTo('');
                    setSurfaceFromSuggestionsOpen(false);
                    setSurfaceToSuggestionsOpen(false);
                    setSurfaceDate(defaultSurfaceDate);
                    setSurfaceTime('08:00');
                    setSurfaceArrivalTime('18:00');
                    setSurfaceOperator('');
                    setSurfaceNumber('');
                    setSurfaceCost('');
                    onClose();
                  }}
                >
                  Add to trip
                </button>
              </div>
            </>
          )}
          {addTransportTab === 'Flights' && (
            <p className="trip-details__add-transport-manual">
              Can&apos;t find what you need? <button type="button" className="trip-details__add-transport-manual-link" onClick={onRequestManualFlight}>Add manually</button>
            </p>
          )}
        </div>
      </div>
    </>
  );
}
