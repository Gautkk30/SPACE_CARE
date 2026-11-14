"""
Pydantic schemas for health telemetry ingestion, analysis, and retrieval.
"""

from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field, model_validator


class TelemetryBase(BaseModel):
    astronaut_id: str = Field(..., description="Target astronaut identifier")
    timestamp: Optional[datetime] = Field(
        default=None, 
        description="Observation timestamp in UTC (defaults to current time if omitted)"
    )
    heart_rate: float = Field(..., ge=20.0, le=250.0, description="Heart rate in bpm")
    spo2: float = Field(..., ge=50.0, le=100.0, description="Blood oxygen saturation (%)")
    blood_pressure_systolic: float = Field(..., ge=50.0, le=260.0, description="Systolic BP (mmHg)")
    blood_pressure_diastolic: float = Field(..., ge=30.0, le=160.0, description="Diastolic BP (mmHg)")
    body_temperature: Optional[float] = Field(default=None, ge=30.0, le=45.0, description="Core temperature (°C)")
    core_temperature: Optional[float] = Field(default=None, ge=30.0, le=45.0, description="Alias for body_temperature")
    respiration_rate: float = Field(..., ge=4.0, le=60.0, description="Respiration rate (breaths/min)")
    data_source: Optional[str] = Field(
        default="synthetic_simulated", 
        description="Provenance tag (e.g. synthetic_simulated, baseline_reference)"
    )

    @model_validator(mode="before")
    @classmethod
    def harmonize_temperature_and_timestamp(cls, data: dict):
        if isinstance(data, dict):
            # Harmonize core_temperature and body_temperature
            temp = data.get("body_temperature") or data.get("core_temperature")
            if temp is not None:
                data["body_temperature"] = float(temp)
                data["core_temperature"] = float(temp)
            # Default timestamp to UTC now if not provided
            if data.get("timestamp") is None:
                data["timestamp"] = datetime.now(timezone.utc)
        return data


class TelemetryCreate(TelemetryBase):
    pass


class TelemetryBatchCreate(BaseModel):
    telemetry: List[TelemetryCreate] = Field(..., description="Batch list of telemetry records")


class TelemetryResponse(BaseModel):
    id: int
    astronaut_id: str
    timestamp: datetime
    heart_rate: float
    spo2: float
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    body_temperature: float
    core_temperature: Optional[float] = None
    respiration_rate: float
    is_anomaly: bool = False
    anomaly_score: Optional[float] = None
    anomaly_reasons: Optional[str] = None
    data_source: str = "synthetic_simulated"

    @model_validator(mode="after")
    def set_core_temperature(self):
        if self.core_temperature is None:
            self.core_temperature = self.body_temperature
        return self

    model_config = ConfigDict(from_attributes=True)


class VitalsItemResponse(BaseModel):
    """
    Format aligned with docs/api_documentation.md for frontend vitals charts.
    """
    timestamp: datetime
    heart_rate: float
    blood_pressure_systolic: float
    blood_pressure_diastolic: float
    spo2: float
    respiration_rate: float
    core_temperature: float
    is_anomaly: Optional[bool] = False
    anomaly_reasons: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
