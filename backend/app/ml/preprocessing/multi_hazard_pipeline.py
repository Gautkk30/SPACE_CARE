"""
SPACECARE Multi-Hazard Preprocessing Orchestration Pipeline.
Unified coordinator for the five NASA spaceflight hazards and physiological biometrics:
1. Space Radiation
2. Isolation and Confinement
3. Distance from Earth
4. Gravity Fields
5. Hostile/Closed Environments
"""

from typing import Dict, List, Optional, Tuple, Any, Union
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.validator import DataQualityReport
from app.ml.preprocessing.pipeline import TelemetryPipeline
from app.ml.preprocessing.radiation import SpaceRadiationPreprocessor
from app.ml.preprocessing.isolation import IsolationConfinementPreprocessor
from app.ml.preprocessing.distance import DistanceFromEarthPreprocessor
from app.ml.preprocessing.gravity import GravityFieldsPreprocessor
from app.ml.preprocessing.environment import HostileEnvironmentPreprocessor


class MultiHazardPipeline:
    """
    Extensible multi-hazard preprocessor coordinating domain-specific pipelines
    without forcing all measurements into a single database table.
    """

    def __init__(self, rolling_window: int = 5):
        self.rolling_window = rolling_window
        self.physiological_pipeline = TelemetryPipeline()
        self.radiation_preprocessor = SpaceRadiationPreprocessor(rolling_window=rolling_window)
        self.isolation_preprocessor = IsolationConfinementPreprocessor(rolling_window=rolling_window)
        self.distance_preprocessor = DistanceFromEarthPreprocessor(rolling_window=rolling_window)
        self.gravity_preprocessor = GravityFieldsPreprocessor(rolling_window=rolling_window)
        self.environment_preprocessor = HostileEnvironmentPreprocessor(rolling_window=rolling_window)

    def process_hazard(
        self,
        category: Union[HazardCategory, str],
        df: pd.DataFrame,
        **kwargs
    ) -> Tuple[pd.DataFrame, DataQualityReport, Optional[HazardMetadata]]:
        """
        Dispatches processing to the corresponding hazard preprocessor.
        """
        if isinstance(category, str):
            category = HazardCategory(category)

        if category == HazardCategory.PHYSIOLOGICAL:
            enriched, X_scaled, report = self.physiological_pipeline.fit_transform(df, **kwargs)
            metadata = HazardMetadata(
                hazard_category=HazardCategory.PHYSIOLOGICAL,
                data_source=df.get("data_source", pd.Series(["SYNTHETIC_SIMULATED"])).iloc[0],
                is_simulated=bool(df.get("is_simulated", pd.Series([True])).iloc[0]),
                dataset_reference=df.get("dataset_reference", pd.Series([None])).iloc[0]
            )
            return enriched, report, metadata

        elif category == HazardCategory.SPACE_RADIATION:
            return self.radiation_preprocessor.process(df, **kwargs)

        elif category == HazardCategory.ISOLATION_CONFINEMENT:
            return self.isolation_preprocessor.process(df, **kwargs)

        elif category == HazardCategory.DISTANCE_FROM_EARTH:
            return self.distance_preprocessor.process(df, **kwargs)

        elif category == HazardCategory.GRAVITY_FIELDS:
            return self.gravity_preprocessor.process(df, **kwargs)

        elif category == HazardCategory.HOSTILE_CLOSED_ENVIRONMENT:
            return self.environment_preprocessor.process(df, **kwargs)

        else:
            raise ValueError(f"Unsupported hazard category: '{category}'")

    @staticmethod
    def align_multi_hazard_streams(
        primary_vitals_df: pd.DataFrame,
        hazard_streams: Dict[HazardCategory, pd.DataFrame],
        tolerance: Optional[Union[pd.Timedelta, str, Dict[HazardCategory, Union[pd.Timedelta, str]]]] = None
    ) -> pd.DataFrame:
        """
        Chronologically aligns multi-hazard time series with physiological vitals
        strictly using backward as-of merges (merge_asof with direction='backward').
        Guarantees ZERO future-data leakage: at time t, only hazard measurements
        recorded at or before time t are merged.

        Args:
            primary_vitals_df: Primary time series dataframe with 'timestamp'.
            hazard_streams: Mapping of HazardCategory to auxiliary time series dataframes.
            tolerance: Optional maximum backward alignment lookback window (e.g. '2 hours' or pd.Timedelta(hours=2)).
                Can be a global timedelta/string or a dict mapped per HazardCategory.
                Readings older than tolerance are left as NaN to prevent dangerous data staleness.
        """
        if primary_vitals_df.empty:
            return primary_vitals_df.copy()

        # Ensure primary timestamps are UTC sorted
        aligned = primary_vitals_df.copy()
        aligned["timestamp"] = pd.to_datetime(aligned["timestamp"], utc=True)
        aligned = aligned.sort_values(by="timestamp").reset_index(drop=True)

        for cat, stream_df in hazard_streams.items():
            if stream_df.empty:
                continue

            stream = stream_df.copy()
            stream["timestamp"] = pd.to_datetime(stream["timestamp"], utc=True)
            stream = stream.sort_values(by="timestamp").reset_index(drop=True)

            domain_tag = cat.value.lower()

            # Preserve the exact timestamp when this hazard observation was made
            stream[f"{domain_tag}_observed_timestamp"] = stream["timestamp"]

            # Prefix domain columns to prevent collision and preserve clear provenance
            rename_map = {}
            for col in stream.columns:
                if col not in ["timestamp", "astronaut_id", f"{domain_tag}_observed_timestamp"]:
                    rename_map[col] = f"{domain_tag}_{col}"
            stream = stream.rename(columns=rename_map)

            # Resolve per-hazard or global tolerance
            stream_tol = None
            if isinstance(tolerance, dict):
                stream_tol = tolerance.get(cat)
            elif tolerance is not None:
                stream_tol = tolerance

            if isinstance(stream_tol, str):
                stream_tol = pd.Timedelta(stream_tol)

            # Causal backward merge: only prior or concurrent readings within tolerance are aligned
            merge_kwargs = {
                "left": aligned,
                "right": stream,
                "on": "timestamp",
                "direction": "backward"
            }
            if stream_tol is not None:
                merge_kwargs["tolerance"] = stream_tol

            aligned = pd.merge_asof(**merge_kwargs)

            # Compute observation age / staleness feature
            observed_ts_col = f"{domain_tag}_observed_timestamp"
            staleness_col = f"{domain_tag}_staleness_seconds"
            if observed_ts_col in aligned.columns:
                time_diff = (aligned["timestamp"] - aligned[observed_ts_col]).dt.total_seconds()
                aligned[staleness_col] = time_diff

        return aligned
