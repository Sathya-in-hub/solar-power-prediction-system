import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const FALLBACK_SCHEMES = [
  {
    id: 'pm-surya-ghar',
    name: 'PM Surya Ghar Muft Bijli Yojana',
    ministry: 'MNRE',
    subsidy: '₹30,000 – ₹78,000 per household',
    eligibility: 'Residential consumers with existing electricity connection',
    capacity: 'Up to 10 kW rooftop solar',
    benefit: '300 units free electricity per month',
    link: 'https://pmsuryaghar.gov.in',
    flagship: true,
    color: 'var(--solar)',
  },
  {
    id: 'kusum',
    name: 'PM-KUSUM Scheme',
    ministry: 'MNRE',
    subsidy: '60% central + 30% state subsidy',
    eligibility: 'Farmers, FPOs, cooperatives, panchayats',
    capacity: '0.5 MW to 2 MW standalone solar plants',
    benefit: 'Sell surplus power to DISCOMs at guaranteed tariff',
    link: 'https://mnre.gov.in/solar/schemes',
    flagship: false,
    color: 'var(--grass)',
  },
  {
    id: 'grid-rooftop',
    name: 'Grid-Connected Rooftop Solar Phase II',
    ministry: 'MNRE',
    subsidy: '40% for ≤3 kW · 20% for 3–10 kW systems',
    eligibility: 'Residential, institutional, social sectors',
    capacity: 'Up to 500 kW',
    benefit: 'Net metering — sell excess power to the grid',
    link: 'https://solarrooftop.gov.in',
    flagship: false,
    color: 'var(--sky)',
  },
];

const STEPS = [
  { n: '01', title: 'Register Online',  desc: 'Create account on pmsuryaghar.gov.in with Aadhaar & electricity bill' },
  { n: '02', title: 'Technical Survey', desc: 'DISCOM technician visits to assess rooftop solar feasibility' },
  { n: '03', title: 'Install System',   desc: 'Choose empanelled vendor, install panels, set up net meter' },
  { n: '04', title: 'Claim Subsidy',    desc: 'Submit commissioning documents — subsidy credited directly to bank' },
];

function SubsidySlider() {
  const [kw, setKw] = useState(3);
  const sub  = kw <= 3 ? kw * 26000 : 78000 + Math.min(kw - 3, 7) * 13000;
  const cost = kw * 45000;
  const net  = cost - sub;
  const pct  = Math.round((sub / cost) * 100);

  return (
    <div className="card card-glow" style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 20 }}>
        <div className="page-tag">Live Calculator</div>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>
          PM Surya Ghar Subsidy Calculator
        </h3>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--text-2)', fontSize: 14 }}>System Size</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: 'var(--solar)' }}>{kw} kW</span>
        </div>
        <input type="range" min={1} max={10} step={0.5} value={kw} onChange={e => setKw(Number(e.target.value))}
          style={{ width: '100%', accentColor: '#f59e0b', cursor: 'pointer' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>
          <span>1 kW</span><span>10 kW</span>
        </div>
      </div>

      <div className="grid-3">
        {[
          { label: 'Install Cost',    value: `₹${cost.toLocaleString('en-IN')}`, color: 'var(--text-1)' },
          { label: `Subsidy (${pct}%)`, value: `₹${sub.toLocaleString('en-IN')}`, color: 'var(--grass)' },
          { label: 'Your Investment', value: `₹${net.toLocaleString('en-IN')}`,  color: 'var(--solar)' },
        ].map(item => (
          <div key={item.label} style={{ textAlign: 'center', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 12px' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', marginTop: 6 }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14, padding: '10px 14px', background: 'var(--deep)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)', lineHeight: 1.7 }}>
        ₹26,000/kW for first 3 kW · ₹13,000/kW for next 7 kW · Additional state subsidies may apply
      </div>
    </div>
  );
}

export default function Schemes() {
  const [schemes, setSchemes] = useState(FALLBACK_SCHEMES);
  const [selected, setSelected] = useState('pm-surya-ghar');

  useEffect(() => {
    api.schemes().then(res => {
      if (res.success && res.schemes?.length) setSchemes(res.schemes);
    }).catch(() => {});
  }, []);

  const sel = schemes.find(s => s.id === selected) || schemes[0];

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-tag">Central & State Subsidies</div>
        <h1 className="page-title">Government <span>Schemes</span></h1>
        <p className="page-sub">All active solar subsidy schemes in India — PM Surya Ghar, KUSUM, net metering, and more.</p>
      </div>

      <SubsidySlider />

      <div className="grid-2" style={{ marginBottom: 28 }}>
        {/* Scheme list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {schemes.map(s => (
            <div key={s.id} onClick={() => setSelected(s.id)}
              style={{
                background: selected === s.id ? 'var(--raised)' : 'var(--surface)',
                border: `1px solid ${selected === s.id ? (s.color || 'var(--solar-dim)') : 'var(--border)'}`,
                borderRadius: 14, padding: '18px 20px', cursor: 'pointer', transition: 'all .2s',
                borderLeft: `4px solid ${selected === s.id ? (s.color || 'var(--solar)') : 'var(--border)'}`,
              }}
              onMouseEnter={e => { if (selected !== s.id) e.currentTarget.style.borderColor = 'var(--text-3)'; }}
              onMouseLeave={e => { if (selected !== s.id) e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: s.color || 'var(--solar)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    {s.ministry}
                  </div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>{s.name}</div>
                </div>
                {s.flagship && <span className="badge badge-med">Flagship</span>}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--grass)', marginTop: 4 }}>{s.subsidy}</div>
            </div>
          ))}
        </div>

        {/* Scheme detail */}
        {sel && (
          <div className="card card-glow" style={{ borderColor: sel.color ? `${sel.color}44` : undefined }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: sel.color || 'var(--solar)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                {sel.ministry} · Official Scheme
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{sel.name}</h3>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
              {[
                { label: 'Subsidy Amount',  value: sel.subsidy },
                { label: 'Eligibility',     value: sel.eligibility },
                { label: 'System Capacity', value: sel.capacity },
                { label: 'Key Benefit',     value: sel.benefit },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {row.label}
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', lineHeight: 1.6 }}>{row.value}</div>
                </div>
              ))}
            </div>

            <a href={sel.link} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 24px', background: 'var(--solar-glow)',
                border: '1px solid var(--border-glow)', borderRadius: 12,
                fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--solar)',
                marginTop: 20, transition: 'all .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f59e0b22'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--solar-glow)'}>
              Apply on Official Portal →
            </a>
          </div>
        )}
      </div>

      {/* HOW TO APPLY */}
      <div className="card">
        <div style={{ marginBottom: 24 }}>
          <div className="page-tag">Step by Step</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>How to Apply — PM Surya Ghar</h3>
        </div>
        <div className="grid-4">
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ position: 'relative' }}>
              {i < STEPS.length - 1 && (
                <div style={{ position: 'absolute', top: 20, left: '100%', width: '100%', height: 2, background: 'linear-gradient(90deg, var(--solar-dim), transparent)', zIndex: 0, display: 'none' }} />
              )}
              <div style={{ background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 16px', height: '100%' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 800, color: 'var(--solar-glow)', marginBottom: 12, lineHeight: 1 }}>
                  {s.n}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)', lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
