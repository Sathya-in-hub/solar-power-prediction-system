// frontend/src/components/BatteryCalculator.js
import React, { useState } from 'react';

const BatteryCalculator = () => {
  const [formData, setFormData] = useState({
    dailyConsumption: 10,
    autonomyDays: 2,
    batteryType: 'lithium',
    depthOfDischarge: 80,
    systemVoltage: 48
  });

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'batteryType' ? value : parseFloat(value)
    }));
  };

  const calculateBattery = async () => {
    setLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      // Battery calculations
      const totalEnergyNeeded = formData.dailyConsumption * formData.autonomyDays;
      
      // Adjust for depth of discharge
      const dodFactor = formData.depthOfDischarge / 100;
      const rawCapacity = totalEnergyNeeded / dodFactor;
      
      // Add safety margin (20%)
      const recommendedCapacity = rawCapacity * 1.2;
      
      // Calculate number of batteries based on voltage
      let batteryConfig = [];
      if (formData.systemVoltage === 12) {
        batteryConfig = [
          { capacity: 100, count: Math.ceil(recommendedCapacity / 0.1) }, // 100Ah = 1.2kWh at 12V
          { capacity: 200, count: Math.ceil(recommendedCapacity / 0.24) }
        ];
      } else if (formData.systemVoltage === 24) {
        batteryConfig = [
          { capacity: 100, count: Math.ceil(recommendedCapacity / 0.24) },
          { capacity: 200, count: Math.ceil(recommendedCapacity / 0.48) }
        ];
      } else { // 48V
        batteryConfig = [
          { capacity: 100, count: Math.ceil(recommendedCapacity / 0.48) },
          { capacity: 200, count: Math.ceil(recommendedCapacity / 0.96) }
        ];
      }

      // Cost estimation (INR)
      const costPerKwh = formData.batteryType === 'lithium' ? 15000 : 8000;
      const estimatedCost = recommendedCapacity * costPerKwh;

      setResult({
        totalEnergyNeeded: totalEnergyNeeded.toFixed(1),
        rawCapacity: rawCapacity.toFixed(1),
        recommendedCapacity: recommendedCapacity.toFixed(1),
        batteryConfig,
        estimatedCost: estimatedCost.toFixed(0),
        cycles: formData.batteryType === 'lithium' ? 5000 : 1500,
        warranty: formData.batteryType === 'lithium' ? 10 : 5,
        monthlyMaintenance: formData.batteryType === 'lithium' ? 'Minimal' : 'Regular watering needed'
      });
      
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">🔋 Smart Battery Storage Calculator</h2>
      
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h5>Input Parameters</h5>
            </div>
            <div className="card-body">
              <form onSubmit={(e) => { e.preventDefault(); calculateBattery(); }}>
                <div className="mb-3">
                  <label className="form-label">Daily Energy Consumption (kWh/day)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="dailyConsumption"
                    value={formData.dailyConsumption}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    step="0.5"
                    required
                  />
                  <small className="text-muted">Average Indian home: 5-15 kWh/day</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Days of Autonomy Required</label>
                  <input
                    type="number"
                    className="form-control"
                    name="autonomyDays"
                    value={formData.autonomyDays}
                    onChange={handleChange}
                    min="1"
                    max="7"
                    step="0.5"
                    required
                  />
                  <small className="text-muted">Days without sun you want to cover</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Battery Type</label>
                  <select
                    className="form-control"
                    name="batteryType"
                    value={formData.batteryType}
                    onChange={handleChange}
                  >
                    <option value="lithium">Lithium-ion (Recommended)</option>
                    <option value="lead">Lead-Acid (Economy)</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Depth of Discharge (DoD) %</label>
                  <input
                    type="number"
                    className="form-control"
                    name="depthOfDischarge"
                    value={formData.depthOfDischarge}
                    onChange={handleChange}
                    min="30"
                    max="90"
                    step="5"
                  />
                  <small className="text-muted">
                    Lithium: 80-90%, Lead-Acid: 50%
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">System Voltage (V)</label>
                  <select
                    className="form-control"
                    name="systemVoltage"
                    value={formData.systemVoltage}
                    onChange={handleChange}
                  >
                    <option value="12">12V (Small systems)</option>
                    <option value="24">24V (Medium systems)</option>
                    <option value="48">48V (Large systems)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? 'Calculating...' : 'Calculate Battery Requirements'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          {result && (
            <div className="card">
              <div className="card-header bg-success text-white">
                <h5>Recommended Battery Bank</h5>
              </div>
              <div className="card-body">
                <div className="alert alert-info">
                  <strong>Total Energy Needed:</strong> {result.totalEnergyNeeded} kWh
                </div>
                
                <div className="alert alert-success">
                  <h6>Recommended Battery Capacity:</h6>
                  <h3>{result.recommendedCapacity} kWh</h3>
                </div>

                <h6 className="mt-4">Battery Configuration Options:</h6>
                <ul className="list-group mb-3">
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    100Ah Batteries
                    <span className="badge bg-primary rounded-pill">
                      {result.batteryConfig[0].count} units
                    </span>
                  </li>
                  <li className="list-group-item d-flex justify-content-between align-items-center">
                    200Ah Batteries
                    <span className="badge bg-primary rounded-pill">
                      {result.batteryConfig[1].count} units
                    </span>
                  </li>
                </ul>

                <div className="row mt-3">
                  <div className="col-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5>₹{(result.estimatedCost / 100000).toFixed(1)}L</h5>
                        <small>Estimated Cost</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="card bg-light">
                      <div className="card-body text-center">
                        <h5>{result.cycles}+</h5>
                        <small>Life Cycles</small>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <table className="table table-sm">
                    <tbody>
                      <tr>
                        <td>Warranty</td>
                        <td><strong>{result.warranty} years</strong></td>
                      </tr>
                      <tr>
                        <td>Maintenance</td>
                        <td><strong>{result.monthlyMaintenance}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="alert alert-warning mt-3">
                  <small>
                    ⚡ Recommendation: {result.batteryConfig[0].count > 10 
                      ? 'Consider higher voltage system for efficiency'
                      : 'Configuration matches standard solar installations'}
                  </small>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Battery Comparison Chart */}
      <div className="card mt-4">
        <div className="card-header bg-info text-white">
          <h5>Battery Type Comparison</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>Lithium-ion (Recommended)</h6>
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✓ Higher efficiency (95%)
                  <span className="badge bg-success">Best</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✓ Longer life (5000+ cycles)
                  <span className="badge bg-success">10+ years</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✓ Maintenance free
                  <span className="badge bg-success">✓</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✗ Higher cost
                  <span className="badge bg-warning">₹15k/kWh</span>
                </li>
              </ul>
            </div>
            <div className="col-md-6">
              <h6>Lead-Acid (Economy)</h6>
              <ul className="list-group">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✓ Lower cost
                  <span className="badge bg-success">₹8k/kWh</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✗ Lower efficiency (80%)
                  <span className="badge bg-danger">-15%</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✗ Shorter life (1500 cycles)
                  <span className="badge bg-danger">3-5 years</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  ✗ Requires maintenance
                  <span className="badge bg-danger">Monthly</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatteryCalculator;