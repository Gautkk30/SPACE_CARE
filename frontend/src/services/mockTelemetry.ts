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
    { astronautId: 'ASTRO-01', astronautName: 'Elena Rostova', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 184.5, careerLimitMsv: 600, careerLimitPct: 30.8 },
    { astronautId: 'ASTRO-02', astronautName: 'Marcus Vance', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 98.4, careerLimitMsv: 600, careerLimitPct: 16.4 },
    { astronautId: 'ASTRO-03', astronautName: 'Dr. Kenji Sato', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 156.2, careerLimitMsv: 600, careerLimitPct: 26.0 },
    { astronautId: 'ASTRO-04', astronautName: 'Sarah Lin', cumulativeMissionDoseMsv: 54.2, careerDoseMsv: 54.2, careerLimitMsv: 600, careerLimitPct: 9.0 },
  ],
};

// ------------------------------------------------------------------------------
// Assemble 4 Astronaut Profiles
// ------------------------------------------------------------------------------

// Elena Rostova
const elenaTrends = generateTrends(64, 46, 116, 74, 98.4, 36.8, 14);
const elenaCardio = generateCardiovascular(64, 116, 74, 46, 2, 91, 'Mild Cephalad Shift');
const elenaMusculo = generateMusculoskeletal(-1.1, -0.9, -1.4, -2.1, 98, 96, 'LOW', 195);
const elenaMental = generateMentalHealth(92, 3, 4, 1.9, 1.8, 3.6, 91, 'Feeling well adapted. Exercise countermeasure adherence high; cognitive clarity sustained.');

// Marcus Vance (Deconditioning & Autonomic Strain)
const marcusTrends = generateTrends(68, 42, 120, 78, 98.0, 36.9, 14, { hour: 9, hrDelta: 20, spo2Delta: -1.6, sysDelta: 14 });
const marcusCardio = generateCardiovascular(68, 120, 78, 42, 14, 68, 'Moderate Redistribution');
const marcusMusculo = generateMusculoskeletal(-1.8, -1.6, -2.2, -4.6, 82, 80, 'ELEVATED', 315);
const marcusMental = generateMentalHealth(78, 6, 3, 1.2, 1.4, 3.9, 78, 'Post-exercise recovery feeling sluggish. Mild leg heaviness during ergometer intervals.');

// Dr. Kenji Sato
const kenjiTrends = generateTrends(60, 52, 114, 72, 98.8, 36.7, 13);
const kenjiCardio = generateCardiovascular(60, 114, 72, 52, 1, 94, 'Nominal');
const kenjiMusculo = generateMusculoskeletal(-0.9, -0.7, -1.1, -1.6, 100, 98, 'LOW', 180);
const kenjiMental = generateMentalHealth(95, 2, 5, 2.1, 2.0, 3.4, 94, 'Sleep quality excellent. Maintaining scheduled mindfulness and circadian light hygiene.');

// Sarah Lin (Circadian Strain)
const sarahTrends = generateTrends(62, 38, 112, 70, 99.0, 36.8, 14, { hour: 4, hrDelta: 12, spo2Delta: -0.9, sysDelta: 8 });
const sarahCardio = generateCardiovascular(62, 112, 70, 38, 6, 83, 'Mild Cephalad Shift');
const sarahMusculo = generateMusculoskeletal(-1.4, -1.2, -1.7, -2.8, 91, 88, 'LOW', 220);
const sarahMental = generateMentalHealth(64, 7, 2, 0.9, 1.1, 2.8, 69, 'Sleep fragmented due to experiment schedule shift. Experiencing mild morning cognitive fog and screen glare fatigue.');

export const MOCK_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'ASTRO-01',
    name: 'Elena Rostova',
    callsign: 'Vanguard-1',
    role: 'Commander / Mission Lead',
    nationality: 'USA / NASA',
    age: 44,
    missionDay: 84,
    totalFlightHours: 4120,
    evaCount: 4,
    evaHours: 28.5,
    status: 'NOMINAL',
    avatarInitials: 'ER',
    medicalOfficerNotes:
      'Nominal physiological adaptation to microgravity. ARED compliance 98%. Resting hemodynamics stable with minimal orthostatic vulnerability. Neurovestibular adaptation complete.',
    lastExamDate: '2026-11-12',
    preFlightDeltas: {
      hrDelta: 2,
      bpSystolicDelta: -2,
      bpDiastolicDelta: 1,
      weightDeltaKg: -0.8,
      estimatedBoneLossPct: 1.1,
    },
    baseline: {
      restingHeartRate: 64,
      minHeartRateNominal: 50,
      maxHeartRateNominal: 90,
      restingSystolicBP: 116,
      restingDiastolicBP: 74,
      baselineSpO2: 98.4,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.8,
      respiratoryRateRange: [12, 16],
      baselineHrvRmssd: 46,
    },
    currentVitals: {
      astronautId: 'ASTRO-01',
      timestamp: CURRENT_ISO,
      heartRate: 66,
      heartRateVariability: 46,
      systolicBP: 118,
      diastolicBP: 75,
      spo2: 98.2,
      coreTemp: 36.8,
      respiratoryRate: 14,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: elenaTrends['24H'],
    trendsByWindow: elenaTrends,
    cardiovascular: elenaCardio,
    musculoskeletal: elenaMusculo,
    mentalHealth: elenaMental,
  },
  {
    id: 'ASTRO-02',
    name: 'Marcus Vance',
    callsign: 'Aegis-2',
    role: 'Flight Engineer / Systems Officer',
    nationality: 'CAN / CSA',
    age: 39,
    missionDay: 84,
    totalFlightHours: 1890,
    evaCount: 2,
    evaHours: 19.0,
    status: 'CAUTION',
    avatarInitials: 'MV',
    medicalOfficerNotes:
      'Exhibiting autonomic cardiac strain post-exercise. HRV suppression (RMSSD 19ms) and compensatory resting tachycardia noted. Fluid redistribution and mild hypovolemia suspected. Oral isotonic hydration protocol active.',
    lastExamDate: '2026-11-13',
    preFlightDeltas: {
      hrDelta: 14,
      bpSystolicDelta: 12,
      bpDiastolicDelta: 8,
      weightDeltaKg: -1.6,
      estimatedBoneLossPct: 1.8,
    },
    baseline: {
      restingHeartRate: 68,
      minHeartRateNominal: 52,
      maxHeartRateNominal: 92,
      restingSystolicBP: 120,
      restingDiastolicBP: 78,
      baselineSpO2: 98.0,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.9,
      respiratoryRateRange: [12, 18],
      baselineHrvRmssd: 42,
    },
    currentVitals: {
      astronautId: 'ASTRO-02',
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
    trend24h: marcusTrends['24H'],
    trendsByWindow: marcusTrends,
    cardiovascular: marcusCardio,
    musculoskeletal: marcusMusculo,
    mentalHealth: marcusMental,
  },
  {
    id: 'ASTRO-03',
    name: 'Dr. Kenji Sato',
    callsign: 'Caduceus-3',
    role: 'Medical Officer / Mission Specialist',
    nationality: 'JPN / JAXA',
    age: 47,
    missionDay: 84,
    totalFlightHours: 3250,
    evaCount: 2,
    evaHours: 14.2,
    status: 'NOMINAL',
    avatarInitials: 'KS',
    medicalOfficerNotes:
      'All biomedical indicators within normal tolerances. Rigorous adherence to CEVIS cycle ergometer and resistive exercise protocols. Baroreflex and autonomic tone robust.',
    lastExamDate: '2026-11-14',
    preFlightDeltas: {
      hrDelta: 1,
      bpSystolicDelta: 1,
      bpDiastolicDelta: 2,
      weightDeltaKg: -0.4,
      estimatedBoneLossPct: 0.9,
    },
    baseline: {
      restingHeartRate: 60,
      minHeartRateNominal: 48,
      maxHeartRateNominal: 85,
      restingSystolicBP: 114,
      restingDiastolicBP: 72,
      baselineSpO2: 98.8,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.7,
      respiratoryRateRange: [11, 15],
      baselineHrvRmssd: 52,
    },
    currentVitals: {
      astronautId: 'ASTRO-03',
      timestamp: CURRENT_ISO,
      heartRate: 62,
      heartRateVariability: 52,
      systolicBP: 115,
      diastolicBP: 74,
      spo2: 98.6,
      coreTemp: 36.7,
      respiratoryRate: 13,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: kenjiTrends['24H'],
    trendsByWindow: kenjiTrends,
    cardiovascular: kenjiCardio,
    musculoskeletal: kenjiMusculo,
    mentalHealth: kenjiMental,
  },
  {
    id: 'ASTRO-04',
    name: 'Sarah Lin',
    callsign: 'Kepler-4',
    role: 'Payload Specialist / Bio-researcher',
    nationality: 'USA / NASA',
    age: 34,
    missionDay: 84,
    totalFlightHours: 720,
    evaCount: 1,
    evaHours: 8.0,
    status: 'CAUTION',
    avatarInitials: 'SL',
    medicalOfficerNotes:
      'Sub-acute circadian phase misalignment following consecutive night-pass experiment runs. Melatonin suppression suspected from high blue-spectrum workstation exposure. Prescribed light therapy adjustments.',
    lastExamDate: '2026-11-11',
    preFlightDeltas: {
      hrDelta: 6,
      bpSystolicDelta: 6,
      bpDiastolicDelta: 4,
      weightDeltaKg: -1.1,
      estimatedBoneLossPct: 1.4,
    },
    baseline: {
      restingHeartRate: 62,
      minHeartRateNominal: 50,
      maxHeartRateNominal: 88,
      restingSystolicBP: 112,
      restingDiastolicBP: 70,
      baselineSpO2: 99.0,
      minSpO2Nominal: 95.0,
      baselineCoreTemp: 36.8,
      respiratoryRateRange: [12, 16],
      baselineHrvRmssd: 38,
    },
    currentVitals: {
      astronautId: 'ASTRO-04',
      timestamp: CURRENT_ISO,
      heartRate: 74,
      heartRateVariability: 31,
      systolicBP: 118,
      diastolicBP: 76,
      spo2: 97.5,
      coreTemp: 37.0,
      respiratoryRate: 15,
      status: 'CAUTION',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: sarahTrends['24H'],
    trendsByWindow: sarahTrends,
    cardiovascular: sarahCardio,
    musculoskeletal: sarahMusculo,
    mentalHealth: sarahMental,
  },
];

export const MOCK_ALERTS: HealthAlert[] = [
  {
    id: 'ALT-001',
    astronautId: 'ASTRO-02',
    astronautName: 'Marcus Vance',
    category: 'CARDIOVASCULAR',
    severity: 'CAUTION',
    title: 'Autonomic Strain & Low Heart Rate Variability',
    physiologicalExplanation:
      'RMSSD dropped to 19ms (baseline: 42ms) with sustained post-exercise resting tachycardia. Microgravity cephalad fluid shift coupled with hypovolemia indicates cardiovascular autonomic deconditioning.',
    countermeasure:
      'Initiate oral isotonic rehydration protocol (1.0 L sodium-electrolyte solution) and reduce subsequent ARED resistance cycle intensity by 15%.',
    evidenceReference: 'NASA Human Research Program (HRP) Cardiovascular Risk Standard & NASA-STD-3001',
    timestamp: '2026-11-14T09:42:00Z',
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    astronautId: 'ASTRO-ALL',
    astronautName: 'Expedition Crew (All)',
    category: 'RADIATION',
    severity: 'CRITICAL',
    title: 'Solar Particle Event (SEP) Enhanced Flux Warning',
    physiologicalExplanation:
      'DONKI API event feed correlates with cabin dosimeter escalation (measured peak 42.5 μGy/hr, baseline 18.2 μGy/hr). Coronal mass ejection proton arrival window active.',
    countermeasure:
      'Cease EVA staging immediately. Direct all crew members to maintain operational duty within the heavily shielded service module water-wall storm shelter.',
    evidenceReference: 'NASA Space Weather Database (DONKI) SEP-2026-11-A & Space Radiation Program Guidelines',
    timestamp: '2026-11-14T10:15:00Z',
    acknowledged: false,
  },
  {
    id: 'ALT-003',
    astronautId: 'ASTRO-04',
    astronautName: 'Sarah Lin',
    category: 'SLEEP_PSYCH',
    severity: 'CAUTION',
    title: 'Circadian Phase Disruption & Acute Sleep Deficit',
    physiologicalExplanation:
      'Sleep tracking logged 3.8 hours in the preceding 24-hour cycle with elevated sleep fragmentation index (38%). Melatonin release inhibition secondary to workstation blue spectrum exposure.',
    countermeasure:
      'Switch workstation display color temperature to 2700K blue-depleted mode. Prescribe 45-minute scheduled tactical sleep opportunity prior to robotic arm arming.',
    evidenceReference: 'NASA HRP Behavioral Health & Performance (BHP) Circadian Protocol & Ames Sleep Matrix',
    timestamp: '2026-11-14T08:10:00Z',
    acknowledged: true,
  },
];

export const MOCK_MISSION_SUMMARY: MissionSummary = {
  missionName: 'ISS EXPEDITION 75 • DEEP SPACE ANALOG',
  missionElapsedDays: 84,
  totalCrewCount: 4,
  nominalCrewCount: 2,
  cautionCrewCount: 2,
  alertCrewCount: 0,
  spaceWeatherCondition: 'M1.2 Class Flare / Solar Energetic Proton Wave Active',
  radiationExposureRate: '42.5 μGy/hr (Elevated Storm Shelter Advisory)',
  telemetrySyncTime: CURRENT_ISO,
  dataSource: 'SIMULATED TELEMETRY',
};
