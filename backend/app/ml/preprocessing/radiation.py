"""
SPACECARE Hazard Preprocessor: Space Radiation.
Processes active dosimeter readings, dose rates, exposure durations,
and cumulative radiation accrual while strictly preserving original units and provenance.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.base_hazard import BaseHazardPreprocessor
from app.ml.preprocessing.validator import DataQualityReport

# Physical bounds for space radiation measurements
RADIATION_BOUNDS: Dict[str, Tuple[float, float]] = {
    "dose_rate": (0.0, 500_000.0),         # uSv/h (0 up to extreme solar particle events)
    "dose": (0.0, 10_000_000.0),           # uSv
    "exposure_duration": (0.0, 86_400.0),  # seconds per reading window
}

# Nominal background Galactic Cosmic Radiation (GCR) in interplanetary transit
NOMINAL_DEEP_SPACE_BACKGROUND_USV_HR = 20.0


class SpaceRadiationPreprocessor(BaseHazardPreprocessor):
    """
    Processes Space Radiation data:
    - Standardizes dose rate to uSv/h while preserving original units and conversion notes.
    - Computes cumulative mission dose accrual.
    - Calculates rolling exposure statistics and Solar Particle Event (SPE) elevation ratios.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        super().__init__(
            hazard_category=HazardCategory.SPACE_RADIATION,
            rolling_window=rolling_window,
            default_data_source=default_data_source,
            default_is_simulated=default_is_simulated,
            default_dataset_reference=default_dataset_reference
        )

    def process(
        self,
        df: pd.DataFrame,
        unit_dose_rate: str = "uSv/h",
        unit_dose: str = "uSv",
        radiation_quality_factor: Optional[float] = None,
        initial_interval_seconds: Optional[float] = 0.0
    ) -> Tuple[pd.DataFrame, DataQualityReport, HazardMetadata]:
        """
        Processes radiation telemetry without future data leakage.
        
        Args:
            df: Input dataframe containing 'timestamp' and 'dose_rate' (or 'dose').
            unit_dose_rate: Original unit ('uSv/h', 'mSv/h', 'mGy/day', 'mGy/h').
            unit_dose: Original dose unit ('uSv', 'mSv', 'mGy').
            radiation_quality_factor: Optional dimensionless radiation weighting / quality factor (Q).
                Required to convert physical absorbed dose (mGy) to equivalent dose (uSv).
                If omitted for mGy inputs, absorbed dose is preserved without conversion.
            initial_interval_seconds: Exposure duration in seconds for the first recorded timestamp.
                Defaults to 0.0s (monitoring onset has 0 prior elapsed accrual in-session).
        """
        metadata = HazardMetadata(
            hazard_category=self.hazard_category,
            data_source=self.default_data_source,
            is_simulated=self.default_is_simulated,
            dataset_reference=self.default_dataset_reference,
            original_units={"dose_rate": unit_dose_rate, "dose": unit_dose}
        )

        cleaned, report = self.validate_and_normalize_time(df, bounds=RADIATION_BOUNDS)
        if cleaned.empty:
            return cleaned, report, metadata

        out = cleaned.copy()

        # Scientific radiation conversion handling:
        # Absorbed dose (mGy) vs Equivalent dose (uSv)
        is_absorbed_dose = unit_dose_rate.lower() in ["mgy/day", "mgy/d", "mgy/h", "mgy"]

        if is_absorbed_dose:
            # First normalize absorbed dose rate to mGy/h
            if unit_dose_rate.lower() in ["mgy/day", "mgy/d"]:
                out["absorbed_dose_rate_mgy_h"] = out["dose_rate"] / 24.0
                metadata.conversion_notes["absorbed_dose_rate"] = "Normalized mGy/day to mGy/h (divided by 24.0)"
            else:
                out["absorbed_dose_rate_mgy_h"] = out["dose_rate"]

            if radiation_quality_factor is not None:
                # H (uSv/h) = D (mGy/h) * 1000 uGy/mGy * Q
                out["dose_rate"] = out["absorbed_dose_rate_mgy_h"] * 1000.0 * radiation_quality_factor
                metadata.conversion_notes["dose_rate"] = (
                    f"Converted absorbed dose rate (mGy/h) to equivalent dose rate (uSv/h) "
                    f"using explicit radiation quality factor Q={radiation_quality_factor}"
                )
            else:
                # Do not invent equivalent dose without radiation particle/energy spectrum
                metadata.conversion_notes["dose_rate"] = (
                    "Input represents physical absorbed dose (mGy/h). Not converted to equivalent dose (uSv/h) "
                    "because radiation quality factor (Q) was not specified."
                )
        elif unit_dose_rate.lower() == "msv/h":
            # Exact SI decimal prefix conversion: 1 mSv = 1000 uSv (both are equivalent dose)
            out["dose_rate"] = out["dose_rate"] * 1000.0
            metadata.conversion_notes["dose_rate"] = "Converted mSv/h to uSv/h (multiplied by 1000.0)"

        # 1. Causal Cumulative Exposure Integration
        if "cumulative_exposure" not in out.columns:
            if "dose" in out.columns:
                out["cumulative_exposure"] = out["dose"].cumsum()
            else:
                # Determine time interval for each reading window
                if "exposure_duration" in out.columns:
                    # Use explicit exposure duration column if provided
                    time_deltas_hours = out["exposure_duration"].fillna(0.0) / 3600.0
                else:
                    # Calculate actual elapsed time between consecutive timestamps
                    diff_seconds = out["timestamp"].diff().dt.total_seconds()
                    # First reading uses initial_interval_seconds (default 0.0s = onset of monitoring)
                    diff_seconds.iloc[0] = initial_interval_seconds if initial_interval_seconds is not None else 0.0
                    # Handle duplicate or negative timestamps cleanly
                    diff_seconds = diff_seconds.clip(lower=0.0).fillna(0.0)
                    time_deltas_hours = diff_seconds / 3600.0

                interval_dose = out["dose_rate"] * time_deltas_hours
                out["cumulative_exposure"] = interval_dose.cumsum()

        # 2. Causal First Differences (Detect sudden solar flare / particle events)
        out = self.compute_causal_step_diff(out, ["dose_rate"])

        # 3. Causal Rolling Statistics
        out = self.compute_causal_rolling(out, ["dose_rate"], window=self.rolling_window)

        # 4. Contextual Ratio relative to deep-space galactic cosmic ray background
        out["radiation_elevation_ratio"] = out["dose_rate"] / NOMINAL_DEEP_SPACE_BACKGROUND_USV_HR

        # Preserve provenance and units on dataframe
        out["original_unit_dose_rate"] = unit_dose_rate
        out["original_unit_dose"] = unit_dose
        if radiation_quality_factor is not None:
            out["radiation_quality_factor"] = radiation_quality_factor

        return out, report, metadata
