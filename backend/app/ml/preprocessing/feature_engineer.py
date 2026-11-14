"""
Physiological Feature Engineering for SPACECARE Anomaly Detection.
Computes individual astronaut baseline deviations, rolling statistics,
step rates of change, and derived cardiovascular ratios without data leakage.
"""

from typing import Dict, List, Optional, Tuple, Set
import numpy as np
import pandas as pd


# Default standard baseline references for astronauts if not explicitly provided
DEFAULT_BASELINES: Dict[str, float] = {
    "baseline_heart_rate": 70.0,
    "baseline_systolic_bp": 118.0,
    "baseline_diastolic_bp": 76.0,
    "baseline_spo2": 98.5,
    "baseline_body_temperature": 36.7,
    "baseline_respiration_rate": 14.0,
}

# The definitive list of features engineered for machine learning input
# Excludes IDs, timestamps, provenance, and target/simulation labels to prevent data leakage
ML_FEATURE_COLUMNS: List[str] = [
    # 1. Raw physiological vitals
    "heart_rate",
    "systolic_bp",
    "diastolic_bp",
    "spo2",
    "body_temperature",
    "respiration_rate",
    # 2. Individual baseline differences (absolute)
    "hr_diff_baseline",
    "sys_bp_diff_baseline",
    "dia_bp_diff_baseline",
    "spo2_diff_baseline",
    "temp_diff_baseline",
    "rr_diff_baseline",
    # 3. Percentage deviation from personal baseline (%)
    "hr_pct_deviation",
    "sys_bp_pct_deviation",
    "dia_bp_pct_deviation",
    "spo2_pct_deviation",
    "temp_pct_deviation",
    "rr_pct_deviation",
    # 4. First differences / step rate of change (delta per sample)
    "hr_diff_step",
    "sys_bp_diff_step",
    "dia_bp_diff_step",
    "spo2_diff_step",
    "temp_diff_step",
    "rr_diff_step",
    # 5. Backward rolling window averages (window=5)
    "hr_rolling_mean_5",
    "sys_bp_rolling_mean_5",
    "dia_bp_rolling_mean_5",
    "spo2_rolling_mean_5",
    "temp_rolling_mean_5",
    "rr_rolling_mean_5",
    # 6. Backward rolling window standard deviations (variability index)
    "hr_rolling_std_5",
    "sys_bp_rolling_std_5",
    "dia_bp_rolling_std_5",
    "spo2_rolling_std_5",
    "temp_rolling_std_5",
    "rr_rolling_std_5",
    # 7. Non-invasive aerospace physiological indices
    "pulse_pressure",
    "shock_index",
    "mean_arterial_pressure",
]


class PhysiologicalFeatureEngineer:
    """
    Transforms clean telemetry data into rich physiological features.
    Strictly prevents future-data leakage by using backward-looking rolling windows.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        default_baselines: Optional[Dict[str, float]] = None
    ):
        self.rolling_window = rolling_window
        self.default_baselines = default_baselines or DEFAULT_BASELINES

    def engineer_features(
        self,
        df: pd.DataFrame,
        astronaut_baselines: Optional[Dict[str, float]] = None
    ) -> pd.DataFrame:
        """
        Computes all baseline deviations, rolling statistics, and physiological indices.
        Preserves all metadata columns (astronaut_id, timestamp, data_source, etc.).
        """
        if df.empty:
            return df.copy()

        # Work on sorted copy to guarantee causal temporal order
        out = df.sort_values(by="timestamp").copy().reset_index(drop=True)

        # Resolve baselines
        b = self.default_baselines.copy()
        if astronaut_baselines:
            b.update({k: v for k, v in astronaut_baselines.items() if v is not None})

        # 1. Baseline Differences (Absolute)
        out["hr_diff_baseline"] = out["heart_rate"] - b["baseline_heart_rate"]
        out["sys_bp_diff_baseline"] = out["systolic_bp"] - b["baseline_systolic_bp"]
        out["dia_bp_diff_baseline"] = out["diastolic_bp"] - b["baseline_diastolic_bp"]
        out["spo2_diff_baseline"] = out["spo2"] - b["baseline_spo2"]
        out["temp_diff_baseline"] = out["body_temperature"] - b["baseline_body_temperature"]
        out["rr_diff_baseline"] = out["respiration_rate"] - b["baseline_respiration_rate"]

        # 2. Percentage Deviations from Personal Baseline (%)
        out["hr_pct_deviation"] = (out["hr_diff_baseline"] / b["baseline_heart_rate"]) * 100.0
        out["sys_bp_pct_deviation"] = (out["sys_bp_diff_baseline"] / b["baseline_systolic_bp"]) * 100.0
        out["dia_bp_pct_deviation"] = (out["dia_bp_diff_baseline"] / b["baseline_diastolic_bp"]) * 100.0
        out["spo2_pct_deviation"] = (out["spo2_diff_baseline"] / b["baseline_spo2"]) * 100.0
        out["temp_pct_deviation"] = (out["temp_diff_baseline"] / b["baseline_body_temperature"]) * 100.0
        out["rr_pct_deviation"] = (out["rr_diff_baseline"] / b["baseline_respiration_rate"]) * 100.0

        # 3. First Differences (Step velocity: x[t] - x[t-1])
        # First row difference defaults to 0.0 to avoid NaN without inventing measurements
        out["hr_diff_step"] = out["heart_rate"].diff().fillna(0.0)
        out["sys_bp_diff_step"] = out["systolic_bp"].diff().fillna(0.0)
        out["dia_bp_diff_step"] = out["diastolic_bp"].diff().fillna(0.0)
        out["spo2_diff_step"] = out["spo2"].diff().fillna(0.0)
        out["temp_diff_step"] = out["body_temperature"].diff().fillna(0.0)
        out["rr_diff_step"] = out["respiration_rate"].diff().fillna(0.0)

        # 4. Backward-Looking Rolling Statistics
        # min_periods=1 ensures no rows dropped; closed='right' ensures only current and past used
        w = self.rolling_window
        metrics = ["heart_rate", "systolic_bp", "diastolic_bp", "spo2", "body_temperature", "respiration_rate"]
        abbreviations = {
            "heart_rate": "hr",
            "systolic_bp": "sys_bp",
            "diastolic_bp": "dia_bp",
            "spo2": "spo2",
            "body_temperature": "temp",
            "respiration_rate": "rr"
        }

        for m in metrics:
            abbr = abbreviations[m]
            rolling = out[m].rolling(window=w, min_periods=1, closed="right")
            out[f"{abbr}_rolling_mean_{w}"] = rolling.mean()
            # Standard deviation for single sample defaults to 0.0
            out[f"{abbr}_rolling_std_{w}"] = rolling.std().fillna(0.0)

        # 5. Non-Invasive Derived Aerospace Physiological Indices
        out["pulse_pressure"] = out["systolic_bp"] - out["diastolic_bp"]
        out["shock_index"] = out["heart_rate"] / (out["systolic_bp"] + 1e-5)
        out["mean_arterial_pressure"] = out["diastolic_bp"] + (out["pulse_pressure"] / 3.0)

        return out

    @staticmethod
    def get_feature_matrix(df: pd.DataFrame) -> pd.DataFrame:
        """
        Extracts strictly the ML-eligible numerical feature columns,
        guaranteeing that metadata, labels, and simulation states are excluded.
        """
        missing_cols = [col for col in ML_FEATURE_COLUMNS if col not in df.columns]
        if missing_cols:
            raise KeyError(f"DataFrame is missing required engineered features: {missing_cols}")
        return df[ML_FEATURE_COLUMNS].copy()

    @staticmethod
    def split_chronologically(
        df: pd.DataFrame,
        test_fraction: float = 0.2
    ) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """
        Splits telemetry chronologically into train and test sets to prevent temporal leakage.
        The first (1 - test_fraction) portion is assigned to training; the remainder to test.
        """
        if df.empty:
            return df.copy(), df.copy()
        
        sorted_df = df.sort_values(by="timestamp").reset_index(drop=True)
        split_idx = int(len(sorted_df) * (1.0 - test_fraction))
        train_df = sorted_df.iloc[:split_idx].copy().reset_index(drop=True)
        test_df = sorted_df.iloc[split_idx:].copy().reset_index(drop=True)
        return train_df, test_df
