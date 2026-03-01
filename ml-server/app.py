# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load models at startup
print("Loading ML models...")
try:
    model = joblib.load('models/solar_model.pkl')
    sunshine_model = joblib.load('models/sunshine_model.pkl')
    scaler = joblib.load('models/scaler.pkl')
    feature_cols = joblib.load('models/feature_columns.pkl')
    metadata = joblib.load('models/model_metadata.pkl')
    print("✅ Models loaded successfully!")
    print(f"Model MAE: {metadata['rf_mae']:.3f} kWh/m²")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    model = sunshine_model = scaler = None

# Region database (simplified)
REGIONS = {
    'Rajasthan-Jodhpur': {'lat': 26.2389, 'lon': 73.0243, 'zone': 'Desert'},
    'Tamil Nadu-Chennai': {'lat': 13.0827, 'lon': 80.2707, 'zone': 'Coastal'},
    'Maharashtra-Mumbai': {'lat': 19.0760, 'lon': 72.8777, 'zone': 'Coastal'},
    'Gujarat-Ahmedabad': {'lat': 23.0225, 'lon': 72.5714, 'zone': 'Inland'},
    'Karnataka-Bengaluru': {'lat': 12.9716, 'lon': 77.5946, 'zone': 'Inland'},
    'Delhi-NCR': {'lat': 28.6139, 'lon': 77.2090, 'zone': 'Inland'},
    'West Bengal-Kolkata': {'lat': 22.5726, 'lon': 88.3639, 'zone': 'Coastal'},
    'Maharashtra-Pune': {'lat': 18.5204, 'lon': 73.8567, 'zone': 'Inland'}
}

def calculate_day_of_year(date_str):
    """Convert date to day of year"""
    date = datetime.strptime(date_str, '%Y-%m-%d')
    return date.timetuple().tm_yday

def prepare_features(region, date_str, temperature, humidity, cloud_cover):
    """Prepare features for prediction"""
    # Get region data
    region_info = REGIONS.get(region, {
        'lat': 20.5937, 
        'lon': 78.9629, 
        'zone': 'Inland'
    })
    
    # Calculate day of year
    day_of_year = calculate_day_of_year(date_str)
    
    # Get month
    month = datetime.strptime(date_str, '%Y-%m-%d').month
    
    # Create feature array (must match training features)
    features = pd.DataFrame([[
        region_info['lat'],           # latitude
        region_info['lon'],           # longitude
        month,                        # month
        day_of_year,                  # day_of_year
        temperature,                  # temperature
        humidity,                      # humidity
        cloud_cover,                   # cloud_cover
        500,                           # altitude (default)
        300,                           # distance_from_coast (default)
        0.4                            # aerosol_depth (default)
    ]], columns=feature_cols)
    
    return features

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Solar Prediction ML Service',
        'models_loaded': model is not None,
        'endpoints': ['/', '/regions', '/predict', '/batch_predict']
    })

@app.route('/regions', methods=['GET'])
def get_regions():
    """Get list of supported regions"""
    regions_list = []
    for name, info in REGIONS.items():
        regions_list.append({
            'name': name,
            'zone': info['zone'],
            'latitude': info['lat'],
            'longitude': info['lon']
        })
    
    return jsonify({
        'count': len(regions_list),
        'regions': regions_list
    })

@app.route('/predict', methods=['POST'])
def predict():
    """Make solar prediction"""
    try:
        data = request.json
        
        # Validate input
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        region = data.get('region')
        date = data.get('date')
        temperature = data.get('temperature', 30)
        humidity = data.get('humidity', 60)
        cloud_cover = data.get('cloud_cover', 30)
        
        if not region or not date:
            return jsonify({'error': 'Region and date are required'}), 400
        
        # Prepare features
        features = prepare_features(region, date, temperature, humidity, cloud_cover)
        
        # Scale features
        features_scaled = scaler.transform(features)
        
        # Make predictions
        intensity = model.predict(features_scaled)[0]
        sunshine_hours = sunshine_model.predict(features_scaled)[0]
        
        # Calculate power output (for 1kW system)
        power_output = intensity * 0.75  # 75% efficiency
        
        # Calculate suitability score (0-100)
        suitability = min(100, max(0, (intensity / 8.5) * 100))
        
        # Determine risk level
        if intensity < 3:
            risk = 'High'
        elif intensity < 4.5:
            risk = 'Medium'
        else:
            risk = 'Low'
        
        return jsonify({
            'success': True,
            'prediction': {
                'region': region,
                'date': date,
                'intensity': round(intensity, 2),
                'sunshine_hours': round(sunshine_hours, 1),
                'power_output': round(power_output, 2),
                'suitability_score': round(suitability),
                'risk_level': risk,
                'conditions': {
                    'temperature': temperature,
                    'humidity': humidity,
                    'cloud_cover': cloud_cover
                }
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Make multiple predictions"""
    try:
        data = request.json
        predictions_list = data.get('predictions', [])
        
        results = []
        for pred_data in predictions_list:
            try:
                # Prepare features
                features = prepare_features(
                    pred_data['region'],
                    pred_data['date'],
                    pred_data.get('temperature', 30),
                    pred_data.get('humidity', 60),
                    pred_data.get('cloud_cover', 30)
                )
                
                features_scaled = scaler.transform(features)
                intensity = model.predict(features_scaled)[0]
                sunshine_hours = sunshine_model.predict(features_scaled)[0]
                
                results.append({
                    'region': pred_data['region'],
                    'date': pred_data['date'],
                    'intensity': round(intensity, 2),
                    'sunshine_hours': round(sunshine_hours, 1)
                })
            except Exception as e:
                results.append({
                    'region': pred_data.get('region', 'unknown'),
                    'error': str(e)
                })
        
        return jsonify({
            'count': len(results),
            'predictions': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Run the app - IMPORTANT: use host='0.0.0.0' for network access
    app.run(host='0.0.0.0', port=5001, debug=True)