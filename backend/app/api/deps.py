"""
=============================================================================
Authentication Dependencies Module
=============================================================================
This module provides dependency injection helpers for authentication and permissions.

Dependencies:
- get_current_user: Validates JWT and returns current User
- get_current_active_user: Validates user is active
- get_current_teacher: Validates user is a Teacher
- get_current_student: Validates user is a Student
- get_current_active_superuser: Validates user is a Super Admin

Author: Zedny Development Team
=============================================================================
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional

from app.core.config import get_settings
from app.db.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import TokenData
from app.core.super_admin import is_super_admin

settings = get_settings()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_PREFIX}/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token.
    Validates token signature and expiration.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=int(user_id))
    except (JWTError, ValueError):
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == token_data.user_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Dependency to check if user is active."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


async def get_current_teacher(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to check if user is a Teacher."""
    if current_user.role != UserRole.TEACHER and not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges (Teacher required)"
        )
    return current_user


async def get_current_student(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to check if user is a Student."""
    # Note: Super Admin can access student pages? Usually yes.
    # But usually 'Student' specific flow might be weird for admin. 
    # For now, allow admin check.
    if current_user.role != UserRole.STUDENT and not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges (Student required)"
        )
    return current_user


async def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Dependency to check if user is a Super Admin."""
    if not is_super_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user doesn't have enough privileges"
        )
    return current_user
