"""
OSD-946 / GLDS-773 Research Data Schemas
========================================

Pydantic schemas for NASA OSD-946 / GLDS-773 miRNA microarray quality-control
data and ground-based bed-rest study metadata.

Scientific Notice:
OSD-946 is an open-access ground-based analogue research dataset (70-day bed rest,
22 subjects, vastus lateralis skeletal muscle biopsy miRNA microarrays).
These metrics are technical hybridization QC indicators (gIsGeneDetected == 1)
and must NOT be presented as live astronaut biometric telemetry or clinical
health measurements.
"""

from __future__ import annotations

from typing import List, Optional
from pydantic import BaseModel, Field


class OSD946SampleQC(BaseModel):
    """Quality control metrics for a single Agilent miRNA microarray sample."""

    sample_id: str = Field(..., description="Full filename of the sample archive")
    gsm_accession: str = Field(..., description="GEO GSM accession number (e.g. GSM7078076)")
    subject_id: Optional[int] = Field(None, description="Participant subject ID number")
    group: str = Field(..., description="Study cohort: CON (Control), EX (Exercise), FLY (Flywheel)")
    time: str = Field(..., description="Sampling timepoint: PRE (Baseline) or POST (Bed Rest)")
    total_probes: int = Field(..., description="Total human miRNA probe records (SystematicName starting with 'hsa-')")
    detected_probes: int = Field(..., description="Detected human miRNA probe count (gIsGeneDetected == 1)")
    detection_percent: float = Field(..., description="Technical microarray hybridization detection percentage")


class OSD946GroupSummary(BaseModel):
    """Aggregate quality control metrics for a cohort and timepoint."""

    group: str = Field(..., description="Study cohort: CON, EX, FLY")
    time: str = Field(..., description="Sampling timepoint: PRE, POST")
    samples: int = Field(..., description="Number of samples evaluated in this cohort/timepoint")
    average_detection: float = Field(..., description="Cohort average technical detection percentage")
    minimum: float = Field(..., description="Minimum technical detection percentage observed")
    maximum: float = Field(..., description="Maximum technical detection percentage observed")


class OSD946Metadata(BaseModel):
    """Study provenance and assay metadata for NASA OSD-946 / GLDS-773."""

    accession: str = Field("OSD-946", description="NASA OSDR study accession")
    genelab_id: str = Field("GLDS-773", description="NASA GeneLab dataset accession")
    geo_accession: str = Field("GSE226504", description="NCBI GEO series accession")
    doi: str = Field("10.26030/wzr2-r025", description="Dataset Digital Object Identifier")
    title: str = Field(
        "Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest (miRNA microarray data)",
        description="Official publication/study title",
    )
    study_type: str = Field(
        "Ground-based 70-day, 6-degree head-down tilt bed-rest study",
        description="Analogue study design",
    )
    organism: str = Field("Homo sapiens", description="Study organism")
    tissue: str = Field("Vastus lateralis skeletal muscle", description="Tissue source for biopsies")
    technology: str = Field("Agilent miRNA microarray", description="Assay technology platform")
    participants: int = Field(22, description="Total healthy young male volunteer participants")
    total_samples: int = Field(44, description="Total microarray samples processed")
    probes_per_sample: int = Field(50980, description="Target human miRNA probes per sample")
    dataset_url: str = Field(
        "https://osdr.nasa.gov/bio/repo/data/studies/OSD-946",
        description="Official NASA OSDR study URL",
    )


class OSD946Statistics(BaseModel):
    """Aggregate statistics derived across all processed OSD-946 samples."""

    total_samples: int = Field(..., description="Total samples in dataset")
    total_human_probes_per_sample: int = Field(..., description="Human miRNA probes evaluated per sample")
    mean_detection_percent: float = Field(..., description="Mean technical detection percentage across all samples")
    min_detection_percent: float = Field(..., description="Minimum detection percentage observed across any sample")
    max_detection_percent: float = Field(..., description="Maximum detection percentage observed across any sample")
    total_detected_probes: int = Field(..., description="Total detected probe calls across entire dataset")
    cohorts_count: int = Field(..., description="Number of distinct study cohorts (CON, EX, FLY)")


class OSD946ScientificNotice(BaseModel):
    """Scientific integrity and data classification notices."""

    data_classification: str = Field(
        "Ground-based analogue research data (NASA OSDR / GeneLab)",
        description="Data provenance classification",
    )
    telemetry_boundary: str = Field(
        "This dataset represents ground-based bed-rest research, NOT live astronaut biometric telemetry.",
        description="Boundary between research data and operational telemetry",
    )
    qc_interpretation: str = Field(
        "Probe detection percentage is a technical microarray hybridization QC indicator "
        "(gIsGeneDetected == 1), NOT a clinical health measurement, muscle atrophy severity score, "
        "or clinical countermeasure outcome.",
        description="Proper scientific interpretation of the detection percentage",
    )
    validation_status: str = Field(
        "Technical probe completeness verified (50,980 probes/sample across 44 samples). "
        "Biological differential expression analysis and application integration are pending.",
        description="Current workflow and validation status",
    )


class OSD946OverviewResponse(BaseModel):
    """Complete study overview, metadata, statistics, and cohort summaries."""

    metadata: OSD946Metadata
    scientific_notice: OSD946ScientificNotice
    statistics: OSD946Statistics
    group_summaries: List[OSD946GroupSummary]


class OSD946SampleListResponse(BaseModel):
    """List of individual sample QC records with total count and scientific notice."""

    total_count: int
    scientific_notice: OSD946ScientificNotice
    samples: List[OSD946SampleQC]


class OSD946GroupListResponse(BaseModel):
    """List of group-level summaries with total count and scientific notice."""

    total_groups: int
    scientific_notice: OSD946ScientificNotice
    groups: List[OSD946GroupSummary]
