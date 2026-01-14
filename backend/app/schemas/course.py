"""
=============================================================================
LMS Course Schemas Module
=============================================================================
Pydantic schemas for LMS course, lesson, enrollment, and progress validation.

Author: Zedny Development Team
=============================================================================
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.course import ContentType, EnrollmentStatus, LessonStatus, CourseStatus


# --- Lesson Schemas ---
class LessonBase(BaseModel):
    title: str = Field(..., max_length=200)
    content_type: ContentType = ContentType.TEXT
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    order_index: int = 0
    duration_minutes: int = 0
    linked_quiz_id: Optional[int] = None
    quiz_code: Optional[str] = None


class LessonCreate(LessonBase):
    pass


class LessonUpdate(BaseModel):
    title: Optional[str] = None
    content_type: Optional[ContentType] = None
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    order_index: Optional[int] = None
    duration_minutes: Optional[int] = None
    linked_quiz_id: Optional[int] = None
    quiz_code: Optional[str] = None


class Lesson(LessonBase):
    id: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class LessonWithProgress(Lesson):
    progress_status: Optional[LessonStatus] = LessonStatus.NOT_STARTED
    time_spent_seconds: int = 0


# --- Course Schemas ---
class CourseBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: CourseStatus = CourseStatus.DRAFT
    access_code: Optional[str] = None
    target_skills: Optional[str] = None # JSON string or comma-separated list


class CourseCreate(CourseBase):
    lessons: List[LessonCreate] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    thumbnail_url: Optional[str] = None
    status: Optional[CourseStatus] = None
    target_skills: Optional[str] = None
    access_code: Optional[str] = None
    lessons: Optional[List[LessonCreate]] = None


class Course(CourseBase):
    id: int
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    lessons: List[Lesson] = []

    class Config:
        from_attributes = True


class CourseList(CourseBase):
    id: int
    teacher_id: int
    teacher_name: Optional[str] = None
    created_at: datetime
    lesson_count: int = 0
    enrollment_count: int = 0

    class Config:
        from_attributes = True


class CourseDetail(Course):
    teacher_name: Optional[str] = None
    enrollment_count: int = 0
    is_enrolled: bool = False


# --- Enrollment Schemas ---
class EnrollmentCreate(BaseModel):
    course_id: int


class Enrollment(BaseModel):
    id: int
    user_id: int
    course_id: int
    status: EnrollmentStatus
    progress_percent: float
    enrolled_at: datetime
    completed_at: Optional[datetime] = None
    lesson_progress: List["LessonProgressResponse"] = []

    class Config:
        from_attributes = True


class EnrollmentWithCourse(Enrollment):
    course_title: str
    total_lessons: int = 0
    completed_lessons: int = 0
    student_name: Optional[str] = None
    student_email: Optional[str] = None
    enrollment_count: int = 1


# --- Community Schemas ---
class MessageCreate(BaseModel):
    content: str

class Message(BaseModel):
    id: int
    content: str
    user_id: int
    course_id: int
    created_at: datetime
    user_name: Optional[str] = None
    user_role: Optional[str] = None

    class Config:
        from_attributes = True


# --- Progress Schemas ---
class LessonProgressUpdate(BaseModel):
    status: LessonStatus
    time_spent_seconds: Optional[int] = None


class LessonProgressResponse(BaseModel):
    id: int
    lesson_id: int
    status: LessonStatus
    time_spent_seconds: int
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Stats Schemas ---
class CourseStats(BaseModel):
    total_enrollments: int
    active_students: int
    completed_students: int
    average_progress: float
    total_lessons: int

# --- Feedback Schemas ---
class FeedbackCreate(BaseModel):
    content: str
    rating: int = Field(5, ge=1, le=5)

class FeedbackResponse(BaseModel):
    id: int
    content: str
    rating: int
    course_id: int
    created_at: datetime

    class Config:
        from_attributes = True
