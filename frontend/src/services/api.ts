/**
 * SPACECARE - Decoupled REST API Client with Backend Alignment & Honest Fallback
 * NASA Space Apps Challenge 2026
 * 
 * Connection States:
 * - "LIVE_API": FastAPI domain endpoints returned 200 OK (even if telemetry/alerts arrays are empty []).
 * - "API_HEALTHY_ROUTES_PENDING": GET /api/v1/health succeeded, but domain routes returned 404.
 * - "OFFLINE_DEMO_FALLBACK": Backend server is unreachable.
 * 
 * Notice: When LIVE_API is active and returns [], preserve the empty state rather than injecting fake rows.
 */

import {
  AstronautProfile,
  HealthAlert,
  MissionSummary,
  RadiationEnvironmentData,
  AIAnalysisResult,
  MissionHealthReport,
  TelemetryReading,
  SimulatedPattern,
} from '../types/spacecare';

import {
  MOCK_ASTRONAUTS,
  MOCK_ALERTS,
  MOCK_MISSION_SUMMARY,
  MOCK_RADIATION_DATA,
  generateHealthReport,
} from './mockTelemetry';

export type BackendConnectionState = 
  | 'LIVE_API' 
  | 'API_HEALTHY_ROUTES_PENDING' 
  | 'OFFLINE_DEMO_FALLBACK';

// Backwards compatibility alias for components expecting ConnectionMode
export type ConnectionMode = BackendConnectionState;

export interface ApiResponse<T> {
  data: T;
  mode: BackendConnectionState;
  error?: string;
  isPendingRoute?: boolean;
}

export interface SimulationRequest {
  astronaut_id: string;
  pattern: SimulatedPattern;
  count: number;
  interval_seconds?: number;
}

export interface SimulationResponse {
  message: string;
  records_generated: number;
  astronaut_id: string;
  pattern: string;
  preview?: TelemetryReading[];
}

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
const API_BASE_URL = metaEnv?.VITE_API_BASE_URL || 'http://localhost:8000';

const TIMEOUT_MS = 1500;

class SpacecareApiService {
  private cachedConnectionState: BackendConnectionState | null = null;

  /**
   * Determine exact connection status:
   * 1. GET /api/v1/health -> If fail/unreachable -> OFFLINE_DEMO_FALLBACK
   * 2. Probe domain endpoint (e.g. GET /api/v1/astronauts) ->
   *    If 200 -> LIVE_API
   *    If 404 / 405 -> API_HEALTHY_ROUTES_PENDING
   */
  async probeConnection(): Promise<{ state: BackendConnectionState; message: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);

    try {
      const healthRes = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!healthRes.ok) {
        this.cachedConnectionState = 'OFFLINE_DEMO_FALLBACK';
        return { state: 'OFFLINE_DEMO_FALLBACK', message: 'Backend health error' };
      }

      // Health endpoint is OK! Now check domain route availability
      const domainController = new AbortController();
      const domainTimer = setTimeout(() => domainController.abort(), 1000);
      try {
        const domainRes = await fetch(`${API_BASE_URL}/api/v1/astronauts`, {
          signal: domainController.signal,
        });
        clearTimeout(domainTimer);

        if (domainRes.status === 404 || domainRes.status === 405) {
          this.cachedConnectionState = 'API_HEALTHY_ROUTES_PENDING';
          return {
            state: 'API_HEALTHY_ROUTES_PENDING',
            message: 'FastAPI online • Domain routes pending mount',
          };
        }

        if (domainRes.ok) {
          this.cachedConnectionState = 'LIVE_API';
          return { state: 'LIVE_API', message: 'FastAPI connected & verified' };
        }

        this.cachedConnectionState = 'API_HEALTHY_ROUTES_PENDING';
        return { state: 'API_HEALTHY_ROUTES_PENDING', message: 'Domain route returned ' + domainRes.status };
      } catch {
        clearTimeout(domainTimer);
        this.cachedConnectionState = 'API_HEALTHY_ROUTES_PENDING';
        return {
          state: 'API_HEALTHY_ROUTES_PENDING',
          message: 'FastAPI online • Domain routes pending mount',
        };
      }
    } catch {
      clearTimeout(timer);
      this.cachedConnectionState = 'OFFLINE_DEMO_FALLBACK';
      return { state: 'OFFLINE_DEMO_FALLBACK', message: 'Backend unreachable • Offline Demo Mode' };
    }
  }

  /**
   * Health check shortcut for layout polling
   */
  async checkBackendHealth(): Promise<{ online: boolean; state: BackendConnectionState; message: string }> {
    const probe = await this.probeConnection();
    return {
      online: probe.state !== 'OFFLINE_DEMO_FALLBACK',
      state: probe.state,
      message: probe.message,
    };
  }

  /**
   * Universal fetch with 3-state connection resolution
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData: T
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        },
      });
      clearTimeout(timer);

      if (res.status === 404 || res.status === 405) {
        return {
          data: fallbackData,
          mode: 'API_HEALTHY_ROUTES_PENDING',
          isPendingRoute: true,
          error: `HTTP ${res.status}: Route ${endpoint} pending backend implementation`,
        };
      }

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.json();
      // When LIVE_API is active, we return json directly (even if [] or empty object!)
      return {
        data: json as T,
        mode: 'LIVE_API',
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isHealthAvailable = this.cachedConnectionState === 'API_HEALTHY_ROUTES_PENDING';
      const mode: BackendConnectionState = isHealthAvailable 
        ? 'API_HEALTHY_ROUTES_PENDING' 
        : 'OFFLINE_DEMO_FALLBACK';

      return {
        data: fallbackData,
        mode,
        isPendingRoute: mode === 'API_HEALTHY_ROUTES_PENDING',
        error: err instanceof Error ? err.message : 'Backend unreachable',
      };
    }
  }

  /**
   * GET /api/v1/astronauts (also falls back to /api/v1/crew if alias exists)
   */
  async getAstronauts(): Promise<ApiResponse<AstronautProfile[]>> {
    return this.request<AstronautProfile[]>('/api/v1/astronauts', {}, MOCK_ASTRONAUTS);
  }

  /**
   * Alias for backwards compatibility
   */
  async getCrew(): Promise<ApiResponse<AstronautProfile[]>> {
    return this.getAstronauts();
  }

  /**
   * GET /api/v1/astronauts/{id}
   */
  async getAstronaut(id: string): Promise<ApiResponse<AstronautProfile>> {
    const defaultAstro = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    return this.request<AstronautProfile>(`/api/v1/astronauts/${id}`, {}, defaultAstro);
  }

  /**
   * GET /api/v1/telemetry?astronaut_id={id}&limit={limit}
   */
  async getTelemetry(astronautId?: string, limit: number = 100): Promise<ApiResponse<TelemetryReading[]>> {
    const query = astronautId ? `?astronaut_id=${encodeURIComponent(astronautId)}&limit=${limit}` : `?limit=${limit}`;
    return this.request<TelemetryReading[]>(`/api/v1/telemetry${query}`, {}, []);
  }

  /**
   * POST /api/v1/telemetry/simulate
   * Simulates telemetry readings with a selected physiological scenario.
   */
  async simulateTelemetry(payload: SimulationRequest): Promise<ApiResponse<SimulationResponse>> {
    const fallbackResponse: SimulationResponse = {
      message: `[Preview] Simulated ${payload.count} records for ${payload.astronaut_id} (${payload.pattern}). Backend route /api/v1/telemetry/simulate pending.`,
      records_generated: payload.count,
      astronaut_id: payload.astronaut_id,
      pattern: payload.pattern,
    };

    return this.request<SimulationResponse>(
      '/api/v1/telemetry/simulate',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );
  }

  /**
   * GET /api/v1/alerts
   */
  async getAlerts(astronautId?: string): Promise<ApiResponse<HealthAlert[]>> {
    const query = astronautId ? `?astronaut_id=${encodeURIComponent(astronautId)}` : '';
    return this.request<HealthAlert[]>(`/api/v1/alerts${query}`, {}, MOCK_ALERTS);
  }

  /**
   * PATCH /api/v1/alerts/{id}/acknowledge
   */
  async acknowledgeAlert(alertId: string): Promise<ApiResponse<{ acknowledged: boolean; alert_id: string }>> {
    const fallbackResponse = { acknowledged: true, alert_id: alertId };
    return this.request<{ acknowledged: boolean; alert_id: string }>(
      `/api/v1/alerts/${alertId}/acknowledge`,
      { method: 'PATCH' },
      fallbackResponse
    );
  }

  /**
   * GET /api/v1/radiation
   */
  async getRadiation(): Promise<ApiResponse<RadiationEnvironmentData>> {
    return this.request<RadiationEnvironmentData>('/api/v1/radiation', {}, MOCK_RADIATION_DATA);
  }

  /**
   * GET /api/v1/mission/summary
   */
  async getMissionSummary(): Promise<ApiResponse<MissionSummary>> {
    return this.request<MissionSummary>('/api/v1/mission/summary', {}, MOCK_MISSION_SUMMARY);
  }

  /**
   * GET /api/v1/analysis/{id}
   */
  async getAIAnalysis(id: string): Promise<ApiResponse<AIAnalysisResult>> {
    const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    return this.request<AIAnalysisResult>(`/api/v1/analysis/${id}`, {}, astronaut.aiAnalysis);
  }

  /**
   * GET /api/v1/reports/{id}
   */
  async getHealthReport(
    id: string,
    timeframe: '7_DAY_WEEKLY' | 'MISSION_TO_DATE'
  ): Promise<ApiResponse<MissionHealthReport>> {
    const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    const fallbackReport = generateHealthReport(astronaut, timeframe);
    return this.request<MissionHealthReport>(
      `/api/v1/reports/${id}?timeframe=${timeframe}`,
      {},
      fallbackReport
    );
  }
}

export const spacecareApi = new SpacecareApiService();
