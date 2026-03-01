import React, { useState, useEffect } from 'react';
import { getRiskAlerts } from '../services/api';

const RiskAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    const data = await getRiskAlerts();
    setAlerts(data);
  };

  return (
    <div className="card">
      <div className="card-header bg-warning">
        <h5>⚠️ Seasonal Risk Alerts</h5>
      </div>
      <div className="card-body">
        {alerts.map((alert, index) => (
          <div key={index} className={`alert alert-${alert.level} mb-2`}>
            <strong>{alert.region}</strong>
            <p className="mb-0">{alert.message}</p>
            <small>{alert.recommendation}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RiskAlerts;