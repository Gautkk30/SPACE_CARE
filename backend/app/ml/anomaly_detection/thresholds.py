"""
SPACECARE Hazard Detection Threshold Specifications.
NASA Space Apps Challenge 2026

CRITICAL SCIENTIFIC DOCUMENTATION & NOTICE:
All clinical and operational limits in this module are explicitly configurable.
Thresholds derived from standard aerospace guidelines (e.g. NASA STD-3001,
Space Flight Human-System Standard) are documented with their respective references.
Thresholds lacking spacecraft-specific validation for exploratory architectures
are explicitly categorized and labeled as:
    STATUS: PROVISIONAL_DEMO_THRESHOLDS
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional


class MissionPhase(str, Enum):
    """Mission operational context dictating latency, communication, and autonomy regimes."""
    LEO = "LEO"                      # Low Earth Orbit (ISS / Starlab) - latency < 2-5 seconds
    LUNAR_TRANSIT = "LUNAR_TRANSIT"  # Artemis Lunar Gateway / Orion - latency 1.3 - 10 seconds
    MARS_TRANSIT = "MARS_TRANSIT"    # Deep Space / Interplanetary Transit - latency 180 - 1300 seconds


@dataclass
class PhysiologicalThresholds:
    """
    Biometric boundaries for vital sign stability.
    References: NASA-STD-3001 Vol 1 & 2; standard aerospace aviation physiology.
    """
    # Heart Rate (bpm)
    hr_tachycardia_warning: float = 110.0
    hr_tachycardia_critical: float = 130.0
    hr_bradycardia_critical: float = 45.0
    hr_delta_from_baseline_warning: float = 35.0

    # Blood Pressure (mmHg)
    sys_bp_hypertension_warning: float = 145.0
    sys_bp_hypertension_critical: float = 160.0
    sys_bp_hypotension_critical: float = 90.0
    dia_bp_hypertension_warning: float = 95.0
    dia_bp_hypertension_critical: float = 105.0
    dia_bp_hypotension_critical: float = 50.0

    # Oxygen Saturation (%)
    spo2_warning: float = 93.0
    spo2_critical: float = 88.0

    # Core Body Temperature (°C)
    temp_fever_warning: float = 37.8
    temp_hyperthermia_critical: float = 38.6
    temp_hypothermia_critical: float = 35.0

    # Respiration Rate (breaths/min)
    rr_tachypnea_warning: float = 24.0
    rr_tachypnea_critical: float = 30.0
    rr_bradypnea_critical: float = 8.0

    # Hemodynamic Indices
    shock_index_warning: float = 0.90       # HR / Systolic BP (>0.9 indicates acute circulatory stress)
    pulse_pressure_narrow_warning: float = 25.0  # Systolic - Diastolic (<25 mmHg suggests hypovolemia/deconditioning)


@dataclass
class RadiationThresholds:
    """
    Space radiation exposure limits.
    References: NASA-STD-3001 Rev B; NCRP Report No. 153.
    """
    # Instantaneous Equivalent Dose Rate (uSv/h)
    spe_warning_rate_usv_h: float = 100.0        # Solar Particle Event onset indication
    spe_critical_rate_usv_h: float = 1000.0      # Immediate storm shelter protocol required

    # Cumulative Accrual Limits (uSv)
    # NASA career / short-term limits: 30-day limit is 250 mSv = 250,000 uSv
    career_30day_limit_usv: float = 250_000.0
    annual_limit_usv: float = 500_000.0

    # Baseline Deep Space GCR Ratio
    gcr_elevation_warning_ratio: float = 5.0     # 5x nominal deep space background (nominal ~20 uSv/h)


@dataclass
class IsolationConfinementThresholds:
    """
    Behavioral health, rest, and neuro-cognitive load limits.
    STATUS: PROVISIONAL_DEMO_THRESHOLDS
    """
    reference_sleep_target_hours: float = 8.0
    single_sleep_deprivation_warning_hours: float = 5.5
    single_sleep_deprivation_critical_hours: float = 4.0
    cumulative_sleep_debt_warning_hours: float = 8.0
    cumulative_sleep_debt_critical_hours: float = 14.0

    # Behavioral metrics (scale 1-10)
    workload_warning_score: float = 8.0
    mood_warning_score: float = 3.5


@dataclass
class DistanceFromEarthThresholds:
    """
    Latency and remote mission operational autonomy boundaries.
    STATUS: PROVISIONAL_DEMO_THRESHOLDS
    """
    # Tolerable one-way communication latency boundaries (seconds)
    # LEO: near real-time (< 5s)
    leo_max_latency_seconds: float = 5.0
    # Lunar: 1.3s one-way light time, round-trip ~2.6s - 10s
    lunar_max_latency_seconds: float = 12.0
    # Mars: interplanetary transit, 180s up to 1300s
    mars_max_latency_seconds: float = 1500.0

    # Autonomy shift trigger: when round-trip comm exceeds 60s, local AI decision guidance becomes mandatory
    autonomous_protocol_latency_threshold_seconds: float = 60.0


@dataclass
class GravityFieldsThresholds:
    """
    Physiological countermeasures against microgravity deconditioning and G-transitions.
    STATUS: PROVISIONAL_DEMO_THRESHOLDS
    """
    prescribed_daily_exercise_minutes: float = 150.0  # Standard ISS 2.5 hr daily exercise protocol
    daily_exercise_deficit_warning_minutes: float = 45.0
    daily_exercise_deficit_critical_minutes: float = 90.0

    # G-transition rate of change (delta g)
    acute_g_transition_warning: float = 1.5


@dataclass
class HostileEnvironmentThresholds:
    """
    Environmental Life Support Systems (ECLSS) limits.
    IMPORTANT AEROSPACE CONTEXT:
    Exploration atmospheres (e.g. Orion / Lunar Gateway) operate at reduced total pressure
    (e.g. 56.5 kPa / 8.2 psi) with enriched oxygen (34% O2) to enable rapid EVA egress
    without prolonged pre-breathe. Therefore, total pressure < 80 kPa or O2 < 19.5%
    are NOT universal emergencies!
    Instead, emergency is defined by:
    1. Depressurization rate (Delta P < -0.5 kPa/min)
    2. Inspired Oxygen Partial Pressure (P_O2 < 16.0 kPa)
    3. Elevated Carbon Dioxide Partial Pressure (P_CO2 > 0.5 kPa / 3.75 mmHg)
    """
    # Inspired Oxygen Partial Pressure (kPa)
    po2_hypoxia_warning_kpa: float = 17.5       # Nominal sea-level equivalent is ~21 kPa
    po2_hypoxia_critical_kpa: float = 16.0      # Critical hypoxia boundary (~120 mmHg)
    po2_hyperoxia_warning_kpa: float = 30.0

    # Carbon Dioxide Partial Pressure (kPa)
    # NASA limits: 0.5 kPa (3.75 mmHg) nominal ceiling; 0.7 kPa (5.25 mmHg) emergency scrubber fail
    pco2_elevated_warning_kpa: float = 0.50
    pco2_toxic_critical_kpa: float = 0.70

    # Cabin Depressurization Velocity (kPa / min)
    depressurization_rate_warning_kpa_min: float = -0.20
    depressurization_rate_critical_kpa_min: float = -0.50

    # Cabin Temperature (°C)
    cabin_temp_cold_warning: float = 17.0
    cabin_temp_hot_warning: float = 27.0
    cabin_temp_extreme_critical_high: float = 32.0
    cabin_temp_extreme_critical_low: float = 12.0


@dataclass
class HazardThresholdConfig:
    """
    Master configuration combining all 5 hazard domain thresholds and physiological biometrics.
    All properties are individually overrideable, inspectable, and auditable.
    """
    status_label: str = "PROVISIONAL_DEMO_THRESHOLDS"
    mission_phase: MissionPhase = MissionPhase.LUNAR_TRANSIT

    # Sensor Freshness / Staleness tolerance (seconds)
    telemetry_freshness_tolerance_seconds: float = 300.0  # 5 minutes before flagged STALE

    # Domain thresholds
    physiological: PhysiologicalThresholds = field(default_factory=PhysiologicalThresholds)
    radiation: RadiationThresholds = field(default_factory=RadiationThresholds)
    isolation: IsolationConfinementThresholds = field(default_factory=IsolationConfinementThresholds)
    distance: DistanceFromEarthThresholds = field(default_factory=DistanceFromEarthThresholds)
    gravity: GravityFieldsThresholds = field(default_factory=GravityFieldsThresholds)
    environment: HostileEnvironmentThresholds = field(default_factory=HostileEnvironmentThresholds)

    def to_dict(self) -> Dict[str, Any]:
        """Serializes current configuration to a dictionary."""
        return {
            "status_label": self.status_label,
            "mission_phase": self.mission_phase.value,
            "telemetry_freshness_tolerance_seconds": self.telemetry_freshness_tolerance_seconds,
            "physiological": self.physiological.__dict__,
            "radiation": self.radiation.__dict__,
            "isolation": self.isolation.__dict__,
            "distance": self.distance.__dict__,
            "gravity": self.gravity.__dict__,
            "environment": self.environment.__dict__,
        }
