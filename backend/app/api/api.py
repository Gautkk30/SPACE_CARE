"""
Main API router aggregator for SPACECARE.
NASA Space Apps Challenge 2026
"""

from fastapi import APIRouter
from app.api.routes import astronauts, telemetry, alerts

api_router = APIRouter()

api_router.include_router(astronauts.router, prefix="/astronauts", tags=["Astronauts"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Alerts"])
