import React from 'react';
import { Users, AlertTriangle, Radio, Sun, Clock, Database } from 'lucide-react';
import { MissionSummary } from '../../types/spacecare';

interface MissionSummaryStripProps {
  summary?: MissionSummary | null;
  activeAlertCount: number;
}

export const MissionSummaryStrip: React.FC<MissionSummaryStripProps> = ({
  summary,
  activeAlertCount,
}) => {
  // Defensive handling for potentially null or undefined summary data
  if (!summary) {
    // Render a minimal placeholder or loading state
    return (
      <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg">
        <div className="text-xs uppercase tracking-wider text-space-dim font-medium">
          No Mission Data Available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {/* Mission Status */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-space-dim flex items-center gap-1.5 font-medium">
            <Radio className="w-3.5 h-3.5 text-space-cyan" />
            Mission Clock
          </span>
          <span className="text-base font-semibold text-space-text mt-1 font-mono tabular-nums">
            MET Day {summary.missionElapsedDays}
          </span>
          <span className="text-[11px] text-space-muted truncate">
            {summary.missionName}
          </span>
        </div>

        {/* Crew Health Status */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-space-dim flex items-center gap-1.5 font-medium">
            <Users className="w-3.5 h-3.5 text-space-emerald" />
            Crew Status
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-semibold text-space-text font-mono tabular-nums">
              {summary.nominalCrewCount}/{Math.max(summary.totalCrewCount || 1, 1)}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
              Nominal
            </span>
          </div>
          <span className="text-[11px] text-amber-400/90 font-mono tabular-nums">
            {summary.cautionCrewCount > 0
              ? `${summary.cautionCrewCount} Crew in Caution`
              : summary.totalCrewCount === 1
              ? '1 Active Crew Member'
              : 'All Crew Nominal'}
          </span>
        </div>

        {/* Active Early Warnings */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-space-dim flex items-center gap-1.5 font-medium">
            <AlertTriangle className="w-3.5 h-3.5 text-[#FC3D21]" />
            Active Warnings
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-base font-semibold text-[#FC3D21] font-mono tabular-nums">
              {activeAlertCount}
            </span>
            {activeAlertCount > 0 ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#FC3D21]/15 text-[#FC3D21] border border-[#FC3D21]/40 animate-pulse font-medium">
                Attention Req.
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium">
                Clear
              </span>
            )}
          </div>
          <span className="text-[11px] text-space-muted">
            Clinical Rule &amp; ML Engine
          </span>
        </div>

        {/* Space Radiation / DONKI Feed */}
        <div className="flex flex-col col-span-2 md:col-span-1 lg:col-span-2">
          <span className="text-xs uppercase tracking-wider text-space-dim flex items-center gap-1.5 font-medium">
            <Sun className="w-3.5 h-3.5 text-space-red" />
            Radiation &amp; Space Weather
          </span>
          <span className="text-sm font-semibold text-space-red mt-1 truncate" title={summary.spaceWeatherCondition}>
            {summary.spaceWeatherCondition}
          </span>
          <span className="text-[11px] text-space-muted truncate" title={summary.radiationExposureRate}>
            Dosimeter: {summary.radiationExposureRate} &bull; Ref: NASA DONKI
          </span>
        </div>

        {/* Telemetry Synchronization */}
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider text-space-dim flex items-center gap-1.5 font-medium">
            <Clock className="w-3.5 h-3.5 text-space-cyan" />
            Telemetry Sync
          </span>
          <span className="text-xs font-semibold text-space-text mt-1 font-mono">
            {summary.telemetrySyncTime.includes(':') && !summary.telemetrySyncTime.includes('T')
              ? summary.telemetrySyncTime
              : !isNaN(new Date(summary.telemetrySyncTime).getTime())
              ? `${new Date(summary.telemetrySyncTime).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC`
              : summary.telemetrySyncTime}
          </span>
          <span className="text-[10px] inline-flex items-center gap-1 text-space-cyan mt-0.5 font-mono">
            <Database className="w-3 h-3" />
            SIMULATED FEED
          </span>
        </div>
      </div>
    </div>
  );
};
