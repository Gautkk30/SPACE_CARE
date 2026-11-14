"""
Extensible Base Hazard Preprocessor for SPACECARE.
Provides standardized time-series ingestion, chronological ordering,
duplicate detection, missing value auditing, and causal rolling statistics
across all five NASA spaceflight hazard domains.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.validator import DataQualityReport
from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata


class BaseHazardPreprocessor(ABC):
    """
    Common extensible interface for domain-specific spaceflight hazard processors.
    Enforces time-series integrity, unit provenance, and data leakage safeguards.
    """

    def __init__(
        self,
        hazard_category: HazardCategory,
        rolling_window: int = 5,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        self.hazard_category = hazard_category
        self.rolling_window = rolling_window
        self.default_data_source = default_data_source
        self.default_is_simulated = default_is_simulated
        self.default_dataset_reference = default_dataset_reference

    def validate_and_normalize_time(
        self,
        df: pd.DataFrame,
        bounds: Optional[Dict[str, Tuple[float, float]]] = None
    ) -> Tuple[pd.DataFrame, DataQualityReport]:
        """
        Common validation: parses UTC timestamps, sorts chronologically,
        audits duplicates, missing values, and biological/physical validity ranges.
        """
        report = DataQualityReport(total_received=len(df))
        if df.empty:
            return df.copy(), report

        cleaned = df.copy()

        # 1. Normalize timestamp to UTC
        if "timestamp" not in cleaned.columns:
            raise KeyError(f"Data for hazard '{self.hazard_category.value}' must contain a 'timestamp' column.")
        cleaned["timestamp"] = pd.to_datetime(cleaned["timestamp"], utc=True)

        # 2. Chronological sorting
        sort_cols = ["astronaut_id", "timestamp"] if "astronaut_id" in cleaned.columns else ["timestamp"]
        cleaned = cleaned.sort_values(by=sort_cols).reset_index(drop=True)

        # 3. Duplicate timestamp detection
        dup_mask = cleaned.duplicated(subset=sort_cols, keep="first")
        report.duplicates_removed = int(dup_mask.sum())
        if report.duplicates_removed > 0:
            report.exclusions.append(f"Removed {report.duplicates_removed} duplicate timestamps.")
            cleaned = cleaned[~dup_mask].reset_index(drop=True)

        # 4. Missing value auditing (never silent imputation)
        invalid_mask = pd.Series(False, index=cleaned.index)
        for col in cleaned.columns:
            if col in ["astronaut_id", "timestamp", "data_source", "is_simulated", "dataset_reference", "hazard_category"]:
                continue
            if pd.api.types.is_numeric_dtype(cleaned[col]):
                missing_cnt = int(cleaned[col].isna().sum())
                report.missing_counts[col] = missing_cnt
                if missing_cnt > 0:
                    report.exclusions.append(f"Column '{col}' had {missing_cnt} missing values; rows excluded.")
                    invalid_mask = invalid_mask | cleaned[col].isna()

        # 5. Physical bounds validation
        if bounds:
            for col, (min_v, max_v) in bounds.items():
                if col in cleaned.columns:
                    cleaned[col] = pd.to_numeric(cleaned[col], errors="coerce")
                    oob = (cleaned[col] < min_v) | (cleaned[col] > max_v)
                    oob_cnt = int(oob.sum())
                    report.invalid_range_counts[col] = oob_cnt
                    if oob_cnt > 0:
                        report.exclusions.append(
                            f"Column '{col}' had {oob_cnt} readings outside physical limits [{min_v}, {max_v}]."
                        )
                        invalid_mask = invalid_mask | oob

        if invalid_mask.any():
            cleaned = cleaned[~invalid_mask].reset_index(drop=True)

        # 6. Ensure provenance tags
        if "hazard_category" not in cleaned.columns:
            cleaned["hazard_category"] = self.hazard_category.value
        if "data_source" not in cleaned.columns:
            cleaned["data_source"] = self.default_data_source
        if "is_simulated" not in cleaned.columns:
            cleaned["is_simulated"] = self.default_is_simulated
        if "dataset_reference" not in cleaned.columns:
            cleaned["dataset_reference"] = self.default_dataset_reference

        report.valid_rows_retained = len(cleaned)
        return cleaned, report

    @staticmethod
    def compute_causal_rolling(
        df: pd.DataFrame,
        columns: List[str],
        window: int = 5
    ) -> pd.DataFrame:
        """
        Computes rolling mean and standard deviation strictly looking backward (closed='right')
        to prevent future-data leakage in time series forecasting or anomaly detection.
        """
        out = df.copy()
        for col in columns:
            if col in out.columns:
                rolling = out[col].rolling(window=window, min_periods=1, closed="right")
                out[f"{col}_rolling_mean_{window}"] = rolling.mean()
                out[f"{col}_rolling_std_{window}"] = rolling.std().fillna(0.0)
        return out

    @staticmethod
    def compute_causal_step_diff(
        df: pd.DataFrame,
        columns: List[str]
    ) -> pd.DataFrame:
        """
        Calculates first differences (step-to-step velocity: x[t] - x[t-1]).
        First row difference defaults to 0.0 without inventing readings.
        """
        out = df.copy()
        for col in columns:
            if col in out.columns:
                out[f"{col}_diff_step"] = out[col].diff().fillna(0.0)
        return out

    @abstractmethod
    def process(
        self,
        df: pd.DataFrame,
        **kwargs
    ) -> Tuple[pd.DataFrame, DataQualityReport]:
        """Domain-specific hazard processing pipeline."""
        pass
