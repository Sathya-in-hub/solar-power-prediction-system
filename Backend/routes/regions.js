const express = require('express');
const router = express.Router();
const Region = require('../models/Region');

// Get all regions with their scores
router.get('/scores', async (req, res) => {
  try {
    const regions = await Region.find({}, 'name state suitabilityScore averageSolar');
    
    // Convert to GeoJSON format for heatmap
    const geoJson = {
      type: 'FeatureCollection',
      features: regions.map(region => ({
        type: 'Feature',
        properties: {
          name: region.name,
          state: region.state,
          suitabilityScore: region.suitabilityScore,
          avgSolar: region.averageSolar
        },
        geometry: {
          type: 'Point',
          coordinates: [region.longitude, region.latitude]
        }
      }))
    };

    res.json(geoJson);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get region details
router.get('/:regionName', async (req, res) => {
  try {
    const region = await Region.findOne({ name: req.params.regionName });
    if (!region) {
      return res.status(404).json({ success: false, message: 'Region not found' });
    }
    res.json({ success: true, data: region });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Initialize regions with sample data
router.post('/init', async (req, res) => {
  try {
    const sampleRegions = [
      {
        name: 'Pune, Maharashtra',
        state: 'Maharashtra',
        latitude: 18.5204,
        longitude: 73.8567,
        elevation: 560,
        regionType: 'inland',
        suitabilityScore: 82,
        averageSolar: 5.9
      },
      {
        name: 'Delhi, NCR',
        state: 'Delhi',
        latitude: 28.6139,
        longitude: 77.2090,
        elevation: 200,
        regionType: 'inland',
        suitabilityScore: 75,
        averageSolar: 5.4
      },
      {
        name: 'Chennai, Tamil Nadu',
        state: 'Tamil Nadu',
        latitude: 13.0827,
        longitude: 80.2707,
        elevation: 6,
        regionType: 'coastal',
        suitabilityScore: 78,
        averageSolar: 5.6
      },
      {
        name: 'Jaipur, Rajasthan',
        state: 'Rajasthan',
        latitude: 26.9124,
        longitude: 75.7873,
        elevation: 431,
        regionType: 'desert',
        suitabilityScore: 92,
        averageSolar: 6.8
      }
    ];

    await Region.deleteMany({});
    await Region.insertMany(sampleRegions);

    res.json({ success: true, message: 'Regions initialized', count: sampleRegions.length });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;