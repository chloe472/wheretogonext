import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import './DashboardWelcome.css';

export default function DashboardWelcome() {
  return (
    <section className="dashboard__welcome">
      <h1 className="dashboard__title">
        your{' '}
        <span className="dashboard__title-highlight">
          adventures
        </span>{' '}
        await
      </h1>
      <p className="dashboard__greeting">
        Welcome back! Let&apos;s continue planning your perfect trips.
      </p>
      <Link to="/new-trip" className="dashboard__new-trip">
        <Plus size={20} aria-hidden />
        New Trip
      </Link>
    </section>
  );
}
