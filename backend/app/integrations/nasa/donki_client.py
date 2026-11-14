
import os
import httpx


class DONKIClient:
    """Client for NASA CCMC DONKI API."""

    def __init__(self):
        self.base_url = os.getenv(
            "NASA_DONKI_BASE_URL",
            "https://ccmc.gsfc.nasa.gov/DONKI-API/get"
        ).rstrip("/")

        self.timeout = 30.0

    async def fetch_cme_events(
        self,
        start_date: str,
        end_date: str
    ) -> list[dict]:
        """Fetch Coronal Mass Ejection events from NASA DONKI."""

        url = f"{self.base_url}/CME"

        params = {
            "startDate": start_date,
            "endDate": end_date
        }

        async with httpx.AsyncClient(
            timeout=self.timeout
        ) as client:

            response = await client.get(
                url,
                params=params
            )

            response.raise_for_status()

            data = response.json()

        if not isinstance(data, list):
            raise ValueError(
                "Unexpected response format from NASA DONKI API"
            )

        return data
