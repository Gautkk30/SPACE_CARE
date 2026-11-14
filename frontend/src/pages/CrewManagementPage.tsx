import { useState } from 'react';
import { AstronautProfile, HealthStatus, TabId } from '../types/spacecare';
import {
  Users,
  Search,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Activity,
  TrendingDown,
  FileText,
  ArrowRight,
  Shield,
} from 'lucide-react';

interface CrewManagementPageProps {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
  onNavigateTab: (tab: TabId) => void;
}

export const CrewManagementPage = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut,
  onNavigateTab,
}: CrewManagementPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | HealthStatus>('ALL');

  const filteredCrew = crew.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.callsign.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || member.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'NOMINAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            Nominal
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/30 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Caution
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-space-red-muted text-space-red border border-space-red/30 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Alert
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Users className="w-3.5 h-3.5" />
            Crew Operations & Medical Baselines
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Expedition Crew Management
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Mission roster, pre-flight physiological baseline records, and individual clinical adaptation profiles.
          </p>
        </div>

        {/* Quick count chips */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1.5 rounded-lg bg-space-panel border border-space-border text-space-muted">
            Total: <strong className="text-space-text">{crew.length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
            Nominal: <strong>{crew.filter((c) => c.status === 'NOMINAL').length}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-space-amber-muted text-space-amber border border-space-amber/30">
            Caution: <strong>{crew.filter((c) => c.status === 'CAUTION').length}</strong>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-space-dim absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by astronaut name, callsign, role, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-space-bg border border-space-border rounded-lg pl-9 pr-4 py-2 text-xs text-space-text placeholder-space-dim focus:outline-none focus:border-space-cyan"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'NOMINAL', 'CAUTION', 'ALERT'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/40 font-semibold'
                    : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      {/* Crew Cards Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredCrew.map((member) => {
          const isSelected = member.id === selectedAstronautId;

          return (
            <div
              key={member.id}
              className={`bg-space-panel border rounded-xl p-5 transition relative shadow-lg ${
                isSelected
                  ? 'border-space-cyan ring-1 ring-space-cyan shadow-space-cyan/10'
                  : 'border-space-border hover:border-space-border-light'
              }`}
            >
              {/* Card Top */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base tracking-wider ${
                      isSelected
                        ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/40'
                        : 'bg-space-border text-space-text'
                    }`}
                  >
                    {member.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-space-text">{member.name}</h3>
                      <span className="text-[11px] font-mono px-2 py-0.2 rounded bg-space-bg text-space-dim border border-space-border">
                        {member.id}
                      </span>
                    </div>
                    <p className="text-xs text-space-cyan font-medium">
                      {member.role} &bull; <span className="text-space-dim">{member.nationality}</span>
                    </p>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>

              {/* Mission Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-space-bg/60 border border-space-border/60 rounded-lg p-3 mb-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-space-dim block uppercase">Flight Time</span>
                  <span className="text-space-text font-semibold">{member.totalFlightHours} hrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-dim block uppercase">EVA Hours</span>
                  <span className="text-space-text font-semibold">{member.evaHours}h ({member.evaCount} EVAs)</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-dim block uppercase">Mission Day</span>
                  <span className="text-space-text font-semibold">Day {member.missionDay}</span>
                </div>
                <div>
                  <span className="text-[10px] text-space-dim block uppercase">Age</span>
                  <span className="text-space-text font-semibold">{member.age} yrs</span>
                </div>
              </div>

              {/* Pre-Flight vs In-Flight Deltas */}
              <div className="mb-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-space-dim flex items-center gap-1.5 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-space-cyan" />
                  Physiological Deltas from Pre-Flight Baseline
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-space-bg border border-space-border rounded p-2">
                    <span className="text-[10px] text-space-dim block">Resting HR</span>
                    <span
                      className={`font-mono font-bold ${
                        member.preFlightDeltas.hrDelta > 10 ? 'text-space-amber' : 'text-space-text'
                      }`}
                    >
                      {member.preFlightDeltas.hrDelta > 0 ? `+${member.preFlightDeltas.hrDelta}` : member.preFlightDeltas.hrDelta} bpm
                    </span>
                  </div>
                  <div className="bg-space-bg border border-space-border rounded p-2">
                    <span className="text-[10px] text-space-dim block">Systolic BP</span>
                    <span
                      className={`font-mono font-bold ${
                        member.preFlightDeltas.bpSystolicDelta > 10 ? 'text-space-amber' : 'text-space-text'
                      }`}
                    >
                      {member.preFlightDeltas.bpSystolicDelta > 0 ? `+${member.preFlightDeltas.bpSystolicDelta}` : member.preFlightDeltas.bpSystolicDelta} mmHg
                    </span>
                  </div>
                  <div className="bg-space-bg border border-space-border rounded p-2">
                    <span className="text-[10px] text-space-dim block">Body Mass</span>
                    <span className="font-mono font-bold text-space-text">
                      {member.preFlightDeltas.weightDeltaKg} kg
                    </span>
                  </div>
                  <div className="bg-space-bg border border-space-border rounded p-2">
                    <span className="text-[10px] text-space-dim block">Est. Bone Loss</span>
                    <span className="font-mono font-bold text-space-amber">
                      -{member.preFlightDeltas.estimatedBoneLossPct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Medical Officer Notes */}
              <div className="bg-space-bg/50 border border-space-border/60 rounded-lg p-3 text-xs mb-4">
                <div className="flex items-center justify-between text-space-dim text-[11px] mb-1 font-mono">
                  <span className="flex items-center gap-1.5 text-space-cyan font-semibold">
                    <FileText className="w-3.5 h-3.5" />
                    Medical Officer Clinical Assessment
                  </span>
                  <span>Exam: {member.lastExamDate}</span>
                </div>
                <p className="text-space-muted leading-relaxed">
                  {member.medicalOfficerNotes}
                </p>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-space-border/60">
                <span className="text-[11px] text-space-dim font-mono">
                  Callsign: <strong className="text-space-text">{member.callsign}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectAstronaut(member.id);
                      onNavigateTab('vitals');
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-cyan/10 hover:bg-space-cyan/20 border border-space-cyan/30 text-space-cyan text-xs font-semibold transition"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    Inspect Telemetry
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Side-by-Side Crew Baseline Comparison Table */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Shield className="w-4 h-4 text-space-cyan" />
              Side-by-Side Physiological Baseline Comparison
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Reference clinical norms established during NASA pre-flight qualification protocol.
            </p>
          </div>
          <span className="text-xs font-mono text-space-dim">All 4 Crew Members</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-space-border text-space-dim font-mono uppercase text-[11px]">
                <th className="pb-3 pr-4">Astronaut</th>
                <th className="pb-3 px-3">Role</th>
                <th className="pb-3 px-3">Status</th>
                <th className="pb-3 px-3">Resting HR</th>
                <th className="pb-3 px-3">Resting BP</th>
                <th className="pb-3 px-3">Min SpO2</th>
                <th className="pb-3 px-3">Baseline HRV</th>
                <th className="pb-3 px-3">Core Temp</th>
                <th className="pb-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-space-border/40 font-mono">
              {crew.map((member) => {
                const isSelected = member.id === selectedAstronautId;

                return (
                  <tr
                    key={member.id}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-space-cyan-muted/30 font-semibold'
                        : 'hover:bg-space-panel-hover/50 text-space-muted'
                    }`}
                  >
                    <td className="py-3 pr-4 font-sans text-space-text flex items-center gap-2 font-medium">
                      <span className="w-6 h-6 rounded bg-space-border text-[11px] flex items-center justify-center font-bold">
                        {member.avatarInitials}
                      </span>
                      <span>{member.name}</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-space-dim text-xs">{member.role}</td>
                    <td className="py-3 px-3">{getStatusBadge(member.status)}</td>
                    <td className="py-3 px-3 text-space-text">{member.baseline.restingHeartRate} bpm</td>
                    <td className="py-3 px-3 text-space-text">
                      {member.baseline.restingSystolicBP}/{member.baseline.restingDiastolicBP} mmHg
                    </td>
                    <td className="py-3 px-3 text-space-text">&ge; {member.baseline.minSpO2Nominal}%</td>
                    <td className="py-3 px-3 text-space-text">{member.baseline.baselineHrvRmssd} ms</td>
                    <td className="py-3 px-3 text-space-text">{member.baseline.baselineCoreTemp}&deg;C</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectAstronaut(member.id);
                          onNavigateTab('vitals');
                        }}
                        className={`text-xs px-2.5 py-1 rounded border transition ${
                          isSelected
                            ? 'bg-space-cyan text-space-bg border-space-cyan font-bold'
                            : 'bg-space-bg text-space-cyan border-space-cyan/30 hover:bg-space-cyan/20'
                        }`}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
