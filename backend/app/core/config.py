"""
Configuration settings for SPACECARE backend.
Uses pydantic-settings to manage environment variables with sensible defaults.
"""

from pathlib import Path
from typing import List, Union
from pydantic_settings import BaseSettings
from pydantic import field_validator

# Base directory of the backend repository
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BACKEND_DIR.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "SPACECARE"
    API_V1_STR: str = "/api/v1"
    VERSION: str = "0.1.0"
    
    # Server host and port
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    
    # CORS Configuration
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            return [i.strip() for i in v.split(",") if i.strip()]
        return v

    # SQLite Database Configuration
    DATABASE_PATH: Path = BACKEND_DIR / "spacecare.db"
    
    @property
    def DATABASE_URL(self) -> str:
        # Normalized SQLite URL with absolute path
        return f"sqlite:///{self.DATABASE_PATH.as_posix()}"
        
    # Machine Learning Artifacts
    ML_MODEL_DIR: Path = BACKEND_DIR / "app" / "ml" / "models"
    ML_MODEL_PATH: Path = ML_MODEL_DIR / "isolation_forest.joblib"
    ML_SCALER_PATH: Path = ML_MODEL_DIR / "scaler.joblib"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"


settings = Settings()
