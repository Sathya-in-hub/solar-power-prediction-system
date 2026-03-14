# SuryaCast Frontend

Solar Intelligence Platform for India — hackathon-winning UI for the solar prediction backend.

## Setup

```bash
npm install
npm start
```

## Connect to backend

Create a `.env` file:
```
REACT_APP_API_URL=http://YOUR_BACKEND_IP:5000
```

If running on same machine: `REACT_APP_API_URL=http://localhost:5000`
If your friend's laptop: `REACT_APP_API_URL=http://192.168.x.x:5000`

## Features

- **Dashboard** — Live solar intensity, monthly chart, weather conditions
- **AI Predictor** — ML-powered forecasts per region/date with intensity gauge
- **Solar Map** — Interactive India heatmap, regional ranking
- **ROI Calculator** — 25-year projections with PM Surya Ghar subsidy
- **Govt Schemes** — PM Surya Ghar, KUSUM, Grid-Connected Phase II

## Pages

| Route | Component | API calls |
|-------|-----------|-----------|
| Dashboard | `pages/Dashboard.js` | `POST /api/predict` |
| Predictor | `pages/Predictor.js` | `POST /api/predict` |
| Solar Map | `pages/HeatMap.js` | `GET /api/heatmap/india` |
| Calculator | `pages/Calculator.js` | `POST /api/calculator/roi` |
| Schemes | `pages/Schemes.js` | `GET /api/schemes` |

All API calls are in `utils/api.js`.
