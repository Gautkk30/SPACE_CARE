/**
 * OSD-946 Research Data API Client Service
 * ========================================
 * Communicates with the FastAPI backend endpoints under /api/v1/research.
 */

import {
  OSD946GroupListResponse,
  OSD946OverviewResponse,
  OSD946SampleListResponse,
  OSD946SampleQC,
} from '../types/research';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

class ResearchServiceError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'ResearchServiceError';
    this.statusCode = statusCode;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string'
            ? errorData.detail
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Fallback to HTTP status text if body is not JSON
      }
      throw new ResearchServiceError(errorMessage, response.status);
    }

    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ResearchServiceError) {
      throw error;
    }
    // Network / connection error
    throw new ResearchServiceError(
      `Unable to connect to the SPACECARE backend API at ${url}. Ensure the FastAPI server is running.`,
      0
    );
  }
}

export const researchService = {
  /**
   * Fetch full study metadata, dataset-wide statistics, and cohort PRE/POST summaries.
   */
  async getOverview(): Promise<OSD946OverviewResponse> {
    return request<OSD946OverviewResponse>('/research/osd946/overview');
  },

  /**
   * Fetch individual sample records with optional cohort, timepoint, or GSM filters.
   */
  async getSamples(params?: {
    group?: string;
    time?: string;
    gsm?: string;
  }): Promise<OSD946SampleListResponse> {
    const searchParams = new URLSearchParams();
    if (params?.group && params.group !== 'ALL') {
      searchParams.append('group', params.group);
    }
    if (params?.time && params.time !== 'ALL') {
      searchParams.append('time', params.time);
    }
    if (params?.gsm) {
      searchParams.append('gsm', params.gsm);
    }

    const query = searchParams.toString();
    const endpoint = `/research/osd946/samples${query ? `?${query}` : ''}`;
    return request<OSD946SampleListResponse>(endpoint);
  },

  /**
   * Fetch cohort-level PRE/POST quality control summaries (CON, EX, FLY).
   */
  async getGroups(): Promise<OSD946GroupListResponse> {
    return request<OSD946GroupListResponse>('/research/osd946/groups');
  },

  /**
   * Fetch detailed metrics for an individual sample by filename or GSM accession.
   */
  async getSampleById(sampleId: string): Promise<OSD946SampleQC> {
    return request<OSD946SampleQC>(`/research/osd946/samples/${encodeURIComponent(sampleId)}`);
  },
};
