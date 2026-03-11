# API Key Update Guide

**Date:** March 11, 2026  
**Purpose:** Document the new Google Maps API key setup for accurate travel times and public transport directions

---

## What Changed?

We upgraded from basic Google Places API to include **Distance Matrix API** and **Directions API** for:

- ✅ Accurate travel times (driving, walking, cycling) matching Google Maps
- ✅ Real public transport directions with actual bus/train routes, station names, and line details
- ✅ Better place search and location data

---

## Updated API Keys (2 Separate Keys for Security)

We use **two separate API keys** following security best practices:

### Frontend Key (Browser) - **UPDATED** ✨

**Key:** `AIzaSyC6UmfWTKcuEZsWUUgcHnrdZs19jIUj69o`  
**Enabled APIs:**

- ✅ Maps JavaScript API
- ✅ Distance Matrix API (NEW)
- ✅ Directions API (NEW)
- ✅ Places API (optional)

**Restrictions:** HTTP referrers (e.g., `localhost:*`, your domain)

### Backend Key (Server) - **NO CHANGE** ✓

**Key:** `AIzaSyAgXNQqSGQoxnJNEeXnJMJjb0k8YMurlmI`  
**Enabled APIs:**

- ✅ Places API
- ✅ Geocoding API

**Restrictions:** IP addresses (server IPs)

---

## Where to Update (Frontend Only)

### Frontend Environment File

**File:** `frontend/.env`

**Update this line:**

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC6UmfWTKcuEZsWUUgcHnrdZs19jIUj69o
```

**✅ Status:** Already updated

---

### Backend Environment File

**File:** `backend/.env`

**Keep as is (NO CHANGE):**

```env
GOOGLE_PLACES_API_KEY=AIzaSyAgXNQqSGQoxnJNEeXnJMJjb0k8YMurlmI
```

**✅ Status:** Already correct - backend key stays the same

---

## Setup Steps for Teammates

### Option A: You already have access to the project

1. **Verify the frontend key (should already be updated):**

   ```bash
   # Check frontend/.env has the new key
   cat frontend/.env | grep VITE_GOOGLE_MAPS_API_KEY
   ```

2. **Restart frontend server:**

   ```bash
   cd frontend
   npm run dev
   ```

   (Backend doesn't need restart - the key hasn't changed)

3. **Verify it works:**
   - Open the app at http://localhost:3001
   - Create or view a trip with multiple places
   - Check that travel times show accurate durations
   - Click a travel segment to see public transport routes with real bus/train info

---

### Option B: Setting up from scratch

If you need to create your own API keys (2 separate keys recommended):

#### Step 1: Create Backend Key (Server)

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com
   - Select your project or create a new one

2. **Enable Backend APIs:**
   - Go to **APIs & Services > Library**
   - Search and enable:
     - ✅ Places API
     - ✅ Geocoding API

3. **Create Backend API Key:**
   - Go to **APIs & Services > Credentials**
   - Click **+ CREATE CREDENTIALS > API key**
   - Name it "wheretogonext-backend"

4. **Restrict Backend Key:**
   - Under **Application restrictions**: Select "IP addresses"
     - Add your server IPs (for production)
     - For development, you can leave unrestricted temporarily
   - Under **API restrictions**: Select "Restrict key"
     - Enable only: Places API, Geocoding API
   - Click **SAVE**

5. **Add to Backend .env:**
   ```env
   GOOGLE_PLACES_API_KEY=YOUR_BACKEND_KEY_HERE
   ```

#### Step 2: Create Frontend Key (Browser)

1. **Enable Frontend APIs:**
   - Go to **APIs & Services > Library**
   - Search and enable:
     - ✅ Maps JavaScript API
     - ✅ Distance Matrix API
     - ✅ Directions API

2. **Create Frontend API Key:**
   - Go to **APIs & Services > Credentials**
   - Click **+ CREATE CREDENTIALS > API key**
   - Name it "wheretogonext-frontend"

3. **Restrict Frontend Key:**
   - Under **Application restrictions**: Select "HTTP referrers"
     - Add: `http://localhost:*`
     - Add: `http://127.0.0.1:*`
     - Add: `https://your-production-domain.com/*`
   - Under **API restrictions**: Select "Restrict key"
     - Enable: Maps JavaScript API, Distance Matrix API, Directions API
   - Click **SAVE**

4. **Add to Frontend .env:**
   ```env
   VITE_GOOGLE_MAPS_API_KEY=YOUR_FRONTEND_KEY_HERE
   ```

---

## Key Architecture

### Why Two Separate Keys?

We use **two separate API keys** for security:

1. **Frontend key is public** - visible in browser DevTools, so we restrict it by HTTP referrer
2. **Backend key is private** - never exposed to users, protected by server IP restrictions
3. **Principle of least privilege** - each key only has access to the APIs it needs

### API Usage Breakdown:

| API                 | Used By  | Purpose                                       |
| ------------------- | -------- | --------------------------------------------- |
| Places API          | Backend  | Search cities, find places, get place details |
| Maps JavaScript API | Frontend | Display maps, load SDK                        |
| Distance Matrix API | Frontend | Calculate accurate travel times               |
| Directions API      | Frontend | Get public transport routes                   |
| Geocoding API       | Backend  | Convert addresses to coordinates              |

### Frontend Usage (Browser)

- **File:** `frontend/index.html` (line 11)
  - Loads Google Maps SDK with the API key
- **File:** `frontend/src/components/TripDetailsPage.jsx`
  - Uses `DistanceMatrixService` for travel times
  - Uses `DirectionsService` for transit routes

### Backend Usage (Server)

- **File:** `backend/src/routes/discovery.js`
  - Makes HTTP requests to Google Places API
  - Used for place search, nearby search, place details

---

## Troubleshooting

### "This API key is not authorized" errors in console

**Cause:** The API key doesn't have required APIs enabled

**Fix:**

1. Go to https://console.cloud.google.com/apis/library
2. Enable **Distance Matrix API** and **Directions API**
3. Go to Credentials > Your API key
4. Under "API restrictions", make sure all required APIs are checked
5. Save and restart your dev servers

---

### Travel times still show estimates (e.g., "~35 min")

**Cause:** Falling back to Haversine calculation (straight-line distance)

**Fix:**

- Check browser console for API errors
- Verify API key has Distance Matrix API enabled
- Make sure you restarted the frontend dev server after updating `.env`

---

### Public transport routes not showing

**Cause:** Directions API not enabled or not available for the location

**Fix:**

- Enable Directions API in Google Cloud Console
- Note: Public transport data isn't available in all cities
- Check console for detailed error messages

---

## Cost & Billing

**Free Tier:** Google provides $200/month credit  
**Typical Usage:** Well within free tier for development

**API Pricing (after free credit):**

- Distance Matrix: $5 per 1,000 requests
- Directions: $5 per 1,000 requests
- Places: $17-32 per 1,000 requests (depending on fields)

**Development Tips:**

- Frontend caches travel times in `travelTimeCache`
- Backend falls back to free alternatives (Nominatim, Overpass) when Google key is missing
- Set up billing alerts in Google Cloud Console

---

## Security Notes

⚠️ **Never commit API keys to Git:**

- `.env` files are in `.gitignore`
- Share keys securely via team password manager or encrypted messages

⚠️ **Two-key security approach:**

- **Frontend key** (public): Restricted by HTTP referrer, visible in browser
- **Backend key** (private): Restricted by IP, never exposed to users
- Keeps backend key safe even if frontend key is copied

⚠️ **Restrict your API keys:**

- Frontend: HTTP referrer restrictions (`localhost:*`, your domain)
- Backend: IP restrictions (server IPs in production)
- Enable only required APIs for each key

⚠️ **Rotate keys if exposed:**

- If a key is accidentally committed to Git, delete it immediately from Google Cloud Console
- Create a new key and update `.env` files

---

## Questions?

If you encounter issues:

1. Check the browser console for error messages
2. Verify the **frontend key** has Distance Matrix API and Directions API enabled
3. Make sure `frontend/.env` has the updated key
4. Restart the frontend dev server after changes (backend doesn't need restart)

For Google Cloud setup help, see: `GOOGLE_PLACES_SETUP.md`
