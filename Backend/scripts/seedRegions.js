// scripts/seedRegions.js
const mongoose = require('mongoose');
const Region = require('../models/Region');
require('dotenv').config();

const indianRegions = [
  { name: 'Rajasthan-Jodhpur', state: 'Rajasthan', latitude: 26.28, longitude: 73.02, elevation: 231, regionType: 'desert', suitabilityScore: 95, averageSolar: 6.4 },
  { name: 'Rajasthan-Jaisalmer', state: 'Rajasthan', latitude: 26.91, longitude: 70.91, elevation: 225, regionType: 'desert', suitabilityScore: 98, averageSolar: 6.8 },
  { name: 'Gujarat-Kutch', state: 'Gujarat', latitude: 23.73, longitude: 69.86, elevation: 17, regionType: 'desert', suitabilityScore: 92, averageSolar: 6.2 },
  { name: 'Tamil Nadu-Chennai', state: 'Tamil Nadu', latitude: 13.08, longitude: 80.27, elevation: 6, regionType: 'coastal', suitabilityScore: 78, averageSolar: 5.6 },
  { name: 'Maharashtra-Mumbai', state: 'Maharashtra', latitude: 19.07, longitude: 72.87, elevation: 11, regionType: 'coastal', suitabilityScore: 72, averageSolar: 5.2 },
  { name: 'Karnataka-Bangalore', state: 'Karnataka', latitude: 12.97, longitude: 77.59, elevation: 920, regionType: 'inland', suitabilityScore: 80, averageSolar: 5.8 },
  { name: 'Telangana-Hyderabad', state: 'Telangana', latitude: 17.38, longitude: 78.48, elevation: 542, regionType: 'inland', suitabilityScore: 82, averageSolar: 5.9 },
  { name: 'Madhya Pradesh-Bhopal', state: 'Madhya Pradesh', latitude: 23.26, longitude: 77.41, elevation: 527, regionType: 'inland', suitabilityScore: 85, averageSolar: 6.0 },
  { name: 'Uttarakhand-Dehradun', state: 'Uttarakhand', latitude: 30.32, longitude: 78.03, elevation: 435, regionType: 'mountain', suitabilityScore: 68, averageSolar: 4.8 },
  { name: 'Punjab-Amritsar', state: 'Punjab', latitude: 31.63, longitude: 74.87, elevation: 234, regionType: 'inland', suitabilityScore: 75, averageSolar: 5.1 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/solar_prediction');
  await Region.deleteMany({});
  await Region.insertMany(indianRegions);
  console.log(`✅ Seeded ${indianRegions.length} Indian regions`);
  mongoose.disconnect();
}

seed().catch(console.error);