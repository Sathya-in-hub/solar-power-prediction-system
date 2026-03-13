// routes/schemes.js  — brand new route
const express = require('express');
const router = express.Router();

const schemes = [
  {
    id: 'pm-surya-ghar',
    name: 'PM Surya Ghar Muft Bijli Yojana',
    ministry: 'MNRE',
    subsidy: '₹30,000–₹78,000 per household',
    eligibility: 'Residential consumers with existing electricity connection',
    capacity: 'Up to 3 kW rooftop',
    benefit: '300 units free electricity per month',
    link: 'https://pmsuryaghar.gov.in',
    active: true
  },
  {
    id: 'kusum',
    name: 'PM-KUSUM Scheme',
    ministry: 'MNRE',
    subsidy: '60% central + 30% state subsidy for farmers',
    eligibility: 'Farmers, FPOs, cooperatives',
    capacity: '0.5 MW to 2 MW standalone plants',
    benefit: 'Sell surplus power to DISCOMs at guaranteed price',
    link: 'https://mnre.gov.in/solar/schemes',
    active: true
  },
  {
    id: 'grid-connected',
    name: 'Grid-Connected Rooftop Solar Programme Phase II',
    ministry: 'MNRE',
    subsidy: '40% for ≤3 kW, 20% for 3–10 kW',
    eligibility: 'Residential, institutional, social sectors',
    capacity: 'Up to 500 kW',
    benefit: 'Net metering — sell excess to grid',
    link: 'https://solarrooftop.gov.in',
    active: true
  }
];

router.get('/', (req, res) => {
  res.json({ success: true, count: schemes.length, schemes });
});

router.get('/eligible/:capacityKw', (req, res) => {
  const kw = parseFloat(req.params.capacityKw);
  const eligible = schemes.filter(s => s.active);
  res.json({
    success: true,
    capacityKw: kw,
    eligibleSchemes: eligible,
    estimatedSubsidy: kw <= 3
      ? Math.round(kw * 26000)  // ₹26,000/kW for ≤3kW
      : Math.round(3 * 26000 + (kw - 3) * 13000)  // tiered
  });
});

module.exports = router;