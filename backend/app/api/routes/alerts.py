"""
Alert acknowledgement routes.
SPACECARE - NASA Space Apps Challenge 2026
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.crud.crud_alert import acknowledge_alert
from app.schemas.alert import AlertResponse, AlertAcknowledgeResponse

router = APIRouter()


@router.patch(
    "/{alert_id}/acknowledge",
    response_model=AlertAcknowledgeResponse,
    summary="Acknowledge an alert",
    description="Marks an alert as acknowledged by setting is_acknowledged=True."
)
def acknowledge_alert_endpoint(
    alert_id: str,
    db: Session = Depends(get_db)
):
    updated_alert = acknowledge_alert(db, alert_id=alert_id)
    if updated_alert is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Alert with ID '{alert_id}' not found."
        )

    return AlertAcknowledgeResponse(
        alert=AlertResponse.model_validate(updated_alert),
        status="acknowledged"
    )
