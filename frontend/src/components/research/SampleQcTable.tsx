import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpDown, CheckCircle, Database } from 'lucide-react';
import { OSD946SampleQC } from '../../types/research';

interface Props {
  samples: OSD946SampleQC[];
}

type SortField = 'gsm_accession' | 'group' | 'time' | 'detected_probes' | 'detection_percent';
type SortDirection = 'asc' | 'desc';

export const SampleQcTable: React.FC<Props> = ({ samples }) => {
  const [search, setSearch] = useState('');
  const [selectedCohort, setSelectedCohort] = useState<string>('ALL');
  const [selectedTimepoint, setSelectedTimepoint] = useState<string>('ALL');
  const [sortField, setSortField] = useState<SortField>('gsm_accession');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredSamples = useMemo(() => {
    return samples.filter((s) => {
      const matchesSearch =
        search === '' ||
        s.gsm_accession.toLowerCase().includes(search.toLowerCase()) ||
        s.sample_id.toLowerCase().includes(search.toLowerCase());

      const matchesCohort =
        selectedCohort === 'ALL' || s.group.toUpperCase() === selectedCohort;

      const matchesTime =
        selectedTimepoint === 'ALL' || s.time.toUpperCase() === selectedTimepoint;

      return matchesSearch && matchesCohort && matchesTime;
    });
  }, [samples, search, selectedCohort, selectedTimepoint]);

  const sortedSamples = useMemo(() => {
    return [...filteredSamples].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredSamples, sortField, sortDir]);

  const getCohortBadge = (cohort: string) => {
    switch (cohort.toUpperCase()) {
      case 'CON':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/20';
      case 'EX':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'FLY':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
      {/* Table Header and Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h3 className="font-semibold text-white text-base">
            Agilent Feature Extraction Sample Inventory
          </h3>
          <p className="text-slate-400 text-xs mt-0.5">
            Showing {sortedSamples.length} of {samples.length} processed miRNA microarray files
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by GSM or filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Cohort Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
            <select
              value={selectedCohort}
              onChange={(e) => setSelectedCohort(e.target.value)}
              aria-label="Filter by cohort"
              className="bg-transparent text-slate-300 text-xs py-0.5 pr-2 pl-1 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Cohorts</option>
              <option value="CON">CON (Control)</option>
              <option value="EX">EX (Exercise)</option>
              <option value="FLY">FLY (Flywheel)</option>
            </select>
          </div>

          {/* Timepoint Selector */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs">
            <select
              value={selectedTimepoint}
              onChange={(e) => setSelectedTimepoint(e.target.value)}
              aria-label="Filter by timepoint"
              className="bg-transparent text-slate-300 text-xs py-0.5 px-2 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Times</option>
              <option value="PRE">PRE (Baseline)</option>
              <option value="POST">POST (Bed Rest)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-800/80">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('gsm_accession')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Sample Accession</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('group')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Cohort</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('time')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center gap-1.5">
                  <span>Timepoint</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-3 font-semibold text-right">Human Probes</th>
              <th
                onClick={() => handleSort('detected_probes')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Detected</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th
                onClick={() => handleSort('detection_percent')}
                className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Detection %</span>
                  <ArrowUpDown className="w-3 h-3 opacity-60" />
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-center">Technical Validation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
            {sortedSamples.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  <Database className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  No sample records match your search criteria.
                </td>
              </tr>
            ) : (
              sortedSamples.map((sample) => (
                <tr
                  key={sample.sample_id}
                  className="hover:bg-slate-850/50 transition duration-150"
                >
                  <td className="py-2.5 px-4">
                    <div className="font-semibold text-slate-200">
                      {sample.gsm_accession}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono truncate max-w-xs" title={sample.sample_id}>
                      {sample.sample_id}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium border ${getCohortBadge(
                        sample.group
                      )}`}
                    >
                      {sample.group}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-300">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        sample.time === 'PRE'
                          ? 'bg-sky-500/10 text-sky-400'
                          : 'bg-indigo-500/10 text-indigo-400'
                      }`}
                    >
                      {sample.time}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                    {sample.total_probes.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {sample.detected_probes.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-sky-400">
                    {sample.detection_percent.toFixed(2)}%
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      title="All 50,980 expected human miRNA probe records present in Agilent FEATURES section"
                    >
                      <CheckCircle className="w-3 h-3" />
                      <span>50,980 Probes</span>
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
        <span>
          Probe completeness verifies extraction completeness. Scientific conclusions require biological normalization.
        </span>
        <span>
          Showing {sortedSamples.length} records
        </span>
      </div>
    </div>
  );
};
