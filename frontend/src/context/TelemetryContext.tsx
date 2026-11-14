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
  recordTelemetryReading: (reading: Omit<TelemetryReading, 'id'> | TelemetryReading) => Promise<TelemetryReading>;
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
  const [crewProfiles] = useState<AstronautProfile[]>(MOCK_ASTRONAUTS);
  const [selectedAstronautId, setSelectedAstronautId] = useState<string>(MOCK_ASTRONAUTS[0].id);
  const [alerts, setAlerts] = useState<HealthAlert[]>(MOCK_ALERTS);
  const [backendMode, setBackendMode] = useState<ConnectionMode>('OFFLINE_DEMO_FALLBACK');
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, TelemetryReading[]>>(() =>
    initializeTelemetryFromMock(MOCK_ASTRONAUTS)
  );

  // Poll backend health
  useEffect(() => {
    const probe = () => {
      spacecareApi.checkBackendHealth().then((res) => {
        setBackendMode(res.state);
      });
    };
    probe();
    const interval = setInterval(probe, 5000);
    return () => clearInterval(interval);
  }, []);

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
    let savedReading: TelemetryReading = {
      id: 'id' in rawReading ? rawReading.id : Date.now(),
      ...rawReading,
    };

    // If live API, dispatch to FastAPI/SQLite
    if (backendMode === 'LIVE_API') {
      try {
        const res = await spacecareApi.submitTelemetryReading(rawReading);
        if (res.data) {
          savedReading = res.data;
        }
      } catch (err) {
        console.warn('Backend telemetry post failed, staging in memory:', err);
      }
    }

    const targetAstronautId = savedReading.astronaut_id;

    // 1. Append reading to telemetryHistory immediately
    setTelemetryHistory((prev) => {
      const existing = prev[targetAstronautId] || [];
      return {
        ...prev,
        [targetAstronautId]: [...existing, savedReading],
      };
    });

    // 2. Evaluate against SQLite baseline & trigger rule-engine alert if necessary
    const targetAstro = crewProfiles.find((c) => c.id === targetAstronautId) || crewProfiles[0];
    const baseHr = targetAstro.baseline_heart_rate ?? targetAstro.baseline.restingHeartRate ?? 72;
    const baseSpo2 = targetAstro.baseline_spo2 ?? targetAstro.baseline.baselineSpO2 ?? 98.2;
    const baseTemp = targetAstro.baseline_body_temperature ?? targetAstro.baseline.baselineCoreTemp ?? 36.8;
    const baseSys = targetAstro.baseline_systolic_bp ?? targetAstro.baseline.restingSystolicBP ?? 120;

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

    return savedReading;
  };

  // Recompute enriched crew profiles with dynamic latest biometrics, deltas, and trend points
  const enrichedCrew = useMemo(() => {
    return crewProfiles.map((astro) => {
      const readings = telemetryHistory[astro.id] || [];
      if (readings.length === 0) return astro;

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
      const dynamicAnomalyScore = Number(Math.min(0.99, Math.max(0.12, 0.15 + (absHrDelta / 60) * 0.45 + (absSpo2Delta / 10) * 0.40)).toFixed(2));
      const dynamicRiskLevel: 'NOMINAL' | 'ELEVATED' | 'HIGH' = dynamicAnomalyScore >= 0.75 ? 'HIGH' : dynamicAnomalyScore >= 0.50 ? 'ELEVATED' : 'NOMINAL';

      const dynamicFeatureAttributions: FeatureContribution[] = [
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
          modelType: 'Isolation Forest + Baseline Z-Score Ensemble • Prototype',
          nextAssessmentRecommendations: ['Perform scheduled vitals confirmation.'],
          dataSource: 'SIMULATED ML OUTPUT',
        }),
        compositeAnomalyScore: dynamicAnomalyScore,
        riskLevel: dynamicRiskLevel,
        baselineDeviationZScore: Number((hrDrift / 10).toFixed(1)),
        featureAttributions: dynamicFeatureAttributions,
        timeline14d: dynamicTimeline14d,
        clinicalInterpretation: dynamicRiskLevel === 'HIGH'
          ? `Acute physiological divergence detected in latest stream (HR ${latest.heart_rate} bpm, SpO2 ${latest.spo2}%). Significant Z-score elevation over baseline calibration.`
          : dynamicRiskLevel === 'ELEVATED'
          ? `Moderate physiological stress signature observed. Heart rate and gas exchange parameters show caution drift.`
          : `All biometric features oscillate within the personal pre-flight nominal statistical boundary.`,
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
      };
    });
  }, [crewProfiles, telemetryHistory]);

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
        recordTelemetryReading,
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
