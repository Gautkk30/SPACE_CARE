"""
SPACECARE Data Preprocessing & Multi-Hazard Feature Engineering Package.
Unified framework covering all five NASA human spaceflight hazards:
1. Space Radiation
2. Isolation and Confinement
3. Distance from Earth
4. Gravity Fields
5. Hostile/Closed Environments
Plus core physiological biometrics.
"""

from app.ml.preprocessing.hazard_types import (
    HazardCategory,
    HazardMetadata,
)
from app.ml.preprocessing.base_hazard import (
    BaseHazardPreprocessor,
)
from app.ml.preprocessing.schema_mapper import (
    DatasetSchemaMapper,
    NASA_OSDR_MAPPER,
    SYNTHETIC_MAPPER,
    CANONICAL_COLUMNS,
)
from app.ml.preprocessing.validator import (
    TelemetryValidator,
    DataQualityReport,
    PHYSIOLOGICAL_BOUNDS,
)
from app.ml.preprocessing.feature_engineer import (
    PhysiologicalFeatureEngineer,
    ML_FEATURE_COLUMNS,
    DEFAULT_BASELINES,
)
from app.ml.preprocessing.pipeline import (
    TelemetryPipeline,
    FEATURE_DOCUMENTATION,
)
from app.ml.preprocessing.radiation import (
    SpaceRadiationPreprocessor,
    RADIATION_BOUNDS,
)
from app.ml.preprocessing.isolation import (
    IsolationConfinementPreprocessor,
    ISOLATION_BOUNDS,
)
from app.ml.preprocessing.distance import (
    DistanceFromEarthPreprocessor,
    DISTANCE_BOUNDS,
)
from app.ml.preprocessing.gravity import (
    GravityFieldsPreprocessor,
    GRAVITY_BOUNDS,
)
from app.ml.preprocessing.environment import (
    HostileEnvironmentPreprocessor,
    ENVIRONMENT_BOUNDS,
    NOMINAL_HABITAT_SETPOINTS,
)
from app.ml.preprocessing.multi_hazard_pipeline import (
    MultiHazardPipeline,
)

__all__ = [
    # Hazard types and common base
    "HazardCategory",
    "HazardMetadata",
    "BaseHazardPreprocessor",
    # Physiological domain
    "DatasetSchemaMapper",
    "NASA_OSDR_MAPPER",
    "SYNTHETIC_MAPPER",
    "CANONICAL_COLUMNS",
    "TelemetryValidator",
    "DataQualityReport",
    "PHYSIOLOGICAL_BOUNDS",
    "PhysiologicalFeatureEngineer",
    "ML_FEATURE_COLUMNS",
    "DEFAULT_BASELINES",
    "TelemetryPipeline",
    "FEATURE_DOCUMENTATION",
    # 5 NASA Spaceflight Hazards
    "SpaceRadiationPreprocessor",
    "RADIATION_BOUNDS",
    "IsolationConfinementPreprocessor",
    "ISOLATION_BOUNDS",
    "DistanceFromEarthPreprocessor",
    "DISTANCE_BOUNDS",
    "GravityFieldsPreprocessor",
    "GRAVITY_BOUNDS",
    "HostileEnvironmentPreprocessor",
    "ENVIRONMENT_BOUNDS",
    "NOMINAL_HABITAT_SETPOINTS",
    # Unified Orchestrator
    "MultiHazardPipeline",
]
