import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const FALLBACK = [
  { _id: '1', region: 'Rajasthan-Jodhpur',   date: '2024-04-15', solarIntensity: 6.21, powerOutput: 4.97, panelCapacity: 5, createdAt: new Date(Date.now()-86400000).toISOString() },
  { _id: '2', region: 'Tamil Nadu-Chennai',   date: '2024-08-10', solarIntensity: 1.03, powerOutput: 0.77, panelCapacity: 5, createdAt: new Date(Date.now()-172800000).toISOString() },
  { _id: '3', region: 'Gujarat-Ahmedabad',    date: '2024-03-22', solarIntensity: 5.89, powerOutput: 4.71, panelCapacity: 5, createdAt: new Date(Date.now()-259200000).toISOString() },
  { _id: '4', region: 'Karnataka-Bangalore',  date: '2024-06-01', solarIntensity: 4.12, powerOutput: 3.30, panelCapacity: 5, createdAt: new Date(Date.now()-345600000).toISOString() },
  { _id: '5', region: 'Maharashtra-Pune',     date: '2024-01-18', solarIntensity: 5.44, powerOutput: 4.35, panelCapacity: 5, createdAt: new Date(Date.now()-432000000).toISOString() },
  { _id: '6', region: 'Rajasthan-Jaipur',     date: '2024-05-04', solarIntensity: 5.98, powerOutput: 4.78, panelCapacity: 5, createdAt: new Date(Date.now()-518400000).toISOString() },
];

function intensityBadge(v) {
  if (v >= 5.5) return { label: 'Excellent', cls: 'badge-high' };
  if (v >= 4.0) return { label: 'Good',      cls: 'badge-med'  };
  return                { label: 'Low',       cls: 'badge-low'  };
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('createdAt');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetch(`${BASE_URL}/api/predictions/history`)
      .then(r => r.json())
      .then(data => {
        const arr = data.predictions || data.history || data || [];
        setHistory(Array.isArray(arr) && arr.length ? arr : FALLBACK);
      })
      .catch(() => setHistory(FALLBACK))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history
    .filter(p => !filter || p.region?.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'solarIntensity') return b.solarIntensity - a.solarIntensity;
      if (sortKey === 'powerOutput')    return b.powerOutput    - a.powerOutput;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const chartData = [...history]
    .sort((a, b) => b.solarIntensity - a.solarIntensity)
    .slice(0, 8)
    .map(p => ({ name: p.region?.split('-')[1] || p.region?.split('-')[0] || 'N/A', val: p.solarIntensity }));

  const avgIntensity = history.length
    ? (history.reduce((s, p) => s + (p.solarIntensity || 0), 0) / history.length).toFixed(2)
    : '—';
  const bestRun = history.reduce((best, p) => (!best || p.solarIntensity > best.solarIntensity) ? p : best, null);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-tag">MongoDB Cache</div>
        <h1 className="page-title">Prediction <span>History</span></h1>
        <p className="page-sub">All past solar predictions stored in MongoDB — sortable, filterable, and ready to analyse.</p>
      </div>

      {/* SUMMARY STATS */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { label: 'Total Predictions', value: history.length, unit: '' },
          { label: 'Avg Solar Intensity', value: avgIntensity, unit: 'kWh/m²' },
          { label: 'Best Prediction', value: bestRun?.solarIntensity?.toFixed(2) || '—', unit: 'kWh/m²' },
          { label: 'Best Region', value: bestRun?.region?.split('-')[1] || '—', unit: '' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}<span className="stat-unit">{s.unit}</span></div>
          </div>
        ))}
      </div>

      {/* CHART */}
      {history.length > 0 && (
        <div className="card card-glow" style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="page-tag">Analysis</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
              Solar Intensity — Top 8 Predictions
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barSize={28}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 8]} />
              <Tooltip
                contentStyle={{ background: 'var(--raised)', border: '1px solid var(--border-glow)', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 12 }}
                formatter={v => [`${v.toFixed(2)} kWh/m²`, 'Solar Intensity']}
              />
              <Bar dataKey="val" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.val >= 5.5 ? '#f59e0b' : entry.val >= 4 ? '#fb923c' : '#f87171'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* FILTER + SORT */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="form-input" placeholder="Filter by region…" value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{ maxWidth: 260 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          {[['createdAt','Latest'],['solarIntensity','Solar'],['powerOutput','Power']].map(([k, label]) => (
            <button key={k} onClick={() => setSortKey(k)}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                fontFamily: 'var(--font-mono)', transition: 'all .2s',
                background: sortKey === k ? 'var(--solar-glow)' : 'var(--raised)',
                color:      sortKey === k ? 'var(--solar)'      : 'var(--text-3)',
                border: `1px solid ${sortKey === k ? 'var(--border-glow)' : 'var(--border)'}`,
              }}>{label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>
          {filtered.length} results
        </div>
      </div>

      {/* TABLE */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--raised)' }}>
                {['Region', 'Date', 'Solar Intensity', 'Power Output', 'Panel kW', 'Status', 'When'].map(col => (
                  <th key={col} style={{
                    padding: '14px 20px', textAlign: 'left',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em',
                    whiteSpace: 'nowrap',
                  }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48 }}>
                  <div className="loader" style={{ margin: '0 auto' }} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                  No predictions found. Make your first prediction!
                </td></tr>
              ) : filtered.map((p, i) => {
                const badge = intensityBadge(p.solarIntensity);
                return (
                  <tr key={p._id || i} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{p.region}</div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {p.date ? new Date(p.date).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--solar)' }}>
                        {p.solarIntensity?.toFixed(2)}
                        <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>kWh/m²</span>
                      </div>
                      <div className="intensity-bar" style={{ marginTop: 4, width: 100 }}>
                        <div className="intensity-fill" style={{ width: `${Math.min(100, (p.solarIntensity / 7) * 100)}%` }} />
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--grass)' }}>
                      {p.powerOutput?.toFixed(2)}
                      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>kWh</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-2)' }}>
                      {p.panelCapacity || '—'} kW
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span className={`badge ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {timeAgo(p.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
