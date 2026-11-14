import React from 'react';
import { Activity, ShieldAlert, HeartPulse, Brain, Radio, CheckCircle2 } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-10 pb-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20 mb-3">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              NASA Space Apps Challenge 2026
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              SPACECARE
            </h1>
            <p className="text-slate-400 text-sm md:text-base mt-1">
              Intelligent Astronaut Health Monitoring & Early Warning System
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Project Scaffolding Initialized</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto space-y-8">
        {/* Architecture Status Card */}
        <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur">
          <h2 className="text-lg font-semibold text-white mb-2">Architecture & Readiness Notice</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Project scaffolding, directory structure, and technical documentation have been established.
            The frontend and backend development environments are decoupled and prepared for modular feature implementation by the respective team leads.
          </p>
        </section>

        {/* Planned Modules Grid */}
        <section>
          <h2 className="text-lg font-semibold text-slate-200 mb-4">Planned Health Monitoring Modules</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Vitals Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-sky-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4">
                <HeartPulse className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Cardiovascular & Vitals</h3>
              <p className="text-slate-400 text-xs mt-2 leading-normal">
                Continuous tracking of HR, HRV, BP, SpO2, and microgravity deconditioning indicators.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                Status: Pending Backend Models
              </div>
            </div>

            {/* Radiation Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-amber-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 mb-4">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Space Radiation & DONKI</h3>
              <p className="text-slate-400 text-xs mt-2 leading-normal">
                Cumulative cabin dosimeter tracking correlated with real-time NASA solar storm warnings.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                Status: Pending DONKI API Connector
              </div>
            </div>

            {/* Mental Health Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-purple-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">Sleep & Psychological State</h3>
              <p className="text-slate-400 text-xs mt-2 leading-normal">
                Circadian rhythm analysis, sleep architecture tracking, and cognitive fatigue assessment.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                Status: Pending Metric Calibration
              </div>
            </div>

            {/* Alert & ML Card */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-rose-500/40 transition">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-400 mb-4">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white text-base">AI Early Warning & Alerts</h3>
              <p className="text-slate-400 text-xs mt-2 leading-normal">
                Multivariate anomaly detection engine outputting actionable clinical countermeasures.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-slate-500">
                Status: Pending Model Pipelines
              </div>
            </div>

          </div>
        </section>

        {/* Team Assignments */}
        <section className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-6">
          <h2 className="text-base font-semibold text-slate-300 mb-4">Next Steps & Responsibilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
            <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
              <span className="font-bold text-sky-400 block mb-1">Member 1 (Team Lead)</span>
              Finalize NASA OSDR / DONKI integration contracts and scientific threshold validation.
            </div>
            <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
              <span className="font-bold text-sky-400 block mb-1">Member 2 (Frontend Dev)</span>
              Implement interactive telemetry charts, vitals dashboard views, and Lucide icons.
            </div>
            <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
              <span className="font-bold text-sky-400 block mb-1">Member 3 (Backend & ML)</span>
              Initialize SQLite/SQLAlchemy schemas, build Scikit-learn anomaly pipeline, and expose REST APIs.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto mt-16 pt-6 border-t border-slate-900 text-center text-xs text-slate-600">
        SPACECARE Project Scaffolding & Architecture Blueprint &bull; NASA Space Apps Challenge 2026
      </footer>
    </div>
  );
}
