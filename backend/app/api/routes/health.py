
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.schemas.health import ManualHealthInput
from app.database.connection import get_db
from app.models.health import HealthReading

router = APIRouter()


def format_timestamp(value):
    """Return a timezone-aware UTC timestamp."""
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)

    return value.isoformat()


@router.post(
    "/manual",
    status_code=status.HTTP_201_CREATED,
    summary="Submit and store astronaut health readings",
)
def submit_manual_health_reading(
    payload: ManualHealthInput,
    db: Session = Depends(get_db),
):
    """
    Validate and permanently store manually entered health readings.

    This endpoint does not provide a medical diagnosis or ML prediction.
    """

    reading = HealthReading(**payload.model_dump())

    try:
        db.add(reading)
        db.commit()
        db.refresh(reading)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save health reading to database."
        )

    return {
        "status": "accepted",
        "source": "manual_entry",
        "record_id": reading.id,
        "astronaut_id": reading.astronaut_id,
        "recorded_at": format_timestamp(reading.recorded_at),
        "readings": payload.model_dump(),
        "assessment": {
            "status": "not_performed",
            "message": (
                "Readings were validated and stored successfully. "
                "Clinical assessment and ML analysis are not performed."
            ),
        },
        "disclaimer": (
            "SPACECARE is a research and decision-support prototype, "
            "not a medical diagnostic system."
        ),
    }


@router.get(
    "/history",
    summary="Retrieve stored astronaut health readings",
)
def get_health_history(
    astronaut_id: str = Query(..., min_length=1, max_length=50),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Retrieve the latest stored readings for an astronaut."""

    readings = (
        db.query(HealthReading)
        .filter(HealthReading.astronaut_id == astronaut_id)
        .order_by(HealthReading.recorded_at.desc())
        .limit(limit)
        .all()
    )

    return {
        "astronaut_id": astronaut_id,
        "count": len(readings),
        "readings": [
            {
                "record_id": item.id,
                "astronaut_id": item.astronaut_id,
                "heart_rate": item.heart_rate,
                "spo2": item.spo2,
                "systolic_bp": item.systolic_bp,
                "diastolic_bp": item.diastolic_bp,
                "body_temperature": item.body_temperature,
                "respiration_rate": item.respiration_rate,
                "hrv_rmssd": item.hrv_rmssd,
                "recorded_at": format_timestamp(item.recorded_at),
            }
            for item in readings
        ],
    }
