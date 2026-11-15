# SPACECARE – Astronaut Profiles Implementation Report

**Document Version:** 1.0.0  
**Implementation Phase:** Task 1 – Four Fictional Astronaut Profiles Addition & Baseline Preservation  
**Compliance Standard:** NASA Space Apps Challenge 2026 / NASA HRP Evidence Guidelines  

---

## 1. Executive Summary

In accordance with Task 1 requirements, four distinct fictional astronaut profiles were created, integrated into the SQLAlchemy SQLite backend database, and reconciled with the frontend state management and visualization components. The existing profile (`astro_03`: Major Marcus Chen) was strictly preserved in identity, metadata, and physiological setpoints.

All five profiles are configured with synthetic physiological baselines for system demonstration purposes, explicitly labeled as non-medically validated, and protected by idempotent seeding routines against duplication during repeated application restarts.

---

## 2. Astronaut Profiles Specification

The system manages five astronaut profiles: the preserved historical profile plus four newly created fictional mission personnel.

| Astronaut ID | Name | Role | Callsign | Age | Gender | Mission | Baseline HR | Baseline BP | Baseline SpO2 | Baseline Temp | Baseline Resp Rate | Status | Profile Classification |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `astro_morgan` | Commander Alex Morgan | Mission Commander | Vanguard-1 | 42 | Female | Artemis Gateway Expedition II | 65.0 bpm | 116/74 mmHg | 98.6% | 36.7 °C | 13.0 br/min | Nominal | Fictional / Synthetic Demo |
| `astro_reynolds` | Dr. Maya Reynolds | Flight Surgeon | Caduceus-2 | 39 | Female | Artemis Gateway Expedition II | 68.0 bpm | 114/72 mmHg | 99.0% | 36.6 °C | 14.0 br/min | Nominal | Fictional / Synthetic Demo |
| `astro_carter` | Daniel Carter | Flight Engineer | Aegis-3 | 35 | Male | Artemis Gateway Expedition II | 74.0 bpm | 122/80 mmHg | 97.8% | 36.9 °C | 16.0 br/min | Caution | Fictional / Synthetic Demo |
| `astro_bennett` | Sofia Bennett | Mission Specialist | Nova-4 | 33 | Female | Artemis Gateway Expedition II | 62.0 bpm | 112/70 mmHg | 98.9% | 36.5 °C | 12.0 br/min | Nominal | Fictional / Synthetic Demo |
| `astro_03` *(Preserved)* | Major Marcus Chen | Flight Engineer / Science Officer | Apex-3 | 36 | Male | Artemis Lunar Transit | 72.0 bpm | 120/78 mmHg | 98.2% | 36.8 °C | 15.0 br/min | Nominal | Fictional / Synthetic Demo (Primary Seed) |

---

## 3. Data Integrity & Synthetic Provenance Notice

* **Demonstration Profiles**: All profiles represent fictional astronauts created solely for algorithm simulation, dashboard evaluation, and mission control decision-support demonstration. None represent actual NASA or partner agency personnel.
* **Non-Medical Baselines**: All physiological resting baseline values (`baseline_heart_rate`, `baseline_systolic_bp`, `baseline_diastolic_bp`, `baseline_spo2`, `baseline_body_temperature`, `baseline_respiration_rate`) are algorithmically modeled from NASA Human Research Program (HRP) published ranges. They are synthetic and not medically validated.
* **Telemetry Data Source Attribution**: All streaming or persisted biometric records carry explicit `data_source: SYNTHETIC_SIMULATED` and `is_simulated: true` flags in compliance with platform research rules.

---

## 4. Files Modified and Created

### Backend
1. **`backend/app/main.py`**:
   * Restored missing module imports (`FastAPI`, `CORSMiddleware`, `settings`, `lifespan`, `init_db`, `api_router`, `radiation`) caused by an earlier git merge conflict.
   * Ensured lifecycle startup triggers `init_db()` safely.
2. **`backend/app/database/session.py`**:
   * Defined `FOUR_FICTIONAL_ASTRONAUTS` metadata dictionaries with complete synthetic baseline vitals.
   * Implemented `seed_additional_astronauts(db_session: Session) -> int` to insert the 4 profiles idempotently.
   * Implemented `seed_all_demo_astronauts(db_session: Session) -> int` to handle the full crew roster.
   * Upgraded `init_db(target_engine=None, seed_all: Optional[bool] = None)` to support isolated test engines without colliding with single-astronaut unit test expectations while seeding all five profiles in application startup.
3. **`backend/tests/test_fictional_astronauts.py`** *(New)*:
   * Unit and integration test suite covering profile persistence, `astro_03` setpoint preservation, seeding idempotency over multiple runs, and `/api/v1/astronauts` endpoint retrieval.

### Frontend
1. **`frontend/src/services/mockTelemetry.ts`**:
   * Added dynamic trend, cardiovascular, musculoskeletal, mental health, and AI anomaly models for Commander Alex Morgan, Dr. Maya Reynolds, Daniel Carter, and Sofia Bennett.
   * Replaced legacy mock roster in `MOCK_ASTRONAUTS` with the unified 5-member crew (`astro_morgan`, `astro_reynolds`, `astro_carter`, `astro_bennett`, and `astro_03`).
   * Added `LEGACY_ASTRONAUT_ID_MAP` to ensure backward compatibility with legacy IDs (`ASTRO-01` through `ASTRO-04`).
   * Updated `MOCK_RADIATION_DATA.crewDoses` and `MOCK_ALERTS` to reference the active crew members.
   * Updated `MOCK_MISSION_SUMMARY` crew counts (`totalCrewCount: 5`, `nominalCrewCount: 4`, `cautionCrewCount: 1`).
2. **`frontend/src/services/api.ts`**:
   * Updated `getAlerts()` crew aggregation array to scan all five IDs: `['astro_morgan', 'astro_reynolds', 'astro_carter', 'astro_bennett', 'astro_03']`.
3. **`frontend/src/context/TelemetryContext.tsx`**:
   * Enhanced `selectedAstronaut` fallback hierarchy to prefer active selection, then `astro_morgan`, then `astro_03`.
4. **`frontend/src/components/dashboard/CrewOverviewCards.tsx`**:
   * Updated responsive grid layout (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5`) to host five cards without crowding.
   * Added a dedicated `Demo` badge on cards for profiles where `member.is_demo` is true, providing transparent identification of simulated profiles.

---

## 5. Commands Executed & Verification Steps

### Backend Verification
```powershell
# 1. Run complete pytest regression suite
.venv-1\Scripts\pytest backend\tests

# Result: 87 passed, 1 warning (deprecation notice for starlette TestClient with httpx) in 15.13s

# 2. Verify database seeding & idempotency
$env:PYTHONPATH="backend"; .venv-1\Scripts\python -c "from app.database.session import SessionLocal, init_db; from app.models.astronaut import Astronaut; init_db(); db = SessionLocal(); print([(a.id, a.name) for a in db.query(Astronaut).all()])"

# Output:
# [('astro_03', 'Major Marcus Chen'), ('astro_morgan', 'Commander Alex Morgan'), ('astro_reynolds', 'Dr. Maya Reynolds'), ('astro_carter', 'Daniel Carter'), ('astro_bennett', 'Sofia Bennett')]

# 3. Repeated seeding verification (idempotence test)
$env:PYTHONPATH="backend"; .venv-1\Scripts\python -c "from app.database.session import SessionLocal, init_db; from app.models.astronaut import Astronaut; [init_db() for _ in range(5)]; db = SessionLocal(); assert len(db.query(Astronaut).all()) == 5; print('Idempotency verified!')"

# Output: Idempotency verified!
```

### Frontend Build Verification
```powershell
# Production build check
cd frontend; npm run build

# Result:
# ✓ 2109 modules transformed.
# dist/index.html                   0.56 kB
# dist/assets/index-DxhREe2K.css   36.63 kB
# dist/assets/index-h_kBYKaX.js   928.82 kB
# ✓ built in 18.96s (exit code 0)
```

---

## 6. Test Results Summary

1. **Backend Regression Test Suite**:
   * Total collected tests: **87**.
   * Passed: **87**.
   * Failed: **0**.
   * Errors: **0**.
2. **Database Seeding Test**:
   * Verified table initialization and multi-profile insertion.
   * Repeated `init_db()` executions resulted in zero duplicate keys or duplicate records.
3. **API Profile Retrieval**:
   * `GET /api/v1/astronauts` successfully returns all 5 astronaut profile records.
   * `GET /api/v1/astronauts/{id}` tested and validated for each individual ID.
4. **Preservation of `astro_03`**:
   * ID: `astro_03`
   * Name: `Major Marcus Chen`
   * Baseline Heart Rate: `72.0 bpm`
   * Role: `Flight Engineer`
   * Status: Identical to initial repository state.
5. **Frontend Production Build**:
   * TypeScript type checking (`tsc`) passed with 0 errors.
   * Vite bundling completed cleanly.
6. **Deduplication Check**:
   * Verified that in both `LIVE_API` and `OFFLINE_DEMO_FALLBACK` connection states, exactly 5 unique astronaut profiles are surfaced without duplicates.

---

## 7. Unresolved Issues

* **None**: All Task 1 requirements have been met, tested, and validated.
* **Next Planned Stages**: Ready to proceed with Task 2 (NASA DONKI / NOAA space-weather integration) and subsequent hazard monitoring tasks upon approval.
