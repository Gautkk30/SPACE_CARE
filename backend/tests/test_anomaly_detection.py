"""
SPACECARE Task 6 Comprehensive Test Suite.
NASA Space Apps Challenge 2026

Verifies:
1. Chronological ML evaluation & metric computation (without hard threshold assertion failures).
2. Physiological Isolation Forest scoring and heuristic feature explanations.
3. Database Alert model mapping, schema conformity, and confidence score separation.
4. Independent synthetic multi-hazard fixtures across all 5 NASA hazards.
5. Evidence completeness auditing and sensor staleness detection.
6. Objective non-diagnostic phrasing audit.
"""

from datetime import datetime, timezone, timedelta
from pathlib import Path
import pytest
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database.session import Base
from app.models.astronaut import Astronaut
from app.models.alert import Alert
from app.ml.preprocessing.hazard_types import HazardCategory
from app.ml.preprocessing.pipeline import TelemetryPipeline
from app.ml.anomaly_detection.thresholds import HazardThresholdConfig, MissionPhase
from app.ml.anomaly_detection.auditor import EvidenceAuditor, EvidenceStatus
from app.ml.anomaly_detection.hazard_rules import MultiHazardRuleEngine, RuleViolation
from app.ml.anomaly_detection.detector import PhysiologicalAnomalyDetector
from app.ml.anomaly_detection.engine import HazardAssessment, IntegratedHealthRiskEngine
from app.services.telemetry_generator import TelemetryGenerator, SimulatedPattern


# ==============================================================================
# Fixtures
# ==============================================================================

@pytest.fixture
def in_memory_db():
    """Provides a fresh isolated in-memory SQLite database session."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
        # Seed demo astronaut
        astro = Astronaut(
            id="astro_03",
            name="Major Marcus Chen",
            role="Flight Engineer",
            age=36,
            gender="Male",
            mission="Artemis Lunar Transit",
            baseline_heart_rate=72.0,
            baseline_systolic_bp=120.0,
            baseline_diastolic_bp=78.0,
            baseline_spo2=98.2,
            baseline_body_temperature=36.8,
            baseline_respiration_rate=15.0,
        )
        session.add(astro)
        session.commit()
        yield session
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def synthetic_benchmark_data():
    """Generates a reproducible 200-reading synthetic stream for unit tests."""
    gen = TelemetryGenerator(astronaut_id="astro_03", seed=101)
    readings = gen.generate_batch(
        count=200,
        interval_seconds=60,
        anomaly_rate=0.10,
        dataset_reference="SIM_UNIT_TEST_FIXTURE"
    )
    return pd.DataFrame(readings)


# ==============================================================================
# 1. Model Evaluation & Pipeline Integration Tests
# ==============================================================================

def test_chronological_evaluation_and_metrics_calculation(synthetic_benchmark_data):
    """
    Evaluates ML performance on chronological split.
    Per Requirement 1: Computes precision, recall, and false-positive rate dynamically;
    does not enforce rigid >80% hard failure assertions.
    """
    df = synthetic_benchmark_data
    train_size = 140
    train_df = df.iloc[:train_size].copy()
    test_df = df.iloc[train_size:].copy()

    y_train = (train_df["simulated_pattern"] != "NORMAL").astype(int).to_numpy()
    y_test = (test_df["simulated_pattern"] != "NORMAL").astype(int).to_numpy()

    # Fit pipeline exclusively on train_df
    pipeline = TelemetryPipeline(scale_features=True)
    (_, X_train, _), (_, X_test, _) = pipeline.fit_train_transform_test(train_df, test_df)

    detector = PhysiologicalAnomalyDetector(
        n_estimators=100,
        contamination=0.08,
        random_state=42,
        decision_threshold=0.0
    )
    detector.fit(X_train)

    y_pred = detector.predict(X_test)
    scores = detector.score_samples(X_test)

    # Compute metrics
    tp = int(np.sum((y_test == 1) & (y_pred == True)))
    fp = int(np.sum((y_test == 0) & (y_pred == True)))
    tn = int(np.sum((y_test == 0) & (y_pred == False)))
    fn = int(np.sum((y_test == 1) & (y_pred == False)))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0

    # Functional integrity checks (valid probability / rate bounds)
    assert 0.0 <= precision <= 1.0
    assert 0.0 <= recall <= 1.0
    assert 0.0 <= fpr <= 1.0
    assert len(scores) == len(test_df)
    assert not np.isnan(scores).any()


def test_detector_scoring_convention_and_separation():
    """
    Verifies inverted anomaly scoring convention:
    anomaly_score = -decision_function(X).
    Ensures clear separation where anomalous readings score higher than nominal readings.
    """
    gen = TelemetryGenerator(astronaut_id="astro_03", seed=42)
    normal_readings = [gen.generate_reading(pattern=SimulatedPattern.NORMAL) for _ in range(100)]
    hypoxia_readings = [gen.generate_reading(pattern=SimulatedPattern.HYPOXIA) for _ in range(10)]

    pipeline = TelemetryPipeline(scale_features=True)
    df_normal = pd.DataFrame(normal_readings)
    df_hypoxia = pd.DataFrame(hypoxia_readings)

    pipeline.fit(df_normal)
    _, X_norm, _ = pipeline.transform(df_normal)
    _, X_hypox, _ = pipeline.transform(df_hypoxia)

    detector = PhysiologicalAnomalyDetector(n_estimators=100, contamination=0.05, random_state=42)
    detector.fit(X_norm)

    norm_scores = detector.score_samples(X_norm)
    hypox_scores = detector.score_samples(X_hypox)

    # Mean anomaly score of hypoxia readings must be significantly higher than nominal readings
    assert np.mean(hypox_scores) > np.mean(norm_scores)
    # Most nominal readings should have negative scores (inliers)
    assert np.median(norm_scores) < 0.0
    # Hypoxia readings should have positive scores (outliers)
    assert np.mean(hypox_scores) > 0.0


def test_detector_serialization_and_reproducibility(tmp_path):
    """Verifies that serialization to disk preserves model weights and produces identical scores."""
    gen = TelemetryGenerator(astronaut_id="astro_03", seed=42)
    readings = [gen.generate_reading() for _ in range(50)]
    df = pd.DataFrame(readings)

    pipeline = TelemetryPipeline(scale_features=True)
    pipeline.fit(df)
    _, X, _ = pipeline.transform(df)

    detector = PhysiologicalAnomalyDetector(n_estimators=50, random_state=42)
    detector.fit(X)
    original_scores = detector.score_samples(X)

    save_path = tmp_path / "test_detector.joblib"
    detector.save(save_path)
    assert save_path.exists()

    loaded_detector = PhysiologicalAnomalyDetector.load(save_path)
    loaded_scores = loaded_detector.score_samples(X)

    np.testing.assert_allclose(original_scores, loaded_scores, rtol=1e-5)


# ==============================================================================
# 2. Heuristic Feature Explanations Tests (Requirement 2)
# ==============================================================================

def test_heuristic_feature_explanations_compliance():
    """
    Verifies that feature explanations:
    1. Are explicitly labeled as 'HEURISTIC_SUPPORTING_FEATURE_DEVIATION'.
    2. Rank relevant deviating physiological channels at the top for hypoxia.
    """
    gen = TelemetryGenerator(astronaut_id="astro_03", seed=42)
    norm_readings = [gen.generate_reading(pattern=SimulatedPattern.NORMAL) for _ in range(80)]
    hypox_reading = gen.generate_reading(pattern=SimulatedPattern.HYPOXIA)

    pipeline = TelemetryPipeline(scale_features=True)
    df_norm = pd.DataFrame(norm_readings)
    df_hypox = pd.DataFrame([hypox_reading])

    pipeline.fit(df_norm)
    _, X_norm, _ = pipeline.transform(df_norm)
    _, X_hypox, _ = pipeline.transform(df_hypox)

    detector = PhysiologicalAnomalyDetector(n_estimators=50, random_state=42)
    detector.fit(X_norm)

    explanations = detector.explain_reading(X_hypox[0], top_k=3)

    assert len(explanations) == 3
    for exp in explanations:
        # Check required metadata
        assert exp["attribution_type"] == "HEURISTIC_SUPPORTING_FEATURE_DEVIATION"
        assert "robust_z_score" in exp
        assert "direction" in exp
        assert "heuristic_explanation" in exp
        assert exp["robust_z_score"] >= 0.0

    # For hypoxia, spo2-related features should be prominent
    top_features = [exp["feature"] for exp in explanations]
    assert any("spo2" in feat for feat in top_features)


# ==============================================================================
# 3. Database Alert Model Mapping & Confidence Score (Requirement 3)
# ==============================================================================

def test_alert_mapping_and_confidence_score_separation(in_memory_db: Session):
    """
    Verifies that Alert model mapping:
    1. NEVER assigns raw Isolation Forest anomaly score to Alert.confidence_score.
    2. Respects non-null constraint and default heuristic confidence.
    3. Persists successfully to SQLite database.
    """
    ts = datetime.now(timezone.utc)
    violation = RuleViolation(
        hazard_category=HazardCategory.PHYSIOLOGICAL,
        severity="WARNING",
        rule_name="TEST_RULE",
        message="Test physiological observation detected.",
        recommendation="Verify telemetry and hydrate.",
        rule_confidence=0.95
    )

    assessment = HazardAssessment(
        astronaut_id="astro_03",
        timestamp=ts,
        overall_status="ELEVATED_RISK",
        highest_severity="WARNING",
        primary_hazard=HazardCategory.PHYSIOLOGICAL,
        rule_violations=[violation],
        ml_anomaly_detected=True,
        ml_anomaly_score=0.1876,  # Raw distance score
        heuristic_explanations=[{
            "feature": "heart_rate",
            "robust_z_score": 3.4,
            "direction": "elevated",
            "heuristic_explanation": "Heart rate is substantially elevated.",
            "attribution_type": "HEURISTIC_SUPPORTING_FEATURE_DEVIATION"
        }]
    )

    alerts = assessment.to_alert_models(db_session=in_memory_db)
    assert len(alerts) == 2  # 1 rule alert + 1 ML alert

    rule_alert = next(a for a in alerts if "TEST_RULE" in a.id or a.confidence_score == 0.95)
    ml_alert = next(a for a in alerts if "alt_ml" in a.id)

    # Verify rule alert confidence
    assert rule_alert.confidence_score == 0.95

    # Verify ML alert confidence is NOT the raw 0.1876 score
    assert ml_alert.confidence_score == 0.85
    assert ml_alert.confidence_score != 0.1876
    assert "0.188" in ml_alert.message  # Raw score is documented in the message text

    # Verify database persistence
    saved_alerts = in_memory_db.query(Alert).filter(Alert.astronaut_id == "astro_03").all()
    assert len(saved_alerts) == 2
    for sa in saved_alerts:
        assert sa.severity in ["INFO", "WARNING", "CRITICAL"]
        assert len(sa.message) <= 255
        assert len(sa.recommendation) <= 500
        assert sa.confidence_score > 0.0
        assert sa.timestamp is not None


# ==============================================================================
# 4. Multi-Hazard Fixture Rules Tests (Requirement 4)
# ==============================================================================

def test_space_radiation_rule_fixtures():
    """Tests Space Radiation rules using synthetic radiation fixtures."""
    engine = MultiHazardRuleEngine()

    # 1. Critical Solar Particle Event
    spe_critical_reading = {"dose_rate": 1250.0, "cumulative_exposure": 5000.0}
    viols = engine.evaluate_radiation(spe_critical_reading)
    assert any(v.rule_name == "SOLAR_PARTICLE_EVENT_CRITICAL" and v.severity == "CRITICAL" for v in viols)

    # 2. Cumulative 30-day Limit
    cum_critical_reading = {"dose_rate": 50.0, "cumulative_exposure": 260_000.0}
    viols_cum = engine.evaluate_radiation(cum_critical_reading)
    assert any(v.rule_name == "CUMULATIVE_DOSE_LIMIT_EXCEEDED" and v.severity == "CRITICAL" for v in viols_cum)

    # 3. Nominal Radiation
    nominal_rad = {"dose_rate": 22.0, "cumulative_exposure": 1200.0}
    viols_nom = engine.evaluate_radiation(nominal_rad)
    assert len(viols_nom) == 0


def test_isolation_confinement_rule_fixtures():
    """Tests Isolation and Confinement rules using synthetic behavioral fixtures."""
    engine = MultiHazardRuleEngine()

    # 1. Severe single sleep deprivation
    sleep_reading = {"sleep_duration": 3.5, "cumulative_sleep_debt": 4.0}
    viols = engine.evaluate_isolation(sleep_reading)
    assert any(v.rule_name == "ACUTE_SEVERE_SLEEP_DEPRIVATION" and v.severity == "CRITICAL" for v in viols)

    # 2. High workload + depressed mood
    strain_reading = {"sleep_duration": 7.5, "cumulative_sleep_debt": 2.0, "workload_score": 9.0, "mood_score": 2.5}
    viols_strain = engine.evaluate_isolation(strain_reading)
    assert any(v.rule_name == "COGNITIVE_STRAIN_AND_MOOD_DEFICIT" and v.severity == "WARNING" for v in viols_strain)


def test_distance_from_earth_rule_fixtures():
    """Tests Distance from Earth communication latency and autonomy shift."""
    engine = MultiHazardRuleEngine()

    # Latency exceeding 60s autonomous threshold
    mars_transit = {"communication_latency_seconds": 180.0}
    viols = engine.evaluate_distance(mars_transit)
    assert any(v.rule_name == "AUTONOMOUS_OPERATIONS_MANDATED" and v.severity == "WARNING" for v in viols)

    # LEO real-time latency
    leo_reading = {"communication_latency_seconds": 2.1}
    assert len(engine.evaluate_distance(leo_reading)) == 0


def test_gravity_fields_rule_fixtures():
    """Tests Gravity Fields daily exercise countermeasure deficit."""
    engine = MultiHazardRuleEngine()

    # Critical exercise deficit (>90 mins)
    deconditioned = {"exercise_deficit_daily": 110.0}
    viols = engine.evaluate_gravity(deconditioned)
    assert any(v.rule_name == "SEVERE_EXERCISE_DEFICIT_CRITICAL" and v.severity == "CRITICAL" for v in viols)

    # Full compliance
    compliant = {"exercise_deficit_daily": 0.0}
    assert len(engine.evaluate_gravity(compliant)) == 0


def test_hostile_environment_scientific_thresholds():
    """
    Tests Hostile/Closed Environments rules.
    Verifies that exploration atmospheres (e.g. 56.5 kPa, 34% O2) are NOT treated as emergency
    unless depressurization rate is negative or PO2 / PCO2 violate clinical boundaries.
    """
    engine = MultiHazardRuleEngine()

    # 1. Rapid Depressurization Emergency (Delta P = -0.75 kPa/min)
    depress_emergency = {"pressure_drop_rate": -0.75, "o2_partial_pressure_kpa": 19.5, "co2_partial_pressure_kpa": 0.3}
    viols = engine.evaluate_environment(depress_emergency)
    assert any(v.rule_name == "RAPID_CABIN_DEPRESSURIZATION_CRITICAL" and v.severity == "CRITICAL" for v in viols)

    # 2. Toxic Hypercapnia (PCO2 = 0.85 kPa)
    hypercapnia = {"pressure_drop_rate": 0.0, "o2_partial_pressure_kpa": 19.5, "co2_partial_pressure_kpa": 0.85}
    viols_co2 = engine.evaluate_environment(hypercapnia)
    assert any(v.rule_name == "CABIN_HYPERCAPNIA_CRITICAL" and v.severity == "CRITICAL" for v in viols_co2)

    # 3. Exploration Atmosphere Nominal Profile (Gateway/Orion: 56.5 kPa, 34% O2 -> PO2 = 19.21 kPa, PCO2 = 0.3 kPa)
    # Total pressure is well below 80 kPa, but PO2 and PCO2 are fully nominal -> NO VIOLATION
    orion_nominal = {
        "pressure_drop_rate": 0.0,
        "o2_partial_pressure_kpa": 19.21,
        "co2_partial_pressure_kpa": 0.30,
        "cabin_temperature": 21.5
    }
    viols_orion = engine.evaluate_environment(orion_nominal)
    assert len(viols_orion) == 0


# ==============================================================================
# 5. Evidence & Staleness Auditor Tests
# ==============================================================================

def test_evidence_auditor_freshness_and_completeness():
    """Tests EvidenceAuditor for nominal, stale, and incomplete telemetry."""
    auditor = EvidenceAuditor(freshness_tolerance_seconds=300.0)
    now = datetime.now(timezone.utc)

    # 1. Nominal complete reading
    nominal = {
        "timestamp": now,
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0
    }
    rep_nom = auditor.audit_reading(nominal, evaluated_timestamp=now)
    assert rep_nom.status == EvidenceStatus.NOMINAL
    assert rep_nom.is_valid is True
    assert len(rep_nom.missing_channels) == 0

    # 2. Missing vital channels (INSUFFICIENT_EVIDENCE)
    incomplete = {
        "timestamp": now,
        "heart_rate": 72.0,
        # systolic_bp and diastolic_bp missing
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0
    }
    rep_inc = auditor.audit_reading(incomplete, evaluated_timestamp=now)
    assert rep_inc.status == EvidenceStatus.INSUFFICIENT_EVIDENCE
    assert rep_inc.is_valid is False
    assert "systolic_bp" in rep_inc.missing_channels
    assert "diastolic_bp" in rep_inc.missing_channels

    # 3. Stale reading (STALE_DATA)
    stale_ts = now - timedelta(seconds=600)  # 10 minutes old > 5 minute limit
    stale = {
        "timestamp": stale_ts,
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0
    }
    rep_stale = auditor.audit_reading(stale, evaluated_timestamp=now)
    assert rep_stale.status == EvidenceStatus.STALE_DATA
    assert rep_stale.is_valid is False
    assert rep_stale.staleness_seconds >= 600.0


# ==============================================================================
# 6. Non-Diagnostic Phrasing Audit
# ==============================================================================

def test_non_diagnostic_phrasing_audit():
    """
    Rigorously verifies that rule messages and recommendations use objective
    physiological and operational countermeasure phrasing rather than medical diagnoses.
    """
    engine = MultiHazardRuleEngine()
    prohibited_medical_terms = [
        "diagnosed", "diagnosis", "disease", "patient suffering",
        "pathology confirmed", "clinical cure", "prescribe drug"
    ]

    all_methods = [
        engine.evaluate_physiological,
        engine.evaluate_radiation,
        engine.evaluate_isolation,
        engine.evaluate_distance,
        engine.evaluate_gravity,
        engine.evaluate_environment,
    ]

    extreme_snapshot = {
        "heart_rate": 160.0,
        "systolic_bp": 190.0,
        "diastolic_bp": 115.0,
        "spo2": 82.0,
        "body_temperature": 39.5,
        "respiration_rate": 35.0,
        "dose_rate": 2000.0,
        "cumulative_exposure": 300_000.0,
        "sleep_duration": 2.0,
        "cumulative_sleep_debt": 18.0,
        "workload_score": 9.5,
        "mood_score": 1.5,
        "communication_latency_seconds": 300.0,
        "exercise_deficit_daily": 120.0,
        "pressure_drop_rate": -1.2,
        "o2_partial_pressure_kpa": 12.0,
        "co2_partial_pressure_kpa": 1.1,
        "cabin_temperature": 36.0,
    }

    violations = engine.evaluate_multi_hazard(extreme_snapshot)
    assert len(violations) > 0

    for viol in violations:
        full_text = f"{viol.message} {viol.recommendation}".lower()
        for term in prohibited_medical_terms:
            assert term not in full_text, f"Violation contains prohibited clinical term '{term}': {full_text}"
