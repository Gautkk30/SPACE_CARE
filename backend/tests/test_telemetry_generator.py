"""
Unit and integration tests for Synthetic Astronaut Telemetry Generator.
Verifies normal physiological readings, controlled abnormal patterns,
UTC timestamping, data provenance labels, reproducibility, and SQLite insertion.
"""

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, select, func, event
from sqlalchemy.orm import Session

from app.database.session import Base, init_db, DEMO_ASTRONAUT
from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.data_source import DataSource
from app.services.telemetry_generator import TelemetryGenerator, SimulatedPattern


@pytest.fixture(name="test_engine")
def fixture_test_engine():
    """Provides an isolated in-memory SQLite database engine for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False
    )

    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(name="db_session")
def fixture_db_session(test_engine):
    """Provides a transactional database session for each test."""
    with Session(test_engine) as session:
        yield session


def test_generate_reading_normal():
    """
    Test 1: Verify normal telemetry stays close to astronaut baseline vitals.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=42)
    reading = generator.generate_reading(pattern=SimulatedPattern.NORMAL)

    assert reading["astronaut_id"] == "astro_03"
    # Expected baseline: HR 72, Sys 120, Dia 78, SpO2 98.2, Temp 36.8, RR 15
    assert 65.0 <= reading["heart_rate"] <= 80.0
    assert 112.0 <= reading["systolic_bp"] <= 128.0
    assert 72.0 <= reading["diastolic_bp"] <= 84.0
    assert 97.0 <= reading["spo2"] <= 99.5
    assert 36.4 <= reading["body_temperature"] <= 37.2
    assert 13.0 <= reading["respiration_rate"] <= 17.5
    assert reading["simulated_pattern"] == "NORMAL"


def test_generate_reading_controlled_hypoxia():
    """
    Test 2: Verify controlled hypoxia pattern simulates low oxygen and compensatory response.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=101)
    reading = generator.generate_reading(pattern=SimulatedPattern.HYPOXIA)

    # Hypoxia criteria: SpO2 dropped below normal, tachycardia, tachypnea
    assert 88.0 <= reading["spo2"] <= 92.5
    assert reading["heart_rate"] >= 90.0  # Elevated compensatory heart rate
    assert reading["respiration_rate"] >= 20.0  # Elevated respiration
    assert reading["simulated_pattern"] == "HYPOXIA"


def test_generate_reading_controlled_thermal_strain():
    """
    Test 3: Verify controlled thermal strain simulates hyperthermia and heat dissipation response.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=202)
    reading = generator.generate_reading(pattern=SimulatedPattern.THERMAL_STRAIN)

    # Thermal strain criteria: elevated core body temperature (>38.4 °C) and tachycardia
    assert 38.4 <= reading["body_temperature"] <= 39.5
    assert reading["heart_rate"] >= 95.0
    assert reading["systolic_bp"] >= 125.0
    assert reading["simulated_pattern"] == "THERMAL_STRAIN"


def test_generate_reading_controlled_acute_tachycardia():
    """
    Test 4: Verify acute resting tachycardia pattern.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=303)
    reading = generator.generate_reading(pattern=SimulatedPattern.ACUTE_TACHYCARDIA)

    # Acute tachycardia criteria: sudden resting HR spike (>125 bpm)
    assert reading["heart_rate"] >= 125.0
    assert reading["simulated_pattern"] == "ACUTE_TACHYCARDIA"


def test_generate_reading_controlled_hypotension():
    """
    Test 5: Verify orthostatic hypotension / deconditioning pattern.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=404)
    reading = generator.generate_reading(pattern=SimulatedPattern.HYPOTENSION_DECONDITIONING)

    # Hypotension criteria: systolic < 90 mmHg, diastolic < 60 mmHg
    assert reading["systolic_bp"] <= 90.0
    assert reading["diastolic_bp"] <= 60.0
    assert reading["simulated_pattern"] == "HYPOTENSION_DECONDITIONING"


def test_utc_timestamps_and_interval():
    """
    Test 6: Verify all generated timestamps are strictly timezone-aware UTC and spaced accurately.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=505)
    start_time = datetime(2026, 11, 14, 10, 0, 0, tzinfo=timezone.utc)
    interval = 60

    batch = generator.generate_batch(
        count=10,
        start_time=start_time,
        interval_seconds=interval
    )

    assert len(batch) == 10
    for i, r in enumerate(batch):
        expected_ts = start_time + timedelta(seconds=i * interval)
        assert r["timestamp"] == expected_ts
        assert r["timestamp"].tzinfo == timezone.utc


def test_data_provenance_labels():
    """
    Test 7: Verify every reading is explicitly labelled as synthetic simulation per NASA rules.
    """
    generator = TelemetryGenerator(astronaut_id="astro_03", seed=606)
    batch = generator.generate_batch(count=25, anomaly_rate=0.2)

    for r in batch:
        assert r["data_source"] == DataSource.SYNTHETIC_SIMULATED.value
        assert r["is_simulated"] is True
        assert r["dataset_reference"] == "SIM_SPACECARE_DEMO_RUN"
        assert r["astronaut_id"] == "astro_03"


def test_reproducibility_with_seed():
    """
    Test 8: Verify reproducible generation when specifying a random seed.
    """
    gen1 = TelemetryGenerator(astronaut_id="astro_03", seed=12345)
    batch1 = gen1.generate_batch(count=15, anomaly_rate=0.1)

    gen2 = TelemetryGenerator(astronaut_id="astro_03", seed=12345)
    batch2 = gen2.generate_batch(count=15, anomaly_rate=0.1)

    for r1, r2 in zip(batch1, batch2):
        assert r1["heart_rate"] == r2["heart_rate"]
        assert r1["systolic_bp"] == r2["systolic_bp"]
        assert r1["spo2"] == r2["spo2"]
        assert r1["body_temperature"] == r2["body_temperature"]
        assert r1["simulated_pattern"] == r2["simulated_pattern"]


def test_generator_from_database(test_engine, db_session):
    """
    Test 9: Verify TelemetryGenerator can load baseline thresholds directly from the database.
    """
    init_db(target_engine=test_engine)

    generator = TelemetryGenerator.from_database(db_session, astronaut_id="astro_03", seed=707)
    assert generator.baselines["baseline_heart_rate"] == 72.0
    assert generator.baselines["baseline_systolic_bp"] == 120.0

    reading = generator.generate_reading()
    assert 65.0 <= reading["heart_rate"] <= 80.0


def test_database_insertion(test_engine, db_session):
    """
    Test 10: Verify generated readings persist cleanly to SQLite and link to the astronaut.
    """
    init_db(target_engine=test_engine)

    generator = TelemetryGenerator(astronaut_id="astro_03", seed=808)
    persisted = generator.generate_and_save(
        db_session=db_session,
        count=20,
        interval_seconds=30,
        anomaly_rate=0.1
    )

    assert len(persisted) == 20

    # Query back from SQLite
    astro = db_session.get(Astronaut, "astro_03")
    assert len(astro.telemetry) == 20

    # Verify latest record
    latest = astro.telemetry[0]
    assert latest.astronaut_id == "astro_03"
    assert latest.data_source == "SYNTHETIC_SIMULATED"
    assert latest.is_simulated is True
    assert latest.heart_rate > 0
    assert latest.systolic_bp > 0
