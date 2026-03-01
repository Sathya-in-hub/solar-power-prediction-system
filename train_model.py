# # ml-service/train_model.py
# import pandas as pd
# import numpy as np
# from sklearn.ensemble import RandomForestRegressor
# from sklearn.model_selection import train_test_split, cross_val_score
# from sklearn.metrics import mean_absolute_error, r2_score
# import joblib
# import warnings
# warnings.filterwarnings('ignore')

# # Generate synthetic training data (in production, use real dataset)
# def generate_training_data(n_samples=10000):
#     np.random.seed(42)
    
#     data = {
#         'latitude': np.random.uniform(8, 37, n_samples),  # India's lat range
#         'longitude': np.random.uniform(68, 97, n_samples),  # India's long range
#         'month': np.random.randint(1, 13, n_samples),
#         'day_of_year': np.random.randint(1, 366, n_samples),
#         'temperature': np.random.uniform(10, 45, n_samples),
#         'humidity': np.random.uniform(10, 100, n_samples),
#         'cloud_cover': np.random.uniform(0, 100, n_samples),
#         'altitude': np.random.uniform(0, 3000, n_samples),
#         'distance_from_coast': np.random.uniform(0, 1000, n_samples),
#         'aerosol_depth': np.random.uniform(0.1, 1.0, n_samples)
#     }
    
#     df = pd.DataFrame(data)
    
#     # Generate target variable with realistic relationships
#     df['solar_intensity'] = (
#         5.0 +  # base
#         0.03 * (90 - np.abs(df['latitude'] - 23.5)) +  # latitude effect
#         1.5 * np.sin(2 * np.pi * (df['day_of_year'] - 80) / 365) +  # seasonal
#         -0.03 * df['cloud_cover'] +  # cloud effect
#         -0.02 * df['humidity'] +  # humidity effect
#         0.0005 * df['altitude'] +  # altitude effect
#         np.random.normal(0, 0.5, n_samples)  # noise
#     )
    
#     # Ensure realistic bounds
#     df['solar_intensity'] = df['solar_intensity'].clip(2, 8)
    
#     return df

# # Generate data
# print("Generating training data...")
# df = generate_training_data()

# # Prepare features and target
# feature_cols = ['latitude', 'longitude', 'month', 'day_of_year', 
#                 'temperature', 'humidity', 'cloud_cover', 'altitude',
#                 'distance_from_coast', 'aerosol_depth']
# X = df[feature_cols]
# y = df['solar_intensity']

# # Split data
# X_train, X_test, y_train, y_test = train_test_split(
#     X, y, test_size=0.2, random_state=42
# )

# # Train model
# print("Training Random Forest model...")
# model = RandomForestRegressor(
#     n_estimators=200,
#     max_depth=20,
#     min_samples_split=5,
#     min_samples_leaf=2,
#     random_state=42,
#     n_jobs=-1
# )

# model.fit(X_train, y_train)

# # Evaluate
# y_pred = model.predict(X_test)
# mae = mean_absolute_error(y_test, y_pred)
# r2 = r2_score(y_test, y_pred)

# print(f"Mean Absolute Error: {mae:.3f} kWh/m²")
# print(f"R² Score: {r2:.3f}")

# # Cross-validation
# cv_scores = cross_val_score(model, X, y, cv=5, scoring='r2')
# print(f"Cross-validation R²: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")

# # Feature importance
# feature_importance = pd.DataFrame({
#     'feature': feature_cols,
#     'importance': model.feature_importances_
# }).sort_values('importance', ascending=False)
# print("\nFeature Importance:")
# print(feature_importance)

# # Save model
# joblib.dump(model, 'models/solar_model.pkl')
# print("\nModel saved to models/solar_model.pkl")

# # Save feature columns
# joblib.dump(feature_cols, 'models/feature_columns.pkl')
# print("Feature columns saved to models/feature_columns.pkl")

# ml-service/train_model.py
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score, mean_squared_error
import joblib
import warnings
import os
warnings.filterwarnings('ignore')

# Create models directory if it doesn't exist
os.makedirs('models', exist_ok=True)

def generate_realistic_training_data(n_samples=20000):
    """
    Generate synthetic but realistic solar radiation data for India
    Based on actual solar radiation patterns in different regions
    """
    np.random.seed(42)
    
    # Indian geographical boundaries
    latitudes = np.random.uniform(8, 37, n_samples)
    longitudes = np.random.uniform(68, 97, n_samples)
    
    # Seasonal parameters
    months = np.random.randint(1, 13, n_samples)
    days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    
    # Calculate day of year from month
    day_of_year = np.zeros(n_samples)
    for i, month in enumerate(months):
        day_of_year[i] = np.random.randint(1, days_in_month[month-1] + 1)
        # Add cumulative days from previous months
        for m in range(month-1):
            day_of_year[i] += days_in_month[m]
    
    # Environmental parameters with realistic ranges
    temperature = 15 + 25 * np.sin(np.radians((day_of_year - 80) * 0.986)) + \
                 np.random.normal(0, 3, n_samples)  # Seasonal temperature variation
    
    humidity = 40 + 30 * np.sin(np.radians((day_of_year - 150) * 0.986)) + \
               np.random.normal(0, 10, n_samples)  # Monsoon influence
    humidity = np.clip(humidity, 20, 95)
    
    cloud_cover = 20 + 30 * np.sin(np.radians((day_of_year - 150) * 0.986)) + \
                  np.random.normal(0, 15, n_samples)  # Cloud cover peaks in monsoon
    cloud_cover = np.clip(cloud_cover, 0, 100)
    
    altitude = np.random.uniform(0, 3500, n_samples)  # meters
    distance_from_coast = np.random.uniform(0, 1200, n_samples)  # km
    aerosol_depth = 0.3 + 0.5 * np.exp(-distance_from_coast/500) + \
                    np.random.normal(0, 0.1, n_samples)  # Higher inland
    aerosol_depth = np.clip(aerosol_depth, 0.1, 1.2)
    
    # Create DataFrame
    df = pd.DataFrame({
        'latitude': latitudes,
        'longitude': longitudes,
        'month': months,
        'day_of_year': day_of_year,
        'temperature': temperature,
        'humidity': humidity,
        'cloud_cover': cloud_cover,
        'altitude': altitude,
        'distance_from_coast': distance_from_coast,
        'aerosol_depth': aerosol_depth
    })
    
    # Calculate solar intensity based on physical principles
    # 1. Latitude effect (solar angle)
    latitude_rad = np.radians(df['latitude'])
    declination = 23.45 * np.sin(np.radians(360/365 * (284 + df['day_of_year'])))
    declination_rad = np.radians(declination)
    
    # Solar elevation angle at solar noon (simplified)
    solar_angle = np.sin(latitude_rad) * np.sin(declination_rad) + \
                  np.cos(latitude_rad) * np.cos(declination_rad)
    solar_angle = np.clip(solar_angle, 0, 1)
    
    # Base solar radiation at top of atmosphere (kWh/m²/day)
    solar_constant = 1361 / 1000 * 24 / np.pi  # Convert to kWh/m²/day
    base_radiation = solar_constant * solar_angle
    
    # 2. Atmospheric attenuation
    clear_sky_radiation = base_radiation * np.exp(-0.1 * (df['altitude']/1000) - 0.2 * df['aerosol_depth'])
    
    # 3. Cloud and humidity effects
    cloud_factor = 1 - (df['cloud_cover'] / 100) * 0.6
    humidity_factor = 1 - (df['humidity'] / 100) * 0.2
    
    # 4. Seasonal variation
    seasonal_factor = 0.8 + 0.4 * np.sin(2 * np.pi * (df['day_of_year'] - 80) / 365)
    
    # 5. Distance from coast effect (coastal areas have more haze)
    coastal_factor = 1 - 0.1 * np.exp(-df['distance_from_coast'] / 200)
    
    # Calculate final solar intensity
    df['solar_intensity'] = clear_sky_radiation * seasonal_factor * cloud_factor * \
                            humidity_factor * coastal_factor * 4.5  # Scaling factor
    
    # Add random noise for realism
    df['solar_intensity'] += np.random.normal(0, 0.3, n_samples)
    
    # Ensure realistic bounds
    df['solar_intensity'] = df['solar_intensity'].clip(2, 8.5)
    
    # Calculate sunshine duration (hours)
    df['sunshine_hours'] = 8 + 4 * np.sin(2 * np.pi * (df['day_of_year'] - 80) / 365) - \
                           0.05 * df['cloud_cover'] + np.random.normal(0, 0.5, n_samples)
    df['sunshine_hours'] = df['sunshine_hours'].clip(4, 13)
    
    return df

def train_models():
    """Train and save all ML models"""
    print("=" * 60)
    print("SOLAR PREDICTION ML MODEL TRAINING")
    print("=" * 60)
    
    # Generate training data
    print("\n📊 Generating training data...")
    df = generate_realistic_training_data(25000)
    print(f"   Generated {len(df)} samples")
    print(f"   Features: {df.columns.tolist()}")
    
    # Prepare features and targets
    feature_cols = ['latitude', 'longitude', 'month', 'day_of_year', 
                    'temperature', 'humidity', 'cloud_cover', 'altitude',
                    'distance_from_coast', 'aerosol_depth']
    
    X = df[feature_cols]
    y_intensity = df['solar_intensity']
    y_hours = df['sunshine_hours']
    
    # Split data
    X_train, X_test, y_intensity_train, y_intensity_test = train_test_split(
        X, y_intensity, test_size=0.2, random_state=42
    )
    _, _, y_hours_train, y_hours_test = train_test_split(
        X, y_hours, test_size=0.2, random_state=42
    )
    
    # Scale features
    print("\n🔄 Scaling features...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest for intensity prediction
    print("\n🌲 Training Random Forest model for solar intensity...")
    rf_model = RandomForestRegressor(
        n_estimators=200,
        max_depth=25,
        min_samples_split=5,
        min_samples_leaf=2,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    
    rf_model.fit(X_train_scaled, y_intensity_train)
    
    # Evaluate
    y_pred = rf_model.predict(X_test_scaled)
    mae = mean_absolute_error(y_intensity_test, y_pred)
    r2 = r2_score(y_intensity_test, y_pred)
    rmse = np.sqrt(mean_squared_error(y_intensity_test, y_pred))
    
    print(f"\n📈 Random Forest Performance:")
    print(f"   Mean Absolute Error: {mae:.3f} kWh/m²")
    print(f"   R² Score: {r2:.3f}")
    print(f"   RMSE: {rmse:.3f} kWh/m²")
    
    # Cross-validation
    cv_scores = cross_val_score(rf_model, X_train_scaled, y_intensity_train, 
                                cv=5, scoring='r2')
    print(f"   Cross-validation R²: {cv_scores.mean():.3f} (+/- {cv_scores.std()*2:.3f})")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\n🔍 Feature Importance:")
    for idx, row in feature_importance.iterrows():
        print(f"   {row['feature']:20s}: {row['importance']:.3f}")
    
    # Train Gradient Boosting for sunshine hours
    print("\n🌳 Training Gradient Boosting model for sunshine hours...")
    gb_model = GradientBoostingRegressor(
        n_estimators=150,
        max_depth=8,
        learning_rate=0.1,
        random_state=42
    )
    
    gb_model.fit(X_train_scaled, y_hours_train)
    y_hours_pred = gb_model.predict(X_test_scaled)
    hours_mae = mean_absolute_error(y_hours_test, y_hours_pred)
    
    print(f"   Sunshine Hours MAE: {hours_mae:.2f} hours")
    
    # Save models and artifacts
    print("\n💾 Saving models...")
    joblib.dump(rf_model, 'models/solar_model.pkl')
    joblib.dump(gb_model, 'models/sunshine_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')
    joblib.dump(feature_cols, 'models/feature_columns.pkl')
    
    # Save model metadata
    model_metadata = {
        'training_date': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S'),
        'n_samples': len(df),
        'features': feature_cols,
        'rf_mae': mae,
        'rf_r2': r2,
        'gb_mae': hours_mae,
        'feature_importance': feature_importance.to_dict('records')
    }
    joblib.dump(model_metadata, 'models/model_metadata.pkl')
    
    print("\n✅ Models saved successfully!")
    print(f"   Location: {os.path.abspath('models/')}")
    
    # Test prediction example
    print("\n🔬 Test Prediction Example:")
    test_sample = X_test.iloc[0:1]
    test_sample_scaled = scaler.transform(test_sample)
    test_pred = rf_model.predict(test_sample_scaled)[0]
    test_actual = y_intensity_test.iloc[0]
    print(f"   Actual: {test_actual:.2f} kWh/m²")
    print(f"   Predicted: {test_pred:.2f} kWh/m²")
    print(f"   Error: {abs(test_actual - test_pred):.2f} kWh/m²")
    
    return rf_model, scaler, feature_cols

def create_synthetic_test_data():
    """Create test data for validation"""
    test_cases = [
        {
            'region': 'Rajasthan-Jodhpur',
            'latitude': 26.2389,
            'longitude': 73.0243,
            'month': 5,
            'day': 15,
            'temp': 38,
            'humidity': 30,
            'cloud': 10
        },
        {
            'region': 'Tamil Nadu-Chennai',
            'latitude': 13.0827,
            'longitude': 80.2707,
            'month': 6,
            'day': 15,
            'temp': 32,
            'humidity': 70,
            'cloud': 60
        },
        {
            'region': 'Maharashtra-Mumbai',
            'latitude': 19.0760,
            'longitude': 72.8777,
            'month': 7,
            'day': 15,
            'temp': 28,
            'humidity': 85,
            'cloud': 80
        }
    ]
    
    return test_cases

if __name__ == "__main__":
    # Train models
    model, scaler, features = train_models()
    
    # Create test data
    test_cases = create_synthetic_test_data()
    
    print("\n" + "=" * 60)
    print("MODEL TRAINING COMPLETE")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Run Flask app: python app.py")
    print("2. Test API: curl http://localhost:5001/predict")
    print("3. Monitor logs for predictions")