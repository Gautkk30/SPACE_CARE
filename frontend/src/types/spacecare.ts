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

export type TimeWindow = '6H' | '24H' | '7D';

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
  baselineHrvRmssd: number; // ms
}

export interface PreFlightDeltas {
  hrDelta: number; // bpm change from pre-flight launch baseline
  bpSystolicDelta: number; // mmHg
  bpDiastolicDelta: number; // mmHg
  weightDeltaKg: number; // kg
  estimatedBoneLossPct: number; // % estimated lumbar spine / femur loss
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
  timeLabel: string; // e.g. "04:00" or "Day 80"
  heartRate: number;
  hrvRmssd: number;
  systolicBP: number;
  diastolicBP: number;
  spo2: number;
  coreTemp: number;
  respiratoryRate: number;
  hrBaselineMin: number;
  hrBaselineMax: number;
  spo2BaselineMin: number;
}

export interface CardiovascularLongitudinalPoint {
  day: number;
  dateLabel: string;
  restingHr: number;
  baselineHr: number;
  map: number; // Mean Arterial Pressure mmHg
  baselineMap: number;
  orthostaticScore: number; // 0-100 scale
  hrvRmssd: number;
}

export interface CardiovascularMetrics {
  restingHrDrift: number; // bpm change from launch
  meanArterialPressure: number; // mmHg
  strokeVolumeIndex: number; // mL/m²
  orthostaticToleranceScore: number; // 0-100
  baroreflexSensitivity: number; // ms/mmHg
  fluidShiftSeverity: 'Nominal' | 'Mild Cephalad Shift' | 'Moderate Redistribution';
  history: CardiovascularLongitudinalPoint[];
  referenceStandards: {
    mapMin: number;
    mapMax: number;
    orthostaticAlertThreshold: number;
    baroreflexNominalMin: number;
    citation: string;
  };
}

/* ==============================================================================
 * Phase 3 Batch 2: Musculoskeletal, Radiation, & Mental Health Interfaces
 * ============================================================================== */

export interface MusculoskeletalLongitudinalPoint {
  week: number;
  label: string; // e.g. "Wk 0", "Wk 4", "Wk 8", "Wk 12"
  actualBmdLossPct: number; // with ARED countermeasures
  unmitigatedReferenceLossPct: number; // NASA HRP microgravity unmitigated reference (~1.0-1.5%/month)
  leanMuscleLossPct: number;
  aredCompliancePct: number;
}

export interface MusculoskeletalMetrics {
  femoralNeckBmdDeltaPct: number; // % change from pre-flight DEXA
  lumbarSpineBmdDeltaPct: number; // % change from pre-flight DEXA
  calcaneusBmdDeltaPct: number; // % change from pre-flight ultrasound/DEXA
  lowerLimbMuscleVolumeDeltaPct: number; // % change in quadriceps/soleus
  aredCompliancePct: number; // ARED resistance adherence %
  treadmillCompliancePct: number; // T2 treadmill adherence %
  urinaryCalciumRisk: 'LOW' | 'ELEVATED' | 'HIGH';
  calciumExcretionMgDay: number; // urinary calcium mg/day (risk > 300)
  history: MusculoskeletalLongitudinalPoint[];
}

export interface RadiationTimelinePoint {
  day: number;
  dateLabel: string; // e.g. "Nov 01"
  dosimeterRateMicroGyHr: number; // total measured rate
  gcrComponent: number; // Galactic Cosmic Rays
  speComponent: number; // Solar Particle Event spike
  cumulativeDoseMsv: number;
  donkiEventNote?: string;
}

export interface DonkiSpaceWeatherEvent {
  id: string;
  eventType: 'CME' | 'FLARE' | 'SEP' | 'GEOMAGNETIC_STORM';
  classification: string; // e.g. "M1.2 Flare", "Halo CME (1150 km/s)"
  onsetUtc: string;
  peakUtc: string;
  protonFluxLevel: string; // e.g. "S1 Minor"
  shelterAdvisory: string;
  source: 'NASA DONKI API FEED';
}

export interface RadiationCrewDose {
  astronautId: string;
  astronautName: string;
  cumulativeMissionDoseMsv: number;
  careerDoseMsv: number;
  careerLimitMsv: number; // 600 mSv (NASA-STD-3001)
  careerLimitPct: number;
}

export interface RadiationEnvironmentData {
  cumulativeMissionDoseMsv: number;
  currentDosimeterRateMicroGyHr: number;
  gcrBackgroundRateMicroGyHr: number;
  speRateMicroGyHr: number;
  stormShelterStatus: 'ACTIVE_STANDBY' | 'NOMINAL_OPERATION' | 'SHELTER_MANDATORY';
  careerLimitMsv: number;
  timeline14d: RadiationTimelinePoint[];
  donkiEvents: DonkiSpaceWeatherEvent[];
  crewDoses: RadiationCrewDose[];
}

export interface SleepArchitectureDay {
  dayLabel: string; // e.g. "Day 78", "Day 79"
  date: string;
  deepSleepHours: number;
  remSleepHours: number;
  lightSleepHours: number;
  totalSleepHours: number;
  sleepEfficiencyPct: number;
  targetHours: number; // 8.0h standard
  circadianAlignmentScore: number; // 0-100
  stressIndex: number; // 1-10
}

export interface BehavioralCheckIn {
  id: string;
  timestamp: string; // ISO
  moodRating: number; // 1-5
  perceivedStress: number; // 1-10
  sleepQuality: number; // 1-5
  cognitiveFatigue: boolean;
  notes: string;
}

export interface MentalHealthMetrics {
  currentCircadianAlignment: number; // 0-100
  currentStressIndex: number; // 1-10
  currentMoodScore: number; // 1-5
  weeklyAvgSleepHours: number;
  weeklyAvgEfficiencyPct: number;
  sleepArchitecture7d: SleepArchitectureDay[];
  checkInHistory: BehavioralCheckIn[];
}

/* ==============================================================================
 * Master Astronaut Profile
 * ============================================================================== */

export interface AstronautProfile {
  id: string;
  name: string;
  callsign: string;
  role: string;
  nationality: string;
  age: number;
  missionDay: number;
  totalFlightHours: number;
  evaCount: number;
  evaHours: number;
  status: HealthStatus;
  avatarInitials: string;
  medicalOfficerNotes: string;
  lastExamDate: string;
  preFlightDeltas: PreFlightDeltas;
  baseline: AstronautBaseline;
  currentVitals: VitalSignsSnapshot;
  trend24h: VitalTrendPoint[];
  trendsByWindow: Record<TimeWindow, VitalTrendPoint[]>;
  cardiovascular: CardiovascularMetrics;
  musculoskeletal: MusculoskeletalMetrics;
  mentalHealth: MentalHealthMetrics;
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
