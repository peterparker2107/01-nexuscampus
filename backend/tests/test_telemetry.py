from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health endpoint returns 200 and healthy service status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "nexuscampus-backend"
    assert data["offline_ready"] is True


def test_root_endpoint():
    """Verify root endpoint returns API info."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "NexusCampus" in data["name"]


def test_get_all_buildings():
    """Verify telemetry endpoint returns all 10 TIET buildings."""
    response = client.get("/api/telemetry/buildings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 10

    # Verify key buildings exist in response
    building_ids = [b["id"] for b in data]
    expected = [
        "csed",
        "mba",
        "lt-complex",
        "central-library",
        "hostel-a",
        "hostel-l",
        "sports-complex",
        "admin-block",
        "ece-block",
        "mech-block",
    ]
    for exp_id in expected:
        assert exp_id in building_ids


def test_get_single_building_valid():
    """Verify getting single building by ID works."""
    response = client.get("/api/telemetry/buildings/csed")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "csed"
    assert data["name"] == "CSED Block"
    assert data["capacity"] == 1200


def test_get_single_building_invalid():
    """Verify 404 for non-existent building ID."""
    response = client.get("/api/telemetry/buildings/unknown-building-xyz")
    assert response.status_code == 404


def test_ingest_telemetry():
    """Verify telemetry ingestion updates state and scores anomaly."""
    payload = {
        "building_id": "hostel-a",
        "occupancy": 52.0,
        "temperature": 23.2,
        "wifi_devices": 560,
        "power_kw": 88.0,
    }
    response = client.post("/api/telemetry/ingest", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "hostel-a"
    assert data["occupancy"] == 52.0
    assert data["temperature"] == 23.2
    assert "status" in data
    assert "anomaly_score" in data
