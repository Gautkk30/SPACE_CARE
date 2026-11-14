"""
Risk Assessment Service for SPACECARE REST API.
NASA Space Apps Challenge 2026

Coordinates multi-hazard deterministic rule evaluation, data quality auditing,
Isolation Forest physiological anomaly scoring, and alert deduplication for incoming telemetry.
"""

from pathlib import Path
from typing import Dict, Any, Optional, List
import pandas as pd
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.alert import Alert
from app.schemas.telemetry import TelemetryCreate, AssessmentSummaryResponse
from app.ml.anomaly_detection.engine import IntegratedHealthRiskEngine, HazardAssessment
from app.ml.anomaly_detection.detector import PhysiologicalAnomalyDetector
from app.ml.preprocessing.pipeline import TelemetryPipeline
from app.crud.crud_telemetry import get_astronaut_telemetry


class RiskAssessmentService:
    """
    Singleton service executing end-to-end health risk assessment and alert generation.
    """

    def __init__(self, models_dir: Optional[Path] = None):
        self.models_dir = models_dir or Path(__file__).resolve().parent.parent / "ml" / "models"
        self.pipeline: Optional[TelemetryPipeline] = None
        self.detector: Optional[PhysiologicalAnomalyDetector] = None
        self.engine: Optional[IntegratedHealthRiskEngine] = None
        self._load_models()

    def _load_models(self) -> None:
        """Loads serialized pipeline and Isolation Forest model if present."""
        pipeline_path = self.models_dir / "telemetry_pipeline.joblib"
        detector_path = self.models_dir / "isolation_forest.joblib"

        if pipeline_path.exists() and detector_path.exists():
            try:
                self.pipeline = TelemetryPipeline.load(pipeline_path)
                self.detector = PhysiologicalAnomalyDetector.load(detector_path)
            except Exception as e:
                print(f"Warning: Failed to load serialized ML models from {self.models_dir}: {e}")
                self.pipeline = None
                self.detector = None

        self.engine = IntegratedHealthRiskEngine(
            pipeline=self.pipeline,
            detector=self.detector
        )

    def assess_and_persist(
        self,
        db: Session,
        telemetry_obj: Telemetry,
        raw_payload: TelemetryCreate,
        astro: Astronaut
    ) -> AssessmentSummaryResponse:
        """
        Executes end-to-end multi-hazard risk assessment, deduplicates alerts,
        and persists any new alerts to SQLite.
        """
        # 1. Build unified snapshot dictionary combining core vitals and optional auxiliary streams
        snapshot: Dict[str, Any] = {
            "astronaut_id": telemetry_obj.astronaut_id,
            "timestamp": telemetry_obj.timestamp,
            "heart_rate": telemetry_obj.heart_rate,
            "systolic_bp": telemetry_obj.systolic_bp,
            "diastolic_bp": telemetry_obj.diastolic_bp,
            "spo2": telemetry_obj.spo2,
            "body_temperature": telemetry_obj.body_temperature,
            "respiration_rate": telemetry_obj.respiration_rate,
            "data_source": telemetry_obj.data_source,
            "is_simulated": telemetry_obj.is_simulated,
            "dataset_reference": telemetry_obj.dataset_reference,
            # Auxiliary multi-hazard fields
            "dose_rate": raw_payload.dose_rate,
            "cumulative_exposure": raw_payload.cumulative_exposure,
            "sleep_duration": raw_payload.sleep_duration,
            "cumulative_sleep_debt": raw_payload.cumulative_sleep_debt,
            "workload_score": raw_payload.workload_score,
            "mood_score": raw_payload.mood_score,
            "communication_latency_seconds": raw_payload.communication_latency_seconds,
            "exercise_deficit_daily": raw_payload.exercise_deficit_daily,
            "cabin_pressure_kpa": raw_payload.cabin_pressure_kpa,
            "o2_partial_pressure_kpa": raw_payload.o2_partial_pressure_kpa,
            "co2_partial_pressure_kpa": raw_payload.co2_partial_pressure_kpa,
            "pressure_drop_rate": raw_payload.pressure_drop_rate,
            "cabin_temperature": raw_payload.cabin_temperature,
        }

        # 2. Extract astronaut baselines
        baselines = {
            "baseline_heart_rate": astro.baseline_heart_rate,
            "baseline_systolic_bp": astro.baseline_systolic_bp,
            "baseline_diastolic_bp": astro.baseline_diastolic_bp,
            "baseline_spo2": astro.baseline_spo2,
            "baseline_body_temperature": astro.baseline_body_temperature,
            "baseline_respiration_rate": astro.baseline_respiration_rate,
        }

        # 3. Extract ML feature vector if detector is operational
        feature_vector: Optional[np.ndarray] = None
        if self.pipeline is not None and self.pipeline.is_fitted and self.detector is not None:
            try:
                # Query recent history (up to 5 recent readings) for accurate causal rolling features
                recent_history = get_astronaut_telemetry(db, astro.id, limit=5)
                history_dicts = []
                for rec in reversed(recent_history):
                    history_dicts.append({
                        "astronaut_id": rec.astronaut_id,
                        "timestamp": rec.timestamp,
                        "heart_rate": rec.heart_rate,
                        "systolic_bp": rec.systolic_bp,
                        "diastolic_bp": rec.diastolic_bp,
                        "spo2": rec.spo2,
                        "body_temperature": rec.body_temperature,
                        "respiration_rate": rec.respiration_rate,
                    })

                hist_df = pd.DataFrame(history_dicts)
                _, X_scaled, _ = self.pipeline.transform(hist_df, astronaut_baselines=baselines)
                if len(X_scaled) > 0:
                    feature_vector = X_scaled[-1]
            except Exception:
                feature_vector = None

        try:
            # 4. Execute Risk Assessment
            engine = self.engine
            if engine is None:
                raise ValueError("Risk assessment engine is not initialized.")

            assessment: HazardAssessment = engine.assess_snapshot(
                snapshot=snapshot,
                astronaut_baselines=baselines,
                evaluated_timestamp=telemetry_obj.timestamp,
                feature_vector=feature_vector
            )

            # 5. Persist Alerts with Condition-Specific Deduplication
            new_alerts = assessment.to_alert_models(db_session=db, deduplicate=True)
            new_alert_ids = [a.id for a in new_alerts]

            # 6. Retrieve all open active alerts for this astronaut
            active_open_alert_ids = list(
                db.scalars(
                    select(Alert.id)
                    .where(Alert.astronaut_id == astro.id, Alert.is_acknowledged == False)
                    .order_by(Alert.timestamp.desc())
                ).all()
            )

            # 7. Build AssessmentSummaryResponse
            return AssessmentSummaryResponse(
                overall_status=assessment.overall_status,
                physiological_status=assessment.physiological_status,
                highest_severity=assessment.highest_severity,
                primary_hazard=assessment.primary_hazard.value,
                assessed_domains=assessment.assessed_domains,
                unmonitored_domains=assessment.unmonitored_domains,
                evidence_status=assessment.audit_report.status.value if assessment.audit_report else "NOMINAL",
                overall_evidence_status=assessment.overall_evidence_status,
                ml_anomaly_detected=assessment.ml_anomaly_detected,
                ml_anomaly_score=round(assessment.ml_anomaly_score, 4),
                heuristic_explanations=assessment.heuristic_explanations,
                alerts_created_count=len(new_alerts),
                new_alert_ids=new_alert_ids,
                active_open_alert_ids=active_open_alert_ids
            )
        except Exception as err:
            # Rollback any uncommitted alert transactions to preserve DB session health
            db.rollback()
            # Explicitly report partial processing degradation: telemetry was stored, but secondary risk evaluation encountered an error
            return AssessmentSummaryResponse(
                overall_status="DATA_QUALITY_ISSUE",
                physiological_status="DATA_QUALITY_ISSUE",
                highest_severity="WARNING",
                primary_hazard="PHYSIOLOGICAL",
                assessed_domains=["PHYSIOLOGICAL"],
                unmonitored_domains=[
                    "SPACE_RADIATION", "ISOLATION_CONFINEMENT",
                    "DISTANCE_FROM_EARTH", "GRAVITY_FIELDS", "HOSTILE_CLOSED_ENVIRONMENT"
                ],
                evidence_status="DATA_GAP",
                overall_evidence_status="ASSESSMENT_DEGRADED",
                ml_anomaly_detected=False,
                ml_anomaly_score=0.0,
                heuristic_explanations=[{
                    "attribution_type": "PARTIAL_PROCESSING_NOTICE",
                    "heuristic_explanation": f"Telemetry was successfully stored, but secondary risk assessment encountered an error: {str(err)}"
                }],
                alerts_created_count=0,
                new_alert_ids=[],
                active_open_alert_ids=[]
            )


# Singleton risk service instance
risk_service = RiskAssessmentService()
