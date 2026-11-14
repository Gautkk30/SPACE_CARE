import React, { useState, useEffect } from 'react';
import { AstronautProfile, BehavioralCheckIn } from '../types/spacecare';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Brain,
  Moon,
  Sparkles,
  Smile,
  Send,
  BookOpen,
  Info,
  Clock,
  CheckCircle2,
} from 'lucide-react';

interface MentalHealthSleepPageProps {
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

const DarkSleepTooltip = ({ active, payload, label }: CustomTooltipProps) => {
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
              {entry.value} {entry.name.includes('Sleep') ? 'hrs' : ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MentalHealthSleepPage = ({ selectedAstronaut }: MentalHealthSleepPageProps) => {
  // Local state for mental health to allow immediate simulated check-in submissions
  const [mentalState, setMentalState] = useState(selectedAstronaut.mentalHealth);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  // Form state
  const [formMood, setFormMood] = useState(4);
  const [formStress, setFormStress] = useState(3);
  const [formSleepQual, setFormSleepQual] = useState(4);
  const [formCognitiveFatigue, setFormCognitiveFatigue] = useState(false);
  const [formNotes, setFormNotes] = useState('');

  // Sync with selected astronaut when props change
  useEffect(() => {
    setMentalState(selectedAstronaut.mentalHealth);
    setFormMood(selectedAstronaut.mentalHealth.currentMoodScore);
    setFormStress(selectedAstronaut.mentalHealth.currentStressIndex);
    setSubmissionSuccess(false);
  }, [selectedAstronaut.id, selectedAstronaut.mentalHealth]);

  const handleSubmitCheckIn = (e: React.FormEvent) => {
    e.preventDefault();

    const newCheckIn: BehavioralCheckIn = {
      id: `CHK-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      moodRating: formMood,
      perceivedStress: formStress,
      sleepQuality: formSleepQual,
      cognitiveFatigue: formCognitiveFatigue,
      notes: formNotes.trim() || 'Routine check-in logged via onboard workstation.',
    };

    setMentalState((prev) => ({
      ...prev,
      currentMoodScore: formMood,
      currentStressIndex: formStress,
      currentCircadianAlignment: Math.min(100, Math.max(50, Math.round(prev.currentCircadianAlignment + (formMood >= 4 ? 3 : -3)))),
      checkInHistory: [newCheckIn, ...prev.checkInHistory],
    }));

    setFormNotes('');
    setSubmissionSuccess(true);
    setTimeout(() => setSubmissionSuccess(false), 4000);
  };

  const isStressElevated = mentalState.currentStressIndex >= 6;
  const isCircadianSuboptimal = mentalState.currentCircadianAlignment < 75;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-space-border/60">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-0.5 rounded bg-space-cyan-muted text-space-cyan border border-space-cyan/30 mb-2">
            <Brain className="w-3.5 h-3.5" />
            Behavioral Health & Circadian Architecture
          </div>
          <h1 className="text-2xl font-bold text-space-text">
            Mental Health & Sleep &bull; {selectedAstronaut.name} ({selectedAstronaut.callsign})
          </h1>
          <p className="text-xs text-space-dim mt-0.5">
            Actigraphy sleep staging, circadian phase stability, and behavioral self-assessment tracking.
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex items-center gap-2 bg-space-panel border border-space-border rounded-lg px-3 py-1.5 text-xs font-mono">
          <Moon className="w-3.5 h-3.5 text-space-cyan" />
          <span className="text-space-dim">7-Day Sleep Avg:</span>
          <span className="text-space-cyan font-bold">
            {mentalState.weeklyAvgSleepHours} hrs/night ({mentalState.weeklyAvgEfficiencyPct}% Eff)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Circadian Alignment */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-space-cyan" />
              Circadian Phase
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isCircadianSuboptimal
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isCircadianSuboptimal ? 'Phase Delay' : 'Synchronized'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isCircadianSuboptimal ? 'text-space-amber' : 'text-space-cyan'}`}>
                {mentalState.currentCircadianAlignment}
              </span>
              <span className="text-xs text-space-muted">/ 100 Index</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Target Standard</span>
              <span className="text-space-text">&ge; 80 Sync</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Perceived Stress Index */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-space-amber" />
              Perceived Stress
            </span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                isStressElevated
                  ? 'bg-space-amber-muted text-space-amber border-space-amber/30 animate-pulse'
                  : 'bg-space-emerald-muted text-space-emerald border-space-emerald/30'
              }`}
            >
              {isStressElevated ? 'Elevated (≥6)' : 'Managed'}
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold font-mono ${isStressElevated ? 'text-space-amber' : 'text-space-text'}`}>
                {mentalState.currentStressIndex}
              </span>
              <span className="text-xs text-space-muted">/ 10 Scale</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Clinical Baseline</span>
              <span className="text-space-text">&le; 4.0 Normal</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Subjective Mood Score */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-space-emerald" />
              Mood Rating
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-emerald-muted text-space-emerald border border-space-emerald/30">
              Active Check-In
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {mentalState.currentMoodScore}
              </span>
              <span className="text-xs text-space-muted">/ 5 Stars</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>Psych Status</span>
              <span className="text-space-emerald">{mentalState.currentMoodScore >= 4 ? 'Optimal' : 'Guarded'}</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Deep Sleep Ratio */}
        <div className="bg-space-panel border border-space-border rounded-xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-space-dim uppercase tracking-wider font-medium flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-space-cyan" />
              Sleep Quality Score
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-space-cyan-muted text-space-cyan border border-space-cyan/30">
              Actigraphy
            </span>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold font-mono text-space-text">
                {mentalState.weeklyAvgEfficiencyPct}%
              </span>
              <span className="text-xs text-space-muted">Efficiency</span>
            </div>
            <div className="mt-2 pt-2 border-t border-space-border/60 text-[11px] text-space-dim flex justify-between font-mono">
              <span>NASA Standard</span>
              <span className="text-space-text">&ge; 85% Efficiency</span>
            </div>
          </div>
        </div>
      </div>

      {/* 7-Day Sleep Architecture Stacked Bar Chart */}
      <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
              <Moon className="w-4 h-4 text-space-cyan" />
              7-Day Sleep Architecture Breakdown (Deep, REM, Light vs 8.0h Target)
            </h2>
            <p className="text-xs text-space-dim mt-0.5">
              Continuous actigraphy and polysomnography telemetry estimating restorative sleep stages.
            </p>
          </div>
          <span className="text-xs font-mono text-space-dim">8.0h NASA Sleep Prescription</span>
        </div>

        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={mentalState.sleepArchitecture7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2D4A" vertical={false} />
              <XAxis dataKey="dayLabel" stroke="#64748B" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={10} tickLine={false} domain={[0, 10]} />
              <Tooltip content={<DarkSleepTooltip />} />
              <ReferenceLine
                y={8.0}
                stroke="#10B981"
                strokeDasharray="4 4"
                label={{ value: 'Target Sleep Duration (8.0h)', fill: '#10B981', fontSize: 9, position: 'insideTopRight' }}
              />
              <Bar dataKey="deepSleepHours" name="Deep / SWS Sleep" stackId="sleep" fill="#06B6D4" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remSleepHours" name="REM Sleep" stackId="sleep" fill="#818CF8" radius={[0, 0, 0, 0]} />
              <Bar dataKey="lightSleepHours" name="Light Sleep" stackId="sleep" fill="#334155" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="totalSleepHours" name="Total Hours" stroke="#F1F5F9" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between text-[11px] text-space-dim pt-2 border-t border-space-border/60 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-space-cyan" /> Deep SWS</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400" /> REM</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Light Sleep</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Target 8h</span>
          </div>
          <span>Source: SIMULATED ACTIGRAPHY</span>
        </div>
      </div>

      {/* Interactive Behavioral Self-Assessment Form & Check-in History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Form Container */}
        <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-space-border/60">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
                <Brain className="w-4 h-4 text-space-cyan" />
                Astronaut Daily Behavioral Self-Assessment
              </h2>
              <p className="text-xs text-space-dim mt-0.5">
                Simulated daily psychological evaluation submitted directly to flight surgeon logs.
              </p>
            </div>
            <span className="text-[11px] font-mono text-space-cyan">{selectedAstronaut.callsign}</span>
          </div>

          {submissionSuccess && (
            <div className="bg-space-emerald-muted border border-space-emerald/40 text-space-emerald rounded-lg p-3 text-xs flex items-center gap-2 font-mono">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Assessment logged successfully & verified against clinical baseline!</span>
            </div>
          )}

          <form onSubmit={handleSubmitCheckIn} className="space-y-3.5 text-xs">
            {/* Mood Slider */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Subjective Mood Rating:</span>
                <span className="text-space-cyan font-bold">{formMood} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formMood}
                onChange={(e) => setFormMood(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-space-bg rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-space-dim font-mono">
                <span>1: Distressed / Low</span>
                <span>3: Neutral</span>
                <span>5: Energized / Optimal</span>
              </div>
            </div>

            {/* Perceived Stress Slider */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Perceived Workload / Stress:</span>
                <span className={`font-bold ${formStress >= 6 ? 'text-space-amber' : 'text-space-text'}`}>
                  {formStress} / 10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formStress}
                onChange={(e) => setFormStress(Number(e.target.value))}
                className="w-full accent-amber-400 bg-space-bg rounded cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-space-dim font-mono">
                <span>1: Calm</span>
                <span>5: Moderate Taskload</span>
                <span>10: High Strain</span>
              </div>
            </div>

            {/* Sleep Quality Rating */}
            <div>
              <div className="flex justify-between text-space-dim mb-1 font-mono">
                <span>Subjective Restorative Sleep Quality:</span>
                <span className="text-space-text font-bold">{formSleepQual} / 5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={formSleepQual}
                onChange={(e) => setFormSleepQual(Number(e.target.value))}
                className="w-full accent-cyan-400 bg-space-bg rounded cursor-pointer"
              />
            </div>

            {/* Cognitive Fatigue Toggle */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-space-bg border border-space-border">
              <div>
                <span className="text-space-text font-semibold block">Cognitive Fatigue / Reaction Lag</span>
                <span className="text-[11px] text-space-dim">Noticeable delays during checklist execution or robotic arm tasks</span>
              </div>
              <button
                type="button"
                onClick={() => setFormCognitiveFatigue(!formCognitiveFatigue)}
                className={`px-3 py-1 text-xs rounded font-bold transition ${
                  formCognitiveFatigue
                    ? 'bg-space-amber-muted text-space-amber border border-space-amber/40'
                    : 'bg-space-panel text-space-dim border border-space-border'
                }`}
              >
                {formCognitiveFatigue ? 'Flagged Yes' : 'No Lag'}
              </button>
            </div>

            {/* Notes Textarea */}
            <div>
              <label className="text-space-dim font-mono block mb-1">
                Astronaut Notes / Environmental Factors:
              </label>
              <textarea
                rows={2}
                placeholder="E.g., high pump noise in crew quarters, blue spectrum light glare, EVA prep fatigue..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full bg-space-bg border border-space-border rounded-lg p-2.5 text-xs text-space-text placeholder-space-dim focus:outline-none focus:border-space-cyan resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-space-cyan text-space-bg font-bold hover:bg-space-cyan/90 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Submit Behavioral Assessment Log
            </button>
          </form>
        </div>

        {/* Check-In History & Scientific Grounding */}
        <div className="space-y-4 flex flex-col justify-between">
          {/* History */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-space-border/60">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-space-muted flex items-center gap-2">
                <Clock className="w-4 h-4 text-space-cyan" />
                Recent Check-In History & Surgeon Notes
              </h2>
              <span className="text-xs font-mono text-space-dim">
                {mentalState.checkInHistory.length} Logged Entries
              </span>
            </div>

            <div className="space-y-2.5 max-h-[190px] overflow-y-auto pr-1">
              {mentalState.checkInHistory.map((chk) => (
                <div key={chk.id} className="bg-space-bg/60 border border-space-border/60 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between text-space-dim font-mono text-[11px]">
                    <span className="text-space-cyan font-semibold">{chk.id}</span>
                    <span>{new Date(chk.timestamp).toLocaleString('en-US', { timeZone: 'UTC' })} UTC</span>
                  </div>
                  <div className="flex items-center gap-4 text-space-text font-mono">
                    <span>Mood: <strong className="text-space-cyan">{chk.moodRating}/5</strong></span>
                    <span>Stress: <strong className={chk.perceivedStress >= 6 ? 'text-space-amber' : 'text-space-text'}>{chk.perceivedStress}/10</strong></span>
                    <span>Sleep Qual: <strong>{chk.sleepQuality}/5</strong></span>
                    {chk.cognitiveFatigue && (
                      <span className="text-space-amber font-bold text-[10px] px-1.5 py-0.2 rounded bg-space-amber-muted border border-space-amber/30">
                        Fatigue Alert
                      </span>
                    )}
                  </div>
                  <p className="text-space-muted text-[11px] pt-1 leading-snug">
                    "{chk.notes}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Scientific Context Panel */}
          <div className="bg-space-panel border border-space-border rounded-xl p-5 shadow-lg space-y-2">
            <div className="flex items-center gap-2 text-space-cyan font-semibold text-sm pb-1 border-b border-space-border/60">
              <BookOpen className="w-4 h-4" />
              <span>NASA NLSP & HRP Behavioral Health & Sleep Research</span>
            </div>
            <p className="text-xs text-space-muted leading-relaxed">
              Extended missions inside Isolated, Confined, and Extreme (ICE) environments produce circadian phase misalignment, elevated cortisol, and fragmented sleep architecture. NASA Human Research Program protocols mandate scheduled 8-hour sleep opportunities, dynamic spectrum Solid-State Light Assemblies (SSLAs), and non-invasive actigraphy surveillance to protect mission cognitive performance.
            </p>
            <div className="pt-1 text-[11px] font-mono text-space-cyan flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Reference: NASA HRP Behavioral Health and Performance (BHP) Risk Standard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
