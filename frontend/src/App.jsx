import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage/LandingPage';
import AuthModal from './components/AuthModal/AuthModal';
import Dashboard from './components/Dashboard/Dashboard';
import TripDetailsPage from './components/TripDetailsPage/TripDetailsPage';
import NewTripPage from './components/NewTripPage/NewTripPage';
import ProfilePage from './components/ProfilePage/ProfilePage';
import SearchResultsPage from './components/SearchResultsPage/SearchResultsPage';
import ItineraryDetailPage from './components/ItineraryDetailPage/ItineraryDetailPage';
import Moodboard from './components/Moodboard/Moodboard';
import MoodboardFolder from './components/MoodboardFolder/MoodboardFolder';

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

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('wheretogonext_user', JSON.stringify(updatedUser));
  };

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
          path="/trip/:tripId/moodboard"
          element={
            user ? (
              <Moodboard user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/trip/:tripId/moodboard/:folderId"
          element={
            user ? (
              <MoodboardFolder user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile/:id"
          element={
            user ? (
              <ProfilePage user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <ProfilePage user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
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
          path="/itineraries/:id"
          element={
            user ? (
              <ItineraryDetailPage user={user} onLogout={handleLogout} />
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
