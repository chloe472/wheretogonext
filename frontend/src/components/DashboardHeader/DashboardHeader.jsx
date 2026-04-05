import { Link, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Bell, User, Search } from 'lucide-react';
import { searchLocations } from '../../data/mockLocations';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getNotificationStreamUrl,
} from '../../api/notificationsApi';
import './DashboardHeader.css';

/**
 * Shared top bar for dashboard-style pages (My Trips, Explore, etc.)
 * @param {{ user?: { name?: string }, onLogout?: () => void, activeNav?: 'dashboard' | 'explore' }} props
 */
export default function DashboardHeader({ user, onLogout, activeNav = 'dashboard' }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef(null);
  const notificationsRef = useRef(null);
  const userId = String(user?.id || user?._id || '').trim();

  const searchSuggestions = searchLocations(searchQuery);

  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    const ac = new AbortController();

    async function loadLatest() {
      try {
        const payload = await fetchNotifications({ limit: 20 }, ac.signal);
        if (cancelled) return;
        setNotifications(payload.notifications);
        setUnreadCount(payload.unreadCount);
        setNotificationsError('');
      } catch {
        if (!cancelled) {
          setNotificationsError('Could not load notifications.');
        }
      }
    }

    function handleVisibilityChange() {
      if (!cancelled && document.visibilityState === 'visible') {
        loadLatest();
      }
    }

    loadLatest();

    // SSE — server pushes new notifications instantly.
    const streamUrl = getNotificationStreamUrl();
    let es = null;
    let reconnectTimer = null;
    let reconnectDelay = 2000;

    function connectSSE() {
      if (cancelled || !streamUrl) return;
      es = new EventSource(streamUrl);

      es.addEventListener('connected', () => {
        reconnectDelay = 2000; // reset backoff on successful connection
      });

      es.addEventListener('notification', (e) => {
        if (cancelled) return;
        try {
          const notification = JSON.parse(e.data);
          setNotifications((prev) => {
            if (prev.some((n) => n.id === notification.id)) return prev;
            return [notification, ...prev];
          });
          if (!notification.isRead) {
            setUnreadCount((c) => c + 1);
          }
        } catch { /* ignore malformed event */ }
      });

      es.onerror = () => {
        es.close();
        if (!cancelled) {
          reconnectTimer = setTimeout(() => {
            reconnectDelay = Math.min(reconnectDelay * 2, 30000);
            connectSSE();
          }, reconnectDelay);
        }
      };
    }

    connectSSE();

    // Slow fallback poll (60 s) to catch anything missed while SSE was reconnecting.
    const intervalId = window.setInterval(loadLatest, 60000);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      ac.abort();
      if (es) es.close();
      clearTimeout(reconnectTimer);
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userId]);

  const refreshNotifications = async () => {
    setNotificationsLoading(true);
    setNotificationsError('');
    try {
      const payload = await fetchNotifications({ limit: 20 });
      setNotifications(payload.notifications);
      setUnreadCount(payload.unreadCount);
    } catch (err) {
      setNotificationsError(err?.message || 'Failed to load notifications');
    } finally {
      setNotificationsLoading(false);
    }
  };

  const formatNotificationTime = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getNotificationLink = (n) => {
    const type = String(n?.type || '');
    if (type === 'friend_request_received') {
      const fromId = String(n?.meta?.fromUserId || '').trim();
      if (fromId) return `/profile/${encodeURIComponent(fromId)}`;
      return '/profile?tab=friends&section=requests';
    }
    if (type === 'friend_request_accepted') {
      const accepterId = String(n?.meta?.acceptedByUserId || '').trim();
      if (accepterId) return `/profile/${encodeURIComponent(accepterId)}`;
      return '/profile?tab=friends&section=friends';
    }
    if (type === 'profile_shared') {
      const sharerId = String(n?.meta?.sharedByUserId || '').trim();
      if (sharerId) return `/profile/${encodeURIComponent(sharerId)}`;
    }
    const direct = String(n?.link || '').trim();
    if (direct) return direct;
    if (type === 'itinerary_commented' && n?.meta?.itineraryId) {
      return `/trip/${encodeURIComponent(String(n.meta.itineraryId))}?tab=comments`;
    }
    if (type === 'itinerary_added' && n?.meta?.itineraryId) {
      return `/trip/${encodeURIComponent(String(n.meta.itineraryId))}`;
    }
    if (type === 'itinerary_updated' && n?.meta?.itineraryId) {
      return `/trip/${encodeURIComponent(String(n.meta.itineraryId))}`;
    }
    return '/';
  };

  const handleOpenNotifications = async () => {
    const nextOpen = !notificationsOpen;
    setNotificationsOpen(nextOpen);
    if (nextOpen) {
      setProfileOpen(false);
      await refreshNotifications();
    }
  };

  const handleViewNotification = async (n) => {
    const link = getNotificationLink(n);
    setNotifications((prev) => prev.map((it) => (it.id === n.id ? { ...it, isRead: true } : it)));
    if (!n?.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
    try {
      if (!n?.isRead) {
        const payload = await markNotificationRead(n.id);
        setUnreadCount(payload.unreadCount);
      }
    } catch {
      // best effort
    }
    setNotificationsOpen(false);
    navigate(link);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((it) => ({ ...it, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      // best effort
    }
  };

  return (
    <header className="dashboard__header">
      <Link to="/" className="dashboard__brand dashboard__brand-link">
        <div className="dashboard__logo" aria-hidden>
          @
        </div>
        <div>
          <span className="dashboard__app-name">where to go next</span>
          <span className="dashboard__tagline">Your travel companion</span>
        </div>
      </Link>

      <div className="dashboard__search-wrap" ref={searchRef}>
        <form
          className="dashboard__search-form"
          onSubmit={(e) => {
            e.preventDefault();
            const term = searchQuery.trim();
            if (term) {
              navigate(`/search?q=${encodeURIComponent(term)}`);
              setSearchOpen(false);
            }
          }}
        >
          <Search size={18} className="dashboard__search-icon" aria-hidden />
          <input
            type="text"
            className="dashboard__search-input"
            placeholder="Search for destination / itineraries"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            aria-label="Search destinations or itineraries"
            aria-expanded={searchOpen && searchSuggestions.length > 0}
            aria-autocomplete="list"
          />
        </form>

        {searchOpen && searchSuggestions.length > 0 && (
          <ul className="dashboard__search-suggestions" role="listbox">
            {searchSuggestions.slice(0, 8).map((loc) => (
              <li key={loc.id}>
                <button
                  type="button"
                  className="dashboard__search-suggestion"
                  role="option"
                  onClick={() => {
                    const term = loc.country ? `${loc.name}, ${loc.country}` : loc.name;
                    navigate(`/search?q=${encodeURIComponent(term)}`);
                    setSearchQuery(term);
                    setSearchOpen(false);
                  }}
                >
                  {loc.name}
                  {loc.country && <span className="dashboard__search-suggestion-meta">{loc.country}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <nav className="dashboard__nav">
        {activeNav === 'dashboard' ? (
          <a href="#my-trips" className="dashboard__nav-link dashboard__nav-link--active">
            My Trips
          </a>
        ) : (
          <Link to="/" className="dashboard__nav-link">
            My Trips
          </Link>
        )}
        <Link
          to="/search"
          className={
            activeNav === 'explore'
              ? 'dashboard__nav-link dashboard__nav-link--active'
              : 'dashboard__nav-link'
          }
        >
          Explore
        </Link>
        <div className="dashboard__notifications-wrap" ref={notificationsRef}>
          <button
            type="button"
            className="dashboard__icon-btn"
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            onClick={handleOpenNotifications}
          >
            <Bell size={20} aria-hidden />
            {unreadCount > 0 && <span className="dashboard__notif-badge">{Math.min(99, unreadCount)}</span>}
          </button>
          {notificationsOpen && (
            <div className="dashboard__notifications-menu" role="dialog" aria-label="Notifications">
              <div className="dashboard__notifications-head">
                <strong>Notifications</strong>
                <button
                  type="button"
                  className="dashboard__notifications-readall"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                >
                  Mark all read
                </button>
              </div>

              {notificationsLoading && <p className="dashboard__notifications-empty">Loading...</p>}
              {!notificationsLoading && notificationsError && (
                <p className="dashboard__notifications-empty">{notificationsError}</p>
              )}
              {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                <p className="dashboard__notifications-empty">No notifications yet.</p>
              )}

              {!notificationsLoading && !notificationsError && notifications.length > 0 && (
                <ul className="dashboard__notifications-list">
                  {notifications.map((n) => (
                    <li key={n.id} className={`dashboard__notification-item ${n.isRead ? '' : 'dashboard__notification-item--unread'}`}>
                      <div className="dashboard__notification-copy">
                        <p className="dashboard__notification-title">{n.title || 'Notification'}</p>
                        {n.message && <p className="dashboard__notification-message">{n.message}</p>}
                        <span className="dashboard__notification-time">{formatNotificationTime(n.createdAt)}</span>
                      </div>
                      <button
                        type="button"
                        className="dashboard__notification-view"
                        onClick={() => handleViewNotification(n)}
                      >
                        View
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
        <div className="dashboard__profile-wrap">
          <button
            type="button"
            className="dashboard__icon-btn dashboard__icon-btn--avatar"
            aria-label="Profile"
            aria-expanded={profileOpen}
            onClick={() => setProfileOpen((o) => !o)}
          >
            <User size={20} aria-hidden />
          </button>
          {profileOpen && (
            <>
              <button
                type="button"
                className="dashboard__profile-backdrop"
                aria-label="Close menu"
                onClick={() => setProfileOpen(false)}
              />
              <div className="dashboard__profile-menu">
                {user?.name && <span className="dashboard__profile-name">{user.name}</span>}
                <Link
                  to="/profile"
                  className="dashboard__profile-link"
                  onClick={() => setProfileOpen(false)}
                >
                  Profile
                </Link>
                <button
                  type="button"
                  className="dashboard__profile-logout"
                  onClick={() => {
                    setProfileOpen(false);
                    onLogout?.();
                  }}
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
