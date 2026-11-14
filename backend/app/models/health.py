
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, Integer, String

from app.database.connection import Base


class HealthReading(Base):
    __tablename__ = "health_readings"

    id = Column(Integer, primary_key=True, index=True)

    astronaut_id = Column(String(50), nullable=False, index=True)

    heart_rate = Column(Float, nullable=False)
    spo2 = Column(Float, nullable=False)

    systolic_bp = Column(Float, nullable=False)
    diastolic_bp = Column(Float, nullable=False)

    body_temperature = Column(Float, nullable=False)
    respiration_rate = Column(Float, nullable=False)

    hrv_rmssd = Column(Float, nullable=False)

    recorded_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
