const axios = require('axios');

class MLClient {
  constructor() {
    this.baseURL = process.env.ML_SERVICE_URL || 'http://192.168.137.242:5001';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  async predict(data) {
    try {
      console.log(`📡 Calling ML service at ${this.baseURL}/predict`);
      console.log('Request data:', data);
      
      const startTime = Date.now();
      
      // Format data to match what ML model expects
      const requestData = {
        region: data.region,
        date: data.date,
        temperature: data.temperature || 25,
        humidity: data.humidity || 60,
        cloud_cover: data.cloud_cover || 30
      };
      
      const response = await this.client.post('/predict', requestData);
      
      const duration = Date.now() - startTime;
      console.log(`✅ ML response received in ${duration}ms`);
      
      // Transform ML response to match your backend format
      if (response.data && response.data.prediction) {
        return {
          success: true,
          prediction: {
            solar_intensity: response.data.prediction.intensity,
            duration: response.data.prediction.sunshine_hours,
            power_output: response.data.prediction.power_output,
            confidence: 0.92,
            risk_level: response.data.prediction.risk_level,
            suitability_score: response.data.prediction.suitability_score
          }
        };
      }
      
      return response.data;
      
    } catch (error) {
      console.error('❌ ML service error:', {
        message: error.message,
        url: this.baseURL,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Return fallback mock data if ML fails
      console.log('⚠️ Using fallback mock data');
      return this.getMockPrediction(data);
    }
  }

  async batchPredict(predictions) {
    try {
      const response = await this.client.post('/batch_predict', {
        predictions: predictions
      });
      return response.data;
    } catch (error) {
      console.error('Batch prediction error:', error.message);
      throw error;
    }
  }

  async getRegions() {
    try {
      const response = await this.client.get('/regions');
      return response.data;
    } catch (error) {
      console.error('Get regions error:', error.message);
      return { 
        success: false, 
        regions: [
          { name: 'Rajasthan-Jodhpur', zone: 'Desert' },
          { name: 'Tamil Nadu-Chennai', zone: 'Coastal' },
          { name: 'Maharashtra-Mumbai', zone: 'Coastal' }
        ]
      };
    }
  }

  async healthCheck() {
    try {
      const response = await this.client.get('/');
      return { 
        status: 'healthy', 
        data: response.data,
        url: this.baseURL 
      };
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error.message,
        url: this.baseURL
      };
    }
  }

  // Fallback mock data generator
  getMockPrediction(data) {
    const region = data.region || 'Unknown';
    let baseIntensity = 5.5;
    
    if (region.includes('Rajasthan')) baseIntensity = 6.2;
    if (region.includes('Chennai')) baseIntensity = 5.6;
    if (region.includes('Mumbai')) baseIntensity = 5.2;
    
    const cloudFactor = 1 - (data.cloud_cover || 30) / 100 * 0.3;
    const intensity = baseIntensity * cloudFactor;
    
    return {
      success: true,
      prediction: {
        solar_intensity: parseFloat(intensity.toFixed(2)),
        duration: parseFloat((10 - (data.cloud_cover || 30) / 10).toFixed(1)),
        power_output: parseFloat((intensity * 5 * 0.75).toFixed(2)),
        confidence: 0.85,
        source: 'mock-fallback'
      },
      mock: true
    };
  }
}

module.exports = new MLClient();