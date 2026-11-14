
"""
SPACECARE Backend Application Entry Point
NASA Space Apps Challenge 2026
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import research, health,radiation

from app.database.connection import Base, engine

# Import models so SQLAlchemy registers their tables.
from app.models.health import HealthReading


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables at application startup.
    Base.metadata.create_all(bind=engine)
    print("SPACECARE database initialized successfully.")

    yield

    print("SPACECARE backend shutting down.")


app = FastAPI(
    title="SPACECARE API",
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


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": "initialized",
        "version": "0.1.0"
    }


# Register API routes.
app.include_router(
    research.router,
    prefix="/api/v1/research",
    tags=["Research"]
)

app.include_router(
    health.router,
    prefix="/api/v1/vitals",
    tags=["Vitals"]
)
app.include_router(
    radiation.router,
    prefix="/api/v1/radiation",
    tags=["Radiation"]
)

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
