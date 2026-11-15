import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { VitalTrendPoint, AstronautProfile } from '../../types/spacecare';
import { TrendingUp, Heart, Activity } from 'lucide-react';

interface VitalTrendChartsProps {
  astronaut: AstronautProfile;
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
  baselineSpo2?: number;
  activeMetric?: 'hr' | 'spo2';
}

const CustomDarkTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  baselineHr = 72,
  baselineSpo2 = 98.2,
  activeMetric = 'hr',
}) => {
  if (active && payload && payload.length) {
    const val = payload[0]?.value;
    const baseVal = activeMetric === 'hr' ? baselineHr : baselineSpo2;
    const delta = val !== undefined ? Number((val - baseVal).toFixed(1)) : 0;
    const deltaFormatted = delta > 0 ? `+${delta}` : `${delta}`;

    return (
      <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
        <p className="text-sky-400 font-bold mb-1.5 flex items-center gap-1.5">
          <span>Time:</span> {label} UTC
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="space-y-1">
            <div className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-white">
                {entry.value} {entry.name.includes('Heart') ? 'bpm' : '%'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px] pt-1 border-t border-white/[0.08] text-slate-400">
              <span>Baseline Delta:</span>
              <span className={delta > 10 || delta < -10 ? 'text-[#FC3D21] font-bold' : delta !== 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                {deltaFormatted} {activeMetric === 'hr' ? 'bpm' : '%'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const VitalTrendCharts: React.FC<VitalTrendChartsProps> = ({ astronaut }) => {
  const [activeMetric, setActiveMetric] = useState<'hr' | 'spo2'>('hr');
  const data: VitalTrendPoint[] = astronaut.trend24h;

  const baseHr = astronaut.baseline_heart_rate ?? astronaut.baseline?.restingHeartRate ?? 72;
  const baseSpo2 = astronaut.baseline_spo2 ?? astronaut.baseline?.baselineSpO2 ?? 98.2;

  const renderEdgeDot = (props: any, strokeColor = '#FC3D21') => {
    const { cx, cy, index } = props;
    if (index === data.length - 1) {
      return (
        <g key={`edge-dot-${index}`}>
          <circle cx={cx} cy={cy} r={7} fill={strokeColor} fillOpacity={0.3} />
          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke={strokeColor} strokeWidth={2} />
        </g>
      );
    }
    return <circle key={`dot-${index}`} cx={cx} cy={cy} r={0} />;
  };

  return (
    <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            24-Hour Telemetry Trend &bull; {astronaut.name}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical progression plotted against NASA HRP individualized clinical baseline boundaries.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center bg-black/40 border border-white/[0.08] rounded-lg p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('hr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeMetric === 'hr'
                ? 'bg-[#0B3D91]/40 text-white border border-[#1A56DB]/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-[#FC3D21]" />
            Heart Rate (bpm)
          </button>
          <button
            onClick={() => setActiveMetric('spo2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeMetric === 'spo2'
                ? 'bg-[#0B3D91]/40 text-white border border-[#1A56DB]/50 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            SpO2 (%)
          </button>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {activeMetric === 'hr' ? (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="hrGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FC3D21" stopOpacity={0.22} />
                  <stop offset="95%" stopColor="#FC3D21" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E2D4A' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E2D4A' }}
                domain={[45, 125]}
              />
              <Tooltip content={<CustomDarkTooltip baselineHr={baseHr} baselineSpo2={baseSpo2} activeMetric="hr" />} />
              {/* NASA Blue / Slate Baseline Reference */}
              <ReferenceLine
                y={baseHr}
                stroke="#3B82F6"
                strokeDasharray="3 3"
                label={{
                  value: `BASE (${baseHr})`,
                  fill: '#3B82F6',
                  fontSize: 10,
                  position: 'insideRight',
                }}
              />
              {/* Caution & Critical Upper Bounds */}
              <ReferenceLine
                y={100}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: 'CAUTION (100)',
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={120}
                stroke="#FC3D21"
                strokeDasharray="4 4"
                label={{
                  value: 'CRITICAL (120)',
                  fill: '#FC3D21',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#FC3D21"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#hrGradient)"
                dot={(p) => renderEdgeDot(p, '#FC3D21')}
                activeDot={{ r: 5, fill: '#FC3D21', stroke: '#060B19', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0B3D91" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#0B3D91" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
              <XAxis
                dataKey="timeLabel"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E2D4A' }}
              />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#1E2D4A' }}
                domain={[90, 100]}
              />
              <Tooltip content={<CustomDarkTooltip baselineHr={baseHr} baselineSpo2={baseSpo2} activeMetric="spo2" />} />
              {/* NASA Blue / Slate Baseline Reference */}
              <ReferenceLine
                y={baseSpo2}
                stroke="#3B82F6"
                strokeDasharray="3 3"
                label={{
                  value: `BASE (${baseSpo2}%)`,
                  fill: '#3B82F6',
                  fontSize: 10,
                  position: 'insideRight',
                }}
              />
              {/* Hypoxia Floor */}
              <ReferenceLine
                y={94}
                stroke="#FC3D21"
                strokeDasharray="4 4"
                label={{
                  value: 'HYPOXIA CRITICAL (94%)',
                  fill: '#FC3D21',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="spo2"
                name="SpO2 Saturation"
                stroke="#38BDF8"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#spo2Gradient)"
                dot={(p) => renderEdgeDot(p, '#38BDF8')}
                activeDot={{ r: 5, fill: '#38BDF8', stroke: '#060B19', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <span className="font-mono tabular-nums">Sample Rate: 1 Hz filtered to hourly rolling aggregates</span>
        <span className="font-mono tabular-nums text-slate-300">
          Dataset Provenance: Algorithmically Synthesized Test Vector (Simulated)
        </span>
      </div>
    </div>
  );
};
