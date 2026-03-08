import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import TripDetailsPage from './components/TripDetailsPage';
import NewTripPage from './components/NewTripPage';
import ProfilePage from './components/ProfilePage';
import SearchResultsPage from './components/SearchResultsPage';
import PublicItineraryDetailsPage from './components/PublicItineraryDetailsPage';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  useEffect(() => {
    let cancelled = false;
    async function loadMe() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: 'include' });
        const data = await res.json().catch(() => ({}));
        if (!cancelled) {
          setUser(res.ok ? (data.user || null) : null);
          setAuthChecked(true);
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setAuthChecked(true);
        }
      }
    }
    loadMe();
    return () => { cancelled = true; };
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData || null);
    closeAuthModal();
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
    setUser(null);
  };

  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--wtg-bg)' }} />
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Dashboard user={user} onLogout={handleLogout} />
            ) : (
              <LandingPage onStartPlanning={openAuthModal} />
            )
          }
        />
        <Route
          path="/new-trip"
          element={
            user ? (
              <NewTripPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/trip/:tripId"
          element={
            user ? (
              <TripDetailsPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/search"
          element={
            user ? (
              <SearchResultsPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/itinerary/:itineraryId"
          element={
            user ? (
              <PublicItineraryDetailsPage user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
      {authModalOpen && (
        <AuthModal
          onClose={closeAuthModal}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </BrowserRouter>
  );
}

export default App;
