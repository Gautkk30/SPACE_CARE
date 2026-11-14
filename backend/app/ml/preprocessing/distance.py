"""
SPACECARE Hazard Preprocessor: Distance from Earth.
Processes trajectory metrics, communication latencies, and mission autonomy indices.

MISSION CONTEXT NOTICE:
These measurements provide environmental and operational context regarding telemedicine
latency and resource remoteness; they are NOT direct astronaut medical measurements.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.base_hazard import BaseHazardPreprocessor
from app.ml.preprocessing.validator import DataQualityReport

# Plausible bounds for human spaceflight missions (e.g., LEO to Mars transit)
DISTANCE_BOUNDS: Dict[str, Tuple[float, float]] = {
    "mission_duration_days": (0.0, 1500.0),      # days
    "distance_from_earth_km": (0.0, 450_000_000.0), # km (up to Mars aphelion)
    "communication_delay_sec": (0.0, 1500.0),    # seconds one-way latency (up to ~24 min)
    "medical_autonomy_index": (0.0, 100.0),      # score 0-100
}


class DistanceFromEarthPreprocessor(BaseHazardPreprocessor):
    """
    Processes Distance from Earth mission telemetry:
    - Normalizes distance and communication light-time latencies.
    - Tracks operational remoteness and medical isolation indices.
    - Preserves unit conversions and source designations.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        super().__init__(
            hazard_category=HazardCategory.DISTANCE_FROM_EARTH,
            rolling_window=rolling_window,
            default_data_source=default_data_source,
            default_is_simulated=default_is_simulated,
            default_dataset_reference=default_dataset_reference
        )

    def process(
        self,
        df: pd.DataFrame,
        unit_distance: str = "km",
        unit_latency: str = "seconds"
    ) -> Tuple[pd.DataFrame, DataQualityReport, HazardMetadata]:
        """
        Processes mission distance and latency parameters.
        """
        metadata = HazardMetadata(
            hazard_category=self.hazard_category,
            data_source=self.default_data_source,
            is_simulated=self.default_is_simulated,
            dataset_reference=self.default_dataset_reference,
            original_units={"distance": unit_distance, "communication_delay": unit_latency}
        )

        cleaned, report = self.validate_and_normalize_time(df)
        if cleaned.empty:
            return cleaned, report, metadata

        out = cleaned.copy()

        # Handle unit conversions for distance
        if "distance_from_earth" in out.columns:
            if unit_distance.lower() == "au":
                # 1 Astronomical Unit = 149,597,870.7 km
                out["distance_from_earth_km"] = out["distance_from_earth"] * 149_597_870.7
                metadata.conversion_notes["distance"] = "Converted AU to km"
            elif unit_distance.lower() in ["million_km", "mkm"]:
                out["distance_from_earth_km"] = out["distance_from_earth"] * 1_000_000.0
                metadata.conversion_notes["distance"] = "Converted million km to km"
            else:
                out["distance_from_earth_km"] = out["distance_from_earth"]

        # Handle communication delay unit conversion to seconds
        if "communication_delay" in out.columns:
            if unit_latency.lower() in ["minutes", "min"]:
                out["communication_delay_sec"] = out["communication_delay"] * 60.0
                metadata.conversion_notes["communication_delay"] = "Converted minutes to seconds"
            else:
                out["communication_delay_sec"] = out["communication_delay"]
        elif "distance_from_earth_km" in out.columns:
            # Theoretical vacuum one-way speed of light latency (c = 299,792.458 km/s)
            out["communication_delay_sec"] = out["distance_from_earth_km"] / 299_792.458

        out["communication_delay_min"] = out["communication_delay_sec"] / 60.0

        # Causal rolling latency and rate of distance change
        out = self.compute_causal_step_diff(out, ["distance_from_earth_km", "communication_delay_sec"])
        out = self.compute_causal_rolling(out, ["communication_delay_sec"], window=self.rolling_window)

        # Telemedicine Autonomy Indicator (Non-medical operational feature)
        # Reflects inability to perform Earth-guided real-time emergency intervention when latency > 5 min
        out["realtime_telemedicine_feasible"] = out["communication_delay_sec"] < 3.0

        # Preserve metadata
        out["original_unit_distance"] = unit_distance
        out["original_unit_latency"] = unit_latency

        return out, report, metadata
