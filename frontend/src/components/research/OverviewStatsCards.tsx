import React from 'react';
import { Database, Dna, Users, Percent } from 'lucide-react';
import { OSD946Statistics } from '../../types/research';

interface Props {
  statistics?: OSD946Statistics;
}

export const OverviewStatsCards: React.FC<Props> = ({ statistics }) => {
  const totalSamples = statistics?.total_samples ?? 44;
  const probesPerSample = statistics?.total_human_probes_per_sample ?? 50980;
  const cohortsCount = statistics?.cohorts_count ?? 3;
  const meanRate = statistics?.mean_detection_percent ?? 15.09;
  const minRate = statistics?.min_detection_percent ?? 11.22;
  const maxRate = statistics?.max_detection_percent ?? 24.13;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Samples */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 hover:border-[#1A56DB]/50 transition shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Processed Samples</span>
          <div className="w-8 h-8 rounded-lg bg-[#0B3D91]/25 flex items-center justify-center text-sky-400 border border-[#1A56DB]/30">
            <Database className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">{totalSamples}</div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          44 Agilent .txt.gz raw arrays evaluated
        </p>
      </div>

      {/* Probes Per Sample */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 hover:border-emerald-500/40 transition shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Human miRNA Probes</span>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Dna className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">
          {probesPerSample.toLocaleString()}
        </div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          Per sample (prefix: <code className="text-emerald-400">hsa-</code>)
        </p>
      </div>

      {/* Study Cohorts */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 hover:border-purple-500/40 transition shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Study Cohorts</span>
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">{cohortsCount}</div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono">
          CON (Control), EX (Exercise), FLY (Flywheel)
        </p>
      </div>

      {/* Mean Detection Rate */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-5 hover:border-[#1A56DB]/40 transition shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Mean Detection Rate</span>
          <div className="w-8 h-8 rounded-lg bg-[#0B3D91]/25 flex items-center justify-center text-sky-400 border border-[#1A56DB]/30">
            <Percent className="w-4 h-4" />
          </div>
        </div>
        <div className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight">{meanRate}%</div>
        <p className="text-[11px] text-slate-400 mt-1 font-mono tabular-nums">
          Range: {minRate}% &ndash; {maxRate}%
        </p>
      </div>
    </div>
  );
};
