# API Documentation & Contracts

This document outlines the planned REST API endpoints for the SPACECARE FastAPI backend service.

Base URL prefix: `/api/v1`

---

## 1. System & Health

### `GET /api/v1/health`
Checks backend service availability and database connectivity.
- **Response `200 OK`**:
  ```json
  {
    "status": "healthy",
    "version": "0.1.0",
    "timestamp": "2026-11-14T10:00:00Z",
    "database": "connected"
  }
  ```

---

## 2. Astronaut Profiles & Monitoring

### `GET /api/v1/astronauts`
List all tracked crew members on the mission.

### `GET /api/v1/astronauts/{astronaut_id}`
Retrieve a specific astronaut's profile, mission assignment, and baseline physiological thresholds.

### `GET /api/v1/astronauts/{astronaut_id}/vitals`
Retrieve time-series physiological vitals for a given astronaut.
- **Query Parameters**:
  - `start_time` (ISO datetime)
  - `end_time` (ISO datetime)
  - `limit` (integer, default 100)
- **Response Item**:
  ```json
  {
    "timestamp": "2026-11-14T10:00:00Z",
    "heart_rate": 72,
    "blood_pressure_systolic": 118,
    "blood_pressure_diastolic": 76,
    "spo2": 98.5,
    "respiration_rate": 14,
    "core_temperature": 36.8
  }
  ```

---

## 3. Environmental & Radiation Monitoring

### `GET /api/v1/radiation/current`
Get current dosimeter readings and environmental radiation exposure levels.

### `GET /api/v1/radiation/space-weather`
Get current and recent space weather events synchronized from the NASA DONKI API.

---

## 4. Anomaly Detection & Early Warnings

### `POST /api/v1/anomalies/detect`
Submit a batch of telemetry data points to the ML anomaly detection pipeline.
- **Request Body**: Array of vitals data points.
- **Response**: List of detected anomalies with score and contributing features.

### `GET /api/v1/alerts/active`
Retrieve all unacknowledged active warnings and critical alerts.
- **Response Item**:
  ```json
  {
    "alert_id": "alt_001",
    "astronaut_id": "astro_01",
    "severity": "WARNING",
    "category": "CARDIOVASCULAR",
    "message": "Sudden drop in Heart Rate Variability (RMSSD < 20ms) detected.",
    "confidence_score": 0.91,
    "recommendation": "Initiate fluid hydration protocol and schedule unscheduled 30-min rest.",
    "timestamp": "2026-11-14T09:45:00Z"
  }
  ```

---

## 5. Reports & Analytics

### `GET /api/v1/reports/{astronaut_id}/summary`
Generate a structured individual astronaut health assessment report across all domains (cardiovascular, musculoskeletal, radiation, psychological).
