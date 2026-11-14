import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { OSD946SampleQC } from '../../types/research';

interface Props {
  samples: OSD946SampleQC[];
  meanRate?: number;
}

export const SampleDistributionChart: React.FC<Props> = ({
  samples,
  meanRate = 15.09,
}) => {
  // Sort samples cleanly by accession or index
  const chartData = samples.map((s, idx) => ({
    index: idx + 1,
    gsm: s.gsm_accession,
    label: `${s.gsm_accession} (${s.group}-${s.time})`,
    cohort: s.group,
    time: s.time,
    rate: s.detection_percent,
    detectedProbes: s.detected_probes,
    totalProbes: s.total_probes,
    sampleId: s.sample_id,
  }));

  const getBarColor = (cohort: string) => {
    switch (cohort) {
      case 'CON':
        return '#38bdf8'; // Sky
      case 'EX':
        return '#10b981'; // Emerald
      case 'FLY':
        return '#f59e0b'; // Amber
      default:
        return '#818cf8';
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg p-3 text-xs font-mono tabular-nums shadow-xl">
          <div className="flex items-center justify-between gap-3 mb-1.5 border-b border-white/10 pb-1">
            <span className="font-bold text-sky-400">{data.gsm}</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/10 text-slate-300 font-mono">
              {data.cohort} &ndash; {data.time}
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <span className="text-slate-400">Technical Detection:</span>
              <span className="font-bold text-white">{data.rate}%</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Detected Probes:</span>
              <span className="text-slate-200">{data.detectedProbes.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4 text-[11px]">
              <span className="text-slate-400">Total Human Probes:</span>
              <span className="text-slate-200">{data.totalProbes.toLocaleString()}</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 truncate max-w-xs">
            {data.sampleId}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="font-semibold text-white text-base">
            Sample Detection Distribution (44 Microarrays)
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Individual probe detection percentages across all 44 Agilent miRNA microarrays
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            <span>CON (14)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span>EX (14)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span>FLY (16)</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="gsm"
              stroke="#64748b"
              interval={1}
              angle={-45}
              textAnchor="end"
              height={45}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
            />
            <YAxis
              stroke="#64748b"
              domain={[0, 30]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine
              y={meanRate}
              stroke="#e2e8f0"
              strokeDasharray="4 4"
              label={{
                value: `Dataset Mean: ${meanRate}%`,
                fill: '#94a3b8',
                fontSize: 11,
                position: 'top',
              }}
            />
            <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.cohort)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 text-right text-[11px] text-slate-500">
        Dashed line indicates overall dataset average ({meanRate}%) across all 44 arrays.
      </div>
    </div>
  );
};
