import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import TripDetailsPage from './components/TripDetailsPage';
import NewTripPage from './components/NewTripPage';

function App() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('wheretogonext_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const openAuthModal = () => setAuthModalOpen(true);
  const closeAuthModal = () => setAuthModalOpen(false);

  const handleLoginSuccess = (userData, token) => {
    localStorage.setItem('wheretogonext_token', token);
    localStorage.setItem('wheretogonext_user', JSON.stringify(userData));
    setUser(userData);
    closeAuthModal();
  };

  const handleLogout = () => {
    localStorage.removeItem('wheretogonext_token');
    localStorage.removeItem('wheretogonext_user');
    setUser(null);
  };

  return (
    <BrowserRouter>
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
