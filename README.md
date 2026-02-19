# where to go next?

Travel planner – MERN stack (MongoDB, Express, React, Node.js).

## Folder structure (MERN)

```
wheretogonext/
├── frontend/          # React (Vite) – UI
│   ├── public/
│   ├── src/
│   │   ├── components/   # LandingPage, AuthModal, etc.
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/            # Node.js + Express – API
│   ├── index.js
│   └── package.json
├── package.json       # Root scripts (run client + server)
└── README.md
```

- **frontend**: React SPA; proxy to `/api` for backend.
- **server**: Express API; add routes (e.g. `/api/auth`), MongoDB connection, and env (e.g. `PORT`, `MONGODB_URI`) when ready.

## Run locally

```bash
# Install all dependencies
npm run install:all

# Run frontend only (dev)
npm run client

# Run backend only
npm run server

# Run both (concurrently)
npm run dev
```

- Frontend: http://localhost:3000  
- API: http://localhost:5000  

## Landing page & auth modal

- **Start Planning** and **Get Started for Free** open the login/signup modal.
- Modal has Login and Sign Up tabs, social buttons (Google, Apple), and email/password forms.
- Close via the × button or clicking the backdrop.

## Google login

1. **Create OAuth credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
   - Create a project (or pick one) → **APIs & Services** → **Credentials** → **Create credentials** → **OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized JavaScript origins:** add `http://localhost:3000` (and your production URL later).
   - Copy the **Client ID** (e.g. `xxx.apps.googleusercontent.com`).

2. **Server env** (`server/.env`)
   - `GOOGLE_CLIENT_ID=` your Client ID
   - `JWT_SECRET=` a long random string (e.g. `openssl rand -hex 32`)

3. **Frontend env** (`frontend/.env`)
   - `VITE_GOOGLE_CLIENT_ID=` same Client ID as above

4. Restart server and frontend. “Continue with Google” will open the Google sign-in popup; after sign-in the user is created/found in MongoDB and a JWT is stored in the app.
