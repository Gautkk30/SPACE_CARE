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
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
            <ShieldCheck className="w-3 h-3" />
            Nominal
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/30">
            <AlertCircle className="w-3 h-3" />
            Caution
          </span>
        );
      case 'ALERT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-space-red-muted text-space-red border border-space-red/30">
            <AlertCircle className="w-3 h-3" />
            Critical
          </span>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
          <Activity className="w-4 h-4 text-space-cyan" />
          Expedition Crew Health Roster
        </h2>
        <span className="text-xs text-space-dim">Select astronaut to inspect biometrics</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {crew.map((member) => {
          const isSelected = member.id === selectedAstronautId;

          return (
            <div
              key={member.id}
              onClick={() => onSelectAstronaut(member.id)}
              className={`cursor-pointer rounded-xl p-4 transition-all duration-150 border text-left relative ${
                isSelected
                  ? 'bg-space-panel-hover border-space-cyan shadow-md shadow-space-cyan/10 ring-1 ring-space-cyan'
                  : 'bg-space-panel border-space-border hover:border-space-border-light hover:bg-space-panel-hover/60'
              }`}
            >
              {/* Card Header with Avatar and Status */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm tracking-wider ${
                      isSelected
                        ? 'bg-space-cyan/20 text-space-cyan border border-space-cyan/40'
                        : 'bg-space-border text-space-text'
                    }`}
                  >
                    {member.avatarInitials}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-space-text leading-tight">
                      {member.name}
                    </h3>
                    <p className="text-[11px] text-space-dim font-mono">
                      {member.callsign} &bull; {member.id}
                    </p>
                  </div>
                </div>
                {getStatusBadge(member.status)}
              </div>

              {/* Role & EVA */}
              <div className="text-xs text-space-muted mb-3 truncate">
                {member.role}
              </div>

              {/* Quick Biometric Strip */}
              <div className="pt-2.5 border-t border-space-border/60 grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-space-muted">
                  <Heart className="w-3.5 h-3.5 text-space-red" />
                  <span>HR:</span>
                  <span className="font-mono font-semibold text-space-text">
                    {member.currentVitals.heartRate} <span className="text-[10px] text-space-dim">bpm</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-space-muted justify-end">
                  <span>SpO2:</span>
                  <span className="font-mono font-semibold text-space-text">
                    {member.currentVitals.spo2}%
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="mt-2.5 pt-2 border-t border-space-cyan/20 text-center">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-space-cyan">
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
