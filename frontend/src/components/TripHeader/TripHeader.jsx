import React from "react";
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { FaMapMarkerAlt, FaCalendarAlt, FaImage, FaDollarSign, FaClipboardList } from "react-icons/fa";
import './TripHeader.css';

export default function TripHeader({ trip, folderName, topOffset }) {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const tripId = String(params.tripId || params.id || trip?.id || '').trim();

  const activeTab = location.pathname.includes('/moodboard')
    ? 'moodboard'
    : location.pathname.includes('/itineraries')
    ? 'itinerary'
    : location.pathname.includes('/budget')
    ? 'budgeting'
    : 'overview';

  const handleTabClick = (tab) => {
    if (!tripId) return;
    if (tab === 'overview') navigate(`/itineraries/${tripId}`);
    if (tab === 'itinerary') navigate(`/trip/${tripId}`);
    if (tab === 'moodboard') navigate(`/trip/${tripId}/moodboard`);
    if (tab === 'budgeting') navigate(`/trip/${tripId}/budget`);
  };

  const title = trip?.title || (folderName ? 'Moodboard' : 'My Trip');
  const dates = trip?.dates || '';
  const locations = trip?.locations || '';

  return (
    <div className="trip-header-container" style={{ top: topOffset != null ? topOffset : 'var(--dashboard-header-height, 70px)' }}>
      <div className="trip-header-top">
        <div className="trip-info">
          <h1>{title}</h1>
          <p className="trip-meta">
            {dates && <>{dates}{locations ? ' · ' : ''}</>}
            {locations && <><FaMapMarkerAlt /> {locations}</>}
          </p>
          {folderName && <p className="trip-header__subtitle">{folderName}</p>}
        </div>
      </div>

      <div className="trip-tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => handleTabClick('overview')}
        >
          <FaClipboardList /> Overview
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'itinerary' ? 'active' : ''}`}
          onClick={() => handleTabClick('itinerary')}
        >
          <FaCalendarAlt /> Itinerary
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'moodboard' ? 'active' : ''}`}
          onClick={() => handleTabClick('moodboard')}
        >
          <FaImage /> Moodboard
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'budgeting' ? 'active' : ''}`}
          onClick={() => handleTabClick('budgeting')}
        >
          <FaDollarSign /> Budgeting
        </button>
      </div>
    </div>
  );
}