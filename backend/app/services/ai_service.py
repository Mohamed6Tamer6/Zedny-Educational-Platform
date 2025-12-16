import google.generativeai as genai
import json
from app.core.config import get_settings
from fastapi import HTTPException
from typing import List, Dict, Any

settings = get_settings()

if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)

async def generate_quiz_questions(text: str, num_questions: int, difficulty: str) -> List[Dict[str, Any]]:
    """
    Generates quiz questions from the given text using Gemini AI.
    
    Args:
        text (str): The source text.
        num_questions (int): Number of questions to generate.
        difficulty (str): Difficulty level (Beginner, Medium, Advanced).
        
    Returns:
        List[Dict[str, Any]]: A list of generated questions.
    """
    if not settings.GEMINI_API_KEY:
         raise HTTPException(status_code=500, detail="Gemini API Key is not configured.")

    model = genai.GenerativeModel('gemini-flash-latest')
    
    prompt = f"""
    You are an expert quiz creator. Generate {num_questions} multiple-choice quiz questions based on the provided text.
    The difficulty level should be: {difficulty}.
    
    Current Text Context:
    {text[:100000]} 
    
    (Note: Text is truncated to fit context window if too long).
    
    Output the result STRICTLY as a valid JSON array of objects. Do not include markdown formatting (like ```json).
    Each object should represent a question and have the following structure:
    {{
        "text": "Question text here",
        "question_type": "multiple_choice",
        "points": 10,
        "time_limit": 30,
        "choices": [
            {{ "text": "Choice 1", "is_correct": false }},
            {{ "text": "Choice 2", "is_correct": true }},
            {{ "text": "Choice 3", "is_correct": false }},
            {{ "text": "Choice 4", "is_correct": false }}
        ]
    }}
    
    Ensure exactly one choice is correct per question.
    """
    
    try:
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up if the model adds markdown code blocks despite instructions
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        if response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
            
        questions = json.loads(response_text)
        return questions
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Generation failed: {str(e)}")
