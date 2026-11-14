"""
Astronaut profile model.
Maintains crew member identity, mission role, and personalized baseline physiological vitals.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime
from sqlalchemy.orm import relationship
from app.database.session import Base


class Astronaut(Base):
    __tablename__ = "astronauts"

    id = Column(String(50), primary_key=True, index=True)  # e.g., "astro_01"
    name = Column(String(100), nullable=False)
    role = Column(String(100), nullable=False)              # e.g., "Mission Commander"
    age = Column(Integer, nullable=False)
    gender = Column(String(20), nullable=False)
    mission = Column(String(100), default="Artemis Lunar Transit")

    # Personalized astronaut baseline vitals
    # Used for individual-specific anomaly detection & baseline deviation tracking
    baseline_heart_rate = Column(Float, nullable=False, default=70.0)         # bpm
    baseline_systolic_bp = Column(Float, nullable=False, default=118.0)       # mmHg
    baseline_diastolic_bp = Column(Float, nullable=False, default=76.0)       # mmHg
    baseline_spo2 = Column(Float, nullable=False, default=98.5)               # %
    baseline_body_temperature = Column(Float, nullable=False, default=36.7)   # °C
    baseline_respiration_rate = Column(Float, nullable=False, default=14.0)   # breaths/min

    created_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    telemetry = relationship(
        "HealthTelemetry", 
        back_populates="astronaut", 
        cascade="all, delete-orphan",
        order_by="HealthTelemetry.timestamp.desc()"
    )
    alerts = relationship(
        "Alert", 
        back_populates="astronaut", 
        cascade="all, delete-orphan",
        order_by="Alert.timestamp.desc()"
    )

    def __repr__(self) -> str:
        return f"<Astronaut(id='{self.id}', name='{self.name}', role='{self.role}')>"
