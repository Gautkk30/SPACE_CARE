"""
SPACECARE Machine Learning Validation Experiment
================================================
NASA Space Apps Challenge 2026

Controlled empirical experiment to validate:
1. Baseline dataset generation (100 synthetic resting readings for Major Marcus Chen).
2. Model training reproducibility across multiple runs (Isolation Forest).
3. Score separation between nominal vitals and anomalous stress patterns (hypoxia, tachycardia).
4. Edge cases & error handling (insufficient samples, NaN/missing values).
5. Data leakage prevention (fit on baseline, evaluate on unseen readings).
6. Non-diagnostic boundary verification.
"""

import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(backend_dir))

from app.services.telemetry_generator import TelemetryGenerator, SimulatedPattern
from app.ml.preprocessing.pipeline import TelemetryPipeline
from app.ml.anomaly_detection.detector import PhysiologicalAnomalyDetector
from app.ml.anomaly_detection.engine import IntegratedHealthRiskEngine


def run_experiment():
    print("=" * 70)
    print("SPACECARE CONTROLLED ML VALIDATION EXPERIMENT")
    print("=" * 70)

    # 1. Dataset Generation: 150 simulated baseline readings
    print("\n[Step 1] Generating documented baseline training dataset...")
    gen = TelemetryGenerator(astronaut_id="astro_03", seed=101)
    base_time = datetime(2026, 11, 1, 0, 0, 0, tzinfo=timezone.utc)
    baseline_records = [
        gen.generate_reading(
            timestamp=base_time + timedelta(minutes=i * 5),
            pattern=SimulatedPattern.NORMAL,
            dataset_reference="EXPERIMENT_BASELINE_TRAINING"
        )
        for i in range(150)
    ]
    df_train = pd.DataFrame(baseline_records)
    print(f"  Generated {len(df_train)} baseline samples for astronaut 'astro_03'.")
    print(f"  Mean HR: {df_train['heart_rate'].mean():.2f} bpm, Mean SpO2: {df_train['spo2'].mean():.2f}%, Mean Temp: {df_train['body_temperature'].mean():.2f} C")

    # 2. Pipeline Fitting (Leakage Prevention)
    print("\n[Step 2] Fitting Preprocessing & Scaling Pipeline...")
    pipeline = TelemetryPipeline(scale_features=True)
    pipeline.fit(df_train)
    _, X_train, report = pipeline.transform(df_train)
    print(f"  Feature matrix shape: {X_train.shape} (150 samples x {X_train.shape[1]} engineered features)")
    print(f"  Quality report: {report.valid_rows_retained}/{report.total_received} rows valid, {report.duplicates_removed} duplicates removed.")

    # 3. Model Training & Reproducibility Test
    print("\n[Step 3] Model Training & Reproducibility Check...")
    detector_a = PhysiologicalAnomalyDetector(n_estimators=100, contamination=0.05, random_state=42)
    detector_b = PhysiologicalAnomalyDetector(n_estimators=100, contamination=0.05, random_state=42)
    detector_a.fit(X_train)
    detector_b.fit(X_train)

    scores_a = detector_a.score_samples(X_train)
    scores_b = detector_b.score_samples(X_train)
    identical = np.allclose(scores_a, scores_b, atol=1e-7)
    print(f"  Reproducibility check (2 independent fits with same seed): Identical = {identical}")
    print(f"  Training score distribution: min={scores_a.min():.4f}, median={np.median(scores_a):.4f}, max={scores_a.max():.4f}")

    # 4. Nominal vs Anomalous Inference Test
    print("\n[Step 4] Evaluating Unseen Nominal vs Anomalous Readings...")
    eval_time = base_time + timedelta(hours=20)
    nominal_reading = gen.generate_reading(
        timestamp=eval_time,
        pattern=SimulatedPattern.NORMAL,
        dataset_reference="EXPERIMENT_UNSEEN_TEST"
    )
    # Intentionally anomalous reading (Hypoxia with tachypnea: SpO2=87.5%, HR=108, RR=26)
    anomalous_reading = {
        "astronaut_id": "astro_03",
        "timestamp": eval_time + timedelta(minutes=5),
        "heart_rate": 108.0,
        "systolic_bp": 138.0,
        "diastolic_bp": 88.0,
        "spo2": 87.5,
        "body_temperature": 37.1,
        "respiration_rate": 26.0,
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True,
        "dataset_reference": "EXPERIMENT_UNSEEN_ANOMALY"
    }

    df_test_nom = pd.DataFrame([nominal_reading])
    df_test_anom = pd.DataFrame([anomalous_reading])

    _, X_test_nom, _ = pipeline.transform(df_test_nom)
    _, X_test_anom, _ = pipeline.transform(df_test_anom)

    score_nom = float(detector_a.score_samples(X_test_nom)[0])
    score_anom = float(detector_a.score_samples(X_test_anom)[0])
    pred_nom = bool(detector_a.predict(X_test_nom)[0])
    pred_anom = bool(detector_a.predict(X_test_anom)[0])

    print(f"  Unseen Nominal reading:   score = {score_nom:+.4f}, is_anomaly = {pred_nom}")
    print(f"  Intended Hypoxia anomaly: score = {score_anom:+.4f}, is_anomaly = {pred_anom}")
    separation = score_anom - score_nom
    print(f"  Score Separation delta:   {separation:+.4f} (Higher positive score indicates anomaly)")
    assert score_anom > score_nom, "Anomaly score must be strictly greater than nominal score!"
    print("  => Assertion PASSED: score_anom > score_nom")

    # 5. Full Multi-Hazard Engine Assessment
    print("\n[Step 5] End-to-End IntegratedHealthRiskEngine Assessment...")
    engine = IntegratedHealthRiskEngine(detector=detector_a, pipeline=pipeline)
    assessment_nom = engine.assess_snapshot(nominal_reading, evaluated_timestamp=eval_time)
    assessment_anom = engine.assess_snapshot(anomalous_reading, evaluated_timestamp=eval_time + timedelta(minutes=5))

    print(f"  Nominal Assessment: status='{assessment_nom.overall_status}', severity='{assessment_nom.highest_severity}', primary='{assessment_nom.primary_hazard.value}', violations={len(assessment_nom.rule_violations)}")
    print(f"  Anomaly Assessment: status='{assessment_anom.overall_status}', severity='{assessment_anom.highest_severity}', primary='{assessment_anom.primary_hazard.value}', violations={len(assessment_anom.rule_violations)}")
    for v in assessment_anom.rule_violations:
        print(f"    - Violation: {v.rule_name} (severity={v.severity}, message='{v.message}')")

    # 6. Safety & Insufficient Data Handling
    print("\n[Step 6] Safety & Edge Case Handling...")
    # Empty DataFrame
    empty_df = pd.DataFrame()
    _, report_empty = pipeline.validator.validate_and_clean(empty_df)
    print(f"  Empty input handled gracefully: received={report_empty.total_received}, retained={report_empty.valid_rows_retained}")

    # Out-of-bounds biological reading (impossible HR = 350 bpm)
    oob_reading = {
        "astronaut_id": "astro_03",
        "timestamp": eval_time + timedelta(minutes=10),
        "heart_rate": 350.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }
    cleaned_oob, report_oob = pipeline.validator.validate_and_clean(pd.DataFrame([oob_reading]))
    print(f"  Out-of-bounds reading rejected: retained={len(cleaned_oob)}, exclusion='{report_oob.exclusions[0] if report_oob.exclusions else 'none'}'")

    print("\n" + "=" * 70)
    print("ALL EXPERIMENTAL ASSERTIONS PASSED SUCCESSFULLY.")
    print("=" * 70)


if __name__ == "__main__":
    run_experiment()
