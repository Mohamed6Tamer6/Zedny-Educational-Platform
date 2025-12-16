"""
Question Generation Service using RAG (Retrieval-Augmented Generation)
Generates quiz questions from PDF documents using Google Gemini AI.
"""
import os
import json
import tempfile
from typing import List, Dict, Optional
from pypdf import PdfReader
import google.generativeai as genai
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings

# Configure Gemini
settings = get_settings()
GOOGLE_API_KEY = settings.GOOGLE_API_KEY or settings.GEMINI_API_KEY or ""

class QuestionGenerator:
    """Generates quiz questions from PDF content using RAG approach."""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or GOOGLE_API_KEY
        
        if not self.api_key:
            raise ValueError(
                "Google API Key is required for question generation. "
                "Please set GOOGLE_API_KEY in your environment or provide it as a parameter."
            )
        
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash-latest')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=2000,
            chunk_overlap=200,
            length_function=len
        )
    
    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text content from a PDF file."""
        try:
            reader = PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n\n"
            return text.strip()
        except Exception as e:
            raise ValueError(f"Error reading PDF: {str(e)}")
    
    def extract_text_from_bytes(self, pdf_bytes: bytes) -> str:
        """Extract text from PDF bytes."""
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as tmp:
            tmp.write(pdf_bytes)
            tmp_path = tmp.name
        
        try:
            text = self.extract_text_from_pdf(tmp_path)
        finally:
            os.unlink(tmp_path)
        
        return text
    
    def generate_questions(
        self,
        content: str,
        num_questions: int = 5,
        difficulty: str = "medium"
    ) -> List[Dict]:
        """
        Generate quiz questions from the given content.
        
        Args:
            content: Text content to generate questions from
            num_questions: Number of questions to generate (1-20)
            difficulty: Question difficulty - "beginner", "medium", or "advanced"
        
        Returns:
            List of question dictionaries with text, choices, and correct answer
        """
        if not self.api_key:
            raise ValueError("Google API Key is required. Set GOOGLE_API_KEY environment variable.")
        
        # Validate inputs
        num_questions = max(1, min(20, num_questions))
        difficulty = difficulty.lower()
        if difficulty not in ["beginner", "medium", "advanced", "intermediate"]:
            difficulty = "medium"
        if difficulty == "intermediate":
            difficulty = "advanced"
        
        # Chunk the content for better context
        chunks = self.text_splitter.split_text(content)
        
        # Use most relevant chunks (first few for simplicity, in production use embeddings)
        context = "\n\n".join(chunks[:5])  # Use up to 5 chunks
        
        # Build the prompt
        difficulty_descriptions = {
            "beginner": "simple and straightforward, testing basic understanding",
            "medium": "moderately challenging, requiring good comprehension",
            "advanced": "complex and challenging, requiring deep understanding and analysis"
        }
        
        prompt = f"""You are an expert quiz creator. Based on the following content, create exactly {num_questions} multiple-choice questions.

DIFFICULTY LEVEL: {difficulty.upper()}
The questions should be {difficulty_descriptions.get(difficulty, "moderately challenging")}.

CONTENT:
{context}

INSTRUCTIONS:
1. Create exactly {num_questions} questions based ONLY on the provided content.
2. Each question must have exactly 4 answer choices (A, B, C, D).
3. Only ONE answer should be correct per question.
4. Make sure questions test understanding of the content, not just memorization.
5. Vary the position of correct answers (don't always make it the first choice).

REQUIRED OUTPUT FORMAT (JSON array):
[
  {{
    "text": "Question text here?",
    "choices": [
      {{"text": "First answer", "is_correct": false}},
      {{"text": "Second answer", "is_correct": true}},
      {{"text": "Third answer", "is_correct": false}},
      {{"text": "Fourth answer", "is_correct": false}}
    ]
  }}
]

Generate the questions now as a valid JSON array:"""

        try:
            response = self.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Extract JSON from response
            json_start = response_text.find('[')
            json_end = response_text.rfind(']') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No valid JSON array found in response")
            
            json_str = response_text[json_start:json_end]
            questions = json.loads(json_str)
            
            # Validate structure
            validated_questions = []
            for q in questions:
                if "text" in q and "choices" in q:
                    # Ensure exactly 4 choices
                    choices = q["choices"][:4]
                    while len(choices) < 4:
                        choices.append({"text": "No answer", "is_correct": False})
                    
                    # Ensure at least one correct answer
                    has_correct = any(c.get("is_correct", False) for c in choices)
                    if not has_correct:
                        choices[0]["is_correct"] = True
                    
                    validated_questions.append({
                        "text": q["text"],
                        "choices": choices
                    })
            
            return validated_questions[:num_questions]
            
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse AI response as JSON: {str(e)}")
        except Exception as e:
            raise ValueError(f"Error generating questions: {str(e)}")


# Singleton instance
_generator_instance = None

def get_question_generator(api_key: Optional[str] = None) -> QuestionGenerator:
    """Get or create a QuestionGenerator instance."""
    global _generator_instance
    if _generator_instance is None or api_key:
        _generator_instance = QuestionGenerator(api_key)
    return _generator_instance
