"""
Data Preprocessing Pipeline for SPACECARE Health Telemetry.
Handles feature extraction, astronaut-specific baseline deviation computation,
and robust feature scaling.
"""

from typing import Dict, List, Optional, Tuple, Union
import numpy as np
import pandas as pd
from sklearn.preprocessing import RobustScaler
import joblib

# Default standard baseline references if astronaut-specific baseline is absent
DEFAULT_BASELINES = {
    "baseline_heart_rate": 70.0,
    "baseline_systolic_bp": 118.0,
    "baseline_diastolic_bp": 76.0,
    "baseline_spo2": 98.5,
    "baseline_body_temperature": 36.7,
    "baseline_respiration_rate": 14.0,
}

# Feature column order for ML model consistency
FEATURE_NAMES = [
    "heart_rate",
    "spo2",
    "blood_pressure_systolic",
    "blood_pressure_diastolic",
    "body_temperature",
    "respiration_rate",
    "hr_diff_baseline",
    "sys_bp_diff_baseline",
    "dia_bp_diff_baseline",
    "spo2_diff_baseline",
    "temp_diff_baseline",
    "pulse_pressure",
    "shock_index",
]


class TelemetryPreprocessor:
    """
    Transforms raw physiological telemetry into engineered ML features,
    computing astronaut-specific baseline deltas and applying robust normalization.
    """

    def __init__(self):
        self.scaler = RobustScaler()
        self.is_fitted = False

    def compute_features(
        self, 
        df: pd.DataFrame, 
        baselines: Optional[Dict[str, float]] = None
    ) -> pd.DataFrame:
        """
        Calculates baseline deviations and derived cardiovascular ratios.
        """
        features_df = df.copy()

        # Handle temperature column naming flexibility
        if "body_temperature" not in features_df.columns and "core_temperature" in features_df.columns:
            features_df["body_temperature"] = features_df["core_temperature"]

        # Ensure numeric types
        for col in ["heart_rate", "spo2", "blood_pressure_systolic", 
                    "blood_pressure_diastolic", "body_temperature", "respiration_rate"]:
            if col in features_df.columns:
                features_df[col] = pd.to_numeric(features_df[col], errors="coerce")

        # Resolve baselines
        b = DEFAULT_BASELINES.copy()
        if baselines:
            b.update({k: v for k, v in baselines.items() if v is not None})

        # Feature Engineering: Astronaut-specific deviations
        features_df["hr_diff_baseline"] = features_df["heart_rate"] - b["baseline_heart_rate"]
        features_df["sys_bp_diff_baseline"] = features_df["blood_pressure_systolic"] - b["baseline_systolic_bp"]
        features_df["dia_bp_diff_baseline"] = features_df["blood_pressure_diastolic"] - b["baseline_diastolic_bp"]
        features_df["spo2_diff_baseline"] = features_df["spo2"] - b["baseline_spo2"]
        features_df["temp_diff_baseline"] = features_df["body_temperature"] - b["baseline_body_temperature"]

        # Derived physiological indices (shock index & pulse pressure)
        features_df["pulse_pressure"] = (
            features_df["blood_pressure_systolic"] - features_df["blood_pressure_diastolic"]
        )
        features_df["shock_index"] = (
            features_df["heart_rate"] / (features_df["blood_pressure_systolic"] + 1e-5)
        )

        return features_df[FEATURE_NAMES]

    def fit(self, X: pd.DataFrame) -> "TelemetryPreprocessor":
        """
        Fits the RobustScaler on feature data.
        """
        self.scaler.fit(X[FEATURE_NAMES])
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        """
        Applies scaling transformation to extracted features.
        """
        if not self.is_fitted:
            raise RuntimeError("TelemetryPreprocessor must be fitted before transforming.")
        return self.scaler.transform(X[FEATURE_NAMES])

    def fit_transform(self, X: pd.DataFrame) -> np.ndarray:
        """
        Convenience method to fit and transform feature matrix.
        """
        return self.fit(X).transform(X)

    def save(self, filepath: str) -> None:
        """Saves fitted preprocessor to disk."""
        joblib.dump({"scaler": self.scaler, "is_fitted": self.is_fitted}, filepath)

    @classmethod
    def load(cls, filepath: str) -> "TelemetryPreprocessor":
        """Loads fitted preprocessor from disk."""
        data = joblib.load(filepath)
        instance = cls()
        instance.scaler = data["scaler"]
        instance.is_fitted = data["is_fitted"]
        return instance
