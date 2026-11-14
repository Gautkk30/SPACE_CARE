"""
CRUD operations for Alert records.
SPACECARE - NASA Space Apps Challenge 2026
"""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert


def get_alert(db: Session, alert_id: str) -> Optional[Alert]:
    """Retrieves an alert by unique identifier."""
    return db.get(Alert, alert_id)


def get_astronaut_alerts(
    db: Session,
    astronaut_id: str,
    is_acknowledged: Optional[bool] = None,
    severity: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
) -> List[Alert]:
    """
    Retrieves alerts for an astronaut ordered newest first (timestamp DESC),
    with optional filtering by acknowledgment status and severity.
    """
    stmt = select(Alert).where(Alert.astronaut_id == astronaut_id)

    if is_acknowledged is not None:
        stmt = stmt.where(Alert.is_acknowledged == is_acknowledged)

    if severity is not None:
        stmt = stmt.where(Alert.severity == severity.upper())

    stmt = stmt.order_by(Alert.timestamp.desc()).offset(offset).limit(limit)
    return list(db.scalars(stmt).all())


def acknowledge_alert(db: Session, alert_id: str) -> Optional[Alert]:
    """
    Acknowledges an alert by setting is_acknowledged=True.
    Returns the updated Alert or None if the alert does not exist.
    """
    alert = db.get(Alert, alert_id)
    if alert is None:
        return None

    alert.is_acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert
