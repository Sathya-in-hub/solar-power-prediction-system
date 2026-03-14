import React, { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const SOLAR_BY_REGION = {
  'Rajasthan-Jodhpur':    6.4,
  'Rajasthan-Jaisalmer':  6.8,
  'Gujarat-Kutch':        6.2,
  'Tamil Nadu-Chennai':   5.6,
  'Maharashtra-Mumbai':   5.2,
  'Karnataka-Bangalore':  5.8,
  'Telangana-Hyderabad':  5.9,
  'MP-Bhopal':            6.0,
  'Uttarakhand-Dehradun': 4.8,
  'Punjab-Amritsar':      5.1,
};

const PM_SUBSIDY = (kw) => {
  if (kw <= 3) return kw * 26000;
  return 78000 + Math.min(kw - 3, 7) * 13000;
};

function calcLocal({ panelCount, panelWatts, regionSolar, electricityRate, installCostPerKw }) {
  const systemKw     = (panelCount * panelWatts) / 1000;
  const dailyKwh     = systemKw * regionSolar * 0.8;          // 80% efficiency
  const annualKwh    = dailyKwh * 365;
  const installCost  = systemKw * installCostPerKw;
  const subsidy      = PM_SUBSIDY(systemKw);
  const netCost      = Math.max(0, installCost - subsidy);
  const annualSav    = annualKwh * electricityRate;
  const payback      = netCost / annualSav;
  const roi25        = annualSav * 25 - netCost;
  const co2Annual    = annualKwh * 0.82;                       // kg CO₂ per kWh grid factor India

  const yearlyData = Array.from({ length: 25 }, (_, i) => ({
    year: i + 1,
    cumSavings: Math.round(annualSav * (i + 1)),
    net: Math.round(annualSav * (i + 1) - netCost),
  }));

  return {
    systemKw, dailyKwh, annualKwh, installCost, subsidy, netCost,
    annualSav, payback, roi25, co2Annual, yearlyData,
    trees: Math.round(co2Annual / 21),
    subsidyPct: Math.round((subsidy / installCost) * 100),
  };
}

const Chip = ({ val, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '5px 14px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
    fontFamily: 'var(--font-mono)', transition: 'all .2s',
    background: active ? 'var(--solar-glow)' : 'var(--raised)',
    color:      active ? 'var(--solar)'      : 'var(--text-3)',
    border: `1px solid ${active ? 'var(--border-glow)' : 'var(--border)'}`,
  }}>{val}</button>
);

const Row = ({ label, value, highlight, green }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 0', borderBottom: '1px solid var(--border)',
  }}>
    <span style={{ color: 'var(--text-2)', fontSize: 13 }}>{label}</span>
    <span style={{
      fontFamily: highlight ? 'var(--font-display)' : 'var(--font-mono)',
      fontSize: highlight ? 20 : 14, fontWeight: highlight ? 800 : 600,
      color: highlight ? 'var(--solar)' : green ? 'var(--grass)' : 'var(--text-1)',
    }}>{value}</span>
  </div>
);

const fmt = (n) => Number(n).toLocaleString('en-IN');

export default function ROICalculator() {
  const [form, setForm] = useState({
    region: 'Rajasthan-Jodhpur',
    panelCount: 20, panelWatts: 400,
    electricityRate: 7, installCostPerKw: 45000,
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: Number(e.target.value) }));
  const setRegion = (e) => setForm(f => ({ ...f, region: e.target.value }));

  const regionSolar = SOLAR_BY_REGION[form.region] || 5.5;
  const preview = calcLocal({ ...form, regionSolar });

  async function handleCalc() {
    setLoading(true);
    try {
      const res = await api.calcRoi({
        panelCount: form.panelCount, panelWatts: form.panelWatts,
        regionSolar, electricityRate: form.electricityRate,
        installCostPerKw: form.installCostPerKw,
        subsidyPercent: preview.subsidyPct,
      });
      if (res.success || res.financial) {
        setResult({ ...res, _local: preview });
      } else {
        setResult({ _local: preview });
      }
    } catch {
      setResult({ _local: preview });
    }
    toast.success('ROI calculated!');
    setLoading(false);
  }

  const r = result?._local || preview;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-tag">PM Surya Ghar · 25-Year Projection</div>
        <h1 className="page-title">ROI <span>Calculator</span></h1>
        <p className="page-sub">
          India-specific solar ROI with automatic PM Surya Ghar subsidy, net metering savings,
          and 25-year cash-flow projection.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, alignItems: 'start' }}>

        {/* ── FORM ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card card-glow">
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, marginBottom: 24 }}>
              System Parameters
            </h3>

            <div className="form-group">
              <label className="form-label">Location</label>
              <select className="form-select" value={form.region} onChange={setRegion}>
                {Object.keys(SOLAR_BY_REGION).map(r => (
                  <option key={r} value={r}>{r.replace('-', ' — ')}</option>
                ))}
              </select>
              <div style={{ marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--solar)' }}>
                ☀ {regionSolar} kWh/m²/day avg
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Panels</label>
                <input type="number" className="form-input" min={1} max={1000} value={form.panelCount} onChange={set('panelCount')} />
              </div>
              <div className="form-group">
                <label className="form-label">Watts/Panel</label>
                <input type="number" className="form-input" min={50} max={700} step={10} value={form.panelWatts} onChange={set('panelWatts')} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">System Size</label>
              <div style={{
                padding: '12px 16px', background: 'var(--deep)', borderRadius: 10,
                fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 24, color: 'var(--solar)'
              }}>
                {preview.systemKw.toFixed(2)} kW
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Electricity Rate (₹/kWh)</label>
              <input type="number" className="form-input" min={1} max={20} step={0.5} value={form.electricityRate} onChange={set('electricityRate')} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[5, 7, 9, 12].map(v => (
                  <Chip key={v} val={`₹${v}`} active={form.electricityRate === v}
                    onClick={() => setForm(f => ({ ...f, electricityRate: v }))} />
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Install Cost (₹/kW)</label>
              <input type="number" className="form-input" min={20000} max={100000} step={1000} value={form.installCostPerKw} onChange={set('installCostPerKw')} />
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[35000, 45000, 55000].map(v => (
                  <Chip key={v} val={`₹${(v/1000).toFixed(0)}k`} active={form.installCostPerKw === v}
                    onClick={() => setForm(f => ({ ...f, installCostPerKw: v }))} />
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleCalc} disabled={loading}>
              {loading ? <><div className="loader" style={{ width: 16, height: 16 }} /> Calculating...</> : '₹ Calculate Returns'}
            </button>
          </div>

          {/* Subsidy preview card */}
          <div style={{
            background: 'var(--solar-glow)', border: '1px solid var(--border-glow)',
            borderRadius: 16, padding: '20px 24px',
          }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--solar)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
              PM Surya Ghar Subsidy
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>
              ₹{fmt(preview.subsidy)}
            </div>
            <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4 }}>
              {preview.subsidyPct}% of install cost · Auto-calculated
            </div>
            <div style={{ marginTop: 10, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', lineHeight: 1.7 }}>
              ₹26,000/kW for first 3 kW<br />
              ₹13,000/kW for next 7 kW
            </div>
          </div>
        </div>

        {/* ── RESULTS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Key metrics */}
          <div className="grid-2">
            {[
              { label: 'Net Investment', value: `₹${fmt(preview.netCost)}`, sub: `After ₹${fmt(preview.subsidy)} subsidy`, color: 'var(--solar)' },
              { label: 'Annual Savings', value: `₹${fmt(Math.round(preview.annualSav))}`, sub: `${Math.round(preview.annualKwh).toLocaleString()} kWh/year`, color: 'var(--grass)' },
              { label: 'Payback Period', value: `${preview.payback.toFixed(1)} yrs`, sub: 'After subsidy deduction', color: 'var(--sky)' },
              { label: '25-Year Profit', value: `₹${fmt(Math.round(preview.roi25))}`, sub: 'Net after investment', color: 'var(--plasma)' },
            ].map(m => (
              <div className="stat-card" key={m.label}>
                <div className="stat-label">{m.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: m.color, marginTop: 4 }}>
                  {m.value}
                </div>
                <div style={{ color: 'var(--text-3)', fontSize: 12, marginTop: 4 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          {/* 25-year chart */}
          <div className="card card-glow">
            <div style={{ marginBottom: 16 }}>
              <div className="page-tag">Cash Flow Projection</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 }}>
                25-Year Net Savings Curve
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={preview.yearlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="savGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Space Mono' }}
                  axisLine={false} tickLine={false} tickFormatter={v => `Y${v}`} interval={4} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `₹${(v/100000).toFixed(0)}L`} />
                <Tooltip
                  contentStyle={{ background: 'var(--raised)', border: '1px solid var(--border-glow)', borderRadius: 8, fontFamily: 'Space Mono', fontSize: 11 }}
                  formatter={(v, name) => [`₹${Number(v).toLocaleString('en-IN')}`, name === 'net' ? 'Net Profit' : 'Total Savings']}
                  labelFormatter={v => `Year ${v}`}
                />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="4 4" />
                <Area type="monotone" dataKey="cumSavings" stroke="#f59e0b" strokeWidth={1.5}
                  fill="url(#savGrad)" strokeDasharray="5 3" dot={false} />
                <Area type="monotone" dataKey="net" stroke="#34d399" strokeWidth={2.5}
                  fill="url(#netGrad)" dot={false} activeDot={{ r: 5, fill: '#34d399' }} />
              </AreaChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
              {[['#34d399','Net profit after investment'],['#f59e0b','Gross cumulative savings']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                  <div style={{ width: 20, height: 2, background: c }} />
                  {l}
                </div>
              ))}
            </div>
          </div>

          {/* Financial breakdown + environmental */}
          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                Financial Breakdown
              </h3>
              <Row label="System Capacity"     value={`${preview.systemKw.toFixed(2)} kW`} />
              <Row label="Daily Generation"    value={`${preview.dailyKwh.toFixed(1)} kWh`} />
              <Row label="Annual Generation"   value={`${fmt(Math.round(preview.annualKwh))} kWh`} />
              <Row label="Install Cost"        value={`₹${fmt(Math.round(preview.installCost))}`} />
              <Row label="PM Subsidy"          value={`₹${fmt(preview.subsidy)}`} green />
              <Row label="Net Investment"      value={`₹${fmt(Math.round(preview.netCost))}`} />
              <Row label="Annual Savings"      value={`₹${fmt(Math.round(preview.annualSav))}`} green />
              <Row label="Payback"             value={`${preview.payback.toFixed(1)} years`} />
              <Row label="25-Year Net Profit"  value={`₹${fmt(Math.round(preview.roi25))}`} highlight />
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                Environmental Impact / Year
              </h3>
              {[
                { icon: '🌍', label: 'CO₂ Avoided',       value: `${fmt(Math.round(preview.co2Annual))} kg` },
                { icon: '🌳', label: 'Equivalent Trees',   value: `${preview.trees} trees` },
                { icon: '🚗', label: 'Cars Offset',        value: `${(preview.co2Annual/4600).toFixed(2)} cars` },
                { icon: '💡', label: 'Units Generated',    value: `${fmt(Math.round(preview.annualKwh))} kWh` },
              ].map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 0', borderBottom: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{item.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--grass)', marginTop: 2 }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
