"""
SPACECARE Hazard Preprocessor: Isolation and Confinement.
Processes sleep architecture, workload indices, and subjective wellbeing metrics.

NON-DIAGNOSTIC NOTICE:
This module processes behavioural and reported wellbeing indicators for mission
performance tracking. It does NOT diagnose psychological conditions.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.base_hazard import BaseHazardPreprocessor
from app.ml.preprocessing.validator import DataQualityReport

# Biological and psychometric bounds
ISOLATION_BOUNDS: Dict[str, Tuple[float, float]] = {
    "sleep_duration": (0.0, 24.0),           # hours per sleep period
    "sleep_quality": (0.0, 100.0),           # percentage or score 0-100
    "stress_indicator": (0.0, 100.0),        # subjective score 0-10 or 0-100
    "wellbeing_score": (0.0, 100.0),         # reported wellbeing index 0-100
    "workload_index": (0.0, 100.0),          # NASA-TLX equivalent 0-100
}


class IsolationConfinementPreprocessor(BaseHazardPreprocessor):
    """
    Processes isolation and confinement metrics:
    - Tracks sleep duration, sleep debt, and sleep quality trajectories.
    - Monitors operational workload changes and self-reported stress indicators.
    - Preserves data source provenance and non-diagnostic integrity.

    ASSUMPTION / REFERENCE NOTICE:
    The target sleep parameter is an operational mission scheduling reference
    (NASA standard timeline guideline: nominal 8.0h); it is NOT a universal clinical
    requirement, as individual sleep architecture varies significantly.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        target_sleep_hours: float = 8.0,
        reference_target_sleep_hours: Optional[float] = None,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        super().__init__(
            hazard_category=HazardCategory.ISOLATION_CONFINEMENT,
            rolling_window=rolling_window,
            default_data_source=default_data_source,
            default_is_simulated=default_is_simulated,
            default_dataset_reference=default_dataset_reference
        )
        # Support both names with priority to reference_target_sleep_hours
        self.reference_target_sleep_hours = reference_target_sleep_hours or target_sleep_hours
        self.target_sleep_hours = self.reference_target_sleep_hours

    def process(
        self,
        df: pd.DataFrame,
        unit_sleep: str = "hours",
        unit_workload: str = "NASA-TLX-score",
        reference_target_sleep_hours: Optional[float] = None
    ) -> Tuple[pd.DataFrame, DataQualityReport, HazardMetadata]:
        """
        Processes isolation and confinement time series.
        """
        target_hours = reference_target_sleep_hours or self.reference_target_sleep_hours
        metadata = HazardMetadata(
            hazard_category=self.hazard_category,
            data_source=self.default_data_source,
            is_simulated=self.default_is_simulated,
            dataset_reference=self.default_dataset_reference,
            original_units={"sleep_duration": unit_sleep, "workload_index": unit_workload},
            conversion_notes={"target_sleep_hours": f"Operational timeline reference setpoint: {target_hours}h"}
        )

        cleaned, report = self.validate_and_normalize_time(df, bounds=ISOLATION_BOUNDS)
        if cleaned.empty:
            return cleaned, report, metadata

        out = cleaned.copy()

        # 1. Sleep Deficit Tracking (Target Baseline - Actual Sleep)
        if "sleep_duration" in out.columns:
            out["sleep_debt_hours"] = np.maximum(0.0, target_hours - out["sleep_duration"])

        # 2. Causal First Differences (Detect sudden acute drops in sleep or spikes in workload)
        diff_cols = [c for c in ["sleep_duration", "sleep_quality", "workload_index", "stress_indicator"] if c in out.columns]
        out = self.compute_causal_step_diff(out, diff_cols)

        # 3. Causal Rolling Statistics (5-day or 5-reading smoothing)
        rolling_cols = [c for c in ["sleep_duration", "sleep_quality", "workload_index", "stress_indicator", "wellbeing_score"] if c in out.columns]
        out = self.compute_causal_rolling(out, rolling_cols, window=self.rolling_window)

        # Preserve metadata
        out["reference_target_sleep_hours"] = target_hours
        out["target_sleep_hours"] = target_hours
        out["original_unit_sleep"] = unit_sleep
        out["original_unit_workload"] = unit_workload

        return out, report, metadata
