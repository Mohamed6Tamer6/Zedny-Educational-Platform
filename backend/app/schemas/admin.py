"""
=============================================================================
Super Admin Dashboard Schemas Module
=============================================================================
This module defines Pydantic schemas for administrative data structures
used in the Super Admin Command Center.

Schemas:
- AdminStats: Comprehensive system metrics
- UserOverview: Summary data for user directory
- QuizOverview: Summary data for quiz oversight

Author: Zedny Development Team
=============================================================================
"""
from pydantic import BaseModel
from typing import List, Optional

class AdminStats(BaseModel):
    total_users: int
    total_teachers: int
    total_students: int
    total_quizzes: int
    total_questions: int
    total_attempts: int
    system_uptime: str = "99.9%"
    system_status: str = "Healthy"
    latest_activity: Optional[str] = "System monitoring active"

class UserOverview(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    created_at: str

class QuizOverview(BaseModel):
    id: int
    title: str
    teacher_name: str
    access_code: str
    question_count: int
    attempt_count: int
    created_at: str

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    email: Optional[str] = None
