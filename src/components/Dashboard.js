import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getSeasonalData, getRecentPredictions } from '../services/api';
import RiskAlerts from './RiskAlerts';
import CarbonEstimator from './CarbonEstimator';

const Dashboard = () => {
  const [seasonalData, setSeasonalData] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [seasonal, recent] = await Promise.all([
        getSeasonalData(),
        getRecentPredictions()
      ]);
      setSeasonalData(seasonal);
      setRecentPredictions(recent);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Solar Prediction Dashboard</h2>
      
      <div className="row">
        {/* Seasonal Forecast Chart */}
        <div className="col-md-8 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>Seasonal Solar Forecast</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={seasonalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="intensity" stroke="#8884d8" name="Solar Intensity (kWh/m²)" />
                  <Line type="monotone" dataKey="duration" stroke="#82ca9d" name="Sunshine Hours" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Risk Alerts */}
        <div className="col-md-4 mb-4">
          <RiskAlerts />
        </div>
      </div>

      <div className="row">
        {/* Recent Predictions */}
        <div className="col-md-6 mb-4">
          <div className="card">
            <div className="card-header">
              <h5>Recent Predictions</h5>
            </div>
            <div className="card-body">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={recentPredictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="region" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="power_output" fill="#8884d8" name="Power Output (kW)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Carbon Estimator */}
        <div className="col-md-6 mb-4">
          <CarbonEstimator />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;