# SPACECARE System Architecture

This document describes the high-level architecture, module decomposition, and data flow of the SPACECARE platform.

---

## 1. Architectural Overview

SPACECARE is designed as a decoupled, micro-modular application composed of:
1. **Frontend Presentation Tier**: React 18+ Single Page Application (SPA) with Vite, TypeScript, and Tailwind CSS.
2. **Backend Application Tier**: FastAPI asynchronous RESTful API with Pydantic data schemas.
3. **Storage & Persistence Tier**: SQLAlchemy 2.0 ORM with SQLite for rapid local development and PostgreSQL compatibility for production.
4. **Machine Learning & Analytics Tier**: Modular Scikit-learn/NumPy/Pandas pipelines for feature preprocessing, statistical profiling, and unsupervised anomaly detection.
5. **NASA Data Integration Service**: External asynchronous adapters querying NASA Open Science Data Repository (OSDR) and DONKI APIs with caching.

```
+-----------------------------------------------------------------------+
|                            USER INTERFACE                             |
|        React + Vite + TypeScript + Tailwind CSS + Recharts            |
|  - Real-time Telemetry Dashboard    - Radiation Hazard Tracker        |
|  - Cardiovascular & Vitals Panel    - Mental Health & Sleep Insights  |
|  - Alerts & Early Warnings View     - Astronaut Health Report Gen     |
+-----------------------------------+-----------------------------------+
                                    |
                            HTTP / REST APIs
                                    |
+-----------------------------------v-----------------------------------+
|                           BACKEND CORE API                            |
|                          (Python / FastAPI)                           |
|  +---------------------+  +--------------------+  +-----------------+ |
|  |   API Routes Layer  |  |   Services Layer   |  | Pydantic Schemas| |
|  | (/vitals, /alerts)  |  | (Business Logic)   |  | (Data Validation| |
|  +----------+----------+  +---------+----------+  +-----------------+ |
+-------------|-----------------------|---------------------------------+
              |                       |
      +-------v-------+       +-------v-------+       +-----------------+
      |  Persistence  |       | ML / Anomaly  |       | NASA External   |
      | (SQLAlchemy / |       | Engine        |       | Service Layer   |
      |  SQLite / PG) |       | (Scikit-learn)|       | (OSDR / DONKI)  |
      +---------------+       +---------------+       +-----------------+
```

---

## 2. Tier Breakdown

### A. Frontend Tier (`frontend/`)
- **Vite & React**: Fast development server and production bundler.
- **Component Design**:
  - `components/common/`: Reusable primitives (Buttons, Cards, Badges, Modals).
  - `components/dashboard/`: Mission status widgets, crew summary cards.
  - `components/health/`: Heart rate, blood pressure, SpO2, and bone/muscle metrics.
  - `components/radiation/`: Space radiation dose gauges and solar flare indicators.
  - `components/mental-health/`: Sleep architecture and psychological state trackers.
  - `components/alerts/`: Prioritized early warning banners with action recommendations.
- **State & Data Fetching**: Typed service clients consuming FastAPI endpoints.

### B. Backend API Tier (`backend/app/`)
- **FastAPI Core**: Async route handling, dependency injection, and automatic OpenAPI/Swagger documentation generation.
- **API Routing**: Versioned prefix `/api/v1/` routing to distinct domain modules (`/astronauts`, `/vitals`, `/radiation`, `/alerts`, `/recommendations`).
- **Core Config**: Centralized settings via `pydantic-settings` reading from `.env`.

### C. Database Layer (`backend/app/database/` & `models/`)
- **SQLAlchemy ORM**: Decoupled entity definitions allowing smooth switching between SQLite (local zero-config) and PostgreSQL.
- **Models**:
  - `Astronaut`: Demographic, mission day, and baseline biological profiles.
  - `BiometricRecord`: Time-series vitals (HR, SpO2, BP, Temp).
  - `RadiationLog`: Dosimeter readings and space weather correlation.
  - `AlertRecord`: Triggered anomalies, severity levels, and acknowledgment state.
  - `Recommendation`: Actionable countermeasures tied to clinical standards.

### D. Machine Learning & Anomaly Detection (`backend/app/ml/`)
- **Preprocessing**: Robust scaling, outlier handling, and rolling-window statistical aggregations.
- **Detection Engines**:
  - Threshold-based Rule Engine: Immediate alerts for out-of-bounds critical vitals.
  - Isolation Forest / Local Outlier Factor: Multivariate anomaly detection across cross-system vitals (e.g., HR + SpO2 + Core Temp).
- **Separation of Concerns**: ML models consume normalized feature vectors and output confidence-scored anomaly vectors to the alert dispatcher.

### E. NASA Data Integration (`backend/app/integrations/nasa/`)
- **HTTPX Async Client**: Handles external requests with rate limiting and retry backoff.
- **DONKI Connector**: Fetches live space weather events (CME, Solar Flare, SEP).
- **OSDR Adapter**: Retrieves historical reference studies for normative distribution baselines.
- **Telemetry Isolator**: Enforces strict boundary between NASA reference data and simulated real-time stream data.

---

## 3. Security, Scalability, & Portability

- **Zero Hardcoded Secrets**: All endpoints and API tokens load exclusively through environment variables.
- **Independent Execution**: Frontend and backend are completely decoupled and can be run or deployed as standalone containers or services.
- **Offline Capability**: The backend ML anomaly engine executes locally without cloud ML dependencies, mirroring the disconnected operational reality of deep space exploration.
