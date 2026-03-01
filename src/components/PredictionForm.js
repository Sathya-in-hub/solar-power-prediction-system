import React, { useState } from 'react';
import { getPrediction } from '../services/api';

const PredictionForm = () => {
  const [formData, setFormData] = useState({
    region: '',
    date: '',
    temperature: 25,
    humidity: 60,
    cloudCover: 20
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const regions = [
    'Tamil Nadu-Chennai',
    'Rajasthan-Jodhpur',
    'Gujarat-Gandhinagar',
    'Maharashtra-Mumbai',
    'Karnataka-Bengaluru',
    'Uttar Pradesh-Lucknow',
    'West Bengal-Kolkata',
    'Delhi-NCR'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const prediction = await getPrediction(formData);
      setResult(prediction);
    } catch (err) {
      setError('Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h5>Solar Prediction Parameters</h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Region</label>
                  <select 
                    className="form-control"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Region</option>
                    {regions.map(region => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Temperature (°C)</label>
                  <input 
                    type="number"
                    className="form-control"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleChange}
                    min="-10"
                    max="50"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Humidity (%)</label>
                  <input 
                    type="number"
                    className="form-control"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Cloud Cover (%)</label>
                  <input 
                    type="number"
                    className="form-control"
                    name="cloudCover"
                    value={formData.cloudCover}
                    onChange={handleChange}
                    min="0"
                    max="100"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Predicting...' : 'Get Prediction'}
                </button>
              </form>
              
              {error && <div className="alert alert-danger mt-3">{error}</div>}
            </div>
          </div>
        </div>

        <div className="col-md-6">
          {result && (
            <div className="card">
              <div className="card-header">
                <h5>Prediction Results</h5>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-6 mb-3">
                    <div className="card bg-primary text-white">
                      <div className="card-body text-center">
                        <h3>{result.intensity} kWh/m²</h3>
                        <p>Solar Intensity</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-6 mb-3">
                    <div className="card bg-success text-white">
                      <div className="card-body text-center">
                        <h3>{result.duration} hours</h3>
                        <p>Duration</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 mb-3">
                    <div className="card bg-warning">
                      <div className="card-body text-center">
                        <h3>{result.power_output} kW</h3>
                        <p>Power Output (per kW panel)</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {result.recommendations && (
                  <div className="mt-3">
                    <h6>Recommendations:</h6>
                    <ul className="list-group">
                      <li className="list-group-item">{result.recommendations.battery}</li>
                      <li className="list-group-item">{result.recommendations.panels}</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;