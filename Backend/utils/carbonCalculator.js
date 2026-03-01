class CarbonCalculator {
  constructor() {
    // Grid emission factors by region (kg CO2/kWh)
    this.gridEmissionFactors = {
      national: 0.82,
      north: 0.85,
      south: 0.75,
      east: 0.88,
      west: 0.79,
      northeast: 0.72
    };

    // Equivalency factors
    this.equivalents = {
      treesPlanted: 0.02, // tons CO2 per tree per year
      carsOffRoad: 4.6, // tons CO2 per car per year
      homesElectricity: 7.2, // tons CO2 per home per year
      coalPower: 0.001, // tons CO2 per kWh from coal
      gasoline: 2.3, // kg CO2 per liter
      smartphones: 0.07 // tons CO2 per smartphone charged
    };
  }

  /**
   * Calculate CO2 savings from solar generation
   * @param {number} generationKWh - Solar generation in kWh
   * @param {string} region - Region code (national, north, south, etc.)
   * @returns {number} CO2 savings in kg
   */
  calculateSavings(generationKWh, region = 'national') {
    const emissionFactor = this.gridEmissionFactors[region] || this.gridEmissionFactors.national;
    return generationKWh * emissionFactor;
  }

  /**
   * Calculate detailed carbon impact
   * @param {number} generationKWh - Solar generation in kWh
   * @param {string} period - daily, monthly, annual
   * @param {string} region - Region code
   * @returns {Object} Detailed impact metrics
   */
  calculateFullImpact(generationKWh, period = 'annual', region = 'national') {
    // Adjust for period
    let annualGeneration = generationKWh;
    if (period === 'daily') {
      annualGeneration = generationKWh * 365;
    } else if (period === 'monthly') {
      annualGeneration = generationKWh * 12;
    }

    const co2SavingsKg = this.calculateSavings(annualGeneration, region);
    const co2SavingsTons = co2SavingsKg / 1000;

    return {
      summary: {
        generationKWh: Math.round(generationKWh),
        period,
        annualizedKWh: Math.round(annualGeneration),
        co2SavingsKg: Math.round(co2SavingsKg),
        co2SavingsTons: parseFloat(co2SavingsTons.toFixed(2))
      },
      equivalencies: {
        treesPlanted: Math.round(co2SavingsTons / this.equivalents.treesPlanted),
        carsOffRoad: parseFloat((co2SavingsTons / this.equivalents.carsOffRoad).toFixed(1)),
        homesPowered: parseFloat((co2SavingsTons / this.equivalents.homesElectricity).toFixed(1)),
        coalAvoided: {
          kg: Math.round(co2SavingsKg / this.equivalents.coalPower),
          tons: parseFloat((co2SavingsTons / this.equivalents.coalPower / 1000).toFixed(1))
        },
        gasolineSaved: {
          liters: Math.round(co2SavingsKg / this.equivalents.gasoline),
          gallons: Math.round(co2SavingsKg / this.equivalents.gasoline * 0.264172)
        },
        smartphonesCharged: Math.round(co2SavingsTons / this.equivalents.smartphones * 1000)
      },
      environmentalBenefits: {
        waterSaved: Math.round(annualGeneration * 2.5), // Liters of water saved (thermal plants use 2.5L/kWh)
        landPreserved: parseFloat((annualGeneration / 1000000 * 0.5).toFixed(2)), // Acres preserved
        wasteAvoided: Math.round(annualGeneration * 0.01) // kg of nuclear/coal waste avoided
      },
      financialImpact: {
        carbonCredits: parseFloat((co2SavingsTons * 25).toFixed(2)), // Assuming $25/ton carbon credit
        socialCost: parseFloat((co2SavingsTons * 50).toFixed(2)), // Social cost of carbon at $50/ton
        externalitiesSaved: parseFloat((co2SavingsTons * 100).toFixed(2)) // Total externalities saved
      },
      visualization: {
        co2Equivalent: this.getVisualizationScale(co2SavingsTons),
        progressBars: this.getProgressBars(co2SavingsTons)
      }
    };
  }

  /**
   * Compare different energy sources
   * @param {number} generationKWh 
   * @returns {Object} Comparison data
   */
  compareEnergySources(generationKWh) {
    const sources = {
      coal: { emissionFactor: 1.0, name: 'Coal' },
      naturalGas: { emissionFactor: 0.5, name: 'Natural Gas' },
      diesel: { emissionFactor: 0.8, name: 'Diesel' },
      solar: { emissionFactor: 0.05, name: 'Solar' },
      wind: { emissionFactor: 0.02, name: 'Wind' },
      nuclear: { emissionFactor: 0.01, name: 'Nuclear' }
    };

    const comparison = {};
    for (const [key, source] of Object.entries(sources)) {
      comparison[key] = {
        name: source.name,
        emissionsKg: generationKWh * source.emissionFactor,
        emissionsTons: (generationKWh * source.emissionFactor) / 1000,
        percentOfSolar: ((source.emissionFactor / sources.solar.emissionFactor) * 100).toFixed(0)
      };
    }

    return comparison;
  }

  /**
   * Calculate cumulative impact over time
   * @param {number} dailyGeneration 
   * @param {number} years 
   * @returns {Object} Cumulative impact
   */
  calculateCumulativeImpact(dailyGeneration, years = 25) {
    const totalGeneration = dailyGeneration * 365 * years;
    const totalSavings = this.calculateSavings(totalGeneration);
    const savingsTons = totalSavings / 1000;

    return {
      totalGeneration: Math.round(totalGeneration),
      totalSavingsTons: Math.round(savingsTons),
      averageAnnualTons: Math.round(savingsTons / years),
      overLifetime: {
        trees: Math.round(savingsTons / this.equivalents.treesPlanted),
        cars: parseFloat((savingsTons / this.equivalents.carsOffRoad).toFixed(1)),
        homes: parseFloat((savingsTons / this.equivalents.homesElectricity).toFixed(1))
      },
      timeline: this.generateTimeline(dailyGeneration, years)
    };
  }

  // Helper methods
  getVisualizationScale(tonsCO2) {
    if (tonsCO2 < 1) return `${Math.round(tonsCO2 * 1000)} kg`;
    if (tonsCO2 < 1000) return `${Math.round(tonsCO2)} tons`;
    return `${(tonsCO2 / 1000).toFixed(1)} kilotons`;
  }

  getProgressBars(tonsCO2) {
    const benchmarks = {
      parisAgreement: 1000, // 1 kiloton target
      corporateGoal: 500,
      communityGoal: 100,
      individualGoal: 10
    };

    const bars = {};
    for (const [key, target] of Object.entries(benchmarks)) {
      bars[key] = {
        target,
        current: Math.min(tonsCO2, target),
        percentage: Math.min(100, (tonsCO2 / target) * 100).toFixed(1)
      };
    }
    return bars;
  }

  generateTimeline(dailyGeneration, years) {
    const timeline = [];
    let cumulative = 0;

    for (let year = 1; year <= years; year++) {
      const yearGeneration = dailyGeneration * 365;
      cumulative += yearGeneration;
      
      timeline.push({
        year,
        generation: Math.round(yearGeneration),
        cumulativeGeneration: Math.round(cumulative),
        savingsTons: Math.round(this.calculateSavings(yearGeneration) / 1000),
        cumulativeSavingsTons: Math.round(this.calculateSavings(cumulative) / 1000)
      });
    }

    return timeline;
  }
}

module.exports = new CarbonCalculator();