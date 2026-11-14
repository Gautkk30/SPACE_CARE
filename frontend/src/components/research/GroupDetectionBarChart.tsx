import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { OSD946GroupSummary } from '../../types/research';

interface Props {
  groups: OSD946GroupSummary[];
}

interface TransformedGroupData {
  cohort: string;
  name: string;
  preRate: number;
  postRate: number;
  preMin: number;
  preMax: number;
  postMin: number;
  postMax: number;
  preSamples: number;
  postSamples: number;
}

export const GroupDetectionBarChart: React.FC<Props> = ({ groups }) => {
  // Pivot group summaries by cohort for side-by-side PRE vs POST bars
  const cohortMap: Record<string, Partial<TransformedGroupData>> = {
    CON: { cohort: 'CON', name: 'Control (Bed Rest Only)' },
    EX: { cohort: 'EX', name: 'Exercise (Aerobic + Resistance)' },
    FLY: { cohort: 'FLY', name: 'Flywheel (Resistance Countermeasure)' },
  };

  groups.forEach((g) => {
    const key = g.group.toUpperCase();
    if (!cohortMap[key]) {
      cohortMap[key] = { cohort: key, name: key };
    }
    if (g.time.toUpperCase() === 'PRE') {
      cohortMap[key].preRate = g.average_detection;
      cohortMap[key].preMin = g.minimum;
      cohortMap[key].preMax = g.maximum;
      cohortMap[key].preSamples = g.samples;
    } else if (g.time.toUpperCase() === 'POST') {
      cohortMap[key].postRate = g.average_detection;
      cohortMap[key].postMin = g.minimum;
      cohortMap[key].postMax = g.maximum;
      cohortMap[key].postSamples = g.samples;
    }
  });

  const chartData: TransformedGroupData[] = ['CON', 'EX', 'FLY'].map((c) => ({
    cohort: c,
    name: cohortMap[c]?.name || c,
    preRate: cohortMap[c]?.preRate ?? 0,
    postRate: cohortMap[c]?.postRate ?? 0,
    preMin: cohortMap[c]?.preMin ?? 0,
    preMax: cohortMap[c]?.preMax ?? 0,
    postMin: cohortMap[c]?.postMin ?? 0,
    postMax: cohortMap[c]?.postMax ?? 0,
    preSamples: cohortMap[c]?.preSamples ?? 0,
    postSamples: cohortMap[c]?.postSamples ?? 0,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: TransformedGroupData = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs shadow-xl backdrop-blur">
          <p className="font-bold text-white mb-1.5">{data.name} ({data.cohort})</p>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4 text-sky-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-sky-400 inline-block" />
                PRE (Baseline):
              </span>
              <span className="font-semibold">{data.preRate}%</span>
            </div>
            <p className="text-[10px] text-slate-400 pl-4">
              Range: {data.preMin}% &ndash; {data.preMax}% (n={data.preSamples})
            </p>

            <div className="flex items-center justify-between gap-4 text-indigo-400 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                POST (Bed Rest):
              </span>
              <span className="font-semibold">{data.postRate}%</span>
            </div>
            <p className="text-[10px] text-slate-400 pl-4">
              Range: {data.postMin}% &ndash; {data.postMax}% (n={data.postSamples})
            </p>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
            Note: Technical hybridization percentage, not clinical outcome.
          </div>
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
            Cohort Technical Detection: PRE vs. POST Bed Rest
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Average Agilent microarray probe detection percentage by study cohort (CON, EX, FLY)
          </p>
        </div>
        <div className="text-[11px] px-2.5 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60 self-start sm:self-auto">
          6 Group Summaries
        </div>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
            barGap={8}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="cohort"
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              domain={[0, 25]}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
              formatter={(value) => (
                <span className="text-slate-300 font-medium">{value}</span>
              )}
            />
            <Bar
              dataKey="preRate"
              name="PRE (Baseline)"
              fill="#38bdf8"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="postRate"
              name="POST (70-day Bed Rest)"
              fill="#818cf8"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
        <span className="italic">
          * CON: Control (n=7/7) | EX: Aerobic + Resistance (n=7/7) | FLY: Flywheel Resistance (n=8/8)
        </span>
        <span className="text-slate-500">
          Source: data/raw/nasa/osd946/qc_group_summary.csv
        </span>
      </div>
    </div>
  );
};
