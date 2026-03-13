// routes/heatmap.js
const express = require('express');
const router = express.Router();
const Region = require('../models/Region');
const nasaPower = require('../services/nasaPowerService');

// GET /api/heatmap/india — returns grid points for choropleth map
router.get('/india', async (req, res) => {
  try {
    const regions = await Region.find({}, 'name state latitude longitude averageSolar suitabilityScore regionType');

    // Normalize scores for color mapping (0–1)
    const maxSolar = Math.max(...regions.map(r => r.averageSolar));
    const minSolar = Math.min(...regions.map(r => r.averageSolar));

    const heatmapData = regions.map(r => ({
      name: r.name,
      state: r.state,
      lat: r.latitude,
      lon: r.longitude,
      solar: r.averageSolar,
      score: r.suitabilityScore,
      type: r.regionType,
      intensity: ((r.averageSolar - minSolar) / (maxSolar - minSolar)).toFixed(3),
      color: getSolarColor(r.averageSolar)
    }));

    res.json({
      success: true,
      totalRegions: heatmapData.length,
      range: { min: minSolar, max: maxSolar, unit: 'kWh/m²/day' },
      data: heatmapData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

function getSolarColor(kwhPerDay) {
  if (kwhPerDay >= 6.5) return '#d62728';  // Excellent - deep red
  if (kwhPerDay >= 6.0) return '#ff7f0e';  // Very good - orange
  if (kwhPerDay >= 5.5) return '#ffd700';  // Good - yellow
  if (kwhPerDay >= 5.0) return '#2ca02c';  // Moderate - green
  return '#1f77b4';                         // Low - blue
}

module.exports = router;