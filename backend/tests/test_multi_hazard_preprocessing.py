"""
Unit and integration tests for SPACECARE Multi-Hazard Preprocessing System.
Covers the five NASA spaceflight hazards + physiological biometrics:
1. Space Radiation (physics, units, irregular intervals, integration)
2. Isolation and Confinement (sleep debt, non-diagnostic reporting)
3. Distance from Earth (mission context, light-time latency)
4. Gravity Fields (exercise adherence, no bone density inference)
5. Hostile/Closed Environments (Dalton's Law, cabin atmospheric pressure)
Multi-hazard alignment (as-of backward causal merge, staleness, tolerance).
"""

import pytest
from pathlib import Path
from datetime import datetime, timezone, timedelta
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.radiation import SpaceRadiationPreprocessor
from app.ml.preprocessing.isolation import IsolationConfinementPreprocessor
from app.ml.preprocessing.distance import DistanceFromEarthPreprocessor
from app.ml.preprocessing.gravity import GravityFieldsPreprocessor
from app.ml.preprocessing.environment import HostileEnvironmentPreprocessor
from app.ml.preprocessing.multi_hazard_pipeline import MultiHazardPipeline


@pytest.fixture(name="base_timestamps")
def fixture_base_timestamps():
    """Generates 10 UTC timestamp steps spaced by 1 hour."""
    t0 = datetime(2026, 11, 14, 0, 0, 0, tzinfo=timezone.utc)
    return [t0 + timedelta(hours=i) for i in range(10)]


# ==============================================================================
# 1. Space Radiation Hazard Tests
# ==============================================================================
def test_space_radiation_processing_and_cumulative_accrual(base_timestamps):
    """
    Test 1: Verify radiation dose rate, cumulative exposure integration using elapsed time.
    Ensures initial reading at onset has 0 prior accrued dose (resolving the 0.37 uSv bug).
    """
    df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": base_timestamps,
        "dose_rate": [20.0, 21.0, 22.0, 150.0, 300.0, 45.0, 22.0, 20.0, 21.0, 20.0],  # uSv/h with SPE spike
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True,
        "dataset_reference": "SIM_RADIATION_LOG"
    })

    processor = SpaceRadiationPreprocessor()
    processed, report, meta = processor.process(df, unit_dose_rate="uSv/h", initial_interval_seconds=0.0)

    assert len(processed) == 10
    # First reading has 0 elapsed seconds prior to start of tracking -> cumulative dose starts at 0.0
    assert processed["cumulative_exposure"].iloc[0] == 0.0
    # After 1 hour at 21 uSv/h, accrued dose is 21.0 uSv
    assert np.isclose(processed["cumulative_exposure"].iloc[1], 21.0)
    # Monotonic accumulation
    assert (processed["cumulative_exposure"].diff().dropna() >= 0).all()
    # Step difference captures the solar flare spike at index 3 (from 22 to 150 uSv/h)
    assert processed["dose_rate_diff_step"].iloc[3] == 128.0
    assert processed["data_source"].iloc[0] == "SYNTHETIC_SIMULATED"
    assert bool(processed["is_simulated"].iloc[0]) is True


def test_space_radiation_irregular_intervals_and_duplicates():
    """
    Test 2: Verify radiation integration across irregular time gaps and duplicate timestamps.
    """
    t0 = datetime(2026, 11, 14, 10, 0, 0, tzinfo=timezone.utc)
    timestamps = [
        t0,
        t0 + timedelta(minutes=15),   # +15 min (0.25 h)
        t0 + timedelta(minutes=60),   # +45 min (0.75 h)
        t0 + timedelta(minutes=60),   # Duplicate timestamp (0 elapsed seconds)
        t0 + timedelta(minutes=180),  # +120 min (2.0 h)
    ]
    df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": timestamps,
        "dose_rate": [20.0, 40.0, 60.0, 60.0, 25.0],
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    })

    processor = SpaceRadiationPreprocessor()
    processed, report, meta = processor.process(df)

    # Duplicate at 10:60 is detected and removed by validator
    assert report.duplicates_removed == 1
    assert len(processed) == 4

    # Row 0: 10:00 -> onset: 0.0 uSv
    assert processed["cumulative_exposure"].iloc[0] == 0.0
    # Row 1: 10:15 (0.25 h at 40 uSv/h) -> 40 * 0.25 = 10.0 uSv
    assert np.isclose(processed["cumulative_exposure"].iloc[1], 10.0)
    # Row 2: 11:00 (0.75 h at 60 uSv/h) -> 10.0 + 45.0 = 55.0 uSv
    assert np.isclose(processed["cumulative_exposure"].iloc[2], 55.0)
    # Row 3: 13:00 (2.00 h at 25 uSv/h) -> 55.0 + 50.0 = 105.0 uSv
    assert np.isclose(processed["cumulative_exposure"].iloc[3], 105.0)


def test_space_radiation_unit_conversion_with_and_without_quality_factor():
    """
    Test 3: Verify mGy/day to uSv/h requires explicit radiation quality factor (Q).
    Ensures absorbed dose is NOT silently converted to equivalent dose when Q is omitted.
    """
    df = pd.DataFrame([{
        "astronaut_id": "astro_03",
        "timestamp": "2026-11-14T10:00:00Z",
        "dose_rate": 0.5,  # 0.5 mGy/day
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }])

    processor = SpaceRadiationPreprocessor()

    # Case A: Q is explicitly provided (Q=1.5)
    processed_with_q, _, meta_with_q = processor.process(
        df, unit_dose_rate="mGy/day", radiation_quality_factor=1.5
    )
    # 0.5 mGy/d = (0.5 / 24) mGy/h * 1000 uGy/mGy * 1.5 Q = 31.25 uSv/h
    assert np.isclose(processed_with_q["dose_rate"].iloc[0], 31.25, rtol=1e-2)
    assert "quality factor Q=1.5" in meta_with_q.conversion_notes["dose_rate"]

    # Case B: Q is omitted (absorbed dose must NOT be converted to equivalent dose)
    processed_no_q, _, meta_no_q = processor.process(
        df, unit_dose_rate="mGy/day", radiation_quality_factor=None
    )
    # Absorbed dose rate in mGy/h is 0.5 / 24.0 = ~0.0208 mGy/h
    assert np.isclose(processed_no_q["absorbed_dose_rate_mgy_h"].iloc[0], 0.5 / 24.0)
    assert "quality factor (Q) was not specified" in meta_no_q.conversion_notes["dose_rate"]


# ==============================================================================
# 2. Isolation and Confinement Hazard Tests
# ==============================================================================
def test_isolation_confinement_configurable_reference_sleep(base_timestamps):
    """
    Test 4: Verify sleep debt calculation with configurable operational baseline reference.
    """
    df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": base_timestamps[:5],
        "sleep_duration": [7.5, 6.0, 5.0, 8.5, 7.0],
        "sleep_quality": [85.0, 70.0, 55.0, 90.0, 80.0],
        "workload_index": [45.0, 60.0, 78.0, 50.0, 55.0],
        "stress_indicator": [3.0, 5.0, 7.5, 4.0, 4.5],
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    })

    # Test with custom mission timeline target of 7.0 hours
    processor = IsolationConfinementPreprocessor(target_sleep_hours=7.0)
    processed, report, meta = processor.process(df)

    assert len(processed) == 5
    # At 5.0h sleep and 7.0h target: debt = 7.0 - 5.0 = 2.0h
    assert processed["sleep_debt_hours"].iloc[2] == 2.0
    # At 7.5h sleep (exceeds target): debt = 0.0h
    assert processed["sleep_debt_hours"].iloc[0] == 0.0
    assert processed["reference_target_sleep_hours"].iloc[0] == 7.0


# ==============================================================================
# 3. Distance from Earth Hazard Tests
# ==============================================================================
def test_distance_from_earth_latency_and_context(base_timestamps):
    """
    Test 5: Verify conversion of AU/minutes to km/seconds and operational context tagging.
    """
    df = pd.DataFrame([{
        "astronaut_id": "astro_03",
        "timestamp": "2026-11-14T10:00:00Z",
        "distance_from_earth": 0.5,           # 0.5 AU (~74.8 million km)
        "communication_delay": 4.15,          # 4.15 minutes (~249 seconds)
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }])

    processor = DistanceFromEarthPreprocessor()
    processed, report, meta = processor.process(df, unit_distance="AU", unit_latency="minutes")

    assert np.isclose(processed["distance_from_earth_km"].iloc[0], 74_798_935.35, rtol=1e-3)
    assert np.isclose(processed["communication_delay_sec"].iloc[0], 249.0)
    assert bool(processed["realtime_telemedicine_feasible"].iloc[0]) is False
    assert meta.hazard_category == HazardCategory.DISTANCE_FROM_EARTH


# ==============================================================================
# 4. Gravity Fields Hazard Tests
# ==============================================================================
def test_gravity_fields_configurable_exercise_target(base_timestamps):
    """
    Test 6: Verify configurable exercise target and absence of fabricated bone density loss.
    """
    df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": base_timestamps[:4],
        "active_exercise_minutes": [120.0, 90.0, 60.0, 130.0],
        "balance_coordination_score": [95.0, 92.0, 88.0, 93.0],
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    })

    # Set custom reference guideline of 90 minutes
    processor = GravityFieldsPreprocessor(target_exercise_minutes=90.0)
    processed, report, meta = processor.process(df)

    assert len(processed) == 4
    # 90 min / 90 min = 1.0 adherence
    assert processed["exercise_adherence_ratio"].iloc[1] == 1.0
    # 60 min / 90 min = ~0.667 adherence
    assert np.isclose(processed["exercise_adherence_ratio"].iloc[2], 60.0 / 90.0)
    assert processed["exercise_deficit_minutes"].iloc[2] == 30.0
    assert processed["reference_target_exercise_minutes"].iloc[0] == 90.0

    # Ensure unscientific bone/muscle loss variables were NOT invented
    assert "bone_density_loss_percent" not in processed.columns
    assert "muscle_mass_atrophy_index" not in processed.columns


# ==============================================================================
# 5. Hostile/Closed Environment Hazard Tests
# ==============================================================================
def test_hostile_environment_daltons_law_and_missing_pressure():
    """
    Test 7: Verify CO2 conversion uses local cabin barometric pressure (Dalton's Law),
    and refrains from conversion when total barometric pressure is unknown.
    """
    # Case A: Local cabin pressure is provided (e.g. reduced-pressure EVA prep cabin: 70.0 kPa)
    df_with_p = pd.DataFrame([{
        "astronaut_id": "astro_03",
        "timestamp": "2026-11-14T10:00:00Z",
        "cabin_pressure": 70.0,            # 70.0 kPa (low-pressure habitat)
        "co2_concentration": 5000.0,       # 5000 ppm
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }])

    processor = HostileEnvironmentPreprocessor()
    processed_p, _, meta_p = processor.process(df_with_p, unit_co2="ppm", unit_pressure="kPa")

    # P_total in mmHg = 70.0 * (760 / 101.325) = ~525.04 mmHg
    # P_CO2 = 0.005 * 525.04 = ~2.625 mmHg
    expected_co2_mmhg = 0.005 * (70.0 * 760.0 / 101.325)
    assert np.isclose(processed_p["co2_concentration_mmhg"].iloc[0], expected_co2_mmhg)
    assert "Dalton's Law" in meta_p.conversion_notes["co2"]

    # Case B: No cabin pressure provided and no assumed pressure specified
    df_no_p = pd.DataFrame([{
        "astronaut_id": "astro_03",
        "timestamp": "2026-11-14T10:00:00Z",
        "co2_concentration": 4000.0,       # 4000 ppm
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }])
    processed_no_p, _, meta_no_p = processor.process(df_no_p, unit_co2="ppm")
    # Must preserve raw ppm and NOT invent partial pressure
    assert "co2_concentration_ppm" in processed_no_p.columns
    assert processed_no_p["co2_concentration_ppm"].iloc[0] == 4000.0
    assert "co2_concentration_mmhg" not in processed_no_p.columns
    assert "Cannot convert ppm to partial pressure" in meta_no_p.conversion_notes["co2"]


# ==============================================================================
# 6. Multi-Hazard Time Alignment, Staleness, & Provenance Tests
# ==============================================================================
def test_multi_hazard_alignment_staleness_and_tolerance():
    """
    Test 8: Verify backward alignment calculates measurement staleness and respects tolerance.
    """
    t0 = datetime(2026, 11, 14, 10, 0, 0, tzinfo=timezone.utc)
    vitals_df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": [
            t0,                          # 10:00
            t0 + timedelta(minutes=10),  # 10:10
            t0 + timedelta(minutes=30),  # 10:30
            t0 + timedelta(hours=3),     # 13:00 (Very stale)
        ],
        "heart_rate": [72.0, 74.0, 73.0, 75.0]
    })

    rad_df = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": [t0 + timedelta(minutes=5)],  # 10:05
        "dose_rate": [25.0],
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    })

    # Merge with a 1-hour tolerance
    aligned = MultiHazardPipeline.align_multi_hazard_streams(
        primary_vitals_df=vitals_df,
        hazard_streams={HazardCategory.SPACE_RADIATION: rad_df},
        tolerance=pd.Timedelta("1 hour")
    )

    assert len(aligned) == 4
    # Row 0 (10:00): prior to 10:05 observation -> NaN
    assert pd.isna(aligned.loc[0, "space_radiation_dose_rate"])

    # Row 1 (10:10): matched with 10:05 observation. Age = 10:10 - 10:05 = 5 minutes = 300 seconds
    assert aligned.loc[1, "space_radiation_dose_rate"] == 25.0
    assert aligned.loc[1, "space_radiation_observed_timestamp"] == t0 + timedelta(minutes=5)
    assert aligned.loc[1, "space_radiation_staleness_seconds"] == 300.0

    # Row 2 (10:30): matched with 10:05 observation. Age = 25 minutes = 1500 seconds
    assert aligned.loc[2, "space_radiation_staleness_seconds"] == 1500.0

    # Row 3 (13:00): 10:05 observation is 2 hours 55 min old (> 1 hour tolerance) -> filtered out to NaN
    assert pd.isna(aligned.loc[3, "space_radiation_dose_rate"])
    assert pd.isna(aligned.loc[3, "space_radiation_staleness_seconds"])


def test_provenance_separation_real_nasa_osdr_provenance():
    """
    Test 9: Verify provenance integrity using real NASA OSDR study OSD-946 metadata.
    """
    t0 = datetime(2026, 11, 14, 10, 0, 0, tzinfo=timezone.utc)
    synthetic_vitals = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": [t0],
        "heart_rate": [72.0],
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True,
        "dataset_reference": "SIM_TELEMETRY_ENGINE"
    })

    # Verified real NASA dataset: OSD-946 (Exercise Attenuates Genomic Response to Bed Rest)
    real_nasa_gravity_data = pd.DataFrame({
        "astronaut_id": "astro_03",
        "timestamp": [t0],
        "active_exercise_minutes": [90.0],
        "data_source": "NASA_RESEARCH",
        "is_simulated": False,
        "dataset_reference": "NASA_OSDR_OSD-946"
    })

    aligned = MultiHazardPipeline.align_multi_hazard_streams(
        primary_vitals_df=synthetic_vitals,
        hazard_streams={HazardCategory.GRAVITY_FIELDS: real_nasa_gravity_data}
    )

    # Vitals keep their synthetic simulated provenance
    assert aligned["data_source"].iloc[0] == "SYNTHETIC_SIMULATED"
    assert bool(aligned["is_simulated"].iloc[0]) is True
    assert aligned["dataset_reference"].iloc[0] == "SIM_TELEMETRY_ENGINE"

    # Gravity fields keeps authentic NASA research provenance
    assert aligned["gravity_fields_data_source"].iloc[0] == "NASA_RESEARCH"
    assert bool(aligned["gravity_fields_is_simulated"].iloc[0]) is False
    assert aligned["gravity_fields_dataset_reference"].iloc[0] == "NASA_OSDR_OSD-946"
