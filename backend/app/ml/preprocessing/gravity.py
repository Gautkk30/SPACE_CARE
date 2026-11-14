"""
SPACECARE Hazard Preprocessor: Gravity Fields.
Processes exercise countermeasure adherence (ARED, CEVIS), vestibular adaptation,
and orthostatic cardiovascular adaptation indices.

OBJECTIVITY & INTEGRITY NOTICE:
This module evaluates recorded physical activity and balance metrics.
It strictly does NOT infer or fabricate bone demineralization or muscle loss
from unrelated variables.
"""

from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory, HazardMetadata
from app.ml.preprocessing.base_hazard import BaseHazardPreprocessor
from app.ml.preprocessing.validator import DataQualityReport

GRAVITY_BOUNDS: Dict[str, Tuple[float, float]] = {
    "active_exercise_minutes": (0.0, 360.0),      # minutes per day
    "exercise_workload_watts": (0.0, 500.0),      # cycle ergometer watts
    "balance_coordination_score": (0.0, 100.0),   # posturography or vestibulomotor score
    "orthostatic_adaptation_index": (0.0, 100.0), # cardiovascular adaptation score
}


class GravityFieldsPreprocessor(BaseHazardPreprocessor):
    """
    Processes Gravity Fields adaptation telemetry:
    - Tracks daily exercise countermeasure volume and protocol adherence.
    - Monitors neuro-vestibular coordination adjustments.
    - Tracks cardiovascular orthostatic adaptation indices without making unsubstantiated bone/muscle inferences.

    ASSUMPTION / REFERENCE NOTICE:
    The target exercise duration is an operational mission countermeasure guideline
    (NASA standard protocol reference: nominal 120-150 min/day combining ARED and CEVIS);
    it is NOT a universal medical requirement, and is tailored by mission flight surgeons.
    """

    def __init__(
        self,
        rolling_window: int = 5,
        target_exercise_minutes: float = 120.0,
        reference_target_exercise_minutes: Optional[float] = None,
        default_data_source: str = "SYNTHETIC_SIMULATED",
        default_is_simulated: bool = True,
        default_dataset_reference: Optional[str] = None
    ):
        super().__init__(
            hazard_category=HazardCategory.GRAVITY_FIELDS,
            rolling_window=rolling_window,
            default_data_source=default_data_source,
            default_is_simulated=default_is_simulated,
            default_dataset_reference=default_dataset_reference
        )
        self.reference_target_exercise_minutes = reference_target_exercise_minutes or target_exercise_minutes
        self.target_exercise_minutes = self.reference_target_exercise_minutes

    def process(
        self,
        df: pd.DataFrame,
        unit_exercise: str = "minutes",
        reference_target_exercise_minutes: Optional[float] = None
    ) -> Tuple[pd.DataFrame, DataQualityReport, HazardMetadata]:
        """
        Processes gravity field adaptation metrics.
        """
        target_mins = reference_target_exercise_minutes or self.reference_target_exercise_minutes
        metadata = HazardMetadata(
            hazard_category=self.hazard_category,
            data_source=self.default_data_source,
            is_simulated=self.default_is_simulated,
            dataset_reference=self.default_dataset_reference,
            original_units={"exercise": unit_exercise},
            conversion_notes={"target_exercise_minutes": f"Operational guideline reference: {target_mins} min"}
        )

        cleaned, report = self.validate_and_normalize_time(df, bounds=GRAVITY_BOUNDS)
        if cleaned.empty:
            return cleaned, report, metadata

        out = cleaned.copy()

        # 1. Countermeasure Adherence Tracking
        if "active_exercise_minutes" in out.columns:
            out["exercise_adherence_ratio"] = out["active_exercise_minutes"] / target_mins
            out["exercise_deficit_minutes"] = np.maximum(0.0, target_mins - out["active_exercise_minutes"])

        # 2. Causal Step Differences (Detect acute drop in exercise compliance or vestibular ataxia)
        step_cols = [c for c in ["active_exercise_minutes", "balance_coordination_score", "orthostatic_adaptation_index"] if c in out.columns]
        out = self.compute_causal_step_diff(out, step_cols)

        # 3. Causal Rolling Statistics
        out = self.compute_causal_rolling(out, step_cols, window=self.rolling_window)

        # Preserve provenance
        out["reference_target_exercise_minutes"] = target_mins
        out["target_exercise_minutes"] = target_mins
        out["original_unit_exercise"] = unit_exercise

        return out, report, metadata
