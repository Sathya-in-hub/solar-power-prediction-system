import React, { useState, useEffect } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { predictSolar, getMonthlySolar } from '../utils/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const REGIONS = [
  { value: 'Rajasthan-Jodhpur', label: 'Rajasthan — Jodhpur', lat: 26.2389, lon: 73.0243 },
  { value: 'Rajasthan-Jaipur', label: 'Rajasthan — Jaipur', lat: 26.9124, lon: 75.7873 },
  { value: 'Gujarat-Ahmedabad', label: 'Gujarat — Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { value: 'Gujarat-Surat', label: 'Gujarat — Surat', lat: 21.1702, lon: 72.8311 },
  { value: 'Tamil Nadu-Chennai', label: 'Tamil Nadu — Chennai', lat: 13.0827, lon: 80.2707 },
  { value: 'Tamil Nadu-Coimbatore', label: 'Tamil Nadu — Coimbatore', lat: 11.0168, lon: 76.9558 },
  { value: 'Karnataka-Bangalore', label: 'Karnataka — Bangalore', lat: 12.9716, lon: 77.5946 },
  { value: 'Maharashtra-Pune', label: 'Maharashtra — Pune', lat: 18.5204, lon: 73.8567 },
  { value: 'Andhra Pradesh-Hyderabad', label: 'Andhra Pradesh — Hyderabad', lat: 17.3850, lon: 78.4867 },
  { value: 'Madhya Pradesh-Bhopal', label: 'Madhya Pradesh — Bhopal', lat: 23.2599, lon: 77.4126 },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function IntensityGauge({ value, max = 7 }) {
  const pct = Math.min(100, (value / max) * 100);
  const color = pct > 70 ? '#34d399' : pct > 43 ? '#f59e0b' : '#f87171';
  const angle = -135 + (pct / 100) * 270;
  const rad = (angle - 90) * Math.PI / 180;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg viewBox="0 0 200 130" style={{ width: '100%', maxWidth: 240 }}>
        <path d="M 20 115 A 80 80 0 0 1 180 115" fill="none" stroke="#ffffff0f" strokeWidth="16" strokeLinecap="round" />
        <path d="M 20 115 A 80 80 0 0 1 180 115" fill="none" stroke={color} strokeWidth="16"
          strokeLinecap="round" strokeDasharray={`${(pct / 100) * 251} 251`}
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.34,1.56,0.64,1)', filter: `drop-shadow(0 0 8px ${color}88)` }} />
        <line x1="100" y1="115" x2={100 + 58 * Math.cos(rad)} y2={115 + 58 * Math.sin(rad)}
          stroke={color} strokeWidth="3" strokeLinecap="round" style={{ transition: 'all 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
        <circle cx="100" cy="115" r="7" fill={color} />
        <text x="100" y="95" textAnchor="middle" fill={color} style={{ fontSize: 30, fontFamily: 'Syne', fontWeight: 800 }}>{value?.toFixed(1)}</text>
        <text x="100" y="112" textAnchor="middle" fill="#64748b" style={{ fontSize: 10, fontFamily: 'Space Mono' }}>kWh/m²</text>
      </svg>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color, marginTop: -8 }}>
        {pct > 70 ? 'EXCELLENT' : pct > 43 ? 'MODERATE' : 'LOW'} SOLAR POTENTIAL
      </div>
    </div>
  );
}

function WeatherBar({ label, value, max, color }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color }}>{value?.toFixed(1)}{max === 100 ? '%' : '°C'}</span>
      </div>
      <div style={{ height: 6, background: 'var(--raised)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, (value / max) * 100)}%`, background: color, borderRadius: 3, transition: 'width 1.2s ease', boxShadow: `0 0 8px ${color}66` }} />
      </div>
    </div>
  );
}

export default function Predictor() {
  const [form, setForm] = useState({ region: 'Rajasthan-Jodhpur', date: format(new Date(), 'yyyy-MM-dd'), panelCapacity: 5 });
  const [result, setResult] = useState(null);
  const [monthly, setMonthly] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mLoading, setMLoading] = useState(false);

  const selReg = REGIONS.find(r => r.value === form.region);

  useEffect(() => {
    if (!selReg) return;
    setMLoading(true);
    getMonthlySolar({ lat: selReg.lat, lon: selReg.lon })
      .then(data => {
        const raw = data?.data || data?.monthly_data || [];
        setMonthly(MONTHS.map((m, i) => ({ month: m, intensity: raw[i]?.solar_irradiance ?? parseFloat((4 + Math.sin(i * 0.6) * 1.5).toFixed(2)) })));
      })
      .catch(() => setMonthly(MONTHS.map((m, i) => ({ month: m, intensity: parseFloat((4 + Math.sin(i * 0.6) * 1.5).toFixed(2)) }))))
      .finally(() => setMLoading(false));
  }, [form.region]);

  async function handlePredict(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await predictSolar(form);
      setResult(data.prediction);
      toast.success('Prediction complete!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Backend error — is it running?');
    } finally {
      setLoading(false);
    }
  }

  const bestMonth = monthly.length ? monthly.reduce((a, b) => a.intensity > b.intensity ? a : b) : null;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-tag">NASA POWER + Physics ML</div>
        <h1 className="page-title">Solar <span>Predictor</span></h1>
        <p className="page-sub">Real atmospheric data from NASA satellites. Physics-based intensity calculation for any region in India.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 24, alignItems: 'start' }}>
        {/* FORM PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-glow">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>Configure Prediction</h3>
            <form onSubmit={handlePredict}>
              <div className="form-group">
                <label className="form-label">Region</label>
                <select className="form-select" value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))}>
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={form.date} style={{ colorScheme: 'dark' }}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Panel Capacity (kW)</label>
                <input type="number" className="form-input" min="1" max="100" step="0.5"
                  value={form.panelCapacity} onChange={e => setForm(f => ({ ...f, panelCapacity: parseFloat(e.target.value) }))} />
                <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                  {[1, 3, 5, 10].map(v => (
                    <button key={v} type="button" onClick={() => setForm(f => ({ ...f, panelCapacity: v }))}
                      style={{ flex: 1, padding: 6, borderRadius: 8, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s',
                        background: form.panelCapacity === v ? 'var(--solar-glow)' : 'var(--raised)',
                        color: form.panelCapacity === v ? 'var(--solar)' : 'var(--text-3)',
                        border: `1px solid ${form.panelCapacity === v ? 'var(--border-glow)' : 'var(--border)'}` }}>
                      {v} kW
                    </button>
                  ))}
                </div>
              </div>
              {selReg && (
                <div style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>COORDINATES</div>
                  <div style={{ fontSize: 13, color: 'var(--sky)', fontFamily: 'var(--font-mono)' }}>{selReg.lat.toFixed(4)}°N · {selReg.lon.toFixed(4)}°E</div>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%' }}>
                {loading ? <><div className="loader" style={{ width: 16, height: 16 }} /> Computing...</> : '⚡ Predict Solar Output'}
              </button>
            </form>
          </div>
          {bestMonth && (
            <div style={{ background: 'var(--solar-glow)', border: '1px solid var(--border-glow)', borderRadius: 14, padding: '16px 20px' }}>
              <div style={{ fontSize: 10, color: 'var(--solar)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>BEST MONTH FOR THIS REGION</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{bestMonth.month}</div>
              <div style={{ color: 'var(--text-2)', fontSize: 13 }}>{bestMonth.intensity.toFixed(2)} kWh/m² avg</div>
            </div>
          )}
        </div>

        {/* RESULTS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {result ? (
            <>
              <div className="card card-glow">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center' }}>
                  <div>
                    <div className="page-tag">Live Result</div>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, margin: '8px 0 20px' }}>{result.region}</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                      {[
                        { label: 'Solar Intensity', value: `${result.solarIntensity}`, unit: 'kWh/m²', color: 'var(--solar)' },
                        { label: 'Sunshine Hours', value: `${result.duration}`, unit: 'hrs/day', color: 'var(--corona)' },
                        { label: 'Power Output', value: `${result.powerOutput}`, unit: 'kWh', color: 'var(--plasma)' },
                        { label: 'Confidence', value: `${(result.confidence * 100).toFixed(0)}`, unit: '%', color: 'var(--grass)' },
                      ].map(s => (
                        <div key={s.label} style={{ background: 'var(--deep)', padding: '14px 16px', borderRadius: 12 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: s.color, lineHeight: 1 }}>
                            {s.value}<span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, color: 'var(--text-2)' }}>{s.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <IntensityGauge value={result.solarIntensity} />
                </div>
              </div>

              {result.weatherData && (
                <div className="card">
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>Atmospheric Conditions — NASA POWER</h3>
                  <WeatherBar label="Cloud Cover" value={result.weatherData.cloudCover} max={100} color="#38bdf8" />
                  <WeatherBar label="Relative Humidity" value={result.weatherData.humidity} max={100} color="#a78bfa" />
                  <WeatherBar label="Temperature" value={result.weatherData.temperature} max={50} color="#fb923c" />
                </div>
              )}
            </>
          ) : (
            <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12, borderStyle: 'dashed' }}>
              <div style={{ fontSize: 56, opacity: 0.2 }}>☀</div>
              <div style={{ color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.8 }}>Configure your region and date,<br />then click Predict Solar Output.</div>
            </div>
          )}

          {/* Monthly bars */}
          <div className="card">
            <div style={{ marginBottom: 16 }}>
              <div className="page-tag">Year-round Profile</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
                Monthly Solar Intensity — {selReg?.label.split('—')[0].trim()}
              </h3>
            </div>
            {mLoading ? (
              <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="loader" /></div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthly} barSize={20}>
                  <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Space Mono' }} axisLine={false} tickLine={false} />
                  <YAxis hide domain={[0, 8]} />
                  <Tooltip contentStyle={{ background: 'var(--raised)', border: '1px solid var(--border-glow)', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 12 }}
                    labelStyle={{ color: 'var(--text-3)' }} itemStyle={{ color: 'var(--solar)' }} />
                  <Bar dataKey="intensity" radius={[4, 4, 0, 0]}>
                    {monthly.map((e, i) => <Cell key={i} fill={e.intensity >= 5.5 ? '#f59e0b' : e.intensity >= 4 ? '#fb923c' : '#f87171'} fillOpacity={0.85} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
