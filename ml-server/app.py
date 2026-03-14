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
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        region = data.get('region')
        date = data.get('date')
        temperature = data.get('temperature', 30)
        humidity = data.get('humidity', 60)
        cloud_cover = data.get('cloud_cover', 30)
        
        if not region or not date:
            return jsonify({'error': 'Region and date are required'}), 400

        # Physics-based calculation using real weather inputs
        # This gives much more accurate results than ML for this feature set
        month = datetime.strptime(date, '%Y-%m-%d').month
        day_of_year = calculate_day_of_year(date)
        region_info = REGIONS.get(region, {'lat': 20.5937, 'lon': 78.9629, 'zone': 'Inland'})

        # Solar angle effect
        lat_rad = region_info['lat'] * 3.14159 / 180
        declination = 23.45 * __import__('math').sin(
            2 * 3.14159 * (284 + day_of_year) / 365 * 3.14159 / 180
        )
        decl_rad = declination * 3.14159 / 180
        import math
        solar_angle = math.sin(lat_rad) * math.sin(decl_rad) + \
                      math.cos(lat_rad) * math.cos(decl_rad)
        solar_angle = max(0, min(1, solar_angle))

        # Base clear sky radiation
        base = 10.5 * solar_angle

        # Apply weather factors
        cloud_factor = 1 - (cloud_cover / 100) * 0.85
        humidity_factor = 1 - (humidity / 100) * 0.35
        seasonal_factor = 0.8 + 0.4 * math.sin(2 * math.pi * (day_of_year - 80) / 365)

        # Zone adjustment
        zone_factors = {'Desert': 1.15, 'Inland': 1.0, 'Coastal': 0.88}
        zone_factor = zone_factors.get(region_info['zone'], 1.0)

        intensity = base * cloud_factor * humidity_factor * seasonal_factor * zone_factor
        intensity = round(max(1.0, min(7.0, intensity)), 2)

        sunshine_hours = round(max(2, 12 * (1 - cloud_cover/100 * 0.7)), 1)
        power_output = round(intensity * 0.75, 2)
        suitability = min(100, max(0, int((intensity / 7.0) * 100)))

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
                'intensity': intensity,
                'sunshine_hours': sunshine_hours,
                'power_output': power_output,
                'suitability_score': suitability,
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

from nasa_power import get_solar_data, get_monthly_averages

@app.route('/solar/realtime', methods=['POST'])
def realtime_solar():
    """
    Get real NASA solar data for any lat/lon and date
    Frontend sends: { lat, lon, date }
    """
    try:
        data = request.json
        lat  = data.get('lat')
        lon  = data.get('lon')
        date = data.get('date')

        if not all([lat, lon, date]):
            return jsonify({'error': 'lat, lon and date are required'}), 400

        nasa_data = get_solar_data(lat, lon, date)

        if not nasa_data:
            return jsonify({'error': 'Could not fetch NASA data for this location/date'}), 404

        # Also run it through your ML model for power output estimate
        power_output = None
        if model:
            try:
                features = prepare_features(
                    f'custom_{lat}_{lon}',
                    date,
                    nasa_data['temperature'],
                    nasa_data['humidity'],
                    nasa_data['cloud_cover']
                )
                # Override lat/lon with actual values
                features['latitude']  = lat
                features['longitude'] = lon
                features_scaled = scaler.transform(features)
                intensity = model.predict(features_scaled)[0]
                power_output = round(float(intensity) * 0.75, 2)
            except Exception as e:
                print(f'ML fallback error: {e}')
                power_output = round(nasa_data['solar_irradiance'] * 0.75, 2)

        return jsonify({
            'success': True,
            'location': { 'lat': lat, 'lon': lon },
            'date': date,
            'solar': nasa_data,
            'estimated_power_output_kw': power_output,
            'suitability': round(min(100, (nasa_data['solar_irradiance'] / 8.5) * 100))
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/solar/monthly', methods=['POST'])
def monthly_solar():
    """
    Get 12-month solar averages for any lat/lon
    Great for showing which months are best for solar in a location
    """
    try:
        data = request.json
        lat  = data.get('lat')
        lon  = data.get('lon')

        if not all([lat, lon]):
            return jsonify({'error': 'lat and lon are required'}), 400

        result = get_monthly_averages(lat, lon)

        if not result:
            return jsonify({'error': 'Could not fetch data'}), 404

        return jsonify({
            'success': True,
            'location': { 'lat': lat, 'lon': lon },
            'data': result
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
if __name__ == '__main__':
    # Run the app - IMPORTANT: use host='0.0.0.0' for network access
    app.run(host='0.0.0.0', port=5001, debug=True)