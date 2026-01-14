"""
=============================================================================
User Schemas Module
=============================================================================
This module defines Pydantic schemas for user-related data validation
and serialization.

Schema Categories:
1. Authentication Schemas:
   - UserRegister: New user registration data
   - UserLogin: Login credentials
   - Token: JWT token response
   - TokenData: Decoded token payload

2. Response Schemas:
   - UserBase: Common user fields
   - UserResponse: Full user data for API responses
   - UserUpdate: Partial update fields

Enums:
- UserRole: STUDENT, TEACHER, SUPER_ADMIN

Author: Zedny Development Team
=============================================================================
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from enum import Enum


class UserRole(str, Enum):
    """User roles enum for Pydantic."""
    STUDENT = "STUDENT"
    TEACHER = "TEACHER"
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN" # Legacy


# -------------------- Auth Schemas --------------------

class UserRegister(BaseModel):
    """Schema for user registration."""
    email: EmailStr
    password: str = Field(..., min_length=8, description="Password must be at least 8 characters")
    full_name: Optional[str] = Field(None, max_length=100)
    role: UserRole = UserRole.STUDENT


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """JWT Token response."""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """Data extracted from JWT token."""
    user_id: Optional[int] = None
    email: Optional[str] = None


# -------------------- User Response Schemas --------------------

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user response (public data)."""
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    streak_count: int = 0
    streak_updated: bool = False # Runtime flag
    avatar_url: Optional[str] = None

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    full_name: Optional[str] = Field(None, max_length=100)
    password: Optional[str] = Field(None, min_length=8)
    avatar_url: Optional[str] = None
