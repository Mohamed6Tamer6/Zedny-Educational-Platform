"""
=============================================================================
Quiz Schemas Module
=============================================================================
This module defines Pydantic schemas for quiz, question, and choice
data validation and serialization.

Schema Hierarchy:
1. Choice Schemas:
   - ChoiceBase: Base choice with text and is_correct
   - ChoiceCreate: For creating new choices
   - Choice: Full choice with ID (response)

2. Question Schemas:
   - QuestionBase: Base question with text, type, points, time_limit
   - QuestionCreate: For creating questions with choices
   - Question: Full question with ID and choices (response)

3. Quiz Schemas:
   - QuizBase: Base quiz with title, description, is_public
   - QuizCreate: For creating quizzes with questions
   - QuizUpdate: Partial update fields
   - Quiz: Full quiz with all relations (response)
   - QuizList: Summary for list views

Author: Zedny Development Team
=============================================================================
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from app.models.quiz import QuestionType

# --- Choice Schemas ---
class ChoiceBase(BaseModel):
    text: str
    is_correct: bool = False

class ChoiceCreate(ChoiceBase):
    pass

class Choice(ChoiceBase):
    id: int
    question_id: int

    class Config:
        from_attributes = True

# --- Question Schemas ---
class QuestionBase(BaseModel):
    text: str
    question_type: str = QuestionType.MULTIPLE_CHOICE.value  # Allow string, defaulted to enum value
    points: int = 1000
    time_limit: int = 30

class QuestionCreate(QuestionBase):
    choices: List[ChoiceCreate]

class Question(QuestionBase):
    id: int
    quiz_id: int
    choices: List[Choice] = []

    class Config:
        from_attributes = True

# --- Quiz Schemas ---
class QuizBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: Optional[str] = None
    is_public: bool = False

class QuizCreate(QuizBase):
    questions: List[QuestionCreate] = []

class QuizUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class Quiz(QuizBase):
    id: int
    access_code: str
    teacher_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    questions: List[Question] = []

    class Config:
        from_attributes = True

class QuizList(QuizBase):
    id: int
    access_code: str
    teacher_id: int
    created_at: datetime
    question_count: int = 0 
    
    class Config:
        from_attributes = True

# --- Quiz Attempt Schemas ---
class QuizAttemptBase(BaseModel):
    quiz_id: int
    score: int
    total_questions: int
    correct_answers: int
    rank: Optional[str] = None

class QuizAttemptCreate(QuizAttemptBase):
    pass

class QuizAttempt(QuizAttemptBase):
    id: int
    user_id: int
    completed_at: datetime
    quiz_title: Optional[str] = None

    class Config:
        from_attributes = True

# --- Statistics Schemas ---
class TeacherStats(BaseModel):
    total_quizzes: int
    total_students: int
    avg_completion_rate: float # 0.0 to 100.0
    quizzes: List[dict] = [] # Optional extra info per quiz

class StudentStats(BaseModel):
    quizzes_taken: int
    avg_score: float
    best_rank: Optional[str] = None
    performance_history: List[QuizAttempt] = []

