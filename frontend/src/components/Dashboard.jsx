import { useState } from 'react';
import {
  Bell,
  User,
  Calendar,
  MapPin,
  Bookmark,
  Banknote,
  Users,
  Plus,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react';
import './Dashboard.css';

const MOCK_TRIPS = [
  {
    id: '1',
    title: 'Summer Europe Adventure',
    dates: 'Jun 15 - Jul 2, 2026',
    locations: 'Paris, Rome, Barcelona',
    placesSaved: 47,
    budget: '$3.2k',
    travelers: 4,
    status: 'Planning',
    statusClass: 'trip-card__status--planning',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=400&h=240&fit=crop',
  },
  {
    id: '2',
    title: 'Tokyo Spring Cherry Blossoms',
    dates: 'Mar 20 - Apr 5, 2027',
    locations: 'Tokyo, Kyoto, Osaka',
    placesSaved: 23,
    budget: '$4.5k',
    travelers: 2,
    status: 'Upcoming',
    statusClass: 'trip-card__status--upcoming',
    image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=240&fit=crop',
  },
  {
    id: '3',
    title: 'Bali Wellness Retreat',
    dates: 'Aug 10 - Aug 24, 2026',
    locations: 'Ubud, Seminyak, Canggu',
    placesSaved: 15,
    budget: '$2.8k',
    travelers: 1,
    status: 'Dreaming',
    statusClass: 'trip-card__status--dreaming',
    image: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=400&h=240&fit=crop',
  },
];

const MOCK_COMING_UP = [
  { id: '1', name: 'Summer Europe', day: 15, month: 'JUN', label: 'Departure in 4 months' },
  { id: '3', name: 'Bali Wellness', day: 10, month: 'AUG', label: 'Departure in 6 months' },
];

const MOCK_ACTIVITY = [
  { id: '1', text: 'Sarah added 3 restaurants to Summer Europe', time: '2 hours ago' },
  { id: '2', text: 'Flight confirmation received for Tokyo trip', time: '5 hours ago' },
  { id: '3', text: 'Mike updated the budget for Bali Retreat', time: '1 day ago' },
  { id: '4', text: 'New template created: Beach Essentials', time: '2 days ago' },
];

const TRIP_FILTERS = ['All', 'Upcoming', 'Past'];

export default function Dashboard({ user, onLogout }) {
  const [tripFilter, setTripFilter] = useState('All');
  const [profileOpen, setProfileOpen] = useState(false);

  const filteredTrips =
    tripFilter === 'All'
      ? MOCK_TRIPS
      : MOCK_TRIPS.filter((t) => t.status.toLowerCase() === tripFilter.toLowerCase());

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo" aria-hidden>
            @
          </div>
          <div>
            <span className="dashboard__app-name">where to go next</span>
            <span className="dashboard__tagline">Your travel companion</span>
          </div>
        </div>
        <nav className="dashboard__nav">
          <a href="#my-trips" className="dashboard__nav-link">My Trips</a>
          <a href="#wardrobe" className="dashboard__nav-link">Wardrobe</a>
          <button type="button" className="dashboard__icon-btn" aria-label="Notifications">
            <Bell size={20} aria-hidden />
          </button>
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
                  <button type="button" className="dashboard__profile-logout" onClick={() => { setProfileOpen(false); onLogout?.(); }}>
                    Log out
                  </button>
                </div>
              </>
            )}
          </div>
        </nav>
      </header>

      <div className="dashboard__body">
        <main className="dashboard__main">
          <section className="dashboard__welcome">
            <h1 className="dashboard__title">your adventures await</h1>
            <p className="dashboard__greeting">
              Welcome back! Let&apos;s continue planning your perfect trips.
            </p>
            <button type="button" className="dashboard__new-trip">
              <Plus size={20} aria-hidden />
              New Trip
            </button>
          </section>

          <section className="dashboard__trips">
            <h2 className="dashboard__section-title">Your Trips</h2>
            <div className="dashboard__filters">
              {TRIP_FILTERS.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`dashboard__filter ${tripFilter === filter ? 'dashboard__filter--active' : ''}`}
                  onClick={() => setTripFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <ul className="dashboard__trip-list">
              {filteredTrips.map((trip) => (
                <li key={trip.id} className="trip-card">
                  <div className="trip-card__image-wrap">
                    <img
                      src={trip.image}
                      alt=""
                      className="trip-card__image"
                    />
                    <span className={`trip-card__status ${trip.statusClass}`}>{trip.status}</span>
                  </div>
                  <div className="trip-card__content">
                    <h3 className="trip-card__title">{trip.title}</h3>
                    <p className="trip-card__meta">
                      <Calendar size={16} className="trip-card__meta-icon" aria-hidden />
                      {trip.dates}
                    </p>
                    <p className="trip-card__meta">
                      <MapPin size={16} className="trip-card__meta-icon" aria-hidden />
                      {trip.locations}
                    </p>
                    <div className="trip-card__stats">
                      <span className="trip-card__stat">
                        <Bookmark size={16} aria-hidden />
                        <strong>{trip.placesSaved}</strong> Places Saved
                      </span>
                      <span className="trip-card__stat">
                        <Banknote size={16} aria-hidden />
                        <strong>{trip.budget}</strong> Budget
                      </span>
                      <span className="trip-card__stat">
                        <Users size={16} aria-hidden />
                        <strong>{trip.travelers}</strong> Travelers
                      </span>
                    </div>
                    <a href={`#trip-${trip.id}`} className="trip-card__link">
                      View Trip Details <ChevronRight size={16} aria-hidden />
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </main>

        <aside className="dashboard__sidebar">
          <section className="sidebar-block">
            <h3 className="sidebar-block__title">
              <Clock size={18} aria-hidden />
              Coming Up
            </h3>
            <ul className="sidebar-block__list">
              {MOCK_COMING_UP.map((item) => (
                <li key={item.id} className="coming-up-item">
                  <div className="coming-up-item__date">
                    <span className="coming-up-item__day">{item.day}</span>
                    <span className="coming-up-item__month">{item.month}</span>
                  </div>
                  <div className="coming-up-item__info">
                    <span className="coming-up-item__name">{item.name}</span>
                    <span className="coming-up-item__label">{item.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
          <section className="sidebar-block">
            <h3 className="sidebar-block__title">
              <FileText size={18} aria-hidden />
              Recent Activity
            </h3>
            <ul className="sidebar-block__list">
              {MOCK_ACTIVITY.map((item) => (
                <li key={item.id} className="activity-item">
                  <span className="activity-item__text">{item.text}</span>
                  <span className="activity-item__time">{item.time}</span>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
