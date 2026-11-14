
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1'
).replace(/\/$/, '');

export interface CmeEvent {
  event_id: string | null;
  event_type: string;
  start_time: string | null;
  source_location: string | null;
  note: string | null;
  speed_km_s: number | null;
  type: string | null;
  half_angle: number | null;
  instruments: Array<{
    displayName?: string;
    [key: string]: unknown;
  }>;
  source_url: string | null;
}

export interface CmeEventsResponse {
  source: string;
  event_type: string;
  count: number;
  events: CmeEvent[];
  scientific_notice: string;
}

class RadiationServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'RadiationServiceError';
  }
}

export const radiationService = {
  async getCmeEvents(
    startDate: string,
    endDate: string
  ): Promise<CmeEventsResponse> {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });

    const url = `${API_BASE_URL}/radiation/cme?${params.toString()}`;

    try {
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        let message = `HTTP Error ${response.status}`;

        try {
          const data = await response.json();
          if (data.detail) {
            message = data.detail;
          }
        } catch {
          // Keep the default error message.
        }

        throw new RadiationServiceError(message, response.status);
      }

      return (await response.json()) as CmeEventsResponse;
    } catch (error) {
      if (error instanceof RadiationServiceError) {
        throw error;
      }

      throw new RadiationServiceError(
        'Unable to connect to the SPACECARE radiation API. Check whether the backend is running.',
        0
      );
    }
  },
};
