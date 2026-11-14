import { useState } from 'react';
import { AstronautProfile } from '../types/spacecare';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Dumbbell,
  Bone,
  Activity,
  BookOpen,
  Info,
  Flame,
  CheckCircle2,
  FlaskConical,
} from 'lucide-react';

interface BoneMusclePageProps {
  selectedAstronaut: AstronautProfile;
  onNavigateTab?: (tab: 'research') => void;
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

const DarkBoneTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const BoneMusclePage = ({ selectedAstronaut, onNavigateTab }: BoneMusclePageProps) => {
  const [activeMetricTab, setActiveMetricTab] = useState<'bmd_vs_reference' | 'muscle_vs_compliance'>('bmd_vs_reference');
  const { musculoskeletal, name, callsign } = selectedAstronaut;

  const isBmdCritical = musculoskeletal.femoralNeckBmdDeltaPct < -1.5;
  const isAredAdherent = musculoskeletal.aredCompliancePct >= 90;
  const isCalciumHigh = musculoskeletal.urinaryCalciumRisk !== 'LOW';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Bone className="w-3.5 h-3.5" />
            Musculoskeletal Deconditioning & Countermeasures
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Bone & Muscle Health &bull; {name} ({callsign})
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            DEXA bone mineral density shifts, lower-limb atrophy tracking, and ARED resistance adherence.
          </p>
        </div>

        {/* Urinary Calcium Risk Badge */}
        <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-space-cyan" />
          <span className="text-space-dim">Urinary Calcium Risk:</span>
          <span
            className={`font-semibold ${
              isCalciumHigh ? 'text-space-amber animate-pulse' : 'text-space-emerald'
            }`}
          >
            {musculoskeletal.urinaryCalciumRisk} ({musculoskeletal.calciumExcretionMgDay} mg/d)
          </span>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Femoral Neck BMD Delta */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Bone className="w-4 h-4 text-space-cyan" />
              Femoral Neck BMD
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isBmdCritical
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isBmdCritical ? 'Elevated Loss' : 'Protected'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isBmdCritical ? 'text-space-amber' : 'text-space-text'}`}>
                {musculoskeletal.femoralNeckBmdDeltaPct}%
              </span>
              <span className="text-xs text-space-muted">vs Launch DEXA</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Unmitigated Benchmark</span>
              <span className="text-space-amber">-3.6% (12 Wks)</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Lumbar Spine BMD Delta */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-space-emerald" />
              Lumbar Spine BMD
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
              Mitigated
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {musculoskeletal.lumbarSpineBmdDeltaPct}%
              </span>
              <span className="text-xs text-space-muted">L1-L4 Bone Mass</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Calcaneus Ultrasound</span>
              <span className="text-space-text">{musculoskeletal.calcaneusBmdDeltaPct}%</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Lower-Limb Muscle Volume */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-space-red" />
              Muscle Volume (Legs)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              MRI Index
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {musculoskeletal.lowerLimbMuscleVolumeDeltaPct}%
              </span>
              <span className="text-xs text-space-muted">Soleus / Gastrocnemius</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Post-Flight Recovery Target</span>
              <span className="text-space-text">&gt; -5.0% Limit</span>
            </div>
          </div>
        </div>

        {/* KPI 4: ARED Exercise Compliance */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-space-cyan" />
              ARED Adherence
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isAredAdherent
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
              }`}
            >
              {isAredAdherent ? 'Nominal (>90%)' : 'Sub-optimal'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isAredAdherent ? 'text-space-emerald' : 'text-space-amber'}`}>
                {musculoskeletal.aredCompliancePct}%
              </span>
              <span className="text-xs text-space-muted">Prescription Met</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Treadmill T2 Adherence</span>
              <span className="text-space-text">{musculoskeletal.treadmillCompliancePct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Longitudinal Comparison Chart */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-space-cyan" />
              12-Week Bone & Muscle Progression vs NASA HRP Reference Curve
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Demonstrates countermeasure efficacy in dampening microgravity osteopenia (~1.0–1.5% loss per month unmitigated).
            </p>
          </div>

          <div className="flex items-center bg-space-bg border border-space-border rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveMetricTab('bmd_vs_reference')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeMetricTab === 'bmd_vs_reference'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              BMD vs Unmitigated Curve
            </button>
            <button
              onClick={() => setActiveMetricTab('muscle_vs_compliance')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeMetricTab === 'muscle_vs_compliance'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              Muscle Loss vs ARED %
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeMetricTab === 'bmd_vs_reference' ? (
              <ComposedChart data={musculoskeletal.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[-5.0, 0.5]} />
                <Tooltip content={<DarkBoneTooltip />} />
                <ReferenceLine y={0} stroke="#2A3C60" />
                <ReferenceLine
                  y={-3.0}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{ value: 'Clinical Concern (-3.0%)', fill: '#EF4444', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="actualBmdLossPct"
                  name="Astronaut Actual BMD Delta"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#06B6D4' }}
                />
                <Line
                  type="monotone"
                  dataKey="unmitigatedReferenceLossPct"
                  name="NASA HRP Unmitigated Microgravity Reference"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ r: 3, fill: '#F59E0B' }}
                />
              </ComposedChart>
            ) : (
              <ComposedChart data={musculoskeletal.history} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="label" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis yAxisId="loss" stroke="#64748B" fontSize={10} tickLine={false} domain={[-6.0, 0.5]} />
                <YAxis yAxisId="ared" orientation="right" stroke="#10B981" fontSize={10} tickLine={false} domain={[70, 105]} />
                <Tooltip content={<DarkBoneTooltip />} />
                <Bar yAxisId="loss" dataKey="leanMuscleLossPct" name="Lean Muscle Delta (%)" fill="#EF4444" opacity={0.65} radius={[4, 4, 0, 0]} />
                <Line yAxisId="ared" type="monotone" dataKey="aredCompliancePct" name="ARED Adherence (%)" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <span>Cyan: Astronaut Actual DEXA &bull; Amber Dashed: NASA Unmitigated Zero-G Reference</span>
          <span>Provenance: SIMULATED TELEMETRY</span>
        </div>
      </div>

      {/* Countermeasure Tracker & Scientific Grounding Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Countermeasure Regime Details */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-space-text font-semibold text-sm pb-2 border-b border-space-border/60">
            <CheckCircle2 className="w-4 h-4 text-space-emerald" />
            <span>Prescribed Daily Countermeasure Protocol (NASA Standard)</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-space-text block">ARED Heavy Resistance Sessions</span>
                <span className="text-[11px] text-space-dim">Squats, deadlifts, and heel raises (up to 600 lbs resistive load)</span>
              </div>
              <span className="font-mono font-bold text-space-cyan px-2 py-1 rounded bg-space-cyan-muted">
                6 Days / Wk
              </span>
            </div>

            <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-space-text block">T2 Treadmill / Vibration Isolation</span>
                <span className="text-[11px] text-space-dim">Bungee harness loading at 70-80% body mass for foot strike impact</span>
              </div>
              <span className="font-mono font-bold text-space-emerald px-2 py-1 rounded bg-space-emerald-muted">
                30 Min / Day
              </span>
            </div>

            <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 flex items-center justify-between">
              <div>
                <span className="font-semibold text-space-text block">CEVIS Cycle Ergometer</span>
                <span className="text-[11px] text-space-dim">Aerobic intervals maintaining VO2 max and arterial compliance</span>
              </div>
              <span className="font-mono font-bold text-space-text px-2 py-1 rounded bg-space-bg border border-space-border">
                3 Sessions / Wk
              </span>
            </div>
          </div>
        </div>

        {/* Scientific Grounding Card */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-space-cyan font-semibold text-sm pb-2 border-b border-space-border/60">
            <BookOpen className="w-4 h-4" />
            <span>NASA OSDR & HRP Musculoskeletal Research Context</span>
          </div>

          <div className="text-xs text-space-muted leading-relaxed space-y-2.5">
            <p>
              In prolonged weightlessness, lack of skeletal loading suppresses osteoblast activity while maintaining or accelerating osteoclastic resorption. Unmitigated, astronauts lose approximately <strong className="text-space-text">1.0% to 1.5% of bone mineral density per month</strong>, predominantly in weight-bearing bones (calcaneus, femoral neck, and lumbar vertebrae).
            </p>
            <p>
              Excess bone calcium is released into the bloodstream and excreted renally, significantly heightening the risk of <strong className="text-space-amber">nephrolithiasis (kidney stones)</strong> in closed-loop spacecraft life-support conditions.
            </p>
            <div className="pt-2 border-t border-space-border/60 text-[11px] font-mono text-space-cyan flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Citations: NASA HRP Bone Loss Evidence Book &bull; OSDR Ground Analog Bed-Rest Studies</span>
              </div>
              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('research')}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-sans font-medium bg-space-cyan/15 hover:bg-space-cyan/25 text-space-cyan border border-space-cyan/30 transition cursor-pointer"
                >
                  <FlaskConical className="w-3 h-3" />
                  <span>Inspect NASA OSD-946 QC &rarr;</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
