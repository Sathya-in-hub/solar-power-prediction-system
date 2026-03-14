import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Predictor from './pages/Predictor';
import ROICalculator from './pages/ROICalculator';
import Schemes from './pages/Schemes';
import HeatMap from './pages/HeatMap';
import History from './pages/History';
import './App.css';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: '◈' },
  { to: '/predict', label: 'Predict', icon: '◎' },
  { to: '/heatmap', label: 'Heat Map', icon: '◉' },
  { to: '/roi', label: 'ROI Calc', icon: '◇' },
  { to: '/schemes', label: 'Schemes', icon: '◆' },
  { to: '/history', label: 'History', icon: '◐' },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="logo-orb">
          <svg viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="8" fill="#f59e0b" />
            {[0,45,90,135,180,225,270,315].map((deg, i) => (
              <line key={i}
                x1={20 + 11 * Math.cos(deg * Math.PI / 180)}
                y1={20 + 11 * Math.sin(deg * Math.PI / 180)}
                x2={20 + 17 * Math.cos(deg * Math.PI / 180)}
                y2={20 + 17 * Math.sin(deg * Math.PI / 180)}
                stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
        {!collapsed && (
          <div className="logo-text">
            <span className="logo-name">SolarAI</span>
            <span className="logo-sub">India Intelligence</span>
          </div>
        )}
        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '›' : '‹'}
        </button>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            {!collapsed && <span className="nav-label">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && (
          <div className="status-badge">
            <span className="status-dot"></span>
            <span>NASA POWER Live</span>
          </div>
        )}
      </div>
    </aside>
  );
}

function AppInner() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/predict" element={<Predictor />} />
          <Route path="/heatmap" element={<HeatMap />} />
          <Route path="/roi" element={<ROICalculator />} />
          <Route path="/schemes" element={<Schemes />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
      <Toaster position="top-right" toastOptions={{
        style: { background: '#1a1a26', color: '#f8fafc', border: '1px solid #ffffff0f', fontFamily: 'DM Sans' },
        success: { iconTheme: { primary: '#f59e0b', secondary: '#050508' } },
      }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
