# Google Places API Key Setup

This document explains how team members can create and securely use Google API keys for this project (frontend and backend). Follow these steps exactly and do not commit keys to source control.

## Prerequisites

- A Google account
- Access to Google Cloud Console (https://console.cloud.google.com)
- A billing-enabled Google Cloud project (Places Web Service requires billing)

## Overview

We use two separate API keys:

- **Server key** (private): used by backend web-service calls (Places Text/Nearby Search, Place Details, Photos, Geocoding, etc.). Restrict by IP and APIs.
- **Browser key** (public): used only by the frontend for Maps JavaScript (and client-side Places if you enable it). Restrict by referrer and APIs.

Keeping keys separate protects the server key and follows least-privilege principles.

## 1) Create / select a Google Cloud project

1. Open Google Cloud Console.
2. Select an existing project or create a new one (click **New Project** → name it → Create).

## 2) Enable billing

1. In the console, open **Billing** and attach a billing account to the project.
2. Note: Google provides small free credits, but a billing account is required for Places Web Service usage.

## 3) Enable required APIs

Only enable the APIs you actually need. For this app we recommend enabling (server/project-level):

- `Places API` (required)
- `Geocoding API` (if the backend geocodes addresses / text search)
- `Maps Static API` (only if the backend serves static map images)
- `Distance Matrix API` (optional — only if your backend computes travel times/distances)
- `Time Zone API` (optional — only if you need local time conversions)

For the frontend (browser key) enable only:

- `Maps JavaScript API`
- (Optional) `Places API (New)` — only if you will use client-side Places features (autocomplete/search) in the browser.

Enable APIs: Console → **APIs & Services** → **Library** → search and enable each API.

## 4) Create credentials (keys)

### Server key (private)

1. Console → **APIs & Services** → **Credentials** → **Create Credentials** → **API key**.
2. Name it `wheretogonext-backend` (or similar).
3. Set **Application restrictions** → **IP addresses (web servers, cron jobs, etc.)** and add your backend server's public/NAT IP(s). If deploying to cloud with static egress, use that address.
4. Set **API restrictions** → select only the APIs the backend needs (e.g., `Places API`, `Geocoding API`, `Maps Static API`) - restrictions needed shown above. Remove all others.

### Browser key (public)

1. Create another key and name it `wheretogonext-frontend`.
2. Set **Application restrictions** → **HTTP referrers** and add your origins:
   - `http://localhost:3000` (local dev port — adjust if different)
   - `http://127.0.0.1:5173` (Vite default example)
   - `https://your-production-domain.com` (production origin)
3. Set **API restrictions** → `Maps JavaScript API` and (optionally) `Places API (New)` if you will use client-side Places.

## 5) Secure storage (do not commit keys)

- Add to `backend/.env` (add to `.gitignore`):

```
GOOGLE_PLACES_API_KEY=your_server_key_here
```

- Add to `frontend/.env.local` (Vite) (do not commit):

```
VITE_GOOGLE_MAPS_API_KEY=your_browser_key_here
```

## 6) Photo handling recommendation

Place Photos require the server key for the Places Photo endpoint. Do not expose the server key in frontend requests. Implement a backend `/photo` proxy that calls the Places Photo endpoint, streams the image, and returns it to the frontend with caching headers.

Minimal example (Node + Express, for reference only — place in `backend/src/routes/discovery.js` or a new route):

```js
// Example: GET /api/photo?photoreference=PHOTO_REF&maxwidth=800
app.get("/api/photo", async (req, res) => {
  const { photoreference, maxwidth = 800 } = req.query;
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(photoreference)}&key=${key}`;
  const resp = await fetch(url);
  if (!resp.ok) return res.status(resp.status).send("Photo fetch failed");
  res.set("Cache-Control", "public, max-age=86400");
  resp.body.pipe(res);
});
```

!!IMPORTANT TO CONSTANTLY CHECK YOUR USAGE SO THAT YOU WILL NOT GET BILLED.

---

## Implementation Status

✅ **Google Places API is fully integrated and working!**

### What's Implemented

1. **Google Geocoding API Integration** (`backend/src/routes/discovery.js`)
   - Converts destination names to geographic coordinates
   - Replaces OpenStreetMap Nominatim when API key is available
   - Function: `googleGeocodeDestination(destination)`

2. **Google Places API Integration** (`backend/src/routes/discovery.js`)
   - Searches for nearby attractions, restaurants, cafes, museums, parks, and shopping
   - Returns accurate ratings, review counts, and place details
   - Replaces OpenStreetMap Overpass API when key is available
   - Function: `fetchGooglePlacesNearby(lat, lon, radius, limit)`

3. **Photo Proxy Endpoint** (`/api/discovery/photo`)
   - Securely streams Google Places photos without exposing the API key
   - Implements caching (24-hour cache-control headers)
   - Endpoint: `GET /api/discovery/photo?reference={photoReference}&maxwidth={width}`

4. **Smart Fallback System**
   - Automatically uses Google Places API when `GOOGLE_PLACES_API_KEY` is configured
   - Falls back to OpenStreetMap/Overpass if key is not available
   - Environment variable loading fixed in `backend/src/index.js` using dynamic imports

### Verified Working

- ✅ **London**: The British Museum (4.7 rating, 170,256 reviews)
- ✅ **Tokyo**: The National Museum of Western Art (4.5 rating, 11,516 reviews)
- ✅ **Paris**: Eiffel Tower (4.7 rating, 480,968 reviews)
- ✅ **Photos**: Successfully fetching and serving Google Places photos via proxy

### How to Test

1. Start the application:

   ```bash
   npm run dev
   ```

2. Test the API directly:

   ```bash
   # Check place discovery
   curl "http://localhost:5000/api/discovery/destination?destination=London&limit=5"

   # Check photo endpoint (use a reference from the response above)
   curl "http://localhost:5000/api/discovery/photo?reference=YOUR_PHOTO_REF&maxwidth=400"
   ```

3. Access the frontend at http://localhost:3000 and use the "Add Places" feature

### Configuration

Ensure your `backend/.env` contains:

```
GOOGLE_PLACES_API_KEY=your_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

### Next Steps (Optional)

- Consider migrating frontend map from Leaflet/OpenStreetMap to Google Maps JavaScript API
- The frontend already has `VITE_GOOGLE_MAPS_API_KEY` configured in `frontend/.env`
- This would provide a fully Google-powered mapping experience

### Troubleshooting

If places still show OpenStreetMap data:

1. Verify `GOOGLE_PLACES_API_KEY` is set in `backend/.env`
2. Restart the backend: `npm run dev` in backend folder
3. Check API response has `sources.places: "Google Places API"`
4. Verify your API key has Places API and Geocoding API enabled in Google Cloud Console

---

## Recommendation Logic & Implementation

This section explains how the application generates high-quality recommendations for **Places**, **Food & Beverages**, and **Stays** using Google Places API.

### Architecture Overview

The recommendation system is implemented in `backend/src/routes/discovery.js` and uses a multi-stage pipeline:

1. **Geocoding**: Convert destination names to coordinates using Google Geocoding API
2. **Data Fetching**: Query Google Places API for nearby points of interest
3. **Categorization**: Classify results into Places, Food & Beverages, or Stays
4. **Scoring & Ranking**: Apply custom scoring algorithms based on ratings, reviews, and relevance
5. **Filtering**: Remove low-quality results and limit to top recommendations
6. **Enrichment**: Add photos, descriptions, and additional metadata

---

### 1. Places Recommendations

**Objective**: Discover top tourist attractions, museums, parks, landmarks, and points of interest.

#### Google Places API Query Strategy

The system queries Google Places API Nearby Search endpoint for multiple place types:

```javascript
const placeTypes = [
  "tourist_attraction",
  "museum",
  "art_gallery",
  "park",
  "point_of_interest",
  "amusement_park",
  "aquarium",
  "zoo",
  "stadium",
  "shopping_mall",
  "landmark",
];
```

**API Parameters:**

- `location`: Geographic coordinates (lat, lon)
- `radius`: 18,000 meters (18 km) search radius
- `type`: One of the place types listed above
- `key`: Google Places API key

**Fetching Strategy:**

- Iterates through each place type sequentially
- Stops when 120+ place results are collected
- Includes 100ms delay between requests to respect rate limits
- Deduplicates by `place_id` to avoid duplicate entries

#### Scoring Algorithm

Each place receives a composite score based on multiple factors:

```javascript
score = rating * 10 + log10(reviewCount + 1) * 5;
```

**Quality Filter**: Only places with `rating >= 3.8` are included.

**Recommendation Score** (used for final ranking):

```javascript
recommendedScore =
  score * 1.5 +
  (rating - 4) * 7 +
  log10(reviewCount + 1) * 2.4 +
  (hasWebsite ? 1.2 : 0) +
  (hasPhone ? 0.8 : 0) +
  (isAttraction ? 1.4 : 0) -
  distance_km * 0.11; // Penalize distant places
```

**Final Output**: Top 60 places, sorted by `recommendedScore` descending.

#### Data Enrichment

Each place includes:

- **Name, Address, Coordinates**: From Google Places API
- **Rating & Reviews**: Actual Google ratings and review counts
- **Photos**: Up to 5 high-resolution photos via photo proxy endpoint
- **Description**: Editorial summary from Google or generated fallback
- **Opening Hours**: Parsed from Google's `opening_hours.weekday_text`
- **Contact Info**: Website and phone number if available
- **Estimated Duration**: Auto-calculated based on place type (e.g., "Half day" for major attractions)

---

### 2. Food & Beverages Recommendations

**Objective**: Discover top restaurants, cafes, bars, and dining experiences.

#### Google Places API Query Strategy

The system queries for food-specific place types:

```javascript
const foodTypes = [
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_delivery",
  "meal_takeaway",
  "night_club",
  "food",
];
```

**API Parameters:**

- `location`: Geographic coordinates (lat, lon)
- `radius`: 18,000 meters (18 km) search radius
- `type`: One of the food types listed above
- `key`: Google Places API key

**Fetching Strategy:**

- Fetches MORE food results than places (targets 150+ raw results)
- Iterates through each food type
- Stops when 150+ food results are collected
- Includes 100ms delay between requests
- Deduplicates by `place_id`

#### Categorization Logic

Places are classified as "food" if their Google `types` array includes any of:

```javascript
[
  "restaurant",
  "cafe",
  "bar",
  "food",
  "bakery",
  "meal_takeaway",
  "meal_delivery",
  "night_club",
];
```

#### Scoring & Filtering

**Same scoring formula as places:**

```javascript
score = rating * 10 + log10(reviewCount + 1) * 5;
```

**Quality Filter**: Only food places with `rating >= 3.8` are included.

**Final Output**: Top 70 food & beverage places, sorted by score descending.

#### Data Enrichment

Each food place includes:

- **Name, Address, Coordinates**: From Google Places API
- **Rating & Reviews**: Actual Google ratings and review counts
- **Photos**: Up to 5 photos via photo proxy
- **Cuisine Type**: Inferred from Google `types` array
- **Price Level**: 1-4 from Google (1 = $, 4 = $$$$)
- **Opening Hours**: Parsed from Google
- **Ambiance Tags**: Generated based on types (e.g., "Casual Dining", "Fine Dining", "Cafe")

---

### 3. Stays Recommendations

**Objective**: Discover hotels, resorts, and accommodations near the destination.

#### Google Places API Query Strategy

The system queries for accommodation-specific types:

```javascript
const accommodationTypes = [
  "lodging",
  "hotel",
  "motel",
  "resort_hotel",
  "extended_stay_hotel",
];
```

**API Parameters:**

- `location`: Geographic coordinates (lat, lon)
- `radius`: 15,000 meters (15 km) search radius
- `type`: One of the accommodation types
- `key`: Google Places API key

**Fetching Strategy:**

- Targets 100+ raw stay results
- Iterates through each accommodation type
- Stops when 100+ results are collected
- Includes 100ms delay between requests
- Deduplicates by `place_id`

#### Type Verification Filter

**Critical Quality Control**: The system verifies each result actually contains an accommodation type:

```javascript
const hasAccommodationType = stay.types.some((type) =>
  ["lodging", "hotel", "motel", "resort_hotel", "extended_stay_hotel"].includes(
    type,
  ),
);
```

This prevents non-accommodation places (dental offices, jewellery stores, government agencies) from appearing in stays.

#### Scoring Algorithm

```javascript
score = rating * 100 + log10(reviewCount + 1) * 50;
```

**Quality Filter**: Only stays with `rating >= 3.5` are included (slightly lower threshold than places/food since accommodations tend to have more varied ratings).

**Final Output**: Top 60 stays, sorted by score descending.

#### Data Enrichment

Each stay includes:

- **Name, Address, Coordinates**: From Google Places API
- **Rating & Reviews**: Actual Google ratings and review counts
- **Photos**: Up to 5 photos via photo proxy
- **Hotel Type**: Inferred from types (Resort, Hotel, Motel, Extended Stay, Accommodation)
- **Price Estimate**: Generated from Google's `price_level` (1-4 scale)
- **Room Options**: Mock room types generated for display (Standard, Deluxe, Suite)
- **Amenities**: Generated based on hotel type and price level

---

### API Request Flow

**Example request**: `GET /api/discovery/destination?destination=Singapore&limit=10`

**Backend Processing:**

1. **Geocode destination** using Google Geocoding API
   - Input: "Singapore"
   - Output: `{ lat: 1.3521, lon: 103.8198, displayName: "Singapore" }`

2. **Fetch places** using `fetchGooglePlacesNearby(lat, lon, 18000, limit*2)`
   - Makes 11 API calls (one per place type)
   - Collects ~120 place results + ~150 food results
   - Total raw results: ~270 places

3. **Categorize results** using `normalizeGooglePlace(place, destination)`
   - Checks Google `types` array
   - Assigns category: "place", "food", or ignores if neither

4. **Score & rank** all results
   - Calculate score: `rating * 10 + log10(reviewCount + 1) * 5`
   - Filter: Keep only `rating >= 3.8`
   - Sort by score descending

5. **Split into categories**:
   - **Places**: Take top 60 from "place" category
   - **Food**: Take top 70 from "food" category
   - **Stays**: Fetch separately using `fetchStays()`, return top 60

6. **Enrich with metadata**:
   - Photo URLs: `http://localhost:5000/api/discovery/photo?reference={ref}&maxwidth=800`
   - Descriptions: Editorial summaries from Google
   - Opening hours, contact info, etc.

7. **Cache results** for 1 hour to avoid duplicate API calls

8. **Return JSON response**:
   ```json
   {
     "destination": "Singapore",
     "places": [...60 places],
     "foods": [...70 food places],
     "stays": [...60 stays],
     "experiences": [...],
     "communityItineraries": [...],
     "sources": {
       "places": "Google Places API"
     },
     "cached": false
   }
   ```

---

### Quality Assurance

**Rating Thresholds:**

- **Places**: ≥ 3.8 stars (only high-quality attractions)
- **Food & Beverages**: ≥ 3.8 stars (only well-reviewed restaurants)
- **Stays**: ≥ 3.5 stars (good accommodations, slightly lower threshold)

**Type Verification:**

- All stays must include an accommodation type (`lodging`, `hotel`, etc.)
- Places and food are categorized by checking Google's `types` array

**Deduplication:**

- All results are deduplicated by `place_id` to avoid showing the same place twice

**Distance Penalty:**

- Places farther from the destination center receive lower recommendation scores
- Formula: `score - (distance_km * 0.11)`
