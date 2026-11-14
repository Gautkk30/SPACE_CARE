"""
SPACECARE Task 7 Comprehensive REST API Test Suite.
NASA Space Apps Challenge 2026

Verifies:
1. Root (/) and health (/api/v1/health) endpoint backwards compatibility.
2. Astronaut profile listing and single retrieval (200 & 404).
3. Telemetry ingestion with validation (bounds, provenance consistency, 201, 404, 422).
4. Telemetry historical querying with pagination (limit, offset).
5. Alert retrieval with filtering (is_acknowledged).
6. Alert acknowledgement (200 & 404, strictly conforming to model fields).
7. Condition-specific alert deduplication (preventing duplicate alerts for the same condition while allowing different conditions).
8. Evidence status honest reporting (distinguishing physiological evidence from overall multi-hazard coverage).
"""

from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

from app.database.session import Base, get_db, DEMO_ASTRONAUT
from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.alert import Alert
from app.models.data_source import DataSource
from app.main import app


# ==============================================================================
# In-Memory Database Fixture & Dependency Override
# ==============================================================================

@pytest.fixture
def client():
    """
    Creates an isolated in-memory SQLite database for API testing,
    seeds the demo astronaut, and overrides the get_db dependency.
    """
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)

    # Seed demo astronaut
    with Session(engine) as session:
        astro = Astronaut(**DEMO_ASTRONAUT)
        session.add(astro)
        session.commit()

    def override_get_db():
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


# ==============================================================================
# 1. Root & Health Endpoint Tests
# ==============================================================================

def test_root_endpoint(client: TestClient):
    """Verifies baseline service information endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["project"] == "SPACECARE"
    assert data["status"] == "initialized"


def test_health_check_endpoint(client: TestClient):
    """Verifies service health check endpoint."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data
    assert "timestamp" in data


# ==============================================================================
# 2. Astronaut Profile Routes Tests
# ==============================================================================

def test_list_astronauts(client: TestClient):
    """Verifies listing astronaut profiles."""
    response = client.get("/api/v1/astronauts")
    assert response.status_code == 200
    astros = response.json()
    assert len(astros) >= 1
    demo = next(a for a in astros if a["id"] == "astro_03")
    assert demo["name"] == "Major Marcus Chen"
    assert demo["role"] == "Flight Engineer"
    assert demo["is_demo"] is True
    assert demo["baseline_heart_rate"] == 72.0


def test_retrieve_astronaut_success(client: TestClient):
    """Verifies retrieving a specific astronaut profile."""
    response = client.get("/api/v1/astronauts/astro_03")
    assert response.status_code == 200
    astro = response.json()
    assert astro["id"] == "astro_03"
    assert astro["mission"] == "Artemis Lunar Transit"


def test_retrieve_astronaut_not_found(client: TestClient):
    """Verifies 404 response for unknown astronaut ID."""
    response = client.get("/api/v1/astronauts/astro_unknown_99")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ==============================================================================
# 3. Telemetry Ingestion Tests
# ==============================================================================

def test_ingest_telemetry_nominal(client: TestClient):
    """Verifies successful ingestion of nominal telemetry reading."""
    payload = {
        "astronaut_id": "astro_03",
        "heart_rate": 74.0,
        "systolic_bp": 122.0,
        "diastolic_bp": 79.0,
        "spo2": 98.4,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True,
        "dataset_reference": "SIM_CLIENT_RUN_01"
    }
    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Check Telemetry object
    tel = data["telemetry"]
    assert tel["id"] is not None
    assert tel["astronaut_id"] == "astro_03"
    assert tel["heart_rate"] == 74.0
    assert tel["is_simulated"] is True
    assert tel["data_source"] == "SYNTHETIC_SIMULATED"

    # Check Assessment Summary
    summary = data["assessment_summary"]
    assert summary["overall_status"] == "NOMINAL"
    assert summary["highest_severity"] == "INFO"
    assert summary["primary_hazard"] == "PHYSIOLOGICAL"
    assert summary["assessed_domains"] == ["PHYSIOLOGICAL"]
    assert "SPACE_RADIATION" in summary["unmonitored_domains"]
    assert summary["overall_evidence_status"] == "PARTIAL_MONITORING"
    assert summary["alerts_created_count"] == 0


def test_ingest_telemetry_unknown_astronaut_404(client: TestClient):
    """Verifies 404 error when ingesting telemetry for an unknown astronaut."""
    payload = {
        "astronaut_id": "astro_ghost_99",
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": True
    }
    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 404
    assert "astro_ghost_99" in response.json()["detail"]


def test_ingest_telemetry_provenance_mismatch_422(client: TestClient):
    """
    Verifies that provenance inconsistencies are rejected with HTTP 422:
    1. SYNTHETIC_SIMULATED with is_simulated=False
    2. SENSOR_LIVE with is_simulated=True
    """
    # 1. Synthetic data claiming to be non-simulated
    invalid_synth = {
        "astronaut_id": "astro_03",
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
        "data_source": "SYNTHETIC_SIMULATED",
        "is_simulated": False  # ILLEGAL
    }
    r1 = client.post("/api/v1/telemetry", json=invalid_synth)
    assert r1.status_code == 422

    # 2. Live sensor claiming to be simulated
    invalid_live = {
        "astronaut_id": "astro_03",
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
        "data_source": "SENSOR_LIVE",
        "is_simulated": True  # ILLEGAL
    }
    r2 = client.post("/api/v1/telemetry", json=invalid_live)
    assert r2.status_code == 422


def test_ingest_telemetry_implausible_physiological_bounds_422(client: TestClient):
    """Verifies that impossible physiological measurements are rejected with HTTP 422."""
    # Impossible heart rate (500 bpm)
    r1 = client.post("/api/v1/telemetry", json={
        "astronaut_id": "astro_03",
        "heart_rate": 500.0,  # ILLEGAL
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    })
    assert r1.status_code == 422

    # Systolic BP less than Diastolic BP
    r2 = client.post("/api/v1/telemetry", json={
        "astronaut_id": "astro_03",
        "heart_rate": 72.0,
        "systolic_bp": 70.0,
        "diastolic_bp": 110.0,  # ILLEGAL
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    })
    assert r2.status_code == 422


# ==============================================================================
# 4. Telemetry History & Pagination Tests
# ==============================================================================

def test_telemetry_history_pagination(client: TestClient):
    """Verifies querying chronological telemetry history with limit and offset."""
    # Insert 5 readings sequentially
    for i in range(5):
        client.post("/api/v1/telemetry", json={
            "astronaut_id": "astro_03",
            "heart_rate": 70.0 + i,
            "systolic_bp": 120.0,
            "diastolic_bp": 80.0,
            "spo2": 98.0,
            "body_temperature": 36.8,
            "respiration_rate": 15.0,
        })

    # Retrieve with limit=3
    r = client.get("/api/v1/astronauts/astro_03/telemetry?limit=3&offset=0")
    assert r.status_code == 200
    readings = r.json()
    assert len(readings) == 3
    # Ordered newest first
    assert readings[0]["heart_rate"] == 74.0
    assert readings[1]["heart_rate"] == 73.0

    # Retrieve with offset=3
    r_offset = client.get("/api/v1/astronauts/astro_03/telemetry?limit=3&offset=3")
    assert r_offset.status_code == 200
    readings_offset = r_offset.json()
    assert len(readings_offset) == 2


def test_telemetry_history_unknown_astronaut_404(client: TestClient):
    """Verifies 404 for historical telemetry of an unknown astronaut."""
    response = client.get("/api/v1/astronauts/astro_missing/telemetry")
    assert response.status_code == 404


# ==============================================================================
# 5. Alert Triggering, Retrieval & Condition-Specific Deduplication Tests
# ==============================================================================

def test_alert_triggering_and_condition_specific_deduplication(client: TestClient):
    """
    Verifies:
    1. Critical telemetry reading triggers an alert and persists to DB.
    2. A second identical anomalous reading does NOT create a duplicate alert for the same condition.
    3. A different condition (e.g. Hypoxia vs Tachycardia) DOES create a distinct separate alert.
    """
    # 1. Ingest Acute Severe Tachycardia (HR = 135 bpm >= 130 threshold)
    tachy_payload = {
        "astronaut_id": "astro_03",
        "heart_rate": 135.0,
        "systolic_bp": 125.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 16.0,
    }
    r1 = client.post("/api/v1/telemetry", json=tachy_payload)
    assert r1.status_code == 201
    d1 = r1.json()["assessment_summary"]
    assert d1["highest_severity"] == "CRITICAL"
    assert d1["alerts_created_count"] >= 1
    first_alert_id = d1["new_alert_ids"][0]
    assert "tachycardia" in first_alert_id.lower()

    # 2. Ingest another identical tachycardia reading immediately after
    r2 = client.post("/api/v1/telemetry", json=tachy_payload)
    assert r2.status_code == 201
    d2 = r2.json()["assessment_summary"]
    # Alert for tachycardia is already open and unacknowledged -> 0 new alerts created
    assert d2["alerts_created_count"] == 0
    assert first_alert_id in d2["active_open_alert_ids"]

    # 3. Ingest a DIFFERENT condition: Acute Hypoxia (SpO2 = 87.0% <= 88.0 threshold)
    hypoxia_payload = {
        "astronaut_id": "astro_03",
        "heart_rate": 72.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 87.0,
        "body_temperature": 36.8,
        "respiration_rate": 16.0,
    }
    r3 = client.post("/api/v1/telemetry", json=hypoxia_payload)
    assert r3.status_code == 201
    d3 = r3.json()["assessment_summary"]
    # Distinct condition -> creates a NEW alert!
    assert d3["alerts_created_count"] >= 1
    new_hypox_id = d3["new_alert_ids"][0]
    assert "hypoxia" in new_hypox_id.lower()
    assert new_hypox_id != first_alert_id


def test_alert_query_and_filtering(client: TestClient):
    """Verifies alert querying and filtering by is_acknowledged."""
    # Trigger an alert
    client.post("/api/v1/telemetry", json={
        "astronaut_id": "astro_03",
        "heart_rate": 138.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    })

    # Retrieve all alerts for astro_03
    r = client.get("/api/v1/astronauts/astro_03/alerts")
    assert r.status_code == 200
    alerts = r.json()
    assert len(alerts) >= 1

    # Filter by is_acknowledged=False
    r_unack = client.get("/api/v1/astronauts/astro_03/alerts?is_acknowledged=false")
    assert r_unack.status_code == 200
    assert len(r_unack.json()) >= 1

    # Filter by is_acknowledged=True (currently empty)
    r_ack = client.get("/api/v1/astronauts/astro_03/alerts?is_acknowledged=true")
    assert r_ack.status_code == 200
    assert len(r_ack.json()) == 0


# ==============================================================================
# 6. Alert Acknowledgement Tests
# ==============================================================================

def test_acknowledge_alert_success(client: TestClient):
    """
    Verifies acknowledging an alert:
    1. Returns 200 with updated status.
    2. Model response contains strictly supported fields (no fabricated acknowledged_at).
    """
    # Trigger an alert
    r_tel = client.post("/api/v1/telemetry", json={
        "astronaut_id": "astro_03",
        "heart_rate": 140.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    })
    alert_id = r_tel.json()["assessment_summary"]["new_alert_ids"][0]

    # Acknowledge the alert
    r_ack = client.patch(f"/api/v1/alerts/{alert_id}/acknowledge")
    assert r_ack.status_code == 200
    ack_data = r_ack.json()
    assert ack_data["status"] == "acknowledged"

    alert_obj = ack_data["alert"]
    assert alert_obj["id"] == alert_id
    assert alert_obj["is_acknowledged"] is True
    # Confirm no non-persisted fields like acknowledged_at
    assert "acknowledged_at" not in alert_obj

    # Confirm it now appears in is_acknowledged=true query
    r_query = client.get("/api/v1/astronauts/astro_03/alerts?is_acknowledged=true")
    assert any(a["id"] == alert_id for a in r_query.json())


def test_acknowledge_alert_not_found_404(client: TestClient):
    """Verifies 404 response when attempting to acknowledge a non-existent alert."""
    response = client.patch("/api/v1/alerts/alt_non_existent_999/acknowledge")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_alert_lifecycle_deduplication_and_retrigger_after_acknowledgement(client: TestClient):
    """
    Rigorously proves:
    1. First anomalous event creates Alert A (is_acknowledged=False).
    2. Repeated unacknowledged occurrences of the same condition remain deduplicated (0 new alerts).
    3. Acknowledging Alert A allows a subsequent occurrence of the same condition to create a new Alert B.
    """
    tachy_reading = {
        "astronaut_id": "astro_03",
        "heart_rate": 136.0,
        "systolic_bp": 125.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    }

    # Step 1: Initial occurrence triggers alerts
    r1 = client.post("/api/v1/telemetry", json=tachy_reading)
    assert r1.status_code == 201
    d1 = r1.json()["assessment_summary"]
    assert d1["alerts_created_count"] >= 1
    initial_alert_ids = d1["new_alert_ids"]

    # Step 2: Unacknowledged repetition -> deduplicated (0 new alerts)
    r2 = client.post("/api/v1/telemetry", json=tachy_reading)
    assert r2.status_code == 201
    d2 = r2.json()["assessment_summary"]
    assert d2["alerts_created_count"] == 0
    assert all(aid in d2["active_open_alert_ids"] for aid in initial_alert_ids)

    # Step 3: Acknowledge initial alerts
    for aid in initial_alert_ids:
        r_ack = client.patch(f"/api/v1/alerts/{aid}/acknowledge")
        assert r_ack.status_code == 200
        assert r_ack.json()["alert"]["is_acknowledged"] is True
        # Confirm confidence_score is NOT exposed in the public API response
        assert "confidence_score" not in r_ack.json()["alert"]

    # Step 4: Subsequent occurrence of the same condition -> creates NEW Alerts!
    r3 = client.post("/api/v1/telemetry", json=tachy_reading)
    assert r3.status_code == 201
    d3 = r3.json()["assessment_summary"]
    assert d3["alerts_created_count"] >= 1
    new_alert_ids = d3["new_alert_ids"]
    assert set(new_alert_ids).isdisjoint(set(initial_alert_ids))  # Distinct new alerts generated!

    # Step 5: Verify all alerts exist in DB with appropriate acknowledgment states
    r_all_alerts = client.get("/api/v1/astronauts/astro_03/alerts")
    assert r_all_alerts.status_code == 200
    all_alerts = r_all_alerts.json()
    
    for aid in initial_alert_ids:
        obj = next(a for a in all_alerts if a["id"] == aid)
        assert obj["is_acknowledged"] is True
        assert "confidence_score" not in obj

    for aid in new_alert_ids:
        obj = next(a for a in all_alerts if a["id"] == aid)
        assert obj["is_acknowledged"] is False
        assert "confidence_score" not in obj


def test_transaction_graceful_partial_processing_on_assessment_failure(client: TestClient, monkeypatch):
    """
    Verifies transaction handling:
    When risk evaluation encounters an internal exception:
    1. Telemetry is safely persisted (sensor data is not lost).
    2. Pending alert transactions are cleanly rolled back.
    3. Partial processing degradation is explicitly reported in the response.
    """
    from app.services.risk_service import risk_service

    # Monkeypatch assess_snapshot to simulate an internal calculation failure
    def mock_faulty_assess(*args, **kwargs):
        raise RuntimeError("Simulated hardware bus / inference failure")

    monkeypatch.setattr(risk_service.engine, "assess_snapshot", mock_faulty_assess)

    payload = {
        "astronaut_id": "astro_03",
        "heart_rate": 75.0,
        "systolic_bp": 120.0,
        "diastolic_bp": 80.0,
        "spo2": 98.0,
        "body_temperature": 36.8,
        "respiration_rate": 15.0,
    }

    response = client.post("/api/v1/telemetry", json=payload)
    assert response.status_code == 201
    data = response.json()

    # Telemetry was safely persisted
    assert data["telemetry"]["id"] is not None
    assert data["telemetry"]["heart_rate"] == 75.0

    # Assessment explicitly reports partial processing degradation
    summary = data["assessment_summary"]
    assert summary["overall_status"] == "DATA_QUALITY_ISSUE"
    assert summary["overall_evidence_status"] == "ASSESSMENT_DEGRADED"
    assert summary["alerts_created_count"] == 0
    assert any("Simulated hardware bus" in exp["heuristic_explanation"] for exp in summary["heuristic_explanations"])

