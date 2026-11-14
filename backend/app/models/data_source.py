"""
Data source provenance categories for SPACECARE telemetry.
Complies with NASA Space Apps Challenge transparency rules.
"""

from enum import Enum


class DataSource(str, Enum):
    """
    Supported telemetry data sources:
    - NASA_RESEARCH: Open research archives (OSDR, LSDA)
    - SYNTHETIC_SIMULATED: Algorithmically generated mock telemetry
    - SENSOR_LIVE: Direct hardware/sensor telemetry stream
    """
    NASA_RESEARCH = "NASA_RESEARCH"
    SYNTHETIC_SIMULATED = "SYNTHETIC_SIMULATED"
    SENSOR_LIVE = "SENSOR_LIVE"
