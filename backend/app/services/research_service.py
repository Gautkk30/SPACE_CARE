"""
OSD-946 Research Data Service
=============================

Service layer for reading, validating, and serving NASA OSD-946 / GLDS-773
miRNA microarray quality control datasets.

Scientific Integrity Notice:
OSD-946 is an open research dataset from a 70-day head-down tilt bed-rest study
evaluating vastus lateralis muscle tissue biopsies. These data reflect technical
hybridization detection metrics and are not live astronaut biometric telemetry.
"""

from __future__ import annotations

import csv
import logging
import os
from pathlib import Path
import re
from typing import List, Optional, Set

from app.schemas.research import (
    OSD946GroupSummary,
    OSD946Metadata,
    OSD946OverviewResponse,
    OSD946SampleQC,
    OSD946ScientificNotice,
    OSD946Statistics,
)

logger = logging.getLogger("research_service")

# Required CSV headers for schema validation
EXPECTED_SAMPLE_CSV_COLUMNS: Set[str] = {
    "Sample",
    "TotalProbes",
    "DetectedProbes",
    "DetectionPercent",
}

EXPECTED_GROUP_CSV_COLUMNS: Set[str] = {
    "Group",
    "Time",
    "Samples",
    "AverageDetection",
    "Minimum",
    "Maximum",
}

# Regex patterns for parsing GSM accession and sample metadata from filenames
GSM_PATTERN = re.compile(r"(GSM\d+)", re.IGNORECASE)
METADATA_PATTERN = re.compile(
    r"_(?P<group>CON|EX|FLY)__?(?P<subject>\d+)_(?P<time>PRE|POST)_",
    re.IGNORECASE,
)


def get_osd946_data_dir() -> Path:
    """
    Locate the OSD-946 raw data directory.

    Searches across standard repository and runtime working directories:
    1. OSD946_DATA_DIR environment variable (if defined).
    2. Relative to current working directory (e.g. repo root: data/raw/nasa/osd946).
    3. Relative to parent directory (if executing inside backend/).
    4. Relative to this module's file location.

    Returns
    -------
    Path
        Directory containing qc_summary.csv and qc_group_summary.csv.
    """
    env_dir = os.getenv("OSD946_DATA_DIR")
    if env_dir:
        candidate = Path(env_dir)
        if candidate.exists():
            return candidate

    cwd = Path.cwd()
    candidate_paths = [
        cwd / "data" / "raw" / "nasa" / "osd946",
        cwd.parent / "data" / "raw" / "nasa" / "osd946",
        Path(__file__).resolve().parents[4] / "data" / "raw" / "nasa" / "osd946",
    ]

    for path in candidate_paths:
        if path.exists() and (path / "qc_summary.csv").is_file():
            return path

    # Fallback to the first standard repo path
    return candidate_paths[0]


def parse_sample_metadata(filename: str) -> tuple[str, Optional[int], str, str]:
    """
    Extract GSM accession, participant subject ID, experimental group,
    and timepoint from the raw file name.

    Parameters
    ----------
    filename : str
        Sample file name (e.g. GLDS-773_miRNA-array_GSM7078076_CON__1_POST_miRNA.txt.gz).

    Returns
    -------
    tuple[str, Optional[int], str, str]
        (gsm_accession, subject_id, group, time)
    """
    gsm_match = GSM_PATTERN.search(filename)
    gsm_accession = gsm_match.group(1).upper() if gsm_match else "UNKNOWN"

    meta_match = METADATA_PATTERN.search(filename)
    if meta_match:
        group = meta_match.group("group").upper()
        subject_id = int(meta_match.group("subject"))
        time = meta_match.group("time").upper()
    else:
        # Fallback to loose extraction
        group_match = re.search(r"\b(CON|EX|FLY)\b", filename, re.IGNORECASE)
        time_match = re.search(r"\b(PRE|POST)\b", filename, re.IGNORECASE)
        group = group_match.group(1).upper() if group_match else "UNKNOWN"
        time = time_match.group(1).upper() if time_match else "UNKNOWN"
        subject_id = None

    return gsm_accession, subject_id, group, time


def load_sample_qc_summary(data_dir: Optional[Path] = None) -> List[OSD946SampleQC]:
    """
    Read and validate individual sample quality control metrics from qc_summary.csv.

    Parameters
    ----------
    data_dir : Optional[Path]
        Override data directory path.

    Returns
    -------
    List[OSD946SampleQC]
        List of parsed sample QC records.

    Raises
    ------
    FileNotFoundError
        If qc_summary.csv is missing.
    ValueError
        If required CSV headers are missing or data is malformed.
    """
    target_dir = data_dir or get_osd946_data_dir()
    csv_path = target_dir / "qc_summary.csv"

    if not csv_path.exists():
        raise FileNotFoundError(f"OSD-946 sample QC summary file not found: {csv_path}")

    samples: List[OSD946SampleQC] = []

    with open(csv_path, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError(f"Empty or headerless CSV file: {csv_path}")

        field_set = set(reader.fieldnames)
        missing_columns = EXPECTED_SAMPLE_CSV_COLUMNS - field_set
        if missing_columns:
            raise ValueError(
                f"Missing required columns in {csv_path.name}: {sorted(missing_columns)}"
            )

        for row_idx, row in enumerate(reader, start=2):
            sample_name = (row.get("Sample") or "").strip()
            if not sample_name:
                continue

            try:
                total_probes = int(row["TotalProbes"])
                detected_probes = int(row["DetectedProbes"])
                detection_percent = float(row["DetectionPercent"])
            except (ValueError, KeyError) as err:
                raise ValueError(
                    f"Malformed data types in {csv_path.name} at line {row_idx}: {err}"
                )

            gsm_acc, subject_id, group, time = parse_sample_metadata(sample_name)

            samples.append(
                OSD946SampleQC(
                    sample_id=sample_name,
                    gsm_accession=gsm_acc,
                    subject_id=subject_id,
                    group=group,
                    time=time,
                    total_probes=total_probes,
                    detected_probes=detected_probes,
                    detection_percent=detection_percent,
                )
            )

    return samples


def load_group_qc_summary(data_dir: Optional[Path] = None) -> List[OSD946GroupSummary]:
    """
    Read and validate cohort/timepoint quality control summaries from qc_group_summary.csv.

    Parameters
    ----------
    data_dir : Optional[Path]
        Override data directory path.

    Returns
    -------
    List[OSD946GroupSummary]
        List of parsed group summary records.

    Raises
    ------
    FileNotFoundError
        If qc_group_summary.csv is missing.
    ValueError
        If required CSV headers are missing or data is malformed.
    """
    target_dir = data_dir or get_osd946_data_dir()
    csv_path = target_dir / "qc_group_summary.csv"

    if not csv_path.exists():
        raise FileNotFoundError(f"OSD-946 group QC summary file not found: {csv_path}")

    groups: List[OSD946GroupSummary] = []

    with open(csv_path, mode="r", newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        if not reader.fieldnames:
            raise ValueError(f"Empty or headerless CSV file: {csv_path}")

        field_set = set(reader.fieldnames)
        missing_columns = EXPECTED_GROUP_CSV_COLUMNS - field_set
        if missing_columns:
            raise ValueError(
                f"Missing required columns in {csv_path.name}: {sorted(missing_columns)}"
            )

        for row_idx, row in enumerate(reader, start=2):
            try:
                group = row["Group"].strip()
                time = row["Time"].strip()
                sample_count = int(row["Samples"])
                avg_det = float(row["AverageDetection"])
                min_det = float(row["Minimum"])
                max_det = float(row["Maximum"])
            except (ValueError, KeyError) as err:
                raise ValueError(
                    f"Malformed data types in {csv_path.name} at line {row_idx}: {err}"
                )

            groups.append(
                OSD946GroupSummary(
                    group=group,
                    time=time,
                    samples=sample_count,
                    average_detection=avg_det,
                    minimum=min_det,
                    maximum=max_det,
                )
            )

    return groups


def get_osd946_overview(data_dir: Optional[Path] = None) -> OSD946OverviewResponse:
    """
    Assemble the complete OSD-946 study overview, provenance metadata,
    dataset-wide statistics, and cohort summaries.

    Parameters
    ----------
    data_dir : Optional[Path]
        Override data directory path.

    Returns
    -------
    OSD946OverviewResponse
        Composite response with study metadata, statistics, and group summaries.
    """
    samples = load_sample_qc_summary(data_dir)
    groups = load_group_qc_summary(data_dir)

    total_samples = len(samples)
    if total_samples == 0:
        raise ValueError("No samples available to compute aggregate statistics")

    pcts = [s.detection_percent for s in samples]
    mean_pct = round(sum(pcts) / total_samples, 2)
    min_pct = min(pcts)
    max_pct = max(pcts)
    total_detected = sum(s.detected_probes for s in samples)
    unique_cohorts = len(set(s.group for s in samples))

    stats = OSD946Statistics(
        total_samples=total_samples,
        total_human_probes_per_sample=samples[0].total_probes,
        mean_detection_percent=mean_pct,
        min_detection_percent=min_pct,
        max_detection_percent=max_pct,
        total_detected_probes=total_detected,
        cohorts_count=unique_cohorts,
    )

    return OSD946OverviewResponse(
        metadata=OSD946Metadata(),
        scientific_notice=OSD946ScientificNotice(),
        statistics=stats,
        group_summaries=groups,
    )


def find_sample_by_id(
    identifier: str, data_dir: Optional[Path] = None
) -> Optional[OSD946SampleQC]:
    """
    Look up an individual sample by either full filename or GSM accession.

    Parameters
    ----------
    identifier : str
        Sample filename or GSM accession (e.g. GSM7078076).
    data_dir : Optional[Path]
        Override data directory path.

    Returns
    -------
    Optional[OSD946SampleQC]
        Sample record if found, else None.
    """
    target = identifier.strip().upper()
    samples = load_sample_qc_summary(data_dir)

    for sample in samples:
        if (
            sample.sample_id.upper() == target
            or sample.gsm_accession.upper() == target
            or target in sample.sample_id.upper()
        ):
            return sample

    return None
