import pytest
from app import app as flask_app

@pytest.fixture
def app():
    yield flask_app

@pytest.fixture
def client(app):
    return app.test_client()

def test_health(client):
    response = client.get('/api/health')
    assert response.status_code == 200
    json_data = response.get_json()
    assert json_data['status'] == 'healthy'

def test_model_info(client):
    response = client.get('/api/model-info')
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'model_name' in json_data
    assert 'features_required' in json_data

def test_predict(client):
    payload = {
        "datetime": "2024-01-15 14:30:00",
        "demand_lag_1": 1500.5,
        "demand_lag_24": 1450.2,
        "rolling_mean_24": 1480.3,
        "rolling_std_24": 120.5
    }
    response = client.post('/api/predict', json=payload)
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'predicted_demand' in json_data

def test_predict_batch(client):
    payload = {
        "data": [
            {
                "datetime": "2024-01-15 14:30:00",
                "demand_lag_1": 1500.5,
                "demand_lag_24": 1450.2,
                "rolling_mean_24": 1480.3,
                "rolling_std_24": 120.5
            }
        ]
    }
    response = client.post('/api/predict-batch', json=payload)
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'predictions' in json_data
    assert len(json_data['predictions']) == 1

def test_predict_weekly(client):
    payload = {
        "start_date": "2024-01-15 00:00:00",
        "initial_demand": 1500.0
    }
    response = client.post('/api/predict-weekly', json=payload)
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'hourly_forecast' in json_data
    assert len(json_data['hourly_forecast']) == 168

def test_demo(client):
    response = client.get('/api/demo')
    assert response.status_code == 200
    json_data = response.get_json()
    assert 'predictions' in json_data
    assert len(json_data['predictions']) == 24
