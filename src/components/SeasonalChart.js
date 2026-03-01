// frontend/src/components/SeasonalChart.js
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Area
} from 'recharts';
import { getSeasonalData } from '../services/api';

const SeasonalChart = () => {
  const [seasonData, setSeasonData] = useState([]);
  const [selectedView, setSelectedView] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    fetchSeasonalData();
  }, []);

  const fetchSeasonalData = async () => {
    try {
      const data = await getSeasonalData();
      setSeasonData(data);
      
      // Calculate seasonal averages
      const seasons = {
        summer: data.filter(d => ['Mar', 'Apr', 'May', 'Jun'].includes(d.month)),
        winter: data.filter(d => ['Nov', 'Dec', 'Jan', 'Feb'].includes(d.month)),
        monsoon: data.filter(d => ['Jul', 'Aug', 'Sep', 'Oct'].includes(d.month))
      };
      
      setComparisonData({
        summer: {
          avgIntensity: (seasons.summer.reduce((acc, curr) => acc + curr.intensity, 0) / seasons.summer.length).toFixed(2),
          avgDuration: (seasons.summer.reduce((acc, curr) => acc + curr.duration, 0) / seasons.summer.length).toFixed(2)
        },
        winter: {
          avgIntensity: (seasons.winter.reduce((acc, curr) => acc + curr.intensity, 0) / seasons.winter.length).toFixed(2),
          avgDuration: (seasons.winter.reduce((acc, curr) => acc + curr.duration, 0) / seasons.winter.length).toFixed(2)
        },
        monsoon: {
          avgIntensity: (seasons.monsoon.reduce((acc, curr) => acc + curr.intensity, 0) / seasons.monsoon.length).toFixed(2),
          avgDuration: (seasons.monsoon.reduce((acc, curr) => acc + curr.duration, 0) / seasons.monsoon.length).toFixed(2)
        }
      });
    } catch (error) {
      console.error('Error fetching seasonal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeasonColor = (season) => {
    switch(season) {
      case 'summer': return '#ff7300';
      case 'winter': return '#0088fe';
      case 'monsoon': return '#00c49f';
      default: return '#8884d8';
    }
  };

  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Seasonal Solar Analysis</h2>
      
      {/* View Selector */}
      <div className="btn-group mb-4" role="group">
        <button 
          className={`btn ${selectedView === 'monthly' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setSelectedView('monthly')}
        >
          Monthly View
        </button>
        <button 
          className={`btn ${selectedView === 'seasonal' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setSelectedView('seasonal')}
        >
          Seasonal Comparison
        </button>
        <button 
          className={`btn ${selectedView === 'trend' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setSelectedView('trend')}
        >
          Yearly Trend
        </button>
      </div>

      {/* Monthly View */}
      {selectedView === 'monthly' && (
        <div className="card mb-4">
          <div className="card-header">
            <h5>Monthly Solar Intensity & Duration</h5>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={seasonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="intensity" fill="#8884d8" name="Solar Intensity (kWh/m²)" />
                <Line yAxisId="right" type="monotone" dataKey="duration" stroke="#ff7300" name="Sunshine Hours" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Seasonal Comparison */}
      {selectedView === 'seasonal' && comparisonData && (
        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card text-white bg-warning">
              <div className="card-header">
                <h5>Summer (Mar-Jun)</h5>
              </div>
              <div className="card-body">
                <h2>{comparisonData.summer.avgIntensity} kWh/m²</h2>
                <p>Average Solar Intensity</p>
                <h4>{comparisonData.summer.avgDuration} hours</h4>
                <p>Average Daily Duration</p>
                <div className="progress mt-3">
                  <div 
                    className="progress-bar bg-success" 
                    style={{width: `${(comparisonData.summer.avgIntensity / 7) * 100}%`}}
                  >
                    Peak Season
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card text-white bg-info">
              <div className="card-header">
                <h5>Winter (Nov-Feb)</h5>
              </div>
              <div className="card-body">
                <h2>{comparisonData.winter.avgIntensity} kWh/m²</h2>
                <p>Average Solar Intensity</p>
                <h4>{comparisonData.winter.avgDuration} hours</h4>
                <p>Average Daily Duration</p>
                <div className="progress mt-3">
                  <div 
                    className="progress-bar bg-primary" 
                    style={{width: `${(comparisonData.winter.avgIntensity / 7) * 100}%`}}
                  >
                    Moderate Season
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-4">
            <div className="card text-white bg-success">
              <div className="card-header">
                <h5>Monsoon (Jul-Oct)</h5>
              </div>
              <div className="card-body">
                <h2>{comparisonData.monsoon.avgIntensity} kWh/m²</h2>
                <p>Average Solar Intensity</p>
                <h4>{comparisonData.monsoon.avgDuration} hours</h4>
                <p>Average Daily Duration</p>
                <div className="progress mt-3">
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: `${(comparisonData.monsoon.avgIntensity / 7) * 100}%`}}
                  >
                    Low Season
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trend Analysis */}
      {selectedView === 'trend' && (
        <div className="card">
          <div className="card-header">
            <h5>5-Year Solar Intensity Trend</h5>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={[
                  { year: '2020', summer: 6.2, winter: 4.5, monsoon: 4.8 },
                  { year: '2021', summer: 6.3, winter: 4.6, monsoon: 4.7 },
                  { year: '2022', summer: 6.1, winter: 4.4, monsoon: 4.9 },
                  { year: '2023', summer: 6.4, winter: 4.7, monsoon: 4.6 },
                  { year: '2024', summer: 6.5, winter: 4.8, monsoon: 4.5 }
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="summer" stroke="#ff7300" name="Summer" />
                <Line type="monotone" dataKey="winter" stroke="#0088fe" name="Winter" />
                <Line type="monotone" dataKey="monsoon" stroke="#00c49f" name="Monsoon" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-muted mt-3">
              <small>* Trend shows slight increase in summer intensity due to climate patterns</small>
            </p>
          </div>
        </div>
      )}

      {/* Seasonal Recommendations */}
      <div className="card mt-4">
        <div className="card-header bg-primary text-white">
          <h5>🌞 Seasonal Recommendations</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <div className="alert alert-warning">
                <strong>Summer:</strong> Peak production months. Schedule maintenance in off-peak hours. Consider selling excess power to grid.
              </div>
            </div>
            <div className="col-md-4">
              <div className="alert alert-info">
                <strong>Winter:</strong> Reduced production due to shorter days. Ensure batteries are fully charged. Clean panels regularly.
              </div>
            </div>
            <div className="col-md-4">
              <div className="alert alert-success">
                <strong>Monsoon:</strong> Unpredictable production. Have backup power ready. Check for water damage protection.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonalChart;