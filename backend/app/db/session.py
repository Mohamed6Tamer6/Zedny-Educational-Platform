"""
=============================================================================
Database Session Management Module
=============================================================================
This module handles the database connection and session management using
SQLAlchemy's async capabilities.

Components:
- engine: Async database engine connected to PostgreSQL
- AsyncSessionLocal: Session factory for creating database sessions
- Base: Declarative base class for all ORM models
- get_db(): Dependency for injecting database sessions into route handlers

Features:
- Fully async operations using asyncpg driver
- Automatic session cleanup on request completion
- SQL query logging in debug mode

Author: Zedny Development Team
=============================================================================
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# Create async engine
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    future=True
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


class Base(DeclarativeBase):
    """Base class for all database models."""
    pass


async def get_db() -> AsyncSession:
    """Dependency to get database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
