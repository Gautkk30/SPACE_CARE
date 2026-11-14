
from app.integrations.nasa.donki_client import DONKIClient


class RadiationService:
    """Processes NASA DONKI solar event information."""

    def __init__(self):
        self.donki_client = DONKIClient()

    async def get_cme_events(
        self,
        start_date: str,
        end_date: str
    ) -> dict:

        events = await self.donki_client.fetch_cme_events(
            start_date=start_date,
            end_date=end_date
        )

        processed_events = []

        for event in events:
            analyses = event.get("cmeAnalyses") or []

            best_analysis = next(
                (
                    item for item in analyses
                    if item.get("isMostAccurate") is True
                ),
                analyses[0] if analyses else {}
            )

            processed_events.append({
                "event_id": event.get("activityID"),
                "event_type": "CME",
                "start_time": event.get("startTime"),
                "source_location": event.get("sourceLocation"),
                "note": event.get("note"),
                "speed_km_s": best_analysis.get("speed"),
                "type": best_analysis.get("type"),
                "half_angle": best_analysis.get("halfAngle"),
                "instruments": event.get("instruments", []),
                "source_url": event.get("link")
            })

        return {
            "source": "NASA CCMC DONKI",
            "event_type": "Coronal Mass Ejection",
            "count": len(processed_events),
            "events": processed_events,
            "scientific_notice": (
                "CME event information is space-weather context. "
                "It is not a measurement of an individual astronaut's "
                "radiation exposure or dose."
            )
        }
