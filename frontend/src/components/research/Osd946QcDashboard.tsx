import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Sparkles, FlaskConical } from 'lucide-react';
import { OSD946OverviewResponse, OSD946SampleQC } from '../../types/research';
import { researchService } from '../../services/researchService';
import { ScientificNoticeBanner } from './ScientificNoticeBanner';
import { OverviewStatsCards } from './OverviewStatsCards';
import { GroupDetectionBarChart } from './GroupDetectionBarChart';
import { SampleDistributionChart } from './SampleDistributionChart';
import { SampleQcTable } from './SampleQcTable';

export const Osd946QcDashboard: React.FC = () => {
  const [overview, setOverview] = useState<OSD946OverviewResponse | null>(null);
  const [samples, setSamples] = useState<OSD946SampleQC[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, samplesData] = await Promise.all([
        researchService.getOverview(),
        researchService.getSamples(),
      ]);
      setOverview(overviewData);
      setSamples(samplesData.samples);
    } catch (err: any) {
      setError(
        err.message ||
          'Failed to load OSD-946 research data. Ensure the backend FastAPI server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-2">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>NASA Open Science Data Repository (OSDR) Integration</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            NASA OSD-946 / GLDS-773 Quality Control Dashboard
          </h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-3xl">
            Technical microarray quality-control analysis of skeletal muscle (<em>vastus lateralis</em>) microRNA expression from the 70-day head-down tilt bed-rest countermeasure study (GSE226504).
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 border border-slate-700/80 hover:border-sky-500/50 hover:bg-slate-850 text-slate-200 transition disabled:opacity-50 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Reload QC Data</span>
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-base font-semibold text-white">Loading NASA OSD-946 QC Data...</h3>
          <p className="text-xs text-slate-400 mt-1">
            Querying backend FastAPI endpoints (/api/v1/research/osd946/overview & /samples)
          </p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-rose-950/30 border border-rose-600/40 rounded-xl p-6 text-slate-200">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 shrink-0 border border-rose-500/20">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2 text-xs md:text-sm">
              <h3 className="font-semibold text-rose-300 text-base">
                Unable to Load OSD-946 Research Data
              </h3>
              <p className="text-slate-300 leading-relaxed">{error}</p>
              <div className="pt-2">
                <button
                  onClick={loadData}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 transition cursor-pointer"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content When Ready */}
      {!loading && !error && overview && (
        <div className="space-y-6">
          {/* Scientific Disclaimer Banner */}
          <ScientificNoticeBanner
            notice={overview.scientific_notice}
            doi={overview.metadata.doi}
            datasetUrl={overview.metadata.dataset_url}
          />

          {/* Overview Stat Cards */}
          <OverviewStatsCards statistics={overview.statistics} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GroupDetectionBarChart groups={overview.group_summaries} />
            <SampleDistributionChart
              samples={samples}
              meanRate={overview.statistics.mean_detection_percent}
            />
          </div>

          {/* Detailed Sample Table */}
          <SampleQcTable samples={samples} />

          {/* Research Integration Metadata Footer */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-5 text-xs text-slate-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                <strong>Next Step:</strong> Downstream differential expression screening of muscle miRNA targets (miR-1, miR-133a, miR-206) pending technical normalization.
              </span>
            </div>
            <span className="text-slate-500 text-[11px] font-mono">
              Dataset: OSD-946 | Accession: GSE226504
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
