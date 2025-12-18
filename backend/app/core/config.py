from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database (set via .env file)
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/zedny_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # App Settings
    DEBUG: bool = True
    PROJECT_NAME: str = "Zedny Educational Platform"
    API_V1_PREFIX: str = "/api/v1"
    
    # AI Services
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache
def get_settings() -> Settings:
    """Returns cached settings instance."""
    return Settings()
