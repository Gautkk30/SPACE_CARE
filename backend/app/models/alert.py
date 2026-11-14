"""
Alert model for early physiological warnings and protocol recommendations.
Stores system-generated alerts triggered by ML anomaly detection or rule thresholds.
"""

from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.database.session import Base


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(50), primary_key=True, index=True)      # e.g., "alt_001"
    astronaut_id = Column(String(50), ForeignKey("astronauts.id"), nullable=False, index=True)
    
    # Alert Classification
    severity = Column(String(20), nullable=False)              # "INFO", "WARNING", "CRITICAL"
    category = Column(String(50), nullable=False)              # e.g., "CARDIOVASCULAR", "RESPIRATORY", "THERMAL"
    
    # Message & Actionable Guidance
    # Objective physiological observations, non-diagnostic
    message = Column(String(255), nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.85)
    
    # Countermeasure / Mitigation Protocol recommendation
    recommendation = Column(String(500), nullable=False)
    
    # Acknowledgment state
    is_acknowledged = Column(Boolean, default=False, nullable=False)
    
    timestamp = Column(
        DateTime, 
        nullable=False, 
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )
    created_at = Column(
        DateTime, 
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship
    astronaut = relationship("Astronaut", back_populates="alerts")

    def __repr__(self) -> str:
        return (
            f"<Alert(id='{self.id}', astronaut_id='{self.astronaut_id}', "
            f"severity='{self.severity}', message='{self.message}')>"
        )
