import React from 'react';
import { AstronautProfile, HealthAlert, MissionSummary } from '../types/spacecare';
import { MissionSummaryStrip } from '../components/dashboard/MissionSummaryStrip';
import { CrewOverviewCards } from '../components/dashboard/CrewOverviewCards';
import { VitalSignsCards } from '../components/dashboard/VitalSignsCards';
import { VitalTrendCharts } from '../components/dashboard/VitalTrendCharts';
import { RecentAlertsPanel } from '../components/dashboard/RecentAlertsPanel';
import { ShieldCheck, Info } from 'lucide-react';

interface OverviewDashboardProps {
  crew: AstronautProfile[];
  selectedAstronaut: AstronautProfile;
  onSelectAstronaut: (id: string) => void;
  alerts: HealthAlert[];
  missionSummary?: MissionSummary | null;
}
  crew: AstronautProfile[];
  selectedAstronaut: AstronautProfile;
  onSelectAstronaut: (id: string) => void;
  alerts: HealthAlert[];
  missionSummary: MissionSummary;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  crew,
  selectedAstronaut,
  onSelectAstronaut,
  alerts,
  missionSummary,
}) => {
  // Guard against null/undefined selectedAstronaut.
  // If no astronaut is selected but crew data exists, default to the first crew member.
  const effectiveAstronaut = selectedAstronaut ?? (crew && crew.length > 0 ? crew[0] : null);
  const selectedAstronautId = effectiveAstronaut ? effectiveAstronaut.id : '';

  return (
    <div className="space-y-6">
      {/* Top Mission Metrics Strip */}
      <MissionSummaryStrip
        summary={missionSummary}
        activeAlertCount={alerts.filter((a) => !a.acknowledged).length}
      />

      {/* Crew Overview Grid */}
      <CrewOverviewCards
        crew={crew}
        selectedAstronautId={selectedAstronautId}
        onSelectAstronaut={onSelectAstronaut}
      />

      {/* Selected Astronaut Biometrics Row */}
      {effectiveAstronaut && <VitalSignsCards astronaut={effectiveAstronaut} />}

      {/* 24-Hour Trends Chart */}
      {effectiveAstronaut && <VitalTrendCharts astronaut={effectiveAstronaut} />}

      {/* Early Warning Alerts Queue */}
      <RecentAlertsPanel alerts={alerts} />

      {/* System & Clinical Disclaimer Banner */}
      <footer className="bg-space-panel/60 border border-space-border/60 rounded-xl p-4 text-xs text-space-dim flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-space-cyan shrink-0" />
          <span>
            <strong className="text-space-muted">SPACECARE Prototype</strong> &bull; NASA Space Apps Challenge 2026. For spaceflight health monitoring research & demonstration only. Not a certified clinical diagnostic system.
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] text-space-dim">
          <Info className="w-3.5 h-3.5 text-space-cyan" />
          <span>Ref: NASA HRP / OSDR / DONKI Baselines</span>
        </div>
      </footer>
    </div>
  );
};
