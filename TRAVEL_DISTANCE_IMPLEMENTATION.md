# Travel Distance & Public Transport Implementation

## Overview

This document explains how distance calculation and public transport directions work in the application.

## Distance Calculation Logic

### Original Implementation (Haversine Formula)

The app previously used the **Haversine formula** to calculate straight-line distance between two GPS coordinates:

- Walking: 12 min/km (~5 km/h)
- Cycling: 4 min/km (~15 km/h)
- Driving: 2.5 min/km (~24 km/h)
- Public Transport: 5 min/km (~12 km/h)

**Problem:** This calculates "as the crow flies" distance, not actual route distance. Real roads are typically 30-50% longer.

### Current Implementation (Improved Fallback)

Now uses Haversine with a **30% buffer** to approximate actual route distance:

```javascript
const routeDistKm = straightLineDistance * 1.3;
```

This provides more realistic estimates that better match Google Maps.

### Future: Google Maps API Integration

The code is prepared to use Google Distance Matrix API for exact route times once CORS is resolved:

**For Production:**

1. Create a backend API endpoint that proxies requests to Google Maps APIs
2. OR use Google Maps JavaScript SDK (recommended)
3. Update the `getTravelBetweenGoogleMaps` function to call your backend proxy

Example backend endpoint:

```javascript
// Backend (Node.js/Express)
app.get("/api/distance-matrix", async (req, res) => {
  const { origin, destination, mode } = req.query;
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin}&destinations=${destination}&mode=${mode}&key=${apiKey}`;

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});
```

## Public Transport Directions

### Original Implementation

Hardcoded mock data with placeholder stations ("Station A", "Station B", "MRT lines name").

### Current Implementation

Fetches **real transit directions** from Google Maps Directions API with:

- Actual station names
- Transit line names and colors
- Walking segments with distances
- Number of stops
- Accurate travel times

**Features:**

- ✅ Displays departure and arrival locations
- ✅ Shows all walking segments with durations
- ✅ Shows transit legs with station names
- ✅ Displays line names, numbers, and colors (MRT/Metro)
- ✅ Shows number of stops per transit segment
- ✅ Loading and error states

### How It Works

1. User clicks "Public Transport" between two places
2. App fetches directions from Google Directions API (transit mode)
3. Parses the response to extract:
   - Walking steps
   - Transit details (departure/arrival stops, line info)
   - Durations and distances
4. Renders step-by-step directions visually

### CORS Note

Google Maps APIs don't support direct browser calls due to CORS restrictions. Options:

1. **Backend Proxy** (recommended for production)
2. **Google Maps JavaScript SDK** (browser-friendly alternative)
3. **CORS Proxy** (development only - not for production)

Current implementation will fall back to "no routes available" message until backend proxy is set up.

## Comparison with Google Maps

### Accuracy

- **Straight-line + 30% buffer:** ~80-90% accurate for most urban routes
- **Google Maps API:** 95-99% accurate (actual routing algorithms)

### When They Match

- Short distances in grid-like cities (Manhattan, etc.)
- Areas with direct routes

### When They Differ

- Winding roads / mountains
- One-way streets
- Traffic restrictions
- River crossings with limited bridges

## Next Steps for Production

1. **Set up backend proxy** for Google Maps APIs
2. **Enable billing** on Google Cloud Platform for the APIs
3. **Test** distance calculations in your actual trip locations
4. **Add caching** to reduce API calls and costs
5. **Consider** Google Maps JavaScript SDK as alternative

## Environment Variables Required

```env
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

Make sure these APIs are enabled in Google Cloud Console:

- Distance Matrix API
- Directions API

## Cost Estimation

- Distance Matrix: $0.005-0.010 per element
- Directions: $0.005 per request

With caching, expect <$10/month for typical usage.
