"""
=============================================================================
AI Question Generation Endpoints Module
=============================================================================
This module provides API endpoints for generating quiz questions using AI
from various content sources (PDF documents and plain text).

Endpoints:
- POST /from-pdf: Generate questions from uploaded PDF file
- POST /from-text: Generate questions from plain text content

Features:
- Support for multiple difficulty levels (beginner, medium, advanced)
- Configurable number of questions (1-20)
- File validation and size limits (max 10MB)
- Optional custom API key support

Response Models:
- GeneratedChoice: Single answer option
- GeneratedQuestion: Question with choices
- GenerateResponse: Full response with questions and status

Author: Zedny Development Team
=============================================================================
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, status
from typing import List, Optional
from pydantic import BaseModel

from app.services.question_generator import get_question_generator
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter()


class GeneratedChoice(BaseModel):
    text: str
    is_correct: bool


class GeneratedQuestion(BaseModel):
    text: str
    choices: List[GeneratedChoice]


class GenerateResponse(BaseModel):
    success: bool
    questions: List[GeneratedQuestion]
    message: str
    extracted_text: Optional[str] = None # Return the text extracted from PDF or Source


@router.post("/from-pdf", response_model=GenerateResponse)
async def generate_questions_from_pdf(
    pdf_file: UploadFile = File(...),
    num_questions: int = Form(default=5, ge=1, le=20),
    difficulty: str = Form(default="medium"),
    api_key: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz questions from an uploaded PDF document.
    
    - **pdf_file**: PDF document to extract questions from
    - **num_questions**: Number of questions to generate (1-20, default: 5)
    - **difficulty**: Question difficulty - "beginner", "medium", or "advanced"
    - **api_key**: Optional Google Gemini API key (uses server default if not provided)
    """
    # Validate file type
    if not pdf_file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )
    
    # Validate difficulty
    valid_difficulties = ["beginner", "medium", "advanced", "intermediate"]
    if difficulty.lower() not in valid_difficulties:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Difficulty must be one of: {', '.join(valid_difficulties)}"
        )
    
    try:
        # Read PDF content
        pdf_bytes = await pdf_file.read()
        
        if len(pdf_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF file is empty"
            )
        
        if len(pdf_bytes) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF file too large. Maximum size is 10MB"
            )
        
        # Get generator
        generator = get_question_generator(api_key)
        
        # Extract text from PDF
        content = generator.extract_text_from_bytes(pdf_bytes)
        
        if len(content.strip()) < 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="PDF contains too little text content to generate questions"
            )
        
        # Generate questions
        questions = generator.generate_questions(
            content=content,
            num_questions=num_questions,
            difficulty=difficulty
        )
        
        return GenerateResponse(
            success=True,
            questions=questions,
            message=f"Successfully generated {len(questions)} questions",
            extracted_text=content
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating questions: {str(e)}"
        )


@router.post("/from-text", response_model=GenerateResponse)
async def generate_questions_from_text(
    content: str = Form(...),
    num_questions: int = Form(default=5, ge=1, le=20),
    difficulty: str = Form(default="medium"),
    api_key: Optional[str] = Form(default=None),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz questions from plain text content.
    
    - **content**: Text content to generate questions from
    - **num_questions**: Number of questions to generate (1-20, default: 5)
    - **difficulty**: Question difficulty - "beginner", "medium", or "advanced"
    - **api_key**: Optional Google Gemini API key (uses server default if not provided)
    """
    if len(content.strip()) < 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Content too short. Please provide at least 100 characters."
        )
    
    # Validate difficulty
    valid_difficulties = ["beginner", "medium", "advanced", "intermediate"]
    if difficulty.lower() not in valid_difficulties:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Difficulty must be one of: {', '.join(valid_difficulties)}"
        )
    
    try:
        generator = get_question_generator(api_key)
        
        questions = generator.generate_questions(
            content=content,
            num_questions=num_questions,
            difficulty=difficulty
        )
        
        return GenerateResponse(
            success=True,
            questions=questions,
            message=f"Successfully generated {len(questions)} questions",
            extracted_text=content
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating questions: {str(e)}"
        )
