# SPACECARE

> **Intelligent Astronaut Health Monitoring & Early Warning System**  
> *NASA Space Apps Challenge 2026*

---

## 1. Project Overview & Problem Statement

Human spaceflight missions extending beyond Low Earth Orbit (such as the Artemis lunar campaigns and planned Mars expeditions) place astronauts under sustained multi-system physiological and psychological stressors. Microgravity induces rapid bone demineralization and cardiovascular deconditioning; cosmic and solar radiation present acute and long-term carcinogenic and neurological risks; and extreme confinement coupled with isolation induces sleep fragmentation and cognitive strain.

Compounding these hazards, deep space transit involves communication latencies of up to 22 minutes each way, precluding real-time telemedicine from mission control on Earth. 

**SPACECARE** is an autonomous, intelligent health monitoring and early warning software platform designed for deep space missions. It synthesizes physiological signals, environmental space radiation hazards, and sleep/wellbeing indicators to detect anomalous health patterns early and deliver evidence-based clinical mitigation recommendations directly to crew members and medical officers.

---

## 2. Project Objectives

- **Continuous Health Telemetry Tracking**: Aggregate multi-domain physiological telemetry (cardiovascular, respiratory, musculoskeletal indices).
- **Environmental Hazard Awareness**: Monitor cabin dosimeter readings and correlate with solar particle events via NASA DONKI.
- **Intelligent Anomaly Detection**: Implement unsupervised machine learning and clinical thresholding to detect early signs of physiological degradation before acute incidents occur.
- **Evidence-Based Mitigation**: Deliver actionable, scientifically grounded countermeasures aligned with NASA Human Research Program protocols.
- **Mission Health Reporting**: Generate comprehensive, individualized health status summaries for each crew member.

---

## 3. Planned Features

- [ ] **Real-Time Astronaut Telemetry Dashboard**: High-visibility mission control view tracking vital signs, SpO2, core body temperature, and HRV.
- [ ] **Cardiovascular Adaptation Monitor**: Long-term tracking of orthostatic intolerance risk and arterial stiffness indices.
- [ ] **Musculoskeletal Loss Tracker**: Tracking exercise countermeasure adherence (ARED) against estimated bone density and muscle mass retention curves.
- [ ] **Space Radiation Early Warning**: Cabin dosimeter tracking correlated with real-time/recent NASA DONKI solar storm and CME alerts.
- [ ] **Sleep Architecture & Psychological Wellbeing**: Circadian phase analysis, sleep efficiency scoring, and cognitive fatigue assessment.
- [ ] **AI-Powered Anomaly Detection Engine**: Multivariate anomaly detection (Isolation Forest / Statistical Scoring) on streaming biometrics.
- [ ] **Dynamic Alert & Action Dispatcher**: Multi-tiered alert banner (Info, Warning, Critical) with contextual countermeasure protocols.
- [ ] **Individual Astronaut Health Profiles & Export**: Exportable mission health report cards with longitudinal trend graphs.

---

## 4. Technology Stack

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: Recharts
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Validation**: Pydantic v2
- **ORM / Database**: SQLAlchemy 2.0 (SQLite for development, PostgreSQL-ready)
- **HTTP Client**: HTTPX (Async NASA API queries)

### Machine Learning & Data Processing
- **Scientific Computing**: NumPy, Pandas
- **Anomaly Detection**: Scikit-learn (Isolation Forest, Outlier Detection, Robust Scalers)

### NASA Data Integration
- **NASA Open Science Data Repository (OSDR)**: Baseline physiological distributions
- **NASA Life Sciences Data Archive (LSDA)**: Microgravity adaptation records
- **NASA Human Research Program (HRP)**: Evidence-based countermeasure guidelines
- **NASA DONKI API**: Solar energetic particle events, coronal mass ejections, and solar flare telemetry

---

## 5. Project Structure

```
SPACECARE/
│
├── frontend/                     # React + Vite + TypeScript application
│   ├── public/
│   │   ├── images/               # Static images and branding
│   │   └── icons/                # Spacecraft & medical UI icons
│   ├── src/
│   │   ├── assets/               # Local styles and assets
│   │   ├── components/           # Modular UI components
│   │   │   ├── common/           # Shared UI primitives (buttons, modals, badges)
│   │   │   ├── dashboard/        # Mission overview & status cards
│   │   │   ├── health/           # Cardiovascular, vitals, musculoskeletal widgets
│   │   │   ├── radiation/        # Dosimeter and space weather components
│   │   │   ├── mental-health/    # Sleep and psychological wellbeing cards
│   │   │   └── alerts/           # Early warning notifications & actions
│   │   ├── pages/                # Top-level view routes
│   │   ├── layouts/              # Navigation and shell layout wrappers
│   │   ├── hooks/                # Custom React state & telemetry hooks
│   │   ├── services/             # Typed API clients for backend endpoints
│   │   ├── types/                # TypeScript interface definitions
│   │   ├── utils/                # Formatting and statistical helpers
│   │   ├── styles/               # Global CSS & Tailwind setup
│   │   ├── App.tsx               # Root application component
│   │   └── main.tsx              # React DOM entry point
│   ├── index.html                # Vite HTML shell
│   ├── package.json              # Frontend dependencies and npm scripts
│   ├── tsconfig.json             # TypeScript compiler configuration
│   └── vite.config.ts            # Vite bundler configuration
│
├── backend/                      # Python / FastAPI application
│   ├── app/
│   │   ├── api/                  # API routers & endpoint controllers
│   │   │   └── routes/           # Domain routes (health, alerts, astronauts)
│   │   ├── core/                 # App configuration & security settings
│   │   ├── models/               # SQLAlchemy ORM database models
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   ├── services/             # Core business logic services
│   │   ├── database/             # Database engine & session management
│   │   ├── integrations/         # External service connectors
│   │   │   └── nasa/             # NASA OSDR & DONKI API clients
│   │   ├── ml/                   # Machine learning subsystem
│   │   │   ├── models/           # Trained models & serialization
│   │   │   ├── preprocessing/    # Feature pipelines & scalers
│   │   │   └── anomaly_detection/# Anomaly detection algorithms
│   │   ├── alerts/               # Alert generation & rule engine
│   │   └── main.py               # FastAPI application entry point
│   ├── tests/                    # Unit and integration test suite
│   └── requirements.txt          # Python dependencies
│
├── data/                         # Project data stores
│   ├── raw/
│   │   ├── nasa/                 # Real research data from NASA archives
│   │   └── simulated/            # Synthesized telemetry for testing
│   ├── processed/                # Normalized datasets ready for ML
│   ├── sample/                   # Test fixtures and mock payloads
│   └── README.md                 # Data classification & provenance guide
│
├── research/                     # Scientific background & literature
│   ├── nasa_sources.md           # Official NASA portals & API endpoints
│   ├── datasets.md               # Dataset catalog and schemas
│   ├── scientific_references.md  # Academic citations & medical standards
│   └── methodology.md            # Research methodology & validation criteria
│
├── docs/                         # Engineering documentation
│   ├── architecture.md           # System architecture & component diagram
│   ├── api_documentation.md      # REST API contracts & endpoint specifications
│   ├── setup_guide.md            # Developer onboarding & environment setup
│   └── team_contributions.md     # Team roles, responsibilities & ownership
│
├── scripts/                      # Utility scripts (telemetry generators, seeders)
├── .gitignore                    # Git exclusions
├── .env.example                  # Environment configuration template
├── README.md                     # Project overview and guide (this file)
└── LICENSE                       # MIT Open Source License
```

---

## 6. Team Responsibilities

- **Member 1 – Team Lead**: NASA research, dataset identification, scientific validation, NASA data integration, GitHub coordination, and final system integration.
- **Member 2 – Frontend Developer**: React application, dashboard UI, health monitoring interfaces, charts & visualizations, and frontend API integration.
- **Member 3 – Backend & ML Developer**: FastAPI backend, database modeling, data processing pipelines, ML anomaly detection, alert generation, and backend API development.

Detailed task assignments and workflow guidelines are documented in [docs/team_contributions.md](docs/team_contributions.md).

---

## 7. Setup Instructions

### Completed Project Scaffolding
- [x] Directory structure initialized and organized.
- [x] Configuration manifests (`package.json`, `tsconfig.json`, `requirements.txt`) configured.
- [x] Architecture and API specifications defined.
- [x] Environment variable template `.env.example` created.

### Step-by-Step Setup

1. **Clone & Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   *(Update `.env` with your NASA API key if available)*

2. **Backend Setup**:
   ```bash
   cd backend
   python -m venv venv
   # Activate: source venv/bin/activate (Linux/Mac) or .\venv\Scripts\Activate.ps1 (Windows)
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```
   *(Backend runs on `http://127.0.0.1:8000`, docs at `http://127.0.0.1:8000/docs`)*

3. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   *(Frontend runs on `http://localhost:5173`)*

### Incomplete / Upcoming Development Steps
- [ ] **Run Package Installations**: Developer environment needs `pip install` and `npm install` executed on local developer machines.
- [ ] **Database Migration Execution**: Database tables to be migrated when models are defined in `backend/app/models/`.
- [ ] **Telemetry Ingestion Engine**: Mock telemetry streaming scripts to be built in `scripts/`.
- [ ] **ML Anomaly Models**: Preprocessing and model training pipelines in `backend/app/ml/` to be implemented.
- [ ] **Interactive Frontend Views**: Vitals charts, radiation gauges, and alert banners to be populated with live state.
- [ ] **Full Application Review**: Complete architectural review by team before production deployment.
