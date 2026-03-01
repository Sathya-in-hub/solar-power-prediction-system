const mongoose = require('mongoose');

const regionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  state: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  elevation: {
    type: Number,
    required: true,
    min: 0
  },
  regionType: {
    type: String,
    enum: ['coastal', 'inland', 'desert', 'mountain'],
    required: true
  },
  suitabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  averageSolar: {
    type: Number,
    min: 0,
    max: 10,
    required: true
  },
  population: Number,
  area: Number,
  metadata: {
    type: Map,
    of: String
  }
});

regionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Region', regionSchema);