"""
Tests for NASA DONKI Radiation & Space Weather Endpoints
=========================================================
SPACECARE - NASA Space Apps Challenge 2026

Validates:
1. GET /api/v1/radiation/cme endpoint validation (end_date < start_date -> 400).
2. Query parameter formatting and validation.
3. Successful response structure adhering to CmeEventsResponse schema.
4. Scientific notice integrity attribution (space weather context != individual astronaut dose).
"""

from datetime import date, timedelta
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_radiation_cme_date_validation():
    """Verify 400 error when end_date is earlier than start_date."""
    response = client.get(
        "/api/v1/radiation/cme",
        params={
            "start_date": "2024-02-15",
            "end_date": "2024-02-01"
        }
    )
    assert response.status_code == 400
    assert "must not be earlier than start_date" in response.json()["detail"]


def test_radiation_cme_missing_params():
    """Verify 422 error when required date parameters are omitted."""
    response = client.get("/api/v1/radiation/cme")
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_radiation_cme_success_mock():
    """Verify response format and scientific notice with mocked DONKI client."""
    mock_events = [
        {
            "activityID": "2024-01-01T17:00:00-CME-001",
            "startTime": "2024-01-01T17:00Z",
            "sourceLocation": "N05E59",
            "note": "Faint CME observation from STEREO A.",
            "link": "https://ccmc.gsfc.nasa.gov/DONKI/view/CME/28435/-1",
            "instruments": [{"displayName": "SOHO: LASCO/C2"}],
            "cmeAnalyses": [
                {
                    "isMostAccurate": True,
                    "speed": 416.0,
                    "type": "S",
                    "halfAngle": 26.0
                }
            ]
        }
    ]

    with patch(
        "app.integrations.nasa.donki_client.DONKIClient.fetch_cme_events",
        new=AsyncMock(return_value=mock_events)
    ):
        response = client.get(
            "/api/v1/radiation/cme",
            params={
                "start_date": "2024-01-01",
                "end_date": "2024-01-02"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["source"] == "NASA CCMC DONKI"
        assert data["event_type"] == "Coronal Mass Ejection"
        assert data["count"] == 1
        assert len(data["events"]) == 1

        first = data["events"][0]
        assert first["event_id"] == "2024-01-01T17:00:00-CME-001"
        assert first["speed_km_s"] == 416.0
        assert first["type"] == "S"
        assert first["half_angle"] == 26.0

        assert "scientific_notice" in data
        assert "not a measurement of an individual astronaut's radiation exposure" in data["scientific_notice"]
