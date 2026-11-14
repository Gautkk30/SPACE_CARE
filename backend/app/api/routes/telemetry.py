"""
Telemetry ingestion routes.
SPACECARE - NASA Space Apps Challenge 2026
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.crud.crud_astronaut import get_astronaut
from app.crud.crud_telemetry import create_telemetry
from app.schemas.telemetry import TelemetryCreate, TelemetryIngestResponse, TelemetryResponse
from app.services.risk_service import risk_service

router = APIRouter()


@router.post(
    "",
    response_model=TelemetryIngestResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Validate and store a telemetry reading",
    description=(
        "Validates physiological bounds and data provenance, persists the reading to SQLite, "
        "executes the multi-hazard risk engine, deduplicates any resulting alerts, and returns "
        "the saved telemetry along with an assessment summary."
    )
)
def ingest_telemetry(
    payload: TelemetryCreate,
    db: Session = Depends(get_db)
):
    # 1. Verify target astronaut exists in database
    astro = get_astronaut(db, astronaut_id=payload.astronaut_id)
    if astro is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cannot store telemetry: Astronaut with ID '{payload.astronaut_id}' not found in database."
        )

    # 2. Persist telemetry reading to database
    telemetry_obj = create_telemetry(db, obj_in=payload)

    # 3. Execute multi-hazard risk assessment and alert generation
    assessment_summary = risk_service.assess_and_persist(
        db=db,
        telemetry_obj=telemetry_obj,
        raw_payload=payload,
        astro=astro
    )

    # 4. Return composite ingestion response
    return TelemetryIngestResponse(
        telemetry=TelemetryResponse.model_validate(telemetry_obj),
        assessment_summary=assessment_summary
    )
