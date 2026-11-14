import { useState, useMemo } from 'react';
import {
  AstronautProfile,
  SimulatedPattern,
} from '../types/spacecare';
import { spacecareApi, ConnectionMode } from '../services/api';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Flame,
  Activity,
  Heart,
  Gauge,
  Thermometer,
  Wind,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Play,
  Sun,
  Zap,
  Sliders,
  CheckCircle2,
  CloudOff,
  Crosshair,
  User,
} from 'lucide-react';

interface HazardSimulatorPageProps {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
  backendMode?: ConnectionMode;
}

export type OrganSystemKey = 
  | 'neuro' 
  | 'cardiovascular' 
  | 'pulmonary' 
  | 'thermo' 
  | 'cellular';

interface HazardState {
  dosimeterRateMsvDay: number; // 0.5 to 25.0
  speActive: boolean;
  cabinO2Pct: number; // 16.0 to 21.0
  cabinCo2MmHg: number; // 0.5 to 8.0
  missionDay: number; // 1 to 180
  exerciseCompliancePct: number; // 0 to 100
  metabolicWorkloadWatts: number; // 150 to 550
  lcvgCoolingEfficiencyPct: number; // 20 to 100
  sleepDurationHours: number; // 3.5 to 8.5
}

const DEFAULT_HAZARDS: HazardState = {
  dosimeterRateMsvDay: 0.6, // Nominal ISS baseline
  speActive: false,
  cabinO2Pct: 20.9,
  cabinCo2MmHg: 1.5,
  missionDay: 42,
  exerciseCompliancePct: 95,
  metabolicWorkloadWatts: 200,
  lcvgCoolingEfficiencyPct: 95,
  sleepDurationHours: 7.8,
};

export const HazardSimulatorPage = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut,
  backendMode = 'OFFLINE_DEMO_FALLBACK',
}: HazardSimulatorPageProps) => {
  const [hazards, setHazards] = useState<HazardState>(DEFAULT_HAZARDS);
  const [selectedOrgan, setSelectedOrgan] = useState<OrganSystemKey>('cardiovascular');
  const [activePreset, setActivePreset] = useState<string>('Nominal Transit');
  const [isSimulatingBackend, setIsSimulatingBackend] = useState<boolean>(false);
  const [backendFeedback, setBackendFeedback] = useState<{ message: string; isPending?: boolean } | null>(null);

  // Active astronaut (fallback to primary DB seed astro_03 if present)
  const currentAstronaut = useMemo(() => {
    return (
      crew.find((a) => a.id === selectedAstronautId) ||
      crew.find((a) => a.id === 'astro_03') ||
      crew[0]
    );
  }, [crew, selectedAstronautId]);

  // Extract astronaut baseline vitals
  const baseline = useMemo(() => {
    return {
      heartRate: currentAstronaut.baseline_heart_rate ?? currentAstronaut.baseline.restingHeartRate ?? 72,
      systolicBP: currentAstronaut.baseline_systolic_bp ?? currentAstronaut.baseline.restingSystolicBP ?? 120,
      diastolicBP: currentAstronaut.baseline_diastolic_bp ?? currentAstronaut.baseline.restingDiastolicBP ?? 78,
      spo2: currentAstronaut.baseline_spo2 ?? currentAstronaut.baseline.baselineSpO2 ?? 98.2,
      coreTemp: currentAstronaut.baseline_body_temperature ?? currentAstronaut.baseline_temperature ?? currentAstronaut.baseline.baselineCoreTemp ?? 36.8,
      respirationRate: currentAstronaut.baseline_respiration_rate ?? 15,
    };
  }, [currentAstronaut]);

  // Real-Time Coupled Physiological Response Engine
  const simulatedVitals = useMemo(() => {
    // 1. Radiation / SPE effect
    // SPE causes acute inflammatory reaction: temperature rise, mild resting tachycardia, oxidative stress
    const radDose = hazards.dosimeterRateMsvDay + (hazards.speActive ? 18.0 : 0.0);
    const radTempDelta = (radDose / 25.0) * 0.9;
    const radHrDelta = (radDose / 25.0) * 12;

    // 2. Cabin Atmosphere (ECLSS) effect
    // Hypoxia (O2 < 20.9%) drops SpO2 and raises RR + HR
    const o2Deficit = Math.max(0, 20.9 - hazards.cabinO2Pct);
    const spo2O2Drop = o2Deficit * 3.2; // down to ~82% at 16% O2
    const rrO2Rise = o2Deficit * 2.5;
    const hrO2Rise = o2Deficit * 5.0;

    // Hypercapnia (CO2 > 2.0 mmHg) triggers deep hyperventilation, SpO2 reduction, HR elevation, BP rise
    const co2Excess = Math.max(0, hazards.cabinCo2MmHg - 2.0);
    const rrCo2Rise = co2Excess * 2.2;
    const hrCo2Rise = co2Excess * 3.5;
    const bpSysCo2Rise = co2Excess * 3.0;
    const spo2Co2Drop = co2Excess * 0.8;

    // 3. Microgravity + Countermeasure (ARED/CEVIS) effect
    // Long mission + low compliance -> blood volume shift & deconditioning (hypotension with compensatory tachycardia)
    const deconditioningFactor = (hazards.missionDay / 180.0) * (1 - hazards.exerciseCompliancePct / 100.0);
    const bpDeconditioningDrop = deconditioningFactor * 24.0; // systolic drops
    const bpDiaDeconditioningDrop = deconditioningFactor * 16.0;
    const hrDeconditioningComp = deconditioningFactor * 18.0;

    // 4. EVA / Suit Thermal Load effect
    // High workload + Low LCVG cooling efficiency -> heat accumulation
    const thermalStressIndex = (hazards.metabolicWorkloadWatts / 550.0) * (1 - hazards.lcvgCoolingEfficiencyPct / 100.0);
    const evaTempRise = thermalStressIndex * 2.2; // Core temp up to +2.2°C
    const evaHrRise = thermalStressIndex * 38.0; // Heat strain tachycardia
    const evaRrRise = thermalStressIndex * 6.0;

    // 5. Sleep & Circadian Deficit effect
    const sleepDeficit = Math.max(0, 8.0 - hazards.sleepDurationHours);
    const sleepHrRise = sleepDeficit * 2.2;
    const sleepSysRise = sleepDeficit * 2.5;

    // Aggregate simulated readings
    const heartRate = Math.round(
      baseline.heartRate +
      radHrDelta +
      hrO2Rise +
      hrCo2Rise +
      hrDeconditioningComp +
      evaHrRise +
      sleepHrRise
    );

    const systolicBP = Math.round(
      Math.max(75, baseline.systolicBP - bpDeconditioningDrop + bpSysCo2Rise + sleepSysRise)
    );

    const diastolicBP = Math.round(
      Math.max(48, baseline.diastolicBP - bpDiaDeconditioningDrop + (bpSysCo2Rise * 0.4))
    );

    const spo2 = Number(
      Math.min(100, Math.max(78, baseline.spo2 - spo2O2Drop - spo2Co2Drop)).toFixed(1)
    );

    const coreTemp = Number(
      (baseline.coreTemp + radTempDelta + evaTempRise).toFixed(1)
    );

    const respirationRate = Math.round(
      baseline.respirationRate + rrO2Rise + rrCo2Rise + evaRrRise
    );

    // Identify dominant pattern for backend mapping
    let dominantPattern: SimulatedPattern = 'NORMAL';
    if (spo2 < 93.0 || hazards.cabinO2Pct < 18.5) {
      dominantPattern = 'HYPOXIA';
    } else if (coreTemp >= 38.0 || evaTempRise > 0.8) {
      dominantPattern = 'THERMAL_STRAIN';
    } else if (heartRate > 115) {
      dominantPattern = 'ACUTE_TACHYCARDIA';
    } else if (bpDeconditioningDrop > 12.0 || systolicBP < 100) {
      dominantPattern = 'HYPOTENSION_DECONDITIONING';
    }

    return {
      heartRate,
      systolicBP,
      diastolicBP,
      spo2,
      coreTemp,
      respirationRate,
      dominantPattern,
      radDoseTotal: Number(radDose.toFixed(1)),
      oxidativeStressIndex: Math.min(100, Math.round((radDose / 35.0) * 100)),
      deltas: {
        hr: heartRate - baseline.heartRate,
        sys: systolicBP - baseline.systolicBP,
        dia: diastolicBP - baseline.diastolicBP,
        spo2: Number((spo2 - baseline.spo2).toFixed(1)),
        temp: Number((coreTemp - baseline.coreTemp).toFixed(1)),
        rr: respirationRate - baseline.respirationRate,
      },
    };
  }, [hazards, baseline]);

  // Generate 60-Minute Trajectory Projection Chart points
  const trajectoryPoints = useMemo(() => {
    const points = [];
    for (let m = 0; m <= 60; m += 5) {
      const progress = m / 60;
      // Exponential or sinusoidal ramp toward steady state
      const hr = Math.round(baseline.heartRate + simulatedVitals.deltas.hr * (1 - Math.exp(-progress * 3.5)));
      const spo2 = Number((baseline.spo2 + simulatedVitals.deltas.spo2 * (1 - Math.exp(-progress * 4.0))).toFixed(1));
      const sys = Math.round(baseline.systolicBP + simulatedVitals.deltas.sys * (1 - Math.exp(-progress * 3.0)));
      const temp = Number((baseline.coreTemp + simulatedVitals.deltas.temp * (1 - Math.exp(-progress * 2.5))).toFixed(1));
      const rr = Math.round(baseline.respirationRate + simulatedVitals.deltas.rr * (1 - Math.exp(-progress * 3.5)));

      points.push({
        minute: `${m}m`,
        heartRate: hr,
        spo2,
        systolicBP: sys,
        coreTemp: temp,
        respiratoryRate: rr,
      });
    }
    return points;
  }, [baseline, simulatedVitals]);

  // Presets mapping
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    switch (presetName) {
      case 'Nominal Transit':
        setHazards(DEFAULT_HAZARDS);
        break;
      case 'Solar Flare (SPE) Alert':
        setHazards({
          ...DEFAULT_HAZARDS,
          dosimeterRateMsvDay: 18.5,
          speActive: true,
          sleepDurationHours: 6.2,
        });
        break;
      case 'ECLSS CO2 Degradation':
        setHazards({
          ...DEFAULT_HAZARDS,
          cabinCo2MmHg: 6.5,
          cabinO2Pct: 18.2,
        });
        break;
      case 'EVA Cooling Loop Failure':
        setHazards({
          ...DEFAULT_HAZARDS,
          metabolicWorkloadWatts: 480,
          lcvgCoolingEfficiencyPct: 25,
        });
        break;
      case 'Microgravity Deconditioning':
        setHazards({
          ...DEFAULT_HAZARDS,
          missionDay: 140,
          exerciseCompliancePct: 20,
          sleepDurationHours: 5.5,
        });
        break;
      default:
        break;
    }
  };

  // Organ system data for the interactive SVG map
  const organSystemDetails = useMemo(() => {
    // Cardiovascular
    const isCardioCritical = simulatedVitals.heartRate > 120 || simulatedVitals.systolicBP < 95;
    const isCardioCaution = simulatedVitals.heartRate > 95 || simulatedVitals.systolicBP < 105 || simulatedVitals.deltas.sys > 15;
    const cardioStatus: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isCardioCritical ? 'CRITICAL' : isCardioCaution ? 'CAUTION' : 'NOMINAL';

    // Pulmonary
    const isPulmCritical = simulatedVitals.spo2 < 90.0 || simulatedVitals.respirationRate > 24;
    const isPulmCaution = simulatedVitals.spo2 < 95.0 || simulatedVitals.respirationRate > 18;
    const pulmStatus: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isPulmCritical ? 'CRITICAL' : isPulmCaution ? 'CAUTION' : 'NOMINAL';

    // Thermoregulatory
    const isThermoCritical = simulatedVitals.coreTemp >= 38.5;
    const isThermoCaution = simulatedVitals.coreTemp >= 37.5;
    const thermoStatus: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isThermoCritical ? 'CRITICAL' : isThermoCaution ? 'CAUTION' : 'NOMINAL';

    // Cellular / Radiation
    const isCellCritical = hazards.speActive || hazards.dosimeterRateMsvDay > 15.0;
    const isCellCaution = hazards.dosimeterRateMsvDay > 3.0;
    const cellStatus: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isCellCritical ? 'CRITICAL' : isCellCaution ? 'CAUTION' : 'NOMINAL';

    // Neuro / Vestibular
    const isNeuroCritical = hazards.cabinCo2MmHg >= 6.0 || hazards.sleepDurationHours < 4.5;
    const isNeuroCaution = hazards.cabinCo2MmHg >= 3.0 || hazards.sleepDurationHours < 6.5;
    const neuroStatus: 'NOMINAL' | 'CAUTION' | 'CRITICAL' = isNeuroCritical ? 'CRITICAL' : isNeuroCaution ? 'CAUTION' : 'NOMINAL';

    return {
      cardiovascular: {
        title: 'Cardiovascular & Hemodynamic System',
        status: cardioStatus,
        vitalsSummary: `HR: ${simulatedVitals.heartRate} bpm (${simulatedVitals.deltas.hr >= 0 ? `+${simulatedVitals.deltas.hr}` : simulatedVitals.deltas.hr}) • BP: ${simulatedVitals.systolicBP}/${simulatedVitals.diastolicBP} mmHg`,
        pathophysiology: 'Cephalad fluid shift combined with arterial baroreceptor reset. Reduced total circulating plasma volume induces orthostatic vulnerability and compensatory tachycardia.',
        countermeasure: 'NASA-STD-3001 §6.2.3: Prescribe 1.0L oral isotonic sodium-electrolyte fluid loading. Increase ARED resistive squat cadence by 15% to maintain lower-limb vascular tone.',
      },
      pulmonary: {
        title: 'Pulmonary Gas Exchange & Ventilation',
        status: pulmStatus,
        vitalsSummary: `SpO2: ${simulatedVitals.spo2}% (${simulatedVitals.deltas.spo2 >= 0 ? `+${simulatedVitals.deltas.spo2}` : simulatedVitals.deltas.spo2}%) • RR: ${simulatedVitals.respirationRate} br/min`,
        pathophysiology: 'Cabin ambient partial pressure drop below alveolar ventilation gradient. Respiratory center hyperventilation triggered by medullary chemoreceptors.',
        countermeasure: 'NASA-STD-3001 §6.1.1: Verify ECLSS Nitrogen/Oxygen recharge valve manifold. Deploy portable emergency O2 mask if SpO2 drops below 94.0%.',
      },
      thermo: {
        title: 'Thermoregulation & Metabolic Dissipation',
        status: thermoStatus,
        vitalsSummary: `Core Temp: ${simulatedVitals.coreTemp}°C (${simulatedVitals.deltas.temp >= 0 ? `+${simulatedVitals.deltas.temp}` : simulatedVitals.deltas.temp}°C) • Workload: ${hazards.metabolicWorkloadWatts}W`,
        pathophysiology: 'Impaired convective suit heat rejection. Sweat unable to evaporate in microgravity micro-layer, driving heat storage and heat-exhaustion tachycardia.',
        countermeasure: 'NASA-STD-3001 §7.3.2: Immediate LCVG chiller bypass valve cycle. Reduce EVA metabolic pace below 250W. Open secondary sublimator ice-pack loop.',
      },
      cellular: {
        title: 'Cellular DNA & Radiation Biophysics',
        status: cellStatus,
        vitalsSummary: `Dose Rate: ${simulatedVitals.radDoseTotal} mSv/day • Oxidative Stress Index: ${simulatedVitals.oxidativeStressIndex}/100`,
        pathophysiology: 'Ionizing energetic proton and HZE track traversal causing clustered DNA double-strand breaks (DSBs), microvascular endothelial inflammation, and oxidative stress.',
        countermeasure: 'NASA-STD-3001 §6.8: Maintain crew in water-wall shielded Service Module Storm Shelter. Administer antioxidant oral countermeasure per flight surgeon directive.',
      },
      neuro: {
        title: 'Neuro-Vestibular & Circadian Alignment',
        status: neuroStatus,
        vitalsSummary: `Sleep: ${hazards.sleepDurationHours}h • Cabin CO2: ${hazards.cabinCo2MmHg} mmHg`,
        pathophysiology: 'CO2-induced cerebral vasodilation produces frontal cephalalgia. Circadian rhythm desynchrony impairs prefrontal cortex cognitive performance.',
        countermeasure: 'NASA-STD-3001 §7.1: Replace ECLSS CDRA lithium-hydroxide scrubber canister. Institute blue-depleted 2700K lighting with 45-min tactical sleep window.',
      },
    };
  }, [simulatedVitals, hazards]);

  // Send Scenario to Backend SQLite button
  const handleSendToBackend = async () => {
    setIsSimulatingBackend(true);
    setBackendFeedback(null);

    try {
      const res = await spacecareApi.simulateTelemetry({
        astronaut_id: currentAstronaut.id,
        pattern: simulatedVitals.dominantPattern,
        count: 50,
        interval_seconds: 10,
      });

      if (res.mode === 'LIVE_API') {
        setBackendFeedback({
          message: `Success: Generated 50 ${simulatedVitals.dominantPattern} telemetry readings into SQLite for ${currentAstronaut.name}.`,
          isPending: false,
        });
      } else {
        setBackendFeedback({
          message: `[Preview Mode] Simulation mapped to nearest backend pattern: ${simulatedVitals.dominantPattern} (Count: 50). Route POST /api/v1/telemetry/simulate is pending backend mount.`,
          isPending: true,
        });
      }
    } catch {
      setBackendFeedback({
        message: 'Could not connect to backend simulation endpoint.',
        isPending: true,
      });
    } finally {
      setIsSimulatingBackend(false);
    }
  };

  const getStatusBadge = (status: 'NOMINAL' | 'CAUTION' | 'CRITICAL') => {
    switch (status) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-space-red-muted text-space-red border border-space-red/40 animate-pulse">
            <ShieldAlert className="w-3 h-3" /> CRITICAL
          </span>
        );
      case 'CAUTION':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-amber-muted text-space-amber border border-space-amber/40">
            <AlertTriangle className="w-3 h-3" /> CAUTION
          </span>
        );
      case 'NOMINAL':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
            <ShieldCheck className="w-3 h-3" /> NOMINAL
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0B3D91]/25 text-sky-400 border border-[#1A56DB]/40 mb-2 tabular-nums">
            <Flame className="w-3.5 h-3.5 text-sky-400" />
            NASA-STD-3001 Operational Hazard & Physiology Lab
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span>Spaceflight Hazard Simulator</span>
            <span className="text-xs font-mono tabular-nums font-normal px-2.5 py-0.5 rounded bg-black/40 border border-white/[0.08] text-slate-400">
              Interactive Coupled Biometrics Model
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-variable spaceflight stress simulation calibrated against NASA Human Research Program clinical thresholds.
          </p>
        </div>

        {/* Crew Switcher & Preset Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Target Astronaut selector */}
          <div className="flex items-center gap-2 bg-space-panel border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-slate-400 hidden sm:inline font-mono">Subject:</span>
            <select
              value={selectedAstronautId}
              onChange={(e) => onSelectAstronaut(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer text-xs"
            >
              {crew.map((member) => (
                <option key={member.id} value={member.id} className="bg-[#0c1220] text-white">
                  {member.name} ({member.id})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => applyPreset('Nominal Transit')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
            <span>Reset Sliders</span>
          </button>
        </div>
      </div>

      {/* Emergency Preset Quick Selectors */}
      <div className="bg-space-panel border border-white/[0.08] rounded-xl p-3.5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>NASA Mission Scenarios:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            'Nominal Transit',
            'Solar Flare (SPE) Alert',
            'ECLSS CO2 Degradation',
            'EVA Cooling Loop Failure',
            'Microgravity Deconditioning',
          ].map((preset) => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className={`px-3 py-1.5 rounded-lg font-mono tabular-nums text-[11px] transition border ${
                activePreset === preset
                  ? 'bg-[#0B3D91] text-white border-[#1A56DB] font-bold shadow-md shadow-[#0B3D91]/30'
                  : 'bg-black/30 text-slate-400 border-white/[0.08] hover:text-white hover:border-white/[0.18]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Hazard Controls Panel (5 Columns) */}
        <div className="xl:col-span-5 space-y-4">
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-space-cyan" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-space-text">
                  Spaceflight Hazard Ingestion
                </h2>
              </div>
              <span className="text-[10px] font-mono text-space-dim">5 NASA-STD-3001 Hazards</span>
            </div>

            {/* 1. Space Radiation Environment */}
            <div className="space-y-2 bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-space-text flex items-center gap-1.5">
                  <Sun className="w-3.5 h-3.5 text-space-amber" />
                  1. Deep Space Radiation & SPE
                </span>
                <span className="text-xs font-mono font-bold text-space-amber">
                  {hazards.dosimeterRateMsvDay} mSv/day
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="25.0"
                step="0.5"
                value={hazards.dosimeterRateMsvDay}
                onChange={(e) => {
                  setHazards({ ...hazards, dosimeterRateMsvDay: Number(e.target.value) });
                  setActivePreset('Custom');
                }}
                className="w-full accent-space-amber cursor-pointer h-1.5 bg-space-border rounded-lg"
              />
              <div className="flex items-center justify-between text-[10px] font-mono text-space-dim">
                <span>ISS: 0.6 mSv/d</span>
                <span>Lunar Transit: 1.5 mSv/d</span>
                <span>SPE Peak: 25.0 mSv/d</span>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-space-border/40">
                <span className="text-[11px] text-space-muted">Trigger Solar Particle Event (SPE):</span>
                <button
                  onClick={() => {
                    setHazards({ ...hazards, speActive: !hazards.speActive });
                    setActivePreset('Custom');
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition border ${
                    hazards.speActive
                      ? 'bg-space-red text-white border-space-red animate-pulse'
                      : 'bg-space-panel text-space-dim border-space-border hover:text-space-text'
                  }`}
                >
                  {hazards.speActive ? 'SPE ACTIVE (FLUX SPIKE)' : 'SPE STANDBY'}
                </button>
              </div>
            </div>

            {/* 2. Cabin Atmosphere (ECLSS) */}
            <div className="space-y-3 bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5">
              <div className="text-xs font-bold text-space-text flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-space-cyan" />
                2. Cabin Atmosphere & Life Support (ECLSS)
              </div>
              {/* O2 Concentration */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">Cabin O2 Concentration:</span>
                  <span className={`font-mono font-bold ${hazards.cabinO2Pct < 18.5 ? 'text-space-red' : 'text-space-cyan'}`}>
                    {hazards.cabinO2Pct}% (Norm: 20.9%)
                  </span>
                </div>
                <input
                  type="range"
                  min="16.0"
                  max="21.0"
                  step="0.1"
                  value={hazards.cabinO2Pct}
                  onChange={(e) => {
                    setHazards({ ...hazards, cabinO2Pct: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-cyan cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
              {/* CO2 Partial Pressure */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">Cabin CO2 Partial Pressure:</span>
                  <span className={`font-mono font-bold ${hazards.cabinCo2MmHg > 3.0 ? 'text-space-amber' : 'text-space-emerald'}`}>
                    {hazards.cabinCo2MmHg} mmHg (Limit: &lt;2.0)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8.0"
                  step="0.5"
                  value={hazards.cabinCo2MmHg}
                  onChange={(e) => {
                    setHazards({ ...hazards, cabinCo2MmHg: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-amber cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
            </div>

            {/* 3. Microgravity & Countermeasure */}
            <div className="space-y-3 bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5">
              <div className="text-xs font-bold text-space-text flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-space-emerald" />
                3. Microgravity & Exercise Countermeasures
              </div>
              {/* Mission Duration */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">Microgravity Exposure:</span>
                  <span className="font-mono font-bold text-space-text">
                    Day {hazards.missionDay} / 180
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="180"
                  step="1"
                  value={hazards.missionDay}
                  onChange={(e) => {
                    setHazards({ ...hazards, missionDay: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-emerald cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
              {/* Exercise Compliance */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">ARED/CEVIS Countermeasure Adherence:</span>
                  <span className={`font-mono font-bold ${hazards.exerciseCompliancePct < 60 ? 'text-space-red' : 'text-space-emerald'}`}>
                    {hazards.exerciseCompliancePct}% (NASA: 100%)
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={hazards.exerciseCompliancePct}
                  onChange={(e) => {
                    setHazards({ ...hazards, exerciseCompliancePct: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-emerald cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
            </div>

            {/* 4. EVA Thermal & Workload Load */}
            <div className="space-y-3 bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5">
              <div className="text-xs font-bold text-space-text flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-space-red" />
                4. Spacewalk (EVA) Metabolic & Suit Cooling
              </div>
              {/* Metabolic Workload */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">Metabolic Heat Generation:</span>
                  <span className="font-mono font-bold text-space-red">
                    {hazards.metabolicWorkloadWatts} Watts ({hazards.metabolicWorkloadWatts > 400 ? 'Heavy EVA' : 'Nominal Work'})
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="550"
                  step="25"
                  value={hazards.metabolicWorkloadWatts}
                  onChange={(e) => {
                    setHazards({ ...hazards, metabolicWorkloadWatts: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-red cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
              {/* LCVG Cooling */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-space-muted">LCVG Suit Cooling Efficiency:</span>
                  <span className={`font-mono font-bold ${hazards.lcvgCoolingEfficiencyPct < 50 ? 'text-space-red' : 'text-space-cyan'}`}>
                    {hazards.lcvgCoolingEfficiencyPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  step="5"
                  value={hazards.lcvgCoolingEfficiencyPct}
                  onChange={(e) => {
                    setHazards({ ...hazards, lcvgCoolingEfficiencyPct: Number(e.target.value) });
                    setActivePreset('Custom');
                  }}
                  className="w-full accent-space-cyan cursor-pointer h-1.5 bg-space-border rounded-lg"
                />
              </div>
            </div>

            {/* 5. Sleep & Circadian Duration */}
            <div className="space-y-2 bg-space-bg/60 border border-space-border/60 rounded-lg p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-space-text">5. Sleep Opportunity & Circadian Rest</span>
                <span className={`text-xs font-mono font-bold ${hazards.sleepDurationHours < 6.0 ? 'text-space-amber' : 'text-space-text'}`}>
                  {hazards.sleepDurationHours} hrs / 24h
                </span>
              </div>
              <input
                type="range"
                min="3.5"
                max="8.5"
                step="0.5"
                value={hazards.sleepDurationHours}
                onChange={(e) => {
                  setHazards({ ...hazards, sleepDurationHours: Number(e.target.value) });
                  setActivePreset('Custom');
                }}
                className="w-full accent-space-cyan cursor-pointer h-1.5 bg-space-border rounded-lg"
              />
              <div className="flex justify-between text-[10px] font-mono text-space-dim">
                <span>Severe Deprivation (3.5h)</span>
                <span>NASA Baseline (8.0h)</span>
              </div>
            </div>
          </div>

          {/* Sync to Backend Button */}
          <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 shadow-lg space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-mono">Backend Synchronization:</span>
              <span className="px-2 py-0.5 rounded bg-black/40 text-sky-300 font-mono tabular-nums text-[11px] border border-[#1A56DB]/40">
                Pattern: {simulatedVitals.dominantPattern} &bull; {backendMode}
              </span>
            </div>
            <button
              onClick={handleSendToBackend}
              disabled={isSimulatingBackend}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#0B3D91] hover:bg-[#1A56DB] text-white font-bold transition shadow-sm disabled:opacity-50 text-xs"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>
                {isSimulatingBackend ? 'Injecting Telemetry...' : 'Send Scenario to Backend SQLite'}
              </span>
            </button>
            {backendFeedback && (
              <div
                className={`p-2.5 rounded-lg text-[11px] font-mono tabular-nums border flex items-start gap-2 ${
                  backendFeedback.isPending
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                }`}
              >
                {backendFeedback.isPending ? (
                  <CloudOff className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                )}
                <span>{backendFeedback.message}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 font-mono text-center">
              Provenance: SYNTHETIC_SIMULATED &bull; Calibrated with SQLite Baselines
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Biometrics, Organ Map & Trajectory Projection (7 Columns) */}
        <div className="xl:col-span-7 space-y-5">
          {/* Real-Time Live Vital Deltas Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Heart Rate */}
            <div className="bg-space-panel border border-white/[0.08] rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-mono tabular-nums text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5 text-[#FC3D21]" /> Heart Rate
                </span>
                <span className="text-slate-400">Norm: {baseline.heartRate}</span>
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {simulatedVitals.heartRate} <span className="text-xs font-normal text-slate-400 font-mono">bpm</span>
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded ${
                    simulatedVitals.deltas.hr > 15
                      ? 'bg-[#FC3D21]/15 text-[#FC3D21]'
                      : simulatedVitals.deltas.hr > 5
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-black/30 text-slate-400'
                  }`}
                >
                  {simulatedVitals.deltas.hr >= 0 ? `+${simulatedVitals.deltas.hr}` : simulatedVitals.deltas.hr}
                </span>
              </div>
            </div>

            {/* Blood Pressure */}
            <div className="bg-space-panel border border-white/[0.08] rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-mono tabular-nums text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" /> Arterial BP
                </span>
                <span className="text-slate-400">Norm: {baseline.systolicBP}/{baseline.diastolicBP}</span>
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {simulatedVitals.systolicBP}/{simulatedVitals.diastolicBP}
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded ${
                    simulatedVitals.deltas.sys < -15
                      ? 'bg-[#FC3D21]/15 text-[#FC3D21]'
                      : simulatedVitals.deltas.sys > 15
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-black/30 text-slate-400'
                  }`}
                >
                  {simulatedVitals.deltas.sys >= 0 ? `+${simulatedVitals.deltas.sys}` : simulatedVitals.deltas.sys}
                </span>
              </div>
            </div>

            {/* SpO2 */}
            <div className="bg-space-panel border border-white/[0.08] rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-mono tabular-nums text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-sky-400" /> SpO2 Saturation
                </span>
                <span className="text-slate-400">Norm: {baseline.spo2}%</span>
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {simulatedVitals.spo2}%
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded ${
                    simulatedVitals.deltas.spo2 < -3.0
                      ? 'bg-[#FC3D21]/15 text-[#FC3D21]'
                      : simulatedVitals.deltas.spo2 < -1.0
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-black/30 text-slate-400'
                  }`}
                >
                  {simulatedVitals.deltas.spo2 >= 0 ? `+${simulatedVitals.deltas.spo2}%` : `${simulatedVitals.deltas.spo2}%`}
                </span>
              </div>
            </div>

            {/* Core Temperature */}
            <div className="bg-space-panel border border-white/[0.08] rounded-xl p-3.5 flex flex-col justify-between shadow-lg">
              <span className="text-[10px] font-mono tabular-nums text-slate-400 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-emerald-400" /> Core Temp
                </span>
                <span className="text-slate-400">Norm: {baseline.coreTemp}°C</span>
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono tabular-nums text-white">
                  {simulatedVitals.coreTemp}°C
                </span>
                <span
                  className={`text-xs font-mono tabular-nums font-bold px-1.5 py-0.5 rounded ${
                    simulatedVitals.deltas.temp > 1.0
                      ? 'bg-[#FC3D21]/15 text-[#FC3D21]'
                      : simulatedVitals.deltas.temp > 0.4
                      ? 'bg-amber-500/15 text-amber-300'
                      : 'bg-black/30 text-slate-400'
                  }`}
                >
                  {simulatedVitals.deltas.temp >= 0 ? `+${simulatedVitals.deltas.temp}°C` : `${simulatedVitals.deltas.temp}°C`}
                </span>
              </div>
            </div>

            {/* Respiration Rate */}
            <div className="bg-space-panel border border-space-border rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-space-dim uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-space-cyan" /> Respiration Rate
                </span>
                <span className="text-space-dim">Norm: {baseline.respirationRate}</span>
              </span>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-xl font-bold font-mono text-space-text">
                  {simulatedVitals.respirationRate} <span className="text-xs font-normal text-space-dim">br/m</span>
                </span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    simulatedVitals.deltas.rr > 5
                      ? 'bg-space-amber-muted text-space-amber'
                      : 'bg-space-bg text-space-dim'
                  }`}
                >
                  {simulatedVitals.deltas.rr >= 0 ? `+${simulatedVitals.deltas.rr}` : simulatedVitals.deltas.rr}
                </span>
              </div>
            </div>

            {/* Dominated Risk Pattern */}
            <div className="bg-space-panel border border-space-border rounded-xl p-3.5 flex flex-col justify-between">
              <span className="text-[10px] font-mono text-space-dim uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5 text-space-cyan" /> Clinical Trigger
                </span>
                <span className="text-space-dim">Algorithmic</span>
              </span>
              <div className="mt-2">
                <span className="text-xs font-mono font-bold px-2 py-1 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 inline-block truncate max-w-full">
                  {simulatedVitals.dominantPattern}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive SVG Astronaut Body System Map */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-space-text flex items-center gap-2">
                  <Crosshair className="w-4 h-4 text-space-cyan" />
                  Interactive Human Body System Map
                </h3>
                <p className="text-xs text-space-dim">
                  Click any organ system to inspect physiological impact and NASA-STD-3001 evidence countermeasures.
                </p>
              </div>
              <span className="text-xs font-mono text-space-dim hidden sm:inline">Active Target: {currentAstronaut.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              {/* SVG Anatomical Human System Map */}
              <div className="md:col-span-5 flex justify-center py-2">
                <div className="relative w-48 h-72 bg-space-bg/80 border border-space-border/80 rounded-2xl p-2 flex items-center justify-center shadow-inner">
                  <svg
                    viewBox="0 0 200 300"
                    className="w-full h-full text-space-dim"
                    fill="none"
                    stroke="currentColor"
                  >
                    {/* Head / Neuro-vestibular */}
                    <circle
                      cx="100"
                      cy="40"
                      r="22"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('neuro')}
                      className={`cursor-pointer transition-all ${
                        selectedOrgan === 'neuro'
                          ? 'fill-space-cyan/30 stroke-space-cyan stroke-[3px]'
                          : organSystemDetails.neuro.status === 'CRITICAL'
                          ? 'fill-space-red/20 stroke-space-red'
                          : organSystemDetails.neuro.status === 'CAUTION'
                          ? 'fill-space-amber/20 stroke-space-amber'
                          : 'fill-space-panel/60 stroke-space-border hover:stroke-space-cyan'
                      }`}
                    />
                    {/* Neck */}
                    <line x1="100" y1="62" x2="100" y2="75" strokeWidth="3" stroke="#1E2D4A" />

                    {/* Pulmonary (Lungs) */}
                    <ellipse
                      cx="82"
                      cy="105"
                      rx="14"
                      ry="22"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('pulmonary')}
                      className={`cursor-pointer transition-all ${
                        selectedOrgan === 'pulmonary'
                          ? 'fill-space-cyan/30 stroke-space-cyan stroke-[3px]'
                          : organSystemDetails.pulmonary.status === 'CRITICAL'
                          ? 'fill-space-red/20 stroke-space-red'
                          : organSystemDetails.pulmonary.status === 'CAUTION'
                          ? 'fill-space-amber/20 stroke-space-amber'
                          : 'fill-space-panel/60 stroke-space-border hover:stroke-space-cyan'
                      }`}
                    />
                    <ellipse
                      cx="118"
                      cy="105"
                      rx="14"
                      ry="22"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('pulmonary')}
                      className={`cursor-pointer transition-all ${
                        selectedOrgan === 'pulmonary'
                          ? 'fill-space-cyan/30 stroke-space-cyan stroke-[3px]'
                          : organSystemDetails.pulmonary.status === 'CRITICAL'
                          ? 'fill-space-red/20 stroke-space-red'
                          : organSystemDetails.pulmonary.status === 'CAUTION'
                          ? 'fill-space-amber/20 stroke-space-amber'
                          : 'fill-space-panel/60 stroke-space-border hover:stroke-space-cyan'
                      }`}
                    />

                    {/* Cardiovascular (Heart / Thorax) */}
                    <circle
                      cx="96"
                      cy="108"
                      r="10"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('cardiovascular')}
                      className={`cursor-pointer transition-all animate-pulse ${
                        selectedOrgan === 'cardiovascular'
                          ? 'fill-space-red/40 stroke-space-red stroke-[3px]'
                          : organSystemDetails.cardiovascular.status === 'CRITICAL'
                          ? 'fill-space-red/30 stroke-space-red'
                          : organSystemDetails.cardiovascular.status === 'CAUTION'
                          ? 'fill-space-amber/30 stroke-space-amber'
                          : 'fill-space-panel/80 stroke-space-red hover:stroke-space-red'
                      }`}
                    />

                    {/* Thermoregulation / Core Trunk */}
                    <rect
                      x="78"
                      y="135"
                      width="44"
                      height="45"
                      rx="8"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('thermo')}
                      className={`cursor-pointer transition-all ${
                        selectedOrgan === 'thermo'
                          ? 'fill-space-cyan/30 stroke-space-cyan stroke-[3px]'
                          : organSystemDetails.thermo.status === 'CRITICAL'
                          ? 'fill-space-red/20 stroke-space-red'
                          : organSystemDetails.thermo.status === 'CAUTION'
                          ? 'fill-space-amber/20 stroke-space-amber'
                          : 'fill-space-panel/60 stroke-space-border hover:stroke-space-cyan'
                      }`}
                    />

                    {/* Cellular & Hematologic / Extremities */}
                    {/* Arms */}
                    <line x1="68" y1="85" x2="42" y2="155" strokeWidth="6" strokeLinecap="round" stroke="#1E2D4A" />
                    <line x1="132" y1="85" x2="158" y2="155" strokeWidth="6" strokeLinecap="round" stroke="#1E2D4A" />

                    {/* Legs / Bone Mineral */}
                    <line x1="88" y1="180" x2="82" y2="275" strokeWidth="8" strokeLinecap="round" stroke="#1E2D4A" />
                    <line x1="112" y1="180" x2="118" y2="275" strokeWidth="8" strokeLinecap="round" stroke="#1E2D4A" />

                    {/* Cellular Icon Hotspot */}
                    <circle
                      cx="100"
                      cy="210"
                      r="14"
                      strokeWidth="2"
                      onClick={() => setSelectedOrgan('cellular')}
                      className={`cursor-pointer transition-all ${
                        selectedOrgan === 'cellular'
                          ? 'fill-space-cyan/30 stroke-space-cyan stroke-[3px]'
                          : organSystemDetails.cellular.status === 'CRITICAL'
                          ? 'fill-space-red/20 stroke-space-red'
                          : organSystemDetails.cellular.status === 'CAUTION'
                          ? 'fill-space-amber/20 stroke-space-amber'
                          : 'fill-space-panel/60 stroke-space-border hover:stroke-space-cyan'
                      }`}
                    />
                  </svg>

                  {/* Organ Click Pills Overlay */}
                  <div className="absolute bottom-2 text-[9px] font-mono text-space-dim flex items-center gap-1">
                    <span>Click organs to inspect</span>
                  </div>
                </div>
              </div>

              {/* Organ Deep Dive Card */}
              <div className="md:col-span-7 bg-space-bg/60 border border-space-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase tracking-wider text-space-cyan font-bold">
                      {organSystemDetails[selectedOrgan].title}
                    </span>
                  </div>
                  {getStatusBadge(organSystemDetails[selectedOrgan].status)}
                </div>

                <div className="p-2.5 rounded-lg bg-space-panel border border-space-border font-mono text-xs text-space-text flex items-center justify-between">
                  <span>Current Biometric Status:</span>
                  <span className="text-space-cyan font-bold">{organSystemDetails[selectedOrgan].vitalsSummary}</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-space-amber uppercase block mb-1">
                    Pathophysiological Mechanism:
                  </span>
                  <p className="text-xs text-space-muted leading-relaxed">
                    {organSystemDetails[selectedOrgan].pathophysiology}
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-space-emerald/10 border border-space-emerald/30 text-xs space-y-1">
                  <span className="text-[11px] font-bold text-space-emerald flex items-center gap-1.5 uppercase">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    NASA-STD-3001 Countermeasure Directive:
                  </span>
                  <p className="text-space-text leading-relaxed">
                    {organSystemDetails[selectedOrgan].countermeasure}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 60-Minute Trajectory Projection Chart */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-space-text flex items-center gap-2">
                  <Activity className="w-4 h-4 text-space-cyan" />
                  60-Minute Trajectory Projection
                </h3>
                <p className="text-xs text-space-dim">
                  Forward simulated physiological response toward new homeostatic equilibrium under current hazard settings.
                </p>
              </div>
              <span className="text-xs font-mono text-space-dim">T+0 to T+60 Minutes</span>
            </div>

            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trajectoryPoints} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                  <XAxis dataKey="minute" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[40, 160]} />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
                            <p className="text-sky-400 font-bold mb-1.5">Elapsed: {label}</p>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between gap-4 text-white py-0.5">
                                <span className="text-slate-400 flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                  {entry.name}:
                                </span>
                                <span className="font-semibold">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  {/* NASA Blue Baselines */}
                  <ReferenceLine
                    y={baseline.heartRate}
                    stroke="#3B82F6"
                    strokeDasharray="3 3"
                    label={{ value: `BASE HR (${baseline.heartRate})`, fill: '#3B82F6', fontSize: 9, position: 'insideTopLeft' }}
                  />
                  <ReferenceLine
                    y={baseline.systolicBP}
                    stroke="#3B82F6"
                    strokeDasharray="3 3"
                    label={{ value: `BASE SYS (${baseline.systolicBP})`, fill: '#3B82F6', fontSize: 9, position: 'insideBottomLeft' }}
                  />
                  {/* NASA Vector Red Hypoxia Threshold */}
                  <ReferenceLine
                    y={94}
                    stroke="#FC3D21"
                    strokeDasharray="4 4"
                    label={{ value: 'CRITICAL SPO2 (94%)', fill: '#FC3D21', fontSize: 9, position: 'insideBottomRight' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="heartRate"
                    name="Heart Rate (bpm)"
                    stroke="#FC3D21"
                    strokeWidth={2}
                    dot={(p) => {
                      const { cx, cy, index } = p;
                      if (index === trajectoryPoints.length - 1) {
                        return (
                          <g key={`edge-dot-haz-hr-${index}`}>
                            <circle cx={cx} cy={cy} r={7} fill="#FC3D21" fillOpacity={0.3} />
                            <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke="#FC3D21" strokeWidth={2} />
                          </g>
                        );
                      }
                      return <circle key={`dot-haz-hr-${index}`} cx={cx} cy={cy} r={0} />;
                    }}
                    activeDot={{ r: 4 }}
                  />
                  <Line type="monotone" dataKey="systolicBP" name="Systolic BP (mmHg)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="spo2" name="SpO2 (%)" stroke="#38BDF8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="respiratoryRate" name="Respiration (br/m)" stroke="#10B981" strokeWidth={1.5} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2 border-t border-space-border/60 flex flex-wrap justify-between text-[11px] font-mono text-space-dim">
              <span>Red: Heart Rate (bpm)</span>
              <span>Amber: Systolic BP (mmHg)</span>
              <span>Cyan: SpO2 (%)</span>
              <span>Green: Respiration Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
