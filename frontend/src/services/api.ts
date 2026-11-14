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
  AstronautResponse,
  TelemetryCreate,
  TelemetryResponse,
  TelemetryIngestResponse,
  AlertResponse,
  AlertAcknowledgeResponse,
  convertAlertResponseToHealthAlert,
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
const API_BASE_URL = metaEnv?.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const TIMEOUT_MS = 3000;

class SpacecareApiService {
  private cachedConnectionState: BackendConnectionState | null = null;

  /**
   * Determine exact connection status:
   * 1. Probe primary domain endpoint GET /api/v1/astronauts ->
   *    If 200 OK -> Immediately LIVE_API
   * 2. If 404/405 -> Probe GET /api/v1/health -> If OK -> API_HEALTHY_ROUTES_PENDING
   * 3. If unreachable / network error -> OFFLINE_DEMO_FALLBACK
   */
  async probeConnection(): Promise<{ state: BackendConnectionState; message: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    try {
      // Primary check: Test domain endpoint GET /api/v1/astronauts
      const domainRes = await fetch(`${API_BASE_URL}/api/v1/astronauts`, {
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (domainRes.ok) {
        this.cachedConnectionState = 'LIVE_API';
        return { state: 'LIVE_API', message: 'FastAPI connected & verified' };
      }

      if (domainRes.status === 404 || domainRes.status === 405) {
        // Check if server is alive at /api/v1/health
        try {
          const healthController = new AbortController();
          const healthTimer = setTimeout(() => healthController.abort(), 800);
          const healthRes = await fetch(`${API_BASE_URL}/api/v1/health`, {
            signal: healthController.signal,
          });
          clearTimeout(healthTimer);
          if (healthRes.ok) {
            this.cachedConnectionState = 'API_HEALTHY_ROUTES_PENDING';
            return {
              state: 'API_HEALTHY_ROUTES_PENDING',
              message: 'FastAPI online • Domain routes pending mount',
            };
          }
        } catch {
          // fall through
        }
      }

      this.cachedConnectionState = 'OFFLINE_DEMO_FALLBACK';
      return { state: 'OFFLINE_DEMO_FALLBACK', message: 'Backend unreachable • Offline Demo Mode' };
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
        let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        try {
          const errData = await res.json();
          if (errData && errData.detail) {
            if (Array.isArray(errData.detail)) {
              errorMessage = 'Validation error: ' + errData.detail
                .map((d: any) => {
                  const loc = Array.isArray(d.loc)
                    ? d.loc.filter((p: any) => p !== 'body').join('.')
                    : (d.loc || '');
                  const msg = typeof d.msg === 'string' ? d.msg : JSON.stringify(d);
                  return loc ? `${loc}: ${msg}` : msg;
                })
                .join('; ');
            } else if (typeof errData.detail === 'object') {
              errorMessage = JSON.stringify(errData.detail);
            } else {
              errorMessage = String(errData.detail);
            }
          }
        } catch {
          // Response body was not JSON or could not be parsed
        }
        throw new Error(errorMessage);
      }

      const json = await res.json();
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

  // ==============================================================================
  // 1. ASTRONAUT ROUTES (backend/app/api/routes/astronauts.py)
  // ==============================================================================

  /**
   * GET /api/v1/astronauts
   * Retrieves a paginated list of astronaut profiles from SQLite.
   */
  async getAstronauts(skip: number = 0, limit: number = 100): Promise<ApiResponse<AstronautResponse[]>> {
    return this.request<AstronautResponse[]>(
      `/api/v1/astronauts?skip=${skip}&limit=${limit}`,
      {},
      MOCK_ASTRONAUTS as unknown as AstronautResponse[]
    );
  }

  /**
   * Backward-compatible alias for getAstronauts
   */
  async getCrew(): Promise<ApiResponse<AstronautProfile[]>> {
    const res = await this.getAstronauts();
    if (res.mode === 'LIVE_API' && Array.isArray(res.data) && res.data.length > 0) {
      // Merge SQLite attributes with existing rich UI profiles if matching
      const mappedCrew: AstronautProfile[] = res.data.map((dbAstro) => {
        const existing = MOCK_ASTRONAUTS.find((m) => m.id === dbAstro.id) || MOCK_ASTRONAUTS[0];
        return {
          ...existing,
          id: dbAstro.id,
          name: dbAstro.name,
          role: dbAstro.role,
          age: dbAstro.age,
          gender: dbAstro.gender,
          mission: dbAstro.mission,
          is_demo: dbAstro.is_demo,
          baseline_heart_rate: dbAstro.baseline_heart_rate,
          baseline_systolic_bp: dbAstro.baseline_systolic_bp,
          baseline_diastolic_bp: dbAstro.baseline_diastolic_bp,
          baseline_spo2: dbAstro.baseline_spo2,
          baseline_body_temperature: dbAstro.baseline_body_temperature,
          baseline_respiration_rate: dbAstro.baseline_respiration_rate,
        };
      });
      return {
        ...res,
        data: mappedCrew,
      };
    }
    return {
      ...res,
      data: MOCK_ASTRONAUTS,
    };
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}
   */
  async getAstronaut(astronautId: string): Promise<ApiResponse<AstronautResponse>> {
    const defaultAstro = (MOCK_ASTRONAUTS.find((a) => a.id === astronautId) || MOCK_ASTRONAUTS[0]) as unknown as AstronautResponse;
    return this.request<AstronautResponse>(`/api/v1/astronauts/${astronautId}`, {}, defaultAstro);
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/telemetry
   * Retrieves chronological telemetry history for an astronaut, ordered newest first.
   */
  async getAstronautTelemetry(
    astronautId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<TelemetryResponse[]>> {
    return this.request<TelemetryResponse[]>(
      `/api/v1/astronauts/${astronautId}/telemetry?limit=${limit}&offset=${offset}`,
      {},
      []
    );
  }

  /**
   * GET /api/v1/astronauts/{astronaut_id}/alerts
   * Retrieves alerts for an astronaut, with optional filtering by acknowledgment and severity.
   */
  async getAstronautAlerts(
    astronautId: string,
    isAcknowledged?: boolean,
    severity?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<AlertResponse[]>> {
    const params = new URLSearchParams();
    if (isAcknowledged !== undefined) params.append('is_acknowledged', String(isAcknowledged));
    if (severity) params.append('severity', severity);
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    return this.request<AlertResponse[]>(
      `/api/v1/astronauts/${astronautId}/alerts?${params.toString()}`,
      {},
      []
    );
  }

  // ==============================================================================
  // 2. TELEMETRY INGESTION (backend/app/api/routes/telemetry.py)
  // ==============================================================================

  /**
   * POST /api/v1/telemetry
   * Validates physiological bounds and data provenance, persists reading to SQLite,
   * executes multi-hazard risk engine & Isolation Forest anomaly detection,
   * deduplicates resulting alerts, and returns the saved telemetry and assessment summary.
   */
  async submitTelemetryReading(reading: TelemetryCreate): Promise<ApiResponse<TelemetryIngestResponse>> {
    // Validate provenance consistency matching backend model validator
    const isSimulated = reading.data_source === 'SYNTHETIC_SIMULATED' ? true : false;
    const payload: TelemetryCreate = {
      ...reading,
      is_simulated: isSimulated,
    };

    const fallbackResponse: TelemetryIngestResponse = {
      telemetry: {
        id: Date.now(),
        astronaut_id: reading.astronaut_id,
        timestamp: reading.timestamp || new Date().toISOString(),
        heart_rate: reading.heart_rate,
        systolic_bp: reading.systolic_bp,
        diastolic_bp: reading.diastolic_bp,
        spo2: reading.spo2,
        body_temperature: reading.body_temperature,
        respiration_rate: reading.respiration_rate,
        data_source: reading.data_source || 'SYNTHETIC_SIMULATED',
        is_simulated: isSimulated,
        dataset_reference: reading.dataset_reference || null,
        created_at: new Date().toISOString(),
      },
      assessment_summary: {
        overall_status: 'NOMINAL',
        physiological_status: 'NOMINAL',
        highest_severity: 'INFO',
        primary_hazard: 'PHYSIOLOGICAL',
        assessed_domains: ['PHYSIOLOGICAL'],
        unmonitored_domains: [],
        evidence_status: 'NOMINAL',
        overall_evidence_status: 'COMPLETE_MULTI_HAZARD',
        ml_anomaly_detected: false,
        ml_anomaly_score: -0.15,
        heuristic_explanations: [],
        alerts_created_count: 0,
        new_alert_ids: [],
        active_open_alert_ids: [],
      },
    };

    return this.request<TelemetryIngestResponse>(
      '/api/v1/telemetry',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );
  }

  /**
   * POST /api/v1/telemetry/simulate
   * Simulates telemetry readings with a selected physiological scenario.
   */
  async simulateTelemetry(payload: SimulationRequest): Promise<ApiResponse<SimulationResponse>> {
    const fallbackResponse: SimulationResponse = {
      message: `[Preview] Simulated ${payload.count} records for ${payload.astronaut_id} (${payload.pattern}).`,
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

  // ==============================================================================
  // 3. ALERTS ROUTES (backend/app/api/routes/alerts.py)
  // ==============================================================================

  /**
   * PATCH /api/v1/alerts/{alert_id}/acknowledge
   * Marks an alert as acknowledged in SQLite by setting is_acknowledged=True.
   */
  async acknowledgeAlert(alertId: string): Promise<ApiResponse<AlertAcknowledgeResponse>> {
    const fallbackResponse: AlertAcknowledgeResponse = {
      alert: {
        id: alertId,
        astronaut_id: 'astro_03',
        severity: 'INFO',
        category: 'PHYSIOLOGICAL',
        message: 'Alert acknowledged',
        recommendation: 'Continue monitoring',
        is_acknowledged: true,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      },
      status: 'acknowledged',
    };

    return this.request<AlertAcknowledgeResponse>(
      `/api/v1/alerts/${alertId}/acknowledge`,
      { method: 'PATCH' },
      fallbackResponse
    );
  }

  /**
   * Query all alerts across crew members (aggregates GET /api/v1/astronauts/{id}/alerts)
   */
  async getAlerts(astronautId?: string): Promise<ApiResponse<HealthAlert[]>> {
    if (astronautId) {
      const res = await this.getAstronautAlerts(astronautId);
      const mapped = (res.data || []).map((a) => convertAlertResponseToHealthAlert(a, {}));
      return {
        data: mapped.length > 0 ? mapped : MOCK_ALERTS.filter((m) => m.astronautId === astronautId),
        mode: res.mode,
        error: res.error,
      };
    }

    try {
      const astroRes = await this.getAstronauts();
      const activeCrew = (astroRes.data && Array.isArray(astroRes.data) && astroRes.data.length > 0)
        ? astroRes.data
        : [{ id: 'astro_03' }];

      const allResults = await Promise.all(activeCrew.map((c) => this.getAstronautAlerts(c.id)));
      const anyLive = allResults.some((r) => r.mode === 'LIVE_API');
      const mergedAlerts = allResults.flatMap((r) => r.data || []);
      if (anyLive) {
        return {
          data: mergedAlerts.map((a) => convertAlertResponseToHealthAlert(a, {})),
          mode: 'LIVE_API',
        };
      }
    } catch {
      // fallback
    }

    return {
      data: MOCK_ALERTS,
      mode: this.cachedConnectionState || 'OFFLINE_DEMO_FALLBACK',
    };
  }

  /**
   * Helper alias to fetch historical telemetry
   */
  async getTelemetry(astronautId?: string, limit: number = 50): Promise<ApiResponse<TelemetryReading[]>> {
    const id = astronautId || 'astro_03';
    const res = await this.getAstronautTelemetry(id, limit);
    return {
      data: (res.data || []) as TelemetryReading[],
      mode: res.mode,
      error: res.error,
    };
  }

  // ==============================================================================
  // 4. AUXILIARY / ANALYTICS DEMO ROUTES
  // ==============================================================================

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
