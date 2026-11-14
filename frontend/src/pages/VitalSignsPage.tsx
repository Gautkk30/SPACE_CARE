import { useState } from 'react';
import {
  AstronautProfile,
  TimeWindow,
  VitalTrendPoint,
} from '../types/spacecare';
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
} from 'lucide-react';

interface VitalSignsPageProps {
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

const DarkChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-space-panel border border-space-border-light p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1.5 flex items-center gap-1.5">
          <span>Window Point:</span> {label}
        </p>
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

export const VitalSignsPage = ({ selectedAstronaut }: VitalSignsPageProps) => {
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('24H');
  const trendData: VitalTrendPoint[] =
    selectedAstronaut.trendsByWindow[timeWindow] || selectedAstronaut.trend24h;

  const { baseline, currentVitals } = selectedAstronaut;

  return (
    <div className="space-y-6">
      {/* Page Header with Time Range Selector & Sync Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <HeartPulse className="w-3.5 h-3.5" />
            Continuous Physiological Telemetry
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Vital Signs Telemetry &bull; {selectedAstronaut.name} ({selectedAstronaut.callsign})
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Real-time biometric streams correlated with individual baseline boundaries (NASA-STD-3001).
          </p>
        </div>

        {/* Controls: Time Window & Data Badge */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Window Selector */}
          <div className="flex items-center bg-space-panel border border-space-border rounded-lg p-1">
            <span className="text-xs text-space-dim px-2 hidden sm:inline flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Window:
            </span>
            {(['6H', '24H', '7D'] as const).map((win) => (
              <button
                key={win}
                onClick={() => setTimeWindow(win)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  timeWindow === win
                    ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/30'
                    : 'text-space-dim hover:text-space-text'
                }`}
              >
                {win}
              </button>
            ))}
          </div>

          {/* Sync badge */}
          <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 text-space-cyan font-mono font-medium">
              <Database className="w-3.5 h-3.5" />
              <span>SIMULATED TELEMETRY</span>
            </div>
            <span className="text-space-border">|</span>
            <div className="flex items-center gap-1 text-space-dim font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              <span>10:30 UTC</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Dedicated Telemetry Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Chart 1: Heart Rate & HRV RMSSD */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-border/60">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-space-red" />
              <div>
                <h3 className="text-sm font-semibold text-space-text">Heart Rate & HRV (RMSSD)</h3>
                <span className="text-[11px] text-space-dim">Cardiac frequency and autonomic recovery tone</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-space-red font-semibold">{currentVitals.heartRate} bpm</span>
              <span className="text-space-dim">/</span>
              <span className="text-space-cyan font-semibold">{currentVitals.heartRateVariability} ms</span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrvAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[10, 115]} />
                <Tooltip content={<DarkChartTooltip />} />
                <ReferenceLine
                  y={baseline.maxHeartRateNominal}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: `Max (${baseline.maxHeartRateNominal})`, fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={baseline.minHeartRateNominal}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  label={{ value: `Min (${baseline.minHeartRateNominal})`, fill: '#10B981', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Area type="monotone" dataKey="hrvRmssd" name="HRV RMSSD (ms)" fill="url(#hrvAreaGrad)" stroke="#06B6D4" strokeWidth={1.5} />
                <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-space-border/60 text-[10px] text-space-dim flex justify-between font-mono">
            <span>Red: Heart Rate (bpm) &bull; Cyan: HRV RMSSD (ms)</span>
            <span>Baseline Resting: {baseline.restingHeartRate} bpm</span>
          </div>
        </div>

        {/* Chart 2: Blood Pressure (Systolic & Diastolic) */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-border/60">
            <div className="flex items-center gap-2">
              <Gauge className="w-4 h-4 text-space-amber" />
              <div>
                <h3 className="text-sm font-semibold text-space-text">Arterial Blood Pressure (Sys / Dia)</h3>
                <span className="text-[11px] text-space-dim">Vascular tone and cephalad fluid redistribution</span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-space-amber">
              {currentVitals.systolicBP}/{currentVitals.diastolicBP} mmHg
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[55, 145]} />
                <Tooltip content={<DarkChartTooltip />} />
                <ReferenceLine
                  y={baseline.restingSystolicBP}
                  stroke="#F59E0B"
                  strokeDasharray="3 3"
                  label={{ value: `Sys Baseline (${baseline.restingSystolicBP})`, fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <ReferenceLine
                  y={baseline.restingDiastolicBP}
                  stroke="#38BDF8"
                  strokeDasharray="3 3"
                  label={{ value: `Dia Baseline (${baseline.restingDiastolicBP})`, fill: '#38BDF8', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Line type="monotone" dataKey="systolicBP" name="Systolic BP" stroke="#F59E0B" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                <Line type="monotone" dataKey="diastolicBP" name="Diastolic BP" stroke="#38BDF8" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-space-border/60 text-[10px] text-space-dim flex justify-between font-mono">
            <span>Amber: Systolic BP &bull; Blue: Diastolic BP</span>
            <span>Target: &le; 120/80 mmHg</span>
          </div>
        </div>

        {/* Chart 3: Blood Oxygen Saturation (SpO2) */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-border/60">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-space-cyan" />
              <div>
                <h3 className="text-sm font-semibold text-space-text">Oxygen Saturation (SpO2 %)</h3>
                <span className="text-[11px] text-space-dim">Pulmonary gas exchange and cabin atmospheric balance</span>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold text-space-cyan">
              {currentVitals.spo2}%
            </span>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="spo2Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[92, 100]} />
                <Tooltip content={<DarkChartTooltip />} />
                <ReferenceLine
                  y={baseline.minSpO2Nominal}
                  stroke="#EF4444"
                  strokeDasharray="4 4"
                  label={{ value: `Hypoxia Floor (${baseline.minSpO2Nominal}%)`, fill: '#EF4444', fontSize: 9, position: 'insideBottomRight' }}
                />
                <Area type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#06B6D4" strokeWidth={2} fill="url(#spo2Grad)" activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-space-border/60 text-[10px] text-space-dim flex justify-between font-mono">
            <span>Nominal Standard: 95.0% - 100%</span>
            <span>NASA EVA Safety Margin: &ge; 95%</span>
          </div>
        </div>

        {/* Chart 4: Core Body Temperature & Respiration */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-space-border/60">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-space-emerald" />
              <div>
                <h3 className="text-sm font-semibold text-space-text">Core Temperature (&deg;C) & Respiration</h3>
                <span className="text-[11px] text-space-dim">Thermoregulation and ventilatory rate</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-space-emerald font-semibold">{currentVitals.coreTemp}&deg;C</span>
              <span className="text-space-dim">/</span>
              <span className="text-space-text font-semibold">{currentVitals.respiratoryRate} br/min</span>
            </div>
          </div>

          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="timeLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[36.0, 38.0]} />
                <Tooltip content={<DarkChartTooltip />} />
                <ReferenceLine
                  y={baseline.baselineCoreTemp}
                  stroke="#10B981"
                  strokeDasharray="3 3"
                  label={{ value: `Baseline (${baseline.baselineCoreTemp}°C)`, fill: '#10B981', fontSize: 9, position: 'insideTopRight' }}
                />
                <Line type="monotone" dataKey="coreTemp" name="Core Temp (°C)" stroke="#10B981" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 pt-2 border-t border-space-border/60 text-[10px] text-space-dim flex justify-between font-mono">
            <span>Core Temp Norm: 36.5&deg;C - 37.5&deg;C</span>
            <span>Respiration: {baseline.respiratoryRateRange[0]}-{baseline.respiratoryRateRange[1]} br/min</span>
          </div>
        </div>
      </div>

      {/* Tabular Telemetry Log with Deltas and Status */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Clock className="w-4 h-4 text-space-cyan" />
              Recent Telemetry Sample Log &bull; {timeWindow} Window
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Tabular time-series biometrics compared against personal resting calibration.
            </p>
          </div>
          <span className="text-xs font-mono text-space-dim">{trendData.length} Data Points</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-space-border text-space-dim font-mono uppercase text-[11px]">
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
            <tbody className="divide-y divide-space-border/40 font-mono">
              {trendData.slice(-6).reverse().map((point, idx) => {
                const hrDelta = point.heartRate - baseline.restingHeartRate;
                const isElevated = hrDelta > 15;

                return (
                  <tr key={idx} className="hover:bg-space-panel-hover/50 text-space-muted">
                    <td className="py-2.5 pr-4 text-space-text font-medium">{point.timeLabel} UTC</td>
                    <td className="py-2.5 px-3">
                      <span className={isElevated ? 'text-space-amber font-bold' : 'text-space-text'}>
                        {point.heartRate} bpm
                      </span>
                      <span className="text-[10px] text-space-dim ml-1">
                        ({hrDelta > 0 ? `+${hrDelta}` : hrDelta})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-space-text">{point.hrvRmssd} ms</td>
                    <td className="py-2.5 px-3 text-space-text">{point.systolicBP}/{point.diastolicBP} mmHg</td>
                    <td className="py-2.5 px-3 text-space-text">{point.spo2}%</td>
                    <td className="py-2.5 px-3 text-space-text">{point.coreTemp}&deg;C</td>
                    <td className="py-2.5 px-3 text-space-text">{point.respiratoryRate} br/min</td>
                    <td className="py-2.5 px-3 text-right">
                      {isElevated ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/30">
                          <AlertTriangle className="w-3 h-3" />
                          Caution
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
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
