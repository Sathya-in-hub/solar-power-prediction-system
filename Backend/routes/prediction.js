const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Prediction = require('../models/Prediction');
const Region = require('../models/Region');
const mlClient = require('../services/mlClient'); // Import ML client

// Validation middleware
const validatePrediction = [
  body('region').notEmpty().withMessage('Region is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('panelCapacity').optional().isFloat({ min: 1, max: 50 })
];

// Get prediction
router.post('/', validatePrediction, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { region, date, panelCapacity = 5 } = req.body;

    console.log(`🔮 Prediction requested for ${region} on ${date}`);

    // Check cache first
    const cachedPrediction = await Prediction.findOne({
      region,
      date: new Date(date)
    });

    if (cachedPrediction) {
      console.log('📦 Returning cached prediction');
      return res.json({
        success: true,
        prediction: cachedPrediction,
        cached: true
      });
    }

    // Get region data from database or create basic region info
    let regionData = await Region.findOne({ name: region });
    
    // If region not in DB, create basic info
    if (!regionData) {
      console.log('⚠️ Region not in database, using default values');
      regionData = {
        name: region,
        latitude: 20.5937,
        longitude: 78.9629,
        regionType: 'inland'
      };
    }

    // Get weather data (mock for now)
    const weatherData = {
      cloudCover: Math.floor(Math.random() * 40 + 20),
      temperature: Math.floor(Math.random() * 15 + 20),
      humidity: Math.floor(Math.random() * 30 + 50)
    };

    // Call ML service
    console.log('🤖 Calling ML service...');
    const mlResponse = await mlClient.predict({
      region: region,
      date: date,
      temperature: weatherData.temperature,
      humidity: weatherData.humidity,
      cloud_cover: weatherData.cloudCover
    });

    if (!mlResponse.success) {
      throw new Error('ML prediction failed');
    }

    const prediction = mlResponse.prediction;

    // Create new prediction record
    const newPrediction = new Prediction({
      region,
      date: new Date(date),
      solarIntensity: prediction.solar_intensity,
      duration: prediction.duration,
      powerOutput: prediction.power_output,
      confidence: prediction.confidence || 0.9,
      weatherData,
      metadata: {
        source: mlResponse.mock ? 'mock-fallback' : 'ml-service',
        risk_level: prediction.risk_level,
        suitability_score: prediction.suitability_score
      }
    });

    await newPrediction.save();
    console.log('✅ Prediction saved to database');

    res.json({
      success: true,
      prediction: newPrediction,
      cached: false,
      source: mlResponse.mock ? 'mock' : 'ml-service'
    });

  } catch (error) {
    console.error('❌ Prediction error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get prediction',
      error: error.message
    });
  }
});

// Test ML connection endpoint
router.get('/test-ml', async (req, res) => {
  try {
    const health = await mlClient.healthCheck();
    
    // Test a sample prediction
    let testPrediction = null;
    if (health.status === 'healthy') {
      testPrediction = await mlClient.predict({
        region: 'Rajasthan-Jodhpur',
        date: '2024-06-15',
        temperature: 35,
        humidity: 30,
        cloud_cover: 10
      });
    }
    
    res.json({
      success: true,
      mlServer: health,
      testPrediction: testPrediction,
      config: {
        url: process.env.ML_SERVICE_URL || 'http://192.168.137.242:5001',
        usingEnvVar: !!process.env.ML_SERVICE_URL
      }
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      config: {
        url: process.env.ML_SERVICE_URL || 'http://192.168.137.242:5001',
        usingEnvVar: !!process.env.ML_SERVICE_URL
      }
    });
  }
});

// Get seasonal data
router.get('/seasonal/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    // Mock seasonal data
    const seasonalData = {
      region,
      summer: { avg: 6.2, months: ['Mar', 'Apr', 'May'] },
      monsoon: { avg: 4.1, months: ['Jun', 'Jul', 'Aug', 'Sep'] },
      winter: { avg: 5.3, months: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb'] },
      monthly: [
        { month: 'Jan', value: 5.0 },
        { month: 'Feb', value: 5.5 },
        { month: 'Mar', value: 6.1 },
        { month: 'Apr', value: 6.5 },
        { month: 'May', value: 6.0 },
        { month: 'Jun', value: 4.5 },
        { month: 'Jul', value: 3.8 },
        { month: 'Aug', value: 3.9 },
        { month: 'Sep', value: 4.2 },
        { month: 'Oct', value: 5.1 },
        { month: 'Nov', value: 5.3 },
        { month: 'Dec', value: 4.9 }
      ]
    };

    res.json({ success: true, data: seasonalData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;