# Data Directory Guide

This directory manages raw scientific data, simulated astronaut telemetry, processed training/validation datasets, and sample payloads for SPACECARE.

---

## Directory Organization

```
data/
├── raw/
│   ├── nasa/           # Authentic open research data (NASA OSDR, LSDA, DONKI)
│   └── simulated/      # Synthetically generated telemetry for local testing
├── processed/          # Normalized, cleaned, and feature-engineered datasets
├── sample/             # Lightweight mock payloads for automated tests
└── README.md           # This documentation file
```

---

## Data Provenance & Ethics Policy

1. **`raw/nasa/`**:
   - Contains open-access datasets from the NASA Open Science Data Repository (OSDR), GeneLab, and Space Weather events from NASA DONKI.
   - All data in this directory must include provenance documentation (source URL, study ID, and access date).
   - **No restricted personal health information (PHI)** or real identified astronaut medical records are ever stored here.

2. **`raw/simulated/`**:
   - Contains algorithmically generated biometrics (heart rate, SpO2, blood pressure, sleep cycles) designed to emulate mission conditions for system testing and algorithm development.
   - **Labeling Mandate**: All simulated telemetry files must clearly carry the prefix `sim_` or be stored exclusively within this directory.

3. **`processed/`**:
   - Contains cleaned and standardized data prepared for the Scikit-learn anomaly detection pipelines.
   - Derived strictly using scripts in `scripts/`.

4. **`sample/`**:
   - Minimal JSON or CSV payloads used by unit tests in `backend/tests/` to verify API schemas and route responses.
