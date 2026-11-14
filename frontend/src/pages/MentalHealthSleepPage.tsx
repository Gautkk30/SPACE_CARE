import React, { useState, useEffect, useMemo } from 'react';
import {
  AstronautProfile,
  BehavioralCheckIn,
  SleepQualityType,
} from '../types/spacecare';
import { useTelemetry } from '../context/TelemetryContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Brain,
  Moon,
  Sparkles,
  Send,
  BookOpen,
  Info,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Activity,
  ShieldAlert,
  Zap,
  BedDouble,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface MentalHealthSleepPageProps {
  selectedAstronaut: AstronautProfile;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const DarkSleepTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-space-panel border border-space-border-light p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-space-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-space-text">
              {entry.value} {entry.name.includes('Sleep') ? 'hrs' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MentalHealthSleepPage: React.FC<MentalHealthSleepPageProps> = ({
  selectedAstronaut: propAstronaut,
}) => {
  const {
    crew,
    setSelectedAstronautId,
    selectedAstronaut: contextAstronaut,
    logAstronautSleep,
    sleepLogsByAstronaut,
  } = useTelemetry();

  // Active astronaut (context-driven, fallback to prop or Major Marcus Chen)
  const activeAstronaut =
    contextAstronaut ||
    propAstronaut ||
    crew.find((c) => c.id === 'astro_03') ||
    crew[0];

  // Sleep Logger Form State
  const [selectedCrewId, setSelectedCrewId] = useState<string>(activeAstronaut?.id || 'astro_03');
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [sleepQuality, setSleepQuality] = useState<SleepQualityType>('OPTIMAL');
  const [awakenings, setAwakenings] = useState<number>(1);
  const [applyVitalsCoupling, setApplyVitalsCoupling] = useState<boolean>(true);
  const [sleepNotes, setSleepNotes] = useState<string>('');
  const [isSubmittingSleep, setIsSubmittingSleep] = useState<boolean>(false);
  const [sleepSuccessMsg, setSleepSuccessMsg] = useState<string>('');

  // Behavioral Check-in Form State
  const [formMood, setFormMood] = useState(4);
  const [formStress, setFormStress] = useState(3);
  const [formSleepQual, setFormSleepQual] = useState(4);
  const [formCognitiveFatigue, setFormCognitiveFatigue] = useState(false);
  const [formNotes, setFormNotes] = useState('');
  const [checkInSuccess, setCheckInSuccess] = useState(false);

  // Sync selectedCrewId when active astronaut changes externally
  useEffect(() => {
    setSelectedCrewId(activeAstronaut.id);
    setFormMood(activeAstronaut.mentalHealth.currentMoodScore);
    setFormStress(activeAstronaut.mentalHealth.currentStressIndex);
  }, [activeAstronaut.id, activeAstronaut.mentalHealth]);

  // Target astronaut for sleep logging
  const targetAstro = useMemo(() => {
    return crew.find((c) => c.id === selectedCrewId) || activeAstronaut;
  }, [crew, selectedCrewId, activeAstronaut]);

  // Dynamic baseline references
  const baseHr = targetAstro.baseline_heart_rate ?? targetAstro.baseline?.restingHeartRate ?? 70;
  const baseSys = targetAstro.baseline_systolic_bp ?? targetAstro.baseline?.restingSystolicBP ?? 120;
  const baseDia = targetAstro.baseline_diastolic_bp ?? targetAstro.baseline?.restingDiastolicBP ?? 80;

  // Live Physiological Impact Preview
  const impactPreview = useMemo(() => {
    const hours = Number(sleepHours);
    let hrDelta = 0;
    let bpSysDelta = 0;
    let cognitiveReadiness = 95;
    let circadianAlignment = 92;
    let alertSeverity: 'CRITICAL' | 'CAUTION' | 'NOMINAL' = 'NOMINAL';
    let alertTitle = 'Nominal Biometric Stability';
    let alertBadgeText = 'Biometrics Stable';

    if (hours < 6.0) {
      const deficit = 6.0 - hours;
      hrDelta = Math.min(16, Math.max(8, Math.round(8 + (deficit / 4) * 8)));
      bpSysDelta = Math.min(12, Math.max(6, Math.round(6 + (deficit / 4) * 6)));
      cognitiveReadiness = Math.max(25, Math.round(100 - (8.0 - hours) * 16));
      circadianAlignment = Math.max(45, Math.round(88 - (8.0 - hours) * 9));
      alertSeverity = hours < 4.5 ? 'CRITICAL' : 'CAUTION';
      alertTitle = hours < 4.5
        ? 'Acute Sleep Deprivation & Cognitive Risk'
        : 'Sleep Debt & Autonomic Cardiovascular Strain';
      alertBadgeText = hours < 4.5 ? 'CRITICAL ALERT' : 'CAUTION ALERT';
    } else if (hours >= 6.0 && hours < 7.0) {
      hrDelta = 5;
      bpSysDelta = 4;
      cognitiveReadiness = 78;
      circadianAlignment = 76;
      alertSeverity = 'CAUTION';
      alertTitle = 'Mild Sleep Restriction & Autonomic Drift';
      alertBadgeText = 'CAUTION ADVISORY';
    } else if (hours >= 7.0 && hours <= 8.5) {
      hrDelta = 0;
      bpSysDelta = 0;
      cognitiveReadiness = 96;
      circadianAlignment = 94;
      alertSeverity = 'NOMINAL';
      alertTitle = 'Optimal Sleep Architecture (NASA-STD Compliant)';
      alertBadgeText = 'NOMINAL';
    } else if (hours > 8.5 && hours <= 9.5) {
      hrDelta = -1;
      bpSysDelta = -1;
      cognitiveReadiness = 88;
      circadianAlignment = 88;
      alertSeverity = 'NOMINAL';
      alertTitle = 'Extended Rest Duration (Mild Inertia)';
      alertBadgeText = 'NOMINAL';
    } else {
      hrDelta = -2;
      bpSysDelta = -2;
      cognitiveReadiness = 72;
      circadianAlignment = 68;
      alertSeverity = 'CAUTION';
      alertTitle = 'Circadian Phase Delay & Sleep Inertia';
      alertBadgeText = 'CAUTION ALERT';
    }

    const bpDiaDelta = Math.round(bpSysDelta * 0.6);

    return {
      hrDelta,
      bpSysDelta,
      bpDiaDelta,
      predictedHr: baseHr + hrDelta,
      predictedSys: baseSys + bpSysDelta,
      predictedDia: baseDia + bpDiaDelta,
      cognitiveReadiness,
      circadianAlignment,
      alertSeverity,
      alertTitle,
      alertBadgeText,
    };
  }, [sleepHours, baseHr, baseSys, baseDia]);

  // Handle Preset Clicks
  const applyPreset = (hours: number, quality: SleepQualityType, wakeCount: number, defaultNote: string) => {
    setSleepHours(hours);
    setSleepQuality(quality);
    setAwakenings(wakeCount);
    setSleepNotes(defaultNote);
  };

  // Submit Sleep Log
  const handleSleepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingSleep(true);

    try {
      await logAstronautSleep(
        {
          astronaut_id: selectedCrewId,
          date: new Date().toISOString().split('T')[0],
          hours_slept: Number(sleepHours),
          sleep_quality: sleepQuality,
          awakenings: Number(awakenings),
          coupled_to_vitals: applyVitalsCoupling,
          notes: sleepNotes.trim() || `Sleep log: ${sleepHours}h (${sleepQuality}) logged via onboard workstation.`,
          data_source: 'SYNTHETIC_SIMULATED',
        },
        applyVitalsCoupling
      );

      setSleepSuccessMsg(
        applyVitalsCoupling
          ? `Sleep log (${sleepHours}h) recorded & propagated to live vitals, cardiovascular indices, and alert stream!`
          : `Standalone sleep log (${sleepHours}h) recorded to sleep architecture & actigraphy logs.`
      );
      setTimeout(() => setSleepSuccessMsg(''), 5500);
    } catch (err) {
      console.error('Error logging sleep:', err);
    } finally {
      setIsSubmittingSleep(false);
    }
  };

  // Submit Behavioral Check-in
  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    const newCheckIn: BehavioralCheckIn = {
      id: `CHK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      moodRating: formMood,
      perceivedStress: formStress,
      sleepQuality: formSleepQual,
      cognitiveFatigue: formCognitiveFatigue,
      notes: formNotes.trim() || 'Routine check-in logged via onboard workstation.',
    };

    activeAstronaut.mentalHealth.checkInHistory = [
      newCheckIn,
      ...(activeAstronaut.mentalHealth.checkInHistory || []),
    ];
    activeAstronaut.mentalHealth.currentMoodScore = formMood;
    activeAstronaut.mentalHealth.currentStressIndex = formStress;

    setFormNotes('');
    setCheckInSuccess(true);
    setTimeout(() => setCheckInSuccess(false), 4000);
  };

  const isStressElevated = activeAstronaut.mentalHealth.currentStressIndex >= 6;
  const isCircadianSuboptimal = activeAstronaut.mentalHealth.currentCircadianAlignment < 75;
  const readiness =
    activeAstronaut.mentalHealth.cognitiveReadinessScore ??
    Math.max(30, Math.round(100 - Math.max(0, 8.0 - activeAstronaut.mentalHealth.weeklyAvgSleepHours) * 14));
  const loggedHistory = sleepLogsByAstronaut[activeAstronaut.id] || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Brain className="w-3.5 h-3.5" />
            Behavioral Health & Circadian Architecture
          </div>
          <h1 className="text-2xl font-bold text-space-text flex items-center gap-2">
            Mental Health & Sleep &bull; {activeAstronaut.name}
            <span className="text-sm font-normal text-space-dim">({activeAstronaut.callsign})</span>
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Dynamic actigraphy sleep staging, circadian phase stability, and coupled neurovegetative vitals regulation.
          </p>
        </div>

        {/* Global Stats Badge */}
        <div className="flex items-center gap-3 bg-space-panel border border-space-border rounded-lg px-3.5 py-2 text-xs font-mono">
          <Moon className="w-4 h-4 text-space-cyan shrink-0" />
          <div className="flex flex-col">
            <span className="text-space-dim text-[10px] uppercase">7-Day Sleep Avg</span>
            <span className="text-space-cyan font-bold">
              {activeAstronaut.mentalHealth.weeklyAvgSleepHours} hrs/night ({activeAstronaut.mentalHealth.weeklyAvgEfficiencyPct}% Eff)
            </span>
          </div>
          {activeAstronaut.mentalHealth.sleepDebtHours !== undefined && (
            <div className="border-l border-space-border/60 pl-3 flex flex-col">
              <span className="text-space-dim text-[10px] uppercase">Rolling Debt</span>
              <span className={`font-bold ${activeAstronaut.mentalHealth.sleepDebtHours > 4.0 ? 'text-space-amber' : 'text-space-emerald'}`}>
                {activeAstronaut.mentalHealth.sleepDebtHours} hrs
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================================
       * SECTION 1: INTERACTIVE "LAST NIGHT'S SLEEP LOG" MANUAL WORKSTATION
       * ============================================================================== */}
      <div className="bg-space-panel border border-space-border-light rounded-xl p-5 shadow-2xl relative overflow-hidden">
        {/* Glow Accent Border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-space-cyan via-indigo-500 to-space-emerald" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-space-border/60 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-space-cyan-muted border border-space-cyan/40 flex items-center justify-center text-space-cyan shadow-inner">
              <BedDouble className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-space-text tracking-wide">
                  Log Last Night's Sleep & Circadian Record
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
                  REAL-TIME COUPLING
                </span>
              </div>
              <p className="text-xs text-space-dim">
                Directly updates astronaut sleep architecture, recalculates circadian alignment, and couples sympathetic autonomic vitals.
              </p>
            </div>
          </div>

          {/* Crew Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-space-dim">Astronaut:</span>
            <select
              value={selectedCrewId}
              onChange={(e) => {
                setSelectedCrewId(e.target.value);
                setSelectedAstronautId(e.target.value);
              }}
              className="bg-space-bg border border-space-border rounded-lg px-3 py-1.5 text-xs text-space-text font-mono focus:outline-none focus:border-space-cyan"
            >
              {crew.map((astro) => (
                <option key={astro.id} value={astro.id}>
                  {astro.name} ({astro.callsign} &bull; {astro.role})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Success Alert Banner */}
        {sleepSuccessMsg && (
          <div className="mb-5 bg-space-emerald-muted border border-space-emerald/40 text-space-emerald rounded-lg p-3 text-xs flex items-center gap-2 font-mono animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{sleepSuccessMsg}</span>
          </div>
        )}

        <form onSubmit={handleSleepSubmit} className="space-y-5">
          {/* Quick Presets Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-mono text-space-dim uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-space-cyan" />
                Quick Clinical Presets:
              </label>
              <span className="text-[11px] text-space-muted font-mono">NASA 8.0h Prescription Benchmark</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => applyPreset(4.5, 'POOR', 3, 'Fragmented sleep; persistent ECLSS fan noise & mission taskload.')}
                className={`py-2 px-3 rounded-lg border text-left text-xs transition flex items-center justify-between ${
                  sleepHours === 4.5 && sleepQuality === 'POOR'
                    ? 'bg-space-red-muted/40 border-space-red text-space-red font-semibold shadow'
                    : 'bg-space-bg/70 border-space-border/80 text-space-dim hover:text-space-text hover:border-space-border-light'
                }`}
              >
                <div>
                  <span className="block font-bold text-space-red">4.5h Sleep Deprived</span>
                  <span className="text-[10px] text-space-dim">Acute deficit &bull; +14 bpm drift</span>
                </div>
                <AlertTriangle className="w-4 h-4 text-space-red shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => applyPreset(8.0, 'OPTIMAL', 0, 'Uninterrupted deep restorative sleep window compliant with NASA-STD-3001.')}
                className={`py-2 px-3 rounded-lg border text-left text-xs transition flex items-center justify-between ${
                  sleepHours === 8.0 && sleepQuality === 'OPTIMAL'
                    ? 'bg-space-emerald-muted/40 border-space-emerald text-space-emerald font-semibold shadow'
                    : 'bg-space-bg/70 border-space-border/80 text-space-dim hover:text-space-text hover:border-space-border-light'
                }`}
              >
                <div>
                  <span className="block font-bold text-space-emerald">8.0h Optimal</span>
                  <span className="text-[10px] text-space-dim">NASA Standard &bull; Stable vitals</span>
                </div>
                <CheckCircle2 className="w-4 h-4 text-space-emerald shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => applyPreset(10.5, 'EXTENDED', 1, 'Extended post-EVA recovery sleep; mild morning grogginess / phase delay.')}
                className={`py-2 px-3 rounded-lg border text-left text-xs transition flex items-center justify-between ${
                  sleepHours === 10.5 && sleepQuality === 'EXTENDED'
                    ? 'bg-indigo-950/60 border-indigo-400 text-indigo-300 font-semibold shadow'
                    : 'bg-space-bg/70 border-space-border/80 text-space-dim hover:text-space-text hover:border-space-border-light'
                }`}
              >
                <div>
                  <span className="block font-bold text-indigo-300">10.5h Oversleep</span>
                  <span className="text-[10px] text-space-dim">Circadian inertia &bull; -2 bpm</span>
                </div>
                <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
              </button>
            </div>
          </div>

          {/* Main Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Inputs (7 Cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Hours Slept Slider + Input */}
              <div className="bg-space-bg/80 border border-space-border/80 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between font-mono">
                  <label className="text-xs text-space-dim flex items-center gap-1.5 font-semibold">
                    <Clock className="w-4 h-4 text-space-cyan" />
                    Total Hours Slept:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="2.0"
                      max="12.0"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                      className="w-20 bg-space-panel border border-space-border rounded px-2.5 py-1 text-right text-sm font-bold font-mono text-space-cyan focus:outline-none focus:border-space-cyan"
                    />
                    <span className="text-xs text-space-dim font-mono">hrs</span>
                  </div>
                </div>

                {/* Slider */}
                <input
                  type="range"
                  min="2.0"
                  max="12.0"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-cyan-400 bg-space-panel rounded cursor-pointer h-2"
                />

                {/* Slider Scale Reference */}
                <div className="flex justify-between text-[10px] text-space-dim font-mono pt-1">
                  <span className="text-space-red">2.0h (Severe Deficit)</span>
                  <span className="text-space-amber">6.0h (Threshold)</span>
                  <span className="text-space-emerald font-bold">8.0h (NASA Target)</span>
                  <span className="text-indigo-400">10.0h (Extended)</span>
                  <span>12.0h</span>
                </div>
              </div>

              {/* Quality & Awakenings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Sleep Quality */}
                <div className="bg-space-bg/80 border border-space-border/80 rounded-xl p-3.5 space-y-2">
                  <label className="text-xs font-mono text-space-dim block font-semibold">
                    Sleep Restorative Quality:
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(['POOR', 'FAIR', 'OPTIMAL', 'EXTENDED'] as SleepQualityType[]).map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSleepQuality(q)}
                        className={`py-1.5 px-2 rounded text-xs font-mono font-medium border text-center transition ${
                          sleepQuality === q
                            ? 'bg-space-cyan-muted text-space-cyan border-space-cyan font-bold shadow'
                            : 'bg-space-panel/60 border-space-border text-space-dim hover:text-space-text'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Awakenings / Interruption */}
                <div className="bg-space-bg/80 border border-space-border/80 rounded-xl p-3.5 space-y-2">
                  <label className="text-xs font-mono text-space-dim block font-semibold">
                    Awakenings / Disruptions:
                  </label>
                  <select
                    value={awakenings}
                    onChange={(e) => setAwakenings(Number(e.target.value))}
                    className="w-full bg-space-panel border border-space-border rounded-lg px-2.5 py-1.5 text-xs text-space-text font-mono focus:outline-none focus:border-space-cyan"
                  >
                    <option value={0}>0 &bull; Uninterrupted Sleep</option>
                    <option value={1}>1 &bull; Minor Cabin Disruption</option>
                    <option value={2}>2 &bull; Intermittent Awakenings</option>
                    <option value={3}>3 &bull; Frequent Fragmented (≥3)</option>
                    <option value={5}>5+ &bull; Severe Sleep Disruption</option>
                  </select>
                  <span className="text-[10px] text-space-dim block font-mono">
                    Affects restorative slow-wave sleep (SWS) ratio
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-mono text-space-dim block mb-1">
                  Surgeon / Astronaut Sleep Observations:
                </label>
                <input
                  type="text"
                  placeholder="E.g., pump vibration in crew quarters, high EVA task fatigue, blue-light exposure..."
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  className="w-full bg-space-bg border border-space-border rounded-lg px-3 py-2 text-xs text-space-text placeholder-space-dim focus:outline-none focus:border-space-cyan"
                />
              </div>

              {/* Checkbox (Checked ON by default): Apply physiological effect to live vitals & alerts */}
              <div className="bg-space-bg/90 border border-space-border/90 rounded-xl p-3.5 flex items-start gap-3">
                <input
                  id="applyVitalsCoupling"
                  type="checkbox"
                  checked={applyVitalsCoupling}
                  onChange={(e) => setApplyVitalsCoupling(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-space-border bg-space-panel text-space-cyan focus:ring-0 focus:ring-offset-0 cursor-pointer accent-cyan-500"
                />
                <label htmlFor="applyVitalsCoupling" className="text-xs cursor-pointer select-none">
                  <span className="font-semibold text-space-text flex items-center gap-1.5 font-mono">
                    <Activity className="w-3.5 h-3.5 text-space-cyan" />
                    Apply physiological effect to live vitals &amp; alerts
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
                      DEFAULT ACTIVE
                    </span>
                  </span>
                  <span className="text-[11px] text-space-dim block mt-0.5">
                    When checked, automatically shifts resting HR &amp; BP, injecting a coupled telemetry reading into Overview, Vitals, Cardiovascular, and Alert queues.
                  </span>
                </label>
              </div>
            </div>

            {/* Right Live Physiological Impact Preview (5 Cols) */}
            <div
              className={`lg:col-span-5 bg-space-bg/95 border ${
                applyVitalsCoupling ? 'border-space-cyan/40' : 'border-space-border/60'
              } rounded-xl p-4.5 flex flex-col justify-between shadow-xl relative overflow-hidden`}
            >
              {applyVitalsCoupling ? (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-2.5 border-b border-space-border/80">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-space-cyan animate-pulse" />
                      <span className="text-xs font-mono uppercase font-bold text-space-cyan tracking-wider">
                        Live Physiological Impact Preview
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        impactPreview.alertSeverity === 'CRITICAL'
                          ? 'bg-space-red-muted text-space-red border-space-red/50 animate-pulse'
                          : impactPreview.alertSeverity === 'CAUTION'
                          ? 'bg-space-amber-muted text-space-amber border-space-amber/50'
                          : 'bg-space-emerald-muted text-space-emerald border-space-emerald/40'
                      }`}
                    >
                      {impactPreview.alertBadgeText}
                    </span>
                  </div>

                  {/* Vitals Shifts */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {/* Predicted HR */}
                    <div className="bg-space-panel/80 border border-space-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-space-dim block uppercase">Resting Heart Rate</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold text-space-text">{impactPreview.predictedHr}</span>
                        <span className="text-[10px] text-space-dim">bpm</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] mt-1 font-semibold">
                        {impactPreview.hrDelta > 0 ? (
                          <span className="text-space-amber flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +{impactPreview.hrDelta} bpm drift
                          </span>
                        ) : impactPreview.hrDelta < 0 ? (
                          <span className="text-space-cyan flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" /> {impactPreview.hrDelta} bpm
                          </span>
                        ) : (
                          <span className="text-space-emerald">&plusmn;0 bpm (Nominal)</span>
                        )}
                      </div>
                    </div>

                    {/* Predicted BP */}
                    <div className="bg-space-panel/80 border border-space-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-space-dim block uppercase">Arterial Pressure</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-lg font-bold text-space-text">
                          {impactPreview.predictedSys}/{impactPreview.predictedDia}
                        </span>
                        <span className="text-[10px] text-space-dim">mmHg</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] mt-1 font-semibold">
                        {impactPreview.bpSysDelta > 0 ? (
                          <span className="text-space-amber flex items-center gap-0.5">
                            <TrendingUp className="w-3 h-3" /> +{impactPreview.bpSysDelta} Sys drift
                          </span>
                        ) : (
                          <span className="text-space-emerald">&plusmn;0 mmHg (Baseline)</span>
                        )}
                      </div>
                    </div>

                    {/* Cognitive Readiness */}
                    <div className="bg-space-panel/80 border border-space-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-space-dim block uppercase">Cognitive Readiness</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-lg font-bold ${
                            impactPreview.cognitiveReadiness < 60
                              ? 'text-space-red'
                              : impactPreview.cognitiveReadiness < 80
                              ? 'text-space-amber'
                              : 'text-space-emerald'
                          }`}
                        >
                          {impactPreview.cognitiveReadiness}%
                        </span>
                      </div>
                      <span className="text-[10px] text-space-dim block mt-1">
                        {impactPreview.cognitiveReadiness < 60
                          ? 'High reaction lag'
                          : impactPreview.cognitiveReadiness < 80
                          ? 'Guarded task capacity'
                          : 'Optimal focus'}
                      </span>
                    </div>

                    {/* Circadian Score */}
                    <div className="bg-space-panel/80 border border-space-border p-2.5 rounded-lg">
                      <span className="text-[10px] text-space-dim block uppercase">Circadian Alignment</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span
                          className={`text-lg font-bold ${
                            impactPreview.circadianAlignment < 75 ? 'text-space-amber' : 'text-space-cyan'
                          }`}
                        >
                          {impactPreview.circadianAlignment}
                        </span>
                        <span className="text-[10px] text-space-dim">/100</span>
                      </div>
                      <span className="text-[10px] text-space-dim block mt-1">
                        {impactPreview.circadianAlignment < 75 ? 'Phase Delay' : 'Synchronized'}
                      </span>
                    </div>
                  </div>

                  {/* Alert Preview Box */}
                  <div
                    className={`p-2.5 rounded-lg border text-xs font-mono ${
                      impactPreview.alertSeverity === 'CRITICAL'
                        ? 'bg-space-red-muted/30 border-space-red/40 text-space-red'
                        : impactPreview.alertSeverity === 'CAUTION'
                        ? 'bg-space-amber-muted/30 border-space-amber/40 text-space-amber'
                        : 'bg-space-emerald-muted/30 border-space-emerald/40 text-space-emerald'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold mb-0.5">
                      {impactPreview.alertSeverity !== 'NOMINAL' ? (
                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      )}
                      <span>{impactPreview.alertTitle}</span>
                    </div>
                    <p className="text-[10px] text-space-muted leading-tight">
                      {impactPreview.alertSeverity === 'CRITICAL'
                        ? 'Sympathetic hypertonia & cognitive vigilance breakdown triggered. Mandates prophylactic sleep countermeasure.'
                        : impactPreview.alertSeverity === 'CAUTION'
                        ? 'Autonomic cardiovascular drift flagged. Vitals and anomaly detector will register elevation.'
                        : 'Restorative architecture nominal. Autonomic tone maintained at baseline.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 my-auto py-6">
                  <div className="p-4 rounded-xl bg-space-panel/60 border border-dashed border-space-border text-center space-y-2.5 font-mono">
                    <div className="inline-flex items-center gap-1.5 text-xs text-space-cyan font-bold bg-space-cyan-muted px-2.5 py-1 rounded border border-space-cyan/30">
                      <Info className="w-3.5 h-3.5" />
                      <span>STANDALONE SLEEP LOGGING MODE</span>
                    </div>
                    <p className="text-xs text-space-muted max-w-sm mx-auto leading-relaxed">
                      Sleep duration ({sleepHours}h) and restorative architecture will be updated on the 7-day sleep chart and actigraphy logs. Live cardiovascular vitals, pre-flight baseline deltas, and automated physiological alerts will remain unchanged.
                    </p>
                    <div className="pt-2 border-t border-space-border/60 flex justify-center gap-4 text-[11px] text-space-dim">
                      <span>Resting HR: <strong className="text-space-text">{baseHr} bpm</strong></span>
                      <span>BP: <strong className="text-space-text">{baseSys}/{baseDia} mmHg</strong></span>
                      <span>Alerts: <strong className="text-space-emerald">Suppressed</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-3 border-t border-space-border/80">
                <button
                  type="submit"
                  disabled={isSubmittingSleep}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold transition flex items-center justify-center gap-2 text-xs font-mono shadow-lg disabled:opacity-50 ${
                    applyVitalsCoupling
                      ? 'bg-space-cyan text-space-bg hover:bg-space-cyan/90'
                      : 'bg-space-panel border border-space-cyan/50 text-space-cyan hover:bg-space-cyan-muted'
                  }`}
                >
                  {isSubmittingSleep ? (
                    <>
                      <Activity className="w-4 h-4 animate-spin" />
                      <span>Propagating Telemetry...</span>
                    </>
                  ) : applyVitalsCoupling ? (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Sleep Log &amp; Propagate Telemetry</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Save Standalone Sleep Log</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* ==============================================================================
       * SECTION 2: DYNAMIC MENTAL HEALTH & CIRCADIAN KPI CARDS
       * ============================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Circadian Alignment */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-space-cyan" />
              Circadian Phase
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isCircadianSuboptimal
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isCircadianSuboptimal ? 'Phase Delay' : 'Synchronized'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isCircadianSuboptimal ? 'text-space-amber' : 'text-space-cyan'}`}>
                {activeAstronaut.mentalHealth.currentCircadianAlignment}
              </span>
              <span className="text-xs text-space-muted">/ 100 Index</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Target Standard</span>
              <span className="text-space-text">&ge; 80 Sync</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Perceived Stress Index */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-space-amber" />
              Perceived Stress
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isStressElevated
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isStressElevated ? 'Elevated (≥6)' : 'Managed'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isStressElevated ? 'text-space-amber' : 'text-space-text'}`}>
                {activeAstronaut.mentalHealth.currentStressIndex}
              </span>
              <span className="text-xs text-space-muted">/ 10 Scale</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Clinical Baseline</span>
              <span className="text-space-text">&le; 4.0 Normal</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cognitive Readiness */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-space-emerald" />
              Cognitive Readiness
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                readiness < 65
                  ? 'bg-space-red-muted text-space-red border-space-red/30'
                  : readiness < 80
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {readiness < 65 ? 'Fatigued' : readiness < 80 ? 'Guarded' : 'Optimal'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-bold font-mono ${
                  readiness < 65
                    ? 'text-space-red'
                    : readiness < 80
                    ? 'text-space-amber'
                    : 'text-space-emerald'
                }`}
              >
                {readiness}%
              </span>
              <span className="text-xs text-space-muted">Vigilance</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Psychomotor Task</span>
              <span className="text-space-text">&ge; 85% Required</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Sleep Efficiency */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-space-cyan" />
              Sleep Efficiency
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              Actigraphy
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {activeAstronaut.mentalHealth.weeklyAvgEfficiencyPct}%
              </span>
              <span className="text-xs text-space-muted">Efficiency</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>NASA Standard</span>
              <span className="text-space-text">&ge; 85% Efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* ==============================================================================
       * SECTION 3: 7-DAY SLEEP ARCHITECTURE STACKED BAR CHART
       * ============================================================================== */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-space-border/60 gap-2">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Moon className="w-4 h-4 text-space-cyan" />
              7-Day Sleep Architecture Breakdown (Deep, REM, Light vs 8.0h Target)
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Continuous actigraphy and polysomnography telemetry estimating restorative sleep stages across rolling mission nights.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-space-dim">8.0h NASA Sleep Prescription</span>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={activeAstronaut.mentalHealth.sleepArchitecture7d}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
              <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 12]} />
              <Tooltip content={<DarkSleepTooltip />} />
              <ReferenceLine
                y={8.0}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: 'Target Sleep (8.0h)',
                  fill: '#10B981',
                  fontSize: 9,
                  position: 'insideTopRight',
                }}
              />
              <Bar dataKey="deepSleepHours" name="Deep / SWS Sleep" stackId="sleep" fill="#06B6D4" />
              <Bar dataKey="remSleepHours" name="REM Sleep" stackId="sleep" fill="#818CF8" />
              <Bar dataKey="lightSleepHours" name="Light Sleep" stackId="sleep" fill="#334155" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="totalSleepHours"
                name="Total Hours"
                stroke="#F1F5F9"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-space-cyan" /> Deep SWS
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> REM
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Light Sleep
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Target 8h
            </span>
          </div>
          <span>Source: SIMULATED ACTIGRAPHY & WORKSTATION LOGS</span>
        </div>
      </div>

      {/* ==============================================================================
       * SECTION 4: RECENT SLEEP LOGS HISTORY TABLE (From Global State)
       * ============================================================================== */}
      {loggedHistory.length > 0 && (
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-space-border/60">
            <div className="flex items-center gap-2">
              <BedDouble className="w-4 h-4 text-space-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted">
                Logged Sleep Records for {activeAstronaut.name}
              </h2>
            </div>
            <span className="text-xs font-mono text-space-dim">{loggedHistory.length} Logged Sessions</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-space-border text-space-dim text-[11px]">
                  <th className="pb-2">Log ID</th>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Duration</th>
                  <th className="pb-2">Quality</th>
                  <th className="pb-2">Awakenings</th>
                  <th className="pb-2">Vitals Coupled</th>
                  <th className="pb-2">Surgeon Notes</th>
                  <th className="pb-2">Provenance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-space-border/40">
                {loggedHistory.map((log) => (
                  <tr key={log.id} className="hover:bg-space-bg/40">
                    <td className="py-2 text-space-cyan font-bold">{log.id}</td>
                    <td className="py-2 text-space-text">{log.date}</td>
                    <td className="py-2 font-bold text-space-text">{log.hours_slept} hrs</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.sleep_quality === 'OPTIMAL'
                            ? 'bg-space-emerald-muted text-space-emerald border border-space-emerald/40'
                            : log.sleep_quality === 'POOR'
                            ? 'bg-space-red-muted text-space-red border border-space-red/40'
                            : 'bg-space-amber-muted text-space-amber border border-space-amber/40'
                        }`}
                      >
                        {log.sleep_quality}
                      </span>
                    </td>
                    <td className="py-2 text-space-dim">{log.awakenings} wakes</td>
                    <td className="py-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          log.coupled_to_vitals
                            ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/30'
                            : 'bg-space-panel text-space-dim border border-space-border'
                        }`}
                      >
                        {log.coupled_to_vitals ? 'YES (Live Stream)' : 'NO (Standalone)'}
                      </span>
                    </td>
                    <td className="py-2 text-space-muted truncate max-w-[240px]">"{log.notes}"</td>
                    <td className="py-2 text-[10px] text-space-dim">SYNTHETIC_SIMULATED</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==============================================================================
       * SECTION 5: BEHAVIORAL SELF-ASSESSMENT & SCIENTIFIC GROUNDING
       * ============================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Behavioral Form */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
                <Brain className="w-4 h-4 text-space-cyan" />
                Astronaut Daily Behavioral Self-Assessment
              </h2>
              <p className="text-xs text-space-dim mt-0.5">
                Simulated daily psychological evaluation submitted directly to flight surgeon logs.
              </p>
            </div>
            <span className="text-[11px] font-mono text-space-cyan">{activeAstronaut.callsign}</span>
          </div>

          {checkInSuccess && (
            <div className="bg-space-emerald-muted border border-space-emerald/40 text-space-emerald rounded-lg p-3 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Assessment logged successfully & verified against clinical baseline!</span>
            </div>
          )}

          <form onSubmit={handleSubmitCheckIn} className="space-y-3.5 text-xs">
            {/* Mood Slider */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Subjective Mood Rating:</span>
                <span className="text-space-cyan font-bold">{formMood} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formMood}
                onChange={(e) => setFormMood(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-space-bg rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-space-dim font-mono">
                <span>1: Distressed / Low</span>
                <span>3: Neutral</span>
                <span>5: Energized / Optimal</span>
              </div>
            </div>

            {/* Perceived Stress Slider */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Perceived Workload / Stress:</span>
                <span className={`font-bold ${formStress >= 6 ? 'text-space-amber' : 'text-space-text'}`}>
                  {formStress} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formStress}
                onChange={(e) => setFormStress(Number(e.target.value))}
                className="w-full accent-amber-400 bg-space-bg rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-space-dim font-mono">
                <span>1: Calm</span>
                <span>5: Moderate Taskload</span>
                <span>10: High Strain</span>
              </div>
            </div>

            {/* Sleep Quality Rating */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Subjective Restorative Sleep Quality:</span>
                <span className="text-space-text font-bold">{formSleepQual} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formSleepQual}
                onChange={(e) => setFormSleepQual(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-space-bg rounded cursor-pointer"
              />
            </div>

            {/* Cognitive Fatigue Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-space-bg border border-space-border">
              <div>
                <span className="text-space-text font-semibold block">Cognitive Fatigue / Reaction Lag</span>
                <span className="text-[11px] text-space-dim">
                  Noticeable delays during checklist execution or robotic arm tasks
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFormCognitiveFatigue(!formCognitiveFatigue)}
                className={`px-3 py-1 text-xs rounded font-bold transition ${
                  formCognitiveFatigue
                    ? 'bg-space-amber-muted text-space-amber border border-space-amber/40'
                    : 'bg-space-panel text-space-dim border border-space-border'
                }`}
              >
                {formCognitiveFatigue ? 'Flagged Yes' : 'No Lag'}
              </button>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-space-dim font-mono block mb-1">
                Astronaut Notes / Environmental Factors:
              </label>
              <textarea
                rows={2}
                placeholder="E.g., high pump noise in crew quarters, blue spectrum light glare, EVA prep fatigue..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full bg-space-bg border border-space-border rounded-lg p-2.5 text-xs text-space-text placeholder-space-dim focus:outline-none focus:border-space-cyan resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-space-cyan text-space-bg font-bold hover:bg-space-cyan/90 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Behavioral Assessment Log
            </button>
          </form>
        </div>

        {/* Check-In History & Scientific Grounding */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* History */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-space-border/60">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
                <Clock className="w-4 h-4 text-space-cyan" />
                Recent Check-In History & Surgeon Notes
              </h2>
              <span className="text-xs font-mono text-space-dim">
                {(activeAstronaut.mentalHealth.checkInHistory || []).length} Logged Entries
              </span>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {(activeAstronaut.mentalHealth.checkInHistory || []).map((chk) => (
                <div key={chk.id} className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-space-dim font-mono text-[11px]">
                    <span className="text-space-cyan font-semibold">{chk.id}</span>
                    <span>{new Date(chk.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</span>
                  </div>
                  <div className="flex items-center gap-4 text-space-text font-mono">
                    <span>
                      Mood: <strong className="text-space-cyan">{chk.moodRating}/5</strong>
                    </span>
                    <span>
                      Stress:{' '}
                      <strong className={chk.perceivedStress >= 6 ? 'text-space-amber' : 'text-space-text'}>
                        {chk.perceivedStress}/10
                      </strong>
                    </span>
                    <span>
                      Sleep Qual: <strong>{chk.sleepQuality}/5</strong>
                    </span>
                    {chk.cognitiveFatigue && (
                      <span className="text-space-amber font-bold text-[10px] px-1.5 py-0.2 rounded bg-space-amber-muted border border-space-amber/30">
                        Fatigue Alert
                      </span>
                    )}
                  </div>
                  <p className="text-space-muted text-[11px] pt-1 leading-snug">"{chk.notes}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Context Panel */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-space-cyan font-semibold text-sm pb-1 border-b border-space-border/60">
              <BookOpen className="w-4 h-4" />
              <span>NASA NLSP & HRP Behavioral Health & Sleep Research</span>
            </div>
            <p className="text-xs text-space-muted leading-relaxed">
              Extended missions inside Isolated, Confined, and Extreme (ICE) environments produce circadian phase misalignment, elevated cortisol, and fragmented sleep architecture. NASA Human Research Program protocols mandate scheduled 8-hour sleep opportunities, dynamic spectrum Solid-State Light Assemblies (SSLAs), and non-invasive actigraphy surveillance to protect mission cognitive performance.
            </p>
            <div className="pt-1 text-[11px] font-mono text-space-cyan flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Reference: NASA HRP Behavioral Health and Performance (BHP) Risk Standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
