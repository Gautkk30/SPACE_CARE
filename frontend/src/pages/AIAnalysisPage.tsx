import { useState } from 'react';
import { AstronautProfile } from '../types/spacecare';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
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
      <div className="bg-space-panel border border-space-border-light p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1.5">{label}</p>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
            <span className="text-space-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              {entry.name}:
            </span>
            <span className="font-semibold text-space-text">
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
      <div className="bg-space-panel border border-space-border-light p-3 rounded-lg shadow-2xl text-xs font-mono">
        <p className="text-space-cyan font-bold mb-1">{entry.name}</p>
        <p className="text-space-text">
          Weight: <span className="font-bold text-space-amber">{entry.value}%</span> of anomaly trigger
        </p>
      </div>
    );
  }
  return null;
};

export const AIAnalysisPage = ({ selectedAstronaut }: AIAnalysisPageProps) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'features'>('timeline');
  const { aiAnalysis, name, callsign } = selectedAstronaut;

  const isAnomalous = aiAnalysis.compositeAnomalyScore >= aiAnalysis.anomalyThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Cpu className="w-3.5 h-3.5" />
            Machine Learning Anomaly Detection Subsystem
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            AI Health Anomaly Analysis &bull; {name} ({callsign})
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Unsupervised multivariate pattern recognition (Isolation Forest + Z-score ensemble).
          </p>
        </div>

        {/* Model status pill */}
        <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-space-cyan" />
          <span className="text-space-dim">Engine:</span>
          <span className="text-space-cyan font-medium">ISOLATION FOREST • PROTOTYPE</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Composite Anomaly Score */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-space-cyan" />
              Anomaly Score
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isAnomalous
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isAnomalous ? 'Warning Active' : 'Nominal Envelope'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isAnomalous ? 'text-space-amber' : 'text-space-emerald'}`}>
                {aiAnalysis.compositeAnomalyScore.toFixed(2)}
              </span>
              <span className="text-xs text-space-muted">/ 1.00 Index</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Threshold Floor</span>
              <span className="text-space-amber">&ge; {aiAnalysis.anomalyThreshold} Alert</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Z-Score Deviation */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-space-amber" />
              Statistical Deviation
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              Normalized
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {aiAnalysis.baselineDeviationZScore > 0 ? `+${aiAnalysis.baselineDeviationZScore}` : aiAnalysis.baselineDeviationZScore}
              </span>
              <span className="text-xs text-space-muted">&sigma; (Z-Score)</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Launch Baseline</span>
              <span className="text-space-text">0.0 &sigma;</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Model Confidence */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-space-emerald" />
              Algorithm Confidence
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
              High
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {Math.round(aiAnalysis.confidenceLevel * 100)}%
              </span>
              <span className="text-xs text-space-muted">Certainty</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Sample Density</span>
              <span className="text-space-text">1440 pts / day</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Risk State */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-space-cyan" />
              Risk Classification
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-bg border border-space-border text-space-dim font-mono">
              Multimodal
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-bold font-mono ${
                  aiAnalysis.riskLevel === 'HIGH'
                    ? 'text-space-red'
                    : aiAnalysis.riskLevel === 'ELEVATED'
                    ? 'text-space-amber'
                    : 'text-space-emerald'
                }`}
              >
                {aiAnalysis.riskLevel}
              </span>
              <span className="text-xs text-space-muted">Priority</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Lead Biomarker</span>
              <span className="text-space-cyan truncate max-w-[120px]">
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
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="#64748B" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0.0, 1.0]} />
                <Tooltip content={<DarkTimelineTooltip />} />
                <ReferenceLine
                  y={0.65}
                  stroke="#F59E0B"
                  strokeDasharray="4 4"
                  label={{ value: 'Early Warning Threshold (0.65)', fill: '#F59E0B', fontSize: 9, position: 'insideTopRight' }}
                />
                <Line
                  type="monotone"
                  dataKey="anomalyScore"
                  name="Composite Anomaly Index"
                  stroke={isAnomalous ? '#F59E0B' : '#06B6D4'}
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: isAnomalous ? '#F59E0B' : '#06B6D4' }}
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
                <Bar dataKey="contributionPct" name="Attribution Weight" fill="#06B6D4" radius={[0, 4, 4, 0]} />
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
