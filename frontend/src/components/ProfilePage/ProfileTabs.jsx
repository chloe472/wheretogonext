export default function ProfileTabs({ activeTab, onChange, isSelf }) {
  return (
    <nav className="profile-page__tabs" aria-label="Profile sections">
      <button
        type="button"
        className={`profile-page__tab ${activeTab === 'overview' ? 'profile-page__tab--active' : ''}`}
        onClick={() => onChange('overview')}
      >
        Overview & Map
      </button>
      <button
        type="button"
        className={`profile-page__tab ${activeTab === 'trips' ? 'profile-page__tab--active' : ''}`}
        onClick={() => onChange('trips')}
      >
        {isSelf ? 'My Trips' : 'Trips'}
      </button>
      <button
        type="button"
        className={`profile-page__tab ${activeTab === 'friends' ? 'profile-page__tab--active' : ''}`}
        onClick={() => onChange('friends')}
      >
        {isSelf ? 'My Friends' : 'Friends'}
      </button>
    </nav>
  );
}
