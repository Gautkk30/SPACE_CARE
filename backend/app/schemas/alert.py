"""
Pydantic Schemas for Alert retrieval and acknowledgement.
SPACECARE - NASA Space Apps Challenge 2026
"""

from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AlertResponse(BaseModel):
    """
    Alert record representing a physiological or multi-hazard warning.
    Strictly conforms to fields persisted in the SQLite Alert table.
    """
    id: str = Field(..., description="Unique alert identifier, e.g. alt_acute_severe_tachycardia_8a3f91")
    astronaut_id: str = Field(..., description="Target astronaut identifier")
    severity: str = Field(..., description="Alert severity: INFO, WARNING, or CRITICAL")
    category: str = Field(..., description="Hazard domain classification")
    message: str = Field(..., description="Objective, non-diagnostic observation message")
    recommendation: str = Field(..., description="Operational flight surgeon countermeasure protocol recommendation")
    is_acknowledged: bool = Field(..., description="Whether the flight controller or astronaut has acknowledged this alert")
    timestamp: datetime = Field(..., description="UTC timestamp of the anomalous observation")
    created_at: datetime = Field(..., description="UTC database creation timestamp")

    model_config = ConfigDict(from_attributes=True)


class AlertAcknowledgeResponse(BaseModel):
    """Response returned upon successfully acknowledging an alert."""
    alert: AlertResponse
    status: str = Field(default="acknowledged", description="Operational acknowledgement confirmation status")
