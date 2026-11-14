# NASA Data Sources & Portals

This document catalogues the official NASA data repositories, APIs, and scientific portals evaluated for the SPACECARE platform.

> **Important Data Disclaimer**: Live operational biometric telemetry of active astronauts is restricted medical data subject to NASA Institutional Review Board (IRB) and privacy regulations. SPACECARE uses open-access, de-identified research datasets from NASA archives for baseline analysis alongside strictly labeled simulated telemetry streams for real-time demonstration.

---

## 1. NASA Open Science Data Repository (OSDR)
- **Portal URL**: [https://osdr.nasa.gov/](https://osdr.nasa.gov/)
- **API Documentation**: [https://osdr.nasa.gov/osdr/data/api](https://osdr.nasa.gov/osdr/data/api)
- **Scope**: Multi-omics, biological, and physiological data from spaceflight and ground analog studies (including GeneLab and Ames Life Sciences Data Archive data).
- **Target Application**: Baseline physiological responses to microgravity and ionizing radiation.

## 2. NASA Life Sciences Data Archive (LSDA)
- **Portal URL**: [https://lsda.jsc.nasa.gov/](https://lsda.jsc.nasa.gov/)
- **Scope**: Historical human, animal, and plant spaceflight experiments, space motion sickness studies, cardiovascular deconditioning, and bone mineral density loss studies.
- **Target Application**: Historical baselines for spaceflight health adaptation.

## 3. NASA Human Research Program (HRP)
- **Portal URL**: [https://www.nasa.gov/hrp](https://www.nasa.gov/hrp)
- **Human Research Roadmap**: [https://humanresearchroadmap.nasa.gov/](https://humanresearchroadmap.nasa.gov/)
- **Scope**: Investigates the 5 major hazards of human spaceflight:
  1. Space Radiation (RE)
  2. Isolation and Confinement (IC)
  3. Distance from Earth (DE)
  4. Gravity Fields (GF: microgravity, lunar, Martian)
  5. Hostile/Closed Environments (HCE)
- **Target Application**: Risk models, mitigation protocols, and early warning threshold definitions.

## 4. NASA Space Weather Database Of Notifications, Knowledge, Innovations (DONKI)
- **Portal URL**: [https://kauai.ccmc.gsfc.nasa.gov/DONKI/](https://kauai.ccmc.gsfc.nasa.gov/DONKI/)
- **API URL**: [https://api.nasa.gov/](https://api.nasa.gov/) (`/DONKI/CME`, `/DONKI/FLR`, `/DONKI/SEP`)
- **Scope**: Solar flares, coronal mass ejections (CMEs), geomagnetic storms, and solar energetic particle (SEP) events.
- **Target Application**: Space environmental radiation alerting and solar storm risk forecasting.

---

## Research Findings & Integration Notes

*Status: In Progress (Team Member 1 - Scientific Research Lead)*

- [ ] **OSDR Exploration**: Catalog relevant flight study IDs focusing on human analogs (e.g., bed-rest studies) and biomarker shifts.
- [ ] **DONKI API Query Validation**: Test solar particle event query schemas and response payload models.
- [ ] **HRP Evidence Base Mapping**: Map evidence-based mitigation recommendations to detected physiological anomalies.
