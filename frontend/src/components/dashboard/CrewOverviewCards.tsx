import React from 'react';
import { AstronautProfile, HealthStatus } from '../../types/spacecare';
import { Activity, ShieldCheck, AlertCircle, Heart } from 'lucide-react';

interface CrewOverviewCardsProps {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const CrewOverviewCards: React.FC<CrewOverviewCardsProps> = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut,
}) => {
  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'NOMINAL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tabular-nums">
            <ShieldCheck className="w-3 h-3" />
            Nominal
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 tabular-nums animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Caution
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FC3D21]/15 text-[#FC3D21] border border-[#FC3D21]/40 tabular-nums animate-pulse">
            <AlertCircle className="w-3 h-3" />
            Critical
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <Activity className="w-4 h-4 text-sky-400" />
          Expedition Crew Health Roster
        </h2>
        <span className="text-xs text-slate-400 font-mono tabular-nums">
          <strong className="text-white">{crew.length}</strong> {crew.length === 1 ? 'Active Crew Member' : 'Active Crew Members'} &bull; Select to inspect
        </span>
      </div>

      <div className={`grid grid-cols-1 sm:grid-cols-2 ${crew.length <= 2 ? 'lg:grid-cols-2' : crew.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-3.5`}>
        {crew.map((member) => {
          const isSelected = member.id === selectedAstronautId;

          return (
            <div
              key={member.id}
              onClick={() => onSelectAstronaut(member.id)}
              className={`cursor-pointer rounded-xl p-4 transition-all duration-150 border text-left relative ${
                isSelected
                  ? 'bg-[#0B3D91]/15 border-[#1A56DB] shadow-lg shadow-[#0B3D91]/20 ring-1 ring-[#1A56DB]/50'
                  : 'bg-space-panel border-white/[0.08] hover:border-white/[0.18]'
              }`}
            >
              {/* Card Header with Avatar and Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm tracking-wider ${
                      isSelected
                        ? 'bg-[#0B3D91]/30 text-sky-300 border border-[#1A56DB]/40'
                        : 'bg-white/[0.06] text-white'
                    }`}
                  >
                    {member.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="text-sm font-semibold text-white leading-tight">
                        {member.name}
                      </h3>
                      {member.is_demo && (
                        <span
                          className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-space-cyan/15 text-space-cyan border border-space-cyan/30"
                          title="Fictional demonstration profile; synthetic non-validated baseline"
                        >
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono tabular-nums">
                      {member.callsign} &bull; {member.id}
                    </p>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>

              {/* Role & EVA */}
              <div className="text-xs text-slate-400 mb-3 truncate">
                {member.role}
              </div>

              {/* Quick Biometric Strip */}
              <div className="pt-2.5 border-t border-white/[0.08] grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Heart className="w-3.5 h-3.5 text-[#FC3D21]" />
                  <span>HR:</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {member.currentVitals.heartRate} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 justify-end">
                  <span>SpO2:</span>
                  <span className="font-mono tabular-nums font-semibold text-white">
                    {member.currentVitals.spo2}%
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-[#1A56DB]/30 text-center">
                  <span className="text-[10px] uppercase tracking-widest font-semibold text-sky-400">
                    &bull; Active Inspector Target &bull;
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
