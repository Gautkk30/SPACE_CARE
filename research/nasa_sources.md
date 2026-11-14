# NASA Data Sources & Portals

This document catalogues the official NASA data repositories, APIs, and scientific portals evaluated for the SPACECARE platform.

> **Important Data Disclaimer**: Live operational biometric telemetry of active astronauts is restricted medical data subject to NASA Institutional Review Board (IRB) and privacy regulations. SPACECARE uses open-access, de-identified research datasets from NASA archives for baseline analysis alongside strictly labeled simulated telemetry streams for real-time demonstration.

---

## 1. NASA Open Science Data Repository (OSDR)
- **Portal URL**: [https://osdr.nasa.gov/](https://osdr.nasa.gov/)
-- **API Documentation**: https://api.nasa.gov/
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


## 4. NASA Community Coordinated Modeling Center (CCMC) DONKI

- **Portal URL**: https://ccmc.gsfc.nasa.gov/DONKI/
- **API Base URL**: https://ccmc.gsfc.nasa.gov/DONKI-API/get/
- **Documentation**: https://ccmc.gsfc.nasa.gov/tools/DONKI/
- **Scope**: Solar flares, coronal mass ejections (CMEs), geomagnetic storms, solar energetic particle (SEP) events, and related space-weather notifications.
- **Target Application**: Space-weather event context for mission monitoring and research.

**Migration note:** NASA CCMC migrated DONKI to its new official URLs on September 30, 2026. Automated integrations must use the new API base URL.

**Scientific limitation:** DONKI event information is not a direct measurement of an individual astronaut's radiation dose. Do not convert CME or SEP event records into personal dose values without an independently validated radiation model and appropriate input measurements.

**Data quality note:** CCMC describes DONKI information as suitable for prototyping and research. It should not be represented as a certified operational radiation-warning system.
