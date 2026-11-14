"""
SPACECARE Evidence & Sensor Staleness Auditor.
NASA Space Apps Challenge 2026

Rigorously verifies sensor data completeness, channel availability, and timestamp freshness
prior to running rule evaluation or ML anomaly detection.
Ensures decisions are not made on corrupt, incomplete, or dangerously stale telemetry.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, List, Optional, Any, Set
import pandas as pd
import numpy as np


class EvidenceStatus(str, Enum):
    """Audit status characterizing the integrity of the telemetry packet."""
    NOMINAL = "NOMINAL"
    PARTIAL_EVIDENCE = "PARTIAL_EVIDENCE"
    STALE_DATA = "STALE_DATA"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    DATA_GAP = "DATA_GAP"


# Mandatory vital sign channels required for comprehensive physiological assessment
MANDATORY_PHYSIOLOGICAL_CHANNELS: Set[str] = {
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "spo2",
    "body_temperature",
    "respiration_rate",
}


@dataclass
class EvidenceAuditReport:
    """Detailed audit report on data freshness and sensor channel availability."""
    status: EvidenceStatus
    is_valid: bool
    staleness_seconds: float
    missing_channels: List[str] = field(default_factory=list)
    audit_notes: List[str] = field(default_factory=list)
    reading_timestamp: Optional[datetime] = None
    evaluated_timestamp: Optional[datetime] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "status": self.status.value,
            "is_valid": self.is_valid,
            "staleness_seconds": round(self.staleness_seconds, 1),
            "missing_channels": self.missing_channels,
            "audit_notes": self.audit_notes,
            "reading_timestamp": self.reading_timestamp.isoformat() if self.reading_timestamp else None,
            "evaluated_timestamp": self.evaluated_timestamp.isoformat() if self.evaluated_timestamp else None,
        }


class EvidenceAuditor:
    """
    Validates stream freshness and channel completeness against configurable tolerances.
    """

    def __init__(
        self,
        freshness_tolerance_seconds: float = 300.0,
        required_channels: Optional[Set[str]] = None
    ):
        self.freshness_tolerance_seconds = freshness_tolerance_seconds
        self.required_channels = required_channels or MANDATORY_PHYSIOLOGICAL_CHANNELS

    def audit_reading(
        self,
        reading: Dict[str, Any],
        evaluated_timestamp: Optional[datetime] = None
    ) -> EvidenceAuditReport:
        """
        Audits a single telemetry reading dictionary.
        """
        eval_time = evaluated_timestamp or datetime.now(timezone.utc)
        if eval_time.tzinfo is None:
            eval_time = eval_time.replace(tzinfo=timezone.utc)

        missing_channels: List[str] = []
        notes: List[str] = []

        # 1. Channel Completeness Check
        for ch in self.required_channels:
            val = reading.get(ch)
            if val is None or (isinstance(val, (float, int)) and (np.isnan(val) or val is None)):
                missing_channels.append(ch)

        # 2. Timestamp & Staleness Check
        raw_ts = reading.get("timestamp")
        reading_ts: Optional[datetime] = None
        staleness_seconds: float = 0.0

        if raw_ts is None:
            notes.append("Reading timestamp is completely missing.")
            return EvidenceAuditReport(
                status=EvidenceStatus.INSUFFICIENT_EVIDENCE,
                is_valid=False,
                staleness_seconds=float("inf"),
                missing_channels=missing_channels,
                audit_notes=notes,
                evaluated_timestamp=eval_time
            )

        if isinstance(raw_ts, str):
            try:
                reading_ts = pd.to_datetime(raw_ts).to_pydatetime()
            except Exception:
                notes.append(f"Failed to parse timestamp string: {raw_ts}")
                return EvidenceAuditReport(
                    status=EvidenceStatus.INSUFFICIENT_EVIDENCE,
                    is_valid=False,
                    staleness_seconds=float("inf"),
                    missing_channels=missing_channels,
                    audit_notes=notes,
                    evaluated_timestamp=eval_time
                )
        elif isinstance(raw_ts, (datetime, pd.Timestamp)):
            reading_ts = raw_ts.to_pydatetime() if isinstance(raw_ts, pd.Timestamp) else raw_ts

        if reading_ts.tzinfo is None:
            reading_ts = reading_ts.replace(tzinfo=timezone.utc)

        staleness_seconds = max(0.0, (eval_time - reading_ts).total_seconds())

        # Determine Status
        status = EvidenceStatus.NOMINAL
        is_valid = True

        if missing_channels:
            status = EvidenceStatus.INSUFFICIENT_EVIDENCE
            is_valid = False
            notes.append(f"Critical sensor channels missing: {', '.join(missing_channels)}.")

        if staleness_seconds > self.freshness_tolerance_seconds:
            # If channels are present but data is stale, flag STALE_DATA
            if is_valid:
                status = EvidenceStatus.STALE_DATA
                is_valid = False
            notes.append(
                f"Data staleness of {staleness_seconds:.1f}s exceeds freshness limit of "
                f"{self.freshness_tolerance_seconds:.1f}s."
            )

        if not notes:
            notes.append("Telemetry integrity and freshness confirmed nominal.")

        return EvidenceAuditReport(
            status=status,
            is_valid=is_valid,
            staleness_seconds=staleness_seconds,
            missing_channels=missing_channels,
            audit_notes=notes,
            reading_timestamp=reading_ts,
            evaluated_timestamp=eval_time
        )
