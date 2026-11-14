import React from 'react';
import { AlertTriangle, ExternalLink, ShieldCheck } from 'lucide-react';
import { OSD946ScientificNotice } from '../../types/research';

interface Props {
  notice?: OSD946ScientificNotice;
  doi?: string;
  datasetUrl?: string;
}

export const ScientificNoticeBanner: React.FC<Props> = ({
  notice,
  doi = '10.26030/wzr2-r025',
  datasetUrl = 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-946',
}) => {
  return (
    <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-5 backdrop-blur text-slate-200">
      <div className="flex items-start gap-4">
        <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0 mt-0.5 border border-amber-500/20">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="space-y-3 text-xs md:text-sm leading-relaxed">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-amber-300 text-sm md:text-base flex items-center gap-2">
              <span>Scientific Data Classification & Analogue Notice</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-medium">
                NASA OSD-946 / GLDS-773
              </span>
            </h3>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <a
                href={datasetUrl}
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-300 inline-flex items-center gap-1 transition"
              >
                <span>OSDR Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span>&bull;</span>
              <a
                href={`https://doi.org/${doi}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-amber-300 inline-flex items-center gap-1 transition"
              >
                <span>DOI: {doi}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-slate-300">
            <strong>Study Context:</strong> This dataset represents a ground-based 70-day, 6-degree head-down tilt bed-rest analogue study conducted with 22 healthy male volunteer participants evaluating <em>vastus lateralis</em> skeletal muscle biopsy microRNA profiles across Control (CON), Exercise (EX), and Flywheel (FLY) cohorts.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
              <span className="font-semibold text-amber-400 block mb-1">
                Telemetry Boundary:
              </span>
              {notice?.telemetry_boundary ||
                'This dataset represents ground-based bed-rest research, NOT live astronaut biometric telemetry.'}
            </div>

            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3">
              <span className="font-semibold text-amber-400 block mb-1">
                QC Metric Interpretation:
              </span>
              {notice?.qc_interpretation ||
                'Probe detection percentage is a technical hybridization QC indicator (gIsGeneDetected == 1) for Agilent microarrays and does NOT represent clinical muscle health, atrophy severity, or treatment efficacy.'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {notice?.validation_status ||
                'Technical completeness verified across all 44 samples (50,980 probes each). Biological analysis pending.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
