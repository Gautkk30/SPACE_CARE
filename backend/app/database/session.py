"""
Database session and connection management for SPACECARE.
SQLAlchemy 2.x implementation with SQLite support.
"""

from datetime import datetime, timezone
from typing import Generator
from sqlalchemy import create_engine, select, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session
from app.core.config import settings

# SQLite configuration
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False, "timeout": 30},
    echo=False
)


@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign key constraints, busy timeout, and WAL journal mode for SQLite."""
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=30000")
    try:
        cursor.execute("PRAGMA journal_mode=WAL")
    except Exception:
        pass
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy 2.x Base declarative class."""
    pass


# Demo Astronaut profile (algorithmically simulated testing profile, NOT real NASA astronaut data)
DEMO_ASTRONAUT = {
    "id": "astro_03",
    "name": "Major Marcus Chen",
    "role": "Flight Engineer",
    "age": 36,
    "gender": "Male",
    "mission": "Artemis Lunar Transit",
    "baseline_heart_rate": 72.0,
    "baseline_systolic_bp": 120.0,
    "baseline_diastolic_bp": 78.0,
    "baseline_spo2": 98.2,
    "baseline_body_temperature": 36.8,
    "baseline_respiration_rate": 15.0,
    "is_demo": True,
}


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an independent database session per request
    with guaranteed teardown.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def seed_demo_astronaut(db_session: Session) -> bool:
    """
    Idempotently seeds the demo astronaut profile.
    Avoids duplicate records if the astronaut is already present.
    Returns True if newly seeded, False if already present.
    """
    from app.models.astronaut import Astronaut

    stmt = select(Astronaut).where(Astronaut.id == DEMO_ASTRONAUT["id"])
    existing = db_session.execute(stmt).scalar_one_or_none()

    if existing is None:
        demo_astronaut = Astronaut(**DEMO_ASTRONAUT)
        db_session.add(demo_astronaut)
        db_session.commit()
        return True
    return False


def init_db(target_engine=None) -> None:
    """
    Initializes database tables and seeds demo astronaut idempotently.
    Accepts an optional target_engine (useful for isolated unit tests).
    """
    active_engine = target_engine or engine

    # Ensure all models are registered with Base.metadata
    from app.models.astronaut import Astronaut  # noqa: F401
    from app.models.telemetry import Telemetry  # noqa: F401
    from app.models.alert import Alert  # noqa: F401

    Base.metadata.create_all(bind=active_engine)

    with Session(active_engine) as session:
        seed_demo_astronaut(session)
