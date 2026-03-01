// frontend/src/services/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const ML_API_URL = process.env.REACT_APP_ML_URL || 'http://localhost:5001';

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Call Error:', error);
    throw error;
  }
}

// Prediction APIs
export const getPrediction = async (formData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Prediction failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Prediction API Error:', error);
    throw error;
  }
};

export const getBulkPredictions = async (regions, date) => {
  return apiCall('/predict/bulk', 'POST', { regions, date });
};

// Region APIs
export const getRegionalData = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/regions`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching regional data:', error);
    return { regions: [] };
  }
};

export const getRegionDetails = async (regionId) => {
  return apiCall(`/regions/${regionId}`);
};

// Calculator APIs
export const calculateMicrogrid = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calculator/microgrid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    return await response.json();
  } catch (error) {
    console.error('Microgrid calculation error:', error);
    throw error;
  }
};

export const calculateBattery = async (params) => {
  try {
    const response = await fetch(`${API_BASE_URL}/calculator/battery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });
    return await response.json();
  } catch (error) {
    console.error('Battery calculation error:', error);
    throw error;
  }
};

// Seasonal Data (Mock data for demo)
export const getSeasonalData = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    { month: 'Jan', intensity: 4.2, duration: 8.5, temperature: 18, rainfall: 15 },
    { month: 'Feb', intensity: 4.8, duration: 9.2, temperature: 21, rainfall: 12 },
    { month: 'Mar', intensity: 5.5, duration: 10.1, temperature: 25, rainfall: 8 },
    { month: 'Apr', intensity: 6.2, duration: 11.0, temperature: 30, rainfall: 5 },
    { month: 'May', intensity: 6.5, duration: 11.5, temperature: 34, rainfall: 3 },
    { month: 'Jun', intensity: 5.8, duration: 10.8, temperature: 32, rainfall: 55 },
    { month: 'Jul', intensity: 4.5, duration: 9.0, temperature: 28, rainfall: 180 },
    { month: 'Aug', intensity: 4.2, duration: 8.8, temperature: 27, rainfall: 170 },
    { month: 'Sep', intensity: 4.8, duration: 9.2, temperature: 27, rainfall: 120 },
    { month: 'Oct', intensity: 5.2, duration: 9.8, temperature: 26, rainfall: 60 },
    { month: 'Nov', intensity: 4.8, duration: 9.0, temperature: 22, rainfall: 25 },
    { month: 'Dec', intensity: 4.0, duration: 8.2, temperature: 19, rainfall: 10 }
  ];
};

export const getRecentPredictions = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    { region: 'Jodhpur', power_output: 5.2, intensity: 6.1, duration: 11.2 },
    { region: 'Chennai', power_output: 4.8, intensity: 5.6, duration: 10.5 },
    { region: 'Mumbai', power_output: 3.9, intensity: 4.6, duration: 8.8 },
    { region: 'Delhi', power_output: 4.5, intensity: 5.3, duration: 9.6 },
    { region: 'Bengaluru', power_output: 4.3, intensity: 5.1, duration: 9.2 },
    { region: 'Ahmedabad', power_output: 5.0, intensity: 5.9, duration: 10.8 },
    { region: 'Kolkata', power_output: 3.8, intensity: 4.5, duration: 8.5 },
    { region: 'Hyderabad', power_output: 4.6, intensity: 5.4, duration: 9.8 }
  ];
};

// Risk Alerts
export const getRiskAlerts = async () => {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return [
    {
      region: 'Mumbai',
      level: 'danger',
      message: 'Heavy monsoon clouds expected (85% coverage)',
      recommendation: 'Plan battery backup and grid integration',
      severity: 'high',
      date: '2024-07-15'
    },
    {
      region: 'Delhi',
      level: 'warning',
      message: 'Winter fog reducing solar hours by 40%',
      recommendation: 'Schedule panel cleaning and maintenance',
      severity: 'medium',
      date: '2024-12-20'
    },
    {
      region: 'Chennai',
      level: 'success',
      message: 'Optimal solar conditions expected',
      recommendation: 'Peak generation expected, plan for excess',
      severity: 'low',
      date: '2024-06-10'
    },
    {
      region: 'Bengaluru',
      level: 'warning',
      message: 'Unseasonal rains forecasted',
      recommendation: 'Check drainage systems',
      severity: 'medium',
      date: '2024-08-05'
    }
  ];
};

// Carbon Calculator
export const calculateCarbonSavings = async (capacity, hours = 5.5) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const annualKWh = capacity * hours * 365 * 0.85;
  const co2Saved = annualKWh * 0.82 / 1000;
  
  return {
    annual_kwh: Math.round(annualKWh),
    co2_tonnes: co2Saved.toFixed(2),
    trees_equivalent: Math.round(co2Saved * 45),
    cars_removed: Math.round(co2Saved / 4.6), // Average car emits 4.6 tonnes/year
    coal_saved: Math.round(annualKWh * 0.0005) // tonnes of coal
  };
};

// Weather Integration
export const getWeatherData = async (city) => {
  try {
    const response = await fetch(`${API_BASE_URL}/weather/${city}`);
    return await response.json();
  } catch (error) {
    console.error('Weather API error:', error);
    return null;
  }
};

// Suitability Score
export const getSuitabilityScore = async (region) => {
  try {
    const response = await fetch(`${API_BASE_URL}/suitability/${region}`);
    return await response.json();
  } catch (error) {
    console.error('Suitability score error:', error);
    return { score: 75, factors: {} };
  }
};

// Export all functions as default object
export default {
  getPrediction,
  getBulkPredictions,
  getRegionalData,
  getRegionDetails,
  calculateMicrogrid,
  calculateBattery,
  getSeasonalData,
  getRecentPredictions,
  getRiskAlerts,
  calculateCarbonSavings,
  getWeatherData,
  getSuitabilityScore
};