import { useState } from 'react';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';

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
    <>
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <LandingPage onStartPlanning={openAuthModal} />
      )}
      {authModalOpen && (
        <AuthModal
          onClose={closeAuthModal}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </>
  );
}

export default App;
