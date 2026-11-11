from fastapi.testclient import TestClient
from app.main import app
from app.ml.isolation_forest import detector

client = TestClient(app)


def test_detector_baseline_prediction():
    """Test local IsolationForest detector scores normal reading cleanly."""
    res = detector.score(
        occupancy=50.0,
        temperature=22.5,
        wifi_devices=500.0,
        power_kw=110.0,
    )
    assert "anomaly_score" in res
    assert "is_anomaly" in res
    assert res["severity"] in ["normal", "warning"]
    assert res["anomaly_score"] < 0.60


def test_detector_outlier_prediction():
    """Test local IsolationForest flags extreme values as outlier."""
    res = detector.score(
        occupancy=99.0,
        temperature=38.5,
        wifi_devices=3200.0,
        power_kw=650.0,
    )
    assert res["is_anomaly"] is True
    assert res["severity"] == "critical"
    assert res["anomaly_score"] >= 0.70
    assert len(res["reason"]) > 0


def test_api_detect_anomaly_normal():
    """Test /api/anomalies/detect endpoint for normal range."""
    payload = {
        "occupancy": 45.0,
        "temperature": 23.0,
        "wifi_devices": 400.0,
        "power_kw": 95.0,
    }
    response = client.post("/api/anomalies/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "anomaly_score" in data
    assert data["severity"] in ["normal", "warning"]


def test_api_detect_anomaly_outlier():
    """Test /api/anomalies/detect endpoint for outlier detection."""
    payload = {
        "occupancy": 98.0,
        "temperature": 34.0,
        "wifi_devices": 2800.0,
        "power_kw": 580.0,
    }
    response = client.post("/api/anomalies/detect", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_anomaly"] is True
    assert data["severity"] == "critical"


def test_api_get_anomalies():
    """Test /api/anomalies lists active campus anomalies."""
    response = client.get("/api/anomalies")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "building_name" in data[0]


def test_api_inject_chaos():
    """Test chaos engineering injection endpoint."""
    response = client.post("/api/anomalies/inject-chaos?building_id=central-library")
    assert response.status_code == 200
    data = response.json()
    assert data["building_id"] == "central-library"
    assert data["severity"] == "critical"
    assert "anomaly_score" in data or "score" in data
