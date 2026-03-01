// frontend/src/components/MicrogridCalculator.js
import React, { useState } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const MicrogridCalculator = () => {
  const [formData, setFormData] = useState({
    houses: 50,
    consumptionPerHouse: 5,
    commercialBuildings: 5,
    commercialConsumption: 20,
    schools: 2,
    healthCenters: 1,
    peakSunHours: 5.5,
    panelEfficiency: 85
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseFloat(value)
    }));
  };

  const calculateMicrogrid = () => {
    setLoading(true);

    // Calculate total demand
    const residentialDemand = formData.houses * formData.consumptionPerHouse;
    const commercialDemand = formData.commercialBuildings * formData.commercialConsumption;
    const communityDemand = (formData.schools * 15) + (formData.healthCenters * 30); // Schools: 15kWh, Health: 30kWh
    
    const totalDailyDemand = residentialDemand + commercialDemand + communityDemand;
    
    // Calculate losses and efficiency
    const efficiencyFactor = formData.panelEfficiency / 100;
    const systemLosses = 0.15; // 15% system losses
    const effectiveSunHours = formData.peakSunHours * (1 - systemLosses);
    
    // Panel requirements
    const requiredPanelCapacity = totalDailyDemand / (effectiveSunHours * efficiencyFactor);
    const panelsNeeded = Math.ceil(requiredPanelCapacity / 0.33); // 330W panels
    
    // Battery requirements (2 days autonomy)
    const batteryCapacity = totalDailyDemand * 2 * 1.2; // 20% safety margin
    const batteriesNeeded = Math.ceil(batteryCapacity / 4.8); // 48V 100Ah = 4.8kWh
    
    // Inverter sizing
    const peakDemand = totalDailyDemand * 0.3; // 30% of daily demand as peak
    const inverterCapacity = peakDemand * 1.25; // 25% safety margin
    
    // Land requirements
    const areaPerKW = 6.6; // square meters
    const totalArea = requiredPanelCapacity * areaPerKW;
    
    // Cost estimation (INR)
    const panelCost = requiredPanelCapacity * 35000;
    const batteryCost = batteryCapacity * 12000;
    const inverterCost = inverterCapacity * 8000;
    const installationCost = (panelCost + batteryCost + inverterCost) * 0.2;
    const totalCost = panelCost + batteryCost + inverterCost + installationCost;
    
    // Carbon savings
    const annualGeneration = totalDailyDemand * 365;
    const co2Saved = annualGeneration * 0.82 / 1000; // tonnes
    
    setTimeout(() => {
      setResult({
        totalDailyDemand: Math.round(totalDailyDemand),
        requiredPanelCapacity: Math.round(requiredPanelCapacity * 10) / 10,
        panelsNeeded,
        batteryCapacity: Math.round(batteryCapacity * 10) / 10,
        batteriesNeeded,
        inverterCapacity: Math.round(inverterCapacity * 10) / 10,
        totalArea: Math.round(totalArea),
        totalCost: Math.round(totalCost / 100000) / 10, // In lakhs
        panelCost: Math.round(panelCost / 100000) / 10,
        batteryCost: Math.round(batteryCost / 100000) / 10,
        inverterCost: Math.round(inverterCost / 100000) / 10,
        installationCost: Math.round(installationCost / 100000) / 10,
        annualGeneration: Math.round(annualGeneration),
        co2Saved: Math.round(co2Saved * 10) / 10,
        
        // Breakdown for charts
        demandBreakdown: [
          { name: 'Residential', value: residentialDemand },
          { name: 'Commercial', value: commercialDemand },
          { name: 'Community', value: communityDemand }
        ],
        costBreakdown: [
          { name: 'Solar Panels', value: panelCost },
          { name: 'Batteries', value: batteryCost },
          { name: 'Inverters', value: inverterCost },
          { name: 'Installation', value: installationCost }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="container mt-4">
      <h2 className="mb-4">🌍 Rural Microgrid Calculator</h2>
      
      <div className="row">
        <div className="col-md-5">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5>Community Parameters</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); calculateMicrogrid(); }}>
                <h6 className="mt-3">Residential</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Number of Houses</label>
                    <input
                      type="number"
                      className="form-control"
                      name="houses"
                      value={formData.houses}
                      onChange={handleChange}
                      min="1"
                      max="1000"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Consumption/House (kWh)</label>
                    <input
                      type="number"
                      className="form-control"
                      name="consumptionPerHouse"
                      value={formData.consumptionPerHouse}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      step="0.5"
                    />
                  </div>
                </div>

                <h6 className="mt-3">Commercial</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Commercial Buildings</label>
                    <input
                      type="number"
                      className="form-control"
                      name="commercialBuildings"
                      value={formData.commercialBuildings}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Consumption/Building</label>
                    <input
                      type="number"
                      className="form-control"
                      name="commercialConsumption"
                      value={formData.commercialConsumption}
                      onChange={handleChange}
                      min="5"
                      max="50"
                    />
                  </div>
                </div>

                <h6 className="mt-3">Community Facilities</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Schools</label>
                    <input
                      type="number"
                      className="form-control"
                      name="schools"
                      value={formData.schools}
                      onChange={handleChange}
                      min="0"
                      max="20"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Health Centers</label>
                    <input
                      type="number"
                      className="form-control"
                      name="healthCenters"
                      value={formData.healthCenters}
                      onChange={handleChange}
                      min="0"
                      max="10"
                    />
                  </div>
                </div>

                <h6 className="mt-3">Technical Parameters</h6>
                <div className="row mb-3">
                  <div className="col-6">
                    <label className="form-label">Peak Sun Hours</label>
                    <input
                      type="number"
                      className="form-control"
                      name="peakSunHours"
                      value={formData.peakSunHours}
                      onChange={handleChange}
                      min="3"
                      max="8"
                      step="0.1"
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label">Panel Efficiency %</label>
                    <input
                      type="number"
                      className="form-control"
                      name="panelEfficiency"
                      value={formData.panelEfficiency}
                      onChange={handleChange}
                      min="15"
                      max="22"
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100 mt-3"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Microgrid Requirements'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-7">
          {result && (
            <>
              <div className="card mb-3">
                <div className="card-header bg-success text-white">
                  <h5>Microgrid Specifications</h5>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-6">
                      <div className="alert alert-info">
                        <strong>Total Daily Demand</strong>
                        <h3>{result.totalDailyDemand} kWh</h3>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="alert alert-success">
                        <strong>Annual Generation</strong>
                        <h3>{result.annualGeneration} kWh</h3>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-3">
                    <div className="col-4">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h5>{result.requiredPanelCapacity} kW</h5>
                          <small>Solar Panels</small>
                          <p className="mt-2">{result.panelsNeeded} units</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h5>{result.batteryCapacity} kWh</h5>
                          <small>Battery Bank</small>
                          <p className="mt-2">{result.batteriesNeeded} units</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="card bg-light">
                        <div className="card-body text-center">
                          <h5>{result.inverterCapacity} kW</h5>
                          <small>Inverter</small>
                          <p className="mt-2">Pure Sine Wave</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-info text-white">
                      <h6>Demand Breakdown</h6>
                    </div>
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={result.demandBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={entry => `${entry.name}: ${entry.value}kWh`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {result.demandBreakdown.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <div className="card mb-3">
                    <div className="card-header bg-warning">
                      <h6>Cost Breakdown (₹ Lakhs)</h6>
                    </div>
                    <div className="card-body">
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={result.costBreakdown}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header bg-primary text-white">
                  <h5>Project Summary</h5>
                </div>
                <div className="card-body">
                  <table className="table table-bordered">
                    <tbody>
                      <tr>
                        <td>Total Project Cost</td>
                        <td><strong>₹ {result.totalCost} Lakhs</strong></td>
                        <td className="text-success">-</td>
                      </tr>
                      <tr>
                        <td>Land Required</td>
                        <td><strong>{result.totalArea} m²</strong></td>
                        <td className="text-muted">≈ {Math.round(result.totalArea / 4047 * 10) / 10} acres</td>
                      </tr>
                      <tr>
                        <td>CO₂ Savings/Year</td>
                        <td><strong>{result.co2Saved} tonnes</strong></td>
                        <td className="text-success">≈ {Math.round(result.co2Saved * 45)} trees</td>
                      </tr>
                      <tr>
                        <td>Payback Period</td>
                        <td><strong>5-7 years</strong></td>
                        <td className="text-info">Estimated</td>
                      </tr>
                    </tbody>
                  </table>

                  <div className="alert alert-success mt-3">
                    <strong>🌱 Social Impact:</strong> This microgrid will provide reliable power to {formData.houses} households, 
                    {formData.commercialBuildings} commercial establishments, and serve {formData.schools} schools and 
                    {formData.healthCenters} health centers, improving quality of life and enabling economic activities.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MicrogridCalculator;