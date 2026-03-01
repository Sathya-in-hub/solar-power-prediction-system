# # ml-service/app.py
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# import joblib
# import numpy as np
# import pandas as pd
# from datetime import datetime

# app = Flask(__name__)
# CORS(app)

# # Load model and feature columns
# try:
#     model = joblib.load('models/solar_model.pkl')
#     feature_cols = joblib.load('models/feature_columns.pkl')
#     print("Model loaded successfully")
# except Exception as e:
#     print(f"Error loading model: {e}")
#     model = None

# # Region database (simplified)
# REGION_DATA = {
#     'Tamil Nadu-Chennai': {
#         'latitude': 13.0827,
#         'longitude': 80.2707,
#         'altitude': 6,
#         'distance_from_coast': 0,
#         'aerosol_depth': 0.6
#     },
#     'Rajasthan-Jodhpur': {
#         'latitude': 26.2389,
#         'longitude': 73.0243,
#         'altitude': 231,
#         'distance_from_coast': 500,
#         'aerosol_depth': 0.8
#     },
#     'Gujarat-Gandhinagar': {
#         'latitude': 23.2156,
#         'longitude': 72.6369,
#         'altitude': 81,
#         'distance_from_coast': 50,
#         'aerosol_depth': 0.7
#     },
#     'Maharashtra-Mumbai': {
#         'latitude': 19.0760,
#         'longitude': 72.8777,
#         'altitude': 14,
#         'distance_from_coast': 0,
#         'aerosol_depth': 0.7
#     },
#     'Karnataka-Bengaluru': {
#         'latitude': 12.9716,
#         'longitude': 77.5946,
#         'altitude': 920,
#         'distance_from_coast': 300,
#         'aerosol_depth': 0.5
#     }
# }

# @app.route('/predict', methods=['POST'])
# def predict():
#     if model is None:
#         return jsonify({'error': 'Model not loaded'}), 500
    
#     try:
#         data = request.get_json()
        
#         # Get region data
#         region = data['region']
#         region_info = REGION_DATA.get(region, REGION_DATA['Tamil Nadu-Chennai'])
        
#         # Parse date
#         date = datetime.strptime(data['date'], '%Y-%m-%d')
        
#         # Prepare feature vector
#         features = pd.DataFrame([[

# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
import math
import os
import logging
from functools import wraps

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
MODELS_DIR = 'models'
DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'
PORT = int(os.environ.get('PORT', 5001))

# Load models at startup
print("\n" + "=" * 50)
print("SOLAR PREDICTION ML SERVICE")
print("=" * 50)

try:
    print("📦 Loading models...")
    solar_model = joblib.load(os.path.join(MODELS_DIR, 'solar_model.pkl'))
    sunshine_model = joblib.load(os.path.join(MODELS_DIR, 'sunshine_model.pkl'))
    scaler = joblib.load(os.path.join(MODELS_DIR, 'scaler.pkl'))
    feature_columns = joblib.load(os.path.join(MODELS_DIR, 'feature_columns.pkl'))
    model_metadata = joblib.load(os.path.join(MODELS_DIR, 'model_metadata.pkl'))
    
    print("✅ All models loaded successfully!")
    print(f"📊 Model trained on: {model_metadata['training_date']}")
    print(f"📈 Model R² score: {model_metadata['rf_r2']:.3f}")
    print(f"🔧 Features: {feature_columns}")
except Exception as e:
    print(f"❌ Error loading models: {e}")
    solar_model = None
    sunshine_model = None
    scaler = None
    print("⚠️ Running in fallback mode with rule-based predictions")

# Region database
REGION_DATABASE = {
    'Tamil Nadu-Chennai': {
        'latitude': 13.0827, 'longitude': 80.2707, 'altitude': 6,
        'distance_from_coast': 0, 'aerosol_depth': 0.6,
        'avg_temperature': 28.5, 'avg_humidity': 74, 'zone': 'coastal'
    },
    'Rajasthan-Jodhpur': {
        'latitude': 26.2389, 'longitude': 73.0243, 'altitude': 231,
        'distance_from_coast': 500, 'aerosol_depth': 0.8,
        'avg_temperature': 32.0, 'avg_humidity': 45, 'zone': 'desert'
    },
    'Gujarat-Gandhinagar': {
        'latitude': 23.2156, 'longitude': 72.6369, 'altitude': 81,
        'distance_from_coast': 50, 'aerosol_depth': 0.7,
        'avg_temperature': 30.5, 'avg_humidity': 60, 'zone': 'semi-arid'
    },
    'Maharashtra-Mumbai': {
        'latitude': 19.0760, 'longitude': 72.8777, 'altitude': 14,
        'distance_from_coast': 0, 'aerosol_depth': 0.7,
        'avg_temperature': 27.5, 'avg_humidity': 80, 'zone': 'coastal'
    },
    'Karnataka-Bengaluru': {
        'latitude': 12.9716, 'longitude': 77.5946, 'altitude': 920,
        'distance_from_coast': 300, 'aerosol_depth': 0.5,
        'avg_temperature': 24.0, 'avg_humidity': 65, 'zone': 'plateau'
    },
    'Delhi-NCR': {
        'latitude': 28.6139, 'longitude': 77.2090, 'altitude': 216,
        'distance_from_coast': 1000, 'aerosol_depth': 0.9,
        'avg_temperature': 25.0, 'avg_humidity': 55, 'zone': 'plains'
    },
    'Uttar Pradesh-Lucknow': {
        'latitude': 26.8467, 'longitude': 80.9462, 'altitude': 123,
        'distance_from_coast': 900, 'aerosol_depth': 0.85,
        'avg_temperature': 26.5, 'avg_humidity': 58, 'zone': 'plains'
    },
    'West Bengal-Kolkata': {
        'latitude': 22.5726, 'longitude': 88.3639, 'altitude': 9,
        'distance_from_coast': 150, 'aerosol_depth': 0.75,
        'avg_temperature': 27.0, 'avg_humidity': 75, 'zone': 'coastal'
    }
}

def validate_input(f):
    """Decorator to validate input data"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No input data provided'}), 400
        
        required_fields = ['region', 'date']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Validate date format
        try:
            datetime.strptime(data['date'], '%Y-%m-%d')
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Validate region
        if data['region'] not in REGION_DATABASE:
            return jsonify({'error': f'Region not found: {data["region"]}'}), 400
        
        return f(*args, **kwargs)
    return decorated_function

def fallback_prediction(region_info, date, temperature, humidity, cloud_cover):
    """Rule-based fallback prediction when ML model is not available"""
    month = date.month
    
    # Base radiation based on latitude
    latitude = region_info['latitude']
    base_radiation = 4.5 + 0.03 * (90 - abs(latitude - 23.5))
    
    # Seasonal adjustment
    if month in [3, 4, 5]:  # Summer
        seasonal_factor = 1.2
    elif month in [6, 7, 8, 9]:  # Monsoon
        seasonal_factor = 0.7
    elif month in [10, 11]:  # Post-monsoon
        seasonal_factor = 1.0
    else:  # Winter
        seasonal_factor = 0.8
    
    # Weather adjustments
    cloud_factor = 1 - (cloud_cover / 100) * 0.6
    humidity_factor = 1 - (humidity / 100) * 0.2
    
    intensity = base_radiation * seasonal_factor * cloud_factor * humidity_factor
    intensity = max(2.0, min(8.0, intensity))
    
    # Sunshine hours
    sunshine = 8 + 4 * math.sin(2 * math.pi * (month - 3) / 12) - 0.05 * cloud_cover
    sunshine = max(4, min(13, sunshine))
    
    return intensity, sunshine

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint"""
    return jsonify({
        'service': 'Solar Prediction ML Service',
        'status': 'active',
        'models_loaded': solar_model is not None,
        'regions_available': list(REGION_DATABASE.keys()),
        'version': '2.0.0',
        'model_metrics': {
            'r2_score': model_metadata['rf_r2'] if 'model_metadata' in dir() else None,
            'mae': model_metadata['rf_mae'] if 'model_metadata' in dir() else None
        } if 'model_metadata' in dir() else {}
    })

@app.route('/predict', methods=['POST'])
@validate_input
def predict():
    """Main prediction endpoint"""
    try:
        data = request.get_json()
        logger.info(f"Prediction request: {data}")
        
        # Get region data
        region = data['region']
        region_info = REGION_DATABASE[region]
        
        # Parse date
        date = datetime.strptime(data['date'], '%Y-%m-%d')
        
        # Get weather parameters with defaults
        temperature = data.get('temperature', region_info['avg_temperature'])
        humidity = data.get('humidity', region_info['avg_humidity'])
        cloud_cover = data.get('cloud_cover', 20)
        
        # Make prediction
        if solar_model is not None and scaler is not None:
            # ML-based prediction
            features = pd.DataFrame([[
                region_info['latitude'],
                region_info['longitude'],
                date.month,
                date.timetuple().tm_yday,
                temperature,
                humidity,
                cloud_cover,
                region_info['altitude'],
                region_info['distance_from_coast'],
                region_info['aerosol_depth']
            ]], columns=feature_columns)
            
            # Scale features
            features_scaled = scaler.transform(features)
            
            # Predict
            intensity = float(solar_model.predict(features_scaled)[0])
            sunshine = float(sunshine_model.predict(features_scaled)[0])
            
            # Calculate confidence based on model metrics
            confidence = model_metadata['rf_r2'] if 'model_metadata' in dir() else 0.85
            
        else:
            # Fallback rule-based prediction
            intensity, sunshine = fallback_prediction(
                region_info, date, temperature, humidity, cloud_cover
            )
            confidence = 0.75  # Lower confidence for rule-based
        
        # Calculate power output (assuming 1kW panel with 85% efficiency)
        power_output = intensity * 0.85
        
        # Calculate suitability score (0-100)
        suitability_score = calculate_suitability(
            intensity, sunshine, cloud_cover, region_info
        )
        
        # Generate risk level
        risk_level = get_risk_level(intensity, cloud_cover, date.month)
        
        # Prepare response
        response = {
            'success': True,
            'prediction': {
                'intensity': round(intensity, 2),
                'sunshine_hours': round(sunshine, 1),
                'power_output': round(power_output, 2),
                'suitability_score': suitability_score,
                'confidence': round(confidence, 2),
                'risk_level': risk_level
            },
            'region_info': {
                'name': region,
                'zone': region_info['zone'],
                'latitude': region_info['latitude'],
                'longitude': region_info['longitude']
            },
            'weather_used': {
                'temperature': temperature,
                'humidity': humidity,
                'cloud_cover': cloud_cover
            },
            'recommendations': generate_recommendations(
                intensity, sunshine, risk_level
            )
        }
        
        logger.info(f"Prediction successful: {response['prediction']}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Batch prediction endpoint"""
    try:
        data = request.get_json()
        predictions = []
        
        for item in data.get('predictions', []):
            # Simulate individual prediction for each
            region_info = REGION_DATABASE.get(item['region'])
            if not region_info:
                continue
                
            date = datetime.strptime(item['date'], '%Y-%m-%d')
            intensity, sunshine = fallback_prediction(
                region_info,
                date,
                item.get('temperature', region_info['avg_temperature']),
                item.get('humidity', region_info['avg_humidity']),
                item.get('cloud_cover', 20)
            )
            
            predictions.append({
                'region': item['region'],
                'date': item['date'],
                'intensity': round(intensity, 2),
                'sunshine_hours': round(sunshine, 1)
            })
        
        return jsonify({
            'success': True,
            'predictions': predictions,
            'count': len(predictions)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/regions', methods=['GET'])
def get_regions():
    """Get list of available regions"""
    regions = []
    for name, info in REGION_DATABASE.items():
        regions.append({
            'name': name,
            'zone': info['zone'],
            'latitude': info['latitude'],
            'longitude': info['longitude'],
            'avg_temperature': info['avg_temperature'],
            'avg_humidity': info['avg_humidity']
        })
    
    return jsonify({
        'success': True,
        'regions': regions,
        'count': len(regions)
    })

def calculate_suitability(intensity, sunshine, cloud_cover, region_info):
    """Calculate solar suitability score (0-100)"""
    # Intensity score (40% weight)
    intensity_score = min(100, (intensity / 6.0) * 100)
    
    # Sunshine score (30% weight)
    sunshine_score = min(100, (sunshine / 10.0) * 100)
    
    # Cloud cover score (15% weight)
    cloud_score = max(0, 100 - cloud_cover)
    
    # Regional factor (15% weight)
    zone_factors = {
        'desert': 100,
        'semi-arid': 90,
        'plateau': 85,
        'plains': 80,
        'coastal': 75
    }
    zone_score = zone_factors.get(region_info['zone'], 70)
    
    # Weighted average
    suitability = (
        intensity_score * 0.4 +
        sunshine_score * 0.3 +
        cloud_score * 0.15 +
        zone_score * 0.15
    )
    
    return round(suitability)

def get_risk_level(intensity, cloud_cover, month):
    """Determine risk level based on conditions"""
    if intensity < 3.0 or cloud_cover > 70:
        return 'CRITICAL'
    elif intensity < 4.0 or cloud_cover > 50:
        return 'WARNING'
    elif intensity < 5.0 or cloud_cover > 30:
        return 'MODERATE'
    else:
        return 'LOW'

def generate_recommendations(intensity, sunshine, risk_level):
    """Generate recommendations based on prediction"""
    recommendations = []
    
    if risk_level == 'CRITICAL':
        recommendations.append({
            'type': 'warning',
            'message': 'Very low solar output expected. Ensure batteries are fully charged and have backup power ready.'
        })
        recommendations.append({
            'type': 'action',
            'message': 'Consider postponing high-power activities or using grid power.'
        })
    elif risk_level == 'WARNING':
        recommendations.append({
            'type': 'caution',
            'message': 'Lower than average solar output. Optimize energy usage during peak hours.'
        })
        recommendations.append({
            'type': 'action',
            'message': f'Peak generation expected between {int(12-sunshine/4)}:00 and {int(12+sunshine/4)}:00'
        })
    elif risk_level == 'MODERATE':
        recommendations.append({
            'type': 'info',
            'message': 'Average solar conditions. Normal operation recommended.'
        })
    else:
        recommendations.append({
            'type': 'success',
            'message': 'Excellent solar conditions expected! Ideal for maximum generation.'
        })
    
    # Battery recommendation
    battery_capacity = intensity * 2  # 2 days of autonomy
    recommendations.append({
        'type': 'battery',
        'message': f'Recommended battery capacity: {round(battery_capacity, 1)} kWh for 2 days autonomy'
    })
    
    return recommendations

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print(f"\n🚀 Starting ML Service on port {PORT}...")
    print(f"🔧 Debug mode: {DEBUG}")
    print(f"📍 Endpoints:")
    print(f"   GET  / - Health check")
    print(f"   POST /predict - Make prediction")
    print(f"   POST /batch_predict - Batch predictions")
    print(f"   GET  /regions - List regions")
    print("\n" + "=" * 50)
    
    app.run(host='0.0.0.0', port=PORT, debug=DEBUG)