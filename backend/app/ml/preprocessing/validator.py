"""
Data Quality Validation and Normalization for SPACECARE Telemetry.
Handles timestamp parsing, UTC normalization, chronological ordering,
duplicate detection, missing value auditing, and physiological validity checks.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple, Literal
import numpy as np
import pandas as pd


# Biologically and technologically plausible bounds for human vital signs
PHYSIOLOGICAL_BOUNDS = {
    "heart_rate": (25.0, 240.0),            # bpm
    "systolic_bp": (50.0, 250.0),           # mmHg
    "diastolic_bp": (30.0, 150.0),          # mmHg
    "spo2": (60.0, 100.0),                  # %
    "body_temperature": (32.0, 43.0),       # °C
    "respiration_rate": (4.0, 55.0),        # breaths/min
}


@dataclass
class DataQualityReport:
    """Detailed audit of data quality, exclusions, and integrity checks."""
    total_received: int = 0
    duplicates_removed: int = 0
    missing_counts: Dict[str, int] = field(default_factory=dict)
    invalid_range_counts: Dict[str, int] = field(default_factory=dict)
    consistency_violations: int = 0
    valid_rows_retained: int = 0
    exclusions: List[str] = field(default_factory=list)

    def is_clean(self) -> bool:
        """Returns True if no duplicates, missing, or invalid values were detected."""
        return (
            self.duplicates_removed == 0
            and sum(self.missing_counts.values()) == 0
            and sum(self.invalid_range_counts.values()) == 0
            and self.consistency_violations == 0
        )

    def summary(self) -> str:
        lines = [
            f"Data Quality Audit: {self.valid_rows_retained}/{self.total_received} valid readings retained.",
            f" - Duplicates removed: {self.duplicates_removed}",
            f" - Missing values: {self.missing_counts}",
            f" - Out-of-bounds readings: {self.invalid_range_counts}",
            f" - Consistency violations (e.g. Sys <= Dia): {self.consistency_violations}"
        ]
        if self.exclusions:
            lines.append(" - Exclusions documented:")
            for exc in self.exclusions[:5]:
                lines.append(f"    * {exc}")
            if len(self.exclusions) > 5:
                lines.append(f"    * ... and {len(self.exclusions) - 5} more.")
        return "\n".join(lines)


class TelemetryValidator:
    """
    Validates and normalizes telemetry datasets.
    Strictly documents every missing, invalid, or duplicate reading without silent imputation.
    """

    def __init__(
        self,
        bounds: Optional[Dict[str, Tuple[float, float]]] = None,
        drop_duplicates: bool = True,
        drop_invalid: bool = True
    ):
        self.bounds = bounds or PHYSIOLOGICAL_BOUNDS
        self.drop_duplicates = drop_duplicates
        self.drop_invalid = drop_invalid

    def validate_and_clean(
        self,
        df: pd.DataFrame
    ) -> Tuple[pd.DataFrame, DataQualityReport]:
        """
        Parses timestamps, sorts chronologically, audits missing/invalid readings,
        and produces a clean dataframe alongside a comprehensive quality report.
        """
        report = DataQualityReport(total_received=len(df))
        if df.empty:
            return df.copy(), report

        cleaned = df.copy()

        # 1. Timestamp Parsing and UTC Normalization
        if "timestamp" in cleaned.columns:
            cleaned["timestamp"] = pd.to_datetime(cleaned["timestamp"], utc=True)
        else:
            raise ValueError("Telemetry dataframe must contain a 'timestamp' column.")

        # 2. Sort chronologically per astronaut
        sort_cols = ["astronaut_id", "timestamp"] if "astronaut_id" in cleaned.columns else ["timestamp"]
        cleaned = cleaned.sort_values(by=sort_cols).reset_index(drop=True)

        # 3. Duplicate Detection
        dup_mask = cleaned.duplicated(subset=sort_cols, keep="first")
        report.duplicates_removed = int(dup_mask.sum())
        if report.duplicates_removed > 0:
            report.exclusions.append(f"Removed {report.duplicates_removed} duplicate timestamps for same astronaut.")
            if self.drop_duplicates:
                cleaned = cleaned[~dup_mask].reset_index(drop=True)

        # 4. Missing-Value Auditing
        core_metrics = [
            "heart_rate", "systolic_bp", "diastolic_bp",
            "spo2", "body_temperature", "respiration_rate"
        ]
        invalid_mask = pd.Series(False, index=cleaned.index)

        for col in core_metrics:
            if col in cleaned.columns:
                # Convert to numeric
                cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")
                missing_count = int(cleaned[col].isna().sum())
                report.missing_counts[col] = missing_count
                if missing_count > 0:
                    report.exclusions.append(f"Column '{col}' has {missing_count} missing (NaN) values.")
                    invalid_mask = invalid_mask | cleaned[col].isna()

        # 5. Physiological Bounds Validation
        for col, (min_val, max_val) in self.bounds.items():
            if col in cleaned.columns:
                out_of_bounds = (cleaned[col] < min_val) | (cleaned[col] > max_val)
                oob_count = int(out_of_bounds.sum())
                report.invalid_range_counts[col] = oob_count
                if oob_count > 0:
                    report.exclusions.append(
                        f"Column '{col}' had {oob_count} readings outside plausible human range [{min_val}, {max_val}]."
                    )
                    invalid_mask = invalid_mask | out_of_bounds

        # 6. Physiological Consistency: Systolic BP must be strictly greater than Diastolic BP
        if "systolic_bp" in cleaned.columns and "diastolic_bp" in cleaned.columns:
            inconsistent = cleaned["systolic_bp"] <= cleaned["diastolic_bp"]
            report.consistency_violations = int(inconsistent.sum())
            if report.consistency_violations > 0:
                report.exclusions.append(
                    f"Detected {report.consistency_violations} readings where systolic BP <= diastolic BP."
                )
                invalid_mask = invalid_mask | inconsistent

        # Apply filtering if configured
        if self.drop_invalid and invalid_mask.any():
            cleaned = cleaned[~invalid_mask].reset_index(drop=True)

        report.valid_rows_retained = len(cleaned)
        return cleaned, report
