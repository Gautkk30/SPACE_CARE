"""
Synthetic Astronaut Telemetry Generator
SPACECARE - NASA Space Apps Challenge 2026

CRITICAL DATA PROVENANCE NOTICE:
This module produces algorithmically simulated, fictional biometric readings
for system engineering verification and machine learning anomaly detection testing.
These readings are NOT authentic NASA astronaut medical data and are NOT
medically validated.
"""

from datetime import datetime, timezone, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any, Union
import numpy as np
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut
from app.models.telemetry import Telemetry
from app.models.data_source import DataSource
from app.database.session import DEMO_ASTRONAUT


class SimulatedPattern(str, Enum):
    """Controlled physiological simulation states."""
    NORMAL = "NORMAL"
    HYPOXIA = "HYPOXIA"
    THERMAL_STRAIN = "THERMAL_STRAIN"
    ACUTE_TACHYCARDIA = "ACUTE_TACHYCARDIA"
    HYPOTENSION_DECONDITIONING = "HYPOTENSION_DECONDITIONING"


class TelemetryGenerator:
    """
    Generates realistic synthetic physiological telemetry for an astronaut.
    Uses astronaut-specific baseline values as the reference point.
    Injects controlled abnormal physiological patterns for anomaly detection testing.
    """

    def __init__(
        self,
        astronaut_id: str = "astro_03",
        baselines: Optional[Dict[str, float]] = None,
        seed: Optional[int] = None
    ):
        self.astronaut_id = astronaut_id
        self.baselines = baselines or self._default_baselines()
        self.rng = np.random.default_rng(seed)

    def _default_baselines(self) -> Dict[str, float]:
        """Provides default baselines matching the demo astronaut profile."""
        return {
            "baseline_heart_rate": DEMO_ASTRONAUT["baseline_heart_rate"],
            "baseline_systolic_bp": DEMO_ASTRONAUT["baseline_systolic_bp"],
            "baseline_diastolic_bp": DEMO_ASTRONAUT["baseline_diastolic_bp"],
            "baseline_spo2": DEMO_ASTRONAUT["baseline_spo2"],
            "baseline_body_temperature": DEMO_ASTRONAUT["baseline_body_temperature"],
            "baseline_respiration_rate": DEMO_ASTRONAUT["baseline_respiration_rate"],
        }

    @classmethod
    def from_database(cls, db_session: Session, astronaut_id: str = "astro_03", seed: Optional[int] = None) -> "TelemetryGenerator":
        """
        Constructs a generator initialized with baseline vitals loaded directly
        from the astronaut's record in the database.
        """
        astro = db_session.get(Astronaut, astronaut_id)
        if astro is None:
            raise ValueError(f"Astronaut with ID '{astronaut_id}' does not exist in database.")

        baselines = {
            "baseline_heart_rate": astro.baseline_heart_rate,
            "baseline_systolic_bp": astro.baseline_systolic_bp,
            "baseline_diastolic_bp": astro.baseline_diastolic_bp,
            "baseline_spo2": astro.baseline_spo2,
            "baseline_body_temperature": astro.baseline_body_temperature,
            "baseline_respiration_rate": astro.baseline_respiration_rate,
        }
        return cls(astronaut_id=astronaut_id, baselines=baselines, seed=seed)

    def generate_reading(
        self,
        timestamp: Optional[datetime] = None,
        pattern: Union[SimulatedPattern, str] = SimulatedPattern.NORMAL,
        dataset_reference: str = "SIM_SPACECARE_DEMO_RUN"
    ) -> Dict[str, Any]:
        """
        Generates a single physiological reading for a given timestamp and simulation pattern.
        Timestamps are strictly timezone-aware UTC.
        """
        ts = timestamp or datetime.now(timezone.utc)
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)

        # Normalize pattern to SimulatedPattern enum
        if isinstance(pattern, str) and not isinstance(pattern, SimulatedPattern):
            try:
                pattern = SimulatedPattern(pattern)
            except ValueError:
                pattern = SimulatedPattern.NORMAL

        pattern_value = pattern.value if hasattr(pattern, "value") else str(pattern)

        # Baseline starting values
        b_hr = self.baselines["baseline_heart_rate"]
        b_sys = self.baselines["baseline_systolic_bp"]
        b_dia = self.baselines["baseline_diastolic_bp"]
        b_spo2 = self.baselines["baseline_spo2"]
        b_temp = self.baselines["baseline_body_temperature"]
        b_rr = self.baselines["baseline_respiration_rate"]

        # Realistic circadian sinusoidal shift (24-hour cycle)
        hour_fraction = (ts.hour + ts.minute / 60.0 + ts.second / 3600.0) / 24.0
        circadian_hr = 2.5 * np.sin(2 * np.pi * hour_fraction)
        circadian_temp = 0.15 * np.sin(2 * np.pi * hour_fraction)

        # Micro-variations (Gaussian noise around baseline)
        hr = b_hr + circadian_hr + float(self.rng.normal(0, 1.2))
        sys_bp = b_sys + float(self.rng.normal(0, 1.5))
        dia_bp = b_dia + float(self.rng.normal(0, 1.2))
        spo2 = b_spo2 + float(self.rng.normal(0, 0.2))
        temp = b_temp + circadian_temp + float(self.rng.normal(0, 0.05))
        rr = b_rr + float(self.rng.normal(0, 0.5))

        # Controlled abnormal physiological patterns for anomaly testing
        if pattern == SimulatedPattern.HYPOXIA:
            # Low blood oxygen saturation, compensatory tachycardia and tachypnea
            spo2 = float(self.rng.uniform(88.0, 92.0))
            hr += float(self.rng.uniform(25.0, 40.0))
            rr += float(self.rng.uniform(7.0, 12.0))

        elif pattern == SimulatedPattern.THERMAL_STRAIN:
            # Elevated core temperature, compensatory heat dissipation tachycardia
            temp = float(self.rng.uniform(38.5, 39.3))
            hr += float(self.rng.uniform(25.0, 45.0))
            sys_bp += float(self.rng.uniform(12.0, 22.0))

        elif pattern == SimulatedPattern.ACUTE_TACHYCARDIA:
            # Sudden resting heart rate spike and elevated pulse pressure
            hr += float(self.rng.uniform(55.0, 75.0))
            sys_bp += float(self.rng.uniform(15.0, 30.0))
            rr += float(self.rng.uniform(4.0, 8.0))

        elif pattern == SimulatedPattern.HYPOTENSION_DECONDITIONING:
            # Acute microgravity orthostatic deconditioning / pressure drop
            sys_bp = float(self.rng.uniform(80.0, 89.0))
            dia_bp = float(self.rng.uniform(48.0, 56.0))
            hr += float(self.rng.uniform(15.0, 28.0))

        # Bounds clipping to keep values within physically plausible human parameters
        hr = float(np.clip(hr, 30.0, 220.0))
        sys_bp = float(np.clip(sys_bp, 60.0, 230.0))
        dia_bp = float(np.clip(dia_bp, 35.0, 140.0))
        spo2 = float(np.clip(spo2, 70.0, 100.0))
        temp = float(np.clip(temp, 33.0, 42.5))
        rr = float(np.clip(rr, 6.0, 45.0))

        return {
            "astronaut_id": self.astronaut_id,
            "timestamp": ts,
            "heart_rate": round(hr, 1),
            "systolic_bp": round(sys_bp, 1),
            "diastolic_bp": round(dia_bp, 1),
            "spo2": round(spo2, 1),
            "body_temperature": round(temp, 2),
            "respiration_rate": round(rr, 1),
            "data_source": DataSource.SYNTHETIC_SIMULATED.value,
            "is_simulated": True,
            "dataset_reference": dataset_reference,
            # Informational pattern tag (used for test assertions and evaluation)
            "simulated_pattern": pattern_value,
        }

    def generate_batch(
        self,
        count: int = 100,
        start_time: Optional[datetime] = None,
        interval_seconds: int = 60,
        anomaly_rate: float = 0.05,
        dataset_reference: str = "SIM_SPACECARE_DEMO_RUN"
    ) -> List[Dict[str, Any]]:
        """
        Generates a sequence of time-series readings with realistic progression
        and randomly interspersed controlled abnormal events.
        """
        if start_time is None:
            # Default to ending at current time
            now = datetime.now(timezone.utc)
            start = now - timedelta(seconds=count * interval_seconds)
        else:
            start = start_time if start_time.tzinfo else start_time.replace(tzinfo=timezone.utc)

        readings = []
        current_time = start

        abnormal_patterns = [
            SimulatedPattern.HYPOXIA,
            SimulatedPattern.THERMAL_STRAIN,
            SimulatedPattern.ACUTE_TACHYCARDIA,
            SimulatedPattern.HYPOTENSION_DECONDITIONING,
        ]

        for _ in range(count):
            roll = float(self.rng.random())
            if roll < anomaly_rate:
                chosen_pattern = abnormal_patterns[int(self.rng.integers(0, len(abnormal_patterns)))]
            else:
                chosen_pattern = SimulatedPattern.NORMAL

            reading = self.generate_reading(
                timestamp=current_time,
                pattern=chosen_pattern,
                dataset_reference=dataset_reference
            )
            readings.append(reading)
            current_time += timedelta(seconds=interval_seconds)

        return readings

    def save_to_database(
        self,
        db_session: Session,
        readings: List[Dict[str, Any]]
    ) -> List[Telemetry]:
        """
        Persists a collection of generated dictionary readings into the SQLite database.
        Returns the saved Telemetry ORM instances.
        """
        # Ensure the astronaut exists in database before insertion to satisfy foreign key
        astro = db_session.get(Astronaut, self.astronaut_id)
        if astro is None:
            raise ValueError(
                f"Astronaut '{self.astronaut_id}' must exist in the database before saving telemetry. "
                "Run init_db() first."
            )

        telemetry_objects = []
        for r in readings:
            obj = Telemetry(
                astronaut_id=r["astronaut_id"],
                timestamp=r["timestamp"],
                heart_rate=r["heart_rate"],
                systolic_bp=r["systolic_bp"],
                diastolic_bp=r["diastolic_bp"],
                spo2=r["spo2"],
                body_temperature=r["body_temperature"],
                respiration_rate=r["respiration_rate"],
                data_source=r["data_source"],
                is_simulated=r["is_simulated"],
                dataset_reference=r.get("dataset_reference"),
            )
            telemetry_objects.append(obj)

        db_session.add_all(telemetry_objects)
        db_session.commit()

        # Refresh objects to populate assigned IDs
        for obj in telemetry_objects:
            db_session.refresh(obj)

        return telemetry_objects

    def generate_and_save(
        self,
        db_session: Session,
        count: int = 100,
        start_time: Optional[datetime] = None,
        interval_seconds: int = 60,
        anomaly_rate: float = 0.05,
        dataset_reference: str = "SIM_SPACECARE_DEMO_RUN"
    ) -> List[Telemetry]:
        """
        Convenience execution flow: generates readings and persists them directly to the database.
        """
        readings = self.generate_batch(
            count=count,
            start_time=start_time,
            interval_seconds=interval_seconds,
            anomaly_rate=anomaly_rate,
            dataset_reference=dataset_reference
        )
        return self.save_to_database(db_session, readings)
