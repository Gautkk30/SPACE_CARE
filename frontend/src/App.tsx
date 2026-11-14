
import { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  HeartPulse,
  Brain,
  Radio,
  CheckCircle2,
  FlaskConical,
  LayoutDashboard,
} from 'lucide-react';

import { Osd946QcDashboard } from './components/research/Osd946QcDashboard';
import { ManualHealthForm } from './components/health/ManualHealthForm';
import { RadiationDashboard } from './components/radiation/RadiationDashboard';
type DashboardTab = 'telemetry' | 'research' | 'manual' | 'radiation';
export default function App() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('research');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-10">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 pb-6 border-b border-slate-800">
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

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Backend Research API Active</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="flex flex-wrap items-center gap-2 mt-6 pt-2"
          aria-label="Dashboard Views"
        >
          {/* Research Tab */}
          <button
            onClick={() => setActiveTab('research')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer ${
              activeTab === 'research'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>NASA Research & Baselines (OSD-946)</span>

            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                activeTab === 'research'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              }`}
            >
              Verified QC
            </span>
          </button>

          {/* Telemetry Tab */}
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Mission Telemetry Overview</span>

            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                activeTab === 'telemetry'
                  ? 'bg-slate-950/20 text-slate-950'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Simulated
            </span>
          </button>

          {/* Manual Health Input Tab */}
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer ${
              activeTab === 'manual'
                ? 'bg-sky-500 text-slate-950 font-semibold shadow-lg shadow-sky-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <HeartPulse className="w-4 h-4" />
            <span>Manual Health Input</span>
          </button>

     {/* Radiation Dashboard Tab */}
            <button
          onClick={() => setActiveTab('radiation')}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs md:text-sm font-medium transition cursor-pointer ${
       activeTab === 'radiation'
      ? 'bg-amber-500 text-slate-950 font-semibold shadow-lg shadow-amber-500/20'
      : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
  }`}
>
  <Activity className="w-4 h-4" />
  <span>Space Radiation & DONKI</span>
  <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
    NASA API
  </span>
</button>

        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto space-y-8">
           {activeTab === 'research' ? (
  <Osd946QcDashboard />
) : activeTab === 'manual' ? (
  <ManualHealthForm />
) : activeTab === 'radiation' ? (
  <RadiationDashboard />
) : (
          /* Mission Telemetry Overview */
          <div className="space-y-8 animate-fadeIn">
            {/* Architecture Status Card */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 backdrop-blur">
              <h2 className="text-lg font-semibold text-white mb-2">
                Operational Telemetry & System Readiness
              </h2>

              <p className="text-slate-400 text-sm leading-relaxed">
                Project scaffolding, directory structure, and technical documentation have been established.
                The frontend and backend development environments are decoupled and prepared for modular feature implementation by the respective team leads.
              </p>
            </section>

            {/* Planned Modules Grid */}
            <section>
              <h2 className="text-lg font-semibold text-slate-200 mb-4">
                Planned Health Monitoring Modules
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Vitals Card */}
                <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 hover:border-sky-500/40 transition">
                  <div className="w-10 h-10 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 mb-4">
                    <HeartPulse className="w-5 h-5" />
                  </div>

                  <h3 className="font-semibold text-white text-base">
                    Cardiovascular & Vitals
                  </h3>

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

                  <h3 className="font-semibold text-white text-base">
                    Space Radiation & DONKI
                  </h3>

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

                  <h3 className="font-semibold text-white text-base">
                    Sleep & Psychological State
                  </h3>

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

                  <h3 className="font-semibold text-white text-base">
                    AI Early Warning & Alerts
                  </h3>

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
              <h2 className="text-base font-semibold text-slate-300 mb-4">
                Next Steps & Responsibilities
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-400">
                <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
                  <span className="font-bold text-sky-400 block mb-1">
                    Member 1 (Team Lead)
                  </span>
                  Finalize NASA OSDR / DONKI integration contracts and scientific threshold validation.
                </div>

                <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
                  <span className="font-bold text-sky-400 block mb-1">
                    Member 2 (Frontend Dev)
                  </span>
                  Implement interactive telemetry charts, vitals dashboard views, and Lucide icons.
                </div>

                <div className="border border-slate-800 p-4 rounded-lg bg-slate-950/40">
                  <span className="font-bold text-sky-400 block mb-1">
                    Member 3 (Backend & ML)
                  </span>
                  Initialize SQLite/SQLAlchemy schemas, build Scikit-learn anomaly pipeline, and expose REST APIs.
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto mt-16 pt-6 border-t border-slate-900 text-center text-xs text-slate-600">
        SPACECARE &bull; NASA Space Apps Challenge 2026 &bull; NASA Open Science Data Repository (OSDR) Integration
      </footer>
    </div>
  );
}
