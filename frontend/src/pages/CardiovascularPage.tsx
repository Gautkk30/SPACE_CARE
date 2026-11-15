import { useState } from 'react';
import { AstronautProfile } from '../types/spacecare';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Activity,
  Heart,
  TrendingUp,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  BookOpen,
  Info,
  Droplets,
  Layers,
} from 'lucide-react';

interface CardiovascularPageProps {
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
  baselineHr?: number;
}

const DarkCardioTooltip = ({ active, payload, label, baselineHr = 72 }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
        <p className="text-sky-400 font-bold mb-1.5">{label}</p>
        {payload.map((entry, index) => {
          const isHr = entry.name.toLowerCase().includes('hr') || entry.name.toLowerCase().includes('heart');
          const delta = isHr && typeof entry.value === 'number' ? Number((entry.value - baselineHr).toFixed(1)) : null;

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
              {delta !== null && (
                <div className="flex items-center justify-between gap-4 text-[10px] text-slate-400 pl-3.5">
                  <span>Delta vs Base:</span>
                  <span className={delta > 10 ? 'text-[#FC3D21] font-bold' : delta > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {delta > 0 ? `+${delta}` : delta} bpm
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

export const CardiovascularPage = ({ selectedAstronaut }: CardiovascularPageProps) => {
  const [activeChartMetric, setActiveChartMetric] = useState<'hr_map' | 'orthostatic'>('hr_map');
  const cardiovascular = selectedAstronaut?.cardiovascular || {
    restingHrDrift: 4,
    meanArterialPressure: 93,
    pulsePressure: 42,
    strokeVolumeIndex: 44,
    orthostaticToleranceScore: 82,
    fluidShiftSeverity: 'Nominal' as const,
    jugularVenousDistension: false,
    cardiacWorkloadIndex: 7800,
    dailyDriftHistory: [],
    referenceStandards: {
      orthostaticAlertThreshold: 65,
      mapNominalMin: 70,
      mapNominalMax: 105,
    },
  };
  const baseline = selectedAstronaut?.baseline || {
    restingHeartRate: 72,
    restingSystolicBP: 120,
    restingDiastolicBP: 78,
    baselineSpO2: 98.2,
    baselineCoreTemp: 36.8,
    baselineRespirationRate: 14,
  };
  const name = selectedAstronaut?.name || 'Astronaut';
  const callsign = selectedAstronaut?.callsign || 'CREW';

  const isDriftHigh = (cardiovascular.restingHrDrift ?? 0) > 10;
  const isOrthoVulnerable = (cardiovascular.orthostaticToleranceScore ?? 100) < (cardiovascular.referenceStandards?.orthostaticAlertThreshold ?? 65);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0B3D91]/25 text-sky-400 border border-[#1A56DB]/40 mb-2 tabular-nums">
            <Activity className="w-3.5 h-3.5" />
            Microgravity Hemodynamics & Adaptation
          </div>
          <h1 className="text-2xl font-bold text-white">
            Cardiovascular Health &bull; {name} ({callsign})
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cephalad fluid shifting, resting autonomic drift, and orthostatic deconditioning surveillance.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-space-panel border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums">
          <Droplets className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Fluid Shift Status:</span>
          <span
            className={`font-semibold ${
              cardiovascular.fluidShiftSeverity === 'Nominal'
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}
          >
            {cardiovascular.fluidShiftSeverity}
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Resting HR Drift */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-[#FC3D21]" />
              Resting HR Drift
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${
                isDriftHigh
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              }`}
            >
              {isDriftHigh ? 'Elevated Drift' : 'Nominal Drift'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono tabular-nums ${isDriftHigh ? 'text-amber-400' : 'text-white'}`}>
                {cardiovascular.restingHrDrift > 0 ? `+${cardiovascular.restingHrDrift}` : cardiovascular.restingHrDrift}
              </span>
              <span className="text-xs text-slate-400 font-mono">bpm vs Launch</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Pre-Flight Baseline</span>
              <span className="text-slate-300">{baseline.restingHeartRate} bpm</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Mean Arterial Pressure (MAP) */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-amber-400" />
              Mean Arterial Pressure
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tabular-nums">
              In Bounds
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {cardiovascular.meanArterialPressure}
              </span>
              <span className="text-xs text-slate-400 font-mono">mmHg (MAP)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Standard Envelope</span>
              <span className="text-slate-300">70 - 105 mmHg</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Orthostatic Tolerance Score */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Orthostatic Index
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${
                isOrthoVulnerable
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              }`}
            >
              {isOrthoVulnerable ? 'Caution (<75)' : 'Nominal (≥75)'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-bold font-mono tabular-nums ${
                  isOrthoVulnerable ? 'text-amber-400' : 'text-sky-300'
                }`}
              >
                {cardiovascular.orthostaticToleranceScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Re-Entry Threshold</span>
              <span className="text-slate-300">&ge; 75 Index Score</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Baroreflex & Stroke Volume */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              Stroke Volume Index
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 tabular-nums">
              Calibrated
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {cardiovascular.strokeVolumeIndex}
              </span>
              <span className="text-xs text-slate-400 font-mono">mL/m&sup2;</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Baroreflex Sensitivity</span>
              <span className="text-slate-300">{cardiovascular.baroreflexSensitivity} ms/mmHg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Progression Chart: Launch (Day 0) to Present (Day 84) */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div>
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              Longitudinal Mission Progression (Launch Day 0 &rarr; Day 84 Current)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Evaluating chronic cardiovascular deconditioning and baroreflex compensation over 12 weeks of spaceflight.
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveChartMetric('hr_map')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono tabular-nums transition ${
                activeChartMetric === 'hr_map'
                  ? 'bg-[#0B3D91]/40 text-white border border-[#1A56DB]/50 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Resting HR vs Baseline
            </button>
            <button
              onClick={() => setActiveChartMetric('orthostatic')}
              className={`px-3 py-1.5 rounded-md text-xs font-mono tabular-nums transition ${
                activeChartMetric === 'orthostatic'
                  ? 'bg-[#0B3D91]/40 text-white border border-[#1A56DB]/50 font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Orthostatic Tolerance Index
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartMetric === 'hr_map' ? (
              <ComposedChart data={cardiovascular.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cardioHrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FC3D21" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#FC3D21" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[50, 105]} />
                <Tooltip content={<DarkCardioTooltip baselineHr={baseline.restingHeartRate} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={baseline.restingHeartRate}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: `BASE (${baseline.restingHeartRate})`, fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                {/* Upper Limit Caution */}
                <ReferenceLine
                  y={100}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'TACHYCARDIA (100)', fill: '#FC3D21', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="restingHr" fill="url(#cardioHrGrad)" stroke="transparent" isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="restingHr"
                  name="Resting HR (bpm)"
                  stroke="#FC3D21"
                  strokeWidth={2.5}
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === cardiovascular.history.length - 1) {
                      return (
                        <g key={`edge-dot-cardio-hr-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#FC3D21" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#FC3D21" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-cardio-hr-${index}`} cx={cx} cy={cy} r={3} fill="#FC3D21" />;
                  }}
                  activeDot={{ r: 4 }}
                />
                <Line type="monotone" dataKey="baselineHr" name="Launch Baseline (bpm)" stroke="#3B82F6" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="map" name="MAP (mmHg)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
              </ComposedChart>
            ) : (
              <ComposedChart data={cardiovascular.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="orthoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.22} />
                    <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip content={<DarkCardioTooltip baselineHr={baseline.restingHeartRate} />} />
                {/* NASA Blue Baseline */}
                <ReferenceLine
                  y={80}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: 'NOMINAL (80)', fill: '#3B82F6', fontSize: 9, position: 'insideRight' }}
                />
                <ReferenceLine
                  y={cardiovascular.referenceStandards.orthostaticAlertThreshold}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: `ALERT THRESHOLD (${cardiovascular.referenceStandards.orthostaticAlertThreshold})`, fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="orthostaticScore" fill="url(#orthoGrad)" stroke="transparent" isAnimationActive={false} />
                <Line
                  type="monotone"
                  dataKey="orthostaticScore"
                  name="Orthostatic Readiness Score"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === cardiovascular.history.length - 1) {
                      return (
                        <g key={`edge-dot-ortho-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill="#38BDF8" fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#38BDF8" strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-ortho-${index}`} cx={cx} cy={cy} r={3} fill="#38BDF8" />;
                  }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/[0.08] font-mono tabular-nums">
          <span>Data Cadence: Bi-weekly standardized tilt / resting hemodynamic evaluation protocol</span>
          <span>Source: SIMULATED TELEMETRY</span>
        </div>
      </div>

      {/* Scientific Context Panel (NASA HRP & NLSP Citations) */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold pb-2 border-b border-white/[0.08]">
          <BookOpen className="w-4 h-4" />
          <span>Scientific Grounding & Clinical Reference Standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 leading-relaxed">
          <div className="bg-black/25 border border-white/[0.08] rounded-lg p-3.5 space-y-1.5">
            <h4 className="text-white font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-sky-400" />
              Cephalad Fluid Shift & Cardiac Atrophy (NASA HRP)
            </h4>
            <p className="text-slate-400">
              In microgravity, ~1.5 to 2.0 liters of interstitial fluid shifts headward due to the absence of hydrostatic pressure gradients. This induces transient central hypervolemia, triggering compensatory renal diuresis and a ~10-15% reduction in total plasma volume.
            </p>
            <div className="pt-1 text-[11px] font-mono text-sky-300">
              Ref: NASA Human Research Roadmap (Risk of Cardiovascular Adaptations) &bull; NASA-STD-3001
            </div>
          </div>

          <div className="bg-black/25 border border-white/[0.08] rounded-lg p-3.5 space-y-1.5">
            <h4 className="text-white font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Countermeasure Protocols & Re-Entry Readiness
            </h4>
            <p className="text-slate-400">
              Prescribed countermeasures include rigorous daily resistive exercise via ARED, cycle ergometry with blood pressure feedback, and pre-reentry fluid loading protocols (1 L saline/isotonic electrolyte solution with salt tablets prior to gravitational re-exposure).
            </p>
            <div className="pt-1 text-[11px] font-mono text-emerald-400">
              Ref: NASA Life Sciences Portal (NLSP) & Ames Bed-Rest Analog Studies (BR-042)
            </div>
          </div>
        </div>

        <div className="bg-black/20 border border-white/[0.06] rounded-lg p-3 text-[11px] text-slate-400 flex items-center gap-2 font-mono tabular-nums">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            Research Attribution Notice: Above clinical reference standards reflect verified published aerospace medicine literature. Crew biometric records displayed on this page are strictly synthesized demonstration telemetry.
          </span>
        </div>
      </div>
    </div>
  );
};
