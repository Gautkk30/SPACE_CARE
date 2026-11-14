# Datasets & Data Provenance

This document categorizes all datasets utilized within SPACECARE, distinguishing authentic open research data from synthesized verification streams.

---

## 1. Data Classification Policy

To maintain scientific integrity, all data ingested into SPACECARE is categorized into one of three classifications:

| Category | Source Type | Storage Location | Intended Usage |
| :--- | :--- | :--- | :--- |
| **Real Research Data** | NASA OSDR / LSDA Open Science | `data/raw/nasa/` | Baseline statistical distributions, biomarker profiles, and physiological reference ranges. |
| **Simulated Telemetry** | Synthetically generated algorithms | `data/raw/simulated/` | Testing real-time streaming, anomaly detection algorithms, and dashboard responsiveness. |
| **Space Weather Event Data** | NASA DONKI / Space Weather APIs | `data/raw/nasa/` | Solar flare and solar energetic particle event time series. |

> **Critical Notice**: Simulated telemetry must **never** be cited as clinical observation or authentic astronaut biometrics. All UI dashboards must display clear visual indicators when presenting simulated telemetry streams.

---


## 2. Real NASA Research Data Repositories

### NASA Open Science Data Repository (OSDR)

**Official repository:** [https://osdr.nasa.gov/](https://osdr.nasa.gov/)

OSDR provides access to biological and life-sciences research data through GeneLab and the Ames Life Sciences Data Archive (ALSDA).

**Data access APIs:**
- [Legacy OSDR Data API](https://osdr.nasa.gov/osdr/data/): Legacy endpoints for study search, metadata retrieval, and raw/processed file downloads.
- [OSDR Biological Data API](https://visualization.osdr.nasa.gov/biodata/api/): Modern REST and query interfaces supporting multi-study aggregation, table filters, and metadata visualization.

Supported outputs include JSON, CSV and TSV, depending on the endpoint and data type.

### Verified Dataset: OSD-946 / GLDS-773

- **Full title:** Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest (miRNA microarray data)
- **NASA OSDR accession:** OSD-946
- **GeneLab ID:** GLDS-773
- **DOI:** [10.26030/wzr2-r025](https://doi.org/10.26030/wzr2-r025)
- **GEO accession:** [GSE226504](https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE226504)
- **Related study:** OSD-942
- **Initial release:** 27 June 2024
- **License:** CC0-1.0
- **Dataset size:** 121.79 MB (as displayed on OSDR)
- **Samples:** 44
- **Participants:** 22 healthy young male volunteers
- **Organism:** *Homo sapiens*
- **Study type:** Ground-based 70-day, 6-degree head-down tilt bed-rest study
- **Technology:** Agilent miRNA microarray
- **Tissue:** *Vastus lateralis* skeletal muscle
- **Dataset page:** [https://osdr.nasa.gov/bio/repo/data/studies/OSD-946](https://osdr.nasa.gov/bio/repo/data/studies/OSD-946)
- **Related publication:** [doi:10.1249/MSS.0000000000003457](https://doi.org/10.1249/MSS.0000000000003457)

**Research objective:**

Investigate skeletal muscle microRNA expression changes during prolonged bed rest and evaluate the effects of aerobic and resistance exercise countermeasures.

**SPACECARE relevance:**

Supports the musculoskeletal research module by providing molecular evidence related to muscle deconditioning and exercise countermeasures.

**Data limitations:**

- This is molecular research data from tissue biopsies, not continuous physiological telemetry.
- It does not directly provide live heart rate, SpO2 or blood pressure readings.
- It represents a ground-based analogue study, not an actual orbital astronaut mission.
- It must not be used as a direct substitute for clinical vital-sign measurements.

**Status:** Raw data download, metadata inspection, and initial technical QC are complete. Biological differential-expression analysis and application integration are pending.

#### OSD-946 / GLDS-773 — Raw Data Quality Assessment

**Dataset:** Exercise Training Attenuates the Muscle Mitochondria Genomic Response to Bed Rest (miRNA microarray data)

**Source:** NASA Open Science Data Repository (OSDR)
**DOI:** [10.26030/wzr2-r025](https://doi.org/10.26030/wzr2-r025)
**Source accession:** GSE226504

**Data processing performed:**
- Downloaded all 44 raw Agilent miRNA microarray files (`.txt.gz`).
- Downloaded and extracted NASA ISA metadata.
- Inspected sample metadata, assay metadata and raw file structure.
- Identified 50,980 human miRNA probe records per sample using the `SystematicName` prefix `hsa-`.
- Calculated detected-probe counts using the `gIsGeneDetected` flag (`== 1`).
- Calculated detection percentages for all 44 samples.
- Generated group-level PRE/POST QC summaries via `scripts/osd946_qc.py`.

**Group-level detection summary:**

| Group | PRE average | POST average | Samples |
|---|---:|---:|---:|
| CON | 15.33% | 15.65% | 7 |
| EX | 15.95% | 16.56% | 7 |
| FLY | 13.65% | 13.79% | 8 |

**Output files:**
- `data/raw/nasa/osd946/qc_summary.csv`
- `data/raw/nasa/osd946/qc_group_summary.csv`

**Interpretation and limitations:**

These detection percentages are descriptive technical quality indicators, not direct measurements of muscle health or clinical outcomes. Differences between PRE and POST detection percentages must not be interpreted as evidence of treatment effectiveness.

The dataset represents a ground-based 70-day head-down tilt bed-rest analogue study, not actual orbital astronaut telemetry. It is intended for exploratory research into muscle-related molecular responses and exercise countermeasures.

Further normalization, probe annotation and statistical analysis are required before biological conclusions can be drawn.

### NASA Life Sciences Portal (NLSP) / Life Sciences Data Archive (LSDA)

**Official portal:** [https://nlsp.nasa.gov/](https://nlsp.nasa.gov/)

The NASA Life Sciences Portal (NLSP) is the primary gateway for research collections managed by NASA's Human Research Program (HRP) and the Life Sciences Data Archive (LSDA). It provides access to active and historical spaceflight mission data and ground-based analog studies dating back to 1961. Data availability and access conditions vary by investigation; restricted human physiological data requires formal NASA Institutional Review Board (IRB) and data request procedures.

### Ames Life Sciences Data Archive (ALSDA)

**Archive access via OSDR:** [https://osdr.nasa.gov/](https://osdr.nasa.gov/)

ALSDA is a NASA archive integrated into the Open Science Data Repository (OSDR). It primarily provides physiological, phenotypic, bioimaging, behavioral, hardware and environmental telemetry data from non-human space-relevant experiments, while also including some data from non-NASA human astronauts.

### NASA DONKI Space Weather API

**Official API documentation:** [https://api.nasa.gov/](https://api.nasa.gov/)

Relevant endpoints:

- CME – Coronal Mass Ejections
- FLR – Solar Flares
- SEP – Solar Energetic Particles

**Data format:** JSON REST API responses.

**SPACECARE application:** Provides space-weather event context for the radiation-risk module.

**Important limitation:** DONKI event records are not direct measurements of radiation dose received by an astronaut or readings from an ISS cabin dosimeter.

---

## 3. Simulated Telemetry Schemas

For continuous telemetry simulation, the platform generates time-series records covering:
- **Cardiovascular**: Heart Rate (BPM), Heart Rate Variability (RMSSD), Systolic/Diastolic Blood Pressure (mmHg).
- **Respiratory & Oxygenation**: Blood Oxygen Saturation (SpO2 %), Respiration Rate (breaths/min).
- **Physical Condition**: Core Body Temperature (°C), Estimated Muscle Atrophy Index, Bone Density Scan Markers (Z-scores).
- **Sleep & Wellbeing**: Sleep Duration (hours), Sleep Quality Score (1-100), Subjective Fatigue / Mood Metric.
- **Environmental**: Cabin Radiation Dosimeter (μSv/h), Ambient CO2 (ppm), Ambient O2 (%).

Data generation scripts reside in `scripts/` and output strictly to `data/raw/simulated/`.
