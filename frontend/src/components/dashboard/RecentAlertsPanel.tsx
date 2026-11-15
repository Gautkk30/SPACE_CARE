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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FC3D21]/15 text-[#FC3D21] border border-[#FC3D21]/40 tabular-nums animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 tabular-nums">
            <AlertTriangle className="w-3.5 h-3.5" />
            CAUTION
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/40 tabular-nums">
            <Info className="w-3.5 h-3.5" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 lg:p-5 shadow-lg space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div>
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Active Clinical Early Warnings & Anomaly Alerts
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Cross-referenced against NASA Human Research Program (HRP) evidence countermeasures.
          </p>
        </div>
        <span className="text-xs font-mono tabular-nums text-slate-300">
          {alerts.length} Detected Events
        </span>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-black/30 border border-white/[0.06] rounded-xl p-8 text-center space-y-2">
            <CheckCheck className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">No Active Early Warning Alerts</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All monitored physiological and environmental metrics are operating within acceptable safety boundaries. The backend telemetry queue is clear.
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-lg p-4 border transition-colors ${
                alert.severity === 'CRITICAL'
                  ? 'bg-[#FC3D21]/10 border-[#FC3D21]/30'
                  : 'bg-black/25 border-white/[0.08]'
              }`}
            >
              {/* Alert Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {getSeverityBadge(alert.severity)}
                  <span className="text-xs font-mono tabular-nums text-slate-400">[{alert.category}]</span>
                  <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono tabular-nums">
                  <span className="text-sky-300 font-medium">Target: {alert.astronautName}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(alert.timestamp).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
                  </span>
                </div>
              </div>

              {/* Physiological Explanation */}
              <div className="text-xs text-slate-300 leading-relaxed mb-3">
                <span className="font-semibold text-white">Physiological Assessment: </span>
                {alert.physiologicalExplanation}
              </div>

              {/* Recommended Countermeasure */}
              <div className="bg-white/[0.03] border border-white/[0.08] rounded-md p-3 mb-2.5">
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mb-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Evidence-Based Countermeasure Protocol:
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {alert.countermeasure}
                </p>
              </div>

              {/* Scientific Citation */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-white/[0.04]">
                <div className="flex items-center gap-1.5 truncate">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  <span className="truncate">Reference: {alert.evidenceReference}</span>
                </div>
                {alert.acknowledged ? (
                  <span className="text-emerald-400 text-[11px] font-mono tabular-nums">Acknowledged</span>
                ) : (
                  <span className="text-amber-400 text-[11px] font-mono tabular-nums">Unacknowledged</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
