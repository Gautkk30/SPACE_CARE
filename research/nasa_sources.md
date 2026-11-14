# NASA Data Sources & Portals

This document catalogues the official NASA data repositories, APIs, and scientific portals evaluated for the SPACECARE platform.

> **Important Data Disclaimer**: Live operational biometric telemetry of active astronauts is restricted medical data subject to NASA Institutional Review Board (IRB) and privacy regulations. SPACECARE uses open-access, de-identified research datasets from NASA archives for baseline analysis alongside strictly labeled simulated telemetry streams for real-time demonstration.

---

## 1. NASA Open Science Data Repository (OSDR)
- **Portal URL**: [https://osdr.nasa.gov/](https://osdr.nasa.gov/)
- **API Documentation**: [Legacy OSDR Data API](https://osdr.nasa.gov/osdr/data/) | [OSDR Biological Data API](https://visualization.osdr.nasa.gov/biodata/api/)
- **Scope**: Multi-omics, biological, and physiological data from spaceflight and ground analog studies (including GeneLab and Ames Life Sciences Data Archive data).
- **Target Application**: Baseline physiological responses to microgravity and ionizing radiation.

## 2. NASA Life Sciences Data Archive (LSDA)
- **Portal URL**: [NASA Life Sciences Portal (NLSP)](https://nlsp.nasa.gov/) | [LSDA Archive](https://lsda.jsc.nasa.gov/)
- **Scope**: Historical human, animal, and plant spaceflight experiments, space motion sickness studies, cardiovascular deconditioning, and bone mineral density loss studies.
- **Target Application**: Historical baselines for spaceflight health adaptation.

## 3. NASA Human Research Program (HRP)
- **Portal URL**: [https://www.nasa.gov/hrp](https://www.nasa.gov/hrp)
- **Human Research Roadmap**: [https://humanresearchroadmap.nasa.gov/](https://humanresearchroadmap.nasa.gov/)
- **Core Risk & Hazard Frameworks**:
  - [5 Hazards of Human Spaceflight](https://www.nasa.gov/hrp/hazards/): Overview of major hazards affecting astronauts during spaceflight, informing the health risks SPACECARE monitors.
  - [Risks of Human Spaceflight](https://www.nasa.gov/hrp/risks/): NASA overview of health and performance risks associated with human spaceflight, informing risk categories and mitigation strategies.
  - [Ongoing HRP Research in Space](https://www.nasa.gov/hrp/ongoing-hrp-research/): Current research portfolio relevant to astronaut health monitoring and countermeasure evaluation.
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

## 5. Canadian Space Agency (CSA) & Partner Agency Resources

### Canadian Space Agency (CSA) Resources

- [Monitoring Radiation for Astronaut Health](https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp) (Published: February 26, 2026)
  Describes the development of the Canadian Active Neutron Spectrometer (CANS), an autonomous instrument designed to measure neutron radiation exposure in space. Also discusses earlier ISS radiation investigations, including MOSFET, EVARM, Radi-N and Radi-N2.
  **SPACECARE relevance:** Supports the radiation-monitoring module and provides context for radiation exposure measurement technologies.

- [Why Do We Conduct Science Experiments in Space?](https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp)
  Explains how ISS experiments help researchers understand the effects of microgravity, radiation, isolation and other spaceflight conditions on human health.
  **SPACECARE relevance:** Provides scientific background for the cardiovascular, musculoskeletal, radiation and behavioral-health modules.

---

## 6. Data Usage, Provenance and Attribution

These resources are scientific and technical references. They should not automatically be treated as downloadable datasets or live telemetry sources.

SPACECARE must clearly distinguish:
- NASA or CSA research findings.
- Actual publicly available research datasets.
- Simulated astronaut telemetry generated by the application.

NASA does not endorse SPACECARE or any other non-U.S. Government project. External resources must be used according to their respective data-use conditions.

**Scientific limitation:** DONKI event information is not a direct measurement of an individual astronaut's radiation dose. Do not convert CME or SEP event records into personal dose values without an independently validated radiation model and appropriate input measurements.

**Data quality note:** CCMC describes DONKI information as suitable for prototyping and research. It should not be represented as a certified operational radiation-warning system.
