
from datetime import date

import httpx
from fastapi import APIRouter, HTTPException, Query

from app.services.radiation_service import RadiationService


router = APIRouter()
radiation_service = RadiationService()


@router.get("/cme", summary="Get NASA DONKI CME events")
async def get_cme_events(
    start_date: date = Query(
        ...,
        description="Start date (YYYY-MM-DD)"
    ),
    end_date: date = Query(
        ...,
        description="End date (YYYY-MM-DD)"
    )
):
    """Retrieve CME events from NASA CCMC DONKI."""

    if end_date < start_date:
        raise HTTPException(
            status_code=400,
            detail="end_date must not be earlier than start_date"
        )

    try:
        return await radiation_service.get_cme_events(
            start_date=start_date.isoformat(),
            end_date=end_date.isoformat()
        )

    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"NASA DONKI API returned HTTP {exc.response.status_code}"
        )

    except (httpx.RequestError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"NASA DONKI API request failed: {str(exc)}"
        )
