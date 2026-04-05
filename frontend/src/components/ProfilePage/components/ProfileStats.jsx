export default function ProfileStats({ stats }) {
  return (
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
  );
}
