"""
SPACECARE Anomaly Detector Training & Evaluation CLI.
NASA Space Apps Challenge 2026

Trains the Physiological Isolation Forest and Telemetry Pipeline on chronological
baseline telemetry (first 900 readings) and evaluates performance on held-out test data
(last 300 readings) without future data leakage.

Saves model artifacts to backend/app/ml/models/:
- telemetry_pipeline.joblib
- isolation_forest.joblib
"""

import sys
from pathlib import Path
import numpy as np
import pandas as pd

# Add backend directory to sys.path
SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
BACKEND_DIR = PROJECT_ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.ml.preprocessing.pipeline import TelemetryPipeline
from app.ml.anomaly_detection.detector import PhysiologicalAnomalyDetector
from app.database.session import DEMO_ASTRONAUT


def train_and_evaluate(
    benchmark_csv_path: Path,
    output_model_dir: Path,
    train_size: int = 900,
    contamination: float = 0.06,
    random_state: int = 42
):
    print("=" * 76)
    print("SPACECARE PHYSIOLOGICAL ANOMALY DETECTOR - TRAINING & EVALUATION")
    print("=" * 76)
    print(f"Benchmark Dataset : {benchmark_csv_path}")
    print(f"Output Directory  : {output_model_dir}")
    print(f"Train / Test Split: Chronological (First {train_size} / Remainder)")
    print("-" * 76)

    if not benchmark_csv_path.exists():
        raise FileNotFoundError(f"Benchmark file not found at: {benchmark_csv_path}")

    df = pd.read_csv(benchmark_csv_path)
    total_records = len(df)
    print(f"Total benchmark records: {total_records}")

    if total_records <= train_size:
        raise ValueError(f"Total records ({total_records}) must be greater than train_size ({train_size}).")

    train_df = df.iloc[:train_size].copy()
    test_df = df.iloc[train_size:].copy()

    # Ground truth labels based on simulation pattern
    y_train = (train_df["simulated_pattern"] != "NORMAL").astype(int).to_numpy()
    y_test = (test_df["simulated_pattern"] != "NORMAL").astype(int).to_numpy()

    print(f"\nTraining partition : {len(train_df)} readings ({y_train.sum()} abnormal, {(1 - y_train.mean())*100:.1f}% nominal)")
    print(f"Testing partition  : {len(test_df)} readings ({y_test.sum()} abnormal, {(1 - y_test.mean())*100:.1f}% nominal)")

    # 1. Pipeline Fitting (Fit strictly on train_df)
    print("\nFitting TelemetryPipeline on training partition...")
    pipeline = TelemetryPipeline(scale_features=True)
    
    astro_baselines = {
        "baseline_heart_rate": DEMO_ASTRONAUT["baseline_heart_rate"],
        "baseline_systolic_bp": DEMO_ASTRONAUT["baseline_systolic_bp"],
        "baseline_diastolic_bp": DEMO_ASTRONAUT["baseline_diastolic_bp"],
        "baseline_spo2": DEMO_ASTRONAUT["baseline_spo2"],
        "baseline_body_temperature": DEMO_ASTRONAUT["baseline_body_temperature"],
        "baseline_respiration_rate": DEMO_ASTRONAUT["baseline_respiration_rate"],
    }

    (train_enriched, X_train, train_report), (test_enriched, X_test, test_report) = pipeline.fit_train_transform_test(
        train_df=train_df,
        test_df=test_df,
        astronaut_baselines=astro_baselines
    )

    print(f"Engineered feature matrix shape: Train={X_train.shape}, Test={X_test.shape}")

    # 2. Fit PhysiologicalAnomalyDetector on scaled X_train
    print(f"\nFitting PhysiologicalAnomalyDetector (contamination={contamination}, seed={random_state})...")
    detector = PhysiologicalAnomalyDetector(
        n_estimators=150,
        contamination=contamination,
        random_state=random_state,
        decision_threshold=0.0
    )
    detector.fit(X_train)

    # 3. Model Evaluation on Held-Out Test Set
    test_scores = detector.score_samples(X_test)
    y_pred = detector.predict(X_test)

    # Calculate Evaluation Metrics
    tp = int(np.sum((y_test == 1) & (y_pred == True)))
    fp = int(np.sum((y_test == 0) & (y_pred == True)))
    tn = int(np.sum((y_test == 0) & (y_pred == False)))
    fn = int(np.sum((y_test == 1) & (y_pred == False)))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    specificity = tn / (tn + fp) if (tn + fp) > 0 else 0.0
    fpr = fp / (fp + tn) if (fp + tn) > 0 else 0.0
    f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    print("\n" + "=" * 76)
    print("CHRONOLOGICAL HELD-OUT TEST EVALUATION RESULTS")
    print("=" * 76)
    print(f"Confusion Matrix:")
    print(f"  True Positives  (TP) : {tp:4d}  |  False Positives (FP) : {fp:4d}")
    print(f"  False Negatives (FN) : {fn:4d}  |  True Negatives  (TN) : {tn:4d}")
    print("-" * 76)
    print(f"  Precision            : {precision * 100:6.2f}%")
    print(f"  Recall (Sensitivity) : {recall * 100:6.2f}%")
    print(f"  Specificity          : {specificity * 100:6.2f}%")
    print(f"  False Positive Rate  : {fpr * 100:6.2f}%")
    print(f"  F1-Score             : {f1 * 100:6.2f}%")
    print("=" * 76)

    # Breakdown by pattern type in test partition
    print("\nRecall Breakdown by Controlled Simulated Pattern:")
    test_patterns = test_df["simulated_pattern"].to_numpy()
    for pat in np.unique(test_patterns):
        if pat == "NORMAL":
            continue
        mask = (test_patterns == pat)
        pat_total = int(np.sum(mask))
        pat_detected = int(np.sum(y_pred[mask]))
        print(f"  - {pat:26s}: {pat_detected:2d} / {pat_total:2d} detected ({pat_detected/pat_total*100:.1f}%)")

    # Sample Heuristic Explanation on a detected anomaly
    anom_indices = np.where(y_pred == True)[0]
    if len(anom_indices) > 0:
        sample_idx = anom_indices[0]
        actual_pat = test_patterns[sample_idx]
        score = test_scores[sample_idx]
        print(f"\nSample Heuristic Explanation (Test index #{sample_idx}, Pattern: {actual_pat}, Anomaly Score: {score:.3f}):")
        explanations = detector.explain_reading(X_test[sample_idx], top_k=3)
        for i, exp in enumerate(explanations, 1):
            print(f"  {i}. [{exp['feature']}] Robust z-score: {exp['robust_z_score']} ({exp['direction']})")
            print(f"     -> {exp['heuristic_explanation']}")

    # 4. Save Model Artifacts
    output_model_dir.mkdir(parents=True, exist_ok=True)
    pipeline_path = output_model_dir / "telemetry_pipeline.joblib"
    model_path = output_model_dir / "isolation_forest.joblib"

    print(f"\nSerializing pipeline to: {pipeline_path}")
    pipeline.save(pipeline_path)

    print(f"Serializing Isolation Forest model to: {model_path}")
    detector.save(model_path)

    print("\nModel training and artifact serialization complete.")
    return {
        "tp": tp, "fp": fp, "tn": tn, "fn": fn,
        "precision": precision,
        "recall": recall,
        "specificity": specificity,
        "fpr": fpr,
        "f1": f1
    }


if __name__ == "__main__":
    benchmark_file = PROJECT_ROOT / "data" / "raw" / "simulated" / "sim_astro_03_benchmark_1200.csv"
    models_dir = BACKEND_DIR / "app" / "ml" / "models"
    train_and_evaluate(benchmark_file, models_dir)
