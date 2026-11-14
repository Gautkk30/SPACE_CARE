import React from 'react';
import { TabId } from '../../types/spacecare';
import { Construction, ArrowLeft, Layers, Database, Cpu } from 'lucide-react';

interface PhaseNoticePlaceholderProps {
  tabId: TabId;
  tabLabel: string;
  onReturnToOverview: () => void;
}

const TAB_DESCRIPTIONS: Record<TabId, { title: string; desc: string; backendHook: string }> = {
  overview: {
    title: 'Main Health Overview',
    desc: 'Primary expedition health telemetry and early warning dashboard.',
    backendHook: '/api/v1/health',
  },
  crew: {
    title: 'Expedition Crew Management',
    desc: 'Individual astronaut profiles, mission duty logs, EVA assignments, and medical history baselines.',
    backendHook: '/api/v1/astronauts',
  },
  vitals: {
    title: 'Continuous Vital Signs Tracking',
    desc: 'High-frequency telemetry stream inspector (HRV, SpO2, core temperature, blood pressure, respiration).',
    backendHook: '/api/v1/astronauts/{id}/vitals',
  },
  'manual-input': {
    title: 'Manual Health & Physiological Telemetry Entry',
    desc: 'Clinical-grade manual astronaut vital signs submission workstation aligned with the backend database.',
    backendHook: '/api/v1/telemetry',
  },
  'hazard-lab': {
    title: 'NASA-STD-3001 Operational Hazard & Physiology Lab',
    desc: 'Interactive real-time spaceflight hazard simulation and coupled physiological response model.',
    backendHook: '/api/v1/telemetry/simulate',
  },
  cardiovascular: {
    title: 'Cardiovascular Deconditioning & Adaptation',
    desc: 'Longitudinal monitoring of orthostatic intolerance, arterial stiffness, and cephalad fluid shifting.',
    backendHook: '/api/v1/cardiovascular/trends',
  },
  'bone-muscle': {
    title: 'Musculoskeletal & Bone Loss Countermeasures',
    desc: 'Bone mineral density progression models and ARED resistance exercise countermeasure tracking.',
    backendHook: '/api/v1/musculoskeletal/analysis',
  },
  radiation: {
    title: 'Space Radiation & DONKI Solar Weather',
    desc: 'Cabin dosimeter logs correlated with live NASA DONKI Coronal Mass Ejections and Solar Particle Events.',
    backendHook: '/api/v1/radiation/space-weather',
  },
  'mental-health': {
    title: 'Sleep Architecture & Psychological Wellbeing',
    desc: 'Circadian phase shifts, actigraphy sleep metrics, and isolated confinement cognitive strain evaluation.',
    backendHook: '/api/v1/mental-health/metrics',
  },
  'ai-analysis': {
    title: 'AI / ML Anomaly Detection Engine',
    desc: 'Unsupervised multivariate anomaly detection (Isolation Forest / Outlier scoring) on streaming biometrics.',
    backendHook: '/api/v1/anomalies/detect',
  },
  alerts: {
    title: 'Early Warnings & Clinical Alert Dispatcher',
    desc: 'Multi-tiered priority alert queue with clinical countermeasure dispatch and acknowledgment workflows.',
    backendHook: '/api/v1/alerts/active',
  },
  reports: {
    title: 'Astronaut Health Reports & Medical Dossier',
    desc: 'Exportable mission medical status reports, longitudinal trend graphs, and flight surgeon debriefings.',
    backendHook: '/api/v1/reports/{id}/summary',
  },
  research: {
    title: 'NASA OSDR Research (OSD-946)',
    desc: 'Technical microarray quality-control analysis from NASA Open Science Data Repository (70-day bed rest analogue).',
    backendHook: '/api/v1/research/osd946/overview',
  },
};

export const PhaseNoticePlaceholder: React.FC<PhaseNoticePlaceholderProps> = ({
  tabId,
  tabLabel,
  onReturnToOverview,
}) => {
  const details = TAB_DESCRIPTIONS[tabId] || {
    title: tabLabel,
    desc: 'Specialized health monitoring workspace.',
    backendHook: '/api/v1/endpoint',
  };

  return (
    <div className="bg-space-panel border border-space-border rounded-xl p-8 lg:p-12 text-center max-w-3xl mx-auto my-8 shadow-xl">
      <div className="w-14 h-14 rounded-2xl bg-space-cyan-muted text-space-cyan border border-space-cyan/30 flex items-center justify-center mx-auto mb-5">
        <Construction className="w-7 h-7" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-space-amber-muted text-space-amber border border-space-amber/30 mb-4">
        <span>Module Scheduled for Phase 3 Implementation</span>
      </div>

      <h2 className="text-2xl font-bold text-space-text mb-2">
        {details.title}
      </h2>

      <p className="text-space-muted text-sm max-w-xl mx-auto leading-relaxed mb-8">
        {details.desc}
      </p>

      {/* Architectural Alignment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left mb-8 max-w-2xl mx-auto text-xs">
        <div className="bg-space-bg border border-space-border p-3.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-space-cyan font-semibold mb-1">
            <Layers className="w-3.5 h-3.5" />
            Frontend Module
          </div>
          <p className="text-space-dim">
            `src/components/{tabId}/` UI component tree wired in Phase 3.
          </p>
        </div>

        <div className="bg-space-bg border border-space-border p-3.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-space-emerald font-semibold mb-1">
            <Cpu className="w-3.5 h-3.5" />
            Backend Route
          </div>
          <p className="text-space-dim font-mono">
            {details.backendHook}
          </p>
        </div>

        <div className="bg-space-bg border border-space-border p-3.5 rounded-lg">
          <div className="flex items-center gap-1.5 text-space-amber font-semibold mb-1">
            <Database className="w-3.5 h-3.5" />
            NASA Integration
          </div>
          <p className="text-space-dim">
            HRP Evidence Base & OSDR Baselines.
          </p>
        </div>
      </div>

      <button
        onClick={onReturnToOverview}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-space-bg border border-space-border text-space-text hover:border-space-cyan hover:text-space-cyan text-xs font-semibold transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Overview Dashboard
      </button>
    </div>
  );
};
