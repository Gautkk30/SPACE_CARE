"""
Schema and Dataset Mapping for SPACECARE Telemetry.
Enables ingestion of multi-source datasets (NASA OSDR, LSDA, Synthetic Streams)
with differing column nomenclatures and unit conversions into standardized canonical representations.
"""

from typing import Dict, Optional, Callable, Any
import pandas as pd


# Canonical column names required by SPACECARE preprocessing
CANONICAL_COLUMNS = [
    "astronaut_id",
    "timestamp",
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "spo2",
    "body_temperature",
    "respiration_rate",
    "data_source",
    "is_simulated",
    "dataset_reference",
]


class DatasetSchemaMapper:
    """
    Transforms arbitrary external dataframes (e.g. NASA OSDR studies, LSDA archives)
    into standard SPACECARE canonical schemas through explicit field mappings and unit transforms.
    """

    def __init__(
        self,
        column_mapping: Optional[Dict[str, str]] = None,
        unit_conversions: Optional[Dict[str, Callable[[pd.Series], pd.Series]]] = None,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        self.column_mapping = column_mapping or {}
        self.unit_conversions = unit_conversions or {}
        self.default_data_source = default_data_source
        self.default_is_simulated = default_is_simulated
        self.default_dataset_reference = default_dataset_reference

    def map_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Renames mapped columns, executes unit conversions, and assigns default metadata.
        """
        output_df = df.copy()

        # Apply column renaming
        if self.column_mapping:
            output_df = output_df.rename(columns=self.column_mapping)

        # Handle common aliases (e.g., blood_pressure_systolic -> systolic_bp)
        alias_fallbacks = {
            "blood_pressure_systolic": "systolic_bp",
            "blood_pressure_diastolic": "diastolic_bp",
            "core_temperature": "body_temperature",
            "temperature": "body_temperature",
            "hr": "heart_rate",
            "rr": "respiration_rate",
            "oxygen_saturation": "spo2",
            "time": "timestamp",
            "subject_id": "astronaut_id",
            "crew_id": "astronaut_id",
        }
        for alias, canonical in alias_fallbacks.items():
            if canonical not in output_df.columns and alias in output_df.columns:
                output_df[canonical] = output_df[alias]

        # Apply custom unit conversions
        for col, transform in self.unit_conversions.items():
            if col in output_df.columns:
                output_df[col] = transform(output_df[col])

        # Fill default provenance if missing
        if "data_source" not in output_df.columns:
            output_df["data_source"] = self.default_data_source
        if "is_simulated" not in output_df.columns:
            output_df["is_simulated"] = self.default_is_simulated
        if "dataset_reference" not in output_df.columns:
            output_df["dataset_reference"] = self.default_dataset_reference

        return output_df


# Pre-configured mapper for standard NASA OSDR physiological study exports
NASA_OSDR_MAPPER = DatasetSchemaMapper(
    column_mapping={
        "subject": "astronaut_id",
        "datetime": "timestamp",
        "HR_bpm": "heart_rate",
        "Sys_mmHg": "systolic_bp",
        "Dia_mmHg": "diastolic_bp",
        "SpO2_pct": "spo2",
        "Temp_degC": "body_temperature",
        "Resp_rpm": "respiration_rate",
    },
    default_data_source="NASA_RESEARCH",
    default_is_simulated=False,
    default_dataset_reference="NASA_OSDR_EXPORT"
)

# Standard mapper for synthetic demo streams
SYNTHETIC_MAPPER = DatasetSchemaMapper(
    column_mapping={},
    default_data_source="SYNTHETIC_SIMULATED",
    default_is_simulated=True,
    default_dataset_reference="SIM_SPACECARE_DEMO_RUN"
)
