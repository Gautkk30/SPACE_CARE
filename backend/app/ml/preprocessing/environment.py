"""
SPACECARE Hazard Preprocessor: Hostile/Closed Environments.
Processes life support system (ECLSS) atmospheric telemetry:
cabin oxygen, carbon dioxide, barometric pressure, temperature, and humidity.

SEPARATION OF DOMAINS NOTICE:
Cabin environmental parameters are kept strictly distinct from astronaut physiological biometrics.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.base_hazard import BaseHazardPreprocessor
from app.ml.preprocessing.validator import DataQualityReport

# Physical bounds for spacecraft habitat atmosphere
ENVIRONMENT_BOUNDS: Dict[str, Tuple[float, float]] = {
    "oxygen_concentration_pct": (0.0, 100.0),      # %
    "co2_concentration_mmhg": (0.0, 50.0),         # mmHg partial pressure (toxic > 7-10 mmHg)
    "cabin_temperature": (-20.0, 60.0),            # °C
    "cabin_pressure_kpa": (0.0, 150.0),            # kPa (101.3 kPa standard sea level / ISS)
    "cabin_humidity_pct": (0.0, 100.0),            # % Relative Humidity
}

# Standard nominal spacecraft habitat baseline setpoints (ISS / Orion specifications)
NOMINAL_HABITAT_SETPOINTS = {
    "nominal_o2_pct": 21.0,
    "nominal_co2_mmhg": 2.5,
    "nominal_temp_c": 21.5,
    "nominal_pressure_kpa": 101.3,
    "nominal_humidity_pct": 45.0,
}


class HostileEnvironmentPreprocessor(BaseHazardPreprocessor):
    """
    Processes Hostile and Closed Environment life support metrics:
    - Normalizes environmental atmospheric units (kPa, mmHg, °C, % RH).
    - Detects habitat depressurization risks and toxic CO2 accumulations.
    - Preserves environmental provenance strictly separate from astronaut vital biometrics.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        super().__init__(
            hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
            rolling_window=rolling_window,
            default_data_source=default_data_source,
            default_is_simulated=default_is_simulated,
            default_dataset_reference=default_dataset_reference
        )

    def process(
        self,
        df: pd.DataFrame,
        unit_pressure: str = "kPa",
        unit_co2: str = "mmHg",
        unit_temperature: str = "C",
        assumed_total_pressure_kpa: Optional[float] = None
    ) -> Tuple[pd.DataFrame, DataQualityReport, HazardMetadata]:
        """
        Processes habitat atmospheric telemetry.
        
        Args:
            df: Input dataframe containing timestamp and atmospheric metrics.
            unit_pressure: Pressure units ('kPa', 'psi', 'atm', 'bar').
            unit_co2: CO2 units ('mmHg', 'ppm', '%').
            unit_temperature: Temperature units ('C', 'F').
            assumed_total_pressure_kpa: Barometric pressure used ONLY if CO2 is in ppm/%
                and no local cabin pressure measurement exists in the stream.
        """
        metadata = HazardMetadata(
            hazard_category=self.hazard_category,
            data_source=self.default_data_source,
            is_simulated=self.default_is_simulated,
            dataset_reference=self.default_dataset_reference,
            original_units={
                "pressure": unit_pressure,
                "co2": unit_co2,
                "temperature": unit_temperature
            }
        )

        cleaned, report = self.validate_and_normalize_time(df)
        if cleaned.empty:
            return cleaned, report, metadata

        out = cleaned.copy()

        # 1. Atmospheric Pressure Unit Normalization to kPa
        if "cabin_pressure" in out.columns:
            if unit_pressure.lower() in ["psi", "psia"]:
                out["cabin_pressure_kpa"] = out["cabin_pressure"] * 6.894757
                metadata.conversion_notes["pressure"] = "Converted psi to kPa (1 psi = 6.894757 kPa)"
            elif unit_pressure.lower() in ["atm", "bar"]:
                out["cabin_pressure_kpa"] = out["cabin_pressure"] * 101.325
                metadata.conversion_notes["pressure"] = "Converted atm to kPa (1 atm = 101.325 kPa)"
            else:
                out["cabin_pressure_kpa"] = out["cabin_pressure"]

        # 2. Temperature Unit Normalization to Celsius
        if "cabin_temperature" in out.columns:
            if unit_temperature.upper() == "F":
                out["cabin_temperature"] = (out["cabin_temperature"] - 32.0) * (5.0 / 9.0)
                metadata.conversion_notes["temperature"] = "Converted Fahrenheit to Celsius"

        # 3. CO2 Concentration Unit Normalization (Dalton's Law of Partial Pressures)
        if "co2_concentration" in out.columns:
            # Determine total pressure for partial pressure conversion: P_partial = mole_fraction * P_total
            has_local_pressure = "cabin_pressure_kpa" in out.columns
            
            if unit_co2.lower() == "ppm":
                if has_local_pressure:
                    # Exact Dalton's Law calculation: P_total (mmHg) = P_total (kPa) * (760.0 / 101.325)
                    total_pressure_mmhg = out["cabin_pressure_kpa"] * (760.0 / 101.325)
                    out["co2_concentration_mmhg"] = (out["co2_concentration"] / 1_000_000.0) * total_pressure_mmhg
                    metadata.conversion_notes["co2"] = (
                        "Converted ppm to partial pressure (mmHg) using dynamic local cabin barometric pressure (Dalton's Law)"
                    )
                elif assumed_total_pressure_kpa is not None:
                    total_pressure_mmhg = assumed_total_pressure_kpa * (760.0 / 101.325)
                    out["co2_concentration_mmhg"] = (out["co2_concentration"] / 1_000_000.0) * total_pressure_mmhg
                    metadata.conversion_notes["co2"] = (
                        f"Converted ppm to partial pressure (mmHg) using assumed baseline barometric pressure of {assumed_total_pressure_kpa} kPa"
                    )
                else:
                    # Missing barometric pressure; do not invent conversion
                    out["co2_concentration_ppm"] = out["co2_concentration"]
                    metadata.conversion_notes["co2"] = (
                        "Cannot convert ppm to partial pressure (mmHg) without total barometric pressure (Dalton's Law requirement). "
                        "Preserved original ppm values in 'co2_concentration_ppm'."
                    )

            elif unit_co2.lower() in ["pct", "%"]:
                if has_local_pressure:
                    total_pressure_mmhg = out["cabin_pressure_kpa"] * (760.0 / 101.325)
                    out["co2_concentration_mmhg"] = (out["co2_concentration"] / 100.0) * total_pressure_mmhg
                    metadata.conversion_notes["co2"] = (
                        "Converted % to partial pressure (mmHg) using dynamic local cabin barometric pressure"
                    )
                elif assumed_total_pressure_kpa is not None:
                    total_pressure_mmhg = assumed_total_pressure_kpa * (760.0 / 101.325)
                    out["co2_concentration_mmhg"] = (out["co2_concentration"] / 100.0) * total_pressure_mmhg
                    metadata.conversion_notes["co2"] = (
                        f"Converted % to partial pressure (mmHg) using assumed baseline barometric pressure of {assumed_total_pressure_kpa} kPa"
                    )
                else:
                    out["co2_concentration_pct"] = out["co2_concentration"]
                    metadata.conversion_notes["co2"] = (
                        "Cannot convert % to partial pressure (mmHg) without total barometric pressure. Preserved original % values."
                    )
            else:
                out["co2_concentration_mmhg"] = out["co2_concentration"]

        # 3. Oxygen percentage
        if "oxygen_concentration" in out.columns:
            out["oxygen_concentration_pct"] = out["oxygen_concentration"]

        # 4. Deviations from nominal habitat setpoints
        if "oxygen_concentration_pct" in out.columns:
            out["o2_diff_nominal"] = out["oxygen_concentration_pct"] - NOMINAL_HABITAT_SETPOINTS["nominal_o2_pct"]
        if "co2_concentration_mmhg" in out.columns:
            out["co2_diff_nominal"] = out["co2_concentration_mmhg"] - NOMINAL_HABITAT_SETPOINTS["nominal_co2_mmhg"]
        if "cabin_pressure_kpa" in out.columns:
            out["pressure_diff_nominal"] = out["cabin_pressure_kpa"] - NOMINAL_HABITAT_SETPOINTS["nominal_pressure_kpa"]

        # 5. Causal Step Rate of Change (Critical for rapid depressurization or toxic release detection)
        step_cols = [c for c in ["cabin_pressure_kpa", "co2_concentration_mmhg", "oxygen_concentration_pct", "cabin_temperature"] if c in out.columns]
        out = self.compute_causal_step_diff(out, step_cols)

        # 6. Causal Rolling Environmental Stability
        out = self.compute_causal_rolling(out, step_cols, window=self.rolling_window)

        # Habitat Environmental Risk Flags (Strictly environmental, not medical diagnosis)
        if "cabin_pressure_kpa" in out.columns:
            out["depressurization_risk"] = out["cabin_pressure_kpa"] < 90.0
        if "co2_concentration_mmhg" in out.columns:
            out["hypercapnia_risk"] = out["co2_concentration_mmhg"] > 4.5
        if "oxygen_concentration_pct" in out.columns:
            out["hypoxic_cabin_risk"] = out["oxygen_concentration_pct"] < 19.5

        # Preserve metadata
        out["original_unit_pressure"] = unit_pressure
        out["original_unit_co2"] = unit_co2
        out["original_unit_temperature"] = unit_temperature

        return out, report, metadata
