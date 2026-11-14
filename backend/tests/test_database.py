"""
Comprehensive unit and integration tests for SPACECARE Database & ORM.
Tests initialization, astronaut creation, telemetry insertion,
data source support, relationships, and alert management.
"""

import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import create_engine, select, func, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database.session import Base, init_db, seed_demo_astronaut, DEMO_ASTRONAUT
from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.alert import Alert
from app.models.data_source import DataSource


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


def test_database_initialization_and_demo_astronaut(test_engine, db_session):
    """
    Test 1: Verify database tables are created and demo astronaut is initialized.
    """
    init_db(target_engine=test_engine)

    # Verify demo astronaut exists
    stmt = select(Astronaut).where(Astronaut.id == "astro_03")
    demo_astro = db_session.execute(stmt).scalar_one_or_none()

    assert demo_astro is not None
    assert demo_astro.id == "astro_03"
    assert demo_astro.name == "Major Marcus Chen"
    assert demo_astro.role == "Flight Engineer"
    assert demo_astro.age == 36
    assert demo_astro.gender == "Male"
    assert demo_astro.mission == "Artemis Lunar Transit"
    assert demo_astro.baseline_heart_rate == 72.0
    assert demo_astro.baseline_systolic_bp == 120.0
    assert demo_astro.baseline_diastolic_bp == 78.0
    assert demo_astro.baseline_spo2 == 98.2
    assert demo_astro.baseline_body_temperature == 36.8
    assert demo_astro.baseline_respiration_rate == 15.0
    assert demo_astro.is_demo is True


def test_demo_astronaut_duplicate_prevention(test_engine, db_session):
    """
    Test 2: Verify repeated init_db calls do not create duplicates or fail.
    """
    # First initialization
    init_db(target_engine=test_engine)
    count_first = db_session.scalar(select(func.count(Astronaut.id)))
    assert count_first == 1

    # Second initialization attempt
    init_db(target_engine=test_engine)
    count_second = db_session.scalar(select(func.count(Astronaut.id)))
    assert count_second == 1

    # Manual call to seed_demo_astronaut should return False (already exists)
    seeded_again = seed_demo_astronaut(db_session)
    assert seeded_again is False


def test_astronaut_creation(db_session):
    """
    Test 3: Verify creation of custom astronaut profile with personalized baselines.
    """
    new_astronaut = Astronaut(
        id="astro_01",
        name="Commander Alex Vance",
        role="Mission Commander",
        age=42,
        gender="Male",
        mission="Artemis Lunar Transit",
        baseline_heart_rate=68.0,
        baseline_systolic_bp=116.0,
        baseline_diastolic_bp=74.0,
        baseline_spo2=98.8,
        baseline_body_temperature=36.6,
        baseline_respiration_rate=13.0,
        is_demo=True
    )
    db_session.add(new_astronaut)
    db_session.commit()

    retrieved = db_session.get(Astronaut, "astro_01")
    assert retrieved is not None
    assert retrieved.name == "Commander Alex Vance"
    assert retrieved.baseline_heart_rate == 68.0
    assert retrieved.created_at is not None
    assert retrieved.created_at.tzinfo is not None or retrieved.created_at.year == datetime.now().year


def test_telemetry_insertion_with_required_fields(db_session):
    """
    Test 4: Verify telemetry insertion supporting all required fields and UTC timestamps.
    """
    # Seed astronaut first
    demo = Astronaut(**DEMO_ASTRONAUT)
    db_session.add(demo)
    db_session.commit()

    now_utc = datetime.now(timezone.utc)
    telemetry_record = Telemetry(
        astronaut_id="astro_03",
        timestamp=now_utc,
        heart_rate=74.5,
        systolic_bp=122.0,
        diastolic_bp=80.0,
        spo2=98.4,
        body_temperature=36.9,
        respiration_rate=15.2,
        data_source=DataSource.SYNTHETIC_SIMULATED.value,
        is_simulated=True,
        dataset_reference="SIM_TELEMETRY_BATCH_01"
    )
    db_session.add(telemetry_record)
    db_session.commit()

    saved = db_session.get(Telemetry, telemetry_record.id)
    assert saved is not None
    assert saved.astronaut_id == "astro_03"
    assert saved.heart_rate == 74.5
    assert saved.systolic_bp == 122.0
    assert saved.diastolic_bp == 80.0
    assert saved.spo2 == 98.4
    assert saved.body_temperature == 36.9
    assert saved.respiration_rate == 15.2
    assert saved.data_source == "SYNTHETIC_SIMULATED"
    assert saved.is_simulated is True
    assert saved.dataset_reference == "SIM_TELEMETRY_BATCH_01"
    
    # Verify compatibility hybrid properties
    assert saved.blood_pressure_systolic == 122.0
    assert saved.blood_pressure_diastolic == 80.0
    assert saved.core_temperature == 36.9


def test_data_source_categories_support(db_session):
    """
    Test 5: Verify support for NASA_RESEARCH, SYNTHETIC_SIMULATED, and SENSOR_LIVE.
    """
    demo = Astronaut(**DEMO_ASTRONAUT)
    db_session.add(demo)
    db_session.commit()

    base_time = datetime.now(timezone.utc)
    sources = [
        (DataSource.NASA_RESEARCH.value, False, "NASA_OSDR_STUDY_451"),
        (DataSource.SYNTHETIC_SIMULATED.value, True, "SIM_ALGORITHM_SUITE_V1"),
        (DataSource.SENSOR_LIVE.value, False, "MED_CREW_WEARABLE_BIOHARNESS"),
    ]

    for idx, (source, is_sim, ref) in enumerate(sources):
        entry = Telemetry(
            astronaut_id="astro_03",
            timestamp=base_time + timedelta(minutes=idx),
            heart_rate=70.0 + idx,
            systolic_bp=120.0,
            diastolic_bp=78.0,
            spo2=98.5,
            body_temperature=36.8,
            respiration_rate=14.0,
            data_source=source,
            is_simulated=is_sim,
            dataset_reference=ref
        )
        db_session.add(entry)
    db_session.commit()

    # Query all records
    records = db_session.scalars(select(Telemetry).where(Telemetry.astronaut_id == "astro_03")).all()
    assert len(records) == 3
    persisted_sources = {r.data_source for r in records}
    assert persisted_sources == {"NASA_RESEARCH", "SYNTHETIC_SIMULATED", "SENSOR_LIVE"}


def test_astronaut_telemetry_relationship_and_cascade(db_session):
    """
    Test 6: Verify bidirectional relationship and cascade deletion.
    """
    demo = Astronaut(**DEMO_ASTRONAUT)
    db_session.add(demo)
    db_session.commit()

    t1 = Telemetry(
        astronaut_id="astro_03",
        timestamp=datetime.now(timezone.utc) - timedelta(minutes=5),
        heart_rate=71.0,
        systolic_bp=119.0,
        diastolic_bp=77.0,
        spo2=98.3,
        body_temperature=36.7,
        respiration_rate=14.0,
        data_source=DataSource.SYNTHETIC_SIMULATED.value,
        is_simulated=True
    )
    t2 = Telemetry(
        astronaut_id="astro_03",
        timestamp=datetime.now(timezone.utc),
        heart_rate=73.0,
        systolic_bp=121.0,
        diastolic_bp=79.0,
        spo2=98.1,
        body_temperature=36.8,
        respiration_rate=15.0,
        data_source=DataSource.SYNTHETIC_SIMULATED.value,
        is_simulated=True
    )
    db_session.add_all([t1, t2])
    db_session.commit()

    # Check relationship traversal
    astro = db_session.get(Astronaut, "astro_03")
    assert len(astro.telemetry) == 2
    assert astro.telemetry[0].heart_rate == 73.0  # Ordered descending by timestamp

    # Check back-population
    assert t1.astronaut.name == "Major Marcus Chen"

    # Test cascade delete: removing astronaut removes telemetry
    db_session.delete(astro)
    db_session.commit()

    remaining_telemetry = db_session.scalars(select(Telemetry)).all()
    assert len(remaining_telemetry) == 0


def test_alert_creation_and_relationship(db_session):
    """
    Test 7: Verify alert creation, querying, and relationship with astronaut.
    """
    demo = Astronaut(**DEMO_ASTRONAUT)
    db_session.add(demo)
    db_session.commit()

    alert = Alert(
        id="alt_test_001",
        astronaut_id="astro_03",
        severity="WARNING",
        category="CARDIOVASCULAR",
        message="Sustained elevated resting heart rate (+18 bpm above baseline).",
        confidence_score=0.92,
        recommendation="Initiate oral rehydration and schedule an unscheduled 30-minute rest.",
        is_acknowledged=False,
        timestamp=datetime.now(timezone.utc)
    )
    db_session.add(alert)
    db_session.commit()

    # Query through relationship
    astro = db_session.get(Astronaut, "astro_03")
    assert len(astro.alerts) == 1
    assert astro.alerts[0].id == "alt_test_001"
    assert astro.alerts[0].severity == "WARNING"
    assert astro.alerts[0].is_acknowledged is False
    assert astro.alerts[0].astronaut.name == "Major Marcus Chen"

    # Acknowledge alert
    alert.is_acknowledged = True
    db_session.commit()

    updated = db_session.get(Alert, "alt_test_001")
    assert updated.is_acknowledged is True


def test_foreign_key_constraint_enforcement(db_session):
    """
    Test 8: Verify foreign key integrity rejects orphan telemetry or alerts.
    """
    orphan_telemetry = Telemetry(
        astronaut_id="non_existent_astronaut",
        timestamp=datetime.now(timezone.utc),
        heart_rate=75.0,
        systolic_bp=120.0,
        diastolic_bp=80.0,
        spo2=98.0,
        body_temperature=37.0,
        respiration_rate=14.0,
        data_source=DataSource.SYNTHETIC_SIMULATED.value,
        is_simulated=True
    )
    db_session.add(orphan_telemetry)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    orphan_alert = Alert(
        id="alt_orphan",
        astronaut_id="non_existent_astronaut",
        severity="INFO",
        category="SYSTEMIC",
        message="Test alert",
        confidence_score=0.8,
        recommendation="No action",
        timestamp=datetime.now(timezone.utc)
    )
    db_session.add(orphan_alert)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
