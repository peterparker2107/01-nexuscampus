from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from app.ml.isolation_forest import detector

router = APIRouter(prefix="/api/telemetry", tags=["telemetry"])


class TelemetryReading(BaseModel):
    building_id: str
    occupancy: float = Field(..., ge=0, le=100, description="Occupancy percentage")
    temperature: float = Field(..., description="Temperature in Celsius")
    wifi_devices: int = Field(..., ge=0, description="Connected WiFi client devices")
    power_kw: float = Field(..., ge=0, description="Power load in kW")
    timestamp: Optional[str] = None


class BuildingState(BaseModel):
    id: str
    name: str
    code: str
    type: str
    capacity: int
    occupancy: float
    current_occupants: int
    temperature: float
    humidity: float
    power_kw: float
    wifi_devices: int
    status: str
    anomaly_score: float
    anomaly_reason: Optional[str] = None


# Initial 10 TIET Buildings Store
CAMPUS_STORE: Dict[str, BuildingState] = {
    "csed": BuildingState(
        id="csed",
        name="CSED Block",
        code="CS-BLOCK",
        type="academic",
        capacity=1200,
        occupancy=84.0,
        current_occupants=1008,
        temperature=24.2,
        humidity=52.0,
        power_kw=185.4,
        wifi_devices=1140,
        status="warning",
        anomaly_score=0.68,
        anomaly_reason="Surge in WiFi connections exceeding expected lab capacity",
    ),
    "mba": BuildingState(
        id="mba",
        name="MBA Block (LMTSOM)",
        code="LMTSOM",
        type="academic",
        capacity=700,
        occupancy=56.0,
        current_occupants=392,
        temperature=22.8,
        humidity=48.0,
        power_kw=92.0,
        wifi_devices=410,
        status="normal",
        anomaly_score=0.12,
    ),
    "lt-complex": BuildingState(
        id="lt-complex",
        name="LT Complex",
        code="LT-1/10",
        type="academic",
        capacity=2500,
        occupancy=92.0,
        current_occupants=2300,
        temperature=26.5,
        humidity=61.0,
        power_kw=310.2,
        wifi_devices=2450,
        status="critical",
        anomaly_score=0.91,
        anomaly_reason="HVAC thermal load spike + high density crowding in central atrium",
    ),
    "central-library": BuildingState(
        id="central-library",
        name="Central Library",
        code="NAV-LIB",
        type="library",
        capacity=1500,
        occupancy=67.0,
        current_occupants=1005,
        temperature=21.5,
        humidity=45.0,
        power_kw=140.8,
        wifi_devices=980,
        status="normal",
        anomaly_score=0.08,
    ),
    "hostel-a": BuildingState(
        id="hostel-a",
        name="Hostel A",
        code="HSTL-A",
        type="hostel",
        capacity=650,
        occupancy=48.0,
        current_occupants=312,
        temperature=23.0,
        humidity=50.0,
        power_kw=85.3,
        wifi_devices=520,
        status="normal",
        anomaly_score=0.15,
    ),
    "hostel-l": BuildingState(
        id="hostel-l",
        name="Hostel L",
        code="HSTL-L",
        type="hostel",
        capacity=800,
        occupancy=62.0,
        current_occupants=496,
        temperature=23.4,
        humidity=53.0,
        power_kw=110.0,
        wifi_devices=710,
        status="normal",
        anomaly_score=0.18,
    ),
    "sports-complex": BuildingState(
        id="sports-complex",
        name="Sports Complex",
        code="SPR-CMP",
        type="recreational",
        capacity=900,
        occupancy=35.0,
        current_occupants=315,
        temperature=25.1,
        humidity=58.0,
        power_kw=74.5,
        wifi_devices=290,
        status="normal",
        anomaly_score=0.05,
    ),
    "admin-block": BuildingState(
        id="admin-block",
        name="Admin Block",
        code="ADM-HQ",
        type="administrative",
        capacity=500,
        occupancy=42.0,
        current_occupants=210,
        temperature=22.0,
        humidity=46.0,
        power_kw=68.9,
        wifi_devices=230,
        status="normal",
        anomaly_score=0.09,
    ),
    "ece-block": BuildingState(
        id="ece-block",
        name="ECE Block",
        code="ECE-DEPT",
        type="academic",
        capacity=950,
        occupancy=78.0,
        current_occupants=741,
        temperature=24.8,
        humidity=51.0,
        power_kw=138.6,
        wifi_devices=820,
        status="normal",
        anomaly_score=0.22,
    ),
    "mech-block": BuildingState(
        id="mech-block",
        name="Mech Block",
        code="MED-ENG",
        type="academic",
        capacity=850,
        occupancy=81.0,
        current_occupants=688,
        temperature=27.2,
        humidity=55.0,
        power_kw=245.0,
        wifi_devices=690,
        status="warning",
        anomaly_score=0.61,
        anomaly_reason="High machinery workshop power draw and elevated thermal readings",
    ),
}


@router.get("/buildings", response_model=List[BuildingState])
def get_all_buildings():
    """Retrieve current telemetry and status for all 10 TIET campus buildings."""
    return list(CAMPUS_STORE.values())


@router.get("/buildings/{building_id}", response_model=BuildingState)
def get_building(building_id: str):
    """Retrieve telemetry for a specific building by ID."""
    b_id = building_id.lower().strip()
    if b_id not in CAMPUS_STORE:
        raise HTTPException(status_code=404, detail=f"Building '{building_id}' not found.")
    return CAMPUS_STORE[b_id]


@router.post("/ingest", response_model=BuildingState)
def ingest_telemetry(payload: TelemetryReading):
    """
    Ingest live IoT sensor reading, evaluate anomaly with IsolationForest,
    and update building state.
    """
    b_id = payload.building_id.lower().strip()
    if b_id not in CAMPUS_STORE:
        raise HTTPException(status_code=404, detail=f"Building '{payload.building_id}' not found.")

    score_res = detector.score(
        occupancy=payload.occupancy,
        temperature=payload.temperature,
        wifi_devices=payload.wifi_devices,
        power_kw=payload.power_kw,
    )

    building = CAMPUS_STORE[b_id]
    building.occupancy = payload.occupancy
    building.current_occupants = int((payload.occupancy / 100.0) * building.capacity)
    building.temperature = payload.temperature
    building.wifi_devices = payload.wifi_devices
    building.power_kw = payload.power_kw
    building.status = score_res["severity"]
    building.anomaly_score = score_res["anomaly_score"]
    building.anomaly_reason = score_res["reason"] if score_res["is_anomaly"] else None

    return building
