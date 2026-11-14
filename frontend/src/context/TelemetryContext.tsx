/**
 * SPACECARE - Global Telemetry, Alerts & Crew State Management
 * NASA Space Apps Challenge 2026
 * 
 * Provides unified, reactive state across all dashboard pages:
 * - Live and simulated telemetry streams per astronaut
 * - Automatic evaluation of incoming biometrics against SQLite baselines
 * - Immediate calculation of latest snapshots, averages, deltas, and time-series points
 * - Global alert queue synchronized with backend and local session rule engine
 */

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  AstronautProfile,
  HealthAlert,
  MissionSummary,
  TelemetryReading,
  VitalTrendPoint,
  VitalSignsSnapshot,
  HealthStatus,
  TimeWindow,
  AIAnalysisResult,
  FeatureContribution,
  AnomalyTimelinePoint,
  SleepLogEntry,
  MentalHealthMetrics,
  SleepArchitectureDay,
  BehavioralCheckIn,
  AssessmentSummaryResponse,
} from '../types/spacecare';
import {
  MOCK_ASTRONAUTS,
  MOCK_ALERTS,
  MOCK_MISSION_SUMMARY,
} from '../services/mockTelemetry';
import { spacecareApi, ConnectionMode } from '../services/api';

interface TelemetryContextValue {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  setSelectedAstronautId: (id: string) => void;
  selectedAstronaut: AstronautProfile;
  alerts: HealthAlert[];
  activeAlertCount: number;
  missionSummary: MissionSummary;
  backendMode: ConnectionMode;
  telemetryHistory: Record<string, TelemetryReading[]>;
  sleepLogsByAstronaut: Record<string, SleepLogEntry[]>;
  latestAssessmentByAstronaut: Record<string, AssessmentSummaryResponse>;
  recordTelemetryReading: (reading: Omit<TelemetryReading, 'id'> | TelemetryReading) => Promise<TelemetryReading>;
  logAstronautSleep: (
    entry: Omit<SleepLogEntry, 'id'> | SleepLogEntry,
    applyPhysiologicalEffect?: boolean
  ) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  resolveAlert: (alertId: string) => void;
}

const TelemetryContext = createContext<TelemetryContextValue | null>(null);

// Helper to convert existing mock trend points to TelemetryReading format
function initializeTelemetryFromMock(astronauts: AstronautProfile[]): Record<string, TelemetryReading[]> {
  const map: Record<string, TelemetryReading[]> = {};

  astronauts.forEach((astro) => {
    const readings: TelemetryReading[] = [];
    const trend24 = astro.trend24h || [];

    trend24.forEach((pt, idx) => {
      readings.push({
        id: idx + 1,
        astronaut_id: astro.id,
        timestamp: pt.timestamp,
        heart_rate: pt.heartRate,
        systolic_bp: pt.systolicBP,
        diastolic_bp: pt.diastolicBP,
        spo2: pt.spo2,
        body_temperature: pt.coreTemp,
        respiration_rate: pt.respiratoryRate,
        data_source: 'SYNTHETIC_SIMULATED',
        is_simulated: true,
        dataset_reference: 'Pre-flight & In-flight Calibration Series',
      });
    });

    map[astro.id] = readings;
  });

  return map;
}

export const TelemetryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isSubmittingRef = React.useRef(false);
  const [crewProfiles, setCrewProfiles] = useState<AstronautProfile[]>(MOCK_ASTRONAUTS);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(MOCK_ASTRONAUTS[0].id);
  const [alerts, setAlerts] = useState<HealthAlert[]>(MOCK_ALERTS);
  const [backendMode, setBackendMode] = useState<ConnectionMode>('OFFLINE_DEMO_FALLBACK');
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryReading[]>>(() =>
    initializeTelemetryFromMock(MOCK_ASTRONAUTS)
  );
  const [sleepLogsByAstronaut, setSleepLogsByAstronaut] = useState<Record<string, SleepLogEntry[]>>({});
  const [latestAssessmentByAstronaut, setLatestAssessmentByAstronaut] = useState<Record<string, AssessmentSummaryResponse>>({});
  const [mentalHealthByAstronaut, setMentalHealthByAstronaut] = useState<Record<string, MentalHealthMetrics>>(() => {
    const initial: Record<string, MentalHealthMetrics> = {};
    MOCK_ASTRONAUTS.forEach((a) => {
      initial[a.id] = a.mentalHealth;
    });
    return initial;
  });

  // Poll backend health & synchronize state with Member 3's routers
  useEffect(() => {
    let isMounted = true;

    const syncWithBackend = async () => {
      if (isSubmittingRef.current) return;

      try {
        const probeRes = await spacecareApi.probeConnection();
        if (!isMounted) return;
        setBackendMode(probeRes.state);

        if (probeRes.state === 'LIVE_API') {
          // 1. Fetch live astronauts from GET /api/v1/astronauts
          const astroRes = await spacecareApi.getAstronauts();
          if (astroRes.data && Array.isArray(astroRes.data) && astroRes.data.length > 0) {
            const dbAstroIds = new Set(astroRes.data.map((a) => a.id));

            // Keep only astronauts persisted in the live SQLite database
            const liveProfiles: AstronautProfile[] = astroRes.data.map((dbAstro) => {
              const existing = MOCK_ASTRONAUTS.find((p) => p.id === dbAstro.id) || MOCK_ASTRONAUTS[0];
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
                baseline: {
                  ...existing.baseline,
                  restingHeartRate: dbAstro.baseline_heart_rate ?? existing.baseline?.restingHeartRate ?? 72,
                  restingSystolicBP: dbAstro.baseline_systolic_bp ?? existing.baseline?.restingSystolicBP ?? 120,
                  restingDiastolicBP: dbAstro.baseline_diastolic_bp ?? existing.baseline?.restingDiastolicBP ?? 80,
                  baselineSpO2: dbAstro.baseline_spo2 ?? existing.baseline?.baselineSpO2 ?? 98.2,
                  baselineCoreTemp: dbAstro.baseline_body_temperature ?? existing.baseline?.baselineCoreTemp ?? 36.8,
                  respiratoryRateRange: [
                    dbAstro.baseline_respiration_rate ?? existing.baseline?.respiratoryRateRange?.[0] ?? 12,
                    (dbAstro.baseline_respiration_rate ? dbAstro.baseline_respiration_rate + 4 : existing.baseline?.respiratoryRateRange?.[1]) ?? 18
                  ],
                },
              };
            });

            setCrewProfiles(liveProfiles);

            setSelectedAstronautId((currentId) => {
              if (dbAstroIds.has(currentId)) return currentId;
              return astroRes.data[0].id;
            });
          }

          // 2. Fetch live alerts from SQLite
          const alertRes = await spacecareApi.getAlerts();
          if (alertRes.data && Array.isArray(alertRes.data)) {
            setAlerts((prev) => {
              const clientSleepAlerts = prev.filter((a) => a.id.startsWith('ALT-SLEEP-'));
              const seen = new Set<string>();
              const combined: HealthAlert[] = [];
              for (const a of [...alertRes.data, ...clientSleepAlerts]) {
                if (!seen.has(a.id)) {
                  seen.add(a.id);
                  combined.push(a);
                }
              }
              return combined;
            });
          }

          // 3. Fetch recent telemetry for the active astronaut (sorted chronologically ASC for Recharts)
          const teleRes = await spacecareApi.getAstronautTelemetry(selectedAstronautId, 50);
          if (teleRes.data && Array.isArray(teleRes.data) && teleRes.data.length > 0) {
            const sortedTelemetry = [...(teleRes.data as unknown as TelemetryReading[])].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            setTelemetryHistory((prev) => ({
              ...prev,
              [selectedAstronautId]: sortedTelemetry,
            }));
          }
        } else {
          // In offline fallback mode, restore full mock crew
          setCrewProfiles(MOCK_ASTRONAUTS);
        }
      } catch (err) {
        console.warn('Backend sync failed, maintaining offline state:', err);
      }
    };

    syncWithBackend();
    const interval = setInterval(syncWithBackend, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [selectedAstronautId]);

  // Action: Acknowledge Alert
  const acknowledgeAlert = async (alertId: string) => {
    if (backendMode === 'LIVE_API') {
      try {
        await spacecareApi.acknowledgeAlert(alertId);
      } catch (e) {
        console.error('Backend alert acknowledge failed:', e);
      }
    }
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'ACKNOWLEDGED', acknowledged: true, is_acknowledged: true } : a))
    );
  };

  // Action: Resolve Alert
  const resolveAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, status: 'RESOLVED', acknowledged: true, is_acknowledged: true } : a))
    );
  };

  // Action: Record Telemetry Reading
  const recordTelemetryReading = async (
    rawReading: Omit<TelemetryReading, 'id'> | TelemetryReading
  ): Promise<TelemetryReading> => {
    isSubmittingRef.current = true;
    try {
      const parsedDate = rawReading.timestamp ? new Date(rawReading.timestamp) : new Date();
      const isoTimestamp = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

      let savedReading: TelemetryReading = {
        id: 'id' in rawReading ? rawReading.id : Date.now(),
        ...rawReading,
        timestamp: isoTimestamp,
      };

      const targetAstronautId = savedReading.astronaut_id;

      // If live API, dispatch to FastAPI/SQLite
      if (backendMode === 'LIVE_API') {
        try {
          const res = await spacecareApi.submitTelemetryReading(rawReading);
          if (res.data && res.data.telemetry) {
            savedReading = {
              id: res.data.telemetry.id,
              astronaut_id: res.data.telemetry.astronaut_id,
              timestamp: res.data.telemetry.timestamp,
              heart_rate: res.data.telemetry.heart_rate,
              systolic_bp: res.data.telemetry.systolic_bp,
              diastolic_bp: res.data.telemetry.diastolic_bp,
              spo2: res.data.telemetry.spo2,
              body_temperature: res.data.telemetry.body_temperature,
              respiration_rate: res.data.telemetry.respiration_rate,
              data_source: res.data.telemetry.data_source as any,
              is_simulated: res.data.telemetry.is_simulated,
              dataset_reference: res.data.telemetry.dataset_reference,
            };

            // Store live assessment summary
            if (res.data.assessment_summary) {
              setLatestAssessmentByAstronaut((prev) => ({
                ...prev,
                [targetAstronautId]: res.data.assessment_summary,
              }));
            }

            // Refresh live SQLite alerts (FastAPI is authoritative)
            try {
              const alertRes = await spacecareApi.getAlerts();
              if (alertRes.data && Array.isArray(alertRes.data)) {
                setAlerts((prev) => {
                  const clientSleepAlerts = prev.filter((a) => a.id.startsWith('ALT-SLEEP-'));
                  const seen = new Set<string>();
                  const combined: HealthAlert[] = [];
                  for (const a of [...alertRes.data, ...clientSleepAlerts]) {
                    if (!seen.has(a.id)) {
                      seen.add(a.id);
                      combined.push(a);
                    }
                  }
                  return combined;
                });
              }
            } catch (e) {
              console.warn('Failed to refresh live alerts:', e);
            }
          }
        } catch (err) {
          console.warn('Backend telemetry post failed, staging in memory:', err);
        }
      }

      // 1. Append reading to telemetryHistory immediately (sorted chronologically ASC)
      setTelemetryHistory((prev) => {
        const existing = prev[targetAstronautId] || [];
        const updated = [...existing, savedReading].sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        return {
          ...prev,
          [targetAstronautId]: updated,
        };
      });

      // 2. Evaluate against SQLite baseline & trigger rule-engine alert ONLY when in OFFLINE mode
      // When LIVE_API is active, backend SQLite alert engine is authoritative to prevent duplicate alerts
      if (backendMode !== 'LIVE_API') {
        const targetAstro = crewProfiles.find((c) => c.id === targetAstronautId) || crewProfiles[0];
        const baseHr = targetAstro.baseline_heart_rate ?? targetAstro.baseline?.restingHeartRate ?? 72;
        const baseSpo2 = targetAstro.baseline_spo2 ?? targetAstro.baseline?.baselineSpO2 ?? 98.2;
        const baseTemp = targetAstro.baseline_body_temperature ?? targetAstro.baseline?.baselineCoreTemp ?? 36.8;
        const baseSys = targetAstro.baseline_systolic_bp ?? targetAstro.baseline?.restingSystolicBP ?? 120;

        const isTachycardia = savedReading.heart_rate >= 100;
        const isBradycardia = savedReading.heart_rate < 50;
        const isHypoxia = savedReading.spo2 < 94.0;
        const isThermalStrain = savedReading.body_temperature >= 37.8;
        const isHypotension = savedReading.systolic_bp < 95;

        if (isTachycardia || isBradycardia || isHypoxia || isThermalStrain || isHypotension) {
          const category = isHypoxia ? 'RESPIRATORY' : isThermalStrain ? 'ENVIRONMENTAL' : 'CARDIOVASCULAR';
          const severity = (savedReading.spo2 < 90 || savedReading.heart_rate > 130 || savedReading.body_temperature >= 38.5)
            ? 'CRITICAL'
            : 'CAUTION';

          const alertTitle = isHypoxia
            ? `Hypoxia Alert: SpO2 ${savedReading.spo2}%`
            : isThermalStrain
            ? `Thermal Strain Alert: Core Temp ${savedReading.body_temperature}°C`
            : isTachycardia
            ? `Tachycardia Alert: Heart Rate ${savedReading.heart_rate} bpm`
            : `Cardiovascular Deconditioning: BP ${savedReading.systolic_bp}/${savedReading.diastolic_bp} mmHg`;

          const observation = isHypoxia
            ? `Oxygen saturation dropped to ${savedReading.spo2}% (baseline ${baseSpo2}%). Ventilatory rate at ${savedReading.respiration_rate} br/m.`
            : isThermalStrain
            ? `Core temperature reached ${savedReading.body_temperature}°C (baseline ${baseTemp}°C) with heart rate ${savedReading.heart_rate} bpm.`
            : isTachycardia
            ? `Heart rate spiked to ${savedReading.heart_rate} bpm (baseline ${baseHr} bpm, delta +${savedReading.heart_rate - baseHr} bpm).`
            : `Systolic arterial pressure decreased to ${savedReading.systolic_bp} mmHg (baseline ${baseSys} mmHg).`;

          const recommendation = isHypoxia
            ? 'NASA-STD-3001 §6.1: Verify ECLSS cabin partial O2 pressure and inspect portable emergency mask.'
            : isThermalStrain
            ? 'NASA-STD-3001 §7.3: Increase suit LCVG chiller bypass valve flow; oral electrolyte hydration.'
            : isTachycardia
            ? 'NASA-STD-3001 §6.2: Rest in horizontal microgravity neutral posture; administer 500mL fluid load.'
            : 'NASA-STD-3001 §6.2: Initiate 1.0L oral isotonic fluid loading; don lower body compression garment.';

          const newAlert: HealthAlert = {
            id: `ALT-RULE-${Date.now()}`,
            astronautId: targetAstronautId,
            astronautName: targetAstro.name,
            category: category as any,
            severity: severity as any,
            status: 'ACTIVE',
            title: alertTitle,
            whatIsChanging: observation,
            whyItMatters: 'Biometric threshold crossed personal NASA HRP baseline limits in microgravity.',
            physiologicalExplanation: observation,
            countermeasure: recommendation,
            suggestedFurtherAssessment: 'Check secondary diagnostic monitors and contact flight surgeon.',
            evidenceReference: 'NASA Human Research Program (HRP) Standards & NASA-STD-3001',
            timestamp: savedReading.timestamp,
            acknowledged: false,
            astronaut_id: targetAstronautId,
            message: observation,
            confidence_score: 0.95,
            recommendation,
            is_acknowledged: false,
          };

          setAlerts((prev) => [newAlert, ...prev]);
        }
      }

      return savedReading;
    } finally {
      isSubmittingRef.current = false;
    }
  };

  // Action: Log Astronaut Sleep & Dynamically Propagate Telemetry
  const logAstronautSleep = async (
    entryInput: Omit<SleepLogEntry, 'id'> | SleepLogEntry,
    applyPhysiologicalEffect: boolean = true
  ): Promise<void> => {
    isSubmittingRef.current = true;
    try {
      const targetAstronautId = entryInput.astronaut_id;
    const targetAstro = crewProfiles.find((c) => c.id === targetAstronautId) || crewProfiles[0];
    const currentMental = mentalHealthByAstronaut[targetAstronautId] || targetAstro.mentalHealth;
    const hours = entryInput.hours_slept;

    const baseHr = targetAstro.baseline_heart_rate ?? targetAstro.baseline?.restingHeartRate ?? 70;
    const baseSys = targetAstro.baseline_systolic_bp ?? targetAstro.baseline?.restingSystolicBP ?? 120;
    const baseDia = targetAstro.baseline_diastolic_bp ?? targetAstro.baseline?.restingDiastolicBP ?? 80;
    const baseSpo2 = targetAstro.baseline_spo2 ?? targetAstro.baseline?.baselineSpO2 ?? 98.2;
    const baseTemp = targetAstro.baseline_body_temperature ?? targetAstro.baseline?.baselineCoreTemp ?? 36.8;
    const baseResp = targetAstro.baseline_respiration_rate ?? 14;

    let hrDelta = 0;
    let bpSysDelta = 0;
    let bpDiaDelta = 0;
    let respDelta = 0;
    let cognitiveReadiness = 95;
    let circadianAlignment = 92;
    let stressLevel = 3;
    let alertSeverity: 'CRITICAL' | 'CAUTION' | null = null;
    let alertTitle = '';
    let alertObservation = '';
    let alertRecommendation = '';

    if (hours < 6.0) {
      // Low Sleep (< 6.0h): Elevated HR (+8 to +16 bpm), elevated systolic BP (+6 to +12 mmHg), lower cognitive readiness
      const deficit = 6.0 - hours; // 0 to 4
      hrDelta = Math.min(16, Math.max(8, Math.round(8 + (deficit / 4) * 8)));
      bpSysDelta = Math.min(12, Math.max(6, Math.round(6 + (deficit / 4) * 6)));
      bpDiaDelta = Math.round(bpSysDelta * 0.6);
      respDelta = hours < 4.0 ? 3 : 2;

      cognitiveReadiness = Math.max(25, Math.round(100 - (8.0 - hours) * 16));
      circadianAlignment = Math.max(45, Math.round(88 - (8.0 - hours) * 9));
      stressLevel = Math.min(9, Math.round(4 + (8.0 - hours) * 1.2));

      alertSeverity = hours < 4.5 ? 'CRITICAL' : 'CAUTION';
      alertTitle = hours < 4.5
        ? `Acute Sleep Deprivation & Cognitive Risk (${hours}h)`
        : `Sleep Debt & Autonomic Cardiovascular Strain (${hours}h)`;
      alertObservation = `Only ${hours}h recorded (quality: ${entryInput.sleep_quality}, awakenings: ${entryInput.awakenings}). Autonomic tone shifted: resting HR elevated by +${hrDelta} bpm to ${baseHr + hrDelta} bpm; systolic BP rose to ${baseSys + bpSysDelta} mmHg. Cognitive readiness dropped to ${cognitiveReadiness}%.`;
      alertRecommendation = `NASA HRP Fatigue Protocol: Reschedule non-critical tasks. Administer 30-min prophylactic nap before high-risk operations. Adjust crew cabin SSLA light to 480nm circadian entrainment mode. Restrict caffeine intake after 14:00 MET.`;
    } else if (hours >= 6.0 && hours < 7.0) {
      // Moderate Sleep (6.0–6.9h): Mild HR (+4 to +7 bpm) and BP (+3 to +5 mmHg) drift with fatigue advisory
      hrDelta = 5;
      bpSysDelta = 4;
      bpDiaDelta = 2;
      respDelta = 1;
      cognitiveReadiness = 78;
      circadianAlignment = 76;
      stressLevel = 5;

      alertSeverity = 'CAUTION';
      alertTitle = `Mild Sleep Restriction & Autonomic Drift (${hours}h)`;
      alertObservation = `${hours}h sleep logged (suboptimal vs 8.0h NASA standard). Modest sympathetic autonomic drift: HR +${hrDelta} bpm, BP +${bpSysDelta} mmHg. Cognitive readiness is ${cognitiveReadiness}%.`;
      alertRecommendation = `Enforce 8.0h sleep window tonight; schedule 20-min crew downtime and monitor evening actigraphy.`;
    } else if (hours >= 7.0 && hours <= 8.5) {
      // Optimal Sleep (7.0–8.5h): Stabilizes HR/BP at baseline, boosts readiness
      hrDelta = 0;
      bpSysDelta = 0;
      bpDiaDelta = 0;
      respDelta = 0;
      cognitiveReadiness = 96;
      circadianAlignment = 94;
      stressLevel = 2;
      alertSeverity = null;
    } else if (hours > 8.5 && hours <= 9.5) {
      // Slightly extended sleep
      hrDelta = -1;
      bpSysDelta = -1;
      bpDiaDelta = 0;
      respDelta = 0;
      cognitiveReadiness = 88;
      circadianAlignment = 88;
      stressLevel = 2;
      alertSeverity = null;
    } else {
      // High / Oversleep (> 9.5h): HR near/slightly below baseline (-2 to +2 bpm), flags circadian inertia / phase shift CAUTION alert
      hrDelta = -2;
      bpSysDelta = -2;
      bpDiaDelta = -1;
      respDelta = -1;
      cognitiveReadiness = 72;
      circadianAlignment = 68;
      stressLevel = 4;

      alertSeverity = 'CAUTION';
      alertTitle = `Circadian Phase Delay & Sleep Inertia (${hours}h)`;
      alertObservation = `Extended sleep duration of ${hours}h recorded. Prolonged post-awakening sleep inertia detected. Cognitive readiness dampened to ${cognitiveReadiness}%.`;
      alertRecommendation = `Initiate 30-minute blue-enriched LED exposure (SSLA 480nm, 1000 lux) in crew cabin; perform 15-minute mild ergometer aerobic activation.`;
    }

    // Sleep stages breakdown
    let deepRatio = 0.20;
    let remRatio = 0.22;
    let efficiency = 88;

    if (entryInput.sleep_quality === 'POOR' || hours < 6.0) {
      deepRatio = 0.14;
      remRatio = 0.16;
      efficiency = Math.min(76, Math.max(55, Math.round(55 + hours * 3.5 - entryInput.awakenings * 4)));
    } else if (entryInput.sleep_quality === 'FAIR' || (hours >= 6.0 && hours < 7.0)) {
      deepRatio = 0.18;
      remRatio = 0.20;
      efficiency = Math.min(84, Math.max(72, Math.round(70 + hours * 2 - entryInput.awakenings * 3)));
    } else if (entryInput.sleep_quality === 'OPTIMAL' || (hours >= 7.0 && hours <= 8.5)) {
      deepRatio = 0.24;
      remRatio = 0.24;
      efficiency = Math.min(96, Math.max(88, Math.round(90 + (hours - 7.0) * 3 - entryInput.awakenings * 2)));
    } else {
      deepRatio = 0.18;
      remRatio = 0.22;
      efficiency = Math.min(85, Math.max(75, Math.round(82 - entryInput.awakenings * 2)));
    }

    const deepHours = Number((hours * deepRatio).toFixed(1));
    const remHours = Number((hours * remRatio).toFixed(1));
    const lightHours = Number(Math.max(0, hours - deepHours - remHours).toFixed(1));

    const currentHistory = currentMental.sleepArchitecture7d || [];
    const lastDayNum = currentHistory.length > 0
      ? parseInt(currentHistory[currentHistory.length - 1].dayLabel.replace(/\D/g, ''), 10) || 84
      : 84;
    const newDayNum = lastDayNum + 1;

    const newDay: SleepArchitectureDay = {
      dayLabel: `Day ${newDayNum} (Logged)`,
      date: entryInput.date,
      deepSleepHours: deepHours,
      remSleepHours: remHours,
      lightSleepHours: lightHours,
      totalSleepHours: hours,
      sleepEfficiencyPct: efficiency,
      targetHours: 8.0,
      circadianAlignmentScore: circadianAlignment,
      stressIndex: stressLevel,
    };

    // Rolling 7-day window
    const updatedSleep7d = [...currentHistory.slice(1), newDay];
    const newAvgHours = Number(
      (updatedSleep7d.reduce((acc, d) => acc + d.totalSleepHours, 0) / updatedSleep7d.length).toFixed(1)
    );
    const newAvgEff = Math.round(
      updatedSleep7d.reduce((acc, d) => acc + d.sleepEfficiencyPct, 0) / updatedSleep7d.length
    );
    const sleepDebt = Number(
      Math.max(0, 8.0 * updatedSleep7d.length - updatedSleep7d.reduce((acc, d) => acc + d.totalSleepHours, 0)).toFixed(1)
    );

    const checkIn: BehavioralCheckIn = {
      id: `CHK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      moodRating: hours >= 7 && hours <= 8.5 ? 5 : hours < 6 ? 2 : 3,
      perceivedStress: stressLevel,
      sleepQuality: entryInput.sleep_quality === 'OPTIMAL' ? 5 : entryInput.sleep_quality === 'FAIR' ? 3 : 2,
      cognitiveFatigue: hours < 6 || hours > 9.5,
      notes: entryInput.notes || `Sleep log: ${hours} hrs (${entryInput.sleep_quality}, ${entryInput.awakenings} awakenings).`,
    };

    const updatedMentalHealth: MentalHealthMetrics = {
      ...currentMental,
      currentCircadianAlignment: circadianAlignment,
      currentStressIndex: stressLevel,
      currentMoodScore: checkIn.moodRating,
      weeklyAvgSleepHours: newAvgHours,
      weeklyAvgEfficiencyPct: newAvgEff,
      sleepArchitecture7d: updatedSleep7d,
      checkInHistory: [checkIn, ...(currentMental.checkInHistory || [])],
      sleepDebtHours: sleepDebt,
      cognitiveReadinessScore: cognitiveReadiness,
    };

    // 1. Update mental health state
    setMentalHealthByAstronaut((prev) => ({
      ...prev,
      [targetAstronautId]: updatedMentalHealth,
    }));

    // 2. Append to sleepLogsByAstronaut
    const savedLog: SleepLogEntry = {
      id: 'id' in entryInput ? entryInput.id : `SLP-${Date.now()}`,
      ...entryInput,
      coupled_to_vitals: applyPhysiologicalEffect,
    };
    setSleepLogsByAstronaut((prev) => ({
      ...prev,
      [targetAstronautId]: [savedLog, ...(prev[targetAstronautId] || [])],
    }));

    // 3. Record coupled telemetry reading & alert when applyPhysiologicalEffect is enabled
    if (applyPhysiologicalEffect) {
      const coupledReading: Omit<TelemetryReading, 'id'> = {
        astronaut_id: targetAstronautId,
        timestamp: new Date().toISOString(),
        heart_rate: baseHr + hrDelta,
        systolic_bp: baseSys + bpSysDelta,
        diastolic_bp: baseDia + bpDiaDelta,
        spo2: baseSpo2,
        body_temperature: baseTemp,
        respiration_rate: baseResp + respDelta,
        data_source: 'SYNTHETIC_SIMULATED',
        is_simulated: true,
        dataset_reference: 'SLEEP_CIRCADIAN_COUPLING',
      };
      await recordTelemetryReading(coupledReading);

      // Emit alert if threshold breached
      if (alertSeverity) {
        const newAlert: HealthAlert = {
          id: `ALT-SLEEP-${Date.now()}`,
          astronautId: targetAstronautId,
          astronautName: targetAstro.name,
          category: 'SLEEP_PSYCH',
          severity: alertSeverity,
          status: 'ACTIVE',
          title: alertTitle,
          whatIsChanging: alertObservation,
          whyItMatters: 'Sleep restriction/inertia impairs neurobehavioral performance and causes autonomic sympathetic elevation.',
          physiologicalExplanation: alertObservation,
          countermeasure: alertRecommendation,
          suggestedFurtherAssessment: 'Administer Psychomotor Vigilance Task (PVT-B) test and evaluate circadian rhythm phase markers.',
          evidenceReference: 'NASA HRP Behavioral Health & Performance (BHP) Standard §4.2',
          timestamp: new Date().toISOString(),
          acknowledged: false,
          astronaut_id: targetAstronautId,
          message: alertObservation,
          confidence_score: 0.94,
          recommendation: alertRecommendation,
          is_acknowledged: false,
        };
        setAlerts((prev) => [newAlert, ...prev]);
      }
    }
  } finally {
    isSubmittingRef.current = false;
  }
};

  // Recompute enriched crew profiles with dynamic latest biometrics, deltas, and trend points
  const enrichedCrew = useMemo(() => {
    return crewProfiles.map((astro) => {
      const mental = mentalHealthByAstronaut[astro.id] || astro.mentalHealth;
      const readings = telemetryHistory[astro.id] || [];
      if (readings.length === 0) return { ...astro, mentalHealth: mental };

      const latest = readings[readings.length - 1];

      // Derive health status
      const isCritical =
        latest.spo2 < 90 ||
        latest.heart_rate > 125 ||
        latest.body_temperature >= 38.5 ||
        latest.systolic_bp < 85;

      const isCaution =
        latest.spo2 < 95 ||
        latest.heart_rate > 95 ||
        latest.heart_rate < 55 ||
        latest.body_temperature >= 37.5 ||
        latest.systolic_bp < 100;

      const status: HealthStatus = isCritical ? 'ALERT' : isCaution ? 'CAUTION' : 'NOMINAL';

      const currentVitals: VitalSignsSnapshot = {
        astronautId: astro.id,
        timestamp: latest.timestamp,
        heartRate: latest.heart_rate,
        heartRateVariability: astro.currentVitals?.heartRateVariability ?? 42,
        systolicBP: latest.systolic_bp,
        diastolicBP: latest.diastolic_bp,
        spo2: latest.spo2,
        coreTemp: latest.body_temperature,
        respiratoryRate: latest.respiration_rate,
        status,
        dataSource: 'SIMULATED TELEMETRY',
      };

      // Compute dynamic time-series trends from all accumulated readings
      const baseHr = astro.baseline_heart_rate ?? astro.baseline.restingHeartRate ?? 70;
      const baseSpo2 = astro.baseline_spo2 ?? astro.baseline.baselineSpO2 ?? 98.0;

      const dynamicTrendPoints: VitalTrendPoint[] = readings.map((r, idx) => {
        const dateObj = new Date(r.timestamp);
        const timeLabel = !isNaN(dateObj.getTime())
          ? dateObj.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', timeZone: 'UTC' })
          : `Pt ${idx + 1}`;

        return {
          timestamp: r.timestamp,
          timeLabel,
          heartRate: r.heart_rate,
          hrvRmssd: astro.currentVitals?.heartRateVariability ?? 42,
          systolicBP: r.systolic_bp,
          diastolicBP: r.diastolic_bp,
          spo2: r.spo2,
          coreTemp: r.body_temperature,
          respiratoryRate: r.respiration_rate,
          hrBaselineMin: baseHr - 12,
          hrBaselineMax: baseHr + 20,
          spo2BaselineMin: Math.max(90, baseSpo2 - 3),
        };
      });

      const trendsByWindow: Record<TimeWindow, VitalTrendPoint[]> = {
        '6H': dynamicTrendPoints.slice(-12),
        '24H': dynamicTrendPoints.slice(-24),
        '7D': dynamicTrendPoints,
      };

      // Dynamic cardiovascular metrics
      const hrDrift = latest.heart_rate - baseHr;
      const map = Number((latest.diastolic_bp + (latest.systolic_bp - latest.diastolic_bp) / 3).toFixed(1));
      const orthostaticScore = Math.max(30, Math.min(100, Math.round(90 - Math.max(0, hrDrift * 1.5) - Math.max(0, (120 - latest.systolic_bp) * 1.2))));

      const dynamicCardiovascular = {
        ...astro.cardiovascular,
        restingHrDrift: hrDrift,
        meanArterialPressure: map,
        orthostaticToleranceScore: orthostaticScore,
      };

      // Dynamic preflight deltas
      const dynamicPreflightDeltas = {
        ...astro.preFlightDeltas,
        hrDelta: hrDrift,
        bpSystolicDelta: latest.systolic_bp - (astro.baseline_systolic_bp ?? astro.baseline.restingSystolicBP ?? 120),
        bpDiastolicDelta: latest.diastolic_bp - (astro.baseline_diastolic_bp ?? astro.baseline.restingDiastolicBP ?? 80),
      };

      // Dynamic AI Analysis Score
      const absHrDelta = Math.abs(hrDrift);
      const absSpo2Delta = Math.max(0, baseSpo2 - latest.spo2);
      let dynamicAnomalyScore = Number(Math.min(0.99, Math.max(0.12, 0.15 + (absHrDelta / 60) * 0.45 + (absSpo2Delta / 10) * 0.40)).toFixed(2));
      let dynamicRiskLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH' = dynamicAnomalyScore >= 0.75 ? 'HIGH' : dynamicAnomalyScore >= 0.50 ? 'ELEVATED' : 'NOMINAL';

      let dynamicFeatureAttributions: FeatureContribution[] = [
        {
          featureName: 'Heart Rate Drift',
          featureKey: 'hr_drift',
          contributionPct: Math.round((absHrDelta / (absHrDelta + absSpo2Delta + 1)) * 60) || 35,
          observedValue: `${latest.heart_rate} bpm`,
          nominalRange: `${baseHr - 10}-${baseHr + 15} bpm`,
          deviationZScore: Number((hrDrift / 12).toFixed(1)),
          direction: hrDrift >= 0 ? 'ELEVATED' : 'DEPRESSED',
        },
        {
          featureName: 'SpO2 Oxygenation',
          featureKey: 'spo2',
          contributionPct: Math.round((absSpo2Delta / (absHrDelta + absSpo2Delta + 1)) * 40) || 25,
          observedValue: `${latest.spo2}%`,
          nominalRange: '>= 95.0%',
          deviationZScore: Number(((latest.spo2 - baseSpo2) / 1.5).toFixed(1)),
          direction: latest.spo2 < baseSpo2 ? 'DEPRESSED' : 'ELEVATED',
        },
        ...(astro.aiAnalysis?.featureAttributions?.slice(2) || []),
      ];

      // Check for Live ML & Multi-Hazard Assessment from Member 3's backend
      const liveAssessment = latestAssessmentByAstronaut[astro.id];
      if (liveAssessment) {
        if (liveAssessment.ml_anomaly_detected) {
          dynamicAnomalyScore = Number(Math.min(0.99, Math.max(0.68, 0.65 + Math.abs(liveAssessment.ml_anomaly_score) * 0.4)).toFixed(2));
          dynamicRiskLevel = liveAssessment.overall_status === 'CRITICAL_RISK' ? 'HIGH' : 'ELEVATED';
        } else {
          dynamicAnomalyScore = Number(Math.max(0.12, Math.min(0.55, 0.20 + (liveAssessment.ml_anomaly_score + 0.5) * 0.3)).toFixed(2));
          dynamicRiskLevel = liveAssessment.overall_status === 'ELEVATED_RISK' ? 'ELEVATED' : 'NOMINAL';
        }

        if (liveAssessment.heuristic_explanations && liveAssessment.heuristic_explanations.length > 0) {
          dynamicFeatureAttributions = liveAssessment.heuristic_explanations.map((exp) => ({
            featureName: exp.feature.replace(/_/g, ' ').toUpperCase(),
            featureKey: exp.feature,
            contributionPct: Math.min(100, Math.max(15, Math.round(exp.robust_z_score * 25))),
            observedValue: String(exp.observed_value),
            nominalRange: `Median ${exp.training_median}`,
            deviationZScore: exp.robust_z_score,
            direction: exp.direction.toUpperCase() === 'ELEVATED' ? 'ELEVATED' : 'DEPRESSED',
          }));
        }
      }

      const modelType = liveAssessment
        ? 'FastAPI Isolation Forest + Multi-Hazard Rules (Live SQLite Engine)'
        : 'Isolation Forest + Baseline Z-Score Ensemble • Prototype';

      const clinicalInterpretation = liveAssessment
        ? `[Live Multi-Hazard Engine] Primary Hazard: ${liveAssessment.primary_hazard}. Status: ${liveAssessment.overall_status} (Highest Severity: ${liveAssessment.highest_severity}). Isolation Forest Score: ${liveAssessment.ml_anomaly_score}. Evidence Status: ${liveAssessment.overall_evidence_status}. Assessed Domains: ${liveAssessment.assessed_domains.join(', ')}.`
        : dynamicRiskLevel === 'HIGH'
        ? `Acute physiological divergence detected in latest stream (HR ${latest.heart_rate} bpm, SpO2 ${latest.spo2}%). Significant Z-score elevation over baseline calibration.`
        : dynamicRiskLevel === 'ELEVATED'
        ? `Moderate physiological stress signature observed. Heart rate and gas exchange parameters show caution drift.`
        : `All biometric features oscillate within the personal pre-flight nominal statistical boundary.`;

      const dynamicTimeline14d: AnomalyTimelinePoint[] = (astro.aiAnalysis?.timeline14d || []).map((pt, idx, arr) => {
        if (idx === arr.length - 1) {
          return {
            ...pt,
            anomalyScore: dynamicAnomalyScore,
            zScoreDeviation: Number((hrDrift / 10).toFixed(1)),
          };
        }
        return pt;
      });

      const dynamicAiAnalysis: AIAnalysisResult = {
        ...(astro.aiAnalysis || {
          astronautId: astro.id,
          astronautName: astro.name,
          anomalyThreshold: 0.65,
          confidenceLevel: 0.94,
          modelType,
          nextAssessmentRecommendations: ['Perform scheduled vitals confirmation.'],
          dataSource: 'SIMULATED ML OUTPUT',
        }),
        compositeAnomalyScore: dynamicAnomalyScore,
        riskLevel: dynamicRiskLevel,
        baselineDeviationZScore: Number((hrDrift / 10).toFixed(1)),
        featureAttributions: dynamicFeatureAttributions,
        timeline14d: dynamicTimeline14d,
        clinicalInterpretation,
        modelType,
        dataSource: liveAssessment ? ('LIVE ML INGESTION' as any) : 'SIMULATED ML OUTPUT',
      };

      return {
        ...astro,
        status,
        currentVitals,
        trend24h: dynamicTrendPoints.slice(-24),
        trendsByWindow,
        cardiovascular: dynamicCardiovascular,
        preFlightDeltas: dynamicPreflightDeltas,
        aiAnalysis: dynamicAiAnalysis,
        mentalHealth: mental,
      };
    });
  }, [crewProfiles, telemetryHistory, mentalHealthByAstronaut, latestAssessmentByAstronaut]);

  const selectedAstronaut = useMemo(() => {
    return (
      enrichedCrew.find((c) => c.id === selectedAstronautId) ||
      enrichedCrew.find((c) => c.id === 'astro_03') ||
      enrichedCrew[0]
    );
  }, [enrichedCrew, selectedAstronautId]);

  const activeAlertCount = useMemo(() => {
    return alerts.filter((a) => !a.acknowledged && a.status === 'ACTIVE').length;
  }, [alerts]);

  // Dynamic Mission Summary
  const dynamicMissionSummary = useMemo(() => {
    const nominalCount = enrichedCrew.filter((c) => c.status === 'NOMINAL').length;
    const cautionCount = enrichedCrew.filter((c) => c.status === 'CAUTION').length;
    const alertCount = enrichedCrew.filter((c) => c.status === 'ALERT').length;

    const allReadings = Object.values(telemetryHistory).flat();
    const lastTimestamp = allReadings.length > 0
      ? new Date(allReadings[allReadings.length - 1].timestamp).toISOString().substring(11, 16) + ' UTC'
      : MOCK_MISSION_SUMMARY.telemetrySyncTime;

    return {
      ...MOCK_MISSION_SUMMARY,
      nominalCrewCount: nominalCount,
      cautionCrewCount: cautionCount,
      alertCrewCount: alertCount,
      telemetrySyncTime: lastTimestamp,
    };
  }, [enrichedCrew, telemetryHistory]);

  return (
    <TelemetryContext.Provider
      value={{
        crew: enrichedCrew,
        selectedAstronautId,
        setSelectedAstronautId,
        selectedAstronaut,
        alerts,
        activeAlertCount,
        missionSummary: dynamicMissionSummary,
        backendMode,
        telemetryHistory,
        sleepLogsByAstronaut,
        latestAssessmentByAstronaut,
        recordTelemetryReading,
        logAstronautSleep,
        acknowledgeAlert,
        resolveAlert,
      }}
    >
      {children}
    </TelemetryContext.Provider>
  );
};

export const useTelemetry = () => {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetry must be used within a TelemetryProvider');
  }
  return context;
};
