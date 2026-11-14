"""
SPACECARE Multi-Hazard Deterministic Rule Engine.
NASA Space Apps Challenge 2026

Evaluates deterministic clinical and environmental safety boundaries across all five
NASA Human Research Program (HRP) spaceflight hazards:
1. Space Radiation
2. Isolation and Confinement
3. Distance from Earth
4. Gravity Fields
5. Hostile/Closed Environments
Plus core physiological biometrics.

CRITICAL DESIGN & NON-DIAGNOSTIC NOTICE:
- All thresholds are configurable via HazardThresholdConfig.
- Messages provide objective physiological/environmental observations, NOT medical diagnoses.
- Recommendations provide operational flight-surgeon countermeasures, NOT clinical treatments.
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Union
import numpy as np
import pandas as pd

from app.ml.preprocessing.hazard_types import HazardCategory
from app.ml.anomaly_detection.thresholds import HazardThresholdConfig, MissionPhase


@dataclass
class RuleViolation:
    """Represents a single deterministic threshold boundary breach."""
    hazard_category: HazardCategory
    severity: str                       # "INFO", "WARNING", "CRITICAL"
    rule_name: str
    message: str                        # Concise objective observation (<= 255 chars)
    recommendation: str                 # Operational countermeasure (<= 500 chars)
    supporting_values: Dict[str, Any] = field(default_factory=dict)
    rule_confidence: float = 0.95       # High confidence for direct deterministic limit violations

    def to_dict(self) -> Dict[str, Any]:
        return {
            "hazard_category": self.hazard_category.value,
            "severity": self.severity,
            "rule_name": self.rule_name,
            "message": self.message,
            "recommendation": self.recommendation,
            "supporting_values": self.supporting_values,
            "rule_confidence": self.rule_confidence,
        }


class MultiHazardRuleEngine:
    """
    Evaluates rule violations across physiological and environmental telemetry.
    """

    def __init__(self, config: Optional[HazardThresholdConfig] = None):
        self.config = config or HazardThresholdConfig()

    def evaluate_physiological(
        self,
        reading: Dict[str, Any],
        baselines: Optional[Dict[str, float]] = None
    ) -> List[RuleViolation]:
        """Evaluates biometric boundaries against physiological thresholds."""
        violations: List[RuleViolation] = []
        th = self.config.physiological

        hr = reading.get("heart_rate")
        sys_bp = reading.get("systolic_bp")
        dia_bp = reading.get("diastolic_bp")
        spo2 = reading.get("spo2")
        temp = reading.get("body_temperature")
        rr = reading.get("respiration_rate")

        # 1. Heart Rate Checks
        if hr is not None:
            if hr >= th.hr_tachycardia_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_SEVERE_TACHYCARDIA",
                    message=f"Acute heart rate elevation observed ({hr:.1f} bpm >= {th.hr_tachycardia_critical:.0f} bpm threshold).",
                    recommendation="Initiate rest protocol, verify EVA suit metabolic loop, and prepare telemetry for flight surgeon review.",
                    supporting_values={"heart_rate": hr, "threshold": th.hr_tachycardia_critical}
                ))
            elif hr >= th.hr_tachycardia_warning:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="WARNING",
                    rule_name="MODERATE_TACHYCARDIA_ELEVATION",
                    message=f"Elevated heart rate detected ({hr:.1f} bpm >= {th.hr_tachycardia_warning:.0f} bpm threshold).",
                    recommendation="Monitor exertion level, check hydration status, and re-assess in 15 minutes.",
                    supporting_values={"heart_rate": hr, "threshold": th.hr_tachycardia_warning}
                ))
            elif hr <= th.hr_bradycardia_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_BRADYCARDIA",
                    message=f"Severe heart rate depression observed ({hr:.1f} bpm <= {th.hr_bradycardia_critical:.0f} bpm threshold).",
                    recommendation="Assess crew responsiveness, check bio-harness sensor placement, and notify flight control.",
                    supporting_values={"heart_rate": hr, "threshold": th.hr_bradycardia_critical}
                ))

        # 2. Oxygen Saturation (SpO2) Checks
        if spo2 is not None:
            if spo2 <= th.spo2_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_HYPOXIA_CRITICAL",
                    message=f"Critical arterial oxygen desaturation detected ({spo2:.1f}% <= {th.spo2_critical:.1f}% threshold).",
                    recommendation="Verify cabin atmospheric O2 levels, inspect suit pressure seal and ventilation loop, and report reading to flight surgeon.",
                    supporting_values={"spo2": spo2, "threshold": th.spo2_critical}
                ))
            elif spo2 <= th.spo2_warning:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="WARNING",
                    rule_name="HYPOXIA_WARNING",
                    message=f"Sub-optimal oxygen saturation observed ({spo2:.1f}% <= {th.spo2_warning:.1f}% threshold).",
                    recommendation="Inspect cabin ventilation ducting, confirm scrubber functionality, and verify crew breathing ease.",
                    supporting_values={"spo2": spo2, "threshold": th.spo2_warning}
                ))

        # 3. Blood Pressure Checks
        if sys_bp is not None and dia_bp is not None:
            if sys_bp >= th.sys_bp_hypertension_critical or dia_bp >= th.dia_bp_hypertension_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_HYPERTENSIVE_SPIKE",
                    message=f"Arterial pressure surge detected ({sys_bp:.1f}/{dia_bp:.1f} mmHg).",
                    recommendation="Suspend strenuous physical activities; initiate seated rest and prepare clinical monitoring.",
                    supporting_values={"systolic_bp": sys_bp, "diastolic_bp": dia_bp}
                ))
            elif sys_bp <= th.sys_bp_hypotension_critical or dia_bp <= th.dia_bp_hypotension_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ORTHOSTATIC_HYPOTENSION_DECONDITIONING",
                    message=f"Arterial hypotension detected ({sys_bp:.1f}/{dia_bp:.1f} mmHg).",
                    recommendation="Engage lower-body compression garments, increase fluid and salt intake per countermeasure protocol.",
                    supporting_values={"systolic_bp": sys_bp, "diastolic_bp": dia_bp}
                ))

            # Shock Index (HR / Systolic BP)
            if hr is not None and sys_bp > 0:
                shock_index = hr / sys_bp
                if shock_index >= th.shock_index_warning:
                    violations.append(RuleViolation(
                        hazard_category=HazardCategory.PHYSIOLOGICAL,
                        severity="WARNING",
                        rule_name="ELEVATED_SHOCK_INDEX",
                        message=f"Cardiovascular shock index elevated ({shock_index:.2f} >= {th.shock_index_warning:.2f}).",
                        recommendation="Evaluate for hypovolemia or acute microgravity cardiovascular deconditioning.",
                        supporting_values={"shock_index": round(shock_index, 2)}
                    ))

        # 4. Body Temperature Checks
        if temp is not None:
            if temp >= th.temp_hyperthermia_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="HYPERTHERMIA_THERMAL_STRAIN",
                    message=f"Severe core temperature elevation detected ({temp:.2f}°C >= {th.temp_hyperthermia_critical:.1f}°C).",
                    recommendation="Activate active suit liquid cooling garment (LCG) or cabin cooling, enforce hydration.",
                    supporting_values={"body_temperature": temp, "threshold": th.temp_hyperthermia_critical}
                ))
            elif temp >= th.temp_fever_warning:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="WARNING",
                    rule_name="ELEVATED_CORE_TEMPERATURE",
                    message=f"Elevated core temperature observed ({temp:.2f}°C >= {th.temp_fever_warning:.1f}°C).",
                    recommendation="Check for metabolic overheating during workload or early febrile presentation.",
                    supporting_values={"body_temperature": temp, "threshold": th.temp_fever_warning}
                ))
            elif temp <= th.temp_hypothermia_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="HYPOTHERMIA_THERMAL_DROP",
                    message=f"Sub-nominal core temperature detected ({temp:.2f}°C <= {th.temp_hypothermia_critical:.1f}°C).",
                    recommendation="Adjust cabin thermal setpoint, inspect thermal garment insulation, check crew extremities.",
                    supporting_values={"body_temperature": temp, "threshold": th.temp_hypothermia_critical}
                ))

        # 5. Respiration Rate Checks
        if rr is not None:
            if rr >= th.rr_tachypnea_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_TACHYPNEA",
                    message=f"Rapid respiratory rate detected ({rr:.1f} breaths/min >= {th.rr_tachypnea_critical:.0f}).",
                    recommendation="Assess for hyperventilation, cabin PCO2 accumulation, or respiratory compensation.",
                    supporting_values={"respiration_rate": rr, "threshold": th.rr_tachypnea_critical}
                ))
            elif rr <= th.rr_bradypnea_critical:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.PHYSIOLOGICAL,
                    severity="CRITICAL",
                    rule_name="ACUTE_BRADYPNEA",
                    message=f"Depressed respiratory rate detected ({rr:.1f} breaths/min <= {th.rr_bradypnea_critical:.0f}).",
                    recommendation="Confirm crew consciousness, inspect airway status, verify biosensor placement.",
                    supporting_values={"respiration_rate": rr, "threshold": th.rr_bradypnea_critical}
                ))

        return violations

    def evaluate_radiation(self, reading: Dict[str, Any]) -> List[RuleViolation]:
        """Evaluates Space Radiation hazard stream."""
        violations: List[RuleViolation] = []
        th = self.config.radiation

        dose_rate = reading.get("dose_rate")
        cum_dose = reading.get("cumulative_exposure")
        elevation_ratio = reading.get("radiation_elevation_ratio")

        if dose_rate is not None:
            if dose_rate >= th.spe_critical_rate_usv_h:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.SPACE_RADIATION,
                    severity="CRITICAL",
                    rule_name="SOLAR_PARTICLE_EVENT_CRITICAL",
                    message=f"Solar Particle Event alert: dose rate at {dose_rate:.1f} uSv/h (>= {th.spe_critical_rate_usv_h:.0f} uSv/h).",
                    recommendation="ORDER IMMEDIATE CREW EVACUATION TO STORM SHELTER. Orient spacecraft shielding toward solar vector.",
                    supporting_values={"dose_rate_usv_h": dose_rate}
                ))
            elif dose_rate >= th.spe_warning_rate_usv_h:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.SPACE_RADIATION,
                    severity="WARNING",
                    rule_name="RADIATION_ELEVATION_WARNING",
                    message=f"Elevated radiation flux detected ({dose_rate:.1f} uSv/h >= {th.spe_warning_rate_usv_h:.0f} uSv/h).",
                    recommendation="Suspend planned EVA activities, prepare storm shelter equipment, monitor solar flux telemetry.",
                    supporting_values={"dose_rate_usv_h": dose_rate}
                ))

        if cum_dose is not None and cum_dose >= th.career_30day_limit_usv:
            violations.append(RuleViolation(
                hazard_category=HazardCategory.SPACE_RADIATION,
                severity="CRITICAL",
                rule_name="CUMULATIVE_DOSE_LIMIT_EXCEEDED",
                message=f"Mission 30-day cumulative radiation exposure ({cum_dose:.0f} uSv) exceeds safety ceiling ({th.career_30day_limit_usv:.0f} uSv).",
                recommendation="Enforce maximum radiation shielding protocols and initiate clinical biodosimetry assessment.",
                supporting_values={"cumulative_exposure_usv": cum_dose}
            ))

        return violations

    def evaluate_isolation(self, reading: Dict[str, Any]) -> List[RuleViolation]:
        """Evaluates Isolation and Confinement hazard stream."""
        violations: List[RuleViolation] = []
        th = self.config.isolation

        sleep_dur = reading.get("sleep_duration")
        sleep_debt = reading.get("cumulative_sleep_debt")
        workload = reading.get("workload_score")
        mood = reading.get("mood_score")

        if sleep_dur is not None:
            if sleep_dur <= th.single_sleep_deprivation_critical_hours:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.ISOLATION_CONFINEMENT,
                    severity="CRITICAL",
                    rule_name="ACUTE_SEVERE_SLEEP_DEPRIVATION",
                    message=f"Critical sleep loss ({sleep_dur:.1f} hrs <= {th.single_sleep_deprivation_critical_hours:.1f} hrs target).",
                    recommendation="Mandate protected rest window; restrict safety-critical robotic and EVA operations.",
                    supporting_values={"sleep_duration": sleep_dur}
                ))
            elif sleep_dur <= th.single_sleep_deprivation_warning_hours:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.ISOLATION_CONFINEMENT,
                    severity="WARNING",
                    rule_name="INSUFFICIENT_SLEEP_WARNING",
                    message=f"Sub-target sleep duration recorded ({sleep_dur:.1f} hrs).",
                    recommendation="Optimize sleep cabin acoustics/lighting; recommend circadian light therapy.",
                    supporting_values={"sleep_duration": sleep_dur}
                ))

        if sleep_debt is not None and sleep_debt >= th.cumulative_sleep_debt_critical_hours:
            violations.append(RuleViolation(
                hazard_category=HazardCategory.ISOLATION_CONFINEMENT,
                severity="CRITICAL",
                rule_name="CHRONIC_SLEEP_DEBT_CRITICAL",
                message=f"Severe cumulative sleep debt accrued ({sleep_debt:.1f} hrs >= {th.cumulative_sleep_debt_critical_hours:.1f} hrs).",
                recommendation="Reschedule mission timeline to accommodate cognitive recovery sleep periods.",
                supporting_values={"cumulative_sleep_debt": sleep_debt}
            ))

        if workload is not None and mood is not None:
            if workload >= th.workload_warning_score and mood <= th.mood_warning_score:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.ISOLATION_CONFINEMENT,
                    severity="WARNING",
                    rule_name="COGNITIVE_STRAIN_AND_MOOD_DEFICIT",
                    message=f"Elevated cognitive workload ({workload:.1f}/10) coupled with depressed mood valence ({mood:.1f}/10).",
                    recommendation="Schedule psychological decompression time; review task loading with mission planner.",
                    supporting_values={"workload_score": workload, "mood_score": mood}
                ))

        return violations

    def evaluate_distance(self, reading: Dict[str, Any]) -> List[RuleViolation]:
        """Evaluates Distance from Earth hazard stream and communication regimes."""
        violations: List[RuleViolation] = []
        th = self.config.distance

        latency = reading.get("communication_latency_seconds")
        if latency is not None:
            if latency >= th.autonomous_protocol_latency_threshold_seconds:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.DISTANCE_FROM_EARTH,
                    severity="WARNING",
                    rule_name="AUTONOMOUS_OPERATIONS_MANDATED",
                    message=f"One-way communication latency ({latency:.1f}s) precludes real-time ground consultation.",
                    recommendation="Activate autonomous medical procedures; ground station acts in supervisory advisory role.",
                    supporting_values={"latency_seconds": latency}
                ))

        return violations

    def evaluate_gravity(self, reading: Dict[str, Any]) -> List[RuleViolation]:
        """Evaluates Gravity Fields hazard stream (microgravity deconditioning / countermeasures)."""
        violations: List[RuleViolation] = []
        th = self.config.gravity

        exercise_deficit = reading.get("exercise_deficit_daily")
        if exercise_deficit is not None:
            if exercise_deficit >= th.daily_exercise_deficit_critical_minutes:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.GRAVITY_FIELDS,
                    severity="CRITICAL",
                    rule_name="SEVERE_EXERCISE_DEFICIT_CRITICAL",
                    message=f"Daily countermeasure deficit reached {exercise_deficit:.0f} mins (critical deconditioning risk).",
                    recommendation="Prioritize resistive and aerobic exercise session immediately to prevent bone/muscle degradation.",
                    supporting_values={"exercise_deficit_daily": exercise_deficit}
                ))
            elif exercise_deficit >= th.daily_exercise_deficit_warning_minutes:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.GRAVITY_FIELDS,
                    severity="WARNING",
                    rule_name="EXERCISE_TARGET_DEFICIT_WARNING",
                    message=f"Exercise target missed by {exercise_deficit:.0f} mins today.",
                    recommendation="Reschedule countermeasure session on T2 treadmill or ARED resistive device.",
                    supporting_values={"exercise_deficit_daily": exercise_deficit}
                ))

        return violations

    def evaluate_environment(self, reading: Dict[str, Any]) -> List[RuleViolation]:
        """Evaluates Hostile/Closed Environments (ECLSS life support metrics)."""
        violations: List[RuleViolation] = []
        th = self.config.environment

        depress_rate = reading.get("pressure_drop_rate")
        po2 = reading.get("o2_partial_pressure_kpa")
        pco2 = reading.get("co2_partial_pressure_kpa")
        cabin_temp = reading.get("cabin_temperature")

        # 1. Depressurization Velocity (Delta P / min)
        if depress_rate is not None:
            if depress_rate <= th.depressurization_rate_critical_kpa_min:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="CRITICAL",
                    rule_name="RAPID_CABIN_DEPRESSURIZATION_CRITICAL",
                    message=f"RAPID CABIN DEPRESSURIZATION: pressure dropping at {depress_rate:.2f} kPa/min.",
                    recommendation="IMMEDIATE HATCH ISOLATION AND PRESSURE SUIT INGRESS PROTOCOL. Locate hull breach.",
                    supporting_values={"depressurization_rate_kpa_min": depress_rate}
                ))
            elif depress_rate <= th.depressurization_rate_warning_kpa_min:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="WARNING",
                    rule_name="SLOW_CABIN_PRESSURE_LEAK",
                    message=f"Slow cabin pressure decline detected ({depress_rate:.2f} kPa/min).",
                    recommendation="Check valve seals, airlock seals, and inspect ECLSS pressure regulation telemetry.",
                    supporting_values={"depressurization_rate_kpa_min": depress_rate}
                ))

        # 2. Inspired Oxygen Partial Pressure (PO2)
        if po2 is not None:
            if po2 <= th.po2_hypoxia_critical_kpa:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="CRITICAL",
                    rule_name="ATMOSPHERIC_HYPOXIA_CRITICAL",
                    message=f"Atmospheric hypoxia: PO2 at {po2:.2f} kPa (critical threshold <= {th.po2_hypoxia_critical_kpa:.1f} kPa).",
                    recommendation="Inject high-pressure O2 from reserves; don emergency oxygen masks.",
                    supporting_values={"po2_kpa": po2}
                ))
            elif po2 <= th.po2_hypoxia_warning_kpa:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="WARNING",
                    rule_name="ATMOSPHERIC_OXYGEN_DEPLETION",
                    message=f"Sub-nominal oxygen partial pressure observed ({po2:.2f} kPa).",
                    recommendation="Verify oxygen generation assembly (OGA) and cabin gas mix regulation.",
                    supporting_values={"po2_kpa": po2}
                ))

        # 3. Carbon Dioxide Partial Pressure (PCO2)
        if pco2 is not None:
            if pco2 >= th.pco2_toxic_critical_kpa:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="CRITICAL",
                    rule_name="CABIN_HYPERCAPNIA_CRITICAL",
                    message=f"Toxic CO2 buildup: PCO2 at {pco2:.2f} kPa (>= {th.pco2_toxic_critical_kpa:.2f} kPa threshold).",
                    recommendation="SWAP ECLSS CO2 SCRUBBER BEDS IMMEDIATELY. Direct crew to ventilated cabin nodes.",
                    supporting_values={"pco2_kpa": pco2}
                ))
            elif pco2 >= th.pco2_elevated_warning_kpa:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="WARNING",
                    rule_name="ELEVATED_CO2_CONCENTRATION",
                    message=f"Elevated carbon dioxide observed ({pco2:.2f} kPa >= {th.pco2_elevated_warning_kpa:.2f} kPa).",
                    recommendation="Increase cabin air circulation; check CDRA / amine bed scrubbing cycle.",
                    supporting_values={"pco2_kpa": pco2}
                ))

        # 4. Cabin Temperature
        if cabin_temp is not None:
            if cabin_temp >= th.cabin_temp_extreme_critical_high or cabin_temp <= th.cabin_temp_extreme_critical_low:
                violations.append(RuleViolation(
                    hazard_category=HazardCategory.HOSTILE_CLOSED_ENVIRONMENT,
                    severity="CRITICAL",
                    rule_name="EXTREME_CABIN_TEMPERATURE",
                    message=f"Extreme cabin temperature observed ({cabin_temp:.1f}°C).",
                    recommendation="Inspect thermal control loops, radiator bypass valves, and heat exchangers.",
                    supporting_values={"cabin_temperature": cabin_temp}
                ))

        return violations

    def evaluate_multi_hazard(
        self,
        snapshot: Dict[str, Any],
        baselines: Optional[Dict[str, float]] = None
    ) -> List[RuleViolation]:
        """
        Evaluates all available hazard streams present in the unified telemetry snapshot.
        """
        all_violations: List[RuleViolation] = []
        all_violations.extend(self.evaluate_physiological(snapshot, baselines=baselines))
        all_violations.extend(self.evaluate_radiation(snapshot))
        all_violations.extend(self.evaluate_isolation(snapshot))
        all_violations.extend(self.evaluate_distance(snapshot))
        all_violations.extend(self.evaluate_gravity(snapshot))
        all_violations.extend(self.evaluate_environment(snapshot))
        return all_violations
