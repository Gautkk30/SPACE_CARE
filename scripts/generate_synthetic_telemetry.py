"""
SPACECARE Synthetic Telemetry Generator
NASA Space Apps Challenge 2026

IMPORTANT TRANSPARENCY NOTICE:
This script generates SYNTHETIC, ALGORITHMICALLY SIMULATED astronaut biometrics
for engineering testing and ML model training/evaluation.
This dataset is NOT real NASA astronaut medical data.
"""

import os
import sys
from pathlib import Path
from datetime import datetime, timedelta, timezone
import random
import numpy as np
import pandas as pd

# Define crew members with personalized baseline profiles
CREW_PROFILES = [
    {
        "id": "astro_01",
        "name": "Commander Alex Vance",
        "role": "Mission Commander",
        "age": 42,
        "gender": "Male",
        "mission": "Artemis Lunar Transit",
        "baseline_heart_rate": 68.0,
        "baseline_systolic_bp": 116.0,
        "baseline_diastolic_bp": 74.0,
        "baseline_spo2": 98.8,
        "baseline_body_temperature": 36.6,
        "baseline_respiration_rate": 13.0,
    },
    {
        "id": "astro_02",
        "name": "Dr. Elena Rostova",
        "role": "Chief Medical Officer",
        "age": 39,
        "gender": "Female",
        "mission": "Artemis Lunar Transit",
        "baseline_heart_rate": 64.0,
        "baseline_systolic_bp": 112.0,
        "baseline_diastolic_bp": 72.0,
        "baseline_spo2": 99.1,
        "baseline_body_temperature": 36.7,
        "baseline_respiration_rate": 12.0,
    },
    {
        "id": "astro_03",
        "name": "Major Marcus Chen",
        "role": "Flight Engineer",
        "age": 36,
        "gender": "Male",
        "mission": "Artemis Lunar Transit",
        "baseline_heart_rate": 72.0,
        "baseline_systolic_bp": 120.0,
        "baseline_diastolic_bp": 78.0,
        "baseline_spo2": 98.2,
        "baseline_body_temperature": 36.8,
        "baseline_respiration_rate": 15.0,
    },
    {
        "id": "astro_04",
        "name": "Dr. Sarah Jenkins",
        "role": "Payload Specialist",
        "age": 34,
        "gender": "Female",
        "mission": "Artemis Lunar Transit",
        "baseline_heart_rate": 70.0,
        "baseline_systolic_bp": 114.0,
        "baseline_diastolic_bp": 75.0,
        "baseline_spo2": 98.6,
        "baseline_body_temperature": 36.6,
        "baseline_respiration_rate": 14.0,
    },
]


def generate_astronaut_telemetry(
    profile: dict, 
    start_time: datetime, 
    num_points: int = 500, 
    interval_seconds: int = 60,
    anomaly_rate: float = 0.08
) -> list[dict]:
    """
    Generates time-series telemetry for a specific astronaut profile.
    Simulates:
    - Normal baseline fluctuations with circadian variations and Gaussian noise.
    - Nominal countermeasure exercise periods (elevated HR/BP/RR, normal SpO2).
    - Clear simulated anomaly events (hypoxia, thermal strain, cardiovascular distress).
    """
    records = []
    current_time = start_time

    # Base astronaut metrics
    base_hr = profile["baseline_heart_rate"]
    base_sys = profile["baseline_systolic_bp"]
    base_dia = profile["baseline_diastolic_bp"]
    base_spo2 = profile["baseline_spo2"]
    base_temp = profile["baseline_body_temperature"]
    base_rr = profile["baseline_respiration_rate"]

    np.random.seed(42 + hash(profile["id"]) % 1000)

    for i in range(num_points):
        # Circadian cycle (24-hour cycle)
        hour_fraction = (current_time.hour + current_time.minute / 60.0) / 24.0
        circadian_hr_shift = 3.0 * np.sin(2 * np.pi * hour_fraction)
        circadian_temp_shift = 0.2 * np.sin(2 * np.pi * hour_fraction)

        # Baseline noise
        hr = base_hr + circadian_hr_shift + np.random.normal(0, 1.8)
        sys_bp = base_sys + np.random.normal(0, 2.0)
        dia_bp = base_dia + np.random.normal(0, 1.5)
        spo2 = base_spo2 + np.random.normal(0, 0.3)
        temp = base_temp + circadian_temp_shift + np.random.normal(0, 0.08)
        rr = base_rr + np.random.normal(0, 0.8)

        # Ground truth state
        is_synthetic_anomaly = False
        simulation_state = "nominal"

        # Check if this point triggers an anomaly condition
        roll = np.random.random()
        if roll < anomaly_rate:
            is_synthetic_anomaly = True
            scenario = np.random.choice(["hypoxia_simulated", "thermal_strain_simulated", "cardiovascular_spike_simulated"])
            simulation_state = scenario

            if scenario == "hypoxia_simulated":
                # Simulated cabin O2 drop / respiratory challenge
                spo2 = float(np.random.uniform(88.0, 92.5))
                hr += float(np.random.uniform(28.0, 45.0))
                rr += float(np.random.uniform(8.0, 14.0))
            elif scenario == "thermal_strain_simulated":
                # Simulated core body overheating / thermal suit loop issue
                temp = float(np.random.uniform(38.5, 39.4))
                hr += float(np.random.uniform(30.0, 50.0))
                sys_bp += float(np.random.uniform(15.0, 25.0))
            elif scenario == "cardiovascular_spike_simulated":
                # Simulated acute tachycardia / sudden hemodynamic strain
                hr += float(np.random.uniform(50.0, 75.0))
                sys_bp += float(np.random.uniform(30.0, 45.0))
                dia_bp += float(np.random.uniform(15.0, 25.0))
                rr += float(np.random.uniform(6.0, 10.0))

        # Clamp metrics to physically plausible ranges
        hr = float(np.clip(hr, 35.0, 220.0))
        sys_bp = float(np.clip(sys_bp, 60.0, 220.0))
        dia_bp = float(np.clip(dia_bp, 40.0, 140.0))
        spo2 = float(np.clip(spo2, 70.0, 100.0))
        temp = float(np.clip(temp, 34.0, 42.0))
        rr = float(np.clip(rr, 6.0, 45.0))

        record = {
            "astronaut_id": profile["id"],
            "timestamp": current_time.isoformat(),
            "heart_rate": round(hr, 1),
            "spo2": round(spo2, 1),
            "blood_pressure_systolic": round(sys_bp, 1),
            "blood_pressure_diastolic": round(dia_bp, 1),
            "body_temperature": round(temp, 2),
            "core_temperature": round(temp, 2),
            "respiration_rate": round(rr, 1),
            "is_anomaly": is_synthetic_anomaly,
            "simulation_state": simulation_state,
            "data_source": "synthetic_simulated",  # Explicitly transparent tag
        }
        records.append(record)
        current_time += timedelta(seconds=interval_seconds)

    return records


def generate_all_telemetry(num_points_per_astronaut: int = 500) -> tuple[pd.DataFrame, list[dict]]:
    """
    Generates synthetic telemetry for all astronauts in the crew.
    """
    now = datetime.now(timezone.utc)
    start_time = now - timedelta(minutes=num_points_per_astronaut)

    all_records = []
    for profile in CREW_PROFILES:
        crew_records = generate_astronaut_telemetry(
            profile=profile,
            start_time=start_time,
            num_points=num_points_per_astronaut,
            interval_seconds=60,
            anomaly_rate=0.06
        )
        all_records.extend(crew_records)

    df = pd.DataFrame(all_records)
    return df, all_records


if __name__ == "__main__":
    # Project paths
    project_root = Path(__file__).resolve().parent.parent
    sim_data_dir = project_root / "data" / "raw" / "simulated"
    sample_data_dir = project_root / "data" / "sample"
    
    sim_data_dir.mkdir(parents=True, exist_ok=True)
    sample_data_dir.mkdir(parents=True, exist_ok=True)

    print("Generating clearly labelled synthetic telemetry dataset...")
    df, records = generate_all_telemetry(num_points_per_astronaut=600)

    # Save to CSV in data/raw/simulated/ with sim_ prefix per policy
    csv_path = sim_data_dir / "sim_astronaut_telemetry.csv"
    df.to_csv(csv_path, index=False)
    print(f"Successfully generated {len(df)} telemetry records -> {csv_path}")

    # Save small sample to data/sample/sample_telemetry.json
    import json
    sample_path = sample_data_dir / "sample_telemetry.json"
    with open(sample_path, "w", encoding="utf-8") as f:
        json.dump(records[:20], f, indent=2)
    print(f"Successfully wrote test sample -> {sample_path}")
    print(f"Anomalies simulated in dataset: {df['is_anomaly'].sum()} / {len(df)} ({df['is_anomaly'].mean()*100:.1f}%)")
