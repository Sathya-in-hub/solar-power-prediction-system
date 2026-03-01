const mongoose = require('mongoose');

const userQuerySchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'anonymous'
  },
  queryType: {
    type: String,
    enum: ['prediction', 'calculator', 'heatmap', 'seasonal'],
    required: true
  },
  region: {
    type: String,
    required: true
  },
  parameters: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  result: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  ipAddress: String,
  userAgent: String,
  timestamp: {
    type: Date,
    default: Date.now
  },
  responseTime: Number, // in milliseconds
  status: {
    type: String,
    enum: ['success', 'error', 'pending'],
    default: 'success'
  }
});

// Index for analytics
userQuerySchema.index({ queryType: 1, timestamp: -1 });
userQuerySchema.index({ region: 1, timestamp: -1 });

module.exports = mongoose.model('UserQuery', userQuerySchema);