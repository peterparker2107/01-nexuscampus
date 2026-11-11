from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.routers import telemetry, anomaly
from app.ml.isolation_forest import detector


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure baseline model is trained offline at startup
    if not detector.is_trained:
        detector._train_baseline()
    yield


app = FastAPI(
    title="NexusCampus API — TIET Live Digital Twin",
    description="Offline-first spatial telemetry and Isolation Forest anomaly detection engine for TIET Patiala.",
    version="2.5.0",
    lifespan=lifespan,
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(telemetry.router)
app.include_router(anomaly.router)


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint for container health probes."""
    return {
        "status": "ok",
        "service": "nexuscampus-backend",
        "model": "scikit-learn IsolationForest",
        "model_trained": detector.is_trained,
        "offline_ready": True,
        "version": "2.5.0",
    }


@app.get("/", tags=["root"])
def root():
    return {
        "name": "NexusCampus — TIET Digital Twin API",
        "version": "2.5.0",
        "docs_url": "/docs",
        "health_url": "/health",
        "hackathon": "PromptWars 2025 (TIET Patiala)",
    }
