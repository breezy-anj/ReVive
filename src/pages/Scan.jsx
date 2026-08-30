import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyzeImages } from '../lib/gemini';
import './Scan.css';

function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  // States
  const [step, setStep] = useState('capture'); // capture | loading
  const [images, setImages] = useState([]); // array of { base64, mimeType, dataUrl }

  // User input
  const [userNotes, setUserNotes] = useState('');

  // Error & Moderation
  const [error, setError] = useState(null);
  const [bsAlert, setBsAlert] = useState(null);

  // Removed WebRTC startCamera and stopCamera - using native HTML5 capture instead

  // Helper to resize/compress image before sending to API
  const resizeImage = (dataUrl, maxWidth = 1024) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG for smaller payload
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedDataUrl);
      };
      img.src = dataUrl;
    });
  };

  // Add image to array
  const addImage = (dataUrl, mimeType, base64) => {
    if (images.length >= 4) return;
    setImages(prev => [...prev, { dataUrl, mimeType, base64 }]);
  };



  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    // Calculate how many more we can add
    const slotsLeft = 4 - images.length;
    const filesToProcess = files.slice(0, slotsLeft);
    
    filesToProcess.forEach(file => {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const originalDataUrl = event.target.result;
        const compressedDataUrl = await resizeImage(originalDataUrl);
        
        const mimeType = 'image/jpeg'; // Since we compressed to JPEG
        const base64 = compressedDataUrl.split(',')[1];
        
        addImage(compressedDataUrl, mimeType, base64);
      };
      reader.readAsDataURL(file);
    });
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, [images.length]);

  // Remove image
  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Reset all
  const resetCapture = () => {
    setImages([]);
    setBsAlert(null);
    setError(null);
    setStep('capture');
    setUserNotes('');
    stopCamera();
  };

  // Submit for analysis
  const handleAnalyze = async () => {
    if (images.length === 0) return;
    setStep('loading');
    setError(null);
    setBsAlert(null);
    
    try {
      const result = await analyzeImages(images, userNotes);
      
      if (!result.isProduct) {
        setStep('capture');
        setBsAlert(result.rejectionMessage || "That doesn't look like a product we can help with!");
        return;
      }
      
      // Navigate to results with data
      navigate('/results', { state: { result, imagePreview: images[0].dataUrl } });
    } catch (err) {
      setError(err.message);
      setStep('capture');
    }
  };

  // ============ RENDER ============

  // Loading state
  if (step === 'loading') {
    return (
      <div className="scan page-enter">
        <div className="loading-screen">
          <div className="loading-animation">
            <div className="loading-ring"></div>
            <div className="loading-icon">🤖</div>
          </div>
          <h2>Analyzing your item...</h2>
          <p className="text-muted">ReVive AI is evaluating condition, value, and finding the best paths for your product</p>
          <div className="loading-steps">
            <div className="loading-step active">
              <span className="ls-dot"></span>
              <span>Identifying product</span>
            </div>
            <div className="loading-step active" style={{ animationDelay: '0.5s' }}>
              <span className="ls-dot"></span>
              <span>Estimating value</span>
            </div>
            <div className="loading-step active" style={{ animationDelay: '1s' }}>
              <span className="ls-dot"></span>
              <span>Finding best paths</span>
            </div>
            <div className="loading-step active" style={{ animationDelay: '1.5s' }}>
              <span className="ls-dot"></span>
              <span>Generating recommendations</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Capture / Form step
  return (
    <div className="scan page-enter">
      {/* Header */}
      <div className="scan-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <h3>Scan Your Item</h3>
      </div>

      <p className="scan-subtitle text-muted text-center">
        Add up to 4 photos of the item you want to give a second life
      </p>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="image-grid">
          {images.map((img, idx) => (
            <div key={idx} className="image-thumbnail-wrap">
              <img src={img.dataUrl} alt={`Upload ${idx + 1}`} className="image-thumbnail" />
              <button className="btn-remove-img" onClick={() => removeImage(idx)}>✕</button>
            </div>
          ))}
          {images.length < 4 && (
            <div className="image-thumbnail-add" onClick={() => fileInputRef.current?.click()}>
              <span>+</span>
            </div>
          )}
        </div>
      )}

      {/* Capture Placeholder */}
      {images.length < 4 && (
        <div className="capture-area" style={images.length > 0 ? { minHeight: 'auto', padding: '20px 0' } : {}}>
          {images.length === 0 ? (
            <div className="capture-placeholder">
              <div className="placeholder-icon">📸</div>
              <p>No images added yet</p>
            </div>
          ) : null}
        </div>
      )}

      {/* BS Alert Modal */}
      {bsAlert && (
        <div className="bs-alert-overlay">
          <div className="bs-alert-box">
            <div className="bs-icon">🚫</div>
            <p className="bs-message">{bsAlert}</p>
            <button className="btn btn-primary w-100" onClick={() => setBsAlert(null)}>Got it</button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="scan-controls">
        {error && (
          <div className="error-msg">
            <p style={{ margin: 0 }}>{error}</p>
          </div>
        )}

        {/* User Notes */}
        <div className="notes-section">
          <label className="q-label">📝 Tell us about the age/condition of your product</label>
          <textarea
            className="notes-input"
            placeholder="e.g., 2 years old, screen is cracked, missing charger, moving out next week..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={4}
          />
        </div>

        {images.length < 4 && (
          <div className="capture-actions">
            <label className="btn btn-primary" style={{ cursor: 'pointer' }}>
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                multiple
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <span className="icon">📷</span> Open Camera
            </label>
            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
              <input 
                type="file" 
                accept="image/*" 
                multiple
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                onChange={handleFileUpload} 
              />
              <span className="icon">🖼️</span> Upload from Gallery
            </label>
          </div>
        )}
      </div>

      {/* Analyze Footer */}
      {images.length > 0 && (
        <div className="analyze-footer">
          <button className="btn btn-primary w-100 btn-large" onClick={handleAnalyze}>
            Analyze Item ({images.length}/4) →
          </button>
        </div>
      )}
    </div>
  );
}

export default Scan;
