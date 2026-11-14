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
}

const CustomDarkTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-space-panel border border-space-border-light p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1.5 flex items-center gap-1.5">
          <span>Time:</span> {label} UTC
        </p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-space-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-space-text">
              {entry.value} {entry.name.includes('Heart') ? 'bpm' : '%'}
            </span>
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

  return (
    <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-space-border/60">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-space-cyan" />
            24-Hour Telemetry Trend &bull; {astronaut.name}
          </h2>
          <p className="text-xs text-space-dim mt-0.5">
            Historical progression plotted against NASA HRP individualized clinical baseline boundaries.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex items-center bg-space-bg border border-space-border rounded-lg p-0.5 self-start sm:self-auto">
          <button
            onClick={() => setActiveMetric('hr')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeMetric === 'hr'
                ? 'bg-space-panel text-space-cyan border border-space-cyan/30 shadow'
                : 'text-space-dim hover:text-space-text'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-space-red" />
            Heart Rate (bpm)
          </button>
          <button
            onClick={() => setActiveMetric('spo2')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition ${
              activeMetric === 'spo2'
                ? 'bg-space-panel text-space-cyan border border-space-cyan/30 shadow'
                : 'text-space-dim hover:text-space-text'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-space-cyan" />
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
                  <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
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
                domain={[45, 115]}
              />
              <Tooltip content={<CustomDarkTooltip />} />
              <ReferenceLine
                y={astronaut.baseline.maxHeartRateNominal}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Max Nominal (${astronaut.baseline.maxHeartRateNominal})`,
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'insideTopRight',
                }}
              />
              <ReferenceLine
                y={astronaut.baseline.minHeartRateNominal}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{
                  value: `Min Nominal (${astronaut.baseline.minHeartRateNominal})`,
                  fill: '#10B981',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate"
                stroke="#EF4444"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#hrGradient)"
                activeDot={{ r: 5, fill: '#EF4444', stroke: '#060B19', strokeWidth: 2 }}
              />
            </AreaChart>
          ) : (
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spo2Gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
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
                domain={[92, 100]}
              />
              <Tooltip content={<CustomDarkTooltip />} />
              <ReferenceLine
                y={astronaut.baseline.minSpO2Nominal}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: `Hypoxia Threshold (${astronaut.baseline.minSpO2Nominal}%)`,
                  fill: '#F59E0B',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
              <Area
                type="monotone"
                dataKey="spo2"
                name="SpO2 Saturation"
                stroke="#06B6D4"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#spo2Gradient)"
                activeDot={{ r: 5, fill: '#06B6D4', stroke: '#060B19', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-space-border/60 flex flex-wrap items-center justify-between text-[11px] text-space-dim gap-2">
        <span>Sample Rate: 1 Hz filtered to hourly rolling aggregates</span>
        <span className="font-mono text-space-muted">
          Dataset Provenance: Algorithmically Synthesized Test Vector (Simulated)
        </span>
      </div>
    </div>
  );
};
