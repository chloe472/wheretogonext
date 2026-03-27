import React from "react";
import { MOCK_TRIPS } from "../../data/mockTrips.js";
import { FaMapMarkerAlt, FaCalendarAlt, FaImage, FaDollarSign, FaClipboardList } from "react-icons/fa";
import './TripHeader.css';

export default function TripHeader({ trip }) {
  // Use first
  const displayTrip = trip || MOCK_TRIPS[0];
  if (!displayTrip) return null;

  return (
    <div className="trip-header-container">
      <div className="trip-header-top">
        <div className="trip-info">
          <h1>{displayTrip.title}</h1>
          <p className="trip-meta">
            {displayTrip.dates} &nbsp;  &nbsp; <FaMapMarkerAlt /> {displayTrip.locations}
          </p>
        </div>
        <button className="ai-assistant">✨ AI Assistant</button>
      </div>

      <div className="trip-tabs">
        <button className="tab active"><FaClipboardList /> Overview</button>
        <button className="tab"><FaCalendarAlt /> Itinerary</button>
        <button className="tab"><FaImage /> Moodboard</button>
        <button className="tab"><FaDollarSign /> Budgeting</button>
      </div>
    </div>
  );
}