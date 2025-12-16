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
