"""
=============================================================================
Quiz Endpoints Module
=============================================================================
This module provides all quiz-related API endpoints for CRUD operations
and AI-powered question generation.

Endpoints:
- POST /: Create a new quiz with questions and choices
- GET /: List all quizzes for the authenticated user
- GET /{quiz_id}: Get a specific quiz with all questions
- DELETE /{quiz_id}: Delete a quiz (owner or admin only)
- POST /generate-from-pdf: Generate questions from uploaded PDF using AI

Features:
- Automatic unique access code generation for each quiz
- Comprehensive input validation with detailed error messages
- Cascade delete for questions and choices
- AI integration for automatic question generation

Author: Zedny Development Team
=============================================================================
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, update, func, and_, case
from sqlalchemy.orm import selectinload, joinedload
from typing import List, Any
import random
import string

from app.db.session import get_db
from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.quiz import Quiz, Question, Choice, QuestionType, QuizAttempt
from app.schemas import quiz as schemas
from app.services.pdf_service import extract_text_from_pdf
from app.services.ai_service import generate_quiz_questions
from fastapi import UploadFile, File, Form, Request

router = APIRouter()

def generate_access_code(length=6):
    """Generate a random alphanumeric access code."""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

@router.post("/", response_model=schemas.Quiz, status_code=status.HTTP_201_CREATED)
async def create_quiz(
    request: Request,
    quiz_in: schemas.QuizCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new quiz (Authorized users)."""
    # Log the raw request body for debugging
    try:
        body_bytes = await request.body()
        print(f"DEBUG: Raw Request Body: {body_bytes.decode('utf-8')}")
    except Exception as e:
        print(f"DEBUG: Failed to read raw request body: {str(e)}")
    
    # Log the parsed quiz data
    try:
        print("DEBUG: Parsed Quiz Data:")
        print(f"Title: {quiz_in.title}")
        print(f"Description: {quiz_in.description}")
        print(f"Questions count: {len(quiz_in.questions)}")
        
        for i, q in enumerate(quiz_in.questions, 1):
            print(f"\nQuestion {i}:")
            print(f"  Text: {q.text}")
            print(f"  Type: {q.question_type}")
            print(f"  Points: {q.points}")
            print(f"  Time Limit: {q.time_limit}")
            print(f"  Choices: {len(q.choices)}")
            for j, c in enumerate(q.choices, 1):
                print(f"    {j}. {c.text} (Correct: {c.is_correct})")
    except Exception as e:
        print(f"DEBUG: Error logging quiz data: {str(e)}")
    
    # Validate the quiz data
    try:
        # Check for empty questions
        if not quiz_in.questions:
            error_msg = "Quiz must have at least one question."
            print(f"DEBUG: Validation Error: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg
            )

        # Validate each question
        for i, question in enumerate(quiz_in.questions, 1):
            print(f"DEBUG: Validating Question {i}: {question.text[:50]}...")
            
            # Check for empty question text
            if not question.text or not question.text.strip():
                error_msg = f"Question {i}: Text cannot be empty"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check for valid question type
            valid_types = [t.value for t in QuestionType]
            if question.question_type not in valid_types:
                error_msg = f"Question {i}: Invalid question type '{question.question_type}'. Must be one of: {valid_types}"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check time_limit is a positive number
            try:
                time_limit = int(question.time_limit)
                if time_limit <= 0:
                    raise ValueError("Time limit must be positive")
            except (ValueError, TypeError):
                error_msg = f"Question {i}: Time limit must be a positive number"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check points is a non-negative number
            try:
                points = int(question.points)
                if points < 0:
                    raise ValueError("Points cannot be negative")
            except (ValueError, TypeError):
                error_msg = f"Question {i}: Points must be a non-negative number"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check choices
            if not question.choices:
                error_msg = f"Question {i}: At least one choice is required"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check for at least one correct answer
            if not any(choice.is_correct for choice in question.choices):
                error_msg = f"Question {i}: At least one correct answer is required"
                print(f"DEBUG: Validation Error: {error_msg}")
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=error_msg
                )
            
            # Check for empty choices
            for j, choice in enumerate(question.choices, 1):
                if not choice.text or not choice.text.strip():
                    error_msg = f"Question {i}, Choice {j}: Text cannot be empty"
                    print(f"DEBUG: Validation Error: {error_msg}")
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail=error_msg
                    )
        
        print("DEBUG: Quiz data validation passed. Creating quiz...")
        
        # Generate unique access code
        access_code = generate_access_code()
        max_attempts = 10
        attempts = 0
        
        while attempts < max_attempts:
            existing = await db.execute(select(Quiz).where(Quiz.access_code == access_code))
            if not existing.scalar_one_or_none():
                break
            access_code = generate_access_code()
            attempts += 1
        
        if attempts >= max_attempts:
            error_msg = "Failed to generate a unique access code"
            print(f"DEBUG: Error: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=error_msg
            )
        
        # Create Quiz
        db_quiz = Quiz(
            title=quiz_in.title,
            description=quiz_in.description or "",
            is_public=quiz_in.is_public,
            access_code=access_code,
            teacher_id=current_user.id
        )
        db.add(db_quiz)
        await db.flush()  # Get the quiz ID
        
        # Add Questions and Choices
        for q_in in quiz_in.questions:
            db_question = Question(
                quiz_id=db_quiz.id,
                text=q_in.text,
                question_type=q_in.question_type,
                points=int(q_in.points),
                time_limit=int(q_in.time_limit)
            )
            db.add(db_question)
            await db.flush()  # Get the question ID
            
            for c_in in q_in.choices:
                db_choice = Choice(
                    question_id=db_question.id,
                    text=c_in.text,
                    is_correct=c_in.is_correct
                )
                db.add(db_choice)
        
        await db.commit()
        
        # Refresh with relations
        query = select(Quiz).where(Quiz.id == db_quiz.id).options(
            selectinload(Quiz.questions).selectinload(Question.choices)
        )
        result = await db.execute(query)
        quiz = result.scalar_one()
        
        print(f"DEBUG: Successfully created quiz {quiz.id} with {len(quiz.questions)} questions")
        return quiz
        
    except HTTPException:
        # Re-raise HTTP exceptions
        await db.rollback()
        raise
        
    except Exception as e:
        # Log the full error
        print(f"ERROR: Unexpected error in create_quiz: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.get("/my-performance", response_model=List[schemas.QuizAttempt])
async def get_my_performance(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Detailed performance history for student."""
    query = select(QuizAttempt).where(
        QuizAttempt.user_id == current_user.id
    ).options(joinedload(QuizAttempt.quiz)).order_by(QuizAttempt.completed_at.desc())
    
    results = (await db.execute(query)).scalars().all()
    history = []
    for h in results:
        history.append({
            "id": h.id,
            "user_id": h.user_id,
            "quiz_id": h.quiz_id,
            "quiz_title": h.quiz.title if h.quiz else "Deleted Quiz",
            "score": h.score,
            "total_questions": h.total_questions,
            "correct_answers": h.correct_answers,
            "rank": h.rank,
            "completed_at": h.completed_at
        })
    return history

@router.get("/stats/student", response_model=schemas.StudentStats)
async def get_student_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for student dashboard."""
    # 1. Quizzes Taken
    count_query = select(func.count(QuizAttempt.id)).where(QuizAttempt.user_id == current_user.id)
    quizzes_taken = (await db.execute(count_query)).scalar() or 0
    print(f"DEBUG: Student {current_user.id} stats - Quizzes Taken: {quizzes_taken}")
    
    # 2. Average Score (Safe division)
    score_query = select(func.avg(
        case(
            (QuizAttempt.total_questions > 0, QuizAttempt.correct_answers * 100.0 / QuizAttempt.total_questions),
            else_=0
        )
    )).where(QuizAttempt.user_id == current_user.id)
    avg_score = (await db.execute(score_query)).scalar() or 0.0
    
    # 3. Best Rank
    rank_query = select(QuizAttempt.rank).where(QuizAttempt.user_id == current_user.id)
    ranks = (await db.execute(rank_query)).scalars().all()
    best_rank = "None"
    if "Legendary!" in ranks: best_rank = "Legendary!"
    elif "Expert" in ranks: best_rank = "Expert"
    elif "Intermediate" in ranks: best_rank = "Intermediate"
    elif "Novice" in ranks: best_rank = "Novice"
    
    # 4. Performance History (last 5)
    history_query = select(QuizAttempt).where(
        QuizAttempt.user_id == current_user.id
    ).options(joinedload(QuizAttempt.quiz)).order_by(QuizAttempt.completed_at.desc()).limit(5)
    
    history_results = (await db.execute(history_query)).scalars().all()
    history = []
    for h in history_results:
        h_dict = {
            "id": h.id,
            "user_id": h.user_id,
            "quiz_id": h.quiz_id,
            "quiz_title": h.quiz.title if h.quiz else "Deleted Quiz",
            "score": h.score,
            "total_questions": h.total_questions,
            "correct_answers": h.correct_answers,
            "rank": h.rank,
            "completed_at": h.completed_at
        }
        history.append(h_dict)

    return {
        "quizzes_taken": quizzes_taken,
        "avg_score": round(float(avg_score), 1),
        "best_rank": best_rank,
        "performance_history": history
    }

@router.get("/stats/teacher", response_model=schemas.TeacherStats)
async def get_teacher_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get statistics for teacher dashboard."""
    # 1. Total Quizzes
    quiz_query = select(func.count(Quiz.id)).where(Quiz.teacher_id == current_user.id)
    quiz_count = (await db.execute(quiz_query)).scalar() or 0
    
    # 2. Total Unique Students who joined teacher's quizzes
    student_query = select(func.count(func.distinct(QuizAttempt.user_id))).join(Quiz).where(Quiz.teacher_id == current_user.id)
    student_count = (await db.execute(student_query)).scalar() or 0
    
    # 3. Average Completion Rate
    avg_score_query = select(func.avg(QuizAttempt.score)).join(Quiz).where(Quiz.teacher_id == current_user.id)
    avg_score = (await db.execute(avg_score_query)).scalar() or 0.0
    
    comp_query = select(func.sum(QuizAttempt.correct_answers), func.sum(QuizAttempt.total_questions)).join(Quiz).where(Quiz.teacher_id == current_user.id)
    res = (await db.execute(comp_query)).first()
    comp_rate = (res[0] / res[1] * 100) if res and res[1] and res[1] > 0 else 0.0

    # Get quiz details for the list
    quizzes_query = select(
        Quiz.id, 
        Quiz.title, 
        Quiz.access_code,
        func.count(QuizAttempt.id).label('student_count'),
        func.avg(QuizAttempt.score).label('avg_score')
    ).outerjoin(QuizAttempt).where(Quiz.teacher_id == current_user.id).group_by(Quiz.id)
    
    quiz_results = await db.execute(quizzes_query)
    quizzes_list = []
    for r in quiz_results:
        quizzes_list.append({
            "id": r.id,
            "title": r.title,
            "access_code": r.access_code,
            "student_count": r.student_count,
            "avg_score": round(float(r.avg_score or 0), 1)
        })

    return {
        "total_quizzes": quiz_count,
        "total_students": student_count,
        "avg_completion_rate": round(comp_rate, 1),
        "quizzes": quizzes_list
    }

@router.get("/", response_model=List[schemas.Quiz])
async def list_quizzes(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List quizzes."""
    # For now, return all public quizzes + user's own quizzes
    query = select(Quiz).where(Quiz.teacher_id == current_user.id).offset(skip).limit(limit).options(
        selectinload(Quiz.questions).selectinload(Question.choices)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/{quiz_id}", response_model=schemas.Quiz)
async def get_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get specific quiz."""
    # Use generic loader options and populate_existing to ensure fresh data
    query = select(Quiz).where(Quiz.id == quiz_id).options(
        selectinload(Quiz.questions).selectinload(Question.choices)
    )
    result = await db.execute(query.execution_options(populate_existing=True))
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        print(f"DEBUG: Quiz {quiz_id} not found")
        raise HTTPException(status_code=404, detail="Quiz not found")

    print(f"DEBUG: Fetched Quiz {quiz.id} ({quiz.title})")
    print(f"DEBUG: Questions found in DB object: {len(quiz.questions)}")
    for q in quiz.questions:
        print(f"DEBUG:   - Q {q.id}: {q.text[:30]}... Choices: {len(q.choices)}")
        
    return quiz

@router.delete("/{quiz_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_quiz(
    quiz_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a quiz."""
    query = select(Quiz).where(Quiz.id == quiz_id)
    result = await db.execute(query)
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if quiz.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to delete this quiz")
        
    await db.delete(quiz)
    await db.commit()

@router.put("/{quiz_id}", response_model=schemas.Quiz)
async def update_quiz(
    quiz_id: int,
    quiz_in: schemas.QuizCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update a quiz."""
    query = select(Quiz).where(Quiz.id == quiz_id).options(
        selectinload(Quiz.questions).selectinload(Question.choices)
    )
    result = await db.execute(query)
    db_quiz = result.scalar_one_or_none()
    
    if not db_quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
        
    if db_quiz.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this quiz")
    
    # Update quiz fields
    db_quiz.title = quiz_in.title
    db_quiz.description = quiz_in.description or ""
    db_quiz.is_public = quiz_in.is_public
    
    # Simple approach: delete old questions and add new ones (cascade takes care of choices)
    # Alternatively, you could do a diff, but delete/add is safer for complex structures like this
    for q in db_quiz.questions:
        await db.delete(q)
    
    await db.flush() # Ensure deletions are processed
    
    # Add new questions
    for q_in in quiz_in.questions:
        db_question = Question(
            quiz_id=db_quiz.id,
            text=q_in.text,
            question_type=q_in.question_type,
            points=int(q_in.points),
            time_limit=int(q_in.time_limit)
        )
        db.add(db_question)
        await db.flush()
        
        for c_in in q_in.choices:
            db_choice = Choice(
                question_id=db_question.id,
                text=c_in.text,
                is_correct=c_in.is_correct
            )
            db.add(db_choice)
    
    await db.commit()
    
    # Refresh and return
    query = select(Quiz).where(Quiz.id == db_quiz.id).options(
        selectinload(Quiz.questions).selectinload(Question.choices)
    )
    result = await db.execute(query)
    return result.scalar_one()

@router.get("/by-code/{code}", response_model=schemas.Quiz)
async def get_quiz_by_code(
    code: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a quiz by its access code (for students joining)."""
    query = select(Quiz).where(Quiz.access_code == code.upper()).options(
        selectinload(Quiz.questions).selectinload(Question.choices)
    )
    result = await db.execute(query)
    quiz = result.scalar_one_or_none()
    
    if not quiz:
        raise HTTPException(status_code=404, detail="Invalid room code")
    
    return quiz

@router.post("/{quiz_id}/attempts", response_model=schemas.QuizAttempt)
async def create_quiz_attempt(
    quiz_id: int,
    attempt_in: schemas.QuizAttemptCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Record a quiz attempt after finishing."""
    db_attempt = QuizAttempt(
        quiz_id=quiz_id,
        user_id=current_user.id,
        score=attempt_in.score,
        total_questions=attempt_in.total_questions,
        correct_answers=attempt_in.correct_answers,
        rank=attempt_in.rank
    )
    db.add(db_attempt)
    await db.commit()
    await db.refresh(db_attempt)
    print(f"DEBUG: Saved QuizAttempt {db_attempt.id} for user {current_user.id}. Score: {db_attempt.score}")
    return db_attempt

    # Removed get_teacher_stats from here (moved to top)
    pass

    # Removed get_student_stats from here (moved to top)
    pass

    # Removed get_my_performance from here (moved to top)
    pass


@router.post("/generate-from-pdf", response_model=List[schemas.QuestionCreate])
async def generate_quiz_from_pdf(
    file: UploadFile = File(...),
    num_questions: int = Form(5),
    difficulty: str = Form("Medium"),
    current_user: User = Depends(get_current_user)
):
    """
    Generate quiz questions from an uploaded PDF.
    """
    # 1. Extract text from PDF
    text = await extract_text_from_pdf(file)
    
    # 2. Generate questions using AI
    questions = await generate_quiz_questions(text, num_questions, difficulty)
    
    return questions
