import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import TripDetailsPage from './components/TripDetailsPage';
import NewTripPage from './components/NewTripPage';
import ProfilePage from './components/ProfilePage';
import SearchResultsPage from './components/SearchResultsPage';
import ItineraryDetailPage from './components/ItineraryDetailPage';

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

  const handleLoginSuccess = (userData, token, meta) => {
    localStorage.setItem('wheretogonext_token', token);
    localStorage.setItem('wheretogonext_user', JSON.stringify(userData));
    setUser(userData);
    closeAuthModal();
    if (meta?.action === 'login') {
      toast.success('Logged in successfully!');
    }
  };

  const handleUserUpdate = (nextUser) => {
    if (!nextUser) return;
    localStorage.setItem('wheretogonext_user', JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('wheretogonext_token');
    localStorage.removeItem('wheretogonext_user');
    setUser(null);
    toast.success('Logged out successfully!');
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-center" toastOptions={{ duration: 3500 }} />
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
              <ProfilePage user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />
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
            <ItineraryDetailPage user={user} onLogout={handleLogout} onRequireLogin={openAuthModal} />
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
