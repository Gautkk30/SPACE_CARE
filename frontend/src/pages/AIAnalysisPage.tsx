import { useState } from 'react';
import { AstronautProfile } from '../types/spacecare';
import { useTelemetry } from '../context/TelemetryContext';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Cpu,
  Brain,
  ShieldCheck,
  TrendingUp,
  Activity,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface AIAnalysisPageProps {
  selectedAstronaut: AstronautProfile;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const DarkTimelineTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
        <p className="text-sky-400 font-bold mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-white">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const DarkFeatureTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    return (
      <div className="bg-[#060911]/95 border border-white/15 backdrop-blur-md rounded-lg px-3 py-2 shadow-xl text-xs font-mono tabular-nums">
        <p className="text-sky-400 font-bold mb-1">{entry.name}</p>
        <p className="text-white">
          Weight: <span className="font-bold text-amber-400">{entry.value}%</span> of anomaly trigger
        </p>
      </div>
    );
  }
  return null;
};

export const AIAnalysisPage = ({ selectedAstronaut }: AIAnalysisPageProps) => {
  const { backendMode, latestAssessmentByAstronaut } = useTelemetry();
  const [activeTab, setActiveTab] = useState<'timeline' | 'features'>('timeline');
  const { aiAnalysis, name, callsign } = selectedAstronaut;
  const liveAssessment = latestAssessmentByAstronaut[selectedAstronaut.id];

  const isAnomalous = aiAnalysis.compositeAnomalyScore >= aiAnalysis.anomalyThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-[#0B3D91]/25 text-sky-400 border border-[#1A56DB]/40 mb-2 tabular-nums">
            <Cpu className="w-3.5 h-3.5" />
            Machine Learning Anomaly Detection Subsystem
          </div>
          <h1 className="text-2xl font-bold text-white">
            AI Health Anomaly Analysis &bull; {name} ({callsign})
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Unsupervised multivariate pattern recognition (Isolation Forest + Z-score ensemble).
          </p>
        </div>

        {/* Model status pill */}
        <div className="flex items-center gap-2 bg-space-panel border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs font-mono tabular-nums">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">Engine:</span>
          <span className="text-sky-300 font-medium">
            {backendMode === 'LIVE_API'
              ? 'FASTAPI ISOLATION FOREST • LIVE SQLITE'
              : 'ISOLATION FOREST • PROTOTYPE'}
          </span>
        </div>
      </div>

      {/* Member 3 Multi-Hazard Live Inference Banner */}
      {backendMode === 'LIVE_API' && liveAssessment && (
        <div className="bg-space-panel/90 border border-[#1A56DB]/40 rounded-xl p-4 shadow-lg text-xs font-mono tabular-nums space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
            <span className="text-sky-400 font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-sky-400" />
              Member 3 Multi-Hazard Risk &amp; Isolation Forest Live Inference
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                liveAssessment.overall_status === 'CRITICAL_RISK'
                  ? 'bg-[#FC3D21]/15 text-[#FC3D21] border border-[#FC3D21]/40 animate-pulse'
                  : liveAssessment.overall_status === 'ELEVATED_RISK'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40'
              }`}
            >
              {liveAssessment.overall_status}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] pt-1">
            <div>
              <span className="text-slate-400 block">Isolation Score:</span>
              <span className="text-white font-bold">{liveAssessment.ml_anomaly_score}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">(-decision_function)</span>
            </div>
            <div>
              <span className="text-slate-400 block">Primary Hazard:</span>
              <span className="text-sky-300 font-bold">{liveAssessment.primary_hazard}</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Highest: {liveAssessment.highest_severity}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Assessed Domains:</span>
              <span className="text-white font-bold truncate block">
                {liveAssessment.assessed_domains.join(', ')}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Evidence: {liveAssessment.evidence_status}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Active Open Alerts:</span>
              <span className="text-amber-400 font-bold">{liveAssessment.active_open_alert_ids.length} Alerts</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">+{liveAssessment.alerts_created_count} New</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Composite Anomaly Score */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-sky-400" />
              Anomaly Score
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border tabular-nums ${
                isAnomalous
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse'
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              }`}
            >
              {isAnomalous ? 'Warning Active' : 'Nominal Envelope'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono tabular-nums ${isAnomalous ? 'text-amber-400' : 'text-emerald-400'}`}>
                {aiAnalysis.compositeAnomalyScore.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 1.00 Index</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Threshold Floor</span>
              <span className="text-amber-400">&ge; {aiAnalysis.anomalyThreshold} Alert</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Z-Score Deviation */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Statistical Deviation
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/30 tabular-nums">
              Normalized
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {aiAnalysis.baselineDeviationZScore > 0 ? `+${aiAnalysis.baselineDeviationZScore}` : aiAnalysis.baselineDeviationZScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">&sigma; (Z-Score)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Launch Baseline</span>
              <span className="text-slate-300">0.0 &sigma;</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Model Confidence */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Algorithm Confidence
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 tabular-nums">
              High
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono tabular-nums text-white">
                {Math.round(aiAnalysis.confidenceLevel * 100)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">Certainty</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Sample Density</span>
              <span className="text-slate-300">1440 pts / day</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Risk State */}
        <div className="bg-space-panel border border-white/[0.08] rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-sky-400" />
              Risk Classification
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/40 border border-white/[0.08] text-slate-400 font-mono tabular-nums">
              Multimodal
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono tabular-nums ${
                  aiAnalysis.riskLevel === 'HIGH'
                    ? 'text-[#FC3D21]'
                    : aiAnalysis.riskLevel === 'ELEVATED'
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {aiAnalysis.riskLevel}
              </span>
              <span className="text-xs text-slate-400 font-mono">Priority</span>
            </div>
            <div className="mt-2 pt-2 border-t border-white/[0.08] text-[11px] text-slate-400 flex justify-between font-mono tabular-nums">
              <span>Lead Biomarker</span>
              <span className="text-sky-300 truncate max-w-[120px]">
                {aiAnalysis.featureAttributions[0]?.featureName || 'Vitals'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts: 14-Day Trajectory vs Feature Attribution Bar */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Cpu className="w-4 h-4 text-space-cyan" />
              {activeTab === 'timeline'
                ? '14-Day Anomaly Score Progression vs Early Warning Alert Threshold (0.65)'
                : 'Explainable AI: Biomarker Feature Attribution Breakdown'}
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              {activeTab === 'timeline'
                ? 'Tracking longitudinal drift in the composite health anomaly index.'
                : 'Shapley-additive-style attribution showing which signals drove the anomaly trigger.'}
            </p>
          </div>

          <div className="flex items-center bg-space-bg border border-space-border rounded-lg p-0.5 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'timeline'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              14-Day Timeline
            </button>
            <button
              onClick={() => setActiveTab('features')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                activeTab === 'features'
                  ? 'bg-space-panel text-space-cyan border border-space-cyan/30 font-semibold shadow'
                  : 'text-space-dim hover:text-space-text'
              }`}
            >
              Feature Attribution
            </button>
          </div>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'timeline' ? (
              <ComposedChart data={aiAnalysis.timeline14d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="aiAnomalyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isAnomalous ? '#FC3D21' : '#3B82F6'} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={isAnomalous ? '#FC3D21' : '#3B82F6'} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0.0, 1.0]} />
                <Tooltip content={<DarkTimelineTooltip />} />
                {/* NASA Blue Baseline Nominal Line */}
                <ReferenceLine
                  y={0.25}
                  stroke="#3B82F6"
                  strokeDasharray="3 3"
                  label={{ value: 'BASE NOMINAL (0.25)', fill: '#3B82F6', fontSize: 9, position: 'insideBottomRight' }}
                />
                {/* Caution / Early Warning Threshold */}
                <ReferenceLine
                  y={0.65}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'EARLY WARNING (0.65)', fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                {/* NASA Vector Red Critical Alert Threshold */}
                <ReferenceLine
                  y={0.8}
                  stroke="#FC3D21"
                  strokeDasharray="4 4"
                  label={{ value: 'CRITICAL ALERT (0.80)', fill: '#FC3D21', fontSize: 9, position: 'insideTopRight' }}
                />
                <Area type="monotone" dataKey="anomalyScore" fill="url(#aiAnomalyGrad)" stroke="transparent" />
                <Line
                  type="monotone"
                  dataKey="anomalyScore"
                  name="Composite Anomaly Index"
                  stroke={isAnomalous ? '#FC3D21' : '#38BDF8'}
                  strokeWidth={2.5}
                  dot={(p) => {
                    const { cx, cy, index } = p;
                    if (index === aiAnalysis.timeline14d.length - 1) {
                      const dotColor = isAnomalous ? '#FC3D21' : '#38BDF8';
                      return (
                        <g key={`edge-dot-ai-${index}`}>
                          <circle cx={cx} cy={cy} r={7} fill={dotColor} fillOpacity={0.3} />
                          <circle cx={cx} cy={cy} r={4} fill="#F8FAFC" stroke={dotColor} strokeWidth={2} />
                        </g>
                      );
                    }
                    return <circle key={`dot-ai-${index}`} cx={cx} cy={cy} r={3} fill={isAnomalous ? '#FC3D21' : '#38BDF8'} />;
                  }}
                  activeDot={{ r: 4 }}
                />
              </ComposedChart>
            ) : (
              <BarChart
                data={aiAnalysis.featureAttributions}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 40, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" horizontal={false} />
                <XAxis type="number" stroke="#64748B" fontSize={10} domain={[0, 50]} unit="%" />
                <YAxis dataKey="featureName" type="category" stroke="#94A3B8" fontSize={11} tickLine={false} width={150} />
                <Tooltip content={<DarkFeatureTooltip />} />
                <Bar dataKey="contributionPct" name="Attribution Weight" fill="#38BDF8" radius={[0, 4, 4, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <span>Model Architecture: Multi-variate Scikit-learn Isolation Forest with adaptive IQR bounds</span>
          <span>Source: SIMULATED ML OUTPUT</span>
        </div>
      </div>

      {/* Clinical Interpretation & Next Assessment Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Interpretation */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2 text-space-text font-semibold text-sm pb-2 border-b border-space-border/60">
            <Brain className="w-4 h-4 text-space-cyan" />
            <span>Explainable AI Clinical Assessment & Synthesis</span>
          </div>

          <p className="text-xs text-space-muted leading-relaxed">
            {aiAnalysis.clinicalInterpretation}
          </p>

          <div className="space-y-2 pt-2">
            <h4 className="text-[11px] font-semibold text-space-dim uppercase tracking-wider font-mono">
              Observed Biomarker Contributing Vectors
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {aiAnalysis.featureAttributions.map((feat) => (
                <div key={feat.featureKey} className="bg-space-bg/60 border border-space-border/60 rounded p-2.5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-space-text truncate">{feat.featureName}</span>
                    <span className="font-mono text-space-cyan font-bold">{feat.contributionPct}%</span>
                  </div>
                  <div className="text-[11px] text-space-dim font-mono flex justify-between">
                    <span>Value: <strong className="text-space-text">{feat.observedValue}</strong></span>
                    <span>Nominal: {feat.nominalRange}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Actionable Next Steps */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-space-emerald font-semibold text-sm pb-2 border-b border-space-border/60">
              <CheckCircle2 className="w-4 h-4 text-space-emerald" />
              <span>Recommended Flight Surgeon Assessment Steps</span>
            </div>

            <div className="space-y-2.5 pt-2 text-xs">
              {aiAnalysis.nextAssessmentRecommendations.map((rec, idx) => (
                <div key={idx} className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 flex items-start gap-2.5">
                  <ArrowRight className="w-3.5 h-3.5 text-space-cyan shrink-0 mt-0.5" />
                  <span className="text-space-text leading-relaxed">{rec}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-space-bg/40 border border-space-border/40 rounded-lg p-3 text-[11px] text-space-dim flex items-center gap-2 font-mono">
            <Info className="w-3.5 h-3.5 text-space-cyan shrink-0" />
            <span>AI model calibrated on NASA OSDR ground analog and microgravity physiological distributions.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
