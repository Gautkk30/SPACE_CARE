/**
 * SPACECARE - TypeScript Type Definitions
 * Intelligent Astronaut Health Monitoring & Early Warning System
 * NASA Space Apps Challenge 2026
 */

export type HealthStatus = 'NOMINAL' | 'CAUTION' | 'ALERT';
export type AlertSeverity = 'INFO' | 'CAUTION' | 'CRITICAL' | 'WARNING';
export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
export type HealthCategory = 
  | 'CARDIOVASCULAR' 
  | 'RADIATION' 
  | 'MUSCULOSKELETAL' 
  | 'SLEEP_PSYCH' 
  | 'ENVIRONMENTAL'
  | 'RESPIRATORY'
  | 'VITALS';

export type TimeWindow = '6H' | '24H' | '7D';

/**
 * Data provenance source matching backend app/models/data_source.py
 */
export type DataSourceType = 'SYNTHETIC_SIMULATED' | 'NASA_RESEARCH' | 'SENSOR_LIVE';

/**
 * Controlled physiological simulation patterns matching backend TelemetryGenerator
 */
export type SimulatedPattern = 
  | 'NORMAL' 
  | 'HYPOXIA' 
  | 'THERMAL_STRAIN' 
  | 'ACUTE_TACHYCARDIA' 
  | 'HYPOTENSION_DECONDITIONING';

/**
 * Raw telemetry record matching backend SQLAlchemy `telemetry` table
 */
export interface TelemetryReading {
  id: number;
  astronaut_id: string;
  timestamp: string; // ISO 8601 UTC
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  body_temperature: number;
  respiration_rate: number;
  data_source: DataSourceType;
  is_simulated: boolean;
  dataset_reference?: string | null;
}

/**
 * Backend Pydantic Schemas matching backend/app/schemas/*
 */

export interface AstronautResponse {
  id: string;
  name: string;
  role: string;
  age: number;
  gender: string;
  mission: string;
  is_demo: boolean;
  baseline_heart_rate: number;
  baseline_systolic_bp: number;
  baseline_diastolic_bp: number;
  baseline_spo2: number;
  baseline_body_temperature: number;
  baseline_respiration_rate: number;
  created_at: string;
}

export interface TelemetryCreate {
  astronaut_id: string;
  timestamp?: string | null;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  body_temperature: number;
  respiration_rate: number;
  data_source?: DataSourceType;
  is_simulated?: boolean;
  dataset_reference?: string | null;
  // Optional multi-hazard auxiliary streams
  dose_rate?: number | null;
  cumulative_exposure?: number | null;
  sleep_duration?: number | null;
  cumulative_sleep_debt?: number | null;
  workload_score?: number | null;
  mood_score?: number | null;
  communication_latency_seconds?: number | null;
  exercise_deficit_daily?: number | null;
  cabin_pressure_kpa?: number | null;
  o2_partial_pressure_kpa?: number | null;
  co2_partial_pressure_kpa?: number | null;
  pressure_drop_rate?: number | null;
  cabin_temperature?: number | null;
}

export interface TelemetryResponse {
  id: number;
  astronaut_id: string;
  timestamp: string;
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  spo2: number;
  body_temperature: number;
  respiration_rate: number;
  data_source: string;
  is_simulated: boolean;
  dataset_reference?: string | null;
  created_at: string;
}

export interface HeuristicExplanation {
  feature: string;
  robust_z_score: number;
  direction: 'elevated' | 'depressed' | string;
  observed_value: number;
  training_median: number;
  heuristic_explanation: string;
  attribution_type?: string;
}

export interface AssessmentSummaryResponse {
  overall_status: 'NOMINAL' | 'ELEVATED_RISK' | 'CRITICAL_RISK' | 'DATA_QUALITY_ISSUE' | string;
  physiological_status: string;
  highest_severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  primary_hazard: string;
  assessed_domains: string[];
  unmonitored_domains: string[];
  evidence_status: string;
  overall_evidence_status: string;
  ml_anomaly_detected: boolean;
  ml_anomaly_score: number;
  heuristic_explanations: HeuristicExplanation[];
  alerts_created_count: number;
  new_alert_ids: string[];
  active_open_alert_ids: string[];
}

export interface TelemetryIngestResponse {
  telemetry: TelemetryResponse;
  assessment_summary: AssessmentSummaryResponse;
}

export interface AlertResponse {
  id: string;
  astronaut_id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  category: string;
  message: string;
  recommendation: string;
  is_acknowledged: boolean;
  timestamp: string;
  created_at: string;
}

export interface AlertAcknowledgeResponse {
  alert: AlertResponse;
  status: string;
}

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
  baselineHrvRmssd?: number; // ms (optional demonstration metric)
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

export type SleepQualityType = 'POOR' | 'FAIR' | 'OPTIMAL' | 'EXTENDED';

export interface SleepLogEntry {
  id: string;
  astronaut_id: string;
  date: string;
  hours_slept: number;
  sleep_quality: SleepQualityType;
  awakenings: number;
  coupled_to_vitals: boolean;
  notes: string;
  data_source: 'SYNTHETIC_SIMULATED';
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
  sleepDebtHours?: number;
  cognitiveReadinessScore?: number;
}

/* ==============================================================================
 * Phase 3 Batch 3: AI Anomaly Detection, Extended Alerts, & Health Reports
 * ============================================================================== */

export interface FeatureContribution {
  featureName: string;
  featureKey: string;
  contributionPct: number; // 0-100
  observedValue: string;
  nominalRange: string;
  deviationZScore: number;
  direction: 'ELEVATED' | 'DEPRESSED' | 'IRREGULAR';
}

export interface AnomalyTimelinePoint {
  day: number;
  dateLabel: string;
  anomalyScore: number; // 0.00 - 1.00
  threshold: number; // 0.65
  zScoreDeviation: number;
}

export interface AIAnalysisResult {
  astronautId: string;
  astronautName: string;
  compositeAnomalyScore: number; // 0.00 - 1.00
  anomalyThreshold: number; // 0.65
  riskLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH';
  confidenceLevel: number; // e.g. 0.94
  baselineDeviationZScore: number; // e.g. +2.4
  modelType: string; // "Isolation Forest + Baseline Z-Score Ensemble • Prototype"
  timeline14d: AnomalyTimelinePoint[];
  featureAttributions: FeatureContribution[];
  clinicalInterpretation: string;
  nextAssessmentRecommendations: string[];
  dataSource: 'SIMULATED ML OUTPUT';
}

export interface HealthAlert {
  id: string;
  astronautId: string;
  astronautName: string;
  category: HealthCategory;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  whatIsChanging: string;
  whyItMatters: string;
  physiologicalExplanation: string;
  countermeasure: string;
  suggestedFurtherAssessment: string;
  evidenceReference: string;
  timestamp: string;
  acknowledged: boolean;
  // Backend database alignment fields
  astronaut_id?: string;
  message?: string;
  confidence_score?: number;
  recommendation?: string;
  is_acknowledged?: boolean;
}

export function convertAlertResponseToHealthAlert(
  res: AlertResponse,
  crewMap: Record<string, { name: string }> = {}
): HealthAlert {
  const astro = crewMap[res.astronaut_id];
  const astroName = astro ? astro.name : res.astronaut_id;

  const sevUpper = (res.severity || '').toUpperCase();
  const severity: AlertSeverity =
    sevUpper === 'CRITICAL' ? 'CRITICAL' : sevUpper === 'INFO' ? 'INFO' : 'CAUTION';

  let category: HealthCategory = 'CARDIOVASCULAR';
  const catUpper = (res.category || '').toUpperCase();
  if (catUpper.includes('RADIATION')) category = 'RADIATION';
  else if (catUpper.includes('GRAVITY') || catUpper.includes('MUSCLE') || catUpper.includes('BONE')) category = 'MUSCULOSKELETAL';
  else if (catUpper.includes('ISOLATION') || catUpper.includes('SLEEP') || catUpper.includes('PSYCH')) category = 'SLEEP_PSYCH';
  else if (catUpper.includes('ENVIRONMENT') || catUpper.includes('HOSTILE') || catUpper.includes('ATMOSPHERE')) category = 'ENVIRONMENTAL';
  else if (catUpper.includes('RESPIRAT') || catUpper.includes('HYPOXIA')) category = 'RESPIRATORY';
  else if (catUpper.includes('VITALS')) category = 'VITALS';

  const status: AlertStatus = res.is_acknowledged ? 'ACKNOWLEDGED' : 'ACTIVE';

  return {
    id: res.id,
    astronautId: res.astronaut_id,
    astronautName: astroName,
    category,
    severity,
    status,
    title: res.message.split('.')[0] || `${res.severity} Alert: ${res.category}`,
    whatIsChanging: res.message,
    whyItMatters: 'Biometric threshold or multi-hazard rule violation recorded by mission monitoring.',
    physiologicalExplanation: res.message,
    countermeasure: res.recommendation,
    suggestedFurtherAssessment: 'Verify auxiliary sensor telemetry and execute onboard clinical protocol.',
    evidenceReference: 'NASA HRP Standards & NASA-STD-3001',
    timestamp: res.timestamp,
    acknowledged: res.is_acknowledged,
    astronaut_id: res.astronaut_id,
    message: res.message,
    recommendation: res.recommendation,
    is_acknowledged: res.is_acknowledged,
    confidence_score: 0.95,
  };
}

export interface MissionHealthReport {
  astronautId: string;
  astronautName: string;
  callsign: string;
  role: string;
  missionDay: number;
  reportGeneratedUtc: string;
  timeframe: '7_DAY_WEEKLY' | 'MISSION_TO_DATE';
  executiveSummary: string;
  vitalsSummary: {
    avgHeartRate: number;
    avgSpo2: number;
    avgSystolicBP: number;
    avgDiastolicBP: number;
    avgHrvRmssd: number;
  };
  cardiovascularSummary: {
    restingHrDrift: number;
    meanArterialPressure: number;
    orthostaticReadinessScore: number;
    status: string;
  };
  musculoskeletalSummary: {
    femoralNeckBmdLossPct: number;
    lumbarSpineBmdLossPct: number;
    lowerLimbMuscleLossPct: number;
    aredAdherencePct: number;
  };
  radiationSummary: {
    cumulativeMissionDoseMsv: number;
    careerDosePct: number;
    status: string;
  };
  behavioralSummary: {
    avgSleepDurationHours: number;
    sleepEfficiencyPct: number;
    circadianScore: number;
    stressIndex: number;
    status: string;
  };
  activeAlertsCount: number;
  nasaResearchContext: string;
  surgeonSignOff: string;
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
  aiAnalysis: AIAnalysisResult;

  // Direct backend database `astronauts` table fields
  gender?: string;
  mission?: string;
  is_demo?: boolean;
  baseline_heart_rate?: number;
  baseline_systolic_bp?: number;
  baseline_diastolic_bp?: number;
  baseline_spo2?: number;
  baseline_temperature?: number;
  baseline_body_temperature?: number;
  baseline_respiration_rate?: number;
}

export interface MissionSummary {
  missionName: string;
  missionElapsedDays: number;
  totalCrewCount: number;
  nominalCrewCount: number;
  cautionCrewCount: number;
  alertCrewCount: number;
  spaceWeatherCondition: string;
  radiationExposureRate: string;
  telemetrySyncTime: string;
  dataSource: 'SIMULATED TELEMETRY';
}

export type TabId = 
  | 'overview'
  | 'crew'
  | 'vitals'
  | 'manual-input'
  | 'hazard-lab'
  | 'cardiovascular'
  | 'bone-muscle'
  | 'radiation'
  | 'mental-health'
  | 'ai-analysis'
  | 'alerts'
  | 'reports'
  | 'research';

export interface NavigationTab {
  id: TabId;
  label: string;
  badge?: number;
  status?: 'ACTIVE' | 'PLANNED';
}
