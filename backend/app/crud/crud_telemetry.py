"""
CRUD operations for Telemetry records.
SPACECARE - NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.telemetry import Telemetry
from app.schemas.telemetry import TelemetryCreate


def create_telemetry(db: Session, obj_in: TelemetryCreate) -> Telemetry:
    """
    Persists a new physiological telemetry reading to SQLite.
    Normalizes timestamps to UTC.
    """
    ts = obj_in.timestamp or datetime.now(timezone.utc)
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    db_obj = Telemetry(
        astronaut_id=obj_in.astronaut_id,
        timestamp=ts,
        heart_rate=obj_in.heart_rate,
        systolic_bp=obj_in.systolic_bp,
        diastolic_bp=obj_in.diastolic_bp,
        spo2=obj_in.spo2,
        body_temperature=obj_in.body_temperature,
        respiration_rate=obj_in.respiration_rate,
        data_source=obj_in.data_source.value,
        is_simulated=obj_in.is_simulated,
        dataset_reference=obj_in.dataset_reference,
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def get_astronaut_telemetry(
    db: Session,
    astronaut_id: str,
    limit: int = 50,
    offset: int = 0
) -> List[Telemetry]:
    """
    Retrieves chronological telemetry history for a specific astronaut,
    ordered newest first (timestamp DESC).
    """
    stmt = (
        select(Telemetry)
        .where(Telemetry.astronaut_id == astronaut_id)
        .order_by(Telemetry.timestamp.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.scalars(stmt).all())
