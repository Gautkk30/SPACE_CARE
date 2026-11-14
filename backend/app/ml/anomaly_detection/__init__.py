"""
SPACECARE Anomaly Detection & Multi-Hazard Health-Risk Assessment Package.
NASA Space Apps Challenge 2026
"""

from app.ml.anomaly_detection.thresholds import (
    HazardThresholdConfig,
    PhysiologicalThresholds,
    RadiationThresholds,
    IsolationConfinementThresholds,
    DistanceFromEarthThresholds,
    GravityFieldsThresholds,
    HostileEnvironmentThresholds,
    MissionPhase,
)
from app.ml.anomaly_detection.auditor import (
    EvidenceAuditor,
    EvidenceStatus,
    EvidenceAuditReport,
    MANDATORY_PHYSIOLOGICAL_CHANNELS,
)
from app.ml.anomaly_detection.hazard_rules import (
    MultiHazardRuleEngine,
    RuleViolation,
)
from app.ml.anomaly_detection.detector import (
    PhysiologicalAnomalyDetector,
)
from app.ml.anomaly_detection.engine import (
    HazardAssessment,
    IntegratedHealthRiskEngine,
)

__all__ = [
    "HazardThresholdConfig",
    "PhysiologicalThresholds",
    "RadiationThresholds",
    "IsolationConfinementThresholds",
    "DistanceFromEarthThresholds",
    "GravityFieldsThresholds",
    "HostileEnvironmentThresholds",
    "MissionPhase",
    "EvidenceAuditor",
    "EvidenceStatus",
    "EvidenceAuditReport",
    "MANDATORY_PHYSIOLOGICAL_CHANNELS",
    "MultiHazardRuleEngine",
    "RuleViolation",
    "PhysiologicalAnomalyDetector",
    "HazardAssessment",
    "IntegratedHealthRiskEngine",
]
