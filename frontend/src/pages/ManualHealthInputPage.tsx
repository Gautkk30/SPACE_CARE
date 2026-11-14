import React, { useState, useMemo } from 'react';
import {
  AstronautProfile,
  TelemetryReading,
  DataSourceType,
} from '../types/spacecare';
import { spacecareApi, ConnectionMode } from '../services/api';
import {
  ClipboardEdit,
  User,
  Clock,
  Database,
  Heart,
  Gauge,
  Thermometer,
  Wind,
  Activity,
  Send,
  RotateCcw,
  CheckCircle2,
  ShieldAlert,
  CloudOff,
  Sparkles,
  FileText,
  History,
} from 'lucide-react';

interface ManualHealthInputPageProps {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
  onReadingSubmitted?: (reading: TelemetryReading) => void | Promise<any>;
  backendMode?: ConnectionMode;
}

interface VitalInputState {
  heartRate: string;
  systolicBP: string;
  diastolicBP: string;
  spo2: string;
  bodyTemperature: string;
  respirationRate: string;
}

export const ManualHealthInputPage: React.FC<ManualHealthInputPageProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut,
  onReadingSubmitted,
  backendMode = 'OFFLINE_DEMO_FALLBACK',
}) => {
  // Current active astronaut (default to astro_03 if found)
  const currentAstronaut = useMemo(() => {
    return (
      crew.find((a) => a.id === selectedAstronautId) ||
      crew.find((a) => a.id === 'astro_03') ||
      crew[0]
    );
  }, [crew, selectedAstronautId]);

  // Baseline vitals for delta calculations
  const baseline = useMemo(() => {
    return {
      heartRate: currentAstronaut.baseline_heart_rate ?? currentAstronaut.baseline.restingHeartRate ?? 72,
      systolicBP: currentAstronaut.baseline_systolic_bp ?? currentAstronaut.baseline.restingSystolicBP ?? 120,
      diastolicBP: currentAstronaut.baseline_diastolic_bp ?? currentAstronaut.baseline.restingDiastolicBP ?? 78,
      spo2: currentAstronaut.baseline_spo2 ?? currentAstronaut.baseline.baselineSpO2 ?? 98.2,
      bodyTemperature: currentAstronaut.baseline_body_temperature ?? currentAstronaut.baseline_temperature ?? currentAstronaut.baseline.baselineCoreTemp ?? 36.8,
      respirationRate: currentAstronaut.baseline_respiration_rate ?? 15,
    };
  }, [currentAstronaut]);

  // Form State
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().substring(0, 19));
  const [dataSource, setDataSource] = useState<DataSourceType>('SENSOR_LIVE');
  const [datasetReference, setDatasetReference] = useState<string>('Flight Surgeon Station • In-flight Routine Check');
  const [vitals, setVitals] = useState<VitalInputState>({
    heartRate: String(baseline.heartRate),
    systolicBP: String(baseline.systolicBP),
    diastolicBP: String(baseline.diastolicBP),
    spo2: String(baseline.spo2),
    bodyTemperature: String(baseline.bodyTemperature),
    respirationRate: String(baseline.respirationRate),
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setBackendFeedback] = useState<{
    success: boolean;
    message: string;
    isPending?: boolean;
    reading?: TelemetryReading;
  } | null>(null);

  // Local log of submissions in this session
  const [submittedReadings, setSubmittedReadings] = useState<TelemetryReading[]>([]);

  // Reset timestamp to current UTC
  const handleResetTimestampNow = () => {
    setTimestamp(new Date().toISOString().substring(0, 19));
  };

  // Helper quick fills
  const handleLoadBaseline = () => {
    setVitals({
      heartRate: String(baseline.heartRate),
      systolicBP: String(baseline.systolicBP),
      diastolicBP: String(baseline.diastolicBP),
      spo2: String(baseline.spo2),
      bodyTemperature: String(baseline.bodyTemperature),
      respirationRate: String(baseline.respirationRate),
    });
    setBackendFeedback(null);
  };

  const handleLoadSampleCaution = () => {
    setVitals({
      heartRate: String(baseline.heartRate + 24), // +24 bpm tachycardia
      systolicBP: String(baseline.systolicBP - 18), // -18 mmHg orthostatic hypotension
      diastolicBP: String(baseline.diastolicBP - 12),
      spo2: '93.5', // hypoxia caution
      bodyTemperature: '37.8', // thermal strain threshold
      respirationRate: '22', // compensatory tachypnea
    });
    setDatasetReference('Simulated Post-EVA Deconditioning & Thermal Strain Evaluation');
    setBackendFeedback(null);
  };

  // Parse numerical vitals
  const parsedVitals = useMemo(() => {
    return {
      heartRate: parseFloat(vitals.heartRate) || baseline.heartRate,
      systolicBP: parseFloat(vitals.systolicBP) || baseline.systolicBP,
      diastolicBP: parseFloat(vitals.diastolicBP) || baseline.diastolicBP,
      spo2: parseFloat(vitals.spo2) || baseline.spo2,
      bodyTemperature: parseFloat(vitals.bodyTemperature) || baseline.bodyTemperature,
      respirationRate: parseFloat(vitals.respirationRate) || baseline.respirationRate,
    };
  }, [vitals, baseline]);

  // Compute live deltas
  const deltas = useMemo(() => {
    return {
      hr: parsedVitals.heartRate - baseline.heartRate,
      sys: parsedVitals.systolicBP - baseline.systolicBP,
      dia: parsedVitals.diastolicBP - baseline.diastolicBP,
      spo2: Number((parsedVitals.spo2 - baseline.spo2).toFixed(1)),
      temp: Number((parsedVitals.bodyTemperature - baseline.bodyTemperature).toFixed(1)),
      rr: parsedVitals.respirationRate - baseline.respirationRate,
    };
  }, [parsedVitals, baseline]);

  // Physiological Assessment Logic
  const assessment = useMemo(() => {
    const isCritical =
      parsedVitals.spo2 < 90.0 ||
      parsedVitals.heartRate > 125 ||
      parsedVitals.heartRate < 45 ||
      parsedVitals.systolicBP < 85 ||
      parsedVitals.systolicBP > 165 ||
      parsedVitals.bodyTemperature >= 38.5;

    const isCaution =
      parsedVitals.spo2 < 95.0 ||
      parsedVitals.heartRate > 95 ||
      parsedVitals.heartRate < 55 ||
      parsedVitals.systolicBP < 100 ||
      parsedVitals.systolicBP > 140 ||
      parsedVitals.bodyTemperature >= 37.5 ||
      parsedVitals.respirationRate > 20 ||
      parsedVitals.respirationRate < 10;

    const status: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isCritical
      ? 'CRITICAL'
      : isCaution
      ? 'CAUTION'
      : 'NOMINAL';

    let whatIsChanging = 'All measured physiological parameters remain closely aligned with the astronaut\'s baseline calibration.';
    let whyItMatters = 'Stable cardiovascular autonomic balance and alveolar gas exchange are preserved in microgravity.';
    let recommendation = 'Maintain scheduled mission duties and routine countermeasure exercise (ARED / CEVIS 2.5 hrs/day).';

    if (parsedVitals.spo2 < 95.0 || parsedVitals.respirationRate > 20) {
      whatIsChanging = `Arterial oxygen saturation decreased to ${parsedVitals.spo2}% with compensatory ventilatory rate at ${parsedVitals.respirationRate} br/min.`;
      whyItMatters = 'Indicates pulmonary gas exchange impairment or localized cabin ECLSS atmospheric hypoxia pocketing.';
      recommendation = 'Check cabin O2 partial pressure immediately and deploy portable O2 breathing mask if SpO2 drops below 94%.';
    } else if (parsedVitals.bodyTemperature >= 37.5 || parsedVitals.heartRate > 100) {
      whatIsChanging = `Core temperature elevated to ${parsedVitals.bodyTemperature}°C alongside resting tachycardia (${parsedVitals.heartRate} bpm).`;
      whyItMatters = 'Excess thermal load or metabolic heat storage in microgravity where sweat cannot effectively evaporate.';
      recommendation = 'Increase LCVG suit cooling loop chiller flow and initiate oral isotonic fluid hydration protocol.';
    } else if (deltas.sys < -15 || parsedVitals.systolicBP < 100) {
      whatIsChanging = `Systolic arterial pressure dropped by ${Math.abs(deltas.sys)} mmHg to ${parsedVitals.systolicBP}/${parsedVitals.diastolicBP} mmHg.`;
      whyItMatters = 'Microgravity cephalad fluid redistribution and reduced circulating plasma volume create orthostatic vulnerability.';
      recommendation = 'Prescribe 1.0L oral saline rehydration load and utilize lower-body compression garments before standing or EVA egress.';
    }

    return {
      status,
      whatIsChanging,
      whyItMatters,
      recommendation,
    };
  }, [parsedVitals, baseline, deltas]);

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setBackendFeedback(null);

    const readingPayload: Omit<TelemetryReading, 'id'> = {
      astronaut_id: currentAstronaut.id,
      timestamp: new Date(timestamp).toISOString(),
      heart_rate: parsedVitals.heartRate,
      systolic_bp: parsedVitals.systolicBP,
      diastolic_bp: parsedVitals.diastolicBP,
      spo2: parsedVitals.spo2,
      body_temperature: parsedVitals.bodyTemperature,
      respiration_rate: parsedVitals.respirationRate,
      data_source: dataSource,
      is_simulated: dataSource !== 'SENSOR_LIVE',
      dataset_reference: datasetReference.trim() || undefined,
    };

    try {
      if (onReadingSubmitted) {
        await onReadingSubmitted(readingPayload as TelemetryReading);
      } else {
        await spacecareApi.submitTelemetryReading(readingPayload);
      }

      const fullReading: TelemetryReading = {
        id: Date.now(),
        ...readingPayload,
      };
      setSubmittedReadings((prev) => [fullReading, ...prev]);

      if (backendMode === 'LIVE_API') {
        setBackendFeedback({
          success: true,
          message: `Saved to SQLite Database: Telemetry reading for ${currentAstronaut.name} (${currentAstronaut.id}) recorded at ${new Date(timestamp).toLocaleTimeString()} UTC.`,
          isPending: false,
          reading: fullReading,
        });
      } else {
        setBackendFeedback({
          success: true,
          message: `Session Staged & Globally Propagated: Telemetry reading for ${currentAstronaut.name} updated across all dashboard pages.`,
          isPending: true,
          reading: fullReading,
        });
      }
    } catch {
      setBackendFeedback({
        success: false,
        message: 'Telemetry submission failed. Please verify input fields.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full bg-space-bg border border-space-border rounded-lg px-3 py-2 text-space-text font-mono text-xs focus:outline-none focus:border-space-cyan transition';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <ClipboardEdit className="w-3.5 h-3.5 text-space-cyan" />
            Clinical Telemetry Ingestion Station
          </div>
          <h1 className="text-2xl font-bold text-space-text flex items-center gap-3">
            <span>Manual Health Input Workstation</span>
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded bg-space-panel border border-space-border text-space-muted">
              SQLAlchemy &bull; Telemetry Schema Aligned
            </span>
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Flight Surgeon clinical portal for entering verified physiological telemetry into the SPACECARE monitoring architecture.
          </p>
        </div>

        {/* Quick Helper Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleLoadBaseline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-panel hover:bg-space-panel-hover border border-space-border text-space-muted hover:text-space-text text-xs transition font-medium"
          >
            <RotateCcw className="w-3.5 h-3.5 text-space-cyan" />
            <span>Load Baseline</span>
          </button>
          <button
            type="button"
            onClick={handleLoadSampleCaution}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-amber-muted/30 hover:bg-space-amber-muted/50 border border-space-amber/40 text-space-amber text-xs transition font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-space-amber" />
            <span>Load Sample Caution</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Data Entry Form (7 Columns) */}
        <div className="xl:col-span-7 space-y-4">
          <form onSubmit={handleSubmit} className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-5">
            {/* 1. Crew & Provenance Header Card */}
            <div className="space-y-3 pb-4 border-b border-space-border/60">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-space-text uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-space-cyan" />
                  1. Astronaut & Provenance Calibration
                </span>
                <span className="text-[10px] font-mono text-space-dim">Required Fields</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Astronaut Selector */}
                <div>
                  <label className="text-[11px] font-mono text-space-dim uppercase block mb-1">
                    Astronaut Subject
                  </label>
                  <select
                    value={selectedAstronautId}
                    onChange={(e) => onSelectAstronaut(e.target.value)}
                    className="w-full bg-space-bg border border-space-border rounded-lg px-3 py-2 text-space-text font-bold text-xs focus:outline-none focus:border-space-cyan cursor-pointer"
                  >
                    {crew.map((member) => (
                      <option key={member.id} value={member.id} className="bg-space-panel text-space-text">
                        {member.name} ({member.id}) &bull; {member.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data Source Provenance */}
                <div>
                  <label className="text-[11px] font-mono text-space-dim uppercase block mb-1">
                    Data Source (Provenance)
                  </label>
                  <select
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value as DataSourceType)}
                    className="w-full bg-space-bg border border-space-border rounded-lg px-3 py-2 text-space-text font-mono text-xs focus:outline-none focus:border-space-cyan cursor-pointer"
                  >
                    <option value="SENSOR_LIVE">SENSOR_LIVE (Direct Hardware Telemetry)</option>
                    <option value="SYNTHETIC_SIMULATED">SYNTHETIC_SIMULATED (Algorithm / Test Input)</option>
                    <option value="NASA_RESEARCH">NASA_RESEARCH (Open Science Data Archive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Timestamp Picker */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-mono text-space-dim uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-space-cyan" /> Timestamp (UTC)
                    </label>
                    <button
                      type="button"
                      onClick={handleResetTimestampNow}
                      className="text-[10px] text-space-cyan hover:underline font-mono"
                    >
                      Now (UTC)
                    </button>
                  </div>
                  <input
                    type="datetime-local"
                    step="1"
                    value={timestamp}
                    onChange={(e) => setTimestamp(e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>

                {/* Dataset Reference / Notes */}
                <div>
                  <label className="text-[11px] font-mono text-space-dim uppercase block mb-1 flex items-center gap-1">
                    <FileText className="w-3 h-3 text-space-cyan" /> Dataset Ref / Flight Notes
                  </label>
                  <input
                    type="text"
                    value={datasetReference}
                    onChange={(e) => setDatasetReference(e.target.value)}
                    placeholder="e.g. Flight Surgeon Station • Day 42 Check"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* 2. Schema-Aligned Vital-Sign Inputs */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-space-text uppercase tracking-wider flex items-center gap-2">
                  <Activity className="w-4 h-4 text-space-cyan" />
                  2. Physiological Biometrics (Telemetry Table Columns)
                </span>
                <span className="text-[10px] font-mono text-space-dim">Valid Ranges Enforced</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Heart Rate */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-space-red" /> Heart Rate (bpm)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.heartRate}</span>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="220"
                    required
                    value={vitals.heartRate}
                    onChange={(e) => setVitals({ ...vitals, heartRate: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 30–220 bpm</span>
                    <span className={deltas.hr !== 0 ? (deltas.hr > 15 ? 'text-space-red font-bold' : 'text-space-amber font-bold') : 'text-space-dim'}>
                      Delta: {deltas.hr >= 0 ? `+${deltas.hr}` : deltas.hr} bpm
                    </span>
                  </div>
                </div>

                {/* Blood Pressure Systolic */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-space-amber" /> Systolic BP (mmHg)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.systolicBP}</span>
                  </div>
                  <input
                    type="number"
                    min="60"
                    max="240"
                    required
                    value={vitals.systolicBP}
                    onChange={(e) => setVitals({ ...vitals, systolicBP: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 60–240 mmHg</span>
                    <span className={deltas.sys !== 0 ? (deltas.sys < -15 ? 'text-space-red font-bold' : 'text-space-amber font-bold') : 'text-space-dim'}>
                      Delta: {deltas.sys >= 0 ? `+${deltas.sys}` : deltas.sys} mmHg
                    </span>
                  </div>
                </div>

                {/* Blood Pressure Diastolic */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-space-cyan" /> Diastolic BP (mmHg)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.diastolicBP}</span>
                  </div>
                  <input
                    type="number"
                    min="30"
                    max="150"
                    required
                    value={vitals.diastolicBP}
                    onChange={(e) => setVitals({ ...vitals, diastolicBP: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 30–150 mmHg</span>
                    <span className={deltas.dia !== 0 ? 'text-space-amber font-bold' : 'text-space-dim'}>
                      Delta: {deltas.dia >= 0 ? `+${deltas.dia}` : deltas.dia} mmHg
                    </span>
                  </div>
                </div>

                {/* SpO2 Saturation */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Wind className="w-3.5 h-3.5 text-space-cyan" /> SpO2 Saturation (%)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.spo2}%</span>
                  </div>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    step="0.1"
                    required
                    value={vitals.spo2}
                    onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 70.0–100.0%</span>
                    <span className={deltas.spo2 !== 0 ? (deltas.spo2 < -3.0 ? 'text-space-red font-bold' : 'text-space-amber font-bold') : 'text-space-dim'}>
                      Delta: {deltas.spo2 >= 0 ? `+${deltas.spo2}%` : `${deltas.spo2}%`}
                    </span>
                  </div>
                </div>

                {/* Body Temperature */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Thermometer className="w-3.5 h-3.5 text-space-emerald" /> Core Temperature (°C)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.bodyTemperature}°C</span>
                  </div>
                  <input
                    type="number"
                    min="34.0"
                    max="42.0"
                    step="0.1"
                    required
                    value={vitals.bodyTemperature}
                    onChange={(e) => setVitals({ ...vitals, bodyTemperature: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 34.0–42.0°C</span>
                    <span className={deltas.temp !== 0 ? (deltas.temp > 0.8 ? 'text-space-red font-bold' : 'text-space-amber font-bold') : 'text-space-dim'}>
                      Delta: {deltas.temp >= 0 ? `+${deltas.temp}°C` : `${deltas.temp}°C`}
                    </span>
                  </div>
                </div>

                {/* Respiration Rate */}
                <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <label className="font-semibold text-space-text flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-space-cyan" /> Respiration Rate (br/min)
                    </label>
                    <span className="text-[10px] font-mono text-space-dim">Base: {baseline.respirationRate}</span>
                  </div>
                  <input
                    type="number"
                    min="6"
                    max="45"
                    required
                    value={vitals.respirationRate}
                    onChange={(e) => setVitals({ ...vitals, respirationRate: e.target.value })}
                    className={inputClass}
                  />
                  <div className="flex justify-between text-[10px] font-mono text-space-dim pt-0.5">
                    <span>Range: 6–45 br/min</span>
                    <span className={deltas.rr !== 0 ? 'text-space-amber font-bold' : 'text-space-dim'}>
                      Delta: {deltas.rr >= 0 ? `+${deltas.rr}` : deltas.rr} br/min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-space-cyan text-space-bg font-bold hover:bg-space-cyan/90 transition shadow-md shadow-space-cyan/20 disabled:opacity-50 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Transmitting to Backend...'
                    : `Submit Verified Telemetry Reading (${backendMode === 'LIVE_API' ? 'Live SQLite' : 'Session Preview'})`}
                </span>
              </button>
            </div>
          </form>

          {/* Feedback Banner */}
          {submissionFeedback && (
            <div
              className={`p-4 rounded-xl text-xs font-mono border flex items-start gap-3 shadow-lg ${
                submissionFeedback.isPending
                  ? 'bg-space-amber-muted/30 border-space-amber/40 text-space-amber'
                  : 'bg-space-emerald-muted/30 border-space-emerald/40 text-space-emerald'
              }`}
            >
              {submissionFeedback.isPending ? (
                <CloudOff className="w-5 h-5 shrink-0 mt-0.5 text-space-amber" />
              ) : (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-space-emerald" />
              )}
              <div className="space-y-1">
                <p className="font-bold text-sm">{submissionFeedback.message}</p>
                <p className="text-[11px] text-space-dim">
                  Status: {submissionFeedback.isPending ? 'Session Memory Synced (Live API Pending)' : 'Database Synchronized'} &bull; Target: {currentAstronaut.name}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live Delta Pre-Submission Assessment & Recent Log (5 Columns) */}
        <div className="xl:col-span-5 space-y-5">
          {/* Live Clinical Assessment Card */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-space-cyan" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-space-text">
                  Pre-Submission Assessment
                </h3>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  assessment.status === 'CRITICAL'
                    ? 'bg-space-red-muted text-space-red border-space-red/40 animate-pulse'
                    : assessment.status === 'CAUTION'
                    ? 'bg-space-amber-muted text-space-amber border-space-amber/40'
                    : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                }`}
              >
                {assessment.status}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3">
                <span className="text-[11px] font-bold text-space-cyan uppercase block mb-1">
                  1. What Is Changing:
                </span>
                <p className="text-space-text leading-relaxed">
                  {assessment.whatIsChanging}
                </p>
              </div>

              <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3">
                <span className="text-[11px] font-bold text-space-amber uppercase block mb-1">
                  2. Clinical Significance in Spaceflight:
                </span>
                <p className="text-space-muted leading-relaxed">
                  {assessment.whyItMatters}
                </p>
              </div>

              <div className="bg-space-emerald/10 border border-space-emerald/30 rounded-lg p-3">
                <span className="text-[11px] font-bold text-space-emerald uppercase block mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3. Recommended Flight Surgeon Protocol:
                </span>
                <p className="text-space-text leading-relaxed">
                  {assessment.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Manual Entries Log */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-space-cyan" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-space-text">
                  Recent Manual Entries Log
                </h3>
              </div>
              <span className="text-xs font-mono text-space-dim">{submittedReadings.length} Recorded</span>
            </div>

            {submittedReadings.length === 0 ? (
              <div className="py-8 text-center text-space-dim space-y-2">
                <Database className="w-8 h-8 text-space-cyan/40 mx-auto" />
                <p className="text-xs font-semibold text-space-muted">No manual entries recorded in this session</p>
                <p className="text-[11px] max-w-xs mx-auto">
                  Submit readings using the form on the left to verify real-time delta tracking and backend transmission.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                {submittedReadings.map((reading) => (
                  <div
                    key={reading.id}
                    className="p-3 rounded-lg bg-space-bg/60 border border-space-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="text-space-cyan font-bold">
                        {reading.astronaut_id} &bull; {reading.data_source}
                      </span>
                      <span className="text-space-dim">
                        {new Date(reading.timestamp).toLocaleTimeString()} UTC
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 font-mono text-[11px] text-space-muted">
                      <div>HR: <strong className="text-space-text">{reading.heart_rate}</strong> bpm</div>
                      <div>BP: <strong className="text-space-text">{reading.systolic_bp}/{reading.diastolic_bp}</strong></div>
                      <div>SpO2: <strong className="text-space-text">{reading.spo2}%</strong></div>
                      <div>Temp: <strong className="text-space-text">{reading.body_temperature}°C</strong></div>
                      <div>RR: <strong className="text-space-text">{reading.respiration_rate}</strong> br/m</div>
                      <div className="truncate text-space-dim">{reading.dataset_reference || 'Manual Entry'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
