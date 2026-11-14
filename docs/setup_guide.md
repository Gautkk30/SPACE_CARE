# SPACECARE Developer Setup Guide

This guide describes how to configure and run the SPACECARE development environment.

---

## Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: Version 18.x or 20.x LTS ([nodejs.org](https://nodejs.org/))
- **Python**: Version 3.10, 3.11, or 3.12 ([python.org](https://python.org/))
- **Git**: Latest version

---

## 1. Repository Setup

1. Open your terminal in the project root:
   ```bash
   cd SPACECARE
   ```

2. Create your local environment configuration file:
   ```bash
   cp .env.example .env
   ```
   *(On Windows PowerShell: `Copy-Item .env.example .env`)*

3. Edit `.env` to supply your NASA API key (or retain `DEMO_KEY` for basic rate-limited testing).

---

## 2. Backend Setup (FastAPI & Python)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   - **Linux / macOS**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
   ```

5. Verify backend:
   Open your browser and navigate to:
   - API Status: [http://127.0.0.1:8000/api/v1/health](http://127.0.0.1:8000/api/v1/health)
   - Interactive Swagger Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

---

## 3. Frontend Setup (React & Vite)

1. In a separate terminal, navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

4. Verify frontend:
   Open your browser and navigate to [http://localhost:5173/](http://localhost:5173/).

---

## 4. Current Setup Status Checklist

| Step | Component | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Directory Scaffolding** | Full Project | **COMPLETE** | Modular directory structure initialized |
| **Package Manifests** | Frontend & Backend | **COMPLETE** | `package.json` & `requirements.txt` defined |
| **Starter Entrypoints** | Frontend & Backend | **COMPLETE** | `App.tsx` and `app/main.py` created |
| **Local Dependencies** | Developer Environment | **PENDING** | Run `npm install` and `pip install -r requirements.txt` |
| **Database Migrations** | SQLite / SQLAlchemy | **PENDING** | Model schemas to be finalized by Member 3 |
| **NASA API Adapters** | Integrations | **PENDING** | To be implemented by Member 1 |
| **ML Model Training** | Anomaly Detection | **PENDING** | Preprocessing & models to be trained by Member 3 |
| **UI Components** | React Dashboard | **PENDING** | Vitals and alerts pages to be built by Member 2 |
