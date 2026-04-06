# WhereToGoNext

Travel planner web app (MERN):

- Frontend: React + Vite
- Backend: Express + MongoDB
- Auth: JWT + Google OAuth
- Discovery: Google Places
- AI: Gemini + OpenAI (used for social media image analysis)

## 1) Before You Start

**Install:**

- Node.js 18+
- npm 9+

---

## API Key Setup (Detailed, All Keys)

## A) Google Cloud setup (for OAuth + Places + Maps)

### Step A1: Create/choose Google Cloud project

1. Go to https://console.cloud.google.com
2. Create a project (or select existing)
3. Enable billing for the project

### Step A2: Enable APIs

Enable these APIs in Google Cloud Console -> APIs & Services -> Library:

Backend APIs:

- Places API
- Places API (New)
- Geocoding API
- Distance Matrix API
- Maps Static API
- Time Zone API

Frontend APIs:

- Maps JavaScript API
- Distance Matrix API
- Directions API

OAuth:

- Google Identity Services (via OAuth client creation in Credentials)

### Step A3: Create 2 Google API keys (recommended)

1. Backend key (private):

- Name: `wheretogonext-backend`
- Add to `backend/.env` as `GOOGLE_PLACES_API_KEY`
- Restrict by IP addresses in production
- Restrict APIs to Places API + Geocoding API

2. Frontend key (public):

- Name: `wheretogonext-frontend`
- Add to `frontend/.env` as `VITE_GOOGLE_MAPS_API_KEY`
- Restrict by HTTP referrers:
  - `http://localhost:3000/*`
  - `http://127.0.0.1:3000/*`
  - your production frontend domain
- Restrict APIs to Maps JavaScript API + Distance Matrix API + Directions API

### Step A4: Create Google OAuth client (Web)

1. APIs & Services -> Credentials -> Create Credentials -> OAuth client ID
2. Application type: Web application
3. Authorized JavaScript origins:
   - `http://localhost:3000`
   - your production frontend URL
4. Authorized redirect URIs:
   - if required by your deployed auth flow
5. Save and copy:
   - Client ID -> use in `VITE_GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_ID`
   - Client Secret -> use in `GOOGLE_CLIENT_SECRET`

## B) MongoDB setup

1. Create MongoDB Atlas cluster (or local MongoDB)
2. Create database user
3. Allow network access (IP allowlist)
4. Copy connection string to `MONGODB_URI` in `backend/.env`

## C) Gemini API setup

1. Create API key in Google AI Studio / Gemini console
2. Add key to `GEMINI_API_KEY` in `backend/.env`
3. Optional model override in `GEMINI_MODEL` (default `gemini-2.0-flash`)

## D) OpenAI API setup (optional)

1. Create API key at OpenAI dashboard
2. Add to `OPENAI_API_KEY` in `backend/.env`

## E) Open Exchange Rates setup

1. Create app id at https://openexchangerates.org
2. Add to `OPEN_EXCHANGE_RATES_APP_ID` in `backend/.env`
3. Optional cache TTL in `OPEN_EXCHANGE_RATES_CACHE_SECONDS`

## F) AirLabs setup (frontend transport helper)

1. Create API key at https://airlabs.co
2. Add to `VITE_AIRLABS_API_KEY` in `frontend/.env`

## 3) Configure Environment Files

Create your environment files **before installing or running anything**:

1. Copy example env files:

   ```bash
   cp backend/.envexample backend/.env
   cp frontend/.envexample frontend/.env
   ```

   PowerShell alternative:

   ```powershell
   Copy-Item backend/.envexample backend/.env
   Copy-Item frontend/.envexample frontend/.env
   ```

2. Fill in all required values:
   **Backend file:** `backend/.env`

   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_long_random_secret
   GOOGLE_PLACES_API_KEY=your_google_backend_key
   GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   GEMINI_MODEL=gemini-2.0-flash
   OPEN_EXCHANGE_RATES_APP_ID=
   OPEN_EXCHANGE_RATES_CACHE_SECONDS=43200
   ```

   **Frontend file:** `frontend/.env`

   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
   VITE_GOOGLE_MAPS_API_KEY=your_google_frontend_key
   VITE_AIRLABS_API_KEY=
   GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   ```

**Important:**

- For social media image analysis, `GEMINI_API_KEY` and `OPENAI_API_KEY` must exist in both env files.
- Keep `.env` files out of git.

---

## 4) Install & Run the App (Last Step)

Once ALL environment variables are set up in both backend and frontend, you can install dependencies and run the app:

From repo root:

```bash
npm run install:all

# backend only
npm run server

# frontend only
npm run client

# both (recommended for development)
npm run dev
```

URLs:

- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Health: http://localhost:5000/api/health
