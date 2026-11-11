from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
import time
from app.ml.isolation_forest import detector
from app.routers.telemetry import CAMPUS_STORE

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])


class AnomalyDetectRequest(BaseModel):
    occupancy: float = Field(..., ge=0, le=100)
    temperature: float
    wifi_devices: float = Field(..., ge=0)
    power_kw: float = Field(..., ge=0)


class AnomalyDetectResponse(BaseModel):
    is_anomaly: bool
    anomaly_score: float
    severity: str
    decision_function: float
    reason: str


class AnomalyItem(BaseModel):
    id: str
    building_id: str
    building_name: str
    timestamp: str
    severity: str
    metric: str
    value: str
    expected: str
    score: float
    description: str


# Active anomalies list
ANOMALIES_STORE: List[AnomalyItem] = [
    AnomalyItem(
        id="anom-01",
        building_id="lt-complex",
        building_name="LT Complex",
        timestamp="2 mins ago",
        severity="critical",
        metric="Occupancy / Heat",
        value="92% / 26.5°C",
        expected="< 80% / 23.5°C",
        score=0.91,
        description="IsolationForest flag: Critical density clustering in central lecture theater causing thermal overload.",
    ),
    AnomalyItem(
        id="anom-02",
        building_id="csed",
        building_name="CSED Block",
        timestamp="7 mins ago",
        severity="warning",
        metric="WiFi Density",
        value="1,140 devices",
        expected="< 900 devices",
        score=0.68,
        description="Concurrent device surge detected across 5GHz access points during lab hack session.",
    ),
    AnomalyItem(
        id="anom-03",
        building_id="mech-block",
        building_name="Mech Block",
        timestamp="14 mins ago",
        severity="warning",
        metric="Power Draw",
        value="245.0 kW",
        expected="< 180.0 kW",
        score=0.61,
        description="Abnormal continuous 3-phase power consumption detected in CNC manufacturing floor.",
    ),
]


@router.get("", response_model=List[AnomalyItem])
def get_anomalies():
    """Retrieve all active spatial and sensor anomalies detected across campus."""
    return ANOMALIES_STORE


@router.post("/detect", response_model=AnomalyDetectResponse)
def detect_anomaly(payload: AnomalyDetectRequest):
    """
    Direct ML inference endpoint: score custom sensor vector with local IsolationForest.
    100% offline scikit-learn model.
    """
    res = detector.score(
        occupancy=payload.occupancy,
        temperature=payload.temperature,
        wifi_devices=payload.wifi_devices,
        power_kw=payload.power_kw,
    )
    return AnomalyDetectResponse(**res)


@router.post("/inject-chaos", response_model=AnomalyItem)
def inject_chaos(building_id: Optional[str] = None):
    """
    Chaos Engineering endpoint for demo: Inject sudden capacity/thermal surge
    into a building and trigger real-time ML anomaly detection.
    """
    target_id = (building_id or "central-library").lower().strip()
    if target_id not in CAMPUS_STORE:
        target_id = "central-library"

    b = CAMPUS_STORE[target_id]
    b.occupancy = 98.0
    b.current_occupants = int(b.capacity * 0.98)
    b.temperature = 31.8
    b.wifi_devices = int(b.wifi_devices * 1.8)
    b.power_kw = round(b.power_kw * 2.2, 1)

    score_res = detector.score(
        occupancy=b.occupancy,
        temperature=b.temperature,
        wifi_devices=b.wifi_devices,
        power_kw=b.power_kw,
    )

    b.status = "critical"
    b.anomaly_score = score_res["anomaly_score"]
    b.anomaly_reason = score_res["reason"]

    new_anomaly = AnomalyItem(
        id=f"anom-chaos-{int(time.time())}",
        building_id=b.id,
        building_name=b.name,
        timestamp="Just now",
        severity="critical",
        metric="Severe Power/Thermal Spike",
        value=f"{b.temperature}°C / {b.occupancy}% OCC",
        expected="< 24.0°C / 65% OCC",
        score=b.anomaly_score,
        description=f"Chaos Injected: IsolationForest flagged {b.name} ({b.anomaly_reason}).",
    )

    ANOMALIES_STORE.insert(0, new_anomaly)
    return new_anomaly


@router.post("/reset")
def reset_anomalies():
    """Reset anomalies to default state."""
    global ANOMALIES_STORE
    ANOMALIES_STORE = [
        AnomalyItem(
            id="anom-01",
            building_id="lt-complex",
            building_name="LT Complex",
            timestamp="2 mins ago",
            severity="critical",
            metric="Occupancy / Heat",
            value="92% / 26.5°C",
            expected="< 80% / 23.5°C",
            score=0.91,
            description="IsolationForest flag: Critical density clustering in central lecture theater causing thermal overload.",
        ),
    ]
    return {"status": "reset", "active_count": len(ANOMALIES_STORE)}
