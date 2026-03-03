import requests
import json
import time

BASE_URL = "http://localhost:5000"

def test_all_endpoints():
    print("=" * 60)
    print("Testing Electricity Demand Prediction API")
    print("=" * 60)
    
    # 1. Test health endpoint
    print("\n1. Testing /health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"   Status: {response.status_code}")
        print(f"   Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 2. Test model info
    print("\n2. Testing /model-info endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/model-info")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   Model: {data.get('model_name', 'Unknown')}")
        print(f"   Features: {len(data.get('features_required', []))}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 3. Test single prediction
    print("\n3. Testing /predict endpoint...")
    payload = {
        "datetime": "2024-01-15 14:30:00",
        "demand_lag_1": 1500.5,
        "demand_lag_24": 1450.2,
        "rolling_mean_24": 1480.3,
        "rolling_std_24": 120.5
    }
    try:
        response = requests.post(f"{BASE_URL}/predict", json=payload)
        print(f"   Status: {response.status_code}")
        data = response.json()
        if 'predicted_demand' in data:
            print(f"   ✅ Prediction successful: {data['predicted_demand']} MW")
        else:
            print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 4. Test weekly forecast
    print("\n4. Testing /predict-weekly endpoint...")
    payload = {
        "start_date": "2024-01-15 00:00:00",
        "initial_demand": 1500.0
    }
    try:
        response = requests.post(f"{BASE_URL}/predict-weekly", json=payload)
        print(f"   Status: {response.status_code}")
        data = response.json()
        if 'hourly_forecast' in data:
            print(f"   ✅ Forecast generated: {len(data['hourly_forecast'])} hours")
            print(f"   Weekly total: {data['weekly_statistics']['weekly_total_demand']:.2f} MW")
        else:
            print(f"   ❌ Error: {data.get('error', 'Unknown error')}")
    except Exception as e:
        print(f"   Error: {e}")
    
    # 5. Test demo endpoint
    print("\n5. Testing /demo endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/demo")
        print(f"   Status: {response.status_code}")
        data = response.json()
        print(f"   ✅ Demo data: {len(data.get('predictions', []))} predictions")
    except Exception as e:
        print(f"   Error: {e}")
    
    print("\n" + "=" * 60)
    print("API Testing Complete!")
    print("=" * 60)

if __name__ == "__main__":
    test_all_endpoints()