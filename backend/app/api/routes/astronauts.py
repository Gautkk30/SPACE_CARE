"""
Astronaut profile, historical telemetry, and alert query routes.
SPACECARE - NASA Space Apps Challenge 2026
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.crud.crud_astronaut import get_astronaut, get_astronauts
from app.crud.crud_telemetry import get_astronaut_telemetry
from app.crud.crud_alert import get_astronaut_alerts
from app.schemas.astronaut import AstronautResponse
from app.schemas.telemetry import TelemetryResponse
from app.schemas.alert import AlertResponse

router = APIRouter()


@router.get(
    "",
    response_model=List[AstronautResponse],
    summary="List astronaut profiles",
    description="Retrieves a paginated list of astronaut profiles."
)
def list_astronauts(
    skip: int = Query(0, ge=0, description="Records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Maximum records to return"),
    db: Session = Depends(get_db)
):
    return get_astronauts(db, skip=skip, limit=limit)


@router.get(
    "/{astronaut_id}",
    response_model=AstronautResponse,
    summary="Retrieve astronaut profile",
    description="Retrieves a specific astronaut profile by unique identifier."
)
def retrieve_astronaut(
    astronaut_id: str,
    db: Session = Depends(get_db)
):
    astro = get_astronaut(db, astronaut_id=astronaut_id)
    if astro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found."
        )
    return astro


@router.get(
    "/{astronaut_id}/telemetry",
    response_model=List[TelemetryResponse],
    summary="Retrieve astronaut telemetry history",
    description="Retrieves chronological telemetry history for an astronaut, ordered newest first."
)
def retrieve_astronaut_telemetry(
    astronaut_id: str,
    limit: int = Query(50, ge=1, le=500, description="Maximum readings to return"),
    offset: int = Query(0, ge=0, description="Records to skip"),
    db: Session = Depends(get_db)
):
    # Verify astronaut exists
    astro = get_astronaut(db, astronaut_id=astronaut_id)
    if astro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found."
        )
    return get_astronaut_telemetry(db, astronaut_id=astronaut_id, limit=limit, offset=offset)


@router.get(
    "/{astronaut_id}/alerts",
    response_model=List[AlertResponse],
    summary="Retrieve astronaut alerts",
    description="Retrieves alerts for an astronaut, with optional filtering by acknowledgment status and severity."
)
def retrieve_astronaut_alerts(
    astronaut_id: str,
    is_acknowledged: Optional[bool] = Query(None, description="Filter by acknowledgment state"),
    severity: Optional[str] = Query(None, description="Filter by severity level: INFO, WARNING, or CRITICAL"),
    limit: int = Query(50, ge=1, le=500, description="Maximum alerts to return"),
    offset: int = Query(0, ge=0, description="Records to skip"),
    db: Session = Depends(get_db)
):
    # Verify astronaut exists
    astro = get_astronaut(db, astronaut_id=astronaut_id)
    if astro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Astronaut with ID '{astronaut_id}' not found."
        )
    return get_astronaut_alerts(
        db,
        astronaut_id=astronaut_id,
        is_acknowledged=is_acknowledged,
        severity=severity,
        limit=limit,
        offset=offset
    )
