import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Pencil,
  Share2,
  UserPlus,
  UserMinus,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  Globe,
  Music,
  AtSign,
} from 'lucide-react';
import {
  fetchMyProfile,
  fetchProfile,
  updateMyProfile,
  uploadProfilePhoto,
  addFriend,
  removeFriend,
  fetchFriendRequests,
  fetchOutgoingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from '../../api/profileApi';
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
  const [requestStatus, setRequestStatus] = useState('none');
  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [outgoingLoading, setOutgoingLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editDraft, setEditDraft] = useState({
    name: '',
    username: '',
    intro: '',
    interests: '',
    nationality: '',
    socials: [],
  });
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [socialDraft, setSocialDraft] = useState({ platform: '', value: '' });

  const isSelf = !profileId || (user?.id && String(profileId) === String(user.id));

  const normalizeSocials = (list) => {
    if (!Array.isArray(list)) return [];
    return list
      .map((s) => ({
        id: s?.id || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        platform: s?.platform || '',
        url: s?.url || '',
        handle: s?.handle || '',
      }))
      .filter((s) => s.platform || s.url || s.handle);
  };

  const commitSocialDraft = () => {
    const platform = socialDraft.platform.trim();
    const value = socialDraft.value.trim();
    if (!platform && !value) return;
    const next = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      platform,
      url: value.startsWith('@') ? '' : value,
      handle: value.startsWith('@') ? value : '',
    };
    setEditDraft((prev) => ({
      ...prev,
      socials: [...prev.socials, next],
    }));
    setSocialDraft({ platform: '', value: '' });
  };

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
        setRequestStatus(payload?.viewer?.requestStatus || 'none');
      } catch (err) {
        if (cancelled) return;
        setErrorMsg(err?.message || 'Could not load profile.');
        setProfileData(user || null);
        setStats({ countries: 0, trips: 0, friends: 0 });
        setTrips([]);
        setFriendsList([]);
        setIsFriend(false);
        setRequestStatus('none');
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

  useEffect(() => {
    if (!isSelf) return;
    let cancelled = false;
    const loadRequests = async () => {
      setRequestsLoading(true);
      try {
        const data = await fetchFriendRequests();
        if (cancelled) return;
        setRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch {
        if (!cancelled) setRequests([]);
      } finally {
        if (!cancelled) setRequestsLoading(false);
      }
    };
    loadRequests();
    return () => {
      cancelled = true;
    };
  }, [isSelf]);

  useEffect(() => {
    if (!isSelf) return;
    let cancelled = false;
    const loadOutgoing = async () => {
      setOutgoingLoading(true);
      try {
        const data = await fetchOutgoingFriendRequests();
        if (cancelled) return;
        setOutgoingRequests(Array.isArray(data.requests) ? data.requests : []);
      } catch {
        if (!cancelled) setOutgoingRequests([]);
      } finally {
        if (!cancelled) setOutgoingLoading(false);
      }
    };
    loadOutgoing();
    return () => {
      cancelled = true;
    };
  }, [isSelf]);

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
  const interestsList = Array.isArray(profile?.interests) ? profile.interests : [];
  const socialsList = Array.isArray(profile?.socials) ? profile.socials : [];

  const countries = [
    { label: 'Singapore', code: 'SG' },
    { label: 'Malaysia', code: 'MY' },
    { label: 'Indonesia', code: 'ID' },
    { label: 'Thailand', code: 'TH' },
    { label: 'Vietnam', code: 'VN' },
    { label: 'Philippines', code: 'PH' },
    { label: 'China', code: 'CN' },
    { label: 'Hong Kong', code: 'HK' },
    { label: 'Japan', code: 'JP' },
    { label: 'South Korea', code: 'KR' },
    { label: 'India', code: 'IN' },
    { label: 'Australia', code: 'AU' },
    { label: 'New Zealand', code: 'NZ' },
    { label: 'United Kingdom', code: 'GB' },
    { label: 'United States', code: 'US' },
    { label: 'Canada', code: 'CA' },
    { label: 'France', code: 'FR' },
    { label: 'Germany', code: 'DE' },
    { label: 'Italy', code: 'IT' },
    { label: 'Spain', code: 'ES' },
    { label: 'Netherlands', code: 'NL' },
    { label: 'Sweden', code: 'SE' },
    { label: 'Switzerland', code: 'CH' },
    { label: 'Brazil', code: 'BR' },
    { label: 'Mexico', code: 'MX' },
  ];

  const flagForCountry = (label) => {
    const match = countries.find((c) => c.label === label);
    const code = match?.code;
    if (!code) return '';
    return code
      .toUpperCase()
      .split('')
      .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
      .join('');
  };

  const platformIcon = (platform) => {
    const p = String(platform || '').toLowerCase();
    if (p.includes('facebook')) return <Facebook size={16} aria-hidden />;
    if (p.includes('instagram')) return <Instagram size={16} aria-hidden />;
    if (p.includes('tiktok')) return <Music size={16} aria-hidden />;
    if (p.includes('twitter') || p === 'x' || p.includes('x ')) return <Twitter size={16} aria-hidden />;
    if (p.includes('youtube')) return <Youtube size={16} aria-hidden />;
    if (p.includes('linkedin')) return <Linkedin size={16} aria-hidden />;
    if (p.includes('threads')) return <AtSign size={16} aria-hidden />;
    return <Globe size={16} aria-hidden />;
  };

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
        setRequestStatus('none');
      } else if (requestStatus === 'outgoing') {
        await removeFriend(profile.id);
        setRequestStatus('none');
      } else {
        await addFriend(profile.id);
        setRequestStatus('outgoing');
      }
    } catch (err) {
      setErrorMsg(err?.message || 'Could not update friend status.');
    } finally {
      setFriendLoading(false);
    }
  };

  const acceptRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await acceptFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setStats((prev) => ({ ...prev, friends: prev.friends + 1 }));
    } catch (err) {
      setErrorMsg(err?.message || 'Could not accept request.');
    }
  };

  const declineRequest = async (requestId) => {
    if (!requestId) return;
    try {
      await declineFriendRequest(requestId);
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
      setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (err) {
      setErrorMsg(err?.message || 'Could not decline request.');
    }
  };

  const removeFriendFromList = async (friendId) => {
    if (!friendId) return;
    try {
      await removeFriend(friendId);
      setFriendsList((prev) => prev.filter((f) => String(f.id) !== String(friendId)));
      setStats((prev) => ({ ...prev, friends: Math.max(0, prev.friends - 1) }));
    } catch (err) {
      setErrorMsg(err?.message || 'Could not remove friend.');
    }
  };

  const openEdit = () => {
    setEditError('');
    setEditDraft({
      name: profile?.name || '',
      username: profile?.username || '',
      intro: profile?.intro || '',
      interests: Array.isArray(profile?.interests) ? profile.interests.join(', ') : '',
      nationality: profile?.nationality || '',
      socials: normalizeSocials(profile?.socials),
    });
    setPhotoFile(null);
    setSocialDraft({ platform: '', value: '' });
    setEditOpen(true);
  };

  const saveProfile = async () => {
    if (editSaving) return;
    setEditError('');
    setEditSaving(true);
    try {
      if (photoFile) {
        setPhotoUploading(true);
        const uploadRes = await uploadProfilePhoto(photoFile);
        const uploadedProfile = uploadRes?.profile || {};
        setProfileData((prev) => ({ ...prev, ...uploadedProfile }));
        if (onUserUpdate) {
          onUserUpdate({
            ...user,
            ...uploadedProfile,
          });
        }
      }
      const payload = {
        name: editDraft.name.trim(),
        username: editDraft.username.trim(),
        intro: editDraft.intro.trim(),
        interests: editDraft.interests
          .split(',')
          .map((x) => x.trim())
          .filter(Boolean),
        nationality: editDraft.nationality.trim(),
        socials: Array.isArray(editDraft.socials)
          ? editDraft.socials.map(({ platform, url, handle }) => ({ platform, url, handle }))
          : [],
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
      setPhotoUploading(false);
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
                {profile?.intro && (
                  <p className="profile-page__subtitle profile-page__subtitle--intro">{profile.intro}</p>
                )}
                <div className="profile-page__meta">
                  <span className="profile-page__handle">{handle}</span>
                </div>
                {socialsList.length > 0 && (
                  <div className="profile-page__meta profile-page__meta--inline">
                    {socialsList.map((s, idx) => (
                      <span key={`${s.platform}-${idx}`} className="profile-page__social-inline">
                        <span className="profile-page__social-icon">{platformIcon(s.platform)}</span>
                        <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                        {(s.handle || s.url) && (
                          <span className="profile-page__social-handle">{s.handle || s.url}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                {profile?.nationality && (
                  <div className="profile-page__meta profile-page__meta--stack">
                    <span className="profile-page__meta-label">Nationality</span>
                    <span className="profile-page__meta-value">
                      {`${flagForCountry(profile.nationality)} ${profile.nationality}`}
                    </span>
                  </div>
                )}
                {!profile?.intro && (
                  <p className="profile-page__subtitle profile-page__subtitle--intro profile-page__subtitle--placeholder">
                    Add a short intro about your travel style.
                  </p>
                )}
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
                    {isFriend || requestStatus === 'outgoing' ? (
                      <UserMinus size={16} aria-hidden />
                    ) : (
                      <UserPlus size={16} aria-hidden />
                    )}
                    <span>
                      {isFriend
                        ? 'Remove friend'
                        : requestStatus === 'outgoing'
                          ? 'Request sent'
                          : 'Add friend'}
                    </span>
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
                  {isSelf && (
                    <div className="profile-page__friend-section">
                      <h3 className="profile-page__requests-title">Friend Requests</h3>
                      {requestsLoading ? (
                        <p className="profile-page__empty">Loading requests...</p>
                      ) : requests.length === 0 ? (
                        <p className="profile-page__empty">No new requests.</p>
                      ) : (
                        <ul className="profile-page__requests-list">
                          {requests.map((req) => (
                            <li key={req.id} className="profile-page__request-card">
                              <Link to={`/profile/${req.from.id}`} className="profile-page__friend-card">
                                <div className="profile-page__friend-avatar">
                                  {req.from.picture ? (
                                    <img src={req.from.picture} alt="" />
                                  ) : (
                                    <span>{(req.from.name || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="profile-page__friend-info">
                                  <span className="profile-page__friend-name">{req.from.name || 'Traveler'}</span>
                                  <span className="profile-page__friend-handle">
                                    {req.from.username ? `@${req.from.username}` : ''}
                                  </span>
                                </div>
                              </Link>
                              <div className="profile-page__request-actions">
                                <button type="button" onClick={() => acceptRequest(req.id)} className="profile-page__btn profile-page__btn--primary">
                                  Accept
                                </button>
                                <button type="button" onClick={() => declineRequest(req.id)} className="profile-page__btn profile-page__btn--ghost">
                                  Decline
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  {isSelf && (
                    <div className="profile-page__friend-section">
                      <h3 className="profile-page__requests-title">Requests Sent</h3>
                      {outgoingLoading ? (
                        <p className="profile-page__empty">Loading requests...</p>
                      ) : outgoingRequests.length === 0 ? (
                        <p className="profile-page__empty">No pending requests.</p>
                      ) : (
                        <ul className="profile-page__requests-list">
                          {outgoingRequests.map((req) => (
                            <li key={req.id} className="profile-page__request-card">
                              <Link to={`/profile/${req.to.id}`} className="profile-page__friend-card">
                                <div className="profile-page__friend-avatar">
                                  {req.to.picture ? (
                                    <img src={req.to.picture} alt="" />
                                  ) : (
                                    <span>{(req.to.name || '?').charAt(0).toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="profile-page__friend-info">
                                  <span className="profile-page__friend-name">{req.to.name || 'Traveler'}</span>
                                  <span className="profile-page__friend-handle">
                                    {req.to.username ? `@${req.to.username}` : ''}
                                  </span>
                                </div>
                              </Link>
                              <div className="profile-page__request-actions">
                                <button type="button" onClick={() => declineRequest(req.id)} className="profile-page__btn profile-page__btn--ghost">
                                  Cancel
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                  <div className="profile-page__friend-section">
                    <h3 className="profile-page__requests-title">{isSelf ? 'Friends' : 'Friends List'}</h3>
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
                            {isSelf && (
                              <button
                                type="button"
                                className="profile-page__friend-remove"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  removeFriendFromList(friend.id);
                                }}
                              >
                                Remove
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
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
              <div className="profile-page__edit-grid profile-page__edit-grid--stacked">
                <div className="profile-page__edit-avatar profile-page__edit-avatar--top">
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
                  <label className="profile-page__upload-btn">
                    Upload from device
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {photoFile && (
                    <p className="profile-page__modal-file">Selected: {photoFile.name}</p>
                  )}
                </div>
                <div className="profile-page__edit-fields">
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
              <label className="profile-page__modal-label" htmlFor="profile-intro">
                Intro
              </label>
              <textarea
                id="profile-intro"
                className="profile-page__modal-textarea"
                rows={4}
                value={editDraft.intro}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, intro: e.target.value }))}
                placeholder="Introduce yourself..."
              />
              <label className="profile-page__modal-label" htmlFor="profile-interests">
                Interested in
              </label>
              <input
                id="profile-interests"
                className="profile-page__modal-input"
                value={editDraft.interests}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, interests: e.target.value }))}
                placeholder="Beach, Foodie, Culture..."
              />
              <label className="profile-page__modal-label" htmlFor="profile-nationality">
                Nationality
              </label>
              <select
                id="profile-nationality"
                className="profile-page__modal-input profile-page__modal-select"
                value={editDraft.nationality}
                onChange={(e) => setEditDraft((prev) => ({ ...prev, nationality: e.target.value }))}
              >
                <option value="">Select nationality</option>
                {!countries.some((c) => c.label === editDraft.nationality) && editDraft.nationality && (
                  <option value={editDraft.nationality}>{editDraft.nationality}</option>
                )}
                {countries.map((c) => (
                  <option key={c.code} value={c.label}>{`${c.label} ${flagForCountry(c.label)}`}</option>
                ))}
              </select>
              <div className="profile-page__socials-edit">
                <p className="profile-page__modal-label">Social Profiles</p>
                <div className="profile-page__social-input">
                  <div className="profile-page__social-input-icon">
                    {platformIcon(socialDraft.platform)}
                  </div>
                  <input
                    className="profile-page__modal-input profile-page__social-platform"
                    list="social-platforms"
                    value={socialDraft.platform}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, platform: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="Platform"
                  />
                  <input
                    className="profile-page__modal-input profile-page__social-handle-input"
                    value={socialDraft.value}
                    onChange={(e) => setSocialDraft((prev) => ({ ...prev, value: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        commitSocialDraft();
                      }
                    }}
                    placeholder="@handle or https://"
                  />
                  <button
                    type="button"
                    className="profile-page__social-add-btn"
                    onClick={commitSocialDraft}
                  >
                    Add
                  </button>
                </div>
                {editDraft.socials.length > 0 && (
                  <ul className="profile-page__socials-list">
                    {editDraft.socials.map((s) => (
                      <li key={s.id} className="profile-page__social-pill">
                        <span className="profile-page__social-icon">{platformIcon(s.platform)}</span>
                        <div className="profile-page__social-text">
                          <span className="profile-page__social-platform-label">{s.platform || 'Social'}</span>
                          <span className="profile-page__social-handle">
                            {(s.handle || s.url) ? `${s.handle || s.url}` : 'Not set'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="profile-page__social-remove profile-page__social-remove--pill"
                          onClick={() => {
                            const next = editDraft.socials.filter((x) => x.id !== s.id);
                            setEditDraft((prev) => ({ ...prev, socials: next }));
                          }}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <button
                  type="button"
                  className="profile-page__social-add"
                  onClick={commitSocialDraft}
                >
                  + Add social profile
                </button>
                <datalist id="social-platforms">
                  <option value="Facebook" />
                  <option value="Instagram" />
                  <option value="TikTok" />
                  <option value="X (Twitter)" />
                  <option value="YouTube" />
                  <option value="LinkedIn" />
                  <option value="Pinterest" />
                  <option value="Threads" />
                </datalist>
              </div>
              {editError && <p className="profile-page__modal-error">{editError}</p>}
                </div>
              </div>
            </div>
            <div className="profile-page__modal-actions">
              <button type="button" className="profile-page__modal-btn profile-page__modal-btn--ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="profile-page__modal-btn profile-page__modal-btn--primary"
                onClick={saveProfile}
                disabled={editSaving || photoUploading}
              >
                {editSaving || photoUploading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
