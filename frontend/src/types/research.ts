/**
 * NASA OSD-946 / GLDS-773 Quality Control Data Types
 * ===================================================
 * Strongly typed TypeScript interfaces mirroring the FastAPI backend schemas.
 *
 * Scientific Integrity Notice:
 * OSD-946 is an open-access ground-based 70-day head-down tilt bed-rest analogue study.
 * Detection percentages represent technical Agilent microarray hybridization QC calls
 * (gIsGeneDetected == 1), NOT live astronaut biometrics or clinical health measurements.
 */

export interface OSD946SampleQC {
  sample_id: string;
  gsm_accession: string;
  subject_id: number | null;
  group: 'CON' | 'EX' | 'FLY' | string;
  time: 'PRE' | 'POST' | string;
  total_probes: number;
  detected_probes: number;
  detection_percent: number;
}

export interface OSD946GroupSummary {
  group: 'CON' | 'EX' | 'FLY' | string;
  time: 'PRE' | 'POST' | string;
  samples: number;
  average_detection: number;
  minimum: number;
  maximum: number;
}

export interface OSD946Metadata {
  accession: string;
  genelab_id: string;
  geo_accession: string;
  doi: string;
  title: string;
  study_type: string;
  organism: string;
  tissue: string;
  technology: string;
  participants: number;
  total_samples: number;
  probes_per_sample: number;
  dataset_url: string;
}

export interface OSD946Statistics {
  total_samples: number;
  total_human_probes_per_sample: number;
  mean_detection_percent: number;
  min_detection_percent: number;
  max_detection_percent: number;
  total_detected_probes: number;
  cohorts_count: number;
}

export interface OSD946ScientificNotice {
  data_classification: string;
  telemetry_boundary: string;
  qc_interpretation: string;
  validation_status: string;
}

export interface OSD946OverviewResponse {
  metadata: OSD946Metadata;
  scientific_notice: OSD946ScientificNotice;
  statistics: OSD946Statistics;
  group_summaries: OSD946GroupSummary[];
}

export interface OSD946SampleListResponse {
  total_count: number;
  scientific_notice: OSD946ScientificNotice;
  samples: OSD946SampleQC[];
}

export interface OSD946GroupListResponse {
  total_groups: number;
  scientific_notice: OSD946ScientificNotice;
  groups: OSD946GroupSummary[];
}

export interface SampleFilterOptions {
  group?: string;
  time?: string;
  searchQuery?: string;
}
