"""
Alert model (SQLAlchemy 2.x).
Stores physiological early warning alerts and countermeasure protocol recommendations.
"""

from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.astronaut import Astronaut


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(50), 
        ForeignKey("astronauts.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    # Alert Severity & Category
    severity: Mapped[str] = mapped_column(String(20), nullable=False)          # "INFO", "WARNING", "CRITICAL"
    category: Mapped[str] = mapped_column(String(50), nullable=False)          # "CARDIOVASCULAR", "RESPIRATORY", etc.
    
    # Objective non-diagnostic physiological observation
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.85)
    
    # Operational countermeasure protocol recommendation
    recommendation: Mapped[str] = mapped_column(String(500), nullable=False)
    
    # State tracking
    is_acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # UTC Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="alerts")

    def __repr__(self) -> str:
        return (
            f"<Alert(id='{self.id}', astronaut_id='{self.astronaut_id}', "
            f"severity='{self.severity}', message='{self.message}')>"
        )
