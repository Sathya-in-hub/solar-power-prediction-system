const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const UserQuery = require('../models/UserQuery');
const carbonCalculator = require('../utils/carbonCalculator');

// Battery Storage Calculator
router.post('/battery',
  [
    body('dailyOutput').isFloat({ min: 0 }).withMessage('Daily output must be positive'),
    body('autonomyHours').optional().isInt({ min: 1, max: 72 }).withMessage('Autonomy hours must be between 1-72'),
    body('backupPercentage').optional().isFloat({ min: 0, max: 100 }).withMessage('Backup percentage must be 0-100')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { 
        dailyOutput, 
        autonomyHours = 12, 
        backupPercentage = 100,
        region = 'Unknown'
      } = req.body;

      // Battery calculation logic
      const depthOfDischarge = 0.8; // 80% DoD for lithium batteries
      const efficiency = 0.9; // 90% round-trip efficiency
      const systemVoltage = 48; // 48V system
      
      // Calculate required capacity in kWh
      const dailyEnergyNeeded = dailyOutput * (backupPercentage / 100);
      const requiredCapacity = (dailyEnergyNeeded * (autonomyHours / 24)) / (depthOfDischarge * efficiency);
      
      // Standard battery sizes (in kWh)
      const standardBatteries = [2.4, 5, 7.5, 10, 13.5, 20];
      const recommendedBattery = standardBatteries.find(b => b >= requiredCapacity) || 
                                 Math.ceil(requiredCapacity / 5) * 5;
      
      // Calculate number of batteries
      const batterySize = 5; // 5kWh per battery
      const numberOfBatteries = Math.ceil(requiredCapacity / batterySize);
      
      // Cost estimation (₹)
      const costPerKwh = 25000; // ₹25,000 per kWh
      const estimatedCost = requiredCapacity * costPerKwh;
      
      const result = {
        requiredCapacity: parseFloat(requiredCapacity.toFixed(2)),
        recommendedBattery: parseFloat(recommendedBattery.toFixed(2)),
        numberOfBatteries,
        autonomyHours,
        backupPercentage,
        specifications: {
          depthOfDischarge: `${depthOfDischarge * 100}%`,
          efficiency: `${efficiency * 100}%`,
          systemVoltage: `${systemVoltage}V`,
          chemistry: 'Lithium-Ion (LiFePO4)',
          cycleLife: '5000+ cycles',
          warranty: '10 years'
        },
        estimatedCost: {
          total: Math.round(estimatedCost),
          perKwh: costPerKwh,
          currency: 'INR'
        },
        alternatives: [
          {
            type: 'Lead-Acid',
            requiredCapacity: (requiredCapacity / 0.5).toFixed(2), // 50% DoD
            estimatedCost: Math.round(requiredCapacity * 15000), // ₹15,000 per kWh
            cycleLife: '1500 cycles',
            warranty: '3 years'
          }
        ]
      };

      // Save query for analytics
      const userQuery = new UserQuery({
        queryType: 'calculator',
        subType: 'battery',
        region,
        parameters: { dailyOutput, autonomyHours, backupPercentage },
        result
      });
      await userQuery.save();

      res.json({
        success: true,
        data: result,
        message: 'Battery recommendation generated successfully'
      });

    } catch (error) {
      console.error('Battery calculator error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to calculate battery requirements',
        error: error.message 
      });
    }
});

// Rural Microgrid Calculator
router.post('/microgrid',
  [
    body('numberOfHouses').isInt({ min: 1, max: 1000 }).withMessage('Number of houses must be between 1-1000'),
    body('consumptionPerHouse').optional().isFloat({ min: 1, max: 50 }).withMessage('Consumption must be 1-50 kWh/day'),
    body('peakSunHours').optional().isFloat({ min: 3, max: 8 }).withMessage('Peak sun hours must be 3-8'),
    body('includeBattery').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { 
        numberOfHouses, 
        consumptionPerHouse = 5, // Default 5 kWh/day per house
        peakSunHours = 5.5, // Default 5.5 hours
        includeBattery = true,
        region = 'Unknown'
      } = req.body;

      // Calculations
      const totalDailyDemand = numberOfHouses * consumptionPerHouse;
      const systemEfficiency = 0.75; // 75% overall system efficiency
      const panelEfficiency = 0.18; // 18% panel efficiency
      const panelWattage = 0.4; // 400W panels in kW
      
      // Required solar capacity
      const requiredCapacity = totalDailyDemand / (peakSunHours * systemEfficiency);
      
      // Number of panels
      const numberOfPanels = Math.ceil(requiredCapacity / panelWattage);
      
      // Area required (assuming 2m² per 400W panel)
      const areaRequired = numberOfPanels * 2; // square meters
      
      // Cost estimation
      const costPerWatt = 30; // ₹30 per watt
      const panelCost = requiredCapacity * 1000 * costPerWatt;
      const installationCost = panelCost * 0.3; // 30% of panel cost
      const totalCost = panelCost + installationCost;
      
      // Battery recommendation if needed
      let batteryRecommendation = null;
      if (includeBattery) {
        const batteryCapacity = totalDailyDemand * 0.5; // 50% backup
        batteryRecommendation = {
          capacity: batteryCapacity.toFixed(2),
          numberOfBatteries: Math.ceil(batteryCapacity / 5),
          estimatedCost: Math.round(batteryCapacity * 25000)
        };
      }
      
      // Environmental impact
      const annualGeneration = totalDailyDemand * 365;
      const co2Savings = carbonCalculator.calculateSavings(annualGeneration);
      
      const result = {
        summary: {
          numberOfHouses,
          totalDailyDemand: totalDailyDemand.toFixed(2),
          requiredCapacity: requiredCapacity.toFixed(2),
          numberOfPanels,
          areaRequired: areaRequired.toFixed(0)
        },
        solarArray: {
          capacity: requiredCapacity.toFixed(2),
          panels: numberOfPanels,
          panelType: `${panelWattage * 1000}W Mono PERC`,
          area: `${areaRequired} m²`,
          layout: `${Math.ceil(Math.sqrt(numberOfPanels))} x ${Math.ceil(numberOfPanels / Math.ceil(Math.sqrt(numberOfPanels)))}`
        },
        costBreakdown: {
          panels: Math.round(panelCost),
          installation: Math.round(installationCost),
          battery: batteryRecommendation ? batteryRecommendation.estimatedCost : 0,
          total: Math.round(totalCost + (batteryRecommendation?.estimatedCost || 0)),
          costPerHouse: Math.round((totalCost + (batteryRecommendation?.estimatedCost || 0)) / numberOfHouses),
          currency: 'INR'
        },
        battery: batteryRecommendation,
        environmentalImpact: {
          annualGeneration: Math.round(annualGeneration),
          co2Savings: co2Savings,
          treesEquivalent: Math.round(co2Savings * 0.05), // Each tree absorbs ~20kg CO2/year
          carsOffRoad: Math.round(co2Savings / 4600) // Average car emits 4.6 tons/year
        },
        financials: {
          paybackPeriod: (totalCost / (annualGeneration * 6)).toFixed(1), // Assuming ₹6/kWh savings
          lifetimeSavings: Math.round(annualGeneration * 6 * 25), // 25 years
          roi: `${((annualGeneration * 6 * 25 / totalCost - 1) * 100).toFixed(1)}%`
        }
      };

      // Save query
      const userQuery = new UserQuery({
        queryType: 'calculator',
        subType: 'microgrid',
        region,
        parameters: { numberOfHouses, consumptionPerHouse, peakSunHours, includeBattery },
        result
      });
      await userQuery.save();

      res.json({
        success: true,
        data: result,
        message: 'Microgrid calculation completed'
      });

    } catch (error) {
      console.error('Microgrid calculator error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to calculate microgrid requirements',
        error: error.message 
      });
    }
});

// Carbon Emission Calculator
router.post('/carbon-savings',
  [
    body('solarGeneration').isFloat({ min: 0 }).withMessage('Solar generation must be positive'),
    body('period').optional().isIn(['daily', 'monthly', 'annual']).withMessage('Invalid period')
  ],
  async (req, res) => {
    try {
      const { solarGeneration, period = 'annual', region = 'Unknown' } = req.body;

      const result = carbonCalculator.calculateFullImpact(solarGeneration, period);

      // Save query
      const userQuery = new UserQuery({
        queryType: 'calculator',
        subType: 'carbon',
        region,
        parameters: { solarGeneration, period },
        result
      });
      await userQuery.save();

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Carbon calculator error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Failed to calculate carbon savings',
        error: error.message 
      });
    }
});

// Solar Suitability Score Calculator
router.post('/suitability-score',
  [
    body('latitude').isFloat({ min: 8, max: 37 }),
    body('longitude').isFloat({ min: 68, max: 97 }),
    body('landArea').optional().isFloat({ min: 0 }),
    body('gridDistance').optional().isFloat({ min: 0 })
  ],
  async (req, res) => {
    try {
      const { 
        latitude, 
        longitude, 
        landArea = 1000,
        gridDistance = 10,
        region = 'Unknown'
      } = req.body;

      // Calculate suitability score based on multiple factors
      const solarRadiationScore = calculateSolarRadiationScore(latitude, longitude);
      const landAvailabilityScore = calculateLandScore(landArea);
      const gridProximityScore = calculateGridScore(gridDistance);
      const weatherReliabilityScore = 75; // Would come from historical data
      const seasonalConsistencyScore = 70; // Would come from historical data

      // Weighted average
      const weights = {
        solarRadiation: 0.4,
        seasonalConsistency: 0.2,
        weatherReliability: 0.15,
        landAvailability: 0.15,
        gridProximity: 0.1
      };

      const totalScore = 
        solarRadiationScore * weights.solarRadiation +
        seasonalConsistencyScore * weights.seasonalConsistency +
        weatherReliabilityScore * weights.weatherReliability +
        landAvailabilityScore * weights.landAvailability +
        gridProximityScore * weights.gridProximity;

      const result = {
        totalScore: Math.round(totalScore),
        components: {
          solarRadiation: Math.round(solarRadiationScore),
          seasonalConsistency: seasonalConsistencyScore,
          weatherReliability: weatherReliabilityScore,
          landAvailability: Math.round(landAvailabilityScore),
          gridProximity: Math.round(gridProximityScore)
        },
        rating: getRating(totalScore),
        recommendations: getRecommendations(totalScore, landArea),
        suitableFor: getSuitableApplications(totalScore)
      };

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
});

// Helper functions
function calculateSolarRadiationScore(lat, lon) {
  // Simplified model - in production, would use actual solar radiation data
  const baseRadiation = 5.0; // kWh/m²/day
  const latFactor = 1 - Math.abs(lat - 23) / 30; // Optimal near Tropic of Cancer
  return Math.min(100, baseRadiation * 15 * latFactor);
}

function calculateLandScore(area) {
  if (area >= 10000) return 100;
  if (area >= 5000) return 80;
  if (area >= 1000) return 60;
  if (area >= 500) return 40;
  if (area >= 100) return 20;
  return 10;
}

function calculateGridScore(distance) {
  if (distance <= 1) return 100;
  if (distance <= 5) return 80;
  if (distance <= 10) return 60;
  if (distance <= 20) return 40;
  if (distance <= 50) return 20;
  return 10;
}

function getRating(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  if (score >= 20) return 'Fair';
  return 'Poor';
}

function getRecommendations(score, area) {
  if (score >= 80) {
    return ['Ideal for large-scale solar farm', 'Consider grid-connected system', 'High ROI expected'];
  } else if (score >= 60) {
    return ['Suitable for rooftop solar', 'Consider hybrid system', 'Good for community project'];
  } else if (score >= 40) {
    return ['Consider off-grid solution', 'May need battery backup', 'Evaluate wind-solar hybrid'];
  } else {
    return ['Not recommended for solar', 'Consider other renewables', 'Evaluate energy efficiency first'];
  }
}

function getSuitableApplications(score) {
  if (score >= 70) return ['Utility-scale solar', 'Commercial rooftop', 'Solar farms'];
  if (score >= 50) return ['Residential rooftop', 'Community microgrid', 'Solar water pumps'];
  return ['Small off-grid systems', 'Solar lighting', 'Backup power only'];
}

module.exports = router;