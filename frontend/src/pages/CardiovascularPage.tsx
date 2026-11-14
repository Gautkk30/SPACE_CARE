import { useState } from 'react';
import { AstronautProfile } from '../types/spacecare';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
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
}

const DarkCardioTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const CardiovascularPage = ({ selectedAstronaut }: CardiovascularPageProps) => {
  const [activeChartMetric, setActiveChartMetric] = useState<'hr_map' | 'orthostatic'>('hr_map');
  const { cardiovascular, baseline, name, callsign } = selectedAstronaut;

  const isDriftHigh = cardiovascular.restingHrDrift > 10;
  const isOrthoVulnerable = cardiovascular.orthostaticToleranceScore < cardiovascular.referenceStandards.orthostaticAlertThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Activity className="w-3.5 h-3.5" />
            Microgravity Hemodynamics & Adaptation
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Cardiovascular Health &bull; {name} ({callsign})
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Cephalad fluid shifting, resting autonomic drift, and orthostatic deconditioning surveillance.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono">
          <Droplets className="w-3.5 h-3.5 text-space-cyan" />
          <span className="text-space-dim">Fluid Shift Status:</span>
          <span
            className={`font-semibold ${
              cardiovascular.fluidShiftSeverity === 'Nominal'
                ? 'text-space-emerald'
                : 'text-space-amber'
            }`}
          >
            {cardiovascular.fluidShiftSeverity}
          </span>
        </div>
      </div>

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Resting HR Drift */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-space-red" />
              Resting HR Drift
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isDriftHigh
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isDriftHigh ? 'Elevated Drift' : 'Nominal Drift'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isDriftHigh ? 'text-space-amber' : 'text-space-text'}`}>
                {cardiovascular.restingHrDrift > 0 ? `+${cardiovascular.restingHrDrift}` : cardiovascular.restingHrDrift}
              </span>
              <span className="text-xs text-space-muted">bpm vs Launch</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Pre-Flight Baseline</span>
              <span className="text-space-text">{baseline.restingHeartRate} bpm</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Mean Arterial Pressure (MAP) */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-space-amber" />
              Mean Arterial Pressure
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
              In Bounds
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {cardiovascular.meanArterialPressure}
              </span>
              <span className="text-xs text-space-muted">mmHg (MAP)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Standard Envelope</span>
              <span className="text-space-text">70 - 105 mmHg</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Orthostatic Tolerance Score */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-space-cyan" />
              Orthostatic Index
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isOrthoVulnerable
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isOrthoVulnerable ? 'Caution (<75)' : 'Nominal (≥75)'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-3xl font-bold font-mono ${
                  isOrthoVulnerable ? 'text-space-amber' : 'text-space-cyan'
                }`}
              >
                {cardiovascular.orthostaticToleranceScore}
              </span>
              <span className="text-xs text-space-muted">/ 100</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Re-Entry Threshold</span>
              <span className="text-space-text">&ge; 75 Index Score</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Baroreflex & Stroke Volume */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-space-emerald" />
              Stroke Volume Index
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              Calibrated
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {cardiovascular.strokeVolumeIndex}
              </span>
              <span className="text-xs text-space-muted">mL/m&sup2;</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Baroreflex Sensitivity</span>
              <span className="text-space-text">{cardiovascular.baroreflexSensitivity} ms/mmHg</span>
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Progression Chart: Launch (Day 0) to Present (Day 84) */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-space-cyan" />
              Longitudinal Mission Progression (Launch Day 0 &rarr; Day 84 Current)
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Evaluating chronic cardiovascular deconditioning and baroreflex compensation over 12 weeks of spaceflight.
            </p>
          </div>

          {/* Metric Switcher */}
          <div className="flex items-center bg-space-bg border border-space-border rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveChartMetric('hr_map')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeChartMetric === 'hr_map'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              Resting HR vs Baseline
            </button>
            <button
              onClick={() => setActiveChartMetric('orthostatic')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeChartMetric === 'orthostatic'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip content={<DarkCardioTooltip />} />
                <ReferenceLine
                  y={baseline.restingHeartRate}
                  stroke="#10B981"
                  strokeDasharray="4 4"
                  label={{ value: `Pre-Flight HR (${baseline.restingHeartRate} bpm)`, fill: '#10B981', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Line type="monotone" dataKey="restingHr" name="Resting HR (bpm)" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: '#EF4444' }} />
                <Line type="monotone" dataKey="baselineHr" name="Launch Baseline (bpm)" stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                <Line type="monotone" dataKey="map" name="MAP (mmHg)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3, fill: '#F59E0B' }} />
              </ComposedChart>
            ) : (
              <ComposedChart data={cardiovascular.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[50, 100]} />
                <Tooltip content={<DarkCardioTooltip />} />
                <ReferenceLine
                  y={cardiovascular.referenceStandards.orthostaticAlertThreshold}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: `Readiness Threshold (${cardiovascular.referenceStandards.orthostaticAlertThreshold})`, fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <Line type="monotone" dataKey="orthostaticScore" name="Orthostatic Readiness Score" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: '#06B6D4' }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <span>Data Cadence: Bi-weekly standardized tilt / resting hemodynamic evaluation protocol</span>
          <span>Source: SIMULATED TELEMETRY</span>
        </div>
      </div>

      {/* Scientific Context Panel (NASA HRP & NLSP Citations) */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center gap-2 text-space-cyan text-sm font-semibold pb-2 border-b border-space-border/60">
          <BookOpen className="w-4 h-4" />
          <span>Scientific Grounding & Clinical Reference Standards</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-space-muted leading-relaxed">
          <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5 space-y-1.5">
            <h4 className="text-space-text font-semibold flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-space-cyan" />
              Cephalad Fluid Shift & Cardiac Atrophy (NASA HRP)
            </h4>
            <p className="text-space-dim">
              In microgravity, ~1.5 to 2.0 liters of interstitial fluid shifts headward due to the absence of hydrostatic pressure gradients. This induces transient central hypervolemia, triggering compensatory renal diuresis and a ~10-15% reduction in total plasma volume.
            </p>
            <div className="pt-1 text-[11px] font-mono text-space-cyan">
              Ref: NASA Human Research Roadmap (Risk of Cardiovascular Adaptations) &bull; NASA-STD-3001
            </div>
          </div>

          <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5 space-y-1.5">
            <h4 className="text-space-text font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-space-emerald" />
              Countermeasure Protocols & Re-Entry Readiness
            </h4>
            <p className="text-space-dim">
              Prescribed countermeasures include rigorous daily resistive exercise via ARED, cycle ergometry with blood pressure feedback, and pre-reentry fluid loading protocols (1 L saline/isotonic electrolyte solution with salt tablets prior to gravitational re-exposure).
            </p>
            <div className="pt-1 text-[11px] font-mono text-space-emerald">
              Ref: NASA Life Sciences Portal (NLSP) & Ames Bed-Rest Analog Studies (BR-042)
            </div>
          </div>
        </div>

        <div className="bg-space-bg/40 border border-space-border/40 rounded-lg p-3 text-[11px] text-space-dim flex items-center gap-2 font-mono">
          <ShieldAlert className="w-4 h-4 text-space-amber shrink-0" />
          <span>
            Research Attribution Notice: Above clinical reference standards reflect verified published aerospace medicine literature. Crew biometric records displayed on this page are strictly synthesized demonstration telemetry.
          </span>
        </div>
      </div>
    </div>
  );
};
