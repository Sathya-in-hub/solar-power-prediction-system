# test_api.py
import requests
import json

# Configuration
BASE_URL = "http://localhost:5001"

def print_separator():
    print("\n" + "="*60)

def test_home():
    """Test health check endpoint"""
    print_separator()
    print("🔍 TEST 1: Health Check")
    print_separator()
    
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status Code: {response.status_code}")
        print("Response:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_regions():
    """Test regions endpoint"""
    print_separator()
    print("🔍 TEST 2: Get Regions List")
    print_separator()
    
    try:
        response = requests.get(f"{BASE_URL}/regions")
        print(f"Status Code: {response.status_code}")
        data = response.json()
        print(f"Found {data['count']} regions:")
        for region in data['regions'][:5]:  # Show first 5
            print(f"  - {region['name']} ({region['zone']})")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_prediction():
    """Test prediction endpoint"""
    print_separator()
    print("🔍 TEST 3: Make a Prediction")
    print_separator()
    
    # Test cases
    test_cases = [
        {
            "name": "Rajasthan (Desert - Summer)",
            "payload": {
                "region": "Rajasthan-Jodhpur",
                "date": "2024-06-15",
                "temperature": 38,
                "humidity": 30,
                "cloud_cover": 10
            }
        },
        {
            "name": "Mumbai (Coastal - Monsoon)",
            "payload": {
                "region": "Maharashtra-Mumbai",
                "date": "2024-07-15",
                "temperature": 28,
                "humidity": 85,
                "cloud_cover": 80
            }
        },
        {
            "name": "Chennai (Coastal - Summer)",
            "payload": {
                "region": "Tamil Nadu-Chennai",
                "date": "2024-06-15"
            }
        }
    ]
    
    for test in test_cases:
        print(f"\n📌 {test['name']}:")
        try:
            response = requests.post(
                f"{BASE_URL}/predict",
                json=test['payload'],
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                pred = data['prediction']
                print(f"   ✅ Success!")
                print(f"   Intensity: {pred['intensity']} kWh/m²")
                print(f"   Sunshine: {pred['sunshine_hours']} hours")
                print(f"   Power: {pred['power_output']} kW")
                print(f"   Suitability: {pred['suitability_score']}/100")
                print(f"   Risk: {pred['risk_level']}")
            else:
                print(f"   ❌ Failed: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Error: {e}")

def test_batch_prediction():
    """Test batch prediction endpoint"""
    print_separator()
    print("🔍 TEST 4: Batch Prediction")
    print_separator()
    
    payload = {
        "predictions": [
            {
                "region": "Rajasthan-Jodhpur",
                "date": "2024-06-15"
            },
            {
                "region": "Tamil Nadu-Chennai",
                "date": "2024-06-15",
                "temperature": 32,
                "humidity": 70
            },
            {
                "region": "Maharashtra-Mumbai",
                "date": "2024-07-15",
                "cloud_cover": 80
            }
        ]
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/batch_predict",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Got {data['count']} predictions")
            for i, pred in enumerate(data['predictions'], 1):
                print(f"\n   Prediction {i}: {pred['region']}")
                print(f"     Intensity: {pred['intensity']} kWh/m²")
                print(f"     Sunshine: {pred['sunshine_hours']} hours")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_invalid_input():
    """Test error handling"""
    print_separator()
    print("🔍 TEST 5: Error Handling (Invalid Input)")
    print_separator()
    
    # Test missing region
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json={"date": "2024-06-15"}
        )
        print(f"❌ Missing region: {response.status_code} - Should fail")
    except:
        print("✅ Missing region correctly handled")
    
    # Test invalid region
    try:
        response = requests.post(
            f"{BASE_URL}/predict",
            json={"region": "Invalid-Region", "date": "2024-06-15"}
        )
        print(f"❌ Invalid region: {response.status_code} - Should fail")
    except:
        print("✅ Invalid region correctly handled")

if __name__ == "__main__":
    print("="*60)
    print("🧪 SOLAR PREDICTION ML SERVICE TEST SUITE")
    print("="*60)
    print(f"Testing server at: {BASE_URL}")
    print("Make sure the ML service is running (python app.py)")
    print("="*60)
    
    # Run all tests
    tests_passed = 0
    tests_total = 5
    
    if test_home():
        tests_passed += 1
    if test_regions():
        tests_passed += 1
    if test_prediction():
        tests_passed += 1
    if test_batch_prediction():
        tests_passed += 1
    if test_invalid_input():
        tests_passed += 1
    
    print_separator()
    print("📊 TEST SUMMARY")
    print_separator()
    print(f"✅ Passed: {tests_passed}/{tests_total}")
    print(f"❌ Failed: {tests_total - tests_passed}/{tests_total}")
    
    if tests_passed == tests_total:
        print("\n🎉 ALL TESTS PASSED! ML Service is ready for integration!")
    else:
        print("\n⚠️ Some tests failed. Check the errors above.")
    
    print_separator()