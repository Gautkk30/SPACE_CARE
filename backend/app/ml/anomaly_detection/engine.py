"""
SPACECARE Integrated Multi-Hazard Risk & Anomaly Detection Engine.
NASA Space Apps Challenge 2026

Synthesizes data quality auditing, multi-hazard deterministic rule evaluations,
and Isolation Forest physiological anomaly scoring into unified health-risk assessments.
Provides seamless mapping to SQLAlchemy Alert records for database persistence.

REGULATORY & METHODOLOGICAL COMPLIANCE NOTICE:
1. Non-diagnostic: Outputs are objective physiological observations, NOT clinical diagnoses.
2. Anomaly vs Confidence: Raw Isolation Forest anomaly scores are NEVER stored as confidence
   scores or probabilities. The Alert.confidence_score field represents heuristic or rule
   certainty (0.85 - 0.95), while anomaly scores are preserved in observational telemetry.
3. Feature Attributions: Deviations are explicitly documented as heuristic supporting deviations,
   not true tree attribution values.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
import uuid
from typing import Dict, List, Optional, Any, Union
import numpy as np
import pandas as pd
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.alert import Alert
from app.ml.preprocessing.hazard_types import HazardCategory
from app.ml.anomaly_detection.thresholds import HazardThresholdConfig
from app.ml.anomaly_detection.auditor import EvidenceAuditor, EvidenceStatus, EvidenceAuditReport
from app.ml.anomaly_detection.hazard_rules import MultiHazardRuleEngine, RuleViolation
from app.ml.anomaly_detection.detector import PhysiologicalAnomalyDetector
from app.ml.preprocessing.pipeline import TelemetryPipeline


@dataclass
class HazardAssessment:
    """Comprehensive health-risk assessment combining audit, rule, and ML evaluations."""
    astronaut_id: str
    timestamp: datetime
    overall_status: str                     # "NOMINAL", "ELEVATED_RISK", "CRITICAL_RISK", "DATA_QUALITY_ISSUE"
    highest_severity: str                   # "INFO", "WARNING", "CRITICAL"
    primary_hazard: HazardCategory
    rule_violations: List[RuleViolation] = field(default_factory=list)
    ml_anomaly_detected: bool = False
    ml_anomaly_score: float = 0.0           # Raw inverted distance (-decision_function)
    heuristic_explanations: List[Dict[str, Any]] = field(default_factory=list)
    audit_report: Optional[EvidenceAuditReport] = None
    data_provenance: Dict[str, Any] = field(default_factory=dict)
    assessed_domains: List[str] = field(default_factory=list)
    unmonitored_domains: List[str] = field(default_factory=list)
    overall_evidence_status: str = "PARTIAL_MONITORING"
    physiological_status: str = "NOMINAL"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "astronaut_id": self.astronaut_id,
            "timestamp": self.timestamp.isoformat(),
            "overall_status": self.overall_status,
            "physiological_status": self.physiological_status,
            "highest_severity": self.highest_severity,
            "primary_hazard": self.primary_hazard.value,
            "rule_violations": [v.to_dict() for v in self.rule_violations],
            "ml_anomaly_detected": self.ml_anomaly_detected,
            "ml_anomaly_score": round(self.ml_anomaly_score, 4),
            "heuristic_explanations": self.heuristic_explanations,
            "audit_report": self.audit_report.to_dict() if self.audit_report else None,
            "data_provenance": self.data_provenance,
            "assessed_domains": self.assessed_domains,
            "unmonitored_domains": self.unmonitored_domains,
            "overall_evidence_status": self.overall_evidence_status,
        }

    def to_alert_models(self, db_session: Optional[Session] = None, deduplicate: bool = True) -> List[Alert]:
        """
        Converts triggered hazard violations and ML anomalies into persistent SQLAlchemy Alert instances.
        
        CRITICAL COMPLIANCE RULES:
        - Condition-specific alert deduplication: avoids duplicate open alerts for the same condition.
        - Alert.confidence_score is NEVER assigned raw Isolation Forest anomaly scores.
        - Rule violations receive deterministic rule confidence (0.95).
        - ML alerts receive standard heuristic confidence (0.85).
        - All messages are strictly non-diagnostic and truncated to schema constraints (255 chars).
        """
        alerts: List[Alert] = []
        now = datetime.now(timezone.utc)
        ts = self.timestamp if self.timestamp.tzinfo else self.timestamp.replace(tzinfo=timezone.utc)

        # Retrieve currently active unacknowledged alerts for this astronaut if deduplication enabled
        active_alerts: List[Alert] = []
        if deduplicate and db_session is not None:
            active_alerts = list(
                db_session.scalars(
                    select(Alert).where(Alert.astronaut_id == self.astronaut_id, Alert.is_acknowledged == False)
                ).all()
            )

        # 1. Generate Alerts for Rule Violations (with condition-specific deduplication)
        for violation in self.rule_violations:
            rule_slug = violation.rule_name.lower()[:24]
            alert_prefix = f"alt_{rule_slug}_"

            # Check if active unacknowledged alert for this specific rule condition already exists
            if deduplicate and any(a.id.startswith(alert_prefix) for a in active_alerts):
                continue

            alert_id = f"{alert_prefix}{uuid.uuid4().hex[:8]}"
            
            # Message formatting (constrained to VARCHAR 255)
            msg = violation.message[:255]
            
            # Recommendation formatting (constrained to VARCHAR 500)
            rec = violation.recommendation[:500]

            alert_obj = Alert(
                id=alert_id,
                astronaut_id=self.astronaut_id,
                severity=violation.severity,
                category=violation.hazard_category.value[:50],
                message=msg,
                confidence_score=float(violation.rule_confidence),  # Deterministic rule confidence (0.95)
                recommendation=rec,
                is_acknowledged=False,
                timestamp=ts,
                created_at=now
            )
            alerts.append(alert_obj)

        # 2. Generate Alert for ML Anomaly (if detected and not already active)
        if self.ml_anomaly_detected:
            ml_prefix = "alt_ml_anomaly_"
            if not (deduplicate and any(a.id.startswith(ml_prefix) for a in active_alerts)):
                alert_id = f"{ml_prefix}{uuid.uuid4().hex[:8]}"
                
                top_factors = []
                for exp in self.heuristic_explanations[:2]:
                    top_factors.append(f"{exp['feature']} ({exp['direction']})")
                factor_str = ", ".join(top_factors) if top_factors else "multi-variate physiological divergence"

                msg = (
                    f"Multi-variate biometric divergence detected [Anomaly Index: {self.ml_anomaly_score:.3f}]. "
                    f"Top heuristic deviations: {factor_str}."
                )[:255]

                rec = (
                    "Review real-time biosensor stream, confirm astronaut workload and hydration, "
                    "and compare with individual mission baselines. Note: Heuristic indicator, non-diagnostic."
                )[:500]

                alert_obj = Alert(
                    id=alert_id,
                    astronaut_id=self.astronaut_id,
                    severity="WARNING",
                    category=HazardCategory.PHYSIOLOGICAL.value,
                    message=msg,
                    confidence_score=0.85,  # Heuristic model confidence; NOT the raw anomaly score
                    recommendation=rec,
                    is_acknowledged=False,
                    timestamp=ts,
                    created_at=now
                )
                alerts.append(alert_obj)

        # 3. Save to database if session provided
        if db_session is not None and alerts:
            db_session.add_all(alerts)
            db_session.commit()
            for a in alerts:
                db_session.refresh(a)

        return alerts


class IntegratedHealthRiskEngine:
    """
    Unified multi-hazard assessment engine coordinating auditing, deterministic rules,
    and machine learning anomaly detection.
    """

    def __init__(
        self,
        config: Optional[HazardThresholdConfig] = None,
        pipeline: Optional[TelemetryPipeline] = None,
        detector: Optional[PhysiologicalAnomalyDetector] = None,
        auditor: Optional[EvidenceAuditor] = None
    ):
        self.config = config or HazardThresholdConfig()
        self.rule_engine = MultiHazardRuleEngine(config=self.config)
        self.auditor = auditor or EvidenceAuditor(
            freshness_tolerance_seconds=self.config.telemetry_freshness_tolerance_seconds
        )
        self.pipeline = pipeline
        self.detector = detector

    def assess_snapshot(
        self,
        snapshot: Dict[str, Any],
        astronaut_baselines: Optional[Dict[str, float]] = None,
        evaluated_timestamp: Optional[datetime] = None,
        feature_vector: Optional[Union[np.ndarray, Dict[str, float]]] = None
    ) -> HazardAssessment:
        """
        Conducts an end-to-end health risk assessment for a single telemetry snapshot.
        """
        eval_time = evaluated_timestamp or datetime.now(timezone.utc)
        if eval_time.tzinfo is None:
            eval_time = eval_time.replace(tzinfo=timezone.utc)

        astro_id = str(snapshot.get("astronaut_id", "astro_03"))
        raw_ts = snapshot.get("timestamp")
        if isinstance(raw_ts, datetime):
            ts = raw_ts if raw_ts.tzinfo else raw_ts.replace(tzinfo=timezone.utc)
        elif isinstance(raw_ts, str):
            ts = pd.to_datetime(raw_ts).to_pydatetime()
            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)
        else:
            ts = eval_time

        # 1. Audit Data Integrity & Freshness
        audit_report = self.auditor.audit_reading(snapshot, evaluated_timestamp=eval_time)

        # 2. Evaluate Deterministic Multi-Hazard Rules
        rule_violations = self.rule_engine.evaluate_multi_hazard(snapshot, baselines=astronaut_baselines)

        # 3. Evaluate ML Anomaly Detector (if detector available and telemetry is complete)
        ml_detected = False
        ml_score = 0.0
        explanations: List[Dict[str, Any]] = []

        if self.detector is not None and self.detector.is_fitted:
            if feature_vector is not None:
                try:
                    if isinstance(feature_vector, dict):
                        vec = np.array([float(feature_vector[f]) for f in self.detector.feature_names]).reshape(1, -1)
                    else:
                        vec = np.asarray(feature_vector, dtype=float).reshape(1, -1)
                    
                    scores = self.detector.score_samples(vec)
                    ml_score = float(scores[0])
                    ml_detected = bool(self.detector.predict(vec)[0])
                    if ml_detected:
                        explanations = self.detector.explain_reading(vec[0], top_k=3)
                except Exception:
                    # Incomplete feature vector falls back gracefully
                    pass

        # 4. Synthesize Overall Severity & Primary Hazard
        severities = [v.severity for v in rule_violations]
        if ml_detected and "WARNING" not in severities and "CRITICAL" not in severities:
            severities.append("WARNING")

        if "CRITICAL" in severities:
            highest_sev = "CRITICAL"
            overall_status = "CRITICAL_RISK"
        elif "WARNING" in severities:
            highest_sev = "WARNING"
            overall_status = "ELEVATED_RISK"
        elif not audit_report.is_valid:
            highest_sev = "WARNING"
            overall_status = "DATA_QUALITY_ISSUE"
        else:
            highest_sev = "INFO"
            overall_status = "NOMINAL"

        # Identify Primary Hazard Category
        if rule_violations:
            # Pick highest severity violation
            crit_viols = [v for v in rule_violations if v.severity == "CRITICAL"]
            primary_hazard = crit_viols[0].hazard_category if crit_viols else rule_violations[0].hazard_category
        elif ml_detected:
            primary_hazard = HazardCategory.PHYSIOLOGICAL
        else:
            primary_hazard = HazardCategory.PHYSIOLOGICAL

        # Provenance summary
        provenance = {
            "data_source": snapshot.get("data_source", "SYNTHETIC_SIMULATED"),
            "is_simulated": snapshot.get("is_simulated", True),
            "dataset_reference": snapshot.get("dataset_reference"),
        }

        # Multi-Hazard Domain Coverage Analysis
        assessed_domains = [HazardCategory.PHYSIOLOGICAL.value]
        unmonitored_domains = []

        if any(snapshot.get(k) is not None for k in ["dose_rate", "cumulative_exposure", "exposure_duration"]):
            assessed_domains.append(HazardCategory.SPACE_RADIATION.value)
        else:
            unmonitored_domains.append(HazardCategory.SPACE_RADIATION.value)

        if any(snapshot.get(k) is not None for k in ["sleep_duration", "cumulative_sleep_debt", "workload_score", "mood_score"]):
            assessed_domains.append(HazardCategory.ISOLATION_CONFINEMENT.value)
        else:
            unmonitored_domains.append(HazardCategory.ISOLATION_CONFINEMENT.value)

        if any(snapshot.get(k) is not None for k in ["communication_latency_seconds", "distance_from_earth_km"]):
            assessed_domains.append(HazardCategory.DISTANCE_FROM_EARTH.value)
        else:
            unmonitored_domains.append(HazardCategory.DISTANCE_FROM_EARTH.value)

        if any(snapshot.get(k) is not None for k in ["exercise_deficit_daily", "g_transition_magnitude"]):
            assessed_domains.append(HazardCategory.GRAVITY_FIELDS.value)
        else:
            unmonitored_domains.append(HazardCategory.GRAVITY_FIELDS.value)

        if any(snapshot.get(k) is not None for k in ["pressure_drop_rate", "o2_partial_pressure_kpa", "co2_partial_pressure_kpa", "cabin_temperature"]):
            assessed_domains.append(HazardCategory.HOSTILE_CLOSED_ENVIRONMENT.value)
        else:
            unmonitored_domains.append(HazardCategory.HOSTILE_CLOSED_ENVIRONMENT.value)

        # Distinguish physiological evidence status from overall multi-hazard completeness
        if not audit_report.is_valid:
            overall_evidence_status = audit_report.status.value
        elif len(unmonitored_domains) > 0:
            overall_evidence_status = "PARTIAL_MONITORING"
        else:
            overall_evidence_status = "COMPLETE_MULTI_HAZARD"

        # Determine physiological status vs overall status
        phys_severities = [v.severity for v in rule_violations if v.hazard_category == HazardCategory.PHYSIOLOGICAL]
        if ml_detected and "WARNING" not in phys_severities and "CRITICAL" not in phys_severities:
            phys_severities.append("WARNING")

        if "CRITICAL" in phys_severities:
            phys_status = "CRITICAL_RISK"
        elif "WARNING" in phys_severities:
            phys_status = "ELEVATED_RISK"
        elif not audit_report.is_valid:
            phys_status = "DATA_QUALITY_ISSUE"
        else:
            phys_status = "NOMINAL"

        return HazardAssessment(
            astronaut_id=astro_id,
            timestamp=ts,
            overall_status=overall_status,
            highest_severity=highest_sev,
            primary_hazard=primary_hazard,
            rule_violations=rule_violations,
            ml_anomaly_detected=ml_detected,
            ml_anomaly_score=ml_score,
            heuristic_explanations=explanations,
            audit_report=audit_report,
            data_provenance=provenance,
            assessed_domains=assessed_domains,
            unmonitored_domains=unmonitored_domains,
            overall_evidence_status=overall_evidence_status,
            physiological_status=phys_status,
        )
