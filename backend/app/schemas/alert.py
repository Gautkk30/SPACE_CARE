"""
Pydantic schemas for early warning alerts and protocol recommendations.
"""

from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, model_validator


class AlertBase(BaseModel):
    astronaut_id: str = Field(..., description="Target astronaut identifier")
    severity: str = Field(..., description="Severity level: 'INFO', 'WARNING', or 'CRITICAL'")
    category: str = Field(..., description="Category: 'CARDIOVASCULAR', 'RESPIRATORY', 'THERMAL', 'SYSTEMIC', etc.")
    message: str = Field(..., description="Objective, non-diagnostic physiological observation")
    confidence_score: float = Field(default=0.85, ge=0.0, le=1.0, description="Model or detection confidence (0.0 - 1.0)")
    recommendation: str = Field(..., description="Actionable mitigation countermeasure protocol")
    timestamp: Optional[datetime] = Field(
        default=None, 
        description="Event timestamp in UTC (defaults to current time if omitted)"
    )

    @model_validator(mode="before")
    @classmethod
    def default_timestamp(cls, data: dict):
        if isinstance(data, dict) and data.get("timestamp") is None:
            data["timestamp"] = datetime.now(timezone.utc)
        return data


class AlertCreate(AlertBase):
    id: Optional[str] = Field(default=None, description="Optional custom alert identifier")


class AlertResponse(BaseModel):
    alert_id: str = Field(..., description="Alert unique ID")
    id: Optional[str] = Field(default=None, description="Alias matching alert_id")
    astronaut_id: str
    severity: str
    category: str
    message: str
    confidence_score: float
    recommendation: str
    is_acknowledged: bool
    timestamp: datetime
    created_at: Optional[datetime] = None

    @model_validator(mode="before")
    @classmethod
    def harmonize_ids(cls, data):
        # Support both ORM object with .id and dictionary with 'id' or 'alert_id'
        if hasattr(data, "id"):
            raw_id = getattr(data, "id")
            return {
                "alert_id": raw_id,
                "id": raw_id,
                "astronaut_id": getattr(data, "astronaut_id"),
                "severity": getattr(data, "severity"),
                "category": getattr(data, "category"),
                "message": getattr(data, "message"),
                "confidence_score": getattr(data, "confidence_score"),
                "recommendation": getattr(data, "recommendation"),
                "is_acknowledged": getattr(data, "is_acknowledged"),
                "timestamp": getattr(data, "timestamp"),
                "created_at": getattr(data, "created_at", None),
            }
        elif isinstance(data, dict):
            raw_id = data.get("alert_id") or data.get("id")
            data["alert_id"] = raw_id
            data["id"] = raw_id
        return data

    model_config = ConfigDict(from_attributes=True)


class AlertAcknowledge(BaseModel):
    is_acknowledged: bool = Field(default=True, description="Acknowledgment flag")
