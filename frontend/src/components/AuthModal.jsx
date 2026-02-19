import { useState } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import {
  X,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Apple,
  ArrowRight,
} from 'lucide-react';
import './AuthModal.css';

const API_BASE = '/api';

export default function AuthModal({ onClose, onLoginSuccess }) {
  const [tab, setTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const googleLogin = useGoogleLogin({
    flow: 'implicit',
    scope: 'email profile',
    onSuccess: async (tokenResponse) => {
      setError('');
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ credential: tokenResponse.access_token }),
        });
        const text = await res.text();
        let data;
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          throw new Error(res.ok ? 'Invalid response from server' : 'Sign-in failed. Is the server running?');
        }
        if (!res.ok) throw new Error(data.error || 'Sign-in failed');
        if (onLoginSuccess && data.user && data.token) {
          onLoginSuccess(data.user, data.token);
        }
      } catch (err) {
        setError(err.message || 'Google sign-in failed. Try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google sign-in was cancelled or failed.');
      setLoading(false);
    },
  });

  const handleGoogleClick = () => {
    setError('');
    googleLogin();
  };

  return (
    <div className="auth-modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="auth-modal">
        <button type="button" className="auth-modal__close" onClick={onClose} aria-label="Close modal">
          <X size={20} aria-hidden />
        </button>
        <h1 id="auth-modal-title" className="auth-modal__brand">where to go next</h1>

        <div className="auth-modal__tabs">
          <button
            type="button"
            className={`auth-modal__tab ${tab === 'login' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setTab('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`auth-modal__tab ${tab === 'signup' ? 'auth-modal__tab--active' : ''}`}
            onClick={() => setTab('signup')}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="auth-modal__error">{error}</p>}

        {tab === 'login' ? (
          <div className="auth-modal__form">
            <h2 className="auth-modal__heading">Welcome Back!</h2>
            <p className="auth-modal__subheading">Log in to access your trips</p>

            <button
              type="button"
              className="auth-modal__social auth-modal__social--google"
              onClick={handleGoogleClick}
              disabled={loading}
            >
              <span className="auth-modal__social-icon">G</span>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </button>
            <button type="button" className="auth-modal__social auth-modal__social--apple">
              <Apple size={18} className="auth-modal__social-icon auth-modal__social-icon--apple" aria-hidden />
              Continue with Apple
            </button>

            <div className="auth-modal__divider">or</div>

            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <Mail size={18} className="auth-modal__input-icon" aria-hidden />
                <input type="text" placeholder="Enter your email or username" className="auth-modal__input" />
              </span>
            </label>
            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <Lock size={18} className="auth-modal__input-icon" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="auth-modal__input"
                />
                <button
                  type="button"
                  className="auth-modal__toggle-pw"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </span>
            </label>
            <div className="auth-modal__forgot">
              <a href="#forgot">Forgot password?</a>
            </div>

            <button type="button" className="auth-modal__submit">Log In <ArrowRight size={18} className="auth-modal__submit-icon" aria-hidden /></button>

            <p className="auth-modal__switch">
              Don&apos;t have an account?{' '}
              <button type="button" className="auth-modal__link" onClick={() => setTab('signup')}>
                Sign up
              </button>
            </p>
          </div>
        ) : (
          <div className="auth-modal__form">
            <h2 className="auth-modal__heading">Start Your Journey</h2>
            <p className="auth-modal__subheading">Create an account and start planning</p>

            <button
              type="button"
              className="auth-modal__social auth-modal__social--google"
              onClick={handleGoogleClick}
              disabled={loading}
            >
              <span className="auth-modal__social-icon">G</span>
              {loading ? 'Signing in…' : 'Continue with Google'}
            </button>
            <button type="button" className="auth-modal__social auth-modal__social--apple">
              <Apple size={18} className="auth-modal__social-icon auth-modal__social-icon--apple" aria-hidden />
              Continue with Apple
            </button>

            <div className="auth-modal__divider">or</div>

            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <User size={18} className="auth-modal__input-icon" aria-hidden />
                <input type="text" placeholder="Enter your name" className="auth-modal__input" />
              </span>
            </label>
            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <User size={18} className="auth-modal__input-icon" aria-hidden />
                <input type="text" placeholder="Enter your username" className="auth-modal__input" />
              </span>
            </label>
            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <Mail size={18} className="auth-modal__input-icon" aria-hidden />
                <input type="email" placeholder="Enter your email" className="auth-modal__input" />
              </span>
            </label>
            <label className="auth-modal__label">
              <span className="auth-modal__input-wrap">
                <Lock size={18} className="auth-modal__input-icon" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="auth-modal__input"
                />
                <button
                  type="button"
                  className="auth-modal__toggle-pw"
                  onClick={() => setShowPassword((p) => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
                </button>
              </span>
            </label>
            <p className="auth-modal__hint">Must be 8+ characters and contain a number and a symbol</p>

            <button type="button" className="auth-modal__submit">Create Account <ArrowRight size={18} className="auth-modal__submit-icon" aria-hidden /></button>

            <p className="auth-modal__switch">
              Already have an account?{' '}
              <button type="button" className="auth-modal__link" onClick={() => setTab('login')}>
                Log in
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
