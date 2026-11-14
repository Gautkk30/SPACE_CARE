"""
CRUD operations for Astronaut records.
SPACECARE - NASA Space Apps Challenge 2026
"""

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.astronaut import Astronaut


def get_astronaut(db: Session, astronaut_id: str) -> Optional[Astronaut]:
    """Retrieves an astronaut profile by unique identifier."""
    return db.get(Astronaut, astronaut_id)


def get_astronauts(db: Session, skip: int = 0, limit: int = 100) -> List[Astronaut]:
    """Retrieves list of astronaut profiles ordered by ID."""
    stmt = select(Astronaut).offset(skip).limit(limit)
    return list(db.scalars(stmt).all())
