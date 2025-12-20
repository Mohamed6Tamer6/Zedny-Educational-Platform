"""
=============================================================================
Quiz Models Module
=============================================================================
This module defines the database models for quizzes, questions, and choices.

Classes:
- Quiz: Main quiz container created by teachers
- QuestionType: Enum for question types (multiple_choice, true_false, multiple_select)
- Question: Individual questions within a quiz
- Choice: Answer choices for each question

Relationships:
- Quiz has many Questions (one-to-many, cascade delete)
- Question has many Choices (one-to-many, cascade delete)
- Quiz belongs to User/Teacher (many-to-one)

Features:
- Unique access codes for joining quizzes
- Configurable points and time limits per question
- Support for multiple correct answers (multiple_select)

Author: Zedny Development Team
=============================================================================
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Enum as SQLEnum, Text, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from datetime import datetime
import enum

from app.db.session import Base

class Quiz(Base):
    """Quiz model."""
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    access_code = Column(String(10), unique=True, index=True, nullable=False)
    is_public = Column(Boolean, default=False)
    
    # Foreign Keys
    teacher_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    teacher = relationship("User", backref="quizzes")
    questions = relationship("Question", back_populates="quiz", cascade="all, delete-orphan")

class QuestionType(str, enum.Enum):
    MULTIPLE_CHOICE = "multiple_choice"
    TRUE_FALSE = "true_false"
    MULTIPLE_SELECT = "multiple_select"

class Question(Base):
    """Question model."""
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    question_type = Column(SQLEnum(QuestionType), default=QuestionType.MULTIPLE_CHOICE)
    points = Column(Integer, default=1000)
    time_limit = Column(Integer, default=30) # Seconds
    
    # Foreign Keys
    quiz_id = Column(Integer, ForeignKey("quizzes.id"), nullable=False)
    
    # Relationships
    quiz = relationship("Quiz", back_populates="questions")
    choices = relationship("Choice", back_populates="question", cascade="all, delete-orphan")

class Choice(Base):
    """Answer choice model."""
    __tablename__ = "choices"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String(255), nullable=False)
    is_correct = Column(Boolean, default=False)
    
    # Foreign Keys
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    
    # Relationships
    question = relationship("Question", back_populates="choices")
