import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Pencil, Share2, UserPlus, UserMinus } from 'lucide-react';
import { fetchMyProfile, fetchProfile, updateMyProfile, addFriend, removeFriend } from '../../api/profileApi';
import './ProfilePage.css';

export default function ProfilePage({ user, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('overview');
  const { id: profileId } = useParams();
  const [profileData, setProfileData] = useState(null);
  const [stats, setStats] = useState({ countries: 0, trips: 0, friends: 0 });
  const [trips, setTrips] = useState([]);
  const [friendsList, setFriendsList] = useState([]);
  const [isFriend, setIsFriend] = useState(false);
  const [friendLoading, setFriendLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({ name: '', username: '', picture: '' });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    async function loadProfile() {
      setLoading(true);
      setErrorMsg('');
      try {
        const payload = profileId
          ? await fetchProfile(profileId, { signal: controller.signal })
          : await fetchMyProfile({ signal: controller.signal });
        if (cancelled) return;
        const nextTrips = Array.isArray(payload?.trips) ? payload.trips : [];
        const nextFriends = Array.isArray(payload?.friends) ? payload.friends : [];
        setProfileData(payload?.profile || null);
        setStats({
          countries: payload?.stats?.countries ?? 0,
          trips: payload?.stats?.trips ?? nextTrips.length,
          friends: payload?.stats?.friends ?? nextFriends.length,
        });
        setTrips(nextTrips);
        setFriendsList(nextFriends);
        setIsFriend(Boolean(payload?.viewer?.isFriend));
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err?.message || 'Could not load profile.');
        setProfileData(user || null);
        setStats({ countries: 0, trips: 0, friends: 0 });
        setTrips([]);
        setFriendsList([]);
        setIsFriend(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [profileId, user]);

  useEffect(() => {
    setActiveTab('overview');
  }, [profileId]);

  const isSelf = !profileId || (user?.id && String(profileId) === String(user.id));
  const profile = profileData || user || {};
  const displayName = profile?.name || 'Traveler';
  const handle = profile?.username
    ? `@${profile.username}`
    : profile?.email
      ? `@${profile.email.split('@')[0]}`
      : '@traveler';
  const picture = profile?.picture;
  const shareUrl = profile?.id || profileId
    ? `${window.location.origin}/profile/${profile?.id || profileId}`
    : `${window.location.origin}/profile`;

  const handleShare = () => {
    if (!shareUrl.trim()) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
  };

  const getTripLink = (trip) => {
    if (!isSelf && trip.published && trip.visibility === 'public') {
      return `/itineraries/${trip.id}`;
    }
    return `/trip/${trip.id}`;
  };

  const handleFriendToggle = async () => {
    if (!profile?.id || isSelf || friendLoading) return;
    setFriendLoading(true);
    try {
      if (isFriend) {
        await removeFriend(profile.id);
        setIsFriend(false);
        setStats((prev) => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
        setFriendsList((prev) => prev.filter((f) => String(f.id) !== String(profile.id)));
      } else {
        await addFriend(profile.id);
        setIsFriend(true);
        setStats((prev) => ({ ...prev, friends: prev.friends + 1 }));
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update friend status.');
    } finally {
      setFriendLoading(false);
    }
  };

  const openEdit = () => {
    setEditError('');
    setEditDraft({
      name: profile?.name || '',
      username: profile?.username || '',
      picture: profile?.picture || '',
    });
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (editSaving) return;
    setEditError('');
    setEditSaving(true);
    try {
      const payload = {
        name: editDraft.name.trim(),
        username: editDraft.username.trim(),
        picture: editDraft.picture.trim(),
      };
      const res = await updateMyProfile(payload);
      const nextProfile = res?.profile || payload;
      setProfileData(nextProfile);
      setEditOpen(false);
      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          ...nextProfile,
        });
      }
    } catch (err) {
      setEditError(err?.message || 'Could not update profile.');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <header className="profile-page__app-header">
        <Link to="/" className="profile-page__brand-link">
          <div className="profile-page__logo">@</div>
          <div className="profile-page__app-meta">
            <span className="profile-page__app-name">where to go next</span>
            <span className="profile-page__app-tagline">Your travel companion</span>
          </div>
        </Link>
        <div className="profile-page__header-right">
          <button type="button" className="profile-page__icon-pill" aria-label="Notifications">
            🔔
          </button>
          <button type="button" className="profile-page__icon-pill" aria-label="Theme">
            ☀️
          </button>
          {user && (
            <button type="button" className="profile-page__logout" onClick={onLogout}>
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="profile-page__main">
        <section className="profile-page__cover" />
        <Link to="/" className="profile-page__back-btn">
          <span className="profile-page__back-icon" aria-hidden>←</span>
          <span>Back</span>
        </Link>

        <section className="profile-page__card-wrap">
          <article className="profile-page__card">
            <header className="profile-page__header">
              <div className="profile-page__avatar-wrap">
                <div className="profile-page__avatar-border">
                  <div className="profile-page__avatar-inner">
                    {picture ? (
                      <img src={picture} alt="" />
                    ) : (
                      <div className="profile-page__avatar-placeholder">
                        {(displayName || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="profile-page__identity">
                <h1 className="profile-page__name">{displayName}</h1>
                <p className="profile-page__subtitle">Travel, sunsets & sushi</p>
                <div className="profile-page__meta">
                  <span className="profile-page__handle">{handle}</span>
                </div>
              </div>
              <div className="profile-page__actions">
                {isSelf && (
                  <button type="button" className="profile-page__btn profile-page__btn--primary" onClick={openEdit}>
                    <Pencil size={16} aria-hidden />
                    <span>Edit profile</span>
                  </button>
                )}
                {!isSelf && (
                  <button
                    type="button"
                    className={`profile-page__btn ${isFriend ? 'profile-page__btn--ghost' : 'profile-page__btn--primary'}`}
                    onClick={handleFriendToggle}
                    disabled={friendLoading}
                  >
                    {isFriend ? <UserMinus size={16} aria-hidden /> : <UserPlus size={16} aria-hidden />}
                    <span>{isFriend ? 'Remove friend' : 'Add friend'}</span>
                  </button>
                )}
                <button type="button" className="profile-page__btn" onClick={handleShare}>
                  <Share2 size={16} aria-hidden />
                  <span>Share</span>
                </button>
              </div>
            </header>

            <section className="profile-page__stats">
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.countries}</span>
                <span className="profile-page__stat-label">Countries</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.trips}</span>
                <span className="profile-page__stat-label">Trips</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{stats.friends}</span>
                <span className="profile-page__stat-label">Friends</span>
              </div>
            </section>

            <nav className="profile-page__tabs" aria-label="Profile sections">
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'overview' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview & Map
              </button>
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'trips' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('trips')}
              >
                {isSelf ? 'My Trips' : 'Trips'}
              </button>
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'friends' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                {isSelf ? 'My Friends' : 'Friends'}
              </button>
            </nav>

            <section className="profile-page__content">
              {loading && <p className="profile-page__empty">Loading profile...</p>}
              {errorMsg && !loading && <p className="profile-page__empty profile-page__error">{errorMsg}</p>}
              {activeTab === 'overview' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My World Map' : 'World Map'}</h2>
                  <div className="profile-page__map-card">
                    <span className="profile-page__map-pin profile-page__map-pin--one" />
                    <span className="profile-page__map-pin profile-page__map-pin--two" />
                    <span className="profile-page__map-pin profile-page__map-pin--three" />
                  </div>
                </>
              )}
              {activeTab === 'trips' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My Trips' : 'Trips'}</h2>
                  {trips.length === 0 ? (
                    <p className="profile-page__empty">
                      {isSelf ? 'No trips yet.' : 'No trips yet for this traveler.'}
                    </p>
                  ) : (
                    <ul className="profile-page__trip-list">
                      {trips.map((trip) => (
                        <li key={trip.id}>
                          <Link to={getTripLink(trip)} className="profile-page__trip-card">
                            <div className="profile-page__trip-info">
                              <span className="profile-page__trip-title">{trip.title || 'Untitled trip'}</span>
                              <span className="profile-page__trip-subtitle">
                                {trip.destination || trip.locations || 'Destination TBD'}
                              </span>
                            </div>
                            <span className="profile-page__trip-status">
                              {trip.published && trip.visibility === 'public' ? 'Public' : 'Private'}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              {activeTab === 'friends' && (
                <>
                  <h2 className="profile-page__section-title">{isSelf ? 'My Friends' : 'Friends'}</h2>
                  {friendsList.length === 0 ? (
                    <p className="profile-page__empty">
                      {isSelf ? 'No friends yet.' : 'No friends to show yet.'}
                    </p>
                  ) : (
                    <ul className="profile-page__friends-list">
                      {friendsList.map((friend) => (
                        <li key={friend.id}>
                          <Link to={`/profile/${friend.id}`} className="profile-page__friend-card">
                            <div className="profile-page__friend-avatar">
                              {friend.picture ? (
                                <img src={friend.picture} alt="" />
                              ) : (
                                <span>{(friend.name || '?').charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="profile-page__friend-info">
                              <span className="profile-page__friend-name">{friend.name || 'Traveler'}</span>
                              <span className="profile-page__friend-handle">
                                {friend.username ? `@${friend.username}` : ''}
                              </span>
                            </div>
                            <span className="profile-page__friend-arrow" aria-hidden>→</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </section>
          </article>
        </section>
      </main>

      {editOpen && (
        <div className="profile-page__modal" role="dialog" aria-modal="true" aria-labelledby="edit-profile-title">
          <button
            type="button"
            className="profile-page__modal-backdrop"
            aria-label="Close"
            onClick={() => setEditOpen(false)}
          />
          <div className="profile-page__modal-card">
            <div className="profile-page__modal-head">
              <h2 id="edit-profile-title" className="profile-page__modal-title">Edit profile</h2>
              <button type="button" className="profile-page__modal-close" onClick={() => setEditOpen(false)}>
                ✕
              </button>
            </div>
            <div className="profile-page__modal-body">
              <label className="profile-page__modal-label" htmlFor="profile-name">
                Name
              </label>
              <input
                id="profile-name"
                className="profile-page__modal-input"
                value={editDraft.name}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Your name"
              />
              <label className="profile-page__modal-label" htmlFor="profile-username">
                Username
              </label>
              <input
                id="profile-username"
                className="profile-page__modal-input"
                value={editDraft.username}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="username"
              />
              <label className="profile-page__modal-label" htmlFor="profile-picture">
                Photo URL
              </label>
              <input
                id="profile-picture"
                className="profile-page__modal-input"
                value={editDraft.picture}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, picture: e.target.value }))}
                placeholder="https://..."
              />
              {editError && <p className="profile-page__modal-error">{editError}</p>}
            </div>
            <div className="profile-page__modal-actions">
              <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-page__modal-btn profile-page__modal-btn--primary"
                onClick={saveProfile}
                disabled={editSaving}
              >
                {editSaving ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
