"""
Telemetry model (SQLAlchemy 2.x).
Stores timestamped physiological readings, data provenance, and simulation flags.
"""

from datetime import datetime, timezone
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Integer, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.ext.hybrid import hybrid_property
from app.database.session import Base
from app.models.data_source import DataSource

if TYPE_CHECKING:
    from app.models.astronaut import Astronaut


class Telemetry(Base):
    __tablename__ = "telemetry"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True, index=True)
    astronaut_id: Mapped[str] = mapped_column(
        String(50), 
        ForeignKey("astronauts.id", ondelete="CASCADE"), 
        nullable=False, 
        index=True
    )
    
    # Consistent UTC Timestamp
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
        default=lambda: datetime.now(timezone.utc)
    )

    # Core Physiological Readings
    heart_rate: Mapped[float] = mapped_column(Float, nullable=False)               # bpm
    systolic_bp: Mapped[float] = mapped_column(Float, nullable=False)              # mmHg
    diastolic_bp: Mapped[float] = mapped_column(Float, nullable=False)             # mmHg
    spo2: Mapped[float] = mapped_column(Float, nullable=False)                     # %
    body_temperature: Mapped[float] = mapped_column(Float, nullable=False)         # °C
    respiration_rate: Mapped[float] = mapped_column(Float, nullable=False)         # breaths/min

    # Data Provenance & Ethics
    data_source: Mapped[str] = mapped_column(
        String(50), 
        nullable=False, 
        default=DataSource.SYNTHETIC_SIMULATED.value
    )
    is_simulated: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    dataset_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Metadata creation timestamp
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationship
    astronaut: Mapped["Astronaut"] = relationship("Astronaut", back_populates="telemetry")

    # Compatibility aliases
    @hybrid_property
    def blood_pressure_systolic(self) -> float:
        return self.systolic_bp

    @hybrid_property
    def blood_pressure_diastolic(self) -> float:
        return self.diastolic_bp

    @hybrid_property
    def core_temperature(self) -> float:
        return self.body_temperature

    def __repr__(self) -> str:
        return (
            f"<Telemetry(id={self.id}, astronaut_id='{self.astronaut_id}', "
            f"timestamp={self.timestamp}, HR={self.heart_rate}, "
            f"BP={self.systolic_bp}/{self.diastolic_bp}, "
            f"SpO2={self.spo2}, source='{self.data_source}')>"
        )
