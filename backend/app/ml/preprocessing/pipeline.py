"""
SPACECARE Integrated Telemetry Preprocessing & Feature Pipeline.
Orchestrates schema mapping, quality validation, baseline-relative feature engineering,
and robust scaling while rigorously preventing future-data leakage.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Union
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
import joblib

from app.ml.preprocessing.schema_mapper import DatasetSchemaMapper, SYNTHETIC_MAPPER
from app.ml.preprocessing.validator import TelemetryValidator, DataQualityReport
from app.ml.preprocessing.feature_engineer import (
    PhysiologicalFeatureEngineer,
    ML_FEATURE_COLUMNS,
    DEFAULT_BASELINES
)

# Comprehensive documentation of all engineered features, calculations, and intended analytical uses
FEATURE_DOCUMENTATION: Dict[str, Dict[str, str]] = {
    # Raw Vitals
    "heart_rate": {
        "calculation": "Direct physiological sensor reading",
        "unit": "bpm",
        "intended_use": "Primary cardiovascular stress and autonomic state indicator."
    },
    "systolic_bp": {
        "calculation": "Direct or cuff-derived systolic peak pressure",
        "unit": "mmHg",
        "intended_use": "Detects arterial pressure surges, hypertension, and orthostatic collapse."
    },
    "diastolic_bp": {
        "calculation": "Direct or cuff-derived minimum resting pressure",
        "unit": "mmHg",
        "intended_use": "Monitors peripheral vascular resistance and cardiovascular deconditioning."
    },
    "spo2": {
        "calculation": "Photoplethysmographic peripheral oxygen saturation",
        "unit": "%",
        "intended_use": "Critical life-support indicator; detects cabin hypoxia and respiratory insufficiency."
    },
    "body_temperature": {
        "calculation": "Core body temperature measurement",
        "unit": "°C",
        "intended_use": "Detects EVA suit thermal loop failure, hyperthermia, hypothermia, or febrile illness."
    },
    "respiration_rate": {
        "calculation": "Breaths per minute from bio-impedance or airflow sensor",
        "unit": "breaths/min",
        "intended_use": "Identifies hyperventilation, hypopnea, or respiratory distress."
    },
    # Baseline Deviations (Absolute)
    "hr_diff_baseline": {
        "calculation": "heart_rate - baseline_heart_rate",
        "unit": "bpm delta",
        "intended_use": "Captures personalized autonomic deviation relative to astronaut's rested state."
    },
    "sys_bp_diff_baseline": {
        "calculation": "systolic_bp - baseline_systolic_bp",
        "unit": "mmHg delta",
        "intended_use": "Detects hemodynamic shifts relative to individual cardiovascular setpoint."
    },
    "dia_bp_diff_baseline": {
        "calculation": "diastolic_bp - baseline_diastolic_bp",
        "unit": "mmHg delta",
        "intended_use": "Tracks peripheral tone shifts relative to individual baseline."
    },
    "spo2_diff_baseline": {
        "calculation": "spo2 - baseline_spo2",
        "unit": "% delta",
        "intended_use": "Quantifies oxygen saturation deficit below individual healthy state."
    },
    "temp_diff_baseline": {
        "calculation": "body_temperature - baseline_body_temperature",
        "unit": "°C delta",
        "intended_use": "Quantifies core thermoregulatory displacement from crew member's baseline."
    },
    "rr_diff_baseline": {
        "calculation": "respiration_rate - baseline_respiration_rate",
        "unit": "breaths/min delta",
        "intended_use": "Isolates respiratory drive elevation relative to baseline."
    },
    # Percentage Deviations
    "hr_pct_deviation": {
        "calculation": "(hr_diff_baseline / baseline_hr) * 100",
        "unit": "%",
        "intended_use": "Normalized cardiovascular strain index independent of resting heart rate scale."
    },
    "sys_bp_pct_deviation": {
        "calculation": "(sys_bp_diff_baseline / baseline_sys) * 100",
        "unit": "%",
        "intended_use": "Relative arterial pressure deviation."
    },
    "dia_bp_pct_deviation": {
        "calculation": "(dia_bp_diff_baseline / baseline_dia) * 100",
        "unit": "%",
        "intended_use": "Relative vascular resistance displacement."
    },
    "spo2_pct_deviation": {
        "calculation": "(spo2_diff_baseline / baseline_spo2) * 100",
        "unit": "%",
        "intended_use": "Percentage oxygen deficit."
    },
    "temp_pct_deviation": {
        "calculation": "(temp_diff_baseline / baseline_temp) * 100",
        "unit": "%",
        "intended_use": "Relative thermal load displacement."
    },
    "rr_pct_deviation": {
        "calculation": "(rr_diff_baseline / baseline_rr) * 100",
        "unit": "%",
        "intended_use": "Relative respiratory acceleration index."
    },
    # First Differences (Step Velocities)
    "hr_diff_step": {
        "calculation": "heart_rate[t] - heart_rate[t-1]",
        "unit": "bpm / step",
        "intended_use": "Measures acute cardiovascular acceleration / sudden arrhythmic onset."
    },
    "sys_bp_diff_step": {
        "calculation": "systolic_bp[t] - systolic_bp[t-1]",
        "unit": "mmHg / step",
        "intended_use": "Detects sudden hemodynamic collapse or acute vasoconstriction."
    },
    "dia_bp_diff_step": {
        "calculation": "diastolic_bp[t] - diastolic_bp[t-1]",
        "unit": "mmHg / step",
        "intended_use": "Step-to-step diastolic shift."
    },
    "spo2_diff_step": {
        "calculation": "spo2[t] - spo2[t-1]",
        "unit": "% / step",
        "intended_use": "Detects rapid desaturation events."
    },
    "temp_diff_step": {
        "calculation": "body_temperature[t] - body_temperature[t-1]",
        "unit": "°C / step",
        "intended_use": "Tracks rate of heating or cooling in thermal extremes."
    },
    "rr_diff_step": {
        "calculation": "respiration_rate[t] - respiration_rate[t-1]",
        "unit": "breaths / step",
        "intended_use": "Step-to-step respiratory rate change."
    },
    # Rolling Statistics (Backward-looking window=5)
    "hr_rolling_mean_5": {
        "calculation": "Mean of previous 5 readings (inclusive of current)",
        "unit": "bpm",
        "intended_use": "Filters high-frequency sensor noise to reveal true sustained trend."
    },
    "hr_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 readings",
        "unit": "bpm",
        "intended_use": "Measures short-term heart rate instability."
    },
    "sys_bp_rolling_mean_5": {
        "calculation": "Mean of previous 5 systolic BP readings",
        "unit": "mmHg",
        "intended_use": "Sustained arterial pressure trend."
    },
    "sys_bp_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 systolic readings",
        "unit": "mmHg",
        "intended_use": "Arterial pressure lability index."
    },
    "dia_bp_rolling_mean_5": {
        "calculation": "Mean of previous 5 diastolic BP readings",
        "unit": "mmHg",
        "intended_use": "Sustained peripheral tone."
    },
    "dia_bp_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 diastolic readings",
        "unit": "mmHg",
        "intended_use": "Diastolic pressure lability index."
    },
    "spo2_rolling_mean_5": {
        "calculation": "Mean of previous 5 SpO2 readings",
        "unit": "%",
        "intended_use": "Filters motion artifacts from true arterial hypoxemia."
    },
    "spo2_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 SpO2 readings",
        "unit": "%",
        "intended_use": "SpO2 signal instability."
    },
    "temp_rolling_mean_5": {
        "calculation": "Mean of previous 5 temperature readings",
        "unit": "°C",
        "intended_use": "Smooth core thermal trajectory."
    },
    "temp_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 temperature readings",
        "unit": "°C",
        "intended_use": "Thermal sensor fluctuation."
    },
    "rr_rolling_mean_5": {
        "calculation": "Mean of previous 5 respiration readings",
        "unit": "breaths/min",
        "intended_use": "Sustained ventilatory load."
    },
    "rr_rolling_std_5": {
        "calculation": "Standard deviation of previous 5 respiration readings",
        "unit": "breaths/min",
        "intended_use": "Respiratory irregularity / apnea pattern detection."
    },
    # Aerospace Physiological Indices
    "pulse_pressure": {
        "calculation": "systolic_bp - diastolic_bp",
        "unit": "mmHg",
        "intended_use": "Index of stroke volume and arterial compliance in microgravity."
    },
    "shock_index": {
        "calculation": "heart_rate / systolic_bp",
        "unit": "bpm / mmHg",
        "intended_use": "Standard aerospace clinical index (>0.9 indicates acute circulatory strain)."
    },
    "mean_arterial_pressure": {
        "calculation": "diastolic_bp + (pulse_pressure / 3.0)",
        "unit": "mmHg",
        "intended_use": "Perfusion pressure to vital organs (brain, kidneys) during acceleration and microgravity."
    },
}


class TelemetryPipeline:
    """
    End-to-end preprocessing and feature engineering pipeline for SPACECARE.
    Ensures safe, reproducible transformation of raw telemetry into ML-ready matrices.
    """

    def __init__(
        self,
        schema_mapper: Optional[DatasetSchemaMapper] = None,
        validator: Optional[TelemetryValidator] = None,
        feature_engineer: Optional[PhysiologicalFeatureEngineer] = None,
        scale_features: bool = True
    ):
        self.schema_mapper = schema_mapper or SYNTHETIC_MAPPER
        self.validator = validator or TelemetryValidator()
        self.feature_engineer = feature_engineer or PhysiologicalFeatureEngineer()
        self.scale_features = scale_features
        self.scaler = RobustScaler()
        self.is_fitted = False
        self.last_quality_report: Optional[DataQualityReport] = None

    def fit(
        self,
        df: pd.DataFrame,
        astronaut_baselines: Optional[Dict[str, float]] = None
    ) -> "TelemetryPipeline":
        """
        Fits the feature scaler exclusively on training data to prevent leakage.
        """
        mapped_df = self.schema_mapper.map_dataframe(df)
        cleaned_df, report = self.validator.validate_and_clean(mapped_df)
        self.last_quality_report = report

        enriched_df = self.feature_engineer.engineer_features(
            cleaned_df,
            astronaut_baselines=astronaut_baselines
        )

        X = self.feature_engineer.get_feature_matrix(enriched_df)
        if self.scale_features:
            self.scaler.fit(X)
        self.is_fitted = True
        return self

    def transform(
        self,
        df: pd.DataFrame,
        astronaut_baselines: Optional[Dict[str, float]] = None
    ) -> Tuple[pd.DataFrame, np.ndarray, DataQualityReport]:
        """
        Transforms input telemetry into an enriched dataframe and scaled ML feature matrix.
        Preserves all metadata, IDs, timestamps, and data source provenance.
        """
        mapped_df = self.schema_mapper.map_dataframe(df)
        cleaned_df, report = self.validator.validate_and_clean(mapped_df)
        self.last_quality_report = report

        enriched_df = self.feature_engineer.engineer_features(
            cleaned_df,
            astronaut_baselines=astronaut_baselines
        )

        X_df = self.feature_engineer.get_feature_matrix(enriched_df)

        if self.scale_features:
            if not self.is_fitted:
                raise RuntimeError("TelemetryPipeline must be fitted before transforming.")
            X_scaled = self.scaler.transform(X_df)
        else:
            X_scaled = X_df.to_numpy()

        return enriched_df, X_scaled, report

    def fit_transform(
        self,
        df: pd.DataFrame,
        astronaut_baselines: Optional[Dict[str, float]] = None
    ) -> Tuple[pd.DataFrame, np.ndarray, DataQualityReport]:
        """Convenience method fitting on the input dataframe and returning transformed matrices."""
        return self.fit(df, astronaut_baselines=astronaut_baselines).transform(
            df, astronaut_baselines=astronaut_baselines
        )

    def fit_train_transform_test(
        self,
        train_df: pd.DataFrame,
        test_df: pd.DataFrame,
        astronaut_baselines: Optional[Dict[str, float]] = None
    ) -> Tuple[
        Tuple[pd.DataFrame, np.ndarray, DataQualityReport],
        Tuple[pd.DataFrame, np.ndarray, DataQualityReport]
    ]:
        """
        Guarantees strict ML evaluation partitioning without future data leakage:
        1. Fits scaler exclusively on train_df.
        2. Transforms train_df using fitted parameters.
        3. Transforms test_df using the existing fitted scaler without altering training centers.
        """
        self.fit(train_df, astronaut_baselines=astronaut_baselines)
        train_result = self.transform(train_df, astronaut_baselines=astronaut_baselines)
        test_result = self.transform(test_df, astronaut_baselines=astronaut_baselines)
        return train_result, test_result

    def save(self, filepath: Union[str, Path]) -> None:
        """Serializes fitted pipeline parameters and scaler to disk."""
        path = Path(filepath)
        path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "scaler": self.scaler,
                "is_fitted": self.is_fitted,
                "scale_features": self.scale_features,
                "rolling_window": self.feature_engineer.rolling_window,
                "feature_columns": ML_FEATURE_COLUMNS,
            },
            path
        )

    @classmethod
    def load(cls, filepath: Union[str, Path]) -> "TelemetryPipeline":
        """Loads serialized pipeline from disk."""
        data = joblib.load(filepath)
        instance = cls(scale_features=data["scale_features"])
        instance.scaler = data["scaler"]
        instance.is_fitted = data["is_fitted"]
        instance.feature_engineer = PhysiologicalFeatureEngineer(rolling_window=data["rolling_window"])
        return instance
