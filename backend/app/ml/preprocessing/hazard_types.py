"""
SPACECARE Hazard Categorization & Metadata Specifications.
Aligned with the five NASA Human Research Program (HRP) spaceflight hazards:
1. Space Radiation
2. Isolation and Confinement
3. Distance from Earth
4. Gravity Fields
5. Hostile/Closed Environments
Plus core physiological biometrics.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Optional, Any


class HazardCategory(str, Enum):
    """The core human-spaceflight hazard classifications."""
    PHYSIOLOGICAL = "PHYSIOLOGICAL"
    SPACE_RADIATION = "SPACE_RADIATION"
    ISOLATION_CONFINEMENT = "ISOLATION_CONFINEMENT"
    DISTANCE_FROM_EARTH = "DISTANCE_FROM_EARTH"
    GRAVITY_FIELDS = "GRAVITY_FIELDS"
    HOSTILE_CLOSED_ENVIRONMENT = "HOSTILE_CLOSED_ENVIRONMENT"


@dataclass
class HazardMetadata:
    """
    Preserves data provenance, original measurement units, and conversion notes
    for every processed measurement stream.
    """
    hazard_category: HazardCategory
    data_source: str = "SYNTHETIC_SIMULATED"  # "NASA_RESEARCH", "SYNTHETIC_SIMULATED", "SENSOR_LIVE"
    is_simulated: bool = True
    dataset_reference: Optional[str] = None
    original_units: Dict[str, str] = field(default_factory=dict)
    conversion_notes: Dict[str, str] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hazard_category": self.hazard_category.value,
            "data_source": self.data_source,
            "is_simulated": self.is_simulated,
            "dataset_reference": self.dataset_reference,
            "original_units": self.original_units.copy(),
            "conversion_notes": self.conversion_notes.copy(),
        }
