"""
Health Telemetry SQLAlchemy model.
Stores time-series physiological measurements and ML anomaly indicators.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class HealthTelemetry(Base):
    __tablename__ = "health_telemetry"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    astronaut_id = Column(String(50), ForeignKey("astronauts.id"), nullable=False, index=True)
    
    # Telemetry Timestamp
    timestamp = Column(
        DateTime, 
        nullable=False, 
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )

    # Core Physiological Metrics
    heart_rate = Column(Float, nullable=False)                 # Beats per minute (bpm)
    spo2 = Column(Float, nullable=False)                       # Blood Oxygen Saturation (%)
    blood_pressure_systolic = Column(Float, nullable=False)    # Systolic blood pressure (mmHg)
    blood_pressure_diastolic = Column(Float, nullable=False)   # Diastolic blood pressure (mmHg)
    body_temperature = Column(Float, nullable=False)           # Body temperature (°C)
    respiration_rate = Column(Float, nullable=False)           # Respiration rate (breaths per min)

    # Machine Learning & Early Warning Indicators
    is_anomaly = Column(Boolean, default=False, index=True)    # Flagged by ML or clinical rule
    anomaly_score = Column(Float, nullable=True)               # Isolation Forest score (<0 = outlier)
    anomaly_reasons = Column(String(500), nullable=True)       # Descriptive physiological deviations
    
    # Provenance tracking (adheres to NASA challenge transparency rules)
    data_source = Column(String(100), default="synthetic_simulated", nullable=False)
    
    created_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    astronaut = relationship("Astronaut", back_populates="telemetry")

    def __repr__(self) -> str:
        return (
            f"<HealthTelemetry(id={self.id}, astronaut_id='{self.astronaut_id}', "
            f"timestamp={self.timestamp}, HR={self.heart_rate}, SpO2={self.spo2}, "
            f"is_anomaly={self.is_anomaly})>"
        )
