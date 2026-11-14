"""
SQLAlchemy models initialization.
Exports all database entities for clean imports across the application.
"""

from app.database.session import Base
from app.models.astronaut import Astronaut
from app.models.telemetry import HealthTelemetry
from app.models.alert import Alert

__all__ = ["Base", "Astronaut", "HealthTelemetry", "Alert"]
