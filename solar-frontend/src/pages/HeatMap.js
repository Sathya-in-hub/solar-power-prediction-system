import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const INDIA_GRID = [
  { name: 'J&K', lat: 34.08, lon: 74.80, intensity: 5.2, zone: 'Mountain' },
  { name: 'Himachal', lat: 31.10, lon: 77.17, intensity: 5.0, zone: 'Mountain' },
  { name: 'Punjab', lat: 31.15, lon: 75.34, intensity: 5.4, zone: 'Plain' },
  { name: 'Rajasthan', lat: 27.02, lon: 74.22, intensity: 6.4, zone: 'Desert' },
  { name: 'Haryana', lat: 29.06, lon: 76.09, intensity: 5.5, zone: 'Plain' },
  { name: 'UP', lat: 26.85, lon: 80.91, intensity: 5.2, zone: 'Plain' },
  { name: 'Bihar', lat: 25.09, lon: 85.31, intensity: 4.9, zone: 'Plain' },
  { name: 'West Bengal', lat: 22.98, lon: 87.85, intensity: 4.7, zone: 'Coastal' },
  { name: 'Gujarat', lat: 22.26, lon: 71.19, intensity: 5.9, zone: 'Coastal' },
  { name: 'MP', lat: 23.47, lon: 77.95, intensity: 5.5, zone: 'Inland' },
  { name: 'Jharkhand', lat: 23.61, lon: 85.28, intensity: 5.0, zone: 'Inland' },
  { name: 'Odisha', lat: 20.95, lon: 85.09, intensity: 5.2, zone: 'Coastal' },
  { name: 'Maharashtra', lat: 19.75, lon: 75.71, intensity: 5.3, zone: 'Inland' },
  { name: 'Telangana', lat: 17.12, lon: 78.66, intensity: 5.5, zone: 'Inland' },
  { name: 'AP', lat: 15.91, lon: 79.74, intensity: 5.6, zone: 'Coastal' },
  { name: 'Karnataka', lat: 15.32, lon: 75.71, intensity: 5.4, zone: 'Inland' },
  { name: 'Goa', lat: 15.30, lon: 74.12, intensity: 5.1, zone: 'Coastal' },
  { name: 'Tamil Nadu', lat: 11.13, lon: 78.66, intensity: 5.3, zone: 'Coastal' },
  { name: 'Kerala', lat: 10.85, lon: 76.27, intensity: 4.6, zone: 'Coastal' },
];

function intensityColor(v) {
  if (v >= 6.0) return { bg: '#f59e0b', glow: '#f59e0b66', text: '#000' };
  if (v >= 5.5) return { bg: '#fb923c', glow: '#fb923c44', text: '#000' };
  if (v >= 5.0) return { bg: '#f97316', glow: '#f9731644', text: '#fff' };
  if (v >= 4.5) return { bg: '#ea580c', glow: '#ea580c44', text: '#fff' };
  return { bg: '#c2410c', glow: '#c2410c44', text: '#fff' };
}

export default function HeatMap() {
  const [selected, setSelected] = useState(null);
  const [data, setData] = useState(INDIA_GRID);

  useEffect(() => {
    api.heatmap().then(res => {
      if (res?.data?.length) setData(res.data);
    }).catch(() => {});
  }, []);

  const sorted = [...data].sort((a, b) => b.intensity - a.intensity);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-tag">Pan-India Solar Intelligence</div>
        <h1 className="page-title">Solar <span>Heat Map</span></h1>
        <p className="page-sub">Interactive solar intensity map across Indian states. Click any state to drill down.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
        {/* BUBBLE MAP */}
        <div className="card card-glow" style={{ position: 'relative', overflow: 'hidden', minHeight: 520 }}>
          <div style={{ marginBottom: 20 }}>
            <div className="page-tag">Solar Intensity Map</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>India — State-wise Solar Potential</h3>
          </div>

          {/* India outline SVG */}
          <div style={{ position: 'relative', width: '100%', paddingBottom: '80%' }}>
            <svg viewBox="0 0 500 500" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              {/* faint grid */}
              {[100,200,300,400].map(x => <line key={`v${x}`} x1={x} y1="0" x2={x} y2="500" stroke="#ffffff04" strokeWidth="1" />)}
              {[100,200,300,400].map(y => <line key={`h${y}`} x1="0" y1={y} x2="500" y2={y} stroke="#ffffff04" strokeWidth="1" />)}

              {data.map(region => {
                // Map lat/lon to SVG coords (India spans roughly lat 8-37, lon 68-97)
                const x = ((region.lon - 68) / 29) * 420 + 30;
                const y = ((37 - region.lat) / 29) * 420 + 30;
                const col = intensityColor(region.intensity);
                const isSelected = selected?.name === region.name;
                const r = 20 + (region.intensity - 4) * 6;
                return (
                  <g key={region.name} onClick={() => setSelected(region)} style={{ cursor: 'pointer' }}>
                    <circle cx={x} cy={y} r={r + 8} fill={col.bg} opacity="0.08" />
                    <circle cx={x} cy={y} r={r} fill={col.bg} opacity={isSelected ? 1 : 0.75}
                      stroke={isSelected ? '#fff' : col.bg} strokeWidth={isSelected ? 2 : 0}
                      style={{ transition: 'all 0.3s', filter: isSelected ? `drop-shadow(0 0 12px ${col.bg})` : 'none' }} />
                    <text x={x} y={y - 2} textAnchor="middle" fill={col.text}
                      style={{ fontSize: 9, fontFamily: 'Space Mono', fontWeight: 700, pointerEvents: 'none' }}>{region.name}</text>
                    <text x={x} y={y + 9} textAnchor="middle" fill={col.text}
                      style={{ fontSize: 9, fontFamily: 'Space Mono', pointerEvents: 'none' }}>{region.intensity}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
            {[
              { label: '≥ 6.0 Excellent', color: '#f59e0b' },
              { label: '5.5–6.0 Good', color: '#fb923c' },
              { label: '5.0–5.5 Moderate', color: '#f97316' },
              { label: '< 5.0 Low', color: '#c2410c' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: l.color }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Selected state detail */}
          {selected ? (
            <div className="card card-glow">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div className="page-tag">Selected Region</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>{selected.name}</h3>
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', color: 'var(--text-3)', fontSize: 18, cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 800, color: intensityColor(selected.intensity).bg, lineHeight: 1 }}>
                {selected.intensity}
              </div>
              <div style={{ color: 'var(--text-2)', fontSize: 13, marginBottom: 16 }}>kWh/m² daily avg</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Zone', value: selected.zone },
                  { label: 'Latitude', value: `${selected.lat.toFixed(2)}°N` },
                  { label: 'Longitude', value: `${selected.lon.toFixed(2)}°E` },
                  { label: 'Potential', value: selected.intensity >= 6 ? 'Excellent' : selected.intensity >= 5 ? 'Good' : 'Moderate' },
                ].map(i => (
                  <div key={i.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-3)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{i.label}</span>
                    <span style={{ color: 'var(--text-1)', fontSize: 13, fontWeight: 500 }}>{i.value}</span>
                  </div>
                ))}
              </div>
              <a href={`/predict`} className="btn btn-primary" style={{ width: '100%', marginTop: 16, display: 'flex' }}>
                Predict for {selected.name} →
              </a>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>👆</div>
              <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Click any bubble on the map to see details</div>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <div className="page-tag">Rankings</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>Top Solar States</h3>
            </div>
            {sorted.slice(0, 8).map((r, i) => {
              const col = intensityColor(r.intensity);
              return (
                <div key={r.name} onClick={() => setSelected(r)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', width: 20, textAlign: 'right' }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{r.zone}</div>
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: col.bg }}>{r.intensity}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
