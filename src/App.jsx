import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Scan from './pages/Scan';
import Results from './pages/Results';
import './App.css';

function App() {
  return (
    <BrowserRouter>
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
