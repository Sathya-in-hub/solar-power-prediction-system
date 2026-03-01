const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    index: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  cloudCover: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  temperature: {
    type: Number,
    required: true,
    min: -50,
    max: 60
  },
  humidity: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  windSpeed: {
    type: Number,
    min: 0
  },
  pressure: {
    type: Number,
    min: 800,
    max: 1200
  },
  source: {
    type: String,
    default: 'OpenWeather'
  }
});

// Auto-delete old weather data after 7 days
weatherSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

module.exports = mongoose.model('Weather', weatherSchema);