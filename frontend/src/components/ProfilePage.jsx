import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Share2 } from 'lucide-react';
import './ProfilePage.css';

export default function ProfilePage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview');

  const displayName = user?.name || 'Traveler';
  const handle = user?.handle || (user?.email ? `@${user.email.split('@')[0]}` : '@traveler');
  const picture = user?.picture;
  const friendsList = []; // Replace with API when backend has profile/friends

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
                <button type="button" className="profile-page__btn profile-page__btn--primary">
                  <Pencil size={16} aria-hidden />
                  <span>Edit profile</span>
                </button>
                <button type="button" className="profile-page__btn">
                  <Share2 size={16} aria-hidden />
                  <span>Share</span>
                </button>
              </div>
            </header>

            <section className="profile-page__stats">
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">0</span>
                <span className="profile-page__stat-label">Countries</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">0</span>
                <span className="profile-page__stat-label">Trips</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-number">{friendsList.length}</span>
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
                My Trips
              </button>
              <button
                type="button"
                className={`profile-page__tab ${activeTab === 'friends' ? 'profile-page__tab--active' : ''}`}
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </button>
            </nav>

            <section className="profile-page__content">
              {activeTab === 'overview' && (
                <>
                  <h2 className="profile-page__section-title">My World Map</h2>
                  <div className="profile-page__map-card">
                    <span className="profile-page__map-pin profile-page__map-pin--one" />
                    <span className="profile-page__map-pin profile-page__map-pin--two" />
                    <span className="profile-page__map-pin profile-page__map-pin--three" />
                  </div>
                </>
              )}
              {activeTab === 'trips' && (
                <>
                  <h2 className="profile-page__section-title">My Trips</h2>
                  <p className="profile-page__empty">Trips list coming soon.</p>
                </>
              )}
              {activeTab === 'friends' && (
                <>
                  <h2 className="profile-page__section-title">Friends</h2>
                  {friendsList.length === 0 ? (
                    <p className="profile-page__empty">No friends yet.</p>
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
                              <span className="profile-page__friend-handle">{friend.handle || ''}</span>
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
    </div>
  );
}
