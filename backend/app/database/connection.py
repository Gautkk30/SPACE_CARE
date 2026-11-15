
"""Database session and connection management for SPACECARE.
SQLAlchemy 2.x implementation with SQLite support.
"""

from typing import Generator, Dict, Any

from sqlalchemy import create_engine, select, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker, Session

from app.core.config import settings


# ============================================================
# DATABASE ENGINE CONFIGURATION
# ============================================================

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={
        "check_same_thread": False,
        "timeout": 30
    },
    echo=False
)


# ============================================================
# SQLITE PRAGMA CONFIGURATION
# ============================================================

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Enable foreign keys, busy timeout, and WAL mode for SQLite."""

    cursor = dbapi_connection.cursor()

    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.execute("PRAGMA busy_timeout=30000")

    try:
        cursor.execute("PRAGMA journal_mode=WAL")
    except Exception:
        pass

    cursor.close()


# ============================================================
# SESSION CONFIGURATION
# ============================================================

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)


# ============================================================
# SQLALCHEMY BASE CLASS
# ============================================================

class Base(DeclarativeBase):
    """SQLAlchemy 2.x Base declarative class."""
    pass


# ============================================================
# FOUR DEMO ASTRONAUT CREW PROFILES
# Fictional demo data - NOT real NASA astronaut data
# ============================================================

DEMO_ASTRONAUTS: list[Dict[str, Any]] = [

    {
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
    },

    {
        "id": "astro_01",
        "name": "Dr. Elena Rodriguez",
        "role": "Mission Commander",
        "age": 39,
        "gender": "Female",
        "mission": "Artemis Lunar Transit",

        "baseline_heart_rate": 70.0,
        "baseline_systolic_bp": 118.0,
        "baseline_diastolic_bp": 76.0,
        "baseline_spo2": 98.5,
        "baseline_body_temperature": 36.7,
        "baseline_respiration_rate": 14.0,

        "is_demo": True,
    },

    {
        "id": "astro_02",
        "name": "Captain James Wilson",
        "role": "Pilot",
        "age": 34,
        "gender": "Male",
        "mission": "Artemis Lunar Transit",

        "baseline_heart_rate": 74.0,
        "baseline_systolic_bp": 122.0,
        "baseline_diastolic_bp": 80.0,
        "baseline_spo2": 98.0,
        "baseline_body_temperature": 36.9,
        "baseline_respiration_rate": 16.0,

        "is_demo": True,
    },

    {
        "id": "astro_04",
        "name": "Dr. Aisha Patel",
        "role": "Medical Officer",
        "age": 32,
        "gender": "Female",
        "mission": "Artemis Lunar Transit",

        "baseline_heart_rate": 68.0,
        "baseline_systolic_bp": 116.0,
        "baseline_diastolic_bp": 75.0,
        "baseline_spo2": 99.0,
        "baseline_body_temperature": 36.6,
        "baseline_respiration_rate": 14.0,

        "is_demo": True,
    },

]


# Backward compatibility with existing code
DEMO_ASTRONAUT = DEMO_ASTRONAUTS[0]


# ============================================================
# DATABASE DEPENDENCY
# ============================================================

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding an independent database session
    per request with guaranteed teardown.
    """

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# SEED FOUR DEMO ASTRONAUTS
# ============================================================

def seed_demo_astronaut(db_session: Session) -> bool:
    """
    Seeds all four demo astronaut profiles.

    Existing astronaut records are preserved.
    Missing demo profiles are inserted.
    """

    from app.models.astronaut import Astronaut

    added = False

    for astronaut_data in DEMO_ASTRONAUTS:

        stmt = select(Astronaut).where(
            Astronaut.id == astronaut_data["id"]
        )

        existing = db_session.execute(
            stmt
        ).scalar_one_or_none()

        if existing is None:

            demo_astronaut = Astronaut(**astronaut_data)

            db_session.add(demo_astronaut)

            added = True

    if added:
        db_session.commit()

    return added


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db(target_engine=None, seed_all: Any = None) -> None:
    """
    Initializes database tables and seeds all four demo
    astronaut profiles idempotently.
    """

    active_engine = target_engine or engine

    # Import models so Base.metadata knows about them
    from app.models.astronaut import Astronaut  # noqa: F401
    from app.models.telemetry import Telemetry  # noqa: F401
    from app.models.alert import Alert  # noqa: F401

    # Create all database tables
    Base.metadata.create_all(bind=active_engine)

    # Seed demo astronaut profiles
    with Session(active_engine) as session:

        seed_demo_astronaut(session)
