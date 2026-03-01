const axios = require('axios');
require('dotenv').config();

const ML_URL = process.env.ML_SERVICE_URL || 'http://192.168.137.242:5001';

async function testMLConnection() {
  console.log('='.repeat(60));
  console.log('🔍 TESTING ML SERVICE CONNECTION');
  console.log('='.repeat(60));
  console.log(`ML Service URL: ${ML_URL}`);
  console.log('='.repeat(60));

  // Test 1: Basic connectivity
  console.log('\n📡 Test 1: Basic Connectivity');
  try {
    const response = await axios.get(ML_URL, { timeout: 5000 });
    console.log(`✅ Connected! Status: ${response.status}`);
    console.log('Response:', response.data);
  } catch (error) {
    console.log(`❌ Connection failed: ${error.message}`);
    if (error.code === 'ECONNREFUSED') {
      console.log('   Make sure ML server is running and firewall is open');
    }
  }

  // Test 2: Health check
  console.log('\n📡 Test 2: Health Check');
  try {
    const response = await axios.get(`${ML_URL}/`, { timeout: 5000 });
    console.log(`✅ Health check passed!`);
  } catch (error) {
    console.log(`❌ Health check failed: ${error.message}`);
  }

  // Test 3: Get regions
  console.log('\n📡 Test 3: Get Regions');
  try {
    const response = await axios.get(`${ML_URL}/regions`, { timeout: 5000 });
    console.log(`✅ Got regions! Found: ${response.data.count || 'unknown'} regions`);
    if (response.data.regions) {
      response.data.regions.slice(0, 3).forEach(r => {
        console.log(`   - ${r.name} (${r.zone})`);
      });
    }
  } catch (error) {
    console.log(`❌ Get regions failed: ${error.message}`);
  }

  // Test 4: Make a prediction
  console.log('\n📡 Test 4: Make Prediction');
  try {
    const response = await axios.post(`${ML_URL}/predict`, {
      region: 'Rajasthan-Jodhpur',
      date: '2024-06-15',
      temperature: 35,
      humidity: 30,
      cloud_cover: 10
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000
    });
    
    console.log(`✅ Prediction successful!`);
    if (response.data.prediction) {
      const pred = response.data.prediction;
      console.log(`   Intensity: ${pred.intensity} kWh/m²`);
      console.log(`   Sunshine: ${pred.sunshine_hours} hours`);
      console.log(`   Power: ${pred.power_output} kW`);
    }
  } catch (error) {
    console.log(`❌ Prediction failed: ${error.message}`);
    if (error.response) {
      console.log('   Response:', error.response.data);
    }
  }

  // Test 5: Batch prediction
  console.log('\n📡 Test 5: Batch Prediction');
  try {
    const response = await axios.post(`${ML_URL}/batch_predict`, {
      predictions: [
        { region: 'Rajasthan-Jodhpur', date: '2024-06-15' },
        { region: 'Tamil Nadu-Chennai', date: '2024-06-15' }
      ]
    }, { timeout: 5000 });
    
    console.log(`✅ Batch prediction successful! Count: ${response.data.count}`);
  } catch (error) {
    console.log(`❌ Batch prediction failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('TEST SUMMARY');
  console.log('='.repeat(60));
  console.log('✅ If all tests passed: ML service is ready!');
  console.log('❌ If any tests failed: Check:');
  console.log('   1. ML server is running (python app.py)');
  console.log('   2. ML server has host="0.0.0.0" configured');
  console.log('   3. Firewall on ML machine allows port 5001');
  console.log('   4. Both laptops are on same network');
  console.log('   5. You can ping 192.168.137.242');
}

// Run the test
testMLConnection();