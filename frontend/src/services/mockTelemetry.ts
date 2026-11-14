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
 * - NASA Human Research Program (HRP) Evidence Books (Cardiovascular, Musculoskeletal, Behavior)
 * - NASA Space Flight Human-System Standard (NASA-STD-3001)
 * - NASA Open Science Data Repository (OSDR) - Baseline physiological ranges
 * - NASA Space Weather Database Of Notifications, Knowledge, Innovations (DONKI)
 * 
 * Simulated values MUST NOT be interpreted as authentic operational astronaut clinical biometrics.
 */

import { AstronautProfile, HealthAlert, MissionSummary, VitalTrendPoint } from '../types/spacecare';

const CURRENT_ISO = "2026-11-14T10:30:00Z";

// Helper to generate 24 hours of trend data with physiological realism
function generate24HourTrend(
  baseHr: number,
  baseSpo2: number,
  baseTemp: number,
  baseResp: number,
  anomalyConfig?: { hour: number; hrDelta: number; spo2Delta: number }
): VitalTrendPoint[] {
  const points: VitalTrendPoint[] = [];

  for (let i = 0; i < 24; i++) {
    const hour = (i + 11) % 24; // Start 24 hours prior leading up to 10:00
    const timeLabel = `${hour.toString().padStart(2, '0')}:00`;

    // Circadian variation: lower during sleep (hours 22:00 - 06:00), higher during EVA/exercise (14:00 - 16:00)
    let hrVariation = Math.sin((i / 24) * 2 * Math.PI) * 6;
    let spo2Variation = (Math.cos((i / 24) * 2 * Math.PI) * 0.4);

    if (hour >= 23 || hour <= 6) {
      hrVariation -= 8; // resting/sleep
    } else if (hour >= 14 && hour <= 16) {
      hrVariation += 18; // countermeasure exercise window
      spo2Variation -= 0.6;
    }

    // Apply specific anomaly injection if configured
    let anomalyHr = 0;
    let anomalySpo2 = 0;
    if (anomalyConfig && hour === anomalyConfig.hour) {
      anomalyHr = anomalyConfig.hrDelta;
      anomalySpo2 = anomalyConfig.spo2Delta;
    }

    const currentHr = Math.round(baseHr + hrVariation + anomalyHr + (Math.random() * 2 - 1));
    const currentSpo2 = Number((baseSpo2 + spo2Variation + anomalySpo2).toFixed(1));
    const currentTemp = Number((baseTemp + (Math.sin((i / 24) * 2 * Math.PI) * 0.25)).toFixed(1));
    const currentResp = Math.round(baseResp + (Math.sin((i / 24) * 2 * Math.PI) * 1.5));

    points.push({
      timestamp: `2026-11-14T${hour.toString().padStart(2, '0')}:00:00Z`,
      timeLabel,
      heartRate: currentHr,
      spo2: Math.min(100, Math.max(92, currentSpo2)),
      coreTemp: currentTemp,
      respiratoryRate: currentResp,
      hrBaselineMin: baseHr - 12,
      hrBaselineMax: baseHr + 25,
      spo2BaselineMin: 95.0,
    });
  }

  return points;
}

export const MOCK_ASTRONAUTS: AstronautProfile[] = [
  {
    id: 'ASTRO-01',
    name: 'Elena Rostova',
    callsign: 'Vanguard-1',
    role: 'Commander / Mission Lead',
    age: 44,
    missionDay: 84,
    evaHours: 28.5,
    status: 'NOMINAL',
    avatarInitials: 'ER',
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
    },
    currentVitals: {
      astronautId: 'ASTRO-01',
      timestamp: CURRENT_ISO,
      heartRate: 66,
      heartRateVariability: 46, // RMSSD in ms
      systolicBP: 118,
      diastolicBP: 75,
      spo2: 98.2,
      coreTemp: 36.8,
      respiratoryRate: 14,
      status: 'NOMINAL',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: generate24HourTrend(64, 98.4, 36.8, 14),
  },
  {
    id: 'ASTRO-02',
    name: 'Marcus Vance',
    callsign: 'Aegis-2',
    role: 'Flight Engineer / Systems Officer',
    age: 39,
    missionDay: 84,
    evaHours: 19.0,
    status: 'CAUTION',
    avatarInitials: 'MV',
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
    },
    currentVitals: {
      astronautId: 'ASTRO-02',
      timestamp: CURRENT_ISO,
      heartRate: 88, // Elevated resting HR
      heartRateVariability: 19, // Severely suppressed HRV (RMSSD < 20ms)
      systolicBP: 132,
      diastolicBP: 86,
      spo2: 96.4,
      coreTemp: 37.2,
      respiratoryRate: 18,
      status: 'CAUTION',
      dataSource: 'SIMULATED TELEMETRY',
    },
    trend24h: generate24HourTrend(68, 98.0, 36.9, 14, { hour: 9, hrDelta: 18, spo2Delta: -1.6 }),
  },
  {
    id: 'ASTRO-03',
    name: 'Dr. Kenji Sato',
    callsign: 'Caduceus-3',
    role: 'Medical Officer / Mission Specialist',
    age: 47,
    missionDay: 84,
    evaHours: 14.2,
    status: 'NOMINAL',
    avatarInitials: 'KS',
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
    trend24h: generate24HourTrend(60, 98.8, 36.7, 13),
  },
  {
    id: 'ASTRO-04',
    name: 'Sarah Lin',
    callsign: 'Kepler-4',
    role: 'Payload Specialist / Bio-researcher',
    age: 34,
    missionDay: 84,
    evaHours: 8.0,
    status: 'CAUTION',
    avatarInitials: 'SL',
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
    trend24h: generate24HourTrend(62, 99.0, 36.8, 14, { hour: 4, hrDelta: 10, spo2Delta: -0.8 }),
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
