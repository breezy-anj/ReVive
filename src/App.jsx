import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Scan from './pages/Scan';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="desktop-notice">
        <h3>📱 Mobile Prototype</h3>
        <p>This is a mobile-first prototype. Please view on a mobile device or use your browser's responsive design mode for the best experience.</p>
      </div>
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
