"""
Pydantic Schemas for Astronaut profiles.
SPACECARE - NASA Space Apps Challenge 2026
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AstronautBase(BaseModel):
    id: str = Field(..., description="Unique astronaut identifier, e.g. astro_03")
    name: str = Field(..., description="Astronaut full name")
    role: str = Field(..., description="Mission operational role")
    age: int = Field(..., ge=18, le=100, description="Age in years")
    gender: str = Field(..., description="Biological sex / gender")
    mission: str = Field(default="Artemis Lunar Transit", description="Current mission designation")
    is_demo: bool = Field(default=True, description="Indicates whether this is a simulated demo profile")

    # Baseline Vitals
    baseline_heart_rate: float = Field(..., ge=30.0, le=220.0, description="Resting heart rate setpoint (bpm)")
    baseline_systolic_bp: float = Field(..., ge=60.0, le=240.0, description="Resting systolic blood pressure (mmHg)")
    baseline_diastolic_bp: float = Field(..., ge=35.0, le=150.0, description="Resting diastolic blood pressure (mmHg)")
    baseline_spo2: float = Field(..., ge=70.0, le=100.0, description="Baseline arterial oxygen saturation (%)")
    baseline_body_temperature: float = Field(..., ge=34.0, le=42.0, description="Baseline core temperature (°C)")
    baseline_respiration_rate: float = Field(..., ge=6.0, le=50.0, description="Baseline respiration rate (breaths/min)")


class AstronautResponse(AstronautBase):
    created_at: datetime = Field(..., description="UTC creation timestamp")

    model_config = ConfigDict(from_attributes=True)
