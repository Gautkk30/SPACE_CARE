# Team Organization & Responsibilities

This document defines the functional roles, task assignments, and technical ownership for the SPACECARE project (NASA Space Apps Challenge 2026).

---

## Team Roster & Ownership Matrix

```
                          +------------------------+
                          |   Member 1: Team Lead  |
                          |  NASA Research, Data   |
                          |  Integration & Lead    |
                          +-----------+------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
+----------------v----------------+       +----------------v----------------+
|  Member 2: Frontend Developer   |       | Member 3: Backend & ML Developer|
|  React, UI/UX, Visualizations,  |       | FastAPI, Database, ML Anomaly   |
|  Dashboard, & API Client        |       | Detection, & Alert Engine       |
+---------------------------------+       +---------------------------------+
```

---

## Detailed Roles and Responsibilities

### Member 1 – Team Lead (Research & Data Integration)
**Core Ownership**:
- **NASA Research**: Survey literature and standards from the NASA Human Research Program (HRP) and Space Radiation Program.
- **Dataset Identification**: Identify relevant open datasets in the NASA Open Science Data Repository (OSDR), Life Sciences Data Archive (LSDA), and GeneLab.
- **Scientific Validation**: Ensure all physiological thresholds, hazard parameters, and mitigation strategies are scientifically grounded and cited.
- **NASA Data Integration**: Formulate integration contracts for the NASA DONKI API and OSDR endpoints.
- **GitHub Coordination**: Manage Git branches, code reviews, PR approvals, issue tracking, and repository releases.
- **Final System Integration**: Lead cross-tier integration testing and prepare final challenge presentation materials.

### Member 2 – Frontend Developer (User Interface & Visualizations)
**Core Ownership**:
- **React Application**: Architect and maintain the React + Vite + TypeScript web application structure.
- **Dashboard UI**: Design responsive, accessible astronaut mission telemetry views following modern dark/space mission control design aesthetics.
- **Health Monitoring Interfaces**: Implement screens for cardiovascular, musculoskeletal, radiation, and mental health tracking.
- **Charts and Visualizations**: Build interactive time-series plots, gauges, and risk heatmaps using Recharts and Lucide icons.
- **API Integration on Frontend**: Build typed API client services and React hooks to connect frontend state with backend FastAPI endpoints.

### Member 3 – Backend & ML Developer (API, Database, & Intelligent Engine)
**Core Ownership**:
- **FastAPI Core**: Develop high-performance asynchronous REST endpoints, route handlers, and Pydantic validation schemas.
- **Database Architecture**: Design SQLAlchemy relational models (SQLite initial, PostgreSQL-ready) and migration scripts.
- **Data Processing**: Build ETL pipelines for cleaning, normalizing, and windowing physiological time-series data.
- **ML Anomaly Detection**: Implement unsupervised anomaly detection algorithms (e.g., Isolation Forest, dynamic statistical scoring) to detect health deviations.
- **Alert Generation**: Implement the early warning scoring and alert dispatching engine.
- **Backend API Development**: Expose clean endpoints for telemetry ingestion, anomaly querying, and health report generation.

---

## Workflow & Collaboration Standards
1. **Branching Model**: Features branch from `main` using `feature/<domain>-<description>` (e.g., `feature/ml-isolation-forest`, `feature/ui-radiation-gauge`).
2. **Pull Requests**: Every PR requires a review from at least one peer before merging to `main`.
3. **Environment Isolation**: No production or personal keys are committed. All developers use `.env` based on `.env.example`.
4. **Data Discipline**: Never check in raw proprietary or unverified data as official NASA telemetry.
