import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chatWithAI, revisePlan } from '../lib/gemini';
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
  
  const [currentResult, setCurrentResult] = useState(result || null);
  const [expandedId, setExpandedId] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatting) return;

    const newMessage = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: newMessage }]);
    setIsChatting(true);

    try {
      const reply = await chatWithAI(currentResult, messages, newMessage);
      setMessages(prev => [...prev, { role: 'model', content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsChatting(false);
    }
  };

  const handleRevisePlan = async () => {
    if (isRevising || messages.length === 0) return;
    setIsRevising(true);
    
    try {
      const updatedResult = await revisePlan(currentResult, messages);
      
      // Validate that Gemini actually returned the correct JSON structure
      if (!updatedResult || !updatedResult.product || !Array.isArray(updatedResult.paths)) {
        throw new Error("Invalid response format from AI");
      }
      
      setCurrentResult(updatedResult);
      setMessages(prev => [...prev, { role: 'model', content: 'I have updated your ReVive plan above based on our conversation! 🔄' }]);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error("Revise plan error:", err);
      setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I got a little confused trying to update the plan. Could you try pressing the button again?' }]);
    } finally {
      setIsRevising(false);
    }
  };

  if (!currentResult) {
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

  const product = currentResult.product || {};
  const paths = currentResult.paths || [];
  const aiNote = currentResult.aiNote || '';
  
  const recommendedPath = paths.find(p => p.isRecommended) || paths[0];
  const otherPaths = paths.filter(p => p !== recommendedPath);

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

      {/* AI Chat Section */}
      <div className="section chat-section">
        <h4 className="section-title">💬 Chat with ReVive AI</h4>
        <div className="chat-container">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <p>Have questions about these recommendations? Ask me!</p>
            </div>
          ) : (
            <div className="chat-messages">
              {messages.map((msg, idx) => (
                <div key={idx} className={`chat-bubble ${msg.role}`}>
                  {msg.content}
                </div>
              ))}
              {isChatting && (
                <div className="chat-bubble model typing">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          <div className="chat-input-area">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="e.g., Where exactly can I sell this?"
              disabled={isChatting || isRevising}
            />
            <button onClick={handleSendMessage} disabled={isChatting || isRevising || !chatInput.trim()}>
              Send
            </button>
          </div>
          {messages.length > 0 && (
            <div className="chat-actions">
              <button 
                className="btn-revise-plan" 
                onClick={handleRevisePlan}
                disabled={isRevising || isChatting}
              >
                {isRevising ? '🔄 Revising Plan...' : '🔄 Revise Plan based on this chat'}
              </button>
            </div>
          )}
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
