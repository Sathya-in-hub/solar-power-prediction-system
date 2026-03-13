// routes/calculator.js  — full implementation
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const carbonCalculator = require('../utils/carbonCalculator');

// POST /api/calculator/roi
router.post('/roi', [
  body('panelCount').isInt({ min: 1, max: 10000 }).withMessage('Panel count required'),
  body('panelWatts').optional().isFloat({ min: 100, max: 700 }).default(400),
  body('regionSolar').isFloat({ min: 1, max: 9 }).withMessage('Solar irradiance required (kWh/m²/day)'),
  body('electricityRate').optional().isFloat({ min: 1 }).default(7), // ₹/kWh
  body('installCostPerKw').optional().isFloat({ min: 10000 }).default(45000), // ₹/kW India avg
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const {
    panelCount,
    panelWatts = 400,
    regionSolar,
    electricityRate = 7,
    installCostPerKw = 45000,
    subsidyPercent = 30  // PM Surya Ghar subsidy
  } = req.body;

  const systemKw = (panelCount * panelWatts) / 1000;
  const dailyKwh = systemKw * regionSolar * 0.8;  // 80% system efficiency
  const annualKwh = dailyKwh * 365;
  const installCost = systemKw * installCostPerKw;
  const subsidyAmount = installCost * (subsidyPercent / 100);
  const netCost = installCost - subsidyAmount;
  const annualSavings = annualKwh * electricityRate;
  const paybackYears = netCost / annualSavings;
  const twentyFiveYearSavings = annualSavings * 25 - netCost;

  const carbon = carbonCalculator.calculateFullImpact(annualKwh, 'annual');

  res.json({
    success: true,
    system: {
      panels: panelCount,
      capacityKw: systemKw.toFixed(2),
      dailyGenerationKwh: dailyKwh.toFixed(2),
      annualGenerationKwh: Math.round(annualKwh)
    },
    financial: {
      installCostINR: Math.round(installCost),
      subsidyINR: Math.round(subsidyAmount),
      netCostINR: Math.round(netCost),
      annualSavingsINR: Math.round(annualSavings),
      paybackYears: paybackYears.toFixed(1),
      roi25YearsINR: Math.round(twentyFiveYearSavings),
      monthlyEMI: Math.round(netCost / (paybackYears * 12))
    },
    environmental: carbon.summary,
    equivalencies: carbon.equivalencies
  });
});

// GET /api/calculator/carbon/:kwh
router.get('/carbon/:kwh', (req, res) => {
  const kwh = parseFloat(req.params.kwh);
  if (isNaN(kwh) || kwh <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid kWh value' });
  }
  const impact = carbonCalculator.calculateFullImpact(kwh, 'annual');
  res.json({ success: true, ...impact });
});

module.exports = router;