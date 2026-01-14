"""
=============================================================================
LMS Course Models Module
=============================================================================
This module defines the database models for the Learning Management System.

Classes:
- Course: Main course container created by teachers
- ContentType: Enum for lesson content types (VIDEO, TEXT, PDF, QUIZ_LINK)
- Lesson: Individual lessons within a course
- EnrollmentStatus: Enum for enrollment status (ACTIVE, COMPLETED, DROPPED)
- Enrollment: Student subscriptions to courses
- LessonProgress: Track lesson completion for each student

Relationships:
- Course has many Lessons (one-to-many, cascade delete)
- Course has many Enrollments (one-to-many)
- Enrollment has many LessonProgress (one-to-many)
- Course belongs to User/Teacher (many-to-one)

Author: Zedny Development Team
=============================================================================
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum, Text, DateTime, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base


class ContentType(str, enum.Enum):
    """Types of lesson content."""
    VIDEO = "video"
    TEXT = "text"
    PDF = "pdf"
    QUIZ_LINK = "quiz_link"


class EnrollmentStatus(str, enum.Enum):
    """Status of student enrollment."""
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"


class LessonStatus(str, enum.Enum):
    """Status of lesson progress."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class CourseStatus(str, enum.Enum):
    """Status of course visibility/accessibility."""
    PUBLISHED = "published"
    DRAFT = "draft"
    PRIVATE = "private"


class Course(Base):
    """Course model - main container for lessons."""
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    status = Column(SQLEnum(CourseStatus), default=CourseStatus.DRAFT)
    access_code = Column(String(10), unique=True, index=True, nullable=True)
    target_skills = Column(Text, nullable=True) # JSON string of skills and their weights
    
    # Foreign Keys
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    teacher = relationship("User", backref="courses")
    lessons = relationship("Lesson", back_populates="course", cascade="all, delete-orphan", order_by="Lesson.order_index")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    community_messages = relationship("CommunityMessage", back_populates="course", cascade="all, delete-orphan")
    feedback = relationship("CourseFeedback", back_populates="course", cascade="all, delete-orphan")


class CommunityMessage(Base):
    """CommunityMessage model - messages in course community hub."""
    __tablename__ = "community_messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", backref="community_messages")
    course = relationship("Course", back_populates="community_messages")


class Lesson(Base):
    """Lesson model - individual learning units."""
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    content_type = Column(SQLEnum(ContentType), default=ContentType.TEXT)
    content_url = Column(String(500), nullable=True)  # For video/PDF links
    content_text = Column(Text, nullable=True)  # For text content
    order_index = Column(Integer, default=0)
    duration_minutes = Column(Integer, default=0)
    
    # Foreign Keys
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    linked_quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=True)  # Optional quiz link
    quiz_code = Column(String(10), nullable=True) # Link quiz by access code
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="lessons")
    linked_quiz = relationship("Quiz", backref="linked_lessons")
    progress_records = relationship("LessonProgress", back_populates="lesson", cascade="all, delete-orphan")


class Enrollment(Base):
    """Enrollment model - student course subscriptions."""
    __tablename__ = "enrollments"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(SQLEnum(EnrollmentStatus), default=EnrollmentStatus.ACTIVE)
    progress_percent = Column(Float, default=0.0)
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Timestamps
    enrolled_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("User", backref="enrollments")
    course = relationship("Course", back_populates="enrollments")
    lesson_progress = relationship("LessonProgress", back_populates="enrollment", cascade="all, delete-orphan")


class LessonProgress(Base):
    """LessonProgress model - track lesson completion."""
    __tablename__ = "lesson_progress"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(SQLEnum(LessonStatus), default=LessonStatus.NOT_STARTED)
    time_spent_seconds = Column(Integer, default=0)
    
    # Foreign Keys
    enrollment_id = Column(Integer, ForeignKey("enrollments.id"), nullable=False)
    lesson_id = Column(Integer, ForeignKey("lessons.id"), nullable=False)
    
    # Timestamps
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    enrollment = relationship("Enrollment", back_populates="lesson_progress")
    lesson = relationship("Lesson", back_populates="progress_records")


class CourseFeedback(Base):
    """CourseFeedback model - anonymous student feedback/reviews for courses."""
    __tablename__ = "course_feedback"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text, nullable=False)
    rating = Column(Integer, default=5) # Optional: 1-5 scale
    
    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="feedback")
    user = relationship("User", backref="course_feedback")
