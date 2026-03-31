import { Link } from 'react-router-dom';

export function TripDetailsLoadingView() {
  return (
    <div className="trip-details trip-details--missing">
      <p>Loading trip…</p>
    </div>
  );
}

export function TripDetailsMissingTripView({ message }) {
  return (
    <div className="trip-details trip-details--missing">
      <p>{message}</p>
      <Link to="/">Back to My Trips</Link>
    </div>
  );
}
