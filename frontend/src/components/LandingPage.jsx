import {
  ImageIcon,
  Sparkles,
  Wallet,
  Mail,
  Users,
  Shirt,
  Star,
  Zap,
  MapPin,
  Globe,
  ArrowRight,
} from 'lucide-react';
import './LandingPage.css';

const FEATURES = [
  {
    Icon: ImageIcon,
    title: 'Save from Social Media',
    description: 'Turn TikTok and Instagram travel inspo into organised trip plans',
  },
  {
    Icon: Sparkles,
    title: 'AI Trip Assistant',
    description: 'Ask anything—get instant itineraries, restaurant recs, and budget breakdowns tailored to you',
  },
  {
    Icon: Wallet,
    title: 'Group Budget Tracking',
    description: 'Split expenses automatically, no more awkward calculations',
  },
  {
    Icon: Mail,
    title: 'Email Auto-Scan',
    description: 'Automatically capture flight and hotel confirmations',
  },
  {
    Icon: Users,
    title: 'Collaborative Planning',
    description: 'Real-time editing with your travel crew',
  },
  {
    Icon: Shirt,
    title: 'Virtual Wardrobe & Outfit Planner',
    description: 'Visualize outfits and pack smarter with AI-powered suggestions',
  },
];

const STEPS = [
  {
    number: '01',
    Icon: Star,
    title: 'Gather Inspiration',
    description: 'Share links, screenshots, or just chat with friends. We capture it all.',
  },
  {
    number: '02',
    Icon: Zap,
    title: 'Plan Together',
    description: 'Use templates, drag and drop itineraries, and collaborate in real time.',
  },
  {
    number: '03',
    Icon: MapPin,
    title: 'Travel Stress-Free',
    description: 'Access everything offline. track expenses, and enjoy your trip.',
  },
];

export default function LandingPage({ onStartPlanning }) {
  return (
    <div className="landing">
      {/* Hero */}
      <header className="hero">
        <div className="hero__bg" aria-hidden="true" />
        <div className="hero__content">
          <h1 className="hero__title">where to go next?</h1>
          <p className="hero__tagline">
            The only travel planner that turns your messy group chats into organized trips.
          </p>
          <button type="button" className="hero__cta" onClick={onStartPlanning}>
            Start Planning <ArrowRight size={18} className="hero__cta-icon" />
          </button>
        </div>
      </header>

      {/* Features */}
      <section className="features">
        <h2 className="features__title">Everything you need for seamless travel planning</h2>
        <p className="features__subtitle">
          Stop juggling multiple apps and spreadsheets. We bring it all together.
        </p>
        <div className="features__grid">
          {FEATURES.map(({ Icon, title, description }) => (
            <div key={title} className="feature-card">
              <div className="feature-card__icon">
                <Icon size={24} strokeWidth={1.5} aria-hidden />
              </div>
              <h3 className="feature-card__title">{title}</h3>
              <p className="feature-card__desc">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Process */}
      <section className="process">
        <h2 className="process__title">From chaos to clarity</h2>
        <p className="process__subtitle">In just a few clicks</p>
        <div className="process__steps">
          {STEPS.map(({ number, Icon, title, description }) => (
            <div key={number} className="step">
              <div className="step__circle">
                <span className="step__badge">{number}</span>
                <Icon size={28} strokeWidth={1.5} className="step__icon" aria-hidden />
              </div>
              <h3 className="step__title">{title}</h3>
              <p className="step__desc">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <h2 className="cta__title">Ready to plan your next adventure?</h2>
        <p className="cta__subtitle">
          Join thousands of travelers who've simplified their trip planning.
        </p>
        <button type="button" className="cta__btn" onClick={onStartPlanning}>
          Get Started for Free <ArrowRight size={18} className="cta__btn-icon" />
        </button>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__logo">
          <Globe size={20} className="footer__logo-icon" aria-hidden />
          <span>where to go next</span>
        </div>
        <nav className="footer__nav">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#support">Support</a>
          <a href="#contact">Contact</a>
        </nav>
        <p className="footer__copy">© 2026 Where To Go Next. All rights reserved</p>
      </footer>
    </div>
  );
}
