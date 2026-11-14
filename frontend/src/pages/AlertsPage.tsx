import { useState } from 'react';
import { HealthAlert, AlertSeverity, AlertStatus, HealthCategory } from '../types/spacecare';
import { ConnectionMode } from '../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  CloudOff,
} from 'lucide-react';

interface AlertsPageProps {
  alerts: HealthAlert[];
  onAcknowledgeAlert: (alertId: string) => void;
  onResolveAlert: (alertId: string) => void;
  backendMode?: ConnectionMode;
}

export const AlertsPage = ({
  alerts,
  onAcknowledgeAlert,
  onResolveAlert,
  backendMode = 'OFFLINE_DEMO_FALLBACK',
}: AlertsPageProps) => {
  const [severityFilter, setSeverityFilter] = useState<'ALL' | AlertSeverity>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AlertStatus>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | HealthCategory>('ALL');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  const filteredAlerts = alerts.filter((alert) => {
    const matchesSev = severityFilter === 'ALL' || alert.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || alert.status === statusFilter;
    const matchesCat = categoryFilter === 'ALL' || alert.category === categoryFilter;
    return matchesSev && matchesStatus && matchesCat;
  });

  const getSeverityBadge = (severity: AlertSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-space-red-muted text-space-red border border-space-red/40 animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            CRITICAL
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            CAUTION
          </span>
        );
      case 'INFO':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/40">
            <Info className="w-3.5 h-3.5" />
            ADVISORY
          </span>
        );
    }
  };

  const getStatusBadge = (status: AlertStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-red-muted/40 text-space-red border border-space-red/30">
            ACTIVE
          </span>
        );
      case 'ACKNOWLEDGED':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-amber-muted/40 text-space-amber border border-space-amber/30">
            ACKNOWLEDGED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-space-emerald-muted/40 text-space-emerald border border-space-emerald/30">
            RESOLVED
          </span>
        );
    }
  };

  const activeCount = alerts.filter((a) => a.status === 'ACTIVE').length;
  const acknowledgedCount = alerts.filter((a) => a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Clinical Early Warning & Action Dispatcher
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Mission Health Alerts & Action Queue
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Prioritized clinical alerts with physiological context and NASA HRP evidence-based countermeasures.
          </p>
        </div>

        {/* Counter chips */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-space-red-muted/30 text-space-red border border-space-red/30">
            Active: <strong>{activeCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-space-amber-muted/30 text-space-amber border border-space-amber/30">
            Ack: <strong>{acknowledgedCount}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-space-emerald-muted/30 text-space-emerald border border-space-emerald/30">
            Resolved: <strong>{resolvedCount}</strong>
          </span>
        </div>
      </div>

      {/* Backend Action State Banner */}
      {backendMode !== 'LIVE_API' && (
        <div className="bg-space-panel/80 border border-space-amber/30 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-space-amber font-mono">
          <div className="flex items-center gap-2">
            <CloudOff className="w-4 h-4 text-space-amber shrink-0" />
            <span>
              <strong>Session Preview (Backend Route Pending):</strong> Database persistence is waiting for FastAPI route mount. Acknowledging alerts updates in-memory UI only.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-space-amber/10 border border-space-amber/20 self-start sm:self-auto">
            In-Memory Only
          </span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col gap-3 text-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Severity Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-space-dim flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Severity:
            </span>
            {(['ALL', 'CRITICAL', 'CAUTION', 'INFO'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  severityFilter === sev
                    ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/40 font-semibold'
                    : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
                }`}
              >
                {sev === 'INFO' ? 'ADVISORY' : sev}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-space-dim mr-1">Status:</span>
            {(['ALL', 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-md transition font-medium ${
                  statusFilter === st
                    ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/40 font-semibold'
                    : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-space-border/50">
          <span className="text-space-dim mr-1">Category:</span>
          {(['ALL', 'CARDIOVASCULAR', 'RADIATION', 'SLEEP_PSYCH', 'MUSCULOSKELETAL', 'ENVIRONMENTAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono transition ${
                categoryFilter === cat
                  ? 'bg-space-cyan text-space-bg font-bold'
                  : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
              }`}
            >
              {cat === 'ALL' ? 'ALL CATEGORIES' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-space-panel border border-space-border rounded-xl p-12 text-center text-space-dim">
            <CheckCircle2 className="w-12 h-12 text-space-emerald mx-auto mb-3" />
            <h3 className="text-base font-semibold text-space-text">No Alerts Match Selected Filters</h3>
            <p className="text-xs mt-1">All filtered physiological vectors are operating within nominal boundaries.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isExpanded = expandedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`bg-space-panel border rounded-xl p-5 shadow-lg transition-all ${
                  alert.status === 'ACTIVE' && alert.severity === 'CRITICAL'
                    ? 'border-space-red/50 shadow-space-red/5'
                    : alert.status === 'ACTIVE'
                    ? 'border-space-amber/40 shadow-space-amber/5'
                    : 'border-space-border opacity-90'
                }`}
              >
                {/* Alert Top Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {getSeverityBadge(alert.severity)}
                    {getStatusBadge(alert.status)}
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-space-bg border border-space-border text-space-dim">
                      {alert.category}
                    </span>
                    <h3 className="text-sm font-bold text-space-text">{alert.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-space-dim">
                    <span className="text-space-cyan font-medium">Crew: {alert.astronautName}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(alert.timestamp).toLocaleTimeString('en-US', { timeZone: 'UTC' })} UTC
                    </span>
                  </div>
                </div>

                {/* What is changing summary */}
                <p className="text-xs text-space-text mb-3 leading-relaxed">
                  <strong className="text-space-cyan">Observations: </strong>
                  {alert.whatIsChanging || alert.physiologicalExplanation}
                </p>

                {/* Collapsible Deep-Dive Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-space-border/60 space-y-3.5 text-xs">
                    {/* Why it matters */}
                    <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3">
                      <span className="text-space-amber font-semibold block mb-1">
                        Clinical Significance & Operational Impact:
                      </span>
                      <p className="text-space-muted leading-relaxed">
                        {alert.whyItMatters || alert.physiologicalExplanation}
                      </p>
                    </div>

                    {/* Evidence-Based Countermeasure Protocol */}
                    <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3">
                      <span className="text-space-emerald font-semibold block mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Prescribed Evidence-Based Countermeasure Protocol:
                      </span>
                      <p className="text-space-text leading-relaxed">
                        {alert.countermeasure}
                      </p>
                    </div>

                    {/* Suggested Further Assessment */}
                    <div className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3">
                      <span className="text-space-cyan font-semibold block mb-1 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        Suggested Diagnostic Assessment:
                      </span>
                      <p className="text-space-dim leading-relaxed">
                        {alert.suggestedFurtherAssessment || 'Verify secondary telemetry streams and perform scheduled medical conference.'}
                      </p>
                    </div>

                    {/* Scientific Reference Citation */}
                    <div className="text-[11px] text-space-dim font-mono flex items-center gap-1.5 pt-1">
                      <BookOpen className="w-3.5 h-3.5 text-space-cyan shrink-0" />
                      <span>Evidence Reference: {alert.evidenceReference}</span>
                    </div>
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-space-border/60 text-xs">
                  <button
                    onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                    className="text-space-dim hover:text-space-cyan flex items-center gap-1 transition"
                  >
                    <span>{isExpanded ? 'Collapse Clinical Protocol' : 'Expand Clinical Protocol'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-space-amber/10 hover:bg-space-amber/20 border border-space-amber/30 text-space-amber font-semibold transition"
                        title={backendMode === 'LIVE_API' ? 'Acknowledges alert in SQLite database' : 'Session Preview (Backend Route Pending)'}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge Alert</span>
                        {backendMode !== 'LIVE_API' && (
                          <span className="text-[9px] font-normal text-space-dim ml-0.5">(Preview)</span>
                        )}
                      </button>
                    )}

                    {alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => onResolveAlert(alert.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-space-emerald/10 hover:bg-space-emerald/20 border border-space-emerald/30 text-space-emerald font-semibold transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark as Resolved
                      </button>
                    )}

                    {alert.status === 'RESOLVED' && (
                      <span className="text-space-emerald text-[11px] font-mono flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Case Closed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
