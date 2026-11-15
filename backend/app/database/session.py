"""
Database session and connection management for SPACECARE.
SQLAlchemy 2.x implementation with SQLite support.
"""

from datetime import datetime, timezone
from typing import Generator, List, Dict, Any, Optional
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


# Primary Demo Astronaut profile (preserved from initial release, NOT real NASA astronaut data)
DEMO_ASTRONAUT: Dict[str, Any] = {
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

# Four distinct fictional astronaut profiles (strictly demonstration profiles; synthetic non-validated baselines)
FOUR_FICTIONAL_ASTRONAUTS: List[Dict[str, Any]] = [
    {
        "id": "astro_morgan",
        "name": "Commander Alex Morgan",
        "role": "Mission Commander",
        "age": 42,
        "gender": "Female",
        "mission": "Artemis Gateway Expedition II",
        "baseline_heart_rate": 65.0,
        "baseline_systolic_bp": 116.0,
        "baseline_diastolic_bp": 74.0,
        "baseline_spo2": 98.6,
        "baseline_body_temperature": 36.7,
        "baseline_respiration_rate": 13.0,
        "is_demo": True,
    },
    {
        "id": "astro_reynolds",
        "name": "Dr. Maya Reynolds",
        "role": "Flight Surgeon",
        "age": 39,
        "gender": "Female",
        "mission": "Artemis Gateway Expedition II",
        "baseline_heart_rate": 68.0,
        "baseline_systolic_bp": 114.0,
        "baseline_diastolic_bp": 72.0,
        "baseline_spo2": 99.0,
        "baseline_body_temperature": 36.6,
        "baseline_respiration_rate": 14.0,
        "is_demo": True,
    },
    {
        "id": "astro_carter",
        "name": "Daniel Carter",
        "role": "Flight Engineer",
        "age": 35,
        "gender": "Male",
        "mission": "Artemis Gateway Expedition II",
        "baseline_heart_rate": 74.0,
        "baseline_systolic_bp": 122.0,
        "baseline_diastolic_bp": 80.0,
        "baseline_spo2": 97.8,
        "baseline_body_temperature": 36.9,
        "baseline_respiration_rate": 16.0,
        "is_demo": True,
    },
    {
        "id": "astro_bennett",
        "name": "Sofia Bennett",
        "role": "Mission Specialist",
        "age": 33,
        "gender": "Female",
        "mission": "Artemis Gateway Expedition II",
        "baseline_heart_rate": 62.0,
        "baseline_systolic_bp": 112.0,
        "baseline_diastolic_bp": 70.0,
        "baseline_spo2": 98.9,
        "baseline_body_temperature": 36.5,
        "baseline_respiration_rate": 12.0,
        "is_demo": True,
    },
]

ALL_DEMO_ASTRONAUTS: List[Dict[str, Any]] = [DEMO_ASTRONAUT] + FOUR_FICTIONAL_ASTRONAUTS


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
    Idempotently seeds the primary demo astronaut profile (astro_03: Major Marcus Chen).
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


def seed_additional_astronauts(db_session: Session) -> int:
    """
    Idempotently seeds the four fictional demonstration astronaut profiles:
    - Commander Alex Morgan (astro_morgan)
    - Dr. Maya Reynolds (astro_reynolds)
    - Daniel Carter (astro_carter)
    - Sofia Bennett (astro_bennett)

    Returns the count of newly seeded profiles.
    """
    from app.models.astronaut import Astronaut

    newly_seeded = 0
    for astro_data in FOUR_FICTIONAL_ASTRONAUTS:
        stmt = select(Astronaut).where(Astronaut.id == astro_data["id"])
        existing = db_session.execute(stmt).scalar_one_or_none()
        if existing is None:
            astro_obj = Astronaut(**astro_data)
            db_session.add(astro_obj)
            newly_seeded += 1
    if newly_seeded > 0:
        db_session.commit()
    return newly_seeded


def seed_all_demo_astronauts(db_session: Session) -> int:
    """
    Idempotently seeds all five demonstration astronaut profiles (astro_03 + 4 new profiles).
    Returns total count of newly seeded profiles.
    """
    seeded_count = 1 if seed_demo_astronaut(db_session) else 0
    seeded_count += seed_additional_astronauts(db_session)
    return seeded_count


def init_db(target_engine=None, seed_all: Optional[bool] = None) -> None:
    """
    Initializes database tables and seeds demo astronauts idempotently.
    Accepts an optional target_engine (useful for isolated unit tests).

    When seed_all is None:
      - If target_engine is provided (e.g. test isolation), seeds only DEMO_ASTRONAUT (preserving regression tests).
      - If target_engine is None (e.g. app startup), seeds all 5 astronaut profiles.
    """
    active_engine = target_engine or engine

    # Ensure all models are registered with Base.metadata
    from app.models.astronaut import Astronaut  # noqa: F401
    from app.models.telemetry import Telemetry  # noqa: F401
    from app.models.alert import Alert  # noqa: F401

    Base.metadata.create_all(bind=active_engine)

    should_seed_all = (target_engine is None) if seed_all is None else seed_all

    with Session(active_engine) as session:
        if should_seed_all:
            seed_all_demo_astronauts(session)
        else:
            seed_demo_astronaut(session)
