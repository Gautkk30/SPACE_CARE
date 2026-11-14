"""
SPACECARE Standalone Telemetry Generation CLI
NASA Space Apps Challenge 2026

Usage:
    python scripts/generate_simulated_telemetry.py --count 100 --save-db --export-csv

NOTICE:
These records are ALGORITHMICALLY SIMULATED DEMONSTRATION DATA for engineering
testing. They are NOT authentic NASA astronaut data and are NOT medically validated.
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone
import pandas as pd

# Add backend directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.session import init_db, SessionLocal
from app.services.telemetry_generator import TelemetryGenerator, SimulatedPattern


def parse_arguments():
    parser = argparse.ArgumentParser(
        description="Generate synthetic, clearly labelled astronaut telemetry for testing."
    )
    parser.add_argument(
        "--astronaut-id",
        type=str,
        default="astro_03",
        help="Target astronaut ID (default: 'astro_03' - Major Marcus Chen)"
    )
    parser.add_argument(
        "--count",
        type=int,
        default=120,
        help="Number of telemetry readings to generate (default: 120)"
    )
    parser.add_argument(
        "--interval-seconds",
        type=int,
        default=60,
        help="Time delta in seconds between readings (default: 60)"
    )
    parser.add_argument(
        "--anomaly-rate",
        type=float,
        default=0.08,
        help="Fraction of readings with controlled abnormal patterns (default: 0.08)"
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Random seed for reproducible telemetry streams (default: 42)"
    )
    parser.add_argument(
        "--save-db",
        action="store_true",
        help="Persist generated readings directly into SQLite database"
    )
    parser.add_argument(
        "--export-csv",
        type=str,
        nargs="?",
        const=str(PROJECT_ROOT / "data" / "raw" / "simulated" / "sim_astro_03_telemetry.csv"),
        default=None,
        help="Save generated readings to a CSV file in data/raw/simulated/"
    )
    return parser.parse_args()


def main():
    args = parse_arguments()

    print("=" * 72)
    print("SPACECARE TELEMETRY GENERATION ENGINE")
    print("=" * 72)
    print("NOTICE: Fictional demonstration data. Not real astronaut measurements.")
    print("=" * 72)
    print(f"Astronaut ID    : {args.astronaut_id}")
    print(f"Readings Count  : {args.count}")
    print(f"Interval        : {args.interval_seconds}s")
    print(f"Anomaly Rate    : {args.anomaly_rate * 100:.1f}%")
    print(f"Random Seed     : {args.seed}")
    print(f"Save to DB      : {args.save_db}")
    print(f"Export CSV Path : {args.export_csv or 'None'}")
    print("-" * 72)

    # Initialize generator
    generator = TelemetryGenerator(astronaut_id=args.astronaut_id, seed=args.seed)
    readings = generator.generate_batch(
        count=args.count,
        interval_seconds=args.interval_seconds,
        anomaly_rate=args.anomaly_rate,
        dataset_reference="SIM_CLI_STREAM_TEST"
    )

    df = pd.DataFrame(readings)

    # Display preview table
    print("\nSample Preview (First 5 Readings):")
    preview_cols = ["timestamp", "heart_rate", "systolic_bp", "diastolic_bp", "spo2", "body_temperature", "respiration_rate", "simulated_pattern"]
    print(df[preview_cols].head())

    # Count simulated patterns
    print("\nPattern Breakdown:")
    pattern_counts = df["simulated_pattern"].value_counts().to_dict()
    for pattern, count in pattern_counts.items():
        print(f" - {pattern:25s}: {count:4d} readings ({count / len(df) * 100:.1f}%)")

    # Save to SQLite database if requested
    if args.save_db:
        print("\nSaving to SQLite database...")
        init_db()  # Ensure tables and demo astronaut exist
        with SessionLocal() as session:
            saved_records = generator.save_to_database(session, readings)
            print(f"Successfully committed {len(saved_records)} records to table 'telemetry' for {args.astronaut_id}.")

    # Export to CSV if requested
    if args.export_csv:
        export_path = Path(args.export_csv)
        export_path.parent.mkdir(parents=True, exist_ok=True)
        # Ensure sim_ prefix per data policy
        if not export_path.name.startswith("sim_"):
            export_path = export_path.with_name(f"sim_{export_path.name}")
        df.to_csv(export_path, index=False)
        print(f"Successfully exported {len(df)} readings to {export_path}")

    print("\nGeneration completed successfully.")


if __name__ == "__main__":
    main()
