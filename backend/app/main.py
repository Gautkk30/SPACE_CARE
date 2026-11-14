"""
SPACECARE Backend Application Entry Point
NASA Space Apps Challenge 2026

This module initializes the FastAPI application, registers middleware,
includes API routers, and provides baseline health check and metadata endpoints.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.database.session import init_db
from app.api.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    Initializes database tables and ensures demo astronaut is seeded.
    """
    init_db()
    yield


from app.api.routes import health, research

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Intelligent Astronaut Health Monitoring & Early Warning System",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure Cross-Origin Resource Sharing (CORS) for development
allowed_origins_raw = os.getenv(
    "ALLOWED_ORIGINS", 
    "http://localhost:5173,http://127.0.0.1:5173"
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
    """Service information and readiness status."""
    return {
        "project": "SPACECARE",
        "description": "Intelligent Astronaut Health Monitoring & Early Warning System",
        "version": "0.1.0",
        "status": "initialized",
        "documentation": "/docs"
    }


@app.get(f"{settings.API_V1_STR}/health", tags=["Health"])
async def health_check():
    """Health check endpoint for service monitoring."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "connected",
        "version": "0.1.0"
    }

# ============================================================================== 
# Route registrations:
# ============================================================================== 
app.include_router(research.router, prefix="/api/v1/research", tags=["Research"])
app.include_router(health.router, prefix="/api/v1/vitals", tags=["Vitals"])

# Include aggregated API v1 routes
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", 8000))
    uvicorn.run("app.main:app", host=host, port=port, reload=True)
