import React from 'react';
import { HealthAlert, AlertSeverity } from '../../types/spacecare';
import { ShieldAlert, AlertTriangle, Info, CheckCheck, BookOpen, Clock } from 'lucide-react';

interface RecentAlertsPanelProps {
  alerts: HealthAlert[];
}

export const RecentAlertsPanel: React.FC<RecentAlertsPanelProps> = ({ alerts }) => {
  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-space-red-muted text-space-red border border-space-red/40 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            CAUTION
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/40">
            <Info className="w-3.5 h-3.5" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-space-panel border border-space-border rounded-xl p-4 lg:p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-space-amber" />
            Active Clinical Early Warnings & Anomaly Alerts
          </h2>
          <p className="text-xs text-space-dim mt-0.5">
            Cross-referenced against NASA Human Research Program (HRP) evidence countermeasures.
          </p>
        </div>
        <span className="text-xs font-mono text-space-muted">
          {alerts.length} Detected Events
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-space-bg/60 border border-space-border/60 rounded-xl p-8 text-center space-y-2">
            <CheckCheck className="w-8 h-8 text-space-emerald mx-auto" />
            <p className="text-sm font-semibold text-space-text">No Active Early Warning Alerts</p>
            <p className="text-xs text-space-dim max-w-md mx-auto">
              All monitored physiological and environmental metrics are operating within acceptable safety boundaries. The backend telemetry queue is clear.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg p-4 border transition-colors ${
                alert.severity === 'CRITICAL'
                  ? 'bg-space-red-muted/20 border-space-red/40'
                  : 'bg-space-bg/60 border-space-border'
              }`}
            >
              {/* Alert Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-mono text-space-dim">[{alert.category}]</span>
                  <h3 className="text-sm font-semibold text-space-text">{alert.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-space-dim font-mono">
                  <span className="text-space-cyan font-medium">Target: {alert.astronautName}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
                  </span>
                </div>
              </div>

              {/* Physiological Explanation */}
              <div className="text-xs text-space-muted leading-relaxed mb-3">
                <span className="font-semibold text-space-text">Physiological Assessment: </span>
                {alert.physiologicalExplanation}
              </div>

              {/* Recommended Countermeasure */}
              <div className="bg-space-panel border border-space-border-light/60 rounded-md p-3 mb-2.5">
                <div className="text-xs text-space-emerald font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Evidence-Based Countermeasure Protocol:
                </div>
                <p className="text-xs text-space-text leading-relaxed">
                  {alert.countermeasure}
                </p>
              </div>

              {/* Scientific Citation */}
              <div className="flex items-center justify-between text-[11px] text-space-dim pt-1">
                <div className="flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3 h-3 text-space-cyan" />
                  <span className="truncate">Reference: {alert.evidenceReference}</span>
                </div>
                {alert.acknowledged ? (
                  <span className="text-space-emerald text-[11px] font-mono">Acknowledged</span>
                ) : (
                  <span className="text-space-amber text-[11px] font-mono">Unacknowledged</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
