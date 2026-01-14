"""
=============================================================================
AI Assistant Service
=============================================================================
This module provides AI-powered chat and content generation services for teachers.
Uses OpenAI's GPT models to provide educational assistance.
"""
import os
from typing import List, Dict, Optional
from openai import OpenAI
from app.core.config import get_settings
from app.services.question_generator import get_question_generator

settings = get_settings()

class AIService:
    """Handles general AI chat interactions for educational assistance."""
    
    def __init__(self, api_key: Optional[str] = None):
        import os
        self.api_key = api_key or settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError("OpenAI API Key is missing.")
        
        self.client = OpenAI(api_key=self.api_key)

    def get_chat_response(self, message: str, history: List[Dict[str, str]], system_context: Optional[str] = None) -> str:
        """
        Sends a message to the AI and gets a response, considering the chat history.
        Can be grounded with a custom system_context (e.g., lesson content).
        """
        default_system_prompt = (
            "You are an expert educational content assistant for the Zedny platform. "
            "Your goal is to help users (teachers or students) with educational content. "
            "Be professional, encouraging, and clear. Format your responses using Markdown for readability. "
            "You support both English and Arabic."
        )
        
        system_prompt = system_context if system_context else default_system_prompt

        messages = [{"role": "system", "content": system_prompt}]
        
        # Add relevant history (last 5 messages to save tokens and maintain context)
        for h in history[-5:]:
            messages.append({"role": h["role"], "content": h["content"]})
            
        # Add current message
        messages.append({"role": "user", "content": message})

        try:
            print(f"DEBUG: AI Assistant - Processing message: {message[:50]}...")
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
                timeout=30.0 # Add timeout to prevent hanging
            )
            reply = response.choices[0].message.content.strip()
            print("DEBUG: AI Assistant - Response received successfully.")
            return reply
        except Exception as e:
            print(f"ERROR: AI Assistant Service Error: {e}")
            raise Exception(f"AI Service Error: {str(e)}")

    def explain_quiz_mistake(self, question: str, choices: List[str], correct_answer: str, student_answer: str, lesson_context: Optional[str] = None) -> str:
        """
        Generates a pedagogical explanation for a student's mistake in a quiz.
        """
        prompt = (
            f"Question: {question}\n"
            f"Options: {', '.join(choices)}\n"
            f"Correct Answer: {correct_answer}\n"
            f"Student's Answer: {student_answer}\n\n"
        )
        
        if lesson_context:
            prompt += f"Reference Material (PDF/Lesson Content):\n{lesson_context}\n\n"
            
        prompt += (
            "Instruction: Explain to the student in a supportive, teacher-like tone why their answer was incorrect "
            "and why the correct answer is right. Focus on the underlying concept and use the Reference Material provided to ground your explanation. "
            "If the Student's Answer is actually the same as the Correct Answer (even if the system marked it wrong), clarify this and affirm the student. "
            "The explanation should be in the same language as the question (Arabic or English)."
        )

        system_prompt = "You are an empathetic, expert tutor on the Zedny Educational Platform."

        try:
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=800,
                timeout=30.0
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            print(f"ERROR: AI Mistake Explanation Error: {e}")
            raise Exception(f"Explanation Service Error: {str(e)}")

_ai_service_instance = None

def get_ai_service(api_key: Optional[str] = None) -> AIService:
    global _ai_service_instance
    if _ai_service_instance is None or api_key:
        _ai_service_instance = AIService(api_key)
    return _ai_service_instance

async def generate_quiz_questions(content: str, num_questions: int = 5, difficulty: str = "medium") -> List[Dict]:
    """
    Wrapper function to maintain backward compatibility with quizzes.py.
    Uses the QuestionGenerator service.
    """
    generator = get_question_generator()
    return generator.generate_questions(content, num_questions, difficulty)
