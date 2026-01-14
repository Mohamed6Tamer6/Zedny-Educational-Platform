"""
=============================================================================
Authentication Endpoints Module
=============================================================================
This module provides all authentication-related API endpoints.

Endpoints:
- POST /register: Create a new user account (Student/Teacher only)
- POST /login: Authenticate and receive JWT token
- GET /me: Get current authenticated user's information

Security:
- OAuth2 password flow with Bearer tokens
- JWT tokens with configurable expiration (default: 24 hours)
- Password verification using bcrypt

Dependencies:
- get_current_user(): Injects the authenticated user into route handlers

Author: Zedny Development Team
=============================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import timedelta

from app.db.session import get_db
from app.models.user import User, UserRole as DBUserRole
from app.schemas.user import UserRegister, UserLogin, Token, UserResponse, UserRole, UserUpdate
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import get_settings
from app.api import deps

settings = get_settings()
router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    Restricted to Student and Teacher roles only.
    """
    # Block Super Admin registration
    if user_data.role == UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot register as Super Admin"
        )

    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_data.email))
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role=DBUserRole(user_data.role.value)
    )
    
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return db_user


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """Login and get JWT token."""
    # Find user by email
    result = await db.execute(select(User).where(User.email == form_data.username))
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get current authenticated user's information and update streak.
    """
    from datetime import datetime, timezone
    
    today = datetime.now(timezone.utc).date()
    streak_updated = False
    
    if not current_user.last_streak_date:
        # First streak
        current_user.streak_count = 1
        current_user.last_streak_date = datetime.now(timezone.utc)
        streak_updated = True
    else:
        last_date = current_user.last_streak_date.date()
        diff = (today - last_date).days
        
        if diff == 1:
            # Consecutive day
            current_user.streak_count += 1
            current_user.last_streak_date = datetime.now(timezone.utc)
            streak_updated = True
        elif diff > 1:
            # Streak broken
            current_user.streak_count = 1
            current_user.last_streak_date = datetime.now(timezone.utc)
            streak_updated = True
        # if diff == 0, already updated today, do nothing
    
    if streak_updated:
        db.add(current_user)
        await db.commit()
        await db.refresh(current_user)
    
    # Prepare response data explicitly to ensure runtime flags are included
    user_data = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at,
        "streak_count": current_user.streak_count,
        "avatar_url": current_user.avatar_url,
        "streak_updated": streak_updated
    }
    return user_data


@router.post("/update-profile", response_model=UserResponse)
async def update_profile(
    user_data: UserUpdate,
    current_user: User = Depends(deps.get_current_active_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update the current authenticated user's profile.
    Supports updating full name and password.
    """
    if user_data.full_name is not None:
        current_user.full_name = user_data.full_name
        
    if user_data.password is not None:
        current_user.hashed_password = get_password_hash(user_data.password)
        
    if user_data.avatar_url is not None:
        current_user.avatar_url = user_data.avatar_url
        
    db.add(current_user)
    await db.commit()
    await db.refresh(current_user)
    
    return current_user
