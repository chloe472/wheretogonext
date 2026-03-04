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

- Add to  `backend/.env` (add to `.gitignore`):

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