"""
Comprehensive tests for SPACECARE Preprocessing & Feature Engineering Pipeline.
Verifies schema mapping, data quality validation, missing value handling,
chronological ordering, baseline deviations, rolling statistics,
data leakage prevention, provenance preservation, and pipeline serialization.
"""

import pytest
from pathlib import Path
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.database.session import Base, init_db, DEMO_ASTRONAUT
from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.data_source import DataSource
from app.services.telemetry_generator import TelemetryGenerator
from app.ml.preprocessing.schema_mapper import (
    DatasetSchemaMapper,
    NASA_OSDR_MAPPER,
    SYNTHETIC_MAPPER
)
from app.ml.preprocessing.validator import (
    TelemetryValidator,
    DataQualityReport,
    PHYSIOLOGICAL_BOUNDS
)
from app.ml.preprocessing.feature_engineer import (
    PhysiologicalFeatureEngineer,
    ML_FEATURE_COLUMNS,
    DEFAULT_BASELINES
)
from app.ml.preprocessing.pipeline import (
    TelemetryPipeline,
    FEATURE_DOCUMENTATION
)


@pytest.fixture(name="sample_raw_df")
def fixture_sample_raw_df():
    """Provides a synthetic telemetry dataframe for testing."""
    base_time = datetime(2026, 11, 14, 8, 0, 0, tzinfo=timezone.utc)
    data = []
    for i in range(20):
        data.append({
            "astronaut_id": "astro_03",
            "timestamp": (base_time + timedelta(minutes=i)).isoformat(),
            "heart_rate": 72.0 + (i % 3) - 1.0,
            "systolic_bp": 120.0 + (i % 4) - 2.0,
            "diastolic_bp": 78.0 + (i % 2),
            "spo2": 98.2 + (i % 2) * 0.2,
            "body_temperature": 36.8 + (i % 3) * 0.05,
            "respiration_rate": 15.0 + (i % 3) - 1.0,
            "data_source": "SYNTHETIC_SIMULATED",
            "is_simulated": True,
            "dataset_reference": "TEST_STREAM"
        })
    return pd.DataFrame(data)


def test_schema_mapper_aliases():
    """
    Test 1: Verify schema mapper resolves common physiological aliases.
    """
    raw = pd.DataFrame([{
        "crew_id": "astro_03",
        "time": "2026-11-14T10:00:00Z",
        "hr": 74.0,
        "blood_pressure_systolic": 122.0,
        "blood_pressure_diastolic": 79.0,
        "oxygen_saturation": 98.5,
        "core_temperature": 36.9,
        "rr": 14.5
    }])

    mapper = DatasetSchemaMapper()
    mapped = mapper.map_dataframe(raw)

    assert "astronaut_id" in mapped.columns and mapped["astronaut_id"].iloc[0] == "astro_03"
    assert "timestamp" in mapped.columns
    assert "heart_rate" in mapped.columns and mapped["heart_rate"].iloc[0] == 74.0
    assert "systolic_bp" in mapped.columns and mapped["systolic_bp"].iloc[0] == 122.0
    assert "diastolic_bp" in mapped.columns and mapped["diastolic_bp"].iloc[0] == 79.0
    assert "spo2" in mapped.columns and mapped["spo2"].iloc[0] == 98.5
    assert "body_temperature" in mapped.columns and mapped["body_temperature"].iloc[0] == 36.9
    assert "respiration_rate" in mapped.columns and mapped["respiration_rate"].iloc[0] == 14.5
    assert mapped["data_source"].iloc[0] == "SYNTHETIC_SIMULATED"
    assert bool(mapped["is_simulated"].iloc[0]) is True


def test_schema_mapper_nasa_osdr():
    """
    Test 2: Verify NASA OSDR study column mapping and provenance retention.
    """
    raw_nasa = pd.DataFrame([{
        "subject": "OSD_SUBJ_09",
        "datetime": "2026-11-14T12:00:00Z",
        "HR_bpm": 68.0,
        "Sys_mmHg": 116.0,
        "Dia_mmHg": 74.0,
        "SpO2_pct": 99.0,
        "Temp_degC": 36.6,
        "Resp_rpm": 13.0,
    }])

    mapped = NASA_OSDR_MAPPER.map_dataframe(raw_nasa)
    assert mapped["astronaut_id"].iloc[0] == "OSD_SUBJ_09"
    assert mapped["heart_rate"].iloc[0] == 68.0
    assert mapped["data_source"].iloc[0] == "NASA_RESEARCH"
    assert bool(mapped["is_simulated"].iloc[0]) is False
    assert mapped["dataset_reference"].iloc[0] == "NASA_OSDR_EXPORT"


def test_validator_timestamp_utc_and_chronological_sorting():
    """
    Test 3: Verify timezone parsing, UTC conversion, and temporal sorting.
    """
    raw = pd.DataFrame([
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T15:00:00+05:00",  # Unsorted later time
            "heart_rate": 72.0, "systolic_bp": 120.0, "diastolic_bp": 78.0,
            "spo2": 98.0, "body_temperature": 36.8, "respiration_rate": 15.0
        },
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T08:00:00Z",       # Earlier time
            "heart_rate": 70.0, "systolic_bp": 118.0, "diastolic_bp": 76.0,
            "spo2": 98.5, "body_temperature": 36.7, "respiration_rate": 14.0
        }
    ])

    validator = TelemetryValidator()
    cleaned, report = validator.validate_and_clean(raw)

    assert cleaned["timestamp"].iloc[0] < cleaned["timestamp"].iloc[1]
    assert cleaned["timestamp"].dt.tz == timezone.utc
    assert cleaned["heart_rate"].iloc[0] == 70.0


def test_validator_duplicate_detection():
    """
    Test 4: Verify duplicate readings for same astronaut and timestamp are caught and logged.
    """
    raw = pd.DataFrame([
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:00:00Z",
            "heart_rate": 72.0, "systolic_bp": 120.0, "diastolic_bp": 78.0,
            "spo2": 98.0, "body_temperature": 36.8, "respiration_rate": 15.0
        },
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:00:00Z",  # Duplicate timestamp
            "heart_rate": 72.0, "systolic_bp": 120.0, "diastolic_bp": 78.0,
            "spo2": 98.0, "body_temperature": 36.8, "respiration_rate": 15.0
        }
    ])

    validator = TelemetryValidator()
    cleaned, report = validator.validate_and_clean(raw)

    assert len(cleaned) == 1
    assert report.duplicates_removed == 1
    assert any("duplicate" in exc.lower() for exc in report.exclusions)


def test_validator_missing_values_auditing_no_silent_invention():
    """
    Test 5: Verify missing values are documented without silent invented replacement.
    """
    raw = pd.DataFrame([
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:00:00Z",
            "heart_rate": None,  # Missing
            "systolic_bp": 120.0,
            "diastolic_bp": 78.0,
            "spo2": 98.0,
            "body_temperature": 36.8,
            "respiration_rate": 15.0
        },
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:01:00Z",
            "heart_rate": 74.0,
            "systolic_bp": 120.0,
            "diastolic_bp": 78.0,
            "spo2": 98.0,
            "body_temperature": 36.8,
            "respiration_rate": 15.0
        }
    ])

    validator = TelemetryValidator(drop_invalid=True)
    cleaned, report = validator.validate_and_clean(raw)

    assert report.missing_counts["heart_rate"] == 1
    assert len(cleaned) == 1
    assert cleaned["heart_rate"].iloc[0] == 74.0
    assert any("missing" in exc.lower() for exc in report.exclusions)


def test_validator_physiological_bounds_and_consistency():
    """
    Test 6: Verify out-of-range and physiologically inconsistent values are documented.
    """
    raw = pd.DataFrame([
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:00:00Z",
            "heart_rate": 350.0,  # Biologically impossible HR
            "systolic_bp": 120.0, "diastolic_bp": 78.0, "spo2": 98.0,
            "body_temperature": 36.8, "respiration_rate": 15.0
        },
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:01:00Z",
            "heart_rate": 72.0,
            "systolic_bp": 70.0,  # Systolic < Diastolic (Inconsistent)
            "diastolic_bp": 85.0,
            "spo2": 98.0, "body_temperature": 36.8, "respiration_rate": 15.0
        },
        {
            "astronaut_id": "astro_03",
            "timestamp": "2026-11-14T10:02:00Z",
            "heart_rate": 72.0, "systolic_bp": 120.0, "diastolic_bp": 78.0,
            "spo2": 98.2, "body_temperature": 36.8, "respiration_rate": 15.0
        }
    ])

    validator = TelemetryValidator(drop_invalid=True)
    cleaned, report = validator.validate_and_clean(raw)

    assert report.invalid_range_counts["heart_rate"] == 1
    assert report.consistency_violations == 1
    assert len(cleaned) == 1
    assert cleaned["heart_rate"].iloc[0] == 72.0


def test_feature_engineer_baseline_and_percentage_deviations(sample_raw_df):
    """
    Test 7: Verify baseline deviations and percentage calculations.
    """
    baselines = {
        "baseline_heart_rate": 72.0,
        "baseline_systolic_bp": 120.0,
        "baseline_diastolic_bp": 78.0,
        "baseline_spo2": 98.2,
        "baseline_body_temperature": 36.8,
        "baseline_respiration_rate": 15.0
    }

    fe = PhysiologicalFeatureEngineer()
    enriched = fe.engineer_features(sample_raw_df, astronaut_baselines=baselines)

    # Check differences and percentages exist and match mathematical formulas
    expected_hr_diff = enriched["heart_rate"] - 72.0
    np.testing.assert_allclose(enriched["hr_diff_baseline"], expected_hr_diff)

    expected_hr_pct = (expected_hr_diff / 72.0) * 100.0
    np.testing.assert_allclose(enriched["hr_pct_deviation"], expected_hr_pct)

    # Verify aerospace indices
    np.testing.assert_allclose(
        enriched["pulse_pressure"],
        enriched["systolic_bp"] - enriched["diastolic_bp"]
    )
    np.testing.assert_allclose(
        enriched["shock_index"],
        enriched["heart_rate"] / (enriched["systolic_bp"] + 1e-5)
    )


def test_feature_engineer_first_differences(sample_raw_df):
    """
    Test 8: Verify step velocities (first differences).
    """
    fe = PhysiologicalFeatureEngineer()
    enriched = fe.engineer_features(sample_raw_df)

    assert enriched["hr_diff_step"].iloc[0] == 0.0  # Initial step diff is 0
    step_diff = enriched["heart_rate"].iloc[1] - enriched["heart_rate"].iloc[0]
    assert np.isclose(enriched["hr_diff_step"].iloc[1], step_diff)


def test_feature_engineer_rolling_features_no_future_leakage(sample_raw_df):
    """
    Test 9: Verify rolling calculations only look backward, never to future timestamps.
    """
    fe = PhysiologicalFeatureEngineer(rolling_window=5)
    enriched_1 = fe.engineer_features(sample_raw_df)

    # Modify a future row (row 10) in a test copy
    df_altered = sample_raw_df.copy()
    df_altered.loc[10, "heart_rate"] = 195.0

    enriched_2 = fe.engineer_features(df_altered)

    # Check that rows PRIOR to row 10 are completely identical between runs
    for i in range(10):
        assert np.isclose(
            enriched_1.loc[i, "hr_rolling_mean_5"],
            enriched_2.loc[i, "hr_rolling_mean_5"]
        )
        assert np.isclose(
            enriched_1.loc[i, "hr_rolling_std_5"],
            enriched_2.loc[i, "hr_rolling_std_5"]
        )


def test_feature_engineer_leakage_prevention(sample_raw_df):
    """
    Test 10: Verify get_feature_matrix excludes non-feature labels, metadata, and simulation states.
    """
    sample_with_labels = sample_raw_df.copy()
    sample_with_labels["is_anomaly"] = True
    sample_with_labels["simulated_pattern"] = "HYPOXIA"
    sample_with_labels["ground_truth_label"] = "abnormal"

    fe = PhysiologicalFeatureEngineer()
    enriched = fe.engineer_features(sample_with_labels)
    X = fe.get_feature_matrix(enriched)

    # Features must contain ONLY ML_FEATURE_COLUMNS
    assert list(X.columns) == ML_FEATURE_COLUMNS
    assert "is_anomaly" not in X.columns
    assert "simulated_pattern" not in X.columns
    assert "ground_truth_label" not in X.columns
    assert "astronaut_id" not in X.columns
    assert "timestamp" not in X.columns
    assert "data_source" not in X.columns


def test_chronological_train_test_split(sample_raw_df):
    """
    Test 11: Verify train/test splitting maintains strict chronological order.
    """
    train_df, test_df = PhysiologicalFeatureEngineer.split_chronologically(sample_raw_df, test_fraction=0.25)

    assert len(train_df) == 15
    assert len(test_df) == 5
    # Max train timestamp must be strictly earlier than min test timestamp
    assert pd.to_datetime(train_df["timestamp"].max()) < pd.to_datetime(test_df["timestamp"].min())


def test_pipeline_with_csv_file():
    """
    Test 12: Ingest and process existing synthetic telemetry CSV from Task 4.
    """
    csv_path = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "simulated" / "sim_astro_03_telemetry.csv"
    if not csv_path.exists():
        pytest.skip("Sample CSV does not exist yet; skipping file test.")

    df = pd.read_csv(csv_path)
    pipeline = TelemetryPipeline()
    enriched, X_scaled, report = pipeline.fit_transform(df)

    assert len(enriched) == len(df)
    assert X_scaled.shape == (len(df), len(ML_FEATURE_COLUMNS))
    assert np.isfinite(X_scaled).all()
    # Check provenance preserved
    assert (enriched["data_source"] == "SYNTHETIC_SIMULATED").all()
    assert (enriched["is_simulated"] == True).all()


def test_pipeline_with_sqlite_database():
    """
    Test 13: Ingest and process records directly from SQLite database.
    """
    # Create isolated in-memory DB and seed
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    init_db(target_engine=engine)

    # Generate and save readings
    with Session(engine) as session:
        gen = TelemetryGenerator(astronaut_id="astro_03", seed=99)
        gen.generate_and_save(session, count=30, interval_seconds=60)

        # Query back
        records = session.query(Telemetry).filter(Telemetry.astronaut_id == "astro_03").all()
        df = pd.DataFrame([{
            "astronaut_id": r.astronaut_id,
            "timestamp": r.timestamp,
            "heart_rate": r.heart_rate,
            "systolic_bp": r.systolic_bp,
            "diastolic_bp": r.diastolic_bp,
            "spo2": r.spo2,
            "body_temperature": r.body_temperature,
            "respiration_rate": r.respiration_rate,
            "data_source": r.data_source,
            "is_simulated": r.is_simulated,
            "dataset_reference": r.dataset_reference
        } for r in records])

    pipeline = TelemetryPipeline()
    enriched, X_scaled, report = pipeline.fit_transform(df)

    assert len(enriched) == 30
    assert X_scaled.shape[0] == 30
    assert X_scaled.shape[1] == len(ML_FEATURE_COLUMNS)
    assert pipeline.is_fitted is True


def test_pipeline_serialization_and_load(tmp_path, sample_raw_df):
    """
    Test 14: Verify pipeline save/load reproducibility using joblib.
    """
    pipeline = TelemetryPipeline()
    enriched_orig, X_orig, _ = pipeline.fit_transform(sample_raw_df)

    model_file = tmp_path / "test_pipeline.joblib"
    pipeline.save(model_file)

    loaded_pipeline = TelemetryPipeline.load(model_file)
    assert loaded_pipeline.is_fitted is True

    enriched_loaded, X_loaded, _ = loaded_pipeline.transform(sample_raw_df)
    np.testing.assert_allclose(X_orig, X_loaded)


def test_feature_documentation_completeness():
    """
    Test 15: Verify all engineered features are documented with formula and intended use.
    """
    for col in ML_FEATURE_COLUMNS:
        assert col in FEATURE_DOCUMENTATION, f"Missing documentation for feature: {col}"
        doc = FEATURE_DOCUMENTATION[col]
        assert "calculation" in doc
        assert "intended_use" in doc


def test_pipeline_fit_train_transform_test_no_leakage(sample_raw_df):
    """
    Test 16: Verify that fitting the pipeline on train_df does NOT leak test_df data into scaler parameters.
    """
    train_df, test_df = PhysiologicalFeatureEngineer.split_chronologically(sample_raw_df, test_fraction=0.3)

    pipeline = TelemetryPipeline()
    pipeline.fit(train_df)
    train_center = pipeline.scaler.center_.copy()
    train_scale = pipeline.scaler.scale_.copy()

    # Create an extreme outlier in test_df
    test_df_corrupted = test_df.copy()
    test_df_corrupted.loc[test_df_corrupted.index[0], "heart_rate"] = 210.0
    test_df_corrupted.loc[test_df_corrupted.index[0], "systolic_bp"] = 220.0

    # Transform test_df
    _, X_test, _ = pipeline.transform(test_df_corrupted)

    # Scaler centers and scales must remain 100% identical to the training values
    np.testing.assert_allclose(pipeline.scaler.center_, train_center)
    np.testing.assert_allclose(pipeline.scaler.scale_, train_scale)
    assert pipeline.is_fitted is True
