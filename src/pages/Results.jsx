import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Results.css';

const TAG_CLASS_MAP = {
  'BEST VALUE': 'tag-best-value',
  'ECO-FRIENDLY': 'tag-eco',
  'CREATIVE': 'tag-creative',
  'QUICK & EASY': 'tag-quick',
  'HIGH IMPACT': 'tag-impact',
  'RECOMMENDED': 'tag-recommended',
};

function getConditionClass(score) {
  if (score >= 75) return 'condition-excellent';
  if (score >= 50) return 'condition-good';
  if (score >= 25) return 'condition-average';
  return 'condition-poor';
}

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { result, imagePreview } = location.state || {};
  const [expandedId, setExpandedId] = useState(null);

  if (!result) {
    return (
      <div className="results page-enter" style={{ padding: '20px', textAlign: 'center', paddingTop: '100px' }}>
        <h2>No results found</h2>
        <p className="text-muted mt-2">Please scan an item first.</p>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/scan')}>
          Go to Scan →
        </button>
      </div>
    );
  }

  const { product, paths, aiNote } = result;
  const recommendedPath = paths.find(p => p.isRecommended);
  const otherPaths = paths.filter(p => !p.isRecommended);

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="results page-enter">
      {/* Header */}
      <div className="results-header">
        <div className="rh-top">
          <button className="btn-back" onClick={() => navigate('/scan')}>← Back</button>
          <span className="rh-title">ReVive</span>
          <span></span>
        </div>
        <h2 className="rh-headline">AI Analysis Complete</h2>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Here's your optimal ReVive strategy based on current market trends and condition analysis.
        </p>
      </div>

      {/* Product Summary Card */}
      <div className="product-card">
        <div className="pc-top">
          {imagePreview && <img src={imagePreview} alt={product.name} className="pc-img" />}
          <div className="pc-info">
            <h3>{product.name}</h3>
            <span className="pc-category">{product.category}</span>
            <div className="pc-value">{product.estimatedValueRange}</div>
          </div>
        </div>
        <div className="pc-condition">
          <div className="pc-condition-header">
            <span className="pc-condition-label">Condition</span>
            <span className="pc-condition-value">{product.conditionLabel} — {product.conditionScore}%</span>
          </div>
          <div className="condition-meter">
            <div
              className={`condition-meter-fill ${getConditionClass(product.conditionScore)}`}
              style={{ width: `${product.conditionScore}%` }}
            />
          </div>
        </div>
        {product.summary && <p className="pc-summary">{product.summary}</p>}
      </div>

      {/* AI Note */}
      {aiNote && (
        <div className="ai-note">
          <span className="ai-note-icon">🤖</span>
          <p>{aiNote}</p>
        </div>
      )}

      {/* Top Recommendation */}
      {recommendedPath && (
        <div className="section">
          <h4 className="section-title">🎯 Top Recommendation</h4>
          <div className="path-card recommended" onClick={() => toggleExpand(recommendedPath.id)}>
            <div className="pc-header">
              <div className="pc-left">
                <span className="path-icon">{recommendedPath.icon}</span>
                <div>
                  <h4 className="path-title">{recommendedPath.title}</h4>
                  {recommendedPath.subtitle && (
                    <span className="path-subtitle">{recommendedPath.subtitle}</span>
                  )}
                </div>
              </div>
              <div className="pc-right">
                <span className="tag tag-recommended">★ RECOMMENDED</span>
              </div>
            </div>
            <div className="path-meta">
              <span className="meta-item">
                <span className="meta-label">Value:</span> {recommendedPath.valueOrCost}
              </span>
              <span className="meta-item">
                <span className="meta-label">Difficulty:</span> {recommendedPath.difficulty}
              </span>
              <span className="meta-item">
                <span className="meta-label">Time:</span> {recommendedPath.timeEstimate}
              </span>
            </div>
            <p className="path-reasoning">{recommendedPath.reasoning}</p>

            {expandedId === recommendedPath.id && (
              <div className="path-expanded">
                <div className="path-steps">
                  <h5>How to do it:</h5>
                  <ol>
                    {recommendedPath.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
                {recommendedPath.environmentalImpact && (
                  <div className="path-env">
                    🌍 {recommendedPath.environmentalImpact}
                  </div>
                )}
              </div>
            )}
            <span className="expand-hint">
              {expandedId === recommendedPath.id ? 'Tap to collapse ▲' : 'Tap for detailed steps ▼'}
            </span>
          </div>
        </div>
      )}

      {/* All Other Paths */}
      <div className="section">
        <h4 className="section-title">📋 All Options</h4>
        <div className="paths-list">
          {otherPaths.map((path) => (
            <div
              key={path.id}
              className="path-card"
              onClick={() => toggleExpand(path.id)}
            >
              <div className="pc-header">
                <div className="pc-left">
                  <span className="path-icon">{path.icon}</span>
                  <div>
                    <h4 className="path-title">{path.title}</h4>
                    {path.subtitle && (
                      <span className="path-subtitle">{path.subtitle}</span>
                    )}
                  </div>
                </div>
                <div className="pc-right">
                  {path.tag && (
                    <span className={`tag ${TAG_CLASS_MAP[path.tag] || 'tag-eco'}`}>
                      {path.tag}
                    </span>
                  )}
                </div>
              </div>

              <div className="path-meta">
                <span className="meta-item">
                  <span className="meta-label">Value:</span> {path.valueOrCost}
                </span>
                <span className="meta-item">
                  <span className="meta-label">Difficulty:</span> {path.difficulty}
                </span>
              </div>

              <p className="path-reasoning">{path.reasoning}</p>

              {expandedId === path.id && (
                <div className="path-expanded">
                  <div className="path-steps">
                    <h5>How to do it:</h5>
                    <ol>
                      {path.steps.map((step, i) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                  </div>
                  {path.environmentalImpact && (
                    <div className="path-env">
                      🌍 {path.environmentalImpact}
                    </div>
                  )}
                </div>
              )}
              <span className="expand-hint">
                {expandedId === path.id ? 'Tap to collapse ▲' : 'Tap for details ▼'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Scan Another */}
      <div className="results-footer">
        <button className="btn btn-primary btn-full btn-lg" onClick={() => navigate('/scan')}>
          🔄 Scan Another Item
        </button>
        <button className="btn btn-ghost btn-full" onClick={() => navigate('/')}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
}

export default Results;
