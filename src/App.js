import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Heatmap from './components/Heatmap';
import PredictionForm from './components/PredictionForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container">
            <a className="navbar-brand" href="/">SolarAI Predictor</a>
            <div className="navbar-nav">
              <a className="nav-link" href="/">Dashboard</a>
              <a className="nav-link" href="/heatmap">Heatmap</a>
              <a className="nav-link" href="/predict">Predict</a>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/predict" element={<PredictionForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;