"""
Pydantic schemas for Astronaut profile management.
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class AstronautBase(BaseModel):
    id: str = Field(..., description="Unique astronaut identifier, e.g. 'astro_01'")
    name: str = Field(..., description="Full name of crew member")
    role: str = Field(..., description="Mission role or title, e.g. 'Mission Commander'")
    age: int = Field(..., ge=20, le=80, description="Age in years")
    gender: str = Field(..., description="Gender (e.g., 'Male', 'Female', 'Non-Binary')")
    mission: str = Field(default="Artemis Lunar Transit", description="Current mission designation")

    # Baseline physiological thresholds for individualized tracking
    baseline_heart_rate: float = Field(default=70.0, description="Resting baseline HR (bpm)")
    baseline_systolic_bp: float = Field(default=118.0, description="Baseline systolic BP (mmHg)")
    baseline_diastolic_bp: float = Field(default=76.0, description="Baseline diastolic BP (mmHg)")
    baseline_spo2: float = Field(default=98.5, description="Baseline SpO2 (%)")
    baseline_body_temperature: float = Field(default=36.7, description="Baseline core temperature (°C)")
    baseline_respiration_rate: float = Field(default=14.0, description="Baseline respiration rate (breaths/min)")


class AstronautCreate(AstronautBase):
    pass


class AstronautUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    mission: Optional[str] = None
    baseline_heart_rate: Optional[float] = None
    baseline_systolic_bp: Optional[float] = None
    baseline_diastolic_bp: Optional[float] = None
    baseline_spo2: Optional[float] = None
    baseline_body_temperature: Optional[float] = None
    baseline_respiration_rate: Optional[float] = None


class AstronautResponse(AstronautBase):
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
