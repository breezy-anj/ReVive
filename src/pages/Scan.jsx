import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { moderateImage, analyzeProduct } from '../lib/gemini';
import './Scan.css';

const CONDITION_OPTIONS = [
  { value: 'Excellent', emoji: '✨', desc: 'Flawless, works perfectly. Like new.' },
  { value: 'Good', emoji: '👍', desc: 'Minor wear, fully functional.' },
  { value: 'Average', emoji: '😐', desc: 'Visible wear, may have minor issues.' },
  { value: 'Poor', emoji: '😟', desc: 'Significant damage or not working.' },
];

const AGE_OPTIONS = [
  'Less than 1 year',
  '1-2 years',
  '2-4 years',
  '4-6 years',
  '6+ years',
  "Don't know",
];

const FUNCTIONAL_OPTIONS = [
  { value: 'Yes', emoji: '✅' },
  { value: 'Partially', emoji: '⚠️' },
  { value: 'No', emoji: '❌' },
];

function Scan() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // States
  const [step, setStep] = useState('capture'); // capture | questions | loading
  const [imageData, setImageData] = useState(null); // base64
  const [imageMimeType, setImageMimeType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState(null); // data URL for display
  const [productInfo, setProductInfo] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // BS Detection
  const [bsAlert, setBsAlert] = useState(null);
  const [moderating, setModerating] = useState(false);

  // Questions
  const [answers, setAnswers] = useState({
    condition: '',
    age: '',
    functional: '',
    accessories: '',
  });
  const [city, setCity] = useState('');
  const [userNotes, setUserNotes] = useState('');

  // Error
  const [error, setError] = useState(null);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError('Camera access denied. Please use the upload option instead.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Capture from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    const base64 = dataUrl.split(',')[1];
    setImagePreview(dataUrl);
    setImageMimeType('image/jpeg');
    setImageData(base64);
    stopCamera();
    handleModeration(base64, 'image/jpeg');
  }, [stopCamera]);

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

  // Handle file upload
  const handleFileUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalDataUrl = event.target.result;
      const compressedDataUrl = await resizeImage(originalDataUrl);
      
      const mimeType = 'image/jpeg'; // Since we compressed to JPEG
      const base64 = compressedDataUrl.split(',')[1];
      
      setImagePreview(compressedDataUrl);
      setImageMimeType(mimeType);
      setImageData(base64);
      handleModeration(base64, mimeType);
    };
    reader.readAsDataURL(file);
  }, []);

  // BS Detection / Moderation
  const handleModeration = async (base64, mimeType) => {
    setModerating(true);
    setBsAlert(null);
    setError(null);
    try {
      const result = await moderateImage(base64, mimeType);
      if (result.isProduct) {
        setProductInfo(result);
        setStep('questions');
      } else {
        setBsAlert(result.rejectionMessage || "That doesn't look like a product we can help with!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setModerating(false);
    }
  };

  // Reset to capture
  const resetCapture = () => {
    setImageData(null);
    setImagePreview(null);
    setProductInfo(null);
    setBsAlert(null);
    setError(null);
    setStep('capture');
    setAnswers({ condition: '', age: '', functional: '', accessories: '' });
    setUserNotes('');
  };

  // Submit for analysis
  const handleAnalyze = async () => {
    if (!answers.condition || !answers.age || !answers.functional) return;
    setStep('loading');
    try {
      const result = await analyzeProduct(imageData, imageMimeType, productInfo, answers, city, userNotes);
      // Navigate to results with data
      navigate('/results', { state: { result, imagePreview } });
    } catch (err) {
      setError(err.message);
      setStep('questions');
    }
  };

  const questionsComplete = answers.condition && answers.age && answers.functional;

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

  // Questions step
  if (step === 'questions') {
    return (
      <div className="scan page-enter">
        {/* Header */}
        <div className="scan-header">
          <button className="btn-back" onClick={resetCapture}>← Back</button>
          <h3>Tell us about your item</h3>
        </div>

        {/* Product detected card */}
        <div className="detected-card">
          <img src={imagePreview} alt="Captured" className="detected-img" />
          <div className="detected-info">
            <div className="tag tag-eco">✅ Product Detected</div>
            <h4>{productInfo?.productName || 'Unknown Product'}</h4>
            <span className="text-muted" style={{ fontSize: '0.8rem' }}>{productInfo?.category}</span>
          </div>
        </div>

        {/* City input */}
        <div className="question-section">
          <label className="q-label">📍 Your city or area</label>
          <input
            type="text"
            className="city-input"
            placeholder="e.g., Delhi, Mumbai, Bangalore..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>

        {/* Condition */}
        <div className="question-section">
          <label className="q-label">How would you describe the condition?</label>
          <div className="condition-grid">
            {CONDITION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`condition-card ${answers.condition === opt.value ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, condition: opt.value }))}
              >
                <span className="cc-emoji">{opt.emoji}</span>
                <span className="cc-label">{opt.value}</span>
                <span className="cc-desc">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Age */}
        <div className="question-section">
          <label className="q-label">How old is it?</label>
          <div className="age-grid">
            {AGE_OPTIONS.map((opt) => (
              <button
                key={opt}
                className={`age-pill ${answers.age === opt ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, age: opt }))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Functional */}
        <div className="question-section">
          <label className="q-label">Does it still work?</label>
          <div className="functional-grid">
            {FUNCTIONAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`functional-card ${answers.functional === opt.value ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, functional: opt.value }))}
              >
                <span style={{ fontSize: '1.3rem' }}>{opt.emoji}</span>
                <span className="fc-label">{opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accessories */}
        <div className="question-section">
          <label className="q-label">Any accessories included? (charger, box, etc.)</label>
          <div className="functional-grid">
            <button
              className={`functional-card ${answers.accessories === 'Yes' ? 'selected' : ''}`}
              onClick={() => setAnswers(prev => ({ ...prev, accessories: 'Yes' }))}
            >
              <span style={{ fontSize: '1.3rem' }}>📦</span>
              <span className="fc-label">Yes</span>
            </button>
            <button
              className={`functional-card ${answers.accessories === 'No' ? 'selected' : ''}`}
              onClick={() => setAnswers(prev => ({ ...prev, accessories: 'No' }))}
            >
              <span style={{ fontSize: '1.3rem' }}>🚫</span>
              <span className="fc-label">No</span>
            </button>
          </div>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {/* Analyze button */}
        <div className="scan-actions" style={{ paddingBottom: '32px' }}>
          <button
            className="btn btn-primary btn-full btn-lg"
            disabled={!questionsComplete}
            onClick={handleAnalyze}
          >
            Analyze →
          </button>
        </div>
      </div>
    );
  }

  // ============ CAPTURE STEP ============
  return (
    <div className="scan page-enter">
      {/* Header */}
      <div className="scan-header">
        <button className="btn-back" onClick={() => navigate('/')}>← Back</button>
        <h3>Scan Your Item</h3>
      </div>

      <p className="scan-subtitle text-muted text-center">
        Take a photo or upload an image of the item you want to give a second life
      </p>

      {/* Camera or Preview */}
      <div className="capture-area">
        {imagePreview ? (
          <div className="preview-wrap">
            <img src={imagePreview} alt="Preview" className="preview-img" />
            {moderating && (
              <div className="moderating-overlay">
                <div className="moderating-spinner"></div>
                <span>Checking image...</span>
              </div>
            )}
          </div>
        ) : cameraActive ? (
          <div className="camera-wrap">
            <video ref={videoRef} autoPlay playsInline muted className="camera-feed" />
            <div className="camera-overlay">
              <div className="scan-frame">
                <div className="frame-corner tl"></div>
                <div className="frame-corner tr"></div>
                <div className="frame-corner bl"></div>
                <div className="frame-corner br"></div>
              </div>
            </div>
            <button className="capture-btn" onClick={capturePhoto}>
              <div className="capture-btn-inner"></div>
            </button>
          </div>
        ) : (
          <div className="capture-placeholder">
            <div className="placeholder-icon">📸</div>
            <p>No image captured yet</p>
          </div>
        )}
      </div>

      {/* User notes — visible after image captured but before moderation completes, or anytime in capture */}
      {!cameraActive && (
        <div className="notes-section">
          <label className="q-label">📝 Tell us more (optional)</label>
          <textarea
            className="notes-input"
            placeholder="e.g., Screen is cracked, battery drains fast, want to sell urgently, missing charger..."
            value={userNotes}
            onChange={(e) => setUserNotes(e.target.value)}
            rows={3}
          />
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* BS Alert Modal */}
      {bsAlert && (
        <div className="bs-modal-backdrop" onClick={() => setBsAlert(null)}>
          <div className="bs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bs-icon">🚫</div>
            <h3>Oops! That's not a product</h3>
            <p>{bsAlert}</p>
            <button className="btn btn-primary btn-full" onClick={resetCapture}>
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="error-msg">
          {error}
          <button className="btn btn-ghost" onClick={resetCapture}>Try Again</button>
        </div>
      )}

      {/* Action buttons */}
      {!imagePreview && !moderating && (
        <div className="capture-actions">
          {!cameraActive ? (
            <>
              <button className="btn btn-primary btn-full" onClick={startCamera}>
                📸 Open Camera
              </button>
              <button
                className="btn btn-secondary btn-full"
                onClick={() => fileInputRef.current?.click()}
              >
                🖼️ Upload from Gallery
              </button>
            </>
          ) : (
            <button className="btn btn-secondary btn-full" onClick={stopCamera}>
              ✕ Close Camera
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Camera error */}
      {cameraError && (
        <div className="camera-error">
          <p>{cameraError}</p>
          <button
            className="btn btn-secondary btn-full"
            onClick={() => fileInputRef.current?.click()}
          >
            🖼️ Upload from Gallery Instead
          </button>
        </div>
      )}
    </div>
  );
}

export default Scan;
