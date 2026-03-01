import React, { useState } from 'react';

const CarbonEstimator = () => {
  const [capacity, setCapacity] = useState(5);
  const [savings, setSavings] = useState(null);

  const calculateSavings = () => {
    // Grid emission factor: 0.82 kg CO2/kWh
    // Annual generation: capacity * 5.5 hours * 365 days * 0.85 efficiency
    const annualKWh = capacity * 5.5 * 365 * 0.85;
    const co2Saved = annualKWh * 0.82 / 1000; // Convert to tonnes
    
    setSavings({
      annual_kwh: Math.round(annualKWh),
      co2_tonnes: co2Saved.toFixed(2),
      trees_equivalent: Math.round(co2Saved * 45) // 45 trees absorb 1 tonne CO2/year
    });
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5>🌱 Carbon Emission Reduction Estimator</h5>
      </div>
      <div className="card-body">
        <div className="mb-3">
          <label className="form-label">Solar Panel Capacity (kW)</label>
          <input 
            type="number"
            className="form-control"
            value={capacity}
            onChange={(e) => setCapacity(parseFloat(e.target.value))}
            min="1"
            max="100"
          />
        </div>
        
        <button className="btn btn-success mb-3" onClick={calculateSavings}>
          Calculate Savings
        </button>
        
        {savings && (
          <div className="mt-3">
            <h6>Annual Savings:</h6>
            <ul className="list-group">
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Energy Generated
                <span className="badge bg-primary rounded-pill">{savings.annual_kwh} kWh</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                CO2 Emissions Saved
                <span className="badge bg-success rounded-pill">{savings.co2_tonnes} tonnes</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center">
                Equivalent to Planting
                <span className="badge bg-info rounded-pill">{savings.trees_equivalent} trees</span>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonEstimator;