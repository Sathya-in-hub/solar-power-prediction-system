const express = require('express');
const router = express.Router();
const Weather = require('../models/Weather');
const axios = require('axios');

// Get current weather for a region
router.get('/current/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    // Try to get from cache first (last hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const cachedWeather = await Weather.findOne({
      region,
      timestamp: { $gte: oneHourAgo }
    }).sort({ timestamp: -1 });

    if (cachedWeather) {
      return res.json({ success: true, data: cachedWeather, cached: true });
    }

    // In production, call actual weather API
    // For demo, generate simulated data
    const weatherData = {
      region,
      cloudCover: Math.random() * 40 + 20, // 20-60%
      temperature: Math.random() * 15 + 20, // 20-35°C
      humidity: Math.random() * 30 + 50, // 50-80%
      timestamp: new Date()
    };

    // Save to database
    const weather = new Weather(weatherData);
    await weather.save();

    res.json({ success: true, data: weather, cached: false });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get weather forecast
router.get('/forecast/:region', async (req, res) => {
  try {
    const { region } = req.params;
    const days = parseInt(req.query.days) || 7;

    // Generate mock forecast data
    const forecast = [];
    for (let i = 0; i < days; i++) {
      forecast.push({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        cloudCover: Math.random() * 40 + 20,
        temperature: Math.random() * 15 + 20,
        humidity: Math.random() * 30 + 50
      });
    }

    res.json({ success: true, data: forecast });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;