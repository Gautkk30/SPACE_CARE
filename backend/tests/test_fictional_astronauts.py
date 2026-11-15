"""
Unit and integration tests for Four Fictional Astronaut Profiles in SPACECARE.
Verifies idempotent seeding, preservation of astro_03, and API accessibility of all 5 crew members.
"""

import pytest
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session
from fastapi.testclient import TestClient

from app.database.session import (
    Base,
    init_db,
    seed_demo_astronaut,
    seed_additional_astronauts,
    seed_all_demo_astronauts,
    DEMO_ASTRONAUT,
    FOUR_FICTIONAL_ASTRONAUTS,
    ALL_DEMO_ASTRONAUTS,
)
from app.models.astronaut import Astronaut
from app.main import app


@pytest.fixture(name="isolated_engine")
def fixture_isolated_engine():
    """Provides a fresh isolated SQLite in-memory database for testing."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        echo=False
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)
    engine.dispose()


@pytest.fixture(name="session")
def fixture_session(isolated_engine):
    with Session(isolated_engine) as sess:
        yield sess


def test_seed_preserves_astro_03_and_adds_four_fictional(isolated_engine, session):
    """Verify that seed_all_demo_astronauts seeds 5 distinct astronauts including astro_03."""
    count = seed_all_demo_astronauts(session)
    assert count == 5

    # Check astro_03 is preserved exactly
    astro_03 = session.get(Astronaut, "astro_03")
    assert astro_03 is not None
    assert astro_03.name == "Major Marcus Chen"
    assert astro_03.role == "Flight Engineer"
    assert astro_03.baseline_heart_rate == 72.0
    assert astro_03.baseline_systolic_bp == 120.0
    assert astro_03.baseline_diastolic_bp == 78.0
    assert astro_03.is_demo is True

    # Check the 4 fictional astronauts
    expected_fictional = {
        "astro_morgan": ("Commander Alex Morgan", "Mission Commander", 65.0),
        "astro_reynolds": ("Dr. Maya Reynolds", "Flight Surgeon", 68.0),
        "astro_carter": ("Daniel Carter", "Flight Engineer", 74.0),
        "astro_bennett": ("Sofia Bennett", "Mission Specialist", 62.0),
    }

    for astro_id, (name, role, b_hr) in expected_fictional.items():
        astro = session.get(Astronaut, astro_id)
        assert astro is not None, f"Astronaut {astro_id} should be present"
        assert astro.name == name
        assert astro.role == role
        assert astro.baseline_heart_rate == b_hr
        assert astro.is_demo is True


def test_idempotent_seeding_no_duplicates(isolated_engine, session):
    """Verify repeated seeding calls do not create duplicate records."""
    # First seed
    init_db(target_engine=isolated_engine, seed_all=True)
    count_1 = session.scalar(select(func.count(Astronaut.id)))
    assert count_1 == 5

    # Second seed attempt
    init_db(target_engine=isolated_engine, seed_all=True)
    count_2 = session.scalar(select(func.count(Astronaut.id)))
    assert count_2 == 5

    # Manual call
    res = seed_all_demo_astronauts(session)
    assert res == 0
    count_3 = session.scalar(select(func.count(Astronaut.id)))
    assert count_3 == 5


def test_api_serves_all_five_astronaut_profiles():
    """Verify the FastAPI application serves all five profiles via /api/v1/astronauts."""
    with TestClient(app) as client:
        # App lifespan will have initialized and seeded the database
        resp = client.get("/api/v1/astronauts")
        assert resp.status_code == 200
        astronauts = resp.json()

        returned_ids = {a["id"] for a in astronauts}
        expected_ids = {"astro_03", "astro_morgan", "astro_reynolds", "astro_carter", "astro_bennett"}
        assert expected_ids.issubset(returned_ids), f"Missing profiles: {expected_ids - returned_ids}"

        # Verify individual retrieval for each of the 5 astronauts
        for astro_id in expected_ids:
            r = client.get(f"/api/v1/astronauts/{astro_id}")
            assert r.status_code == 200
            data = r.json()
            assert data["id"] == astro_id
            assert data["is_demo"] is True
            assert "baseline_heart_rate" in data
            assert "baseline_systolic_bp" in data
            assert "baseline_diastolic_bp" in data
            assert "baseline_spo2" in data
            assert "baseline_body_temperature" in data
            assert "baseline_respiration_rate" in data
