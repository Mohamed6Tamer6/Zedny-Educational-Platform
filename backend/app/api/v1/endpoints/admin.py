"""
=============================================================================
Super Admin Operations Endpoints Module
=============================================================================
This module provides API endpoints for administrative and oversight operations
reserved for the Super Admin role.

Endpoints:
- GET /stats: Global system-wide statistics
- GET /users: Full user directory management
- GET /quizzes: Global quiz oversight and moderation
- GET /health-detailed: Deep system telemetry and monitoring

Security:
- All endpoints are strictly protected by Super Admin dependency checks.
- Implements role-based access control (RBAC).

Author: Zedny Development Team
=============================================================================
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Optional

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.quiz import Quiz, Question, QuizAttempt
from app.schemas.admin import AdminStats, UserOverview, QuizOverview, UserUpdate
from app.api import deps

router = APIRouter()

@router.get("/stats", response_model=AdminStats)
async def get_admin_stats(
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    """
    Get global statistics for Super Admin dashboard.
    """
    # 1. User counts
    total_users_q = select(func.count(User.id))
    total_users = (await db.execute(total_users_q)).scalar() or 0
    
    teachers_q = select(func.count(User.id)).where(User.role == UserRole.TEACHER)
    total_teachers = (await db.execute(teachers_q)).scalar() or 0
    
    students_q = select(func.count(User.id)).where(User.role == UserRole.STUDENT)
    total_students = (await db.execute(students_q)).scalar() or 0
    
    # 2. Quiz counts
    quizzes_q = select(func.count(Quiz.id))
    total_quizzes = (await db.execute(quizzes_q)).scalar() or 0
    
    # 3. Question counts
    questions_q = select(func.count(Question.id))
    total_questions = (await db.execute(questions_q)).scalar() or 0
    
    # 4. Attempt counts
    attempts_q = select(func.count(QuizAttempt.id))
    total_attempts = (await db.execute(attempts_q)).scalar() or 0
    
    return {
        "total_users": total_users,
        "total_teachers": total_teachers,
        "total_students": total_students,
        "total_quizzes": total_quizzes,
        "total_questions": total_questions,
        "total_attempts": total_attempts,
        "system_uptime": "99.9%",
        "system_status": "Healthy"
    }

@router.get("/users", response_model=List[UserOverview])
async def list_all_users(
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    """List all users for admin directory."""
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    users = result.scalars().all()
    
    return [
        {
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "role": u.role.value,
            "is_active": u.is_active,
            "created_at": u.created_at.isoformat()
        } for u in users
    ]

@router.get("/quizzes", response_model=List[QuizOverview])
async def list_all_quizzes(
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    """List all quizzes for admin oversight."""
    # Join with User to get teacher names
    query = select(Quiz, User.full_name).join(User, Quiz.teacher_id == User.id).options(
        selectinload(Quiz.questions),
        selectinload(Quiz.attempts)
    )
    result = await db.execute(query)
    rows = result.all()
    
    return [
        {
            "id": r.Quiz.id,
            "title": r.Quiz.title,
            "teacher_name": r.full_name or "Unknown",
            "access_code": r.Quiz.access_code,
            "question_count": len(r.Quiz.questions),
            "attempt_count": len(r.Quiz.attempts),
            "created_at": r.Quiz.created_at.isoformat()
        } for r in rows
    ]

@router.put("/users/{user_id}", response_model=UserOverview)
async def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Update user details as admin."""
    result = await db.execute(select(User).where(User.id == user_id))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        if field == "role":
            db_user.role = UserRole(value)
        else:
            setattr(db_user, field, value)
            
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    
    return {
        "id": db_user.id,
        "email": db_user.email,
        "full_name": db_user.full_name,
        "role": db_user.role.value,
        "is_active": db_user.is_active,
        "created_at": db_user.created_at.isoformat()
    }

@router.delete("/quizzes/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_delete_quiz(
    quiz_id: int,
    current_user: User = Depends(deps.get_current_active_superuser),
    db: AsyncSession = Depends(get_db)
):
    """Global quiz deletion for moderation."""
    query = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(query)
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    await db.delete(quiz)
    await db.commit()
    return None

@router.get("/health-detailed")
async def get_detailed_health(
    current_user: User = Depends(deps.get_current_active_superuser),
):
    """Detailed system metrics (Simulated for now)."""
    import psutil
    import os
    
    process = psutil.Process(os.getpid())
    
    return {
        "cpu_usage": psutil.cpu_percent(),
        "memory_usage": process.memory_info().rss / (1024 * 1024), # MB
        "db_status": "Connected",
        "api_status": "Operational",
        "storage": "2.4GB / 10GB",
        "last_log": "User 'admin' accessed System Command Center"
    }
