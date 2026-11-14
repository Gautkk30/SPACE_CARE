/**
 * SPACECARE - TypeScript Type Definitions
 * Intelligent Astronaut Health Monitoring & Early Warning System
 * NASA Space Apps Challenge 2026
 */

export type HealthStatus = 'NOMINAL' | 'CAUTION' | 'ALERT';
export type AlertSeverity = 'INFO' | 'CAUTION' | 'CRITICAL';
export type HealthCategory = 
  | 'CARDIOVASCULAR' 
  | 'RADIATION' 
  | 'MUSCULOSKELETAL' 
  | 'SLEEP_PSYCH' 
  | 'ENVIRONMENTAL';

export interface AstronautBaseline {
  restingHeartRate: number; // bpm
  maxHeartRateNominal: number; // bpm
  minHeartRateNominal: number; // bpm
  restingSystolicBP: number; // mmHg
  restingDiastolicBP: number; // mmHg
  baselineSpO2: number; // %
  minSpO2Nominal: number; // %
  baselineCoreTemp: number; // °C
  respiratoryRateRange: [number, number]; // breaths/min [min, max]
}

export interface VitalSignsSnapshot {
  astronautId: string;
  timestamp: string; // ISO 8601
  heartRate: number; // bpm
  heartRateVariability: number; // RMSSD (ms)
  systolicBP: number; // mmHg
  diastolicBP: number; // mmHg
  spo2: number; // %
  coreTemp: number; // °C
  respiratoryRate: number; // breaths/min
  status: HealthStatus;
  dataSource: 'SIMULATED TELEMETRY';
}

export interface VitalTrendPoint {
  timestamp: string;
  timeLabel: string; // e.g. "04:00"
  heartRate: number;
  spo2: number;
  coreTemp: number;
  respiratoryRate: number;
  hrBaselineMin: number;
  hrBaselineMax: number;
  spo2BaselineMin: number;
}

export interface AstronautProfile {
  id: string;
  name: string;
  callsign: string;
  role: string;
  age: number;
  missionDay: number;
  evaHours: number;
  status: HealthStatus;
  avatarInitials: string;
  baseline: AstronautBaseline;
  currentVitals: VitalSignsSnapshot;
  trend24h: VitalTrendPoint[];
}

export interface HealthAlert {
  id: string;
  astronautId: string;
  astronautName: string;
  category: HealthCategory;
  severity: AlertSeverity;
  title: string;
  physiologicalExplanation: string;
  countermeasure: string;
  evidenceReference: string; // e.g., "NASA HRP Cardiovascular Risk Standard / OSDR Study GL-0041"
  timestamp: string;
  acknowledged: boolean;
}

export interface MissionSummary {
  missionName: string;
  missionElapsedDays: number;
  totalCrewCount: number;
  nominalCrewCount: number;
  cautionCrewCount: number;
  alertCrewCount: number;
  spaceWeatherCondition: string; // e.g. "G1 Minor Storm / Normal Solar Flux"
  radiationExposureRate: string; // e.g. "18.4 μGy/hr"
  telemetrySyncTime: string;
  dataSource: 'SIMULATED TELEMETRY';
}

export type TabId = 
  | 'overview'
  | 'crew'
  | 'vitals'
  | 'cardiovascular'
  | 'bone-muscle'
  | 'radiation'
  | 'mental-health'
  | 'ai-analysis'
  | 'alerts'
  | 'reports';

export interface NavigationTab {
  id: TabId;
  label: string;
  badge?: number;
  status?: 'ACTIVE' | 'PLANNED';
}
