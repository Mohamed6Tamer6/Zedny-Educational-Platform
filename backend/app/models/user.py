"""
=============================================================================
User Model Module
=============================================================================
This module defines the User database model and related enums.

Classes:
- UserRole: Enum defining user roles (STUDENT, TEACHER, SUPER_ADMIN)
- User: SQLAlchemy model representing a user in the system

User Attributes:
- id: Primary key
- email: Unique email address (used for login)
- hashed_password: Bcrypt hashed password
- full_name: User's display name
- role: User's role in the system
- is_active: Whether the account is active
- is_verified: Whether the email is verified
- created_at/updated_at: Timestamps

Author: Zedny Development Team
=============================================================================
"""

from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class UserRole(str, enum.Enum):
    """User roles in the system."""
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN" # Legacy support


class User(Base):
    """User model for authentication and profile."""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=True)
    
    # Role: student, teacher, or admin
    role = Column(SQLEnum(UserRole), default=UserRole.STUDENT, nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.email}>"
