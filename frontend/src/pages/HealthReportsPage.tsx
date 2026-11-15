import { useState } from 'react';
import { AstronautProfile, MissionHealthReport } from '../types/spacecare';
import { generateHealthReport } from '../services/mockTelemetry';
import {
  FileText,
  Printer,
  Download,
  Calendar,
  ShieldCheck,
  Heart,
  Activity,
  Bone,
  Sun,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
} from 'lucide-react';

interface HealthReportsPageProps {
  crew: AstronautProfile[];
  selectedAstronautId: string;
  onSelectAstronaut: (id: string) => void;
}

export const HealthReportsPage = ({
  crew,
  selectedAstronautId,
  onSelectAstronaut,
}: HealthReportsPageProps) => {
  const [timeframe, setTimeframe] = useState<'7_DAY_WEEKLY' | 'MISSION_TO_DATE'>('7_DAY_WEEKLY');

  const selectedAstronaut =
    crew.find((c) => c.id === selectedAstronautId) || crew[0];

  const report: MissionHealthReport = generateHealthReport(selectedAstronaut, timeframe);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `spacecare-report-${selectedAstronaut.callsign.toLowerCase()}-${timeframe.toLowerCase()}-${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Report Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <FileText className="w-3.5 h-3.5" />
            Executive Flight Surgeon Medical Dossier
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Astronaut Health Status Report &bull; {selectedAstronaut.name}
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Multi-domain clinical synthesis prepared for mission flight directors and medical support teams.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-panel hover:bg-space-panel-hover border border-space-border text-space-cyan text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export JSON
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-space-cyan text-space-bg hover:bg-space-cyan/90 text-xs font-bold transition shadow"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* Selectors Bar */}
      <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        {/* Astronaut Selector */}
        <div className="flex items-center gap-2">
          <span className="text-space-dim flex items-center gap-1 font-mono">
            <User className="w-3.5 h-3.5" /> Astronaut Focus ({crew.length}):
          </span>
          <select
            value={selectedAstronautId}
            onChange={(e) => onSelectAstronaut(e.target.value)}
            className="bg-space-bg border border-space-border rounded-md px-2.5 py-1 text-xs text-space-text font-semibold focus:outline-none focus:border-space-cyan cursor-pointer"
          >
            {crew.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} ({member.callsign})
              </option>
            ))}
          </select>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center gap-1.5">
          <span className="text-space-dim flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" /> Window:
          </span>
          <button
            onClick={() => setTimeframe('7_DAY_WEEKLY')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              timeframe === '7_DAY_WEEKLY'
                ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/40 font-semibold'
                : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
            }`}
          >
            7-Day Weekly Brief
          </button>
          <button
            onClick={() => setTimeframe('MISSION_TO_DATE')}
            className={`px-3 py-1 rounded-md transition font-medium ${
              timeframe === 'MISSION_TO_DATE'
                ? 'bg-space-cyan-muted text-space-cyan border border-space-cyan/40 font-semibold'
                : 'bg-space-bg text-space-muted border border-space-border hover:text-space-text'
            }`}
          >
            Mission-to-Date (Day 84)
          </button>
        </div>
      </div>

      {/* Main Printable Medical Dossier Document */}
      <div className="bg-space-panel border border-space-border rounded-2xl p-6 lg:p-8 shadow-2xl space-y-6 printable-report">
        {/* Report Document Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-space-border gap-4">
          <div>
            <div className="text-[11px] font-mono text-space-cyan uppercase tracking-widest font-bold">
              SPACECARE BIOMEDICAL DOSSIER &bull; NASA SPACE APPS 2026
            </div>
            <h2 className="text-xl font-extrabold text-space-text mt-1">
              Medical Health Summary & Longitudinal Assessment
            </h2>
            <p className="text-xs text-space-dim mt-0.5 font-mono">
              Subject: {selectedAstronaut.name} &bull; Callsign: {selectedAstronaut.callsign} &bull; ID: {selectedAstronaut.id} &bull; Mission Day {selectedAstronaut.missionDay}
            </p>
          </div>

          <div className="text-right text-xs font-mono text-space-dim space-y-1">
            <div>Generated: {new Date(report.reportGeneratedUtc).toLocaleDateString()} {new Date(report.reportGeneratedUtc).toLocaleTimeString()} UTC</div>
            <div>Classification: <strong className="text-space-cyan">SPACEFLIGHT DEMONSTRATION RECORD</strong></div>
            <div>Status: <span className={selectedAstronaut.status === 'NOMINAL' ? 'text-space-emerald font-bold' : 'text-space-amber font-bold'}>{selectedAstronaut.status}</span></div>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="bg-space-bg/60 border border-space-border/80 rounded-xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-space-cyan text-xs font-bold uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-4 h-4 text-space-cyan" />
            Flight Surgeon Executive Summary
          </div>
          <p className="text-xs text-space-text leading-relaxed font-sans">
            {report.executiveSummary}
          </p>
        </div>

        {/* 6 Clinical Domains Summary Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* Domain 1: Vital Signs */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-red font-semibold text-xs font-mono">
              <Heart className="w-3.5 h-3.5" />
              1. Vital Signs Averages
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Avg Heart Rate:</span>
                <strong className="text-space-text">{report.vitalsSummary.avgHeartRate} bpm</strong>
              </div>
              <div className="flex justify-between">
                <span>Oxygen Saturation:</span>
                <strong className="text-space-text">{report.vitalsSummary.avgSpo2}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Mean Blood Pressure:</span>
                <strong className="text-space-text">{report.vitalsSummary.avgSystolicBP}/{report.vitalsSummary.avgDiastolicBP} mmHg</strong>
              </div>
              <div className="flex justify-between">
                <span>Heart Rate Variability:</span>
                <strong className={report.vitalsSummary.avgHrvRmssd < 30 ? 'text-space-amber' : 'text-space-cyan'}>
                  {report.vitalsSummary.avgHrvRmssd} ms RMSSD
                </strong>
              </div>
            </div>
          </div>

          {/* Domain 2: Cardiovascular Adaptation */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-cyan font-semibold text-xs font-mono">
              <Activity className="w-3.5 h-3.5" />
              2. Cardiovascular Adaptation
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Resting HR Drift:</span>
                <strong className={report.cardiovascularSummary.restingHrDrift > 10 ? 'text-space-amber' : 'text-space-text'}>
                  +{report.cardiovascularSummary.restingHrDrift} bpm
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Mean Arterial Pressure:</span>
                <strong className="text-space-text">{report.cardiovascularSummary.meanArterialPressure} mmHg</strong>
              </div>
              <div className="flex justify-between">
                <span>Orthostatic Index:</span>
                <strong className={report.cardiovascularSummary.orthostaticReadinessScore < 75 ? 'text-space-amber' : 'text-space-cyan'}>
                  {report.cardiovascularSummary.orthostaticReadinessScore} / 100
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Fluid Shift Status:</span>
                <strong className="text-space-text">{report.cardiovascularSummary.status}</strong>
              </div>
            </div>
          </div>

          {/* Domain 3: Musculoskeletal & ARED */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-emerald font-semibold text-xs font-mono">
              <Bone className="w-3.5 h-3.5" />
              3. Musculoskeletal Health
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Femoral Neck BMD:</span>
                <strong className="text-space-text">{report.musculoskeletalSummary.femoralNeckBmdLossPct}% DEXA</strong>
              </div>
              <div className="flex justify-between">
                <span>Lumbar Spine BMD:</span>
                <strong className="text-space-text">{report.musculoskeletalSummary.lumbarSpineBmdLossPct}% DEXA</strong>
              </div>
              <div className="flex justify-between">
                <span>Lower-Limb Muscle:</span>
                <strong className="text-space-text">{report.musculoskeletalSummary.lowerLimbMuscleLossPct}% Volume</strong>
              </div>
              <div className="flex justify-between">
                <span>ARED Prescription:</span>
                <strong className="text-space-emerald">{report.musculoskeletalSummary.aredAdherencePct}% Adherence</strong>
              </div>
            </div>
          </div>

          {/* Domain 4: Radiation Dosimetry */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-amber font-semibold text-xs font-mono">
              <Sun className="w-3.5 h-3.5" />
              4. Space Radiation Accrual
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Period Mission Dose:</span>
                <strong className="text-space-text">{report.radiationSummary.cumulativeMissionDoseMsv} mSv</strong>
              </div>
              <div className="flex justify-between">
                <span>Career Limit Accrual:</span>
                <strong className="text-space-cyan">{report.radiationSummary.careerDosePct}% of 600 mSv</strong>
              </div>
              <div className="flex justify-between">
                <span>Shelter Advisory:</span>
                <strong className="text-space-amber">Active Solar Decay</strong>
              </div>
              <div className="flex justify-between">
                <span>NASA-STD-3001 Compliance:</span>
                <strong className="text-space-emerald">Full In-Bounds</strong>
              </div>
            </div>
          </div>

          {/* Domain 5: Sleep & Psychological */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-cyan font-semibold text-xs font-mono">
              <Brain className="w-3.5 h-3.5" />
              5. Sleep & Mental Health
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Avg Sleep Duration:</span>
                <strong className="text-space-text">{report.behavioralSummary.avgSleepDurationHours} hrs / night</strong>
              </div>
              <div className="flex justify-between">
                <span>Sleep Efficiency:</span>
                <strong className="text-space-text">{report.behavioralSummary.sleepEfficiencyPct}%</strong>
              </div>
              <div className="flex justify-between">
                <span>Circadian Phase Sync:</span>
                <strong className={report.behavioralSummary.circadianScore < 75 ? 'text-space-amber' : 'text-space-cyan'}>
                  {report.behavioralSummary.circadianScore} / 100
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Stress / Taskload Index:</span>
                <strong className="text-space-text">{report.behavioralSummary.stressIndex} / 10</strong>
              </div>
            </div>
          </div>

          {/* Domain 6: AI Anomaly & Active Alerts */}
          <div className="bg-space-bg/50 border border-space-border rounded-xl p-4 space-y-2.5">
            <div className="flex items-center gap-1.5 text-space-amber font-semibold text-xs font-mono">
              <AlertTriangle className="w-3.5 h-3.5" />
              6. Early Warnings & AI Flags
            </div>
            <div className="space-y-1.5 font-mono text-[11px] text-space-muted">
              <div className="flex justify-between">
                <span>Composite Anomaly Score:</span>
                <strong className={selectedAstronaut.aiAnalysis.compositeAnomalyScore >= 0.65 ? 'text-space-amber' : 'text-space-emerald'}>
                  {selectedAstronaut.aiAnalysis.compositeAnomalyScore.toFixed(2)}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Statistical Deviation:</span>
                <strong className="text-space-text">{selectedAstronaut.aiAnalysis.baselineDeviationZScore > 0 ? `+${selectedAstronaut.aiAnalysis.baselineDeviationZScore}` : selectedAstronaut.aiAnalysis.baselineDeviationZScore} &sigma;</strong>
              </div>
              <div className="flex justify-between">
                <span>Unresolved Active Alerts:</span>
                <strong className={report.activeAlertsCount > 0 ? 'text-space-amber font-bold' : 'text-space-emerald'}>
                  {report.activeAlertsCount} Events
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Model Confidence:</span>
                <strong className="text-space-cyan">{Math.round(selectedAstronaut.aiAnalysis.confidenceLevel * 100)}%</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Scientific Context & Regulatory Citation */}
        <div className="pt-4 border-t border-space-border/60 text-xs text-space-dim space-y-2 font-mono">
          <div className="flex items-center gap-1.5 text-space-cyan">
            <Info className="w-3.5 h-3.5" />
            <span>Standards Authority: {report.nasaResearchContext}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-space-muted pt-2 border-t border-space-border/40">
            <span>Flight Surgeon Attestation: <strong className="text-space-text">{report.surgeonSignOff}</strong></span>
            <span>SPACECARE Health Suite &bull; Expedition 75</span>
          </div>
        </div>

        {/* Prototype Disclaimer Banner */}
        <div className="bg-space-bg/80 border border-space-border/80 rounded-xl p-3.5 text-[11px] text-space-dim flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-space-cyan shrink-0" />
          <span>
            <strong>RESEARCH & DEMONSTRATION NOTICE:</strong> SPACECARE is a prototype platform developed for the NASA Space Apps Challenge 2026. All reports, biometrics, and analytics are synthesized demonstrations and do not constitute certified medical diagnosis or operational flight clearance.
          </span>
        </div>
      </div>
    </div>
  );
};
