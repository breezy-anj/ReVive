import { useNavigate } from 'react-router-dom';
import './Landing.css';

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="landing page-enter">
      {/* Hero Section */}
      <div className="landing-hero">
        <div style={{ 
          backgroundColor: 'var(--primary-bg-alt)', 
          color: 'var(--primary-dark)', 
          padding: '4px 10px', 
          borderRadius: '12px', 
          fontSize: '0.75rem', 
          fontWeight: '600', 
          marginBottom: '20px',
          display: 'inline-block',
          border: '1px solid var(--primary-light)'
        }}>
          📱 Mobile Web Prototype
        </div>
        <div className="landing-logo-wrap">
          <div className="landing-logo">
            <img src="/logo.png" alt="ReVive" style={{ width: '64px', height: '64px', borderRadius: '50%' }} />
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
