import { useState } from 'react';
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
import { MOCK_RADIATION_DATA } from '../services/mockTelemetry';
import {
  Sun,
  ShieldAlert,
  ShieldCheck,
  Radio,
  BookOpen,
  Clock,
  Layers,
} from 'lucide-react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const DarkRadiationTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
              {entry.value} {entry.name.includes('Rate') ? 'µGy/hr' : 'mSv'}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const RadiationPage = () => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'crew_limits'>('timeline');
  const rad = MOCK_RADIATION_DATA;

  const isShelterActive = rad.stormShelterStatus !== 'NOMINAL_OPERATION';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Sun className="w-3.5 h-3.5 text-space-red" />
            Space Radiation & Solar Weather Surveillance
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Cabin Dosimetry & DONKI Space Weather Feed
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Galactic Cosmic Rays (GCR), Solar Particle Events (SPE), and crew career exposure management.
          </p>
        </div>

        {/* Storm Shelter Advisory Badge */}
        <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono">
          <ShieldAlert className="w-4 h-4 text-space-amber animate-pulse" />
          <span className="text-space-dim">Storm Shelter Status:</span>
          <span className={`font-bold ${isShelterActive ? 'text-space-amber' : 'text-space-emerald'}`}>
            {rad.stormShelterStatus.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Current Dosimeter Rate */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Sun className="w-4 h-4 text-space-red" />
              Dosimeter Rate
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/30 animate-pulse">
              Elevated Flux
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-amber">
                {rad.currentDosimeterRateMicroGyHr}
              </span>
              <span className="text-xs text-space-muted">µGy / hr</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>GCR Background</span>
              <span className="text-space-text">{rad.gcrBackgroundRateMicroGyHr} µGy/hr</span>
            </div>
          </div>
        </div>

        {/* KPI 2: SPE Active Contribution */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-space-cyan" />
              Active SPE Proton Flux
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              S1 Minor
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-cyan">
                +{rad.speRateMicroGyHr}
              </span>
              <span className="text-xs text-space-muted">µGy / hr</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Decay Phase Window</span>
              <span className="text-space-text">~6.5 hrs remain</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cumulative Mission Dose */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-space-emerald" />
              Cumulative Mission Dose
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
              Day 84 Total
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {rad.cumulativeMissionDoseMsv}
              </span>
              <span className="text-xs text-space-muted">mSv</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Nominal Mission Budget</span>
              <span className="text-space-text">120 mSv</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Career Ceiling Ratio */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-space-cyan" />
              NASA Career Limit
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-bg border border-space-border text-space-dim font-mono">
              NASA-STD-3001
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                600
              </span>
              <span className="text-xs text-space-muted">mSv Ceiling</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Crew Peak Career Dose</span>
              <span className="text-space-cyan">30.8% (Elena R.)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chart: 14-Day Dosimetry Timeline & Solar Spike */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Sun className="w-4 h-4 text-space-cyan" />
              14-Day Dosimetry Telemetry & Solar Particle Event Spikes
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Distinguishing steady-state Galactic Cosmic Ray (GCR) background from episodic Solar Energetic Proton (SEP) spikes.
            </p>
          </div>

          <div className="flex items-center bg-space-bg border border-space-border rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'timeline'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              Dosimeter Rate (µGy/hr)
            </button>
            <button
              onClick={() => setActiveTab('crew_limits')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'crew_limits'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              Cumulative Dose (mSv)
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'timeline' ? (
              <ComposedChart data={rad.timeline14d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="speGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[10, 55]} />
                <Tooltip content={<DarkRadiationTooltip />} />
                <ReferenceLine
                  y={30}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'Shelter Advisory Threshold (30 µGy/hr)', fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="dosimeterRateMicroGyHr" name="Total Dosimeter Rate" fill="url(#speGradient)" stroke="#EF4444" strokeWidth={2} />
                <Line type="monotone" dataKey="gcrComponent" name="GCR Background Rate" stroke="#06B6D4" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </ComposedChart>
            ) : (
              <ComposedChart data={rad.timeline14d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[44, 56]} />
                <Tooltip content={<DarkRadiationTooltip />} />
                <Line type="monotone" dataKey="cumulativeDoseMsv" name="Cumulative Mission Dose" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3 }} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <span>Solid Red: Measured Dosimeter Rate &bull; Dashed Cyan: GCR Background Floor</span>
          <span>Feed Attribution: SIMULATED SPACECRAFT DOSIMETRY</span>
        </div>
      </div>

      {/* NASA DONKI Space Weather Events Log */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Radio className="w-4 h-4 text-space-cyan" />
              NASA DONKI Space Weather Event Stream
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Live external events synchronized from NASA Space Weather Database Of Notifications, Knowledge, Innovations.
            </p>
          </div>
          <span className="text-xs font-mono text-space-cyan px-2.5 py-0.5 rounded bg-space-cyan-muted border border-space-cyan/30">
            DONKI API LINKED
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {rad.donkiEvents.map((evt) => (
            <div key={evt.id} className="bg-space-bg/70 border border-space-border rounded-lg p-3.5 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono font-bold text-space-amber">
                    [{evt.eventType}]
                  </span>
                  <span className="text-[10px] text-space-dim font-mono">
                    {evt.source}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-space-text mb-1">{evt.classification}</h4>
                <div className="text-[11px] text-space-dim space-y-0.5 font-mono">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-space-cyan" />
                    <span>Onset: {new Date(evt.onsetUtc).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</span>
                  </div>
                  <div>Impact: {evt.protonFluxLevel}</div>
                </div>
              </div>

              <div className="pt-2 border-t border-space-border/60 text-[11px] text-space-muted">
                <span className="text-space-cyan font-semibold block mb-0.5">Shelter Action:</span>
                <p className="text-space-dim text-[11px] leading-tight">{evt.shelterAdvisory}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Crew Career Dose vs NASA-STD-3001 Limits */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-space-border/60">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-space-emerald" />
            Crew Career Cumulative Radiation Exposure (NASA-STD-3001)
          </h2>
          <span className="text-xs font-mono text-space-dim">Career Cap: 600 mSv</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
          {rad.crewDoses.map((crew) => (
            <div key={crew.astronautId} className="bg-space-bg/60 border border-space-border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-space-text">{crew.astronautName}</span>
                <span className="font-mono text-space-dim text-[11px]">{crew.astronautId}</span>
              </div>

              <div>
                <div className="flex items-baseline justify-between text-xs font-mono mb-1">
                  <span className="text-space-muted">Career: {crew.careerDoseMsv} mSv</span>
                  <span className="text-space-cyan font-bold">{crew.careerLimitPct}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-space-border overflow-hidden">
                  <div
                    className="h-full bg-space-cyan rounded-full"
                    style={{ width: `${crew.careerLimitPct}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] text-space-dim font-mono flex justify-between pt-1 border-t border-space-border/40">
                <span>Mission Add:</span>
                <span className="text-space-text font-bold">+{crew.cumulativeMissionDoseMsv} mSv</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 text-[11px] text-space-dim font-mono flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-space-cyan shrink-0" />
          <span>NASA Career Limit Standard: Universal 600 mSv career limit designed to constrain excess lifetime risk of radiation-induced cancer mortality (REID) below 3%.</span>
        </div>
      </div>
    </div>
  );
};
