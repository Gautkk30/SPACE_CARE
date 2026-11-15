/**
 * SPACECARE - Mock Telemetry & Demonstration Data Service
 * NASA Space Apps Challenge 2026
 * 
 * DISCLAIMER & DATA ATTRIBUTION:
 * All numerical telemetry records in this module are SYNTHESIZED SIMULATED DATA
 * designed for software architecture demonstration, visualization, and algorithm testing.
 * 
 * Research baselines and clinical hazard thresholds are modeled after published
 * open-access standards from:
 * - NASA Human Research Program (HRP) Evidence Books (Cardiovascular, Musculoskeletal, Behavior, Radiation)
 * - NASA Space Flight Human-System Standard (NASA-STD-3001)
 * - NASA Open Science Data Repository (OSDR) - Baseline physiological ranges
 * - NASA Space Weather Database Of Notifications, Knowledge, Innovations (DONKI)
 * 
 * Simulated values MUST NOT be interpreted as authentic operational astronaut clinical biometrics.
 */

import {
  AstronautProfile,
  HealthAlert,
  MissionSummary,
  VitalTrendPoint,
  CardiovascularMetrics,
  MusculoskeletalMetrics,
  MentalHealthMetrics,
  RadiationEnvironmentData,
  AIAnalysisResult,
  FeatureContribution,
  AnomalyTimelinePoint,
  MissionHealthReport,
  TimeWindow,
  SleepArchitectureDay,
  BehavioralCheckIn,
} from '../types/spacecare';

const CURRENT_ISO = "2026-11-14T10:30:00Z";

// Helper to generate trend data across 6H, 24H, and 7D windows
function generateTrends(
  baseHr: number,
  baseHrv: number,
  baseSys: number,
  baseDia: number,
  baseSpo2: number,
  baseTemp: number,
  baseResp: number,
  anomalyConfig?: { hour: number; hrDelta: number; spo2Delta: number; sysDelta: number }
): Record<TimeWindow, VitalTrendPoint[]> {
  const trend6h: VitalTrendPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const hour = (5 + i);
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;
    let hrOffset = (i === 4 && anomalyConfig ? anomalyConfig.hrDelta : (i % 2 === 0 ? 2 : -1));
    let sysOffset = (i === 4 && anomalyConfig ? anomalyConfig.sysDelta : 0);
    trend6h.push({
      timestamp: `2026-11-14T${hour.toString().padStart(2, '0')}:00:00Z`,
      timeLabel,
      heartRate: baseHr + hrOffset,
      hrvRmssd: Math.max(15, baseHrv - (i === 4 && anomalyConfig ? 18 : 2)),
      systolicBP: baseSys + sysOffset,
      diastolicBP: baseDia + (sysOffset > 0 ? 5 : 0),
      spo2: Number((baseSpo2 + (i === 4 && anomalyConfig ? anomalyConfig.spo2Delta : 0)).toFixed(1)),
      coreTemp: baseTemp,
      respiratoryRate: baseResp + (i % 2 === 0 ? 1 : 0),
      hrBaselineMin: baseHr - 12,
      hrBaselineMax: baseHr + 22,
      spo2BaselineMin: 95.0,
    });
  }

  const trend24h: VitalTrendPoint[] = [];
  for (let i = 0; i < 24; i++) {
    const hour = (i + 11) % 24;
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

    let hrVariation = Math.sin((i / 24) * 2 * Math.PI) * 6;
    let spo2Variation = Math.cos((i / 24) * 2 * Math.PI) * 0.4;
    let bpVariation = Math.sin((i / 24) * 2 * Math.PI) * 4;

    if (hour >= 23 || hour <= 6) {
      hrVariation -= 8;
      bpVariation -= 6;
    } else if (hour >= 14 && hour <= 16) {
      hrVariation += 18;
      bpVariation += 10;
      spo2Variation -= 0.6;
    }

    let anomalyHr = 0;
    let anomalySpo2 = 0;
    let anomalySys = 0;
    if (anomalyConfig && hour === anomalyConfig.hour) {
      anomalyHr = anomalyConfig.hrDelta;
      anomalySpo2 = anomalyConfig.spo2Delta;
      anomalySys = anomalyConfig.sysDelta;
    }

    const currentHr = Math.round(baseHr + hrVariation + anomalyHr);
    const currentSys = Math.round(baseSys + bpVariation + anomalySys);
    const currentDia = Math.round(baseDia + (bpVariation * 0.6) + (anomalySys * 0.5));
    const currentSpo2 = Number((baseSpo2 + spo2Variation + anomalySpo2).toFixed(1));
    const currentTemp = Number((baseTemp + (Math.sin((i / 24) * 2 * Math.PI) * 0.25)).toFixed(1));
    const currentResp = Math.round(baseResp + (Math.sin((i / 24) * 2 * Math.PI) * 1.5));
    const currentHrv = Math.max(14, Math.round(baseHrv - (hrVariation * 0.8) - (anomalyHr > 0 ? 16 : 0)));

    trend24h.push({
      timestamp: `2026-11-14T${hour.toString().padStart(2, '0')}:00:00Z`,
      timeLabel,
      heartRate: currentHr,
      hrvRmssd: currentHrv,
      systolicBP: currentSys,
      diastolicBP: currentDia,
      spo2: Math.min(100, Math.max(92, currentSpo2)),
      coreTemp: currentTemp,
      respiratoryRate: currentResp,
      hrBaselineMin: baseHr - 12,
      hrBaselineMax: baseHr + 22,
      spo2BaselineMin: 95.0,
    });
  }

  const trend7d: VitalTrendPoint[] = [];
  const days = ['Day 78', 'Day 79', 'Day 80', 'Day 81', 'Day 82', 'Day 83', 'Day 84 (Today)'];
  days.forEach((dayLabel, idx) => {
    const driftFactor = (idx / 7);
    trend7d.push({
      timestamp: `2026-11-${(8 + idx).toString().padStart(2, '0')}T10:00:00Z`,
      timeLabel: dayLabel,
      heartRate: Math.round(baseHr + (driftFactor * (anomalyConfig ? 8 : 2))),
      hrvRmssd: Math.round(baseHrv - (driftFactor * (anomalyConfig ? 14 : 3))),
      systolicBP: Math.round(baseSys + (driftFactor * (anomalyConfig ? 6 : 1))),
      diastolicBP: Math.round(baseDia + (driftFactor * (anomalyConfig ? 4 : 1))),
      spo2: Number((baseSpo2 - (driftFactor * 0.4)).toFixed(1)),
      coreTemp: baseTemp,
      respiratoryRate: baseResp,
      hrBaselineMin: baseHr - 12,
      hrBaselineMax: baseHr + 22,
      spo2BaselineMin: 95.0,
    });
  });

  return {
    '6H': trend6h,
    '24H': trend24h,
    '7D': trend7d,
  };
}

// Helper for longitudinal cardiovascular history (Day 0 to Day 84)
function generateCardiovascular(
  baseHr: number,
  baseSys: number,
  baseDia: number,
  baseHrv: number,
  hrDrift: number,
  orthoScore: number,
  fluidShift: 'Nominal' | 'Mild Cephalad Shift' | 'Moderate Redistribution'
): CardiovascularMetrics {
  const baseMap = Number((baseDia + (baseSys - baseDia) / 3).toFixed(1));
  const currentMap = Number(((baseDia + hrDrift * 0.4) + ((baseSys + hrDrift * 0.8) - (baseDia + hrDrift * 0.4)) / 3).toFixed(1));

  const history = [
    { day: 0, dateLabel: 'L-0 (Launch)', restingHr: baseHr, baselineHr: baseHr, map: baseMap, baselineMap: baseMap, orthostaticScore: 96, hrvRmssd: baseHrv },
    { day: 14, dateLabel: 'Day 14', restingHr: baseHr + 1, baselineHr: baseHr, map: Number((baseMap + 1.2).toFixed(1)), baselineMap: baseMap, orthostaticScore: 92, hrvRmssd: baseHrv - 2 },
    { day: 28, dateLabel: 'Day 28', restingHr: baseHr + 2, baselineHr: baseHr, map: Number((baseMap + 2.0).toFixed(1)), baselineMap: baseMap, orthostaticScore: 89, hrvRmssd: baseHrv - 5 },
    { day: 42, dateLabel: 'Day 42', restingHr: baseHr + 3, baselineHr: baseHr, map: Number((baseMap + 1.8).toFixed(1)), baselineMap: baseMap, orthostaticScore: 85, hrvRmssd: baseHrv - 7 },
    { day: 56, dateLabel: 'Day 56', restingHr: baseHr + 4, baselineHr: baseHr, map: Number((baseMap + 2.5).toFixed(1)), baselineMap: baseMap, orthostaticScore: 82, hrvRmssd: baseHrv - 9 },
    { day: 70, dateLabel: 'Day 70', restingHr: baseHr + (hrDrift * 0.7), baselineHr: baseHr, map: Number((baseMap + (currentMap - baseMap) * 0.7).toFixed(1)), baselineMap: baseMap, orthostaticScore: Math.round(orthoScore + 6), hrvRmssd: Math.round(baseHrv - 12) },
    { day: 84, dateLabel: 'Day 84 (Now)', restingHr: baseHr + hrDrift, baselineHr: baseHr, map: currentMap, baselineMap: baseMap, orthostaticScore: orthoScore, hrvRmssd: Math.max(16, baseHrv - (hrDrift * 1.8)) },
  ];

  return {
    restingHrDrift: hrDrift,
    meanArterialPressure: currentMap,
    strokeVolumeIndex: Number((44.5 - (hrDrift * 0.45)).toFixed(1)),
    orthostaticToleranceScore: orthoScore,
    baroreflexSensitivity: Number((14.2 - (hrDrift * 0.3)).toFixed(1)),
    fluidShiftSeverity: fluidShift,
    history,
    referenceStandards: {
      mapMin: 70,
      mapMax: 105,
      orthostaticAlertThreshold: 75,
      baroreflexNominalMin: 8.0,
      citation: 'NASA Human Research Program (HRP) Cardiovascular Risk Evidence Book / NASA-STD-3001',
    },
  };
}

// Helper for Musculoskeletal Metrics (12-Week Longitudinal Model)
function generateMusculoskeletal(
  femurDelta: number,
  spineDelta: number,
  calcaneusDelta: number,
  muscleDelta: number,
  aredCompliance: number,
  treadmillCompliance: number,
  caRisk: 'LOW' | 'ELEVATED' | 'HIGH',
  caExcretion: number
): MusculoskeletalMetrics {
  const history = [
    { week: 0, label: 'Pre-Flight', actualBmdLossPct: 0.0, unmitigatedReferenceLossPct: 0.0, leanMuscleLossPct: 0.0, aredCompliancePct: 100 },
    { week: 2, label: 'Week 2', actualBmdLossPct: Number((femurDelta * 0.15).toFixed(1)), unmitigatedReferenceLossPct: -0.6, leanMuscleLossPct: Number((muscleDelta * 0.2).toFixed(1)), aredCompliancePct: aredCompliance },
    { week: 4, label: 'Week 4', actualBmdLossPct: Number((femurDelta * 0.35).toFixed(1)), unmitigatedReferenceLossPct: -1.2, leanMuscleLossPct: Number((muscleDelta * 0.4).toFixed(1)), aredCompliancePct: aredCompliance },
    { week: 6, label: 'Week 6', actualBmdLossPct: Number((femurDelta * 0.55).toFixed(1)), unmitigatedReferenceLossPct: -1.8, leanMuscleLossPct: Number((muscleDelta * 0.6).toFixed(1)), aredCompliancePct: aredCompliance - 2 },
    { week: 8, label: 'Week 8', actualBmdLossPct: Number((femurDelta * 0.72).toFixed(1)), unmitigatedReferenceLossPct: -2.4, leanMuscleLossPct: Number((muscleDelta * 0.75).toFixed(1)), aredCompliancePct: aredCompliance },
    { week: 10, label: 'Week 10', actualBmdLossPct: Number((femurDelta * 0.88).toFixed(1)), unmitigatedReferenceLossPct: -3.0, leanMuscleLossPct: Number((muscleDelta * 0.9).toFixed(1)), aredCompliancePct: aredCompliance + 1 },
    { week: 12, label: 'Week 12 (Now)', actualBmdLossPct: femurDelta, unmitigatedReferenceLossPct: -3.6, leanMuscleLossPct: muscleDelta, aredCompliancePct: aredCompliance },
  ];

  return {
    femoralNeckBmdDeltaPct: femurDelta,
    lumbarSpineBmdDeltaPct: spineDelta,
    calcaneusBmdDeltaPct: calcaneusDelta,
    lowerLimbMuscleVolumeDeltaPct: muscleDelta,
    aredCompliancePct: aredCompliance,
    treadmillCompliancePct: treadmillCompliance,
    urinaryCalciumRisk: caRisk,
    calciumExcretionMgDay: caExcretion,
    history,
  };
}

// Helper for Mental Health & Sleep Architecture (7-Day Actigraphy)
function generateMentalHealth(
  circadianScore: number,
  stressIndex: number,
  moodScore: number,
  deepBase: number,
  remBase: number,
  lightBase: number,
  efficiencyBase: number,
  initialNote: string
): MentalHealthMetrics {
  const days = ['Day 78', 'Day 79', 'Day 80', 'Day 81', 'Day 82', 'Day 83', 'Day 84 (Today)'];
  const sleepArchitecture7d: SleepArchitectureDay[] = days.map((dayLabel, idx) => {
    const jitter = Math.sin(idx * 1.5) * 0.3;
    const deep = Number(Math.max(0.8, deepBase + jitter * 0.5).toFixed(1));
    const rem = Number(Math.max(1.0, remBase + jitter * 0.4).toFixed(1));
    const light = Number(Math.max(2.5, lightBase + jitter * 0.6).toFixed(1));
    const total = Number((deep + rem + light).toFixed(1));
    const eff = Math.min(96, Math.max(68, Math.round(efficiencyBase + jitter * 5)));

    return {
      dayLabel,
      date: `2026-11-${(8 + idx).toString().padStart(2, '0')}`,
      deepSleepHours: deep,
      remSleepHours: rem,
      lightSleepHours: light,
      totalSleepHours: total,
      sleepEfficiencyPct: eff,
      targetHours: 8.0,
      circadianAlignmentScore: Math.round(circadianScore + (idx % 2 === 0 ? 2 : -2)),
      stressIndex: Math.min(10, Math.max(1, Math.round(stressIndex + (idx % 2 === 0 ? -1 : 1)))),
    };
  });

  const weeklyAvgSleepHours = Number(
    (sleepArchitecture7d.reduce((sum, d) => sum + d.totalSleepHours, 0) / 7).toFixed(1)
  );
  const weeklyAvgEfficiencyPct = Math.round(
    sleepArchitecture7d.reduce((sum, d) => sum + d.sleepEfficiencyPct, 0) / 7
  );

  const checkInHistory: BehavioralCheckIn[] = [
    {
      id: 'CHK-001',
      timestamp: '2026-11-13T20:45:00Z',
      moodRating: moodScore,
      perceivedStress: stressIndex,
      sleepQuality: Math.round((efficiencyBase / 100) * 5),
      cognitiveFatigue: stressIndex >= 7,
      notes: initialNote,
    },
  ];

  return {
    currentCircadianAlignment: circadianScore,
    currentStressIndex: stressIndex,
    currentMoodScore: moodScore,
    weeklyAvgSleepHours,
    weeklyAvgEfficiencyPct,
    sleepArchitecture7d,
    checkInHistory,
  };
}

// Helper for AI Anomaly Detection Pipeline Results
function generateAIAnalysis(
  astronautId: string,
  astronautName: string,
  currentScore: number,
  riskLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH',
  confidence: number,
  zScore: number,
  features: FeatureContribution[],
  interpretation: string,
  recommendations: string[]
): AIAnalysisResult {
  const timeline14d: AnomalyTimelinePoint[] = [];
  for (let i = 1; i <= 14; i++) {
    const day = 70 + i;
    const progress = i / 14;
    let score = Number((0.20 + (currentScore - 0.20) * Math.pow(progress, 1.4) + (Math.sin(i) * 0.04)).toFixed(2));
    if (i === 14) score = currentScore;
    timeline14d.push({
      day,
      dateLabel: `Day ${day}`,
      anomalyScore: Math.max(0.12, Math.min(0.98, score)),
      threshold: 0.65,
      zScoreDeviation: Number((zScore * progress).toFixed(1)),
    });
  }

  return {
    astronautId,
    astronautName,
    compositeAnomalyScore: currentScore,
    anomalyThreshold: 0.65,
    riskLevel,
    confidenceLevel: confidence,
    baselineDeviationZScore: zScore,
    modelType: 'Isolation Forest + Baseline Z-Score Ensemble • Prototype',
    timeline14d,
    featureAttributions: features,
    clinicalInterpretation: interpretation,
    nextAssessmentRecommendations: recommendations,
    dataSource: 'SIMULATED ML OUTPUT',
  };
}

// ------------------------------------------------------------------------------
// Radiation & Space Weather Data (14-Day Timeline with DONKI Events)
// ------------------------------------------------------------------------------
export const MOCK_RADIATION_DATA: RadiationEnvironmentData = {
  cumulativeMissionDoseMsv: 54.2,
  currentDosimeterRateMicroGyHr: 42.5,
  gcrBackgroundRateMicroGyHr: 17.5,
  speRateMicroGyHr: 25.0,
  stormShelterStatus: 'ACTIVE_STANDBY',
  careerLimitMsv: 600,
  timeline14d: [
    { day: 1, dateLabel: 'Nov 01', dosimeterRateMicroGyHr: 17.4, gcrComponent: 17.4, speComponent: 0.0, cumulativeDoseMsv: 46.2 },
    { day: 2, dateLabel: 'Nov 02', dosimeterRateMicroGyHr: 17.8, gcrComponent: 17.8, speComponent: 0.0, cumulativeDoseMsv: 46.6 },
    { day: 3, dateLabel: 'Nov 03', dosimeterRateMicroGyHr: 18.1, gcrComponent: 18.1, speComponent: 0.0, cumulativeDoseMsv: 47.0 },
    { day: 4, dateLabel: 'Nov 04', dosimeterRateMicroGyHr: 17.6, gcrComponent: 17.6, speComponent: 0.0, cumulativeDoseMsv: 47.4 },
    { day: 5, dateLabel: 'Nov 05', dosimeterRateMicroGyHr: 17.9, gcrComponent: 17.9, speComponent: 0.0, cumulativeDoseMsv: 47.8 },
    { day: 6, dateLabel: 'Nov 06', dosimeterRateMicroGyHr: 18.0, gcrComponent: 18.0, speComponent: 0.0, cumulativeDoseMsv: 48.2 },
    { day: 7, dateLabel: 'Nov 07', dosimeterRateMicroGyHr: 18.2, gcrComponent: 18.2, speComponent: 0.0, cumulativeDoseMsv: 48.6 },
    { day: 8, dateLabel: 'Nov 08', dosimeterRateMicroGyHr: 18.3, gcrComponent: 18.3, speComponent: 0.0, cumulativeDoseMsv: 49.0 },
    { day: 9, dateLabel: 'Nov 09', dosimeterRateMicroGyHr: 22.4, gcrComponent: 17.8, speComponent: 4.6, cumulativeDoseMsv: 49.5, donkiEventNote: 'M1.0 Precursor Solar Flare' },
    { day: 10, dateLabel: 'Nov 10', dosimeterRateMicroGyHr: 20.1, gcrComponent: 17.7, speComponent: 2.4, cumulativeDoseMsv: 50.0 },
    { day: 11, dateLabel: 'Nov 11', dosimeterRateMicroGyHr: 19.5, gcrComponent: 17.9, speComponent: 1.6, cumulativeDoseMsv: 50.5 },
    { day: 12, dateLabel: 'Nov 12', dosimeterRateMicroGyHr: 34.6, gcrComponent: 17.6, speComponent: 17.0, cumulativeDoseMsv: 51.3, donkiEventNote: 'DONKI #CME-2026-11 Halo Arrival' },
    { day: 13, dateLabel: 'Nov 13', dosimeterRateMicroGyHr: 48.2, gcrComponent: 17.2, speComponent: 31.0, cumulativeDoseMsv: 52.5, donkiEventNote: 'DONKI #SEP-2026-11-A Proton Wave Peak' },
    { day: 14, dateLabel: 'Nov 14 (Now)', dosimeterRateMicroGyHr: 42.5, gcrComponent: 17.5, speComponent: 25.0, cumulativeDoseMsv: 54.2, donkiEventNote: 'Elevated Flux Decay Window' },
  ],
  donkiEvents: [
    {
      id: 'DONKI-SEP-2026-11-A',
      eventType: 'SEP',
      classification: 'S1 Minor Proton Enhancement (>10 MeV at 25 pfu)',
      onsetUtc: '2026-11-13T04:20:00Z',
      peakUtc: '2026-11-13T16:45:00Z',
      protonFluxLevel: 'S1 Minor',
      shelterAdvisory: 'Maintain duty within water-wall reinforced service module storm shelter.',
      source: 'NASA DONKI API FEED',
    },
    {
      id: 'DONKI-CME-2026-11-09',
      eventType: 'CME',
      classification: 'Halo Coronal Mass Ejection (Speed ~1150 km/s)',
      onsetUtc: '2026-11-09T22:15:00Z',
      peakUtc: '2026-11-12T14:30:00Z',
      protonFluxLevel: 'Moderate Solar Wind Shock',
      shelterAdvisory: 'Suspend EVA airlock repressurization and tethered spacewalk prep.',
      source: 'NASA DONKI API FEED',
    },
    {
      id: 'DONKI-FLR-2026-11-02',
      eventType: 'FLARE',
      classification: 'M1.2 Long-Duration Solar X-Ray Flare',
      onsetUtc: '2026-11-09T18:04:00Z',
      peakUtc: '2026-11-09T18:42:00Z',
      protonFluxLevel: 'R1 Minor Radio Blackout',
      shelterAdvisory: 'Monitor cabin dosimeter live telemetry; nominal orbital shielding active.',
      source: 'NASA DONKI API FEED',
    },
  ],
  crewDoses: [
    { astronautId: 'astro_morgan', astronautName: 'Commander Alex Morgan', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 184.5, careerLimitMsv: 600, careerLimitPct: 30.8 },
    { astronautId: 'astro_reynolds', astronautName: 'Dr. Maya Reynolds', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 98.4, careerLimitMsv: 600, careerLimitPct: 16.4 },
    { astronautId: 'astro_carter', astronautName: 'Daniel Carter', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 156.2, careerLimitMsv: 600, careerLimitPct: 26.0 },
    { astronautId: 'astro_bennett', astronautName: 'Sofia Bennett', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 54.2, careerLimitMsv: 600, careerLimitPct: 9.0 },
    { astronautId: 'astro_03', astronautName: 'Major Marcus Chen', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 112.0, careerLimitMsv: 600, careerLimitPct: 18.7 },
    { astronautId: 'ASTRO-01', astronautName: 'Commander Alex Morgan (Legacy)', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 184.5, careerLimitMsv: 600, careerLimitPct: 30.8 },
    { astronautId: 'ASTRO-02', astronautName: 'Daniel Carter (Legacy)', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 98.4, careerLimitMsv: 600, careerLimitPct: 16.4 },
    { astronautId: 'ASTRO-03', astronautName: 'Dr. Maya Reynolds (Legacy)', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 156.2, careerLimitMsv: 600, careerLimitPct: 26.0 },
    { astronautId: 'ASTRO-04', astronautName: 'Sofia Bennett (Legacy)', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 54.2, careerLimitMsv: 600, careerLimitPct: 9.0 },
  ],
};

// ------------------------------------------------------------------------------
// Marcus Chen (Primary DB Seed: astro_03)
const marcusChenTrends = generateTrends(72, 44, 120, 78, 98.2, 36.8, 15);
const marcusChenCardio = generateCardiovascular(72, 120, 78, 44, 4, 88, 'Nominal');
const marcusChenMusculo = generateMusculoskeletal(-1.0, -0.8, -1.3, -1.9, 96, 95, 'LOW', 205);
const marcusChenMental = generateMentalHealth(90, 3, 4, 1.8, 1.7, 3.8, 89, 'Adapted to Artemis transit. Daily resistive countermeasure protocol fully satisfied.');
const marcusChenAI = generateAIAnalysis(
  'astro_03',
  'Major Marcus Chen',
  0.24,
  'NOMINAL',
  0.95,
  0.5,
  [
    { featureName: 'Resting Heart Rate', featureKey: 'hr_rest', contributionPct: 22, observedValue: '72 bpm', nominalRange: '55-90 bpm', deviationZScore: 0.2, direction: 'ELEVATED' },
    { featureName: 'SpO2 Oxygenation', featureKey: 'spo2', contributionPct: 20, observedValue: '98.2%', nominalRange: '>= 95%', deviationZScore: -0.1, direction: 'DEPRESSED' },
    { featureName: 'Blood Pressure', featureKey: 'bp', contributionPct: 16, observedValue: '120/78 mmHg', nominalRange: '<= 120/80', deviationZScore: 0.1, direction: 'ELEVATED' },
  ],
  'Physiological vectors tracking closely with Artemis Lunar Transit mission profile baselines. Autonomic stability nominal.',
  ['Continue standard ARED and cycle ergometer protocol.', 'Scheduled lunar injection trajectory check.']
);

// Assemble Astronaut Profiles with ML Anomaly Attributions
// ------------------------------------------------------------------------------

// Four Fictional Astronaut Profiles (Tasks 1-7 Model Alignment)
// ------------------------------------------------------------------------------

// 1. Commander Alex Morgan (astro_morgan) - Mission Commander
const morganTrends = generateTrends(65, 46, 116, 74, 98.6, 36.7, 13);
const morganCardio = generateCardiovascular(65, 116, 74, 46, 2, 92, 'Mild Cephalad Shift');
const morganMusculo = generateMusculoskeletal(-1.1, -0.9, -1.4, -2.1, 98, 96, 'LOW', 195);
const morganMental = generateMentalHealth(92, 3, 4, 1.9, 1.8, 3.6, 91, 'Mission Commander profile. Exercise countermeasure adherence high; cognitive clarity sustained.');
const morganAI = generateAIAnalysis(
  'astro_morgan',
  'Commander Alex Morgan',
  0.22,
  'NOMINAL',
  0.96,
  0.4,
  [
    { featureName: 'Resting Heart Rate', featureKey: 'hr_rest', contributionPct: 24, observedValue: '65 bpm', nominalRange: '50-90 bpm', deviationZScore: 0.2, direction: 'ELEVATED' },
    { featureName: 'SpO2 Oxygenation', featureKey: 'spo2', contributionPct: 18, observedValue: '98.6%', nominalRange: '>= 95%', deviationZScore: -0.1, direction: 'DEPRESSED' },
    { featureName: 'ARED Compliance', featureKey: 'ared', contributionPct: 12, observedValue: '98%', nominalRange: '>= 90%', deviationZScore: 0.1, direction: 'ELEVATED' },
    { featureName: 'Circadian Alignment', featureKey: 'circadian', contributionPct: 8, observedValue: '92/100', nominalRange: '>= 80', deviationZScore: 0.2, direction: 'ELEVATED' },
  ],
  'All biometric features oscillate within the personal pre-flight nominal statistical boundary (Z-score < 1.0). High countermeasure adherence has preserved bone mineral retention and orthostatic tolerance.',
  ['Continue standard 2.5-hour daily countermeasure regime.', 'Routine weekly medical conference scheduled for Day 91.']
);

// 2. Dr. Maya Reynolds (astro_reynolds) - Flight Surgeon
const reynoldsTrends = generateTrends(68, 52, 114, 72, 99.0, 36.6, 14);
const reynoldsCardio = generateCardiovascular(68, 114, 72, 52, 1, 94, 'Nominal');
const reynoldsMusculo = generateMusculoskeletal(-0.9, -0.7, -1.1, -1.6, 100, 98, 'LOW', 180);
const reynoldsMental = generateMentalHealth(95, 2, 5, 2.1, 2.0, 3.4, 94, 'Flight Surgeon profile. Sleep quality excellent. Maintaining scheduled mindfulness and circadian light hygiene.');
const reynoldsAI = generateAIAnalysis(
  'astro_reynolds',
  'Dr. Maya Reynolds',
  0.18,
  'NOMINAL',
  0.98,
  0.2,
  [
    { featureName: 'Baroreflex Sensitivity', featureKey: 'baro', contributionPct: 22, observedValue: '14.2 ms/mmHg', nominalRange: '>= 10 ms/mmHg', deviationZScore: 0.2, direction: 'ELEVATED' },
    { featureName: 'Sleep Efficiency', featureKey: 'sleep_eff', contributionPct: 19, observedValue: '94%', nominalRange: '>= 85%', deviationZScore: 0.3, direction: 'ELEVATED' },
    { featureName: 'Resting Blood Pressure', featureKey: 'bp', contributionPct: 15, observedValue: '114/72 mmHg', nominalRange: '<= 120/80', deviationZScore: 0.1, direction: 'ELEVATED' },
  ],
  'Robust physiological stability across cardiovascular, musculoskeletal, and psychological vectors. Excellent neurovestibular and hemodynamic adaptation.',
  ['Maintain current countermeasure schedule.', 'Provide telemetry backup for crew member Daniel Carter.']
);

// 3. Daniel Carter (astro_carter) - Flight Engineer (Simulating Autonomic Strain Scenario)
const carterTrends = generateTrends(74, 42, 122, 80, 97.8, 36.9, 16, { hour: 9, hrDelta: 16, spo2Delta: -1.5, sysDelta: 12 });
const carterCardio = generateCardiovascular(74, 122, 80, 42, 14, 68, 'Moderate Redistribution');
const carterMusculo = generateMusculoskeletal(-1.8, -1.6, -2.2, -4.6, 82, 80, 'ELEVATED', 315);
const carterMental = generateMentalHealth(78, 6, 3, 1.2, 1.4, 3.9, 78, 'Flight Engineer profile. Post-exercise recovery tracking; oral rehydration protocol underway.');
const carterAI = generateAIAnalysis(
  'astro_carter',
  'Daniel Carter',
  0.78,
  'HIGH',
  0.93,
  2.8,
  [
    { featureName: 'HRV RMSSD Suppression', featureKey: 'hrv_rmssd', contributionPct: 38, observedValue: '19 ms', nominalRange: '>= 35 ms', deviationZScore: -2.8, direction: 'DEPRESSED' },
    { featureName: 'Resting Tachycardia Drift', featureKey: 'hr_drift', contributionPct: 28, observedValue: '+14 bpm', nominalRange: '< +8 bpm', deviationZScore: 2.3, direction: 'ELEVATED' },
    { featureName: 'Orthostatic Vulnerability', featureKey: 'ortho_score', contributionPct: 18, observedValue: '68/100', nominalRange: '>= 75', deviationZScore: -2.1, direction: 'DEPRESSED' },
    { featureName: 'Urinary Calcium Elevation', featureKey: 'calcium', contributionPct: 16, observedValue: '315 mg/d', nominalRange: '< 250 mg/d', deviationZScore: 1.9, direction: 'ELEVATED' },
  ],
  'Multi-signal anomaly trigger: reduction in parasympathetic heart rate variability combined with elevated resting heart rate indicates autonomic deconditioning secondary to cephalad fluid shifting.',
  [
    'Administer oral isotonic electrolyte rehydration protocol (1.0 L saline equivalent).',
    'Perform standing tilt test or LBNP evaluation.',
    'Reduce subsequent ARED high-interval resistance loading by 15% until HRV stabilizes.',
  ]
);

// 4. Sofia Bennett (astro_bennett) - Mission Specialist (Simulating Circadian Shift Scenario)
const bennettTrends = generateTrends(62, 38, 112, 70, 98.9, 36.5, 12, { hour: 4, hrDelta: 10, spo2Delta: -0.8, sysDelta: 6 });
const bennettCardio = generateCardiovascular(62, 112, 70, 38, 5, 85, 'Mild Cephalad Shift');
const bennettMusculo = generateMusculoskeletal(-1.0, -0.8, -1.2, -1.8, 97, 95, 'LOW', 190);
const bennettMental = generateMentalHealth(70, 5, 3, 1.1, 1.3, 3.0, 74, 'Mission Specialist profile. Sleep fragmented due to science schedule shift. Maintaining circadian light protocol.');
const bennettAI = generateAIAnalysis(
  'astro_bennett',
  'Sofia Bennett',
  0.68,
  'ELEVATED',
  0.90,
  1.9,
  [
    { featureName: 'Circadian Phase Delay', featureKey: 'circadian_lag', contributionPct: 36, observedValue: '68/100', nominalRange: '>= 80', deviationZScore: -2.0, direction: 'DEPRESSED' },
    { featureName: 'Sleep Debt Accumulation', featureKey: 'sleep_hours', contributionPct: 30, observedValue: '4.2 hrs', nominalRange: '>= 7.0 hrs', deviationZScore: -1.8, direction: 'DEPRESSED' },
    { featureName: 'Perceived Stress Index', featureKey: 'stress', contributionPct: 20, observedValue: '6/10', nominalRange: '<= 4/10', deviationZScore: 1.5, direction: 'ELEVATED' },
  ],
  'Circadian rhythm desynchronosis secondary to non-24-hour payload timeline shifts. Mild sympathetic tone elevation.',
  [
    'Institute dynamic solid-state lighting protocol (dim 2700K blue-depleted mode).',
    'Schedule 45-minute tactical sleep opportunity before next airlock duty.',
    'Administer oral melatonin countermeasure per NASA Behavioral Health guidelines.',
  ]
);

// Legacy ID mapping for backward compatibility
export const LEGACY_ASTRONAUT_ID_MAP: Record<string, string> = {
  'ASTRO-01': 'astro_morgan',
  'ASTRO-02': 'astro_carter',
  'ASTRO-03': 'astro_reynolds',
  'ASTRO-04': 'astro_bennett',
};

export const MOCK_ASTRONAUTS: AstronautProfile[] = [
  // 1. Commander Alex Morgan - Mission Commander
  {
    id: 'astro_morgan',
    name: 'Commander Alex Morgan',
    callsign: 'Vanguard-1',
    role: 'Mission Commander',
    nationality: 'USA / NASA',
    age: 42,
    gender: 'Female',
    mission: 'Artemis Gateway Expedition II',
    is_demo: true,
    missionDay: 84,
    totalFlightHours: 4120,
    evaCount: 4,
    evaHours: 28.5,
    status: 'NOMINAL',
    avatarInitials: 'AM',
    medicalOfficerNotes:
      'Demonstration profile: Mission Commander leading Artemis Gateway operations. Baseline vitals are algorithmically synthesized for software demonstration; not medically validated.',
    lastExamDate: '2026-11-12',
    preFlightDeltas: {
      hrDelta: 1,
      bpSystolicDelta: -1,
      bpDiastolicDelta: 0,
      weightDeltaKg: -0.6,
      estimatedBoneLossPct: 1.1,
    },
    baseline_heart_rate: 65.0,
    baseline_systolic_bp: 116.0,
    baseline_diastolic_bp: 74.0,
    baseline_spo2: 98.6,
    baseline_temperature: 36.7,
    baseline_body_temperature: 36.7,
    baseline_respiration_rate: 13.0,
    baseline: {
      restingHeartRate: 65,
      minHeartRateNominal: 50,
      maxHeartRateNominal: 90,
      restingSystolicBP: 116,
      restingDiastolicBP: 74,
      baselineSpO2: 98.6,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.7,
      respiratoryRateRange: [11, 15],
      baselineHrvRmssd: 46,
    },
    currentVitals: {
      astronautId: 'astro_morgan',
      timestamp: CURRENT_ISO,
      heartRate: 66,
      heartRateVariability: 46,
      systolicBP: 117,
      diastolicBP: 75,
      spo2: 98.6,
      coreTemp: 36.7,
      respiratoryRate: 13,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: morganTrends['24H'],
    trendsByWindow: morganTrends,
    cardiovascular: morganCardio,
    musculoskeletal: morganMusculo,
    mentalHealth: morganMental,
    aiAnalysis: morganAI,
  },
  // 2. Dr. Maya Reynolds - Flight Surgeon
  {
    id: 'astro_reynolds',
    name: 'Dr. Maya Reynolds',
    callsign: 'Caduceus-2',
    role: 'Flight Surgeon',
    nationality: 'USA / NASA',
    age: 39,
    gender: 'Female',
    mission: 'Artemis Gateway Expedition II',
    is_demo: true,
    missionDay: 84,
    totalFlightHours: 3250,
    evaCount: 2,
    evaHours: 14.2,
    status: 'NOMINAL',
    avatarInitials: 'MR',
    medicalOfficerNotes:
      'Demonstration profile: Expedition Flight Surgeon supervising crew physiological countermeasure compliance. Synthetic baseline profile; not medically validated.',
    lastExamDate: '2026-11-14',
    preFlightDeltas: {
      hrDelta: 1,
      bpSystolicDelta: 1,
      bpDiastolicDelta: 1,
      weightDeltaKg: -0.4,
      estimatedBoneLossPct: 0.9,
    },
    baseline_heart_rate: 68.0,
    baseline_systolic_bp: 114.0,
    baseline_diastolic_bp: 72.0,
    baseline_spo2: 99.0,
    baseline_temperature: 36.6,
    baseline_body_temperature: 36.6,
    baseline_respiration_rate: 14.0,
    baseline: {
      restingHeartRate: 68,
      minHeartRateNominal: 52,
      maxHeartRateNominal: 90,
      restingSystolicBP: 114,
      restingDiastolicBP: 72,
      baselineSpO2: 99.0,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.6,
      respiratoryRateRange: [12, 16],
      baselineHrvRmssd: 52,
    },
    currentVitals: {
      astronautId: 'astro_reynolds',
      timestamp: CURRENT_ISO,
      heartRate: 68,
      heartRateVariability: 52,
      systolicBP: 114,
      diastolicBP: 72,
      spo2: 99.0,
      coreTemp: 36.6,
      respiratoryRate: 14,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: reynoldsTrends['24H'],
    trendsByWindow: reynoldsTrends,
    cardiovascular: reynoldsCardio,
    musculoskeletal: reynoldsMusculo,
    mentalHealth: reynoldsMental,
    aiAnalysis: reynoldsAI,
  },
  // 3. Daniel Carter - Flight Engineer
  {
    id: 'astro_carter',
    name: 'Daniel Carter',
    callsign: 'Aegis-3',
    role: 'Flight Engineer',
    nationality: 'CAN / CSA',
    age: 35,
    gender: 'Male',
    mission: 'Artemis Gateway Expedition II',
    is_demo: true,
    missionDay: 84,
    totalFlightHours: 1890,
    evaCount: 2,
    evaHours: 19.0,
    status: 'CAUTION',
    avatarInitials: 'DC',
    medicalOfficerNotes:
      'Demonstration profile: Systems Flight Engineer. Demonstrating post-exercise autonomic strain scenario. Synthetic baseline profile; not medically validated.',
    lastExamDate: '2026-11-13',
    preFlightDeltas: {
      hrDelta: 14,
      bpSystolicDelta: 10,
      bpDiastolicDelta: 6,
      weightDeltaKg: -1.6,
      estimatedBoneLossPct: 1.8,
    },
    baseline_heart_rate: 74.0,
    baseline_systolic_bp: 122.0,
    baseline_diastolic_bp: 80.0,
    baseline_spo2: 97.8,
    baseline_temperature: 36.9,
    baseline_body_temperature: 36.9,
    baseline_respiration_rate: 16.0,
    baseline: {
      restingHeartRate: 74,
      minHeartRateNominal: 55,
      maxHeartRateNominal: 98,
      restingSystolicBP: 122,
      restingDiastolicBP: 80,
      baselineSpO2: 97.8,
      minSpO2Nominal: 94.0,
      baselineCoreTemp: 36.9,
      respiratoryRateRange: [12, 18],
      baselineHrvRmssd: 42,
    },
    currentVitals: {
      astronautId: 'astro_carter',
      timestamp: CURRENT_ISO,
      heartRate: 88,
      heartRateVariability: 19,
      systolicBP: 132,
      diastolicBP: 86,
      spo2: 96.4,
      coreTemp: 37.2,
      respiratoryRate: 18,
      status: 'CAUTION',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: carterTrends['24H'],
    trendsByWindow: carterTrends,
    cardiovascular: carterCardio,
    musculoskeletal: carterMusculo,
    mentalHealth: carterMental,
    aiAnalysis: carterAI,
  },
  // 4. Sofia Bennett - Mission Specialist
  {
    id: 'astro_bennett',
    name: 'Sofia Bennett',
    callsign: 'Nova-4',
    role: 'Mission Specialist',
    nationality: 'USA / NASA',
    age: 33,
    gender: 'Female',
    mission: 'Artemis Gateway Expedition II',
    is_demo: true,
    missionDay: 84,
    totalFlightHours: 1540,
    evaCount: 1,
    evaHours: 6.5,
    status: 'NOMINAL',
    avatarInitials: 'SB',
    medicalOfficerNotes:
      'Demonstration profile: Mission Specialist conducting biological microgravity research. Synthetic baseline profile; not medically validated.',
    lastExamDate: '2026-11-11',
    preFlightDeltas: {
      hrDelta: 2,
      bpSystolicDelta: 2,
      bpDiastolicDelta: 1,
      weightDeltaKg: -0.5,
      estimatedBoneLossPct: 1.0,
    },
    baseline_heart_rate: 62.0,
    baseline_systolic_bp: 112.0,
    baseline_diastolic_bp: 70.0,
    baseline_spo2: 98.9,
    baseline_temperature: 36.5,
    baseline_body_temperature: 36.5,
    baseline_respiration_rate: 12.0,
    baseline: {
      restingHeartRate: 62,
      minHeartRateNominal: 48,
      maxHeartRateNominal: 86,
      restingSystolicBP: 112,
      restingDiastolicBP: 70,
      baselineSpO2: 98.9,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.5,
      respiratoryRateRange: [10, 15],
      baselineHrvRmssd: 48,
    },
    currentVitals: {
      astronautId: 'astro_bennett',
      timestamp: CURRENT_ISO,
      heartRate: 64,
      heartRateVariability: 46,
      systolicBP: 114,
      diastolicBP: 72,
      spo2: 98.8,
      coreTemp: 36.6,
      respiratoryRate: 12,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: bennettTrends['24H'],
    trendsByWindow: bennettTrends,
    cardiovascular: bennettCardio,
    musculoskeletal: bennettMusculo,
    mentalHealth: bennettMental,
    aiAnalysis: bennettAI,
  },
  // 5. Major Marcus Chen (Preserved Primary DB Seed: astro_03)
  {
    id: 'astro_03',
    name: 'Major Marcus Chen',
    callsign: 'Apex-3',
    role: 'Flight Engineer / Science Officer',
    nationality: 'USA / NASA',
    age: 36,
    gender: 'Male',
    mission: 'Artemis Lunar Transit',
    is_demo: true,
    missionDay: 42,
    totalFlightHours: 2450,
    evaCount: 3,
    evaHours: 21.0,
    status: 'NOMINAL',
    avatarInitials: 'MC',
    medicalOfficerNotes:
      'Primary seeded crew member matching SQLite backend baseline. Autonomic adaptation to translunar injection nominal. High countermeasure compliance.',
    lastExamDate: '2026-11-14',
    preFlightDeltas: {
      hrDelta: 2,
      bpSystolicDelta: 0,
      bpDiastolicDelta: 0,
      weightDeltaKg: -0.5,
      estimatedBoneLossPct: 1.0,
    },
    baseline_heart_rate: 72.0,
    baseline_systolic_bp: 120.0,
    baseline_diastolic_bp: 78.0,
    baseline_spo2: 98.2,
    baseline_temperature: 36.8,
    baseline_body_temperature: 36.8,
    baseline_respiration_rate: 15.0,
    baseline: {
      restingHeartRate: 72,
      minHeartRateNominal: 55,
      maxHeartRateNominal: 90,
      restingSystolicBP: 120,
      restingDiastolicBP: 78,
      baselineSpO2: 98.2,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.8,
      respiratoryRateRange: [12, 17],
      baselineHrvRmssd: 44,
    },
    currentVitals: {
      astronautId: 'astro_03',
      timestamp: CURRENT_ISO,
      heartRate: 72,
      heartRateVariability: 44,
      systolicBP: 120,
      diastolicBP: 78,
      spo2: 98.2,
      coreTemp: 36.8,
      respiratoryRate: 15,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: marcusChenTrends['24H'],
    trendsByWindow: marcusChenTrends,
    cardiovascular: marcusChenCardio,
    musculoskeletal: marcusChenMusculo,
    mentalHealth: marcusChenMental,
    aiAnalysis: marcusChenAI,
  },
];

export const MOCK_ALERTS: HealthAlert[] = [
  {
    id: 'ALT-001',
    astronautId: 'astro_carter',
    astronautName: 'Daniel Carter',
    category: 'CARDIOVASCULAR',
    severity: 'CAUTION',
    status: 'ACTIVE',
    title: 'Autonomic Strain & Low Heart Rate Variability',
    whatIsChanging: 'Resting RMSSD dropped to 19ms with sustained post-exercise tachycardia (+14 bpm drift).',
    whyItMatters: 'Cephalad fluid redistribution and reduced effective circulating blood volume increase risk of pre-syncopal orthostatic intolerance.',
    physiologicalExplanation:
      'RMSSD dropped to 19ms (baseline: 42ms) with sustained post-exercise resting tachycardia. Microgravity cephalad fluid shift coupled with hypovolemia indicates cardiovascular autonomic deconditioning.',
    countermeasure:
      'Initiate oral isotonic rehydration protocol (1.0 L sodium-electrolyte solution) and reduce subsequent ARED resistance cycle intensity by 15%.',
    suggestedFurtherAssessment: 'Perform 10-minute tilt table or LBNP (Lower Body Negative Pressure) vascular assessment.',
    evidenceReference: 'NASA Human Research Program (HRP) Cardiovascular Risk Standard & NASA-STD-3001',
    timestamp: '2026-11-14T09:42:00Z',
    acknowledged: false,
    astronaut_id: 'astro_carter',
    message: 'Resting RMSSD dropped to 19ms with sustained post-exercise tachycardia (+14 bpm drift).',
    confidence_score: 0.93,
    recommendation: 'Initiate oral isotonic rehydration protocol (1.0 L sodium-electrolyte solution).',
    is_acknowledged: false,
  },
  {
    id: 'ALT-002',
    astronautId: 'ASTRO-ALL',
    astronautName: 'Expedition Crew (All)',
    category: 'RADIATION',
    severity: 'CRITICAL',
    status: 'ACTIVE',
    title: 'Solar Particle Event (SEP) Enhanced Flux Warning',
    whatIsChanging: 'Cabin dosimeter reading spiked to 42.5 µGy/hr following arrival of energetic proton wave.',
    whyItMatters: 'Acute solar particle events can elevate radiation exposure toward quarterly threshold limits and induce chromosomal DNA damage.',
    physiologicalExplanation:
      'DONKI API event feed correlates with cabin dosimeter escalation (measured peak 42.5 μGy/hr, baseline 18.2 μGy/hr). Coronal mass ejection proton arrival window active.',
    countermeasure:
      'Cease EVA staging immediately. Direct all crew members to maintain operational duty within the heavily shielded service module water-wall storm shelter.',
    suggestedFurtherAssessment: 'Continually poll NASA DONKI / NOAA SWPC real-time proton flux decay curve until rates drop below 25 µGy/hr.',
    evidenceReference: 'NASA Space Weather Database (DONKI) SEP-2026-11-A & Space Radiation Program Guidelines',
    timestamp: '2026-11-14T10:15:00Z',
    acknowledged: false,
    astronaut_id: 'ASTRO-ALL',
    message: 'Cabin dosimeter reading spiked to 42.5 µGy/hr following arrival of energetic proton wave.',
    confidence_score: 0.98,
    recommendation: 'Direct all crew members to maintain operational duty within the service module water-wall storm shelter.',
    is_acknowledged: false,
  },
  {
    id: 'ALT-003',
    astronautId: 'astro_bennett',
    astronautName: 'Sofia Bennett',
    category: 'SLEEP_PSYCH',
    severity: 'CAUTION',
    status: 'ACKNOWLEDGED',
    title: 'Circadian Phase Disruption & Acute Sleep Deficit',
    whatIsChanging: 'Sleep duration constrained to 4.2 hours with 32% sleep fragmentation index.',
    whyItMatters: 'Cognitive slowdown, reaction latency during robotic arm operations, and elevated risk of attentional lapses.',
    physiologicalExplanation:
      'Sleep tracking logged 4.2 hours in the preceding 24-hour cycle with elevated sleep fragmentation index. Melatonin release inhibition secondary to workstation blue spectrum exposure.',
    countermeasure:
      'Switch workstation display color temperature to 2700K blue-depleted mode. Prescribe 45-minute scheduled tactical sleep opportunity prior to robotic arm arming.',
    suggestedFurtherAssessment: 'Administer 5-minute Psychomotor Vigilance Test (PVT-B) prior to critical operations.',
    evidenceReference: 'NASA HRP Behavioral Health & Performance (BHP) Circadian Protocol & Ames Sleep Matrix',
    timestamp: '2026-11-14T08:10:00Z',
    acknowledged: true,
    astronaut_id: 'astro_bennett',
    message: 'Sleep duration constrained to 4.2 hours with elevated sleep fragmentation index.',
    confidence_score: 0.89,
    recommendation: 'Switch workstation display color temperature to 2700K blue-depleted mode.',
    is_acknowledged: true,
  },
  {
    id: 'ALT-004',
    astronautId: 'astro_carter',
    astronautName: 'Daniel Carter',
    category: 'MUSCULOSKELETAL',
    severity: 'CAUTION',
    status: 'ACTIVE',
    title: 'Elevated Urinary Calcium Excretion & Nephrolithiasis Risk',
    whatIsChanging: 'Urinary calcium excretion measured at 315 mg/day (baseline < 250 mg/day).',
    whyItMatters: 'Hypercalciuria secondary to weightless osteoclastic bone resorption increases the risk of renal calculi (kidney stone formation).',
    physiologicalExplanation:
      'Bone demineralization due to lack of gravity loading releases free calcium into the bloodstream, which is filtered renally into urine in high concentrations.',
    countermeasure:
      'Increase daily fluid intake to minimum 3.0 L/day to maintain urine dilution. Review dietary sodium intake to prevent hypercalciuria exacerbation.',
    suggestedFurtherAssessment: 'Analyze spot urine pH and citrate concentration via onboard bio-analyzer.',
    evidenceReference: 'NASA HRP Renal Stone Risk Stand & Johnson Space Center Nutrition Standards',
    timestamp: '2026-11-13T16:30:00Z',
    acknowledged: false,
    astronaut_id: 'astro_carter',
    message: 'Urinary calcium excretion measured at 315 mg/day (baseline < 250 mg/day).',
    confidence_score: 0.88,
    recommendation: 'Increase daily fluid intake to minimum 3.0 L/day to maintain urine dilution.',
    is_acknowledged: false,
  },
  {
    id: 'ALT-005',
    astronautId: 'astro_morgan',
    astronautName: 'Commander Alex Morgan',
    category: 'ENVIRONMENTAL',
    severity: 'INFO',
    status: 'RESOLVED',
    title: 'Cabin CO2 Transient Micro-Elevation Resolved',
    whatIsChanging: 'Node 2 carbon dioxide level transiently rose to 3.2 mmHg during co-located exercise session.',
    whyItMatters: 'Elevated CO2 above 3.5 mmHg can cause crew headache, visual disturbances, and neurovestibular discomfort in microgravity.',
    physiologicalExplanation:
      'Localized exhaled CO2 pocketing occurred near exercise station before cabin air scrubber ventilation cycle balanced atmospheric mixing.',
    countermeasure:
      'Life support scrubber cycle increased to high-throughput mode. Atmospheric CO2 successfully reduced to nominal 1.8 mmHg.',
    suggestedFurtherAssessment: 'Verify portable cabin air circulation fans in Node 2 vestibule.',
    evidenceReference: 'NASA Environmental Control and Life Support System (ECLSS) Standards',
    timestamp: '2026-11-12T11:00:00Z',
    acknowledged: true,
    astronaut_id: 'astro_morgan',
    message: 'Node 2 carbon dioxide level transiently rose to 3.2 mmHg during co-located exercise session.',
    confidence_score: 0.95,
    recommendation: 'Life support scrubber cycle increased to high-throughput mode.',
    is_acknowledged: true,
  },
  {
    id: 'ALT-006',
    astronautId: 'astro_03',
    astronautName: 'Major Marcus Chen',
    category: 'CARDIOVASCULAR',
    severity: 'INFO',
    status: 'RESOLVED',
    title: 'Translunar Injection Post-Burn Vitals Nominal',
    whatIsChanging: 'Heart rate stabilized at baseline (72 bpm) following nominal completion of TLI burn.',
    whyItMatters: 'Confirms autonomic cardiovascular recovery following high-G mission phase.',
    physiologicalExplanation:
      'Hemodynamic response to translunar acceleration burn resolved promptly to personal baseline vitals.',
    countermeasure: 'Resume scheduled baseline telemetry cycle.',
    suggestedFurtherAssessment: 'Log 24-hour continuous Holter rhythm check.',
    evidenceReference: 'NASA Flight Medicine Clinical Practice Guidelines',
    timestamp: '2026-11-14T06:00:00Z',
    acknowledged: true,
    astronaut_id: 'astro_03',
    message: 'Translunar injection burn physiological recovery nominal.',
    confidence_score: 0.96,
    recommendation: 'Maintain standard mission transit monitoring.',
    is_acknowledged: true,
  },
];

export const MOCK_MISSION_SUMMARY: MissionSummary = {
  missionName: 'ARTEMIS GATEWAY EXPEDITION II • TRANSLUNAR MISSION',
  missionElapsedDays: 84,
  totalCrewCount: 5,
  nominalCrewCount: 4,
  cautionCrewCount: 1,
  alertCrewCount: 0,
  spaceWeatherCondition: 'M1.2 Class Flare / Solar Energetic Proton Wave Active',
  radiationExposureRate: '42.5 μGy/hr (Elevated Storm Shelter Advisory)',
  telemetrySyncTime: CURRENT_ISO,
  dataSource: 'SIMULATED TELEMETRY',
};

// Helper to generate full flight-surgeon executive reports
export function generateHealthReport(
  astronaut: AstronautProfile,
  timeframe: '7_DAY_WEEKLY' | 'MISSION_TO_DATE'
): MissionHealthReport {
  const isWeekly = timeframe === '7_DAY_WEEKLY';

  return {
    astronautId: astronaut.id,
    astronautName: astronaut.name,
    callsign: astronaut.callsign,
    role: astronaut.role,
    missionDay: astronaut.missionDay,
    reportGeneratedUtc: new Date().toISOString(),
    timeframe,
    executiveSummary:
      astronaut.status === 'NOMINAL'
        ? `Astronaut ${astronaut.name} continues to demonstrate superior physiological resilience across all clinical domains. Vital signs, cardiovascular autonomic tone, and musculoskeletal preservation reflect high compliance with prescribed NASA countermeasure regimens. No operational flight constraints indicated.`
        : `Astronaut ${astronaut.name} is currently flagged under clinical CAUTION surveillance. Primary concerns center on ${
            astronaut.id === 'astro_carter' || astronaut.id === 'ASTRO-02'
              ? 'autonomic deconditioning (HRV suppression) and mild hypercalciuria.'
              : 'circadian phase desynchronosis and acute sleep debt from recent workload scheduling.'
          } Targeted evidence-based countermeasures have been initiated with close telemetry observation.`,
    vitalsSummary: {
      avgHeartRate: astronaut.currentVitals.heartRate,
      avgSpo2: astronaut.currentVitals.spo2,
      avgSystolicBP: astronaut.currentVitals.systolicBP,
      avgDiastolicBP: astronaut.currentVitals.diastolicBP,
      avgHrvRmssd: astronaut.currentVitals.heartRateVariability,
    },
    cardiovascularSummary: {
      restingHrDrift: astronaut.cardiovascular.restingHrDrift,
      meanArterialPressure: astronaut.cardiovascular.meanArterialPressure,
      orthostaticReadinessScore: astronaut.cardiovascular.orthostaticToleranceScore,
      status: astronaut.cardiovascular.fluidShiftSeverity,
    },
    musculoskeletalSummary: {
      femoralNeckBmdLossPct: astronaut.musculoskeletal.femoralNeckBmdDeltaPct,
      lumbarSpineBmdLossPct: astronaut.musculoskeletal.lumbarSpineBmdDeltaPct,
      lowerLimbMuscleLossPct: astronaut.musculoskeletal.lowerLimbMuscleVolumeDeltaPct,
      aredAdherencePct: astronaut.musculoskeletal.aredCompliancePct,
    },
    radiationSummary: {
      cumulativeMissionDoseMsv: isWeekly ? 5.8 : 54.2,
      careerDosePct:
        MOCK_RADIATION_DATA.crewDoses.find((c) => c.astronautId === astronaut.id)?.careerLimitPct || 25.0,
      status: 'Active Solar Particle Decay Monitoring',
    },
    behavioralSummary: {
      avgSleepDurationHours: astronaut.mentalHealth.weeklyAvgSleepHours,
      sleepEfficiencyPct: astronaut.mentalHealth.weeklyAvgEfficiencyPct,
      circadianScore: astronaut.mentalHealth.currentCircadianAlignment,
      stressIndex: astronaut.mentalHealth.currentStressIndex,
      status: astronaut.mentalHealth.currentCircadianAlignment >= 80 ? 'Nominal Sync' : 'Circadian Delay',
    },
    activeAlertsCount: MOCK_ALERTS.filter(
      (a) => (a.astronautId === astronaut.id || a.astronautId === 'ASTRO-ALL') && a.status === 'ACTIVE'
    ).length,
    nasaResearchContext:
      'Evaluation benchmarks derived from NASA Space Flight Human-System Standard (NASA-STD-3001) and NASA Human Research Program (HRP) Evidence Books.',
    surgeonSignOff: 'Dr. Maya Reynolds, Lead Flight Surgeon & Medical Officer (Expedition 75)',
  };
}
