# Datasets & Data Provenance

This document categorizes all datasets utilized within SPACECARE, distinguishing authentic open research data from synthesized verification streams.

---

## 1. Data Classification Policy

To maintain scientific integrity, all data ingested into SPACECARE is categorized into one of three classifications:

| Category | Source Type | Storage Location | Intended Usage |
| :--- | :--- | :--- | :--- |
| **Real Research Data** | NASA OSDR / LSDA Open Science | `data/raw/nasa/` | Baseline statistical distributions, biomarker profiles, and physiological reference ranges. |
| **Simulated Telemetry** | Synthetically generated algorithms | `data/raw/simulated/` | Testing real-time streaming, anomaly detection algorithms, and dashboard responsiveness. |
| **Environmental Telemetry** | NASA DONKI / Space Weather APIs | `data/raw/nasa/` | Solar flare and solar energetic particle event time series. |

> **Critical Notice**: Simulated telemetry must **never** be cited as clinical observation or authentic astronaut biometrics. All UI dashboards must display clear visual indicators when presenting simulated telemetry streams.

---

## 2. Real NASA Research Data Repositories

### NASA OSDR (Open Science Data Repository)
- **Dataset Focus**: Omics and physiological biomarkers pre-, in-, and post-flight.
- **Candidate Studies**:
  - Head-down tilt bed rest studies (ground-based microgravity analog).
  - NASA Twins Study baseline and epigenetic datasets.
- **Format**: CSV, TSV, JSON tabular metadata.

### NASA DONKI Space Weather Feeds
- **Dataset Focus**: Solar Energetic Particles (SEP), Coronal Mass Ejections (CME), Solar Flares (FLR).
- **Format**: JSON REST API responses.

---

## 3. Simulated Telemetry Schemas

For continuous telemetry simulation, the platform generates time-series records covering:
- **Cardiovascular**: Heart Rate (BPM), Heart Rate Variability (RMSSD), Systolic/Diastolic Blood Pressure (mmHg).
- **Respiratory & Oxygenation**: Blood Oxygen Saturation (SpO2 %), Respiration Rate (breaths/min).
- **Physical Condition**: Core Body Temperature (°C), Estimated Muscle Atrophy Index, Bone Density Scan Markers (Z-scores).
- **Sleep & Wellbeing**: Sleep Duration (hours), Sleep Quality Score (1-100), Subjective Fatigue / Mood Metric.
- **Environmental**: Cabin Radiation Dosimeter (μSv/h), Ambient CO2 (ppm), Ambient O2 (%).

Data generation scripts reside in `scripts/` and output strictly to `data/raw/simulated/`.
