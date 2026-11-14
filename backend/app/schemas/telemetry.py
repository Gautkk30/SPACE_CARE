"""
Pydantic Schemas for Telemetry ingestion, historical queries, and risk summaries.
SPACECARE - NASA Space Apps Challenge 2026
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.models.data_source import DataSource


class TelemetryBase(BaseModel):
    astronaut_id: str = Field(..., description="Target astronaut identifier, e.g. 'astro_03'")
    timestamp: Optional[datetime] = Field(
        default=None,
        description="Reading observation timestamp (timezone-aware UTC). Defaults to current UTC time if omitted."
    )

    # Core Physiological Readings (with strict physiological plausibility bounds)
    heart_rate: float = Field(..., ge=20.0, le=250.0, description="Heart rate (bpm)")
    systolic_bp: float = Field(..., ge=50.0, le=260.0, description="Systolic arterial pressure (mmHg)")
    diastolic_bp: float = Field(..., ge=30.0, le=160.0, description="Diastolic arterial pressure (mmHg)")
    spo2: float = Field(..., ge=50.0, le=100.0, description="Peripheral oxygen saturation (%)")
    body_temperature: float = Field(..., ge=30.0, le=45.0, description="Core body temperature (°C)")
    respiration_rate: float = Field(..., ge=4.0, le=60.0, description="Respiration rate (breaths/min)")

    # Data Provenance & Ethics
    data_source: DataSource = Field(
        default=DataSource.SYNTHETIC_SIMULATED,
        description="Telemetry provenance category (NASA_RESEARCH, SYNTHETIC_SIMULATED, SENSOR_LIVE)"
    )
    is_simulated: bool = Field(
        default=True,
        description="Explicit simulation flag. True for synthetic telemetry, False for authentic data."
    )
    dataset_reference: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional tracking reference, batch run tag, or source dataset identifier"
    )

    # Optional Auxiliary Multi-Hazard Streams (assessed by risk engine if present)
    dose_rate: Optional[float] = Field(default=None, ge=0.0, description="Radiation dose rate (uSv/h)")
    cumulative_exposure: Optional[float] = Field(default=None, ge=0.0, description="Cumulative radiation dose (uSv)")
    sleep_duration: Optional[float] = Field(default=None, ge=0.0, le=24.0, description="Recent sleep duration (hours)")
    cumulative_sleep_debt: Optional[float] = Field(default=None, ge=0.0, description="Cumulative sleep debt (hours)")
    workload_score: Optional[float] = Field(default=None, ge=1.0, le=10.0, description="Subjective cognitive workload (1-10)")
    mood_score: Optional[float] = Field(default=None, ge=1.0, le=10.0, description="Subjective mood valence (1-10)")
    communication_latency_seconds: Optional[float] = Field(default=None, ge=0.0, description="One-way light time latency (seconds)")
    exercise_deficit_daily: Optional[float] = Field(default=None, ge=0.0, description="Daily countermeasure exercise deficit (minutes)")
    cabin_pressure_kpa: Optional[float] = Field(default=None, ge=0.0, le=150.0, description="Atmospheric cabin total pressure (kPa)")
    o2_partial_pressure_kpa: Optional[float] = Field(default=None, ge=0.0, description="Inspired oxygen partial pressure (kPa)")
    co2_partial_pressure_kpa: Optional[float] = Field(default=None, ge=0.0, description="Carbon dioxide partial pressure (kPa)")
    pressure_drop_rate: Optional[float] = Field(default=None, description="Cabin pressure change velocity (kPa/min)")
    cabin_temperature: Optional[float] = Field(default=None, description="Ambient cabin temperature (°C)")

    @model_validator(mode="after")
    def validate_provenance_consistency(self) -> "TelemetryBase":
        """
        Enforces strict consistency between data_source and is_simulated:
        1. SYNTHETIC_SIMULATED data must have is_simulated=True.
        2. Real sensor or NASA research data must NOT have is_simulated=True.
        """
        if self.data_source == DataSource.SYNTHETIC_SIMULATED:
            if not self.is_simulated:
                raise ValueError("Telemetry marked with data_source 'SYNTHETIC_SIMULATED' must have is_simulated=True.")
        elif self.data_source in (DataSource.SENSOR_LIVE, DataSource.NASA_RESEARCH):
            if self.is_simulated:
                raise ValueError(
                    f"Authentic telemetry with data_source '{self.data_source.value}' cannot have is_simulated=True."
                )

        # Pulse pressure physical consistency
        if self.systolic_bp <= self.diastolic_bp:
            raise ValueError(
                f"Systolic blood pressure ({self.systolic_bp} mmHg) must be strictly greater than "
                f"diastolic blood pressure ({self.diastolic_bp} mmHg)."
            )

        return self


class TelemetryCreate(TelemetryBase):
    """Payload for submitting a new telemetry reading."""
    pass


class TelemetryResponse(BaseModel):
    """Response representing a stored telemetry record."""
    id: int
    astronaut_id: str
    timestamp: datetime
    heart_rate: float
    systolic_bp: float
    diastolic_bp: float
    spo2: float
    body_temperature: float
    respiration_rate: float
    data_source: str
    is_simulated: bool
    dataset_reference: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AssessmentSummaryResponse(BaseModel):
    """
    Summary of the multi-hazard risk assessment conducted upon telemetry ingestion.
    """
    overall_status: str = Field(..., description="Overall mission hazard status: NOMINAL, ELEVATED_RISK, CRITICAL_RISK, or DATA_QUALITY_ISSUE")
    physiological_status: str = Field(default="NOMINAL", description="Status of core physiological biometrics: NOMINAL, ELEVATED_RISK, CRITICAL_RISK, or DATA_QUALITY_ISSUE")
    highest_severity: str = Field(..., description="INFO, WARNING, or CRITICAL")
    primary_hazard: str = Field(..., description="Primary hazard category driving the alert")
    assessed_domains: List[str] = Field(..., description="Hazard domains with active sensor streams in this packet")
    unmonitored_domains: List[str] = Field(..., description="Hazard domains lacking telemetry in this packet")
    evidence_status: str = Field(..., description="Physiological channel evidence status (NOMINAL, STALE_DATA, INSUFFICIENT_EVIDENCE)")
    overall_evidence_status: str = Field(..., description="Overall multi-hazard monitoring status (PARTIAL_MONITORING or COMPLETE_MULTI_HAZARD)")
    ml_anomaly_detected: bool = Field(..., description="Whether Isolation Forest flagged a multi-variate outlier")
    ml_anomaly_score: float = Field(
        ...,
        description="Inverted Isolation Forest distance index (-decision_function). Uncalibrated statistical isolation score measuring divergence from nominal training distribution; NOT a clinical probability or medical percentage."
    )
    heuristic_explanations: List[Dict[str, Any]] = Field(default_factory=list, description="Top heuristic feature deviations explaining ML score")
    alerts_created_count: int = Field(..., description="Number of new database alerts created from this reading")
    new_alert_ids: List[str] = Field(default_factory=list, description="IDs of freshly committed alerts")
    active_open_alert_ids: List[str] = Field(default_factory=list, description="IDs of currently open active alerts for this condition")


class TelemetryIngestResponse(BaseModel):
    """Composite response returned upon successful POST /api/v1/telemetry ingestion."""
    telemetry: TelemetryResponse
    assessment_summary: AssessmentSummaryResponse
