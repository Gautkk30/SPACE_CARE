#!/usr/bin/env python3
"""
NASA OSD-946 / GLDS-773 miRNA Microarray Quality Control Analysis
=================================================================

This script reproduces the quality-control (QC) assessment for the raw Agilent
miRNA microarray datasets from NASA Open Science Data Repository (OSDR) study
OSD-946 / GLDS-773 (GSE226504): "Exercise Training Attenuates the Muscle
Mitochondria Genomic Response to Bed Rest".

Analysis Steps:
1. Locate and iterate through all gzip-compressed Agilent Feature Extraction
   files (.txt.gz) in the raw miRNA microarray data directory.
2. Parse the Agilent FEATURES section to locate probe annotations and flags:
   - SystematicName (identifies human miRNA probes starting with 'hsa-')
   - gIsGeneDetected (detection call flag: 1 = detected, 0 = undetected)
3. Count total human miRNA probes and detected probes per sample.
4. Extract experimental condition metadata (Group: CON, EX, FLY; Time: PRE, POST)
   from standard sample file naming conventions.
5. Calculate detection percentages per sample.
6. Aggregate results to produce group/time level summaries (mean, min, max).
7. Output QC summary tables to CSV:
   - data/raw/nasa/osd946/qc_summary.csv
   - data/raw/nasa/osd946/qc_group_summary.csv
8. Validate processing against expected counts (44 samples, 50,980 probes each).
"""

from __future__ import annotations

import argparse
import csv
import gzip
import logging
import os
from pathlib import Path
import re
import sys
from typing import Any, Dict, List, Optional, Tuple

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("osd946_qc")

# Expected analysis constants
EXPECTED_SAMPLE_COUNT = 44
EXPECTED_HUMAN_PROBE_COUNT = 50980
EXPECTED_GROUP_SUMMARIES_COUNT = 6
HUMAN_PROBE_PREFIX = "hsa-"

# Regex pattern for extracting group and time point from filenames
FILENAME_PATTERN = re.compile(
    r"_(?P<group>CON|EX|FLY)__?\d+_(?P<time>PRE|POST)_", re.IGNORECASE
)


def extract_metadata_from_filename(filename: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract experimental group (CON, EX, FLY) and time point (PRE, POST)
    from the file name.

    Parameters
    ----------
    filename : str
        Name of the microarray data file.

    Returns
    -------
    Tuple[Optional[str], Optional[str]]
        (group, time) tuple in uppercase, or (None, None) if parsing fails.
    """
    match = FILENAME_PATTERN.search(filename)
    if match:
        return match.group("group").upper(), match.group("time").upper()

    # Fallback to loose component extraction if standard pattern fails
    group_match = re.search(r"\b(CON|EX|FLY)\b", filename, re.IGNORECASE)
    time_match = re.search(r"\b(PRE|POST)\b", filename, re.IGNORECASE)

    group = group_match.group(1).upper() if group_match else None
    time = time_match.group(1).upper() if time_match else None
    return group, time


def parse_agilent_fe_file(file_path: Path) -> Dict[str, Any]:
    """
    Parse an Agilent Feature Extraction (.txt.gz) file and compute
    human miRNA probe detection metrics.

    Parameters
    ----------
    file_path : Path
        Path to the gzipped Agilent Feature Extraction text file.

    Returns
    -------
    Dict[str, Any]
        Dictionary with sample metrics including total probes, detected probes,
        and detection percentage.

    Raises
    ------
    ValueError
        If the FEATURES block or required columns are missing.
    """
    filename = file_path.name
    group, time = extract_metadata_from_filename(filename)
    if not group or not time:
        raise ValueError(
            f"Could not extract experimental group and time from filename: {filename}"
        )

    total_human_probes = 0
    detected_human_probes = 0

    with gzip.open(file_path, mode="rt", encoding="utf-8", errors="replace") as gz_file:
        in_features_block = False
        sys_name_col: Optional[int] = None
        is_detected_col: Optional[int] = None

        for line_num, line in enumerate(gz_file, start=1):
            line = line.strip("\r\n")
            if not line:
                continue

            parts = line.split("\t")

            # Check for header of the FEATURES section
            if parts[0] == "FEATURES":
                in_features_block = True
                try:
                    sys_name_col = parts.index("SystematicName")
                except ValueError:
                    raise ValueError(
                        f"Missing 'SystematicName' column in FEATURES header (line {line_num})"
                    )
                try:
                    is_detected_col = parts.index("gIsGeneDetected")
                except ValueError:
                    raise ValueError(
                        f"Missing 'gIsGeneDetected' column in FEATURES header (line {line_num})"
                    )
                continue

            if in_features_block:
                # Feature records start with "DATA"
                if parts[0] != "DATA":
                    # End of FEATURES block
                    break

                if len(parts) <= max(sys_name_col, is_detected_col):
                    continue

                sys_name = parts[sys_name_col]

                # Identify human miRNA probes (SystematicName begins with 'hsa-')
                if sys_name.startswith(HUMAN_PROBE_PREFIX):
                    total_human_probes += 1
                    if parts[is_detected_col] == "1":
                        detected_human_probes += 1

    if not in_features_block:
        raise ValueError(f"No 'FEATURES' section found in file: {filename}")

    if total_human_probes == 0:
        raise ValueError(f"No human miRNA probes found starting with '{HUMAN_PROBE_PREFIX}' in {filename}")

    detection_percent = round((detected_human_probes / total_human_probes) * 100, 2)

    return {
        "Sample": filename,
        "Group": group,
        "Time": time,
        "TotalProbes": total_human_probes,
        "DetectedProbes": detected_human_probes,
        "DetectionPercent": detection_percent,
    }


def compute_group_summaries(samples: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Calculate summary statistics (average, min, max detection percent)
    for each group and time point.

    Parameters
    ----------
    samples : List[Dict[str, Any]]
        List of parsed sample records.

    Returns
    -------
    List[Dict[str, Any]]
        Group-level summary records sorted by Group and Time.
    """
    grouped_data: Dict[Tuple[str, str], List[float]] = {}
    for sample in samples:
        key = (sample["Group"], sample["Time"])
        grouped_data.setdefault(key, []).append(sample["DetectionPercent"])

    group_summaries: List[Dict[str, Any]] = []
    # Sort keys alphabetically: ('CON', 'POST'), ('CON', 'PRE'), etc.
    for key in sorted(grouped_data.keys()):
        rates = grouped_data[key]
        count = len(rates)
        avg_rate = round(sum(rates) / count, 2)
        min_rate = min(rates)
        max_rate = max(rates)

        group_summaries.append({
            "Group": key[0],
            "Time": key[1],
            "Samples": count,
            "AverageDetection": avg_rate,
            "Minimum": min_rate,
            "Maximum": max_rate,
        })

    return group_summaries


def write_csv(
    file_path: Path,
    headers: List[str],
    rows: List[Dict[str, Any]],
) -> None:
    """
    Write records to a CSV file with all fields quoted.

    Parameters
    ----------
    file_path : Path
        Destination CSV file path.
    headers : List[str]
        List of column headers.
    rows : List[Dict[str, Any]]
        List of record dictionaries.
    """
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, mode="w", newline="", encoding="utf-8") as csv_file:
        writer = csv.writer(csv_file, quoting=csv.QUOTE_ALL)
        writer.writerow(headers)
        for row in rows:
            writer.writerow([row[h] for h in headers])


def process_qc(
    input_dir: Path,
    output_dir: Path,
    verbose: bool = False,
) -> bool:
    """
    Execute full QC pipeline on all raw Agilent files in input_dir and
    generate output CSVs in output_dir.

    Parameters
    ----------
    input_dir : Path
        Directory containing .txt.gz files.
    output_dir : Path
        Directory where summary CSVs will be saved.
    verbose : bool
        If True, print detailed probe info for each sample.

    Returns
    -------
    bool
        True if processing completed successfully with all expected validations.
    """
    if not input_dir.exists():
        logger.error(f"Input directory not found: {input_dir}")
        return False

    files = sorted([f for f in input_dir.iterdir() if f.is_file() and f.name.endswith(".txt.gz")])
    total_files = len(files)

    if total_files == 0:
        logger.error(f"No .txt.gz files found in: {input_dir}")
        return False

    logger.info(f"Discovered {total_files} .txt.gz files in {input_dir}")
    print(f"\nProcessing {total_files} Agilent Feature Extraction files...")
    print("=" * 80)

    sample_results: List[Dict[str, Any]] = []
    errors: List[Tuple[str, str]] = []

    for idx, file_path in enumerate(files, start=1):
        try:
            sample_data = parse_agilent_fe_file(file_path)
            sample_results.append(sample_data)

            progress_msg = (
                f"[{idx:02d}/{total_files:02d}] {sample_data['Sample']} | "
                f"Group: {sample_data['Group']:<3} Time: {sample_data['Time']:<4} | "
                f"Human probes: {sample_data['TotalProbes']:,} | "
                f"Detected: {sample_data['DetectedProbes']:,} ({sample_data['DetectionPercent']:.2f}%)"
            )
            print(progress_msg)

        except Exception as exc:
            logger.error(f"Error processing {file_path.name}: {exc}")
            errors.append((file_path.name, str(exc)))
            print(f"[{idx:02d}/{total_files:02d}] ERROR {file_path.name}: {exc}")

    print("=" * 80)

    # Report errors if any
    if errors:
        logger.warning(f"{len(errors)} file(s) failed processing:")
        for fname, err in errors:
            print(f"  - {fname}: {err}")

    processed_count = len(sample_results)
    print(f"\nSuccessfully processed {processed_count}/{total_files} samples.")

    if processed_count == 0:
        logger.error("No samples were successfully parsed. Aborting summary generation.")
        return False

    # Compute group summaries
    group_summaries = compute_group_summaries(sample_results)

    # Output file paths
    summary_csv_path = output_dir / "qc_summary.csv"
    group_summary_csv_path = output_dir / "qc_group_summary.csv"

    sample_headers = ["Sample", "TotalProbes", "DetectedProbes", "DetectionPercent"]
    group_headers = ["Group", "Time", "Samples", "AverageDetection", "Minimum", "Maximum"]

    # Write CSV files
    write_csv(summary_csv_path, sample_headers, sample_results)
    logger.info(f"Saved sample QC summary to: {summary_csv_path}")

    write_csv(group_summary_csv_path, group_headers, group_summaries)
    logger.info(f"Saved group QC summary to: {group_summary_csv_path}")

    # Display group summary table
    print("\nGroup-Level Quality Control Summary:")
    print("-" * 65)
    print(f"{'Group':<8}{'Time':<8}{'Samples':<10}{'Average %':<14}{'Min %':<12}{'Max %':<12}")
    print("-" * 65)
    for g in group_summaries:
        print(
            f"{g['Group']:<8}{g['Time']:<8}{g['Samples']:<10}"
            f"{g['AverageDetection']:<14}{g['Minimum']:<12}{g['Maximum']:<12}"
        )
    print("-" * 65)

    # Validations
    validation_passed = True
    print("\nValidation Checks:")

    # 1. Check sample count
    if processed_count == EXPECTED_SAMPLE_COUNT:
        print(f"  [PASS] Sample count matches expected ({processed_count}/{EXPECTED_SAMPLE_COUNT})")
    else:
        print(f"  [WARN] Sample count differs from expected ({processed_count} vs {EXPECTED_SAMPLE_COUNT})")
        validation_passed = False

    # 2. Check probe count per sample
    deviant_probe_samples = [
        s["Sample"] for s in sample_results if s["TotalProbes"] != EXPECTED_HUMAN_PROBE_COUNT
    ]
    if not deviant_probe_samples:
        print(f"  [PASS] All {processed_count} samples have exactly {EXPECTED_HUMAN_PROBE_COUNT:,} human miRNA probes")
    else:
        print(f"  [WARN] {len(deviant_probe_samples)} samples do not have {EXPECTED_HUMAN_PROBE_COUNT:,} probes")
        validation_passed = False

    # 3. Check group summaries count
    if len(group_summaries) == EXPECTED_GROUP_SUMMARIES_COUNT:
        print(f"  [PASS] Group/time summaries count matches expected ({len(group_summaries)}/{EXPECTED_GROUP_SUMMARIES_COUNT})")
    else:
        print(f"  [WARN] Group summaries count differs ({len(group_summaries)} vs {EXPECTED_GROUP_SUMMARIES_COUNT})")
        validation_passed = False

    print("=" * 80)
    return validation_passed


def main() -> None:
    """CLI Entry point."""
    repo_root = Path(__file__).resolve().parent.parent
    default_input_dir = repo_root / "data" / "raw" / "nasa" / "osd946" / "miRNA-array"
    default_output_dir = repo_root / "data" / "raw" / "nasa" / "osd946"

    parser = argparse.ArgumentParser(
        description="Reproduce NASA OSD-946 / GLDS-773 miRNA microarray QC analysis."
    )
    parser.add_argument(
        "--input-dir",
        type=Path,
        default=default_input_dir,
        help=f"Directory containing raw Agilent .txt.gz files (default: {default_input_dir})",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=default_output_dir,
        help=f"Directory to write output summary CSV files (default: {default_output_dir})",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        help="Enable verbose output logging",
    )

    args = parser.parse_args()

    if args.verbose:
        logger.setLevel(logging.DEBUG)

    success = process_qc(
        input_dir=args.input_dir,
        output_dir=args.output_dir,
        verbose=args.verbose,
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
