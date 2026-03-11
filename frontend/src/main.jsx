import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { loadGoogleMapsScript } from './lib/loadGoogleMaps';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Load Google Maps API on app initialization
loadGoogleMapsScript().catch(err => {
  console.error('Failed to load Google Maps:', err);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <App />
    </GoogleOAuthProvider>
  </React.StrictMode>
);
