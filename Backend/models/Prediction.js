const mongoose = require('mongoose');

const predictionSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: true
  },
  solarIntensity: {
    type: Number,
    required: true,
    min: 0,
    max: 10
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  powerOutput: {
    type: Number,
    required: true,
    min: 0
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  weatherData: {
    cloudCover: Number,
    temperature: Number,
    humidity: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Auto-delete after 24 hours
  }
});

// Compound index for efficient queries
predictionSchema.index({ region: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Prediction', predictionSchema);