"""
SPACECARE Backend Application Entry Point
NASA Space Apps Challenge 2026

This module initializes the FastAPI application, registers middleware,
and provides baseline health check and metadata endpoints.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import init_db
from app.api.api import api_router
from app.api.routes import research, health, radiation


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed demo astronaut
    init_db()
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Astronaut Health Monitoring & Early Warning System",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS.
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:5174,http://127.0.0.1:5174"
)

origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

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
        "version": settings.VERSION,
        "status": "initialized",
        "documentation": "/docs"
    }


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "initialized",
        "version": settings.VERSION
    }


# ==============================================================================
# Route registrations:
# ==============================================================================
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(research.router, prefix=f"{settings.API_V1_STR}/research", tags=["Research"])
app.include_router(health.router, prefix=f"{settings.API_V1_STR}/vitals", tags=["Vitals"])
app.include_router(radiation.router, prefix=f"{settings.API_V1_STR}/radiation", tags=["Radiation"])


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
