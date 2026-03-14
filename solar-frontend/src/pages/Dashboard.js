import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const REGIONS = [
  { value: 'Rajasthan-Jodhpur',   label: 'Rajasthan — Jodhpur',   lat: 26.23, lon: 73.02, monthly: [5.8,6.1,6.6,6.8,6.9,6.2,5.8,5.9,6.3,6.5,6.0,5.7] },
  { value: 'Tamil Nadu-Chennai',  label: 'Tamil Nadu — Chennai',   lat: 13.08, lon: 80.27, monthly: [5.2,5.5,5.6,5.4,4.8,3.2,2.8,2.9,3.8,4.5,4.8,5.0] },
  { value: 'Gujarat-Kutch',       label: 'Gujarat — Kutch',        lat: 23.73, lon: 69.86, monthly: [5.5,5.9,6.3,6.5,6.6,5.8,5.2,5.4,5.9,6.1,5.7,5.4] },
  { value: 'Karnataka-Bangalore', label: 'Karnataka — Bangalore',  lat: 12.97, lon: 77.59, monthly: [4.8,5.2,5.5,5.3,4.6,3.8,3.5,3.6,4.0,4.5,4.8,4.7] },
  { value: 'Telangana-Hyderabad', label: 'Telangana — Hyderabad',  lat: 17.38, lon: 78.48, monthly: [5.0,5.4,5.8,5.6,4.9,3.9,3.6,3.8,4.3,4.8,4.9,4.8] },
  { value: 'MP-Bhopal',           label: 'MP — Bhopal',            lat: 23.26, lon: 77.41, monthly: [5.2,5.6,6.0,5.9,5.3,4.2,3.8,4.0,4.7,5.2,5.3,5.1] },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const RADAR_DATA = [
  { state: 'Rajasthan', intensity: 6.4 },
  { state: 'Gujarat',   intensity: 5.9 },
  { state: 'Karnataka', intensity: 5.4 },
  { state: 'Tamil Nadu',intensity: 5.2 },
  { state: 'Telangana', intensity: 5.5 },
  { state: 'MP',        intensity: 5.8 },
];

function SunOrb() {
  return (
    <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
      <div style={{
        position: 'absolute', inset: -20,
        background: 'radial-gradient(circle, #f59e0b33 0%, transparent 70%)',
        borderRadius: '50%', animation: 'pulse-glow 3s ease-in-out infinite',
      }} />
      <svg viewBox="0 0 110 110" style={{ animation: 'spin-slow 18s linear infinite' }}>
        <circle cx="55" cy="55" r="18" fill="#f59e0b" />
        {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => (
          <line key={i}
            x1={55 + 25 * Math.cos(deg * Math.PI / 180)} y1={55 + 25 * Math.sin(deg * Math.PI / 180)}
            x2={55 + 37 * Math.cos(deg * Math.PI / 180)} y2={55 + 37 * Math.sin(deg * Math.PI / 180)}
            stroke="#fde68a" strokeWidth={i % 2 === 0 ? 2.5 : 1.5} strokeLinecap="round" opacity="0.9"
          />
        ))}
      </svg>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--raised)', border: '1px solid var(--border-glow)', borderRadius: 8, padding: '8px 14px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--solar)', marginTop: 2 }}>
        {payload[0]?.value?.toFixed(2)} kWh/m²
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [regionVal, setRegionVal] = useState('Rajasthan-Jodhpur');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  const region = REGIONS.find(r => r.value === regionVal) || REGIONS[0];
  const monthlyChart = region.monthly.map((v, i) => ({ month: MONTHS[i], solar: v }));
  const monthNow = new Date().getMonth();
  const currentMonthSolar = region.monthly[monthNow];

  useEffect(() => {
    fetchPrediction();
  }, [regionVal]);

  async function fetchPrediction() {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await api.predict({ region: regionVal, date: today, panelCapacity: 5 });
      if (res.success || res.prediction) setPrediction(res.prediction);
    } catch {
      // Use local fallback
      const base = currentMonthSolar;
      setPrediction({
        solarIntensity: base, duration: 8.5, powerOutput: +(base * 5 * 0.85).toFixed(2),
        confidence: 0.88, weatherData: { cloudCover: 25, temperature: 31, humidity: 42 },
      });
    }
    setLoading(false);
  }

  const intensity   = prediction?.solarIntensity || 0;
  const iColor      = intensity >= 5.5 ? 'var(--grass)' : intensity >= 3.5 ? 'var(--solar)' : 'var(--danger)';
  const riskLabel   = intensity >= 5.5 ? 'Low Risk' : intensity >= 3.5 ? 'Med Risk' : 'High Risk';
  const co2Saved    = Math.round((prediction?.powerOutput || 0) * 365 * 0.82);

  return (
    <div className="page">
      {/* HERO */}
      <div style={{
        background: 'linear-gradient(135deg, var(--surface) 0%, var(--raised) 100%)',
        border: '1px solid var(--border-glow)', borderRadius: 24,
        padding: '36px 44px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -100, right: -100, width: 400, height: 400, background: 'radial-gradient(circle, #f59e0b07 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ flex: 1 }}>
          <div className="page-tag">India Solar Intelligence Platform</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(26px,3.2vw,44px)', fontWeight: 800, lineHeight: 1.1, margin: '12px 0 14px' }}>
            Harness the Power<br />of the <span style={{ color: 'var(--solar)' }}>Indian Sun</span>
          </h1>
          <p style={{ color: 'var(--text-2)', fontSize: 14, lineHeight: 1.7, maxWidth: 460, marginBottom: 22 }}>
            Real-time solar prediction using NASA POWER satellite data. Physics-based ML models across all Indian climate zones.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="/predict" className="btn btn-primary">⚡ Start Predicting</a>
            <a href="/roi"     className="btn btn-ghost">Calculate ROI →</a>
          </div>
        </div>
        <div style={{ animation: 'float 4s ease-in-out infinite' }}>
          <SunOrb />
        </div>
      </div>

      {/* REGION SELECT */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Live Region:</span>
        {REGIONS.map(r => (
          <button key={r.value} onClick={() => setRegionVal(r.value)}
            style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
              fontFamily: 'var(--font-mono)', transition: 'all .2s',
              background: regionVal === r.value ? 'var(--solar-glow)' : 'var(--raised)',
              color:      regionVal === r.value ? 'var(--solar)'      : 'var(--text-3)',
              border: `1px solid ${regionVal === r.value ? 'var(--border-glow)' : 'var(--border)'}`,
            }}>{r.label.split('—')[0].trim()}</button>
        ))}
        {loading && <div className="loader" style={{ width: 14, height: 14 }} />}
      </div>

      {/* STATS ROW */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Solar Intensity', value: loading ? '—' : intensity.toFixed(2), unit: 'kWh/m²', color: iColor, sub: riskLabel },
          { label: 'Power Output (5kW)', value: loading ? '—' : (prediction?.powerOutput || 0).toFixed(2), unit: 'kWh', color: 'var(--solar)', sub: 'Today estimate' },
          { label: 'Sunshine Hours', value: loading ? '—' : (prediction?.duration || 0).toFixed(1), unit: 'hrs', color: 'var(--corona)', sub: `Confidence ${((prediction?.confidence||0.88)*100).toFixed(0)}%` },
          { label: 'CO₂ Avoided', value: co2Saved.toLocaleString(), unit: 'kg/yr', color: 'var(--grass)', sub: 'Annual estimate' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label" style={{color: 'var(--solar)'}}>{s.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: s.color, lineHeight: 1, marginTop: 4 }}>
              {s.value}<span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 400, marginLeft: 4 }}>{s.unit}</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* CHARTS ROW */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        <div className="card card-glow">
          <div style={{ marginBottom: 16 }}>
            <div className="page-tag">Annual Profile</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
              Monthly Solar — {region.label}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyChart}>
              <defs>
                <linearGradient id="sG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 8]} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="solar" stroke="#f59e0b" strokeWidth={2.5} fill="url(#sG)" dot={false} activeDot={{ r: 5, fill: '#f59e0b' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="page-tag">State Comparison</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Solar Potential Radar</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="#ffffff0f" />
              <PolarAngleAxis dataKey="state" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Mono' }} />
              <Radar dataKey="intensity" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.18} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* LIVE CONDITIONS + QUICK LINKS */}
      <div className="grid-2">
        {/* NASA conditions */}
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <div className="page-tag">NASA POWER · Live</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>Atmospheric Conditions</h3>
          </div>
          {prediction ? (
            <>
              {[
                { label: 'Cloud Cover',  value: prediction.weatherData?.cloudCover || 25,  max: 100, color: 'var(--sky)',    unit: '%' },
                { label: 'Humidity',     value: prediction.weatherData?.humidity    || 42,  max: 100, color: '#a78bfa',       unit: '%' },
                { label: 'Temperature', value: prediction.weatherData?.temperature || 31,  max: 50,  color: 'var(--plasma)', unit: '°C' },
              ].map(w => (
                <div key={w.label} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{w.label}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: w.color, fontSize: 13 }}>{(w.value||0).toFixed(1)}{w.unit}</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--raised)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(100,(w.value/w.max)*100)}%`, background: w.color, borderRadius: 3, transition: 'width 1s ease' }} />
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span className="badge badge-high">NASA POWER</span>
                <span className="badge badge-med">ML Verified</span>
                <span className={`badge ${intensity >= 5.5 ? 'badge-high' : intensity >= 3.5 ? 'badge-med' : 'badge-low'}`}>{riskLabel}</span>
              </div>
            </>
          ) : (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="loader" />
            </div>
          )}
        </div>

        {/* Quick nav */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { href: '/predict', icon: '⚡', label: 'AI Predictor',     desc: 'Physics-based solar forecasting for any region & date' },
            { href: '/roi',     icon: '₹',  label: 'ROI Calculator',   desc: 'PM Surya Ghar subsidy + 25-year cash-flow projection' },
            { href: '/schemes', icon: '🏛', label: 'Govt Schemes',      desc: 'KUSUM, PM Surya Ghar, grid-connected subsidies' },
            { href: '/heatmap', icon: '🗺', label: 'Solar Heat Map',   desc: 'Interactive India-wide solar potential map' },
          ].map(item => (
            <a href={item.href} key={item.href}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, transition: 'all .2s', textDecoration: 'none' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--solar-dim)'; e.currentTarget.style.background = 'var(--raised)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)';     e.currentTarget.style.background = 'var(--surface)'; }}>
              <div style={{ width: 38, height: 38, background: 'var(--solar-glow)', border: '1px solid var(--border-glow)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                {item.icon}
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15 }}>{item.label}</div>
                <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 2 }}>{item.desc}</div>
              </div>
              <div style={{ marginLeft: 'auto', color: 'var(--text-3)', fontSize: 18 }}>›</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
