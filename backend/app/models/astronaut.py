"""
Astronaut profile model (SQLAlchemy 2.x).
Maintains crew member identity, mission role, and personalized baseline physiological vitals.
"""

from datetime import datetime, timezone
from typing import List, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.session import Base

if TYPE_CHECKING:
    from app.models.telemetry import Telemetry
    from app.models.alert import Alert


class Astronaut(Base):
    __tablename__ = "astronauts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    age: Mapped[int] = mapped_column(Integer, nullable=False)
    gender: Mapped[str] = mapped_column(String(20), nullable=False)
    mission: Mapped[str] = mapped_column(String(100), default="Artemis Lunar Transit")
    
    # Flag to clearly indicate synthetic/demo profiles vs real mission crew
    is_demo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Personalized baseline physiological vitals
    baseline_heart_rate: Mapped[float] = mapped_column(Float, nullable=False, default=70.0)
    baseline_systolic_bp: Mapped[float] = mapped_column(Float, nullable=False, default=118.0)
    baseline_diastolic_bp: Mapped[float] = mapped_column(Float, nullable=False, default=76.0)
    baseline_spo2: Mapped[float] = mapped_column(Float, nullable=False, default=98.5)
    baseline_body_temperature: Mapped[float] = mapped_column(Float, nullable=False, default=36.7)
    baseline_respiration_rate: Mapped[float] = mapped_column(Float, nullable=False, default=14.0)

    # Timestamps consistently stored in UTC
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    telemetry: Mapped[List["Telemetry"]] = relationship(
        "Telemetry",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        order_by="Telemetry.timestamp.desc()"
    )
    alerts: Mapped[List["Alert"]] = relationship(
        "Alert",
        back_populates="astronaut",
        cascade="all, delete-orphan",
        order_by="Alert.timestamp.desc()"
    )

    def __repr__(self) -> str:
        return f"<Astronaut(id='{self.id}', name='{self.name}', role='{self.role}', is_demo={self.is_demo})>"
