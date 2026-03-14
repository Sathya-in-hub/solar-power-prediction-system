const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

const post = (path, body) => req(path, { method: 'POST', body: JSON.stringify(body) });

// Named exports used by Dashboard, Predictor, etc.
export const predictSolar     = (body)     => post('/api/predict', body);
export const getMonthlySolar  = (body)     => post('/api/solar/monthly', body);
export const getRealtimeSolar = (body)     => post('/api/solar/realtime', body);
export const getRegions       = ()         => req('/api/regions');
export const getHistory       = ()         => req('/api/predictions/history');
export const getSchemes       = ()         => req('/api/schemes');

// Object form used by Schemes, HeatMap, Calculator pages
export const api = {
  predict:       (body) => post('/api/predict', body),
  regions:       ()     => req('/api/regions'),
  heatmap:       ()     => req('/api/heatmap/india'),
  schemes:       ()     => req('/api/schemes'),
  schemesElig:   (kw)   => req(`/api/schemes/eligible/${kw}`),
  calcRoi:       (body) => post('/api/calculator/roi', body),
  calcCarbon:    (kwh)  => req(`/api/calculator/carbon/${kwh}`),
  monthlySolar:  (body) => post('/api/solar/monthly', body),
  realtimeSolar: (body) => post('/api/solar/realtime', body),
  history:       ()     => req('/api/predictions/history'),
  health:        ()     => req('/health'),
};

export default api;
