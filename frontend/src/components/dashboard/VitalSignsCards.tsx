import React from 'react';
import { Heart, Activity, Wind, Thermometer, Gauge } from 'lucide-react';
import { AstronautProfile } from '../../types/spacecare';

interface VitalSignsCardsProps {
  astronaut: AstronautProfile;
}

export const VitalSignsCards: React.FC<VitalSignsCardsProps> = ({ astronaut }) => {
  const { currentVitals, baseline } = astronaut;

  // Determine individual metric statuses
  const isHrElevated = currentVitals.heartRate > baseline.maxHeartRateNominal;
  const isHrDepressed = currentVitals.heartRate < baseline.minHeartRateNominal;
  const hrStatus = isHrElevated || isHrDepressed ? 'CAUTION' : 'NOMINAL';

  const isSpo2Low = currentVitals.spo2 < baseline.minSpO2Nominal;
  const spo2Status = isSpo2Low ? 'CAUTION' : 'NOMINAL';

  const isBpElevated =
    currentVitals.systolicBP > baseline.restingSystolicBP + 15 ||
    currentVitals.diastolicBP > baseline.restingDiastolicBP + 10;
  const bpStatus = isBpElevated ? 'CAUTION' : 'NOMINAL';

  const isTempElevated = currentVitals.coreTemp > baseline.baselineCoreTemp + 0.5;
  const tempStatus = isTempElevated ? 'CAUTION' : 'NOMINAL';

  const isRespAbnormal =
    currentVitals.respiratoryRate < baseline.respiratoryRateRange[0] ||
    currentVitals.respiratoryRate > baseline.respiratoryRateRange[1];
  const respStatus = isRespAbnormal ? 'CAUTION' : 'NOMINAL';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
          <Activity className="w-4 h-4 text-space-cyan" />
          Active Biometric Telemetry &bull; {astronaut.name} ({astronaut.callsign})
        </h2>
        <span className="text-xs font-mono text-space-cyan px-2 py-0.5 rounded bg-space-cyan-muted border border-space-cyan/20">
          SIMULATED STREAM
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Heart Rate */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-space-red" />
              Heart Rate
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                hrStatus === 'NOMINAL'
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
              }`}
            >
              {hrStatus}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-space-text">
                {currentVitals.heartRate}
              </span>
              <span className="text-xs text-space-muted">bpm</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between">
              <span>Baseline Range</span>
              <span className="font-mono text-space-muted">
                {baseline.minHeartRateNominal}-{baseline.maxHeartRateNominal} bpm
              </span>
            </div>
          </div>
        </div>

        {/* Blood Oxygen (SpO2) */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-space-cyan" />
              Oxygen Sat (SpO2)
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                spo2Status === 'NOMINAL'
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
              }`}
            >
              {spo2Status}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-space-text">
                {currentVitals.spo2}
              </span>
              <span className="text-xs text-space-muted">%</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between">
              <span>Nominal Floor</span>
              <span className="font-mono text-space-muted">
                &ge; {baseline.minSpO2Nominal}%
              </span>
            </div>
          </div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-space-amber" />
              Blood Pressure
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                bpStatus === 'NOMINAL'
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
              }`}
            >
              {bpStatus}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-space-text">
                {currentVitals.systolicBP}/{currentVitals.diastolicBP}
              </span>
              <span className="text-xs text-space-muted">mmHg</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between">
              <span>Resting Baseline</span>
              <span className="font-mono text-space-muted">
                {baseline.restingSystolicBP}/{baseline.restingDiastolicBP}
              </span>
            </div>
          </div>
        </div>

        {/* Core Body Temperature */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-space-cyan" />
              Core Temp
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                tempStatus === 'NOMINAL'
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30'
              }`}
            >
              {tempStatus}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-space-text">
                {currentVitals.coreTemp}
              </span>
              <span className="text-xs text-space-muted">&deg;C</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between">
              <span>Resting Baseline</span>
              <span className="font-mono text-space-muted">
                {baseline.baselineCoreTemp}&deg;C
              </span>
            </div>
          </div>
        </div>

        {/* Respiratory Rate */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-space-cyan" />
              Respiration
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                respStatus === 'NOMINAL'
                  ? 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
                  : 'bg-space-amber-muted text-space-amber border-space-amber/30'
              }`}
            >
              {respStatus}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl lg:text-3xl font-bold font-mono text-space-text">
                {currentVitals.respiratoryRate}
              </span>
              <span className="text-xs text-space-muted">br/min</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between">
              <span>Normal Range</span>
              <span className="font-mono text-space-muted">
                {baseline.respiratoryRateRange[0]}-{baseline.respiratoryRateRange[1]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
