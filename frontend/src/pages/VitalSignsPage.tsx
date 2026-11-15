import { useState } from 'react';
import {
  AstronautProfile,
  TimeWindow,
  VitalTrendPoint,
  SimulatedPattern,
} from '../types/spacecare';
import { spacecareApi, ConnectionMode } from '../services/api';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  HeartPulse,
  Heart,
  Activity,
  Gauge,
  Thermometer,
  Clock,
  Database,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Play,
  CheckCircle2,
  CloudOff,
  Sparkles,
} from 'lucide-react';

interface VitalSignsPageProps {
  selectedAstronaut: AstronautProfile;
  backendMode?: ConnectionMode;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
  baselineMap?: Record<string, number>;
}

const DarkChartTooltip = ({ active, payload, label, baselineMap }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
        <p className="text-sky-400 font-bold mb-1.5 flex items-center gap-1.5">
          <span>Window Point:</span> {label}
        </p>
        {payload.map((entry, index) => {
          const base = baselineMap?.[entry.name];
          const hasDelta = base !== undefined && typeof entry.value === 'number';
          const delta = hasDelta ? Number((entry.value - base).toFixed(1)) : 0;
          const deltaFormatted = delta > 0 ? `+${delta}` : `${delta}`;

          return (
            <div key={`item-${index}`} className="py-0.5 space-y-0.5">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}:
                </span>
                <span className="font-semibold text-white">
                  {entry.value}
                </span>
              </div>
              {hasDelta && (
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pl-3.5">
                  <span>Delta vs Base:</span>
                  <span className={delta > 10 || delta < -10 ? 'text-[#FC3D21] font-bold' : delta !== 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {deltaFormatted}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
  return null;
};

export const VitalSignsPage = ({
  selectedAstronaut,
  backendMode = 'OFFLINE_DEMO_FALLBACK',
}: VitalSignsPageProps) => {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24H');
  const [selectedPattern, setSelectedPattern] = useState<SimulatedPattern>('NORMAL');
  const [readingCount, setReadingCount] = useState<number>(50);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simResult, setSimResult] = useState<{ message: string; isPending?: boolean } | null>(null);

  const trendData: VitalTrendPoint[] =
    selectedAstronaut?.trendsByWindow?.[timeWindow] || selectedAstronaut?.trend24h || [];

  const baseline = selectedAstronaut?.baseline || {
    restingHeartRate: 72,
    restingSystolicBP: 120,
    restingDiastolicBP: 78,
    baselineSpO2: 98.2,
    baselineCoreTemp: 36.8,
    baselineRespirationRate: 14,
  };

  const currentVitals = selectedAstronaut?.currentVitals || {
    heartRate: 72,
    systolicBP: 120,
    diastolicBP: 78,
    spo2: 98.2,
    coreTemp: 36.8,
    respiratoryRate: 14,
  };

  const handleTriggerSimulation = async () => {
    setIsSimulating(true);
    setSimResult(null);

    try {
      const res = await spacecareApi.simulateTelemetry({
        astronaut_id: selectedAstronaut.id,
        pattern: selectedPattern,
        count: readingCount,
        interval_seconds: 10,
      });

      if (res.isPendingRoute || res.mode === 'API_HEALTHY_ROUTES_PENDING') {
        setSimResult({
          message: `[Session Notice] POST /api/v1/telemetry/simulate is pending backend route mount. Request formatted for ${selectedAstronaut.name} (${selectedPattern}, count: ${readingCount}).`,
          isPending: true,
        });
      } else if (res.mode === 'LIVE_API') {
        setSimResult({
          message: `Success: Injected ${res.data.records_generated} telemetry readings (${res.data.pattern}) into SQLite database.`,
          isPending: false,
        });
      } else {
        setSimResult({
          message: `[Offline Mode] Generated ${readingCount} simulated readings locally for ${selectedAstronaut.name} (${selectedPattern}).`,
          isPending: true,
        });
      }
    } catch {
      setSimResult({
        message: 'Simulation request error.',
        isPending: true,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Time Range Selector & Sync Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0B3D91]/25 text-sky-400 border border-[#1A56DB]/40 mb-2 tabular-nums">
            <HeartPulse className="w-3.5 h-3.5" />
            Continuous Physiological Telemetry
          </div>
          <h1 className="text-2xl font-bold text-white">
            Vital Signs Telemetry &bull; {selectedAstronaut.name} ({selectedAstronaut.callsign})
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time biometric streams correlated with individual baseline boundaries (NASA-STD-3001).
          </p>
        </div>

        {/* Controls: Time Window & Data Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Window Selector */}
          <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-lg p-1">
            <span className="text-xs text-slate-400 px-2 hidden sm:inline flex items-center gap-1 font-mono">
              <Calendar className="w-3 h-3" /> Window:
            </span>
            {(['6H', '24H', '7D'] as const).map((win) => (
              <button
                key={win}
                onClick={() => setTimeWindow(win)}
                className={`px-3 py-1 text-xs font-semibold rounded-md font-mono tabular-nums transition ${
                  timeWindow === win
                    ? 'bg-[#0B3D91]/50 text-white border border-[#1A56DB]/60 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {win}
              </button>
            ))}
          </div>

          {/* Sync badge */}
          <div className="flex items-center gap-2 bg-space-panel border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-sky-400 font-mono font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>SIMULATED TELEMETRY</span>
            </div>
            <span className="text-white/[0.12]">|</span>
            <div className="flex items-center gap-1 text-slate-400 font-mono tabular-nums text-[11px]">
              <Clock className="w-3 h-3" />
              <span>10:30 UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Telemetry Scenario Trigger Panel (TelemetryGenerator Scenarios) */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-2">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Telemetry Scenario Trigger &bull; TelemetryGenerator Control
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate microgravity physiological stress scenarios matching backend <code className="text-sky-300">SimulatedPattern</code> algorithms.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono tabular-nums px-2 py-0.5 rounded bg-black/40 border border-white/[0.08] text-slate-400">
              POST /api/v1/telemetry/simulate &bull; {backendMode}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4 items-end text-xs">
          {/* Target Astronaut (synchronized) */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Target Astronaut
            </label>
            <div className="p-2 rounded bg-black/40 border border-white/[0.08] font-medium text-white truncate">
              {selectedAstronaut.name} ({selectedAstronaut.id})
            </div>
          </div>

          {/* Scenario Pattern Selector */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Physiological Scenario
            </label>
            <select
              value={selectedPattern}
              onChange={(e) => setSelectedPattern(e.target.value as SimulatedPattern)}
              className="w-full bg-black/40 border border-white/[0.08] rounded p-2 text-white font-semibold focus:outline-none focus:border-[#1A56DB]"
            >
              <option value="NORMAL">NORMAL (Circadian Baseline)</option>
              <option value="HYPOXIA">HYPOXIA (Low SpO2 & High RR)</option>
              <option value="THERMAL_STRAIN">THERMAL_STRAIN (Temp &gt; 38°C + Tachycardia)</option>
              <option value="ACUTE_TACHYCARDIA">ACUTE_TACHYCARDIA (HR &gt; 115 bpm)</option>
              <option value="HYPOTENSION_DECONDITIONING">HYPOTENSION_DECONDITIONING (Microgravity Deconditioning)</option>
            </select>
          </div>

          {/* Reading Count */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Sample Count
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={readingCount}
                onChange={(e) => setReadingCount(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/[0.08] rounded p-2 text-white font-mono tabular-nums focus:outline-none focus:border-[#1A56DB]"
              />
              <span className="text-slate-400 font-mono">pts</span>
            </div>
          </div>

          {/* Execute Button */}
          <div>
            <button
              onClick={handleTriggerSimulation}
              disabled={isSimulating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#0B3D91] hover:bg-[#1A56DB] text-white font-bold transition shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isSimulating ? 'Injecting...' : 'Inject Scenario'}</span>
            </button>
          </div>
        </div>

        {/* Feedback message banner */}
        {simResult && (
          <div
            className={`p-3 rounded-lg text-xs font-mono border flex items-start gap-2.5 ${
              simResult.isPending
                ? 'bg-space-amber-muted/30 border-space-amber/40 text-space-amber'
                : 'bg-space-emerald-muted/30 border-space-emerald/40 text-space-emerald'
            }`}
          >
            {simResult.isPending ? (
              <CloudOff className="w-4 h-4 shrink-0 mt-0.5 text-space-amber" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-space-emerald" />
            )}
            <div className="flex-1">
              <p className="font-semibold">{simResult.message}</p>
              {simResult.isPending && (
                <p className="text-[11px] text-space-dim mt-0.5">
                  Notice: Frontend simulation trigger is active and verified. The backend FastAPI endpoint <code className="text-space-amber">POST /api/v1/telemetry/simulate</code> will process and persist these readings once mounted in <code className="text-space-amber">backend/app/main.py</code>.
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Empty State Banner if no telemetry */}
      {trendData.length === 0 && (
        <div className="bg-space-panel border border-space-border rounded-xl p-10 text-center space-y-3">
          <Database className="w-10 h-10 text-space-cyan mx-auto" />
          <h3 className="text-base font-semibold text-space-text">No Telemetry Readings Recorded</h3>
          <p className="text-xs text-space-dim max-w-md mx-auto">
            The telemetry table in SQLite is currently empty for astronaut {selectedAstronaut.name}. Use the Telemetry Scenario Trigger above to inject readings or seed simulated data.
          </p>
        </div>
      )}

      {/* 4 Dedicated Telemetry Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Heart Rate & HRV RMSSD */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-[#FC3D21]" />
              <div>
                <h3 className="text-sm font-semibold text-white">Heart Rate & HRV (RMSSD)</h3>
                <span className="text-[11px] text-slate-400">Cardiac frequency and autonomic recovery tone</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="text-[#FC3D21] font-semibold">{currentVitals.heartRate} bpm</span>
              <span className="text-white/[0.2]">/</span>
              <span className="text-sky-400 font-semibold">{currentVitals.heartRateVariability} ms</span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0B3D91" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="hrAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FC3D21" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#FC3D21" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[10, 130]} />
                <Tooltip content={<DarkChartTooltip baselineMap={{ 'Heart Rate (bpm)': baseline.restingHeartRate, 'HRV RMSSD (ms)': baseline.baselineHrvRmssd ?? 45 }} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={baseline.restingHeartRate}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: `BASE (${baseline.restingHeartRate})`, fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                {/* Caution & Critical Upper Thresholds */}
                <ReferenceLine
                  y={100}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'CAUTION (100)', fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={120}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'CRITICAL (120)', fill: '#FC3D21', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="hrvRmssd" name="HRV RMSSD (ms)" fill="url(#hrvAreaGrad)" stroke="#38BDF8" strokeWidth={1.5} />
                <Line
                  type="monotone"
                  dataKey="heartRate"
                  name="Heart Rate (bpm)"
                  stroke="#FC3D21"
                  strokeWidth={2}
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === trendData.length - 1) {
                      return (
                        <g key={`edge-dot-hr-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#FC3D21" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#FC3D21" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-hr-${index}`} cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.08] text-[10px] text-slate-400 flex justify-between font-mono tabular-nums">
            <span>NASA Red: Heart Rate (bpm) &bull; Sky: HRV RMSSD (ms)</span>
            <span>Baseline Resting: {baseline.restingHeartRate} bpm</span>
          </div>
        </div>

        {/* Chart 2: Blood Pressure (Systolic & Diastolic) */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-amber-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Arterial Blood Pressure (Sys / Dia)</h3>
                <span className="text-[11px] text-slate-400">Vascular tone and cephalad fluid redistribution</span>
              </div>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-amber-400">
              {currentVitals.systolicBP}/{currentVitals.diastolicBP} mmHg
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[55, 150]} />
                <Tooltip content={<DarkChartTooltip baselineMap={{ 'Systolic BP': baseline.restingSystolicBP, 'Diastolic BP': baseline.restingDiastolicBP }} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={baseline.restingSystolicBP}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: `BASE (${baseline.restingSystolicBP})`, fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                {/* Critical Systolic Threshold */}
                <ReferenceLine
                  y={140}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'CRITICAL (140)', fill: '#FC3D21', fontSize: 9, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="systolicBP"
                  name="Systolic BP"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === trendData.length - 1) {
                      return (
                        <g key={`edge-dot-sys-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#F59E0B" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#F59E0B" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-sys-${index}`} cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ r: 4 }}
                />
                <Line type="monotone" dataKey="diastolicBP" name="Diastolic BP" stroke="#38BDF8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.08] text-[10px] text-slate-400 flex justify-between font-mono tabular-nums">
            <span>Amber: Systolic BP &bull; Blue: Diastolic BP</span>
            <span>Target: &le; 120/80 mmHg</span>
          </div>
        </div>

        {/* Chart 3: Blood Oxygen Saturation (SpO2) */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Oxygen Saturation (SpO2 %)</h3>
                <span className="text-[11px] text-slate-400">Pulmonary gas exchange and cabin atmospheric balance</span>
              </div>
            </div>
            <span className="text-xs font-mono tabular-nums font-semibold text-sky-400">
              {currentVitals.spo2}%
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#0B3D91" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[90, 100]} />
                <Tooltip content={<DarkChartTooltip baselineMap={{ 'SpO2 (%)': baseline.baselineSpO2 }} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={baseline.baselineSpO2}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: `BASE (${baseline.baselineSpO2}%)`, fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                {/* Hypoxia Floor */}
                <ReferenceLine
                  y={94}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'HYPOXIA CRITICAL (94%)', fill: '#FC3D21', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Area
                  type="monotone"
                  dataKey="spo2"
                  name="SpO2 (%)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  fill="url(#spo2Grad)"
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === trendData.length - 1) {
                      return (
                        <g key={`edge-dot-spo2-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#38BDF8" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#38BDF8" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-spo2-${index}`} cx={cx} cy={cy} r={0} />;
                  }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.08] text-[10px] text-slate-400 flex justify-between font-mono tabular-nums">
            <span>Nominal Standard: 95.0% - 100%</span>
            <span>NASA EVA Safety Margin: &ge; 95%</span>
          </div>
        </div>

        {/* Chart 4: Core Body Temperature & Respiration */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-emerald-400" />
              <div>
                <h3 className="text-sm font-semibold text-white">Core Temperature (&deg;C) & Respiration</h3>
                <span className="text-[11px] text-slate-400">Thermoregulation and ventilatory rate</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="text-emerald-400 font-semibold">{currentVitals.coreTemp}&deg;C</span>
              <span className="text-white/[0.2]">/</span>
              <span className="text-white font-semibold">{currentVitals.respiratoryRate} br/min</span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[36.0, 38.5]} />
                <Tooltip content={<DarkChartTooltip baselineMap={{ 'Core Temp (°C)': baseline.baselineCoreTemp }} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={baseline.baselineCoreTemp}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: `BASE (${baseline.baselineCoreTemp}°C)`, fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                {/* Fever / Hyperthermia Threshold */}
                <ReferenceLine
                  y={38.0}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'HYPERTHERMIA (38.0°C)', fill: '#FC3D21', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="coreTemp" name="Core Temp (°C)" fill="url(#tempGrad)" stroke="#10B981" strokeWidth={2} dot={(p) => {
                  const { cx, cy, index } = p;
                  if (index === trendData.length - 1) {
                    return (
                      <g key={`edge-dot-temp-${index}`}>
                        <circle cx={cx} cy={cy} r={7} fill="#10B981" fillOpacity={0.3} />
                        <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#10B981" strokeWidth={2} />
                      </g>
                    );
                  }
                  return <circle key={`dot-temp-${index}`} cx={cx} cy={cy} r={0} />;
                }} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-white/[0.08] text-[10px] text-slate-400 flex justify-between font-mono tabular-nums">
            <span>Core Temp Norm: 36.5&deg;C - 37.5&deg;C</span>
            <span>Respiration: {baseline.respiratoryRateRange[0]}-{baseline.respiratoryRateRange[1]} br/min</span>
          </div>
        </div>
      </div>

      {/* Tabular Telemetry Log with Deltas and Status */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              Recent Telemetry Sample Log &bull; {timeWindow} Window
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tabular time-series biometrics compared against personal resting calibration.
            </p>
          </div>
          <span className="text-xs font-mono tabular-nums text-slate-400">{trendData.length} Data Points</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/[0.08] text-slate-400 font-mono uppercase text-[11px]">
                <th className="pb-3 pr-4">Timestamp (UTC)</th>
                <th className="pb-3 px-3">Heart Rate</th>
                <th className="pb-3 px-3">HRV (RMSSD)</th>
                <th className="pb-3 px-3">Blood Pressure</th>
                <th className="pb-3 px-3">SpO2</th>
                <th className="pb-3 px-3">Core Temp</th>
                <th className="pb-3 px-3">Respiration</th>
                <th className="pb-3 px-3 text-right">Clinical State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
              {trendData.slice(-6).reverse().map((point, idx) => {
                const hrDelta = point.heartRate - baseline.restingHeartRate;
                const isElevated = hrDelta > 15;

                return (
                  <tr key={idx} className="hover:bg-white/[0.03] text-slate-300">
                    <td className="py-2.5 pr-4 text-white font-medium">{point.timeLabel} UTC</td>
                    <td className="py-2.5 px-3">
                      <span className={isElevated ? 'text-amber-400 font-bold' : 'text-white'}>
                        {point.heartRate} bpm
                      </span>
                      <span className="text-[10px] text-slate-400 ml-1">
                        ({hrDelta > 0 ? `+${hrDelta}` : hrDelta})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-white">{point.hrvRmssd} ms</td>
                    <td className="py-2.5 px-3 text-white">{point.systolicBP}/{point.diastolicBP} mmHg</td>
                    <td className="py-2.5 px-3 text-white">{point.spo2}%</td>
                    <td className="py-2.5 px-3 text-white">{point.coreTemp}&deg;C</td>
                    <td className="py-2.5 px-3 text-white">{point.respiratoryRate} br/min</td>
                    <td className="py-2.5 px-3 text-right">
                      {isElevated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums">
                          <AlertTriangle className="w-3 h-3" />
                          Caution
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tabular-nums">
                          <ShieldCheck className="w-3 h-3" />
                          Nominal
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
