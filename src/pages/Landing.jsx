import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing page-enter">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-logo-wrap">
          <div className="landing-logo">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="30" stroke="#0A6847" strokeWidth="3" fill="#d1f2e0" />
              <path d="M42 26C42 26 38 22 32 22C26 22 22 26 22 32C22 38 26 42 32 42" stroke="#0A6847" strokeWidth="3" strokeLinecap="round" />
              <path d="M42 32C42 26 38 22 32 22" stroke="#0A6847" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
              <path d="M38 20L42 26L48 24" stroke="#0A6847" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M32 42L32 36" stroke="#0A6847" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M29 39L32 42L35 39" stroke="#0A6847" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="landing-title">
            Re<span className="text-primary">Vive</span>
          </h1>
        </div>

        <div className="landing-badge">♻️ CIRCULAR LIVING</div>

        <h2 className="landing-headline">
          Give your stuff a <span className="text-primary">better</span> next life.
        </h2>
        <p className="landing-subtitle">
          Scan any item you no longer need. AI will find its best second life — sell it, fix it, repurpose it, or give it away.
        </p>
      </div>

      {/* Trust indicators */}
      <div className="landing-trust">
        <div className="trust-item">
          <span className="trust-icon">🔒</span>
          <span>No Login Required</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">🌍</span>
          <span>Eco-Friendly</span>
        </div>
        <div className="trust-item">
          <span className="trust-icon">⚡</span>
          <span>AI-Powered</span>
        </div>
      </div>

      {/* CTA */}
      <div className="landing-cta">
        <button 
          className="btn btn-primary btn-full btn-lg" 
          onClick={() => navigate('/scan')}
        >
          Scan Now →
        </button>
      </div>

      {/* How it works */}
      <div className="landing-how">
        <h4 className="text-muted text-center" style={{ marginBottom: '16px', fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          How It Works
        </h4>
        <div className="how-steps">
          <div className="how-step">
            <div className="step-icon">📸</div>
            <div className="step-label">Scan</div>
            <div className="step-desc">Take a photo of any item</div>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="step-icon">🤖</div>
            <div className="step-label">Analyze</div>
            <div className="step-desc">AI evaluates condition & value</div>
          </div>
          <div className="how-arrow">→</div>
          <div className="how-step">
            <div className="step-icon">🎯</div>
            <div className="step-label">Decide</div>
            <div className="step-desc">Get multiple paths to choose from</div>
          </div>
        </div>
      </div>

      {/* Supported categories */}
      <div className="landing-categories">
        <div className="cat-pill">📱 Electronics</div>
        <div className="cat-pill">🪑 Furniture</div>
        <div className="cat-pill">🏠 Appliances</div>
        <div className="cat-pill">👟 Sports</div>
        <div className="cat-pill">📚 Books</div>
        <div className="cat-pill">🍶 Kitchenware</div>
        <div className="cat-pill">🎸 Instruments</div>
        <div className="cat-pill">👕 Clothing</div>
        <div className="cat-pill">🧸 Toys</div>
        <div className="cat-pill">🔧 Tools</div>
      </div>
    </div>
  );
}

export default Landing;
