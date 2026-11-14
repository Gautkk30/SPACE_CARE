
"""
SPACECARE Backend Application Entry Point
NASA Space Apps Challenge 2026

This module initializes the FastAPI application, registers middleware,
and provides baseline health check and metadata endpoints.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import os

from app.api.routes import research,health

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Astronaut Health Monitoring & Early Warning System",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS.
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174"
)

origins = [origin.strip() for origin in allowed_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
async def root():
    return {
        "project": "SPACECARE",
        "description": "Intelligent Astronaut Health Monitoring & Early Warning System",
        "version": "0.1.0",
        "status": "initialized",
        "documentation": "/docs"
    }


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "uninitialized (ready for migration)",
        "version": "0.1.0"
    }

# ==============================================================================
# Route registrations:
# ==============================================================================
app.include_router(research.router, prefix="/api/v1/research", tags=["Research"])
app.include_router(health.router, prefix="/api/v1/vitals", tags=["Vitals"])

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", 8000))

    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )
