from datetime import datetime, timezone

from fastapi import APIRouter, status

from app.schemas.health import ManualHealthInput

router = APIRouter()


@router.post(
    "/manual",
    status_code=status.HTTP_201_CREATED,
    summary="Submit manually entered astronaut health readings",
)
async def submit_manual_health_reading(payload: ManualHealthInput):
    """
    Accept and validate manually entered health readings.

    This endpoint performs input validation only.
    It does not provide a medical diagnosis or ML prediction.
    """
    return {
        "status": "accepted",
        "source": "manual_entry",
        "astronaut_id": payload.astronaut_id,
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "readings": payload.model_dump(),
        "assessment": {
            "status": "not_performed",
            "message": (
                "Readings passed input validation. "
                "Clinical assessment and ML analysis are not performed."
            ),
        },
        "disclaimer": (
            "SPACECARE is a research and decision-support prototype, "
            "not a medical diagnostic system."
        ),
    }
