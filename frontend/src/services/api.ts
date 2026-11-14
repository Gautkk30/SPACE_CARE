/**
 * SPACECARE - Decoupled REST API Client with Seamless Simulated Fallback
 * NASA Space Apps Challenge 2026
 * 
 * This service implements the frontend integration layer aligned with the planned
 * FastAPI endpoints (/api/v1/*). It probes the live FastAPI backend server;
 * if the backend is offline or times out, it gracefully falls back to the
 * high-fidelity SIMULATED TELEMETRY dataset with a clear connection status indicator.
 */

import {
  AstronautProfile,
  HealthAlert,
  MissionSummary,
  RadiationEnvironmentData,
  AIAnalysisResult,
  MissionHealthReport,
} from '../types/spacecare';

import {
  MOCK_ASTRONAUTS,
  MOCK_ALERTS,
  MOCK_MISSION_SUMMARY,
  MOCK_RADIATION_DATA,
  generateHealthReport,
} from './mockTelemetry';

export type ConnectionMode = 'LIVE_BACKEND' | 'SIMULATED_FALLBACK';

export interface ApiResponse<T> {
  data: T;
  mode: ConnectionMode;
  error?: string;
}

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
const API_BASE_URL = metaEnv?.VITE_API_BASE_URL || 'http://localhost:8000';

const TIMEOUT_MS = 1200;

async function fetchWithFallback<T>(
  endpoint: string,
  fallbackData: T
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' },
    });
    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data: T = await res.json();
    return { data, mode: 'LIVE_BACKEND' };
  } catch (err: unknown) {
    clearTimeout(timer);
    return {
      data: fallbackData,
      mode: 'SIMULATED_FALLBACK',
      error: err instanceof Error ? err.message : 'Backend unreachable',
    };
  }
}

export const spacecareApi = {
  /**
   * Health ping to check if FastAPI backend is online
   */
  async checkBackendHealth(): Promise<{ online: boolean; message: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 800);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/health`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        return { online: true, message: 'Backend connected' };
      }
      return { online: false, message: 'Backend returned error' };
    } catch {
      clearTimeout(timer);
      return { online: false, message: 'Backend offline (Standby mode)' };
    }
  },

  /**
   * GET /api/v1/crew - List all astronauts
   */
  async getCrew(): Promise<ApiResponse<AstronautProfile[]>> {
    return fetchWithFallback<AstronautProfile[]>('/api/v1/crew', MOCK_ASTRONAUTS);
  },

  /**
   * GET /api/v1/crew/{id} - Individual astronaut profile
   */
  async getAstronaut(id: string): Promise<ApiResponse<AstronautProfile>> {
    const defaultAstro = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    return fetchWithFallback<AstronautProfile>(`/api/v1/crew/${id}`, defaultAstro);
  },

  /**
   * GET /api/v1/radiation - Cabin dosimeter & space weather feeds
   */
  async getRadiation(): Promise<ApiResponse<RadiationEnvironmentData>> {
    return fetchWithFallback<RadiationEnvironmentData>('/api/v1/radiation', MOCK_RADIATION_DATA);
  },

  /**
   * GET /api/v1/alerts - Active early warning queue
   */
  async getAlerts(): Promise<ApiResponse<HealthAlert[]>> {
    return fetchWithFallback<HealthAlert[]>('/api/v1/alerts', MOCK_ALERTS);
  },

  /**
   * GET /api/v1/mission/summary - Mission overview metrics
   */
  async getMissionSummary(): Promise<ApiResponse<MissionSummary>> {
    return fetchWithFallback<MissionSummary>('/api/v1/mission/summary', MOCK_MISSION_SUMMARY);
  },

  /**
   * GET /api/v1/analysis/{id} - AI/ML anomaly detection results
   */
  async getAIAnalysis(id: string): Promise<ApiResponse<AIAnalysisResult>> {
    const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    return fetchWithFallback<AIAnalysisResult>(`/api/v1/analysis/${id}`, astronaut.aiAnalysis);
  },

  /**
   * GET /api/v1/reports/{id} - Medical health report
   */
  async getHealthReport(
    id: string,
    timeframe: '7_DAY_WEEKLY' | 'MISSION_TO_DATE'
  ): Promise<ApiResponse<MissionHealthReport>> {
    const astronaut = MOCK_ASTRONAUTS.find((a) => a.id === id) || MOCK_ASTRONAUTS[0];
    const fallbackReport = generateHealthReport(astronaut, timeframe);
    return fetchWithFallback<MissionHealthReport>(
      `/api/v1/reports/${id}?timeframe=${timeframe}`,
      fallbackReport
    );
  },
};
