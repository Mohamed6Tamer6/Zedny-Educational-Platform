from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, desc
from sqlalchemy.orm import selectinload, joinedload

from app.api.deps import get_current_user
from app.models.user import User, UserRole
from app.models.quiz import Question, Choice
from app.models.ai import ChatSession, ChatMessage
from app.services.ai_service import get_ai_service
from app.db.session import get_db

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    system_context: Optional[str] = None
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    reply: str
    success: bool
    session_id: Optional[int] = None

class SessionResponse(BaseModel):
    id: int
    title: str
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True

class MessageResponse(BaseModel):
    role: str
    content: str
    created_at: Any

    class Config:
        from_attributes = True

class ExplainRequest(BaseModel):
    question_id: int
    student_answer: str
    history: List[Dict[str, str]] = [] # For interactive chat

@router.get("/sessions", response_model=List[SessionResponse])
async def get_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all AI chat sessions for the current user."""
    query = select(ChatSession).where(ChatSession.user_id == current_user.id).order_by(desc(ChatSession.updated_at))
    result = await db.execute(query)
    sessions = result.scalars().all()
    return list(sessions)

@router.get("/sessions/{session_id}/messages", response_model=List[MessageResponse])
async def get_session_messages(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve all messages for a specific chat session."""
    query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    result = await db.execute(query)
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    query = select(ChatMessage).where(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at)
    result = await db.execute(query)
    messages = result.scalars().all()
    return list(messages)

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a chat session and its history."""
    query = delete(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
    await db.execute(query)
    await db.commit()
    return {"success": True}

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Endpoint for users to chat with the AI Assistant.
    Supports persistent sessions and message history.
    """
    try:
        service = get_ai_service()
        
        # Get or create session
        session_id = request.session_id
        if session_id:
            query = select(ChatSession).where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
            result = await db.execute(query)
            session = result.scalar_one_or_none()
            if not session:
                session_id = None # Fallback to new session if invalid
        
        if not session_id:
            # Create a new session with the first few words of the message as title
            title = request.message[:50] + "..." if len(request.message) > 50 else request.message
            new_session = ChatSession(user_id=current_user.id, title=title)
            db.add(new_session)
            await db.flush() # Get ID before commit
            session_id = new_session.id
        
        # Save user message
        user_msg = ChatMessage(session_id=session_id, role="user", content=request.message)
        db.add(user_msg)
        
        # Get AI response
        # Note: history in request is still supported for stateless calls or optimization,
        # but we could also fetch it from database here if needed.
        reply = service.get_chat_response(request.message, request.history, request.system_context)
        
        # Save assistant message
        assistant_msg = ChatMessage(session_id=session_id, role="assistant", content=reply)
        db.add(assistant_msg)
        
        await db.commit()
        
        return ChatResponse(reply=reply, success=True, session_id=session_id)
        
    except Exception as e:
        await db.rollback()
        print(f"ERROR: Chat endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/explain-mistake", response_model=ChatResponse)
async def explain_mistake(
    request: ExplainRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    AI Tutor: Explains why a specific answer was wrong and why another is right.
    Now supports follow-up chat and quiz source context.
    """
    try:
        # Fetch question and choices to provide context to AI
        query = select(Question).where(Question.id == request.question_id).options(
            selectinload(Question.choices),
            joinedload(Question.quiz)
        )
        result = await db.execute(query)
        question = result.scalar_one_or_none()
        
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        choices_texts = [c.text for c in question.choices]
        correct_answer = next((c.text for c in question.choices if c.is_correct), "Unknown")
        
        # Get source text if available for better context
        source_text = question.quiz.source_text
        
        # If no source_text, check if quiz is linked to a lesson
        if not source_text:
            from app.models.course import Lesson
            lesson_query = select(Lesson).where(Lesson.linked_quiz_id == question.quiz_id)
            lesson_result = await db.execute(lesson_query)
            lesson = lesson_result.scalar_one_or_none()
            if lesson:
                source_text = lesson.content_text
        
        # If it's a follow-up (history exists), use chat logic
        service = get_ai_service()
        
        if request.history:
            # Continue the explanation conversation
            system_context = (
                f"You are an empathetic expert tutor. You are helping a student understand this question:\n"
                f"Question: {question.text}\n"
                f"Choices: {', '.join(choices_texts)}\n"
                f"The correct answer is: {correct_answer}\n"
                f"The student originally chose: {request.student_answer}\n"
            )
            if source_text:
                system_context += f"\nReference Material (PDF/Lesson Content):\n{source_text}\n"
            
            system_context += "\nInstruction: Answer the student's follow-up questions clearly and supportively. Ground your answers in the reference material if provided."
            
            # Use the last message as the prompt
            last_msg = request.history[-1]["content"]
            history_minus_last = request.history[:-1]
            reply = service.get_chat_response(last_msg, history_minus_last, system_context)
            return ChatResponse(reply=reply, success=True)
        else:
            # Initial explanation
            explanation = service.explain_quiz_mistake(
                question=question.text,
                choices=choices_texts,
                correct_answer=correct_answer,
                student_answer=request.student_answer,
                lesson_context=source_text
            )
            return ChatResponse(reply=explanation, success=True)
    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR: Explanation endpoint error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
