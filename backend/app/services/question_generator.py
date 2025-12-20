"""
=============================================================================
Question Generator Service (OpenAI RAG)
=============================================================================
This module provides AI-powered question generation using OpenAI's GPT models
with a RAG (Retrieval-Augmented Generation) approach.

Classes:
- QuestionGenerator: Main class for generating quiz questions

Key Features:
- PDF text extraction using PyPDF
- Text chunking using LangChain's RecursiveCharacterTextSplitter
- Question generation using OpenAI GPT-4o-mini
- JSON structured output format
- Validation and normalization of generated questions

Workflow:
1. Extract text from PDF bytes
2. Split text into manageable chunks
3. Send chunks to OpenAI with structured prompt
4. Parse and validate JSON response
5. Return normalized question objects

Dependencies:
- OpenAI API key (required)
- PyPDF for PDF parsing
- LangChain for text splitting

Author: Zedny Development Team
=============================================================================
"""
import os
import json
import tempfile
from typing import List, Dict, Optional
from pypdf import PdfReader
from openai import OpenAI
from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.config import get_settings

# Configure OpenAI
settings = get_settings()

class QuestionGenerator:
    """Generates quiz questions from PDF content using RAG approach with OpenAI."""
    
    def __init__(self, api_key: Optional[str] = None):
        import os
        # Try explicit key -> settings -> direct env
        self.api_key = api_key or settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
        
        if not self.api_key:
            raise ValueError(
                "OpenAI API Key is required for question generation. "
                "Please set OPENAI_API_KEY in your environment or provide it as a parameter."
            )
        
        self.client = OpenAI(api_key=self.api_key)
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
        """
        if not self.api_key:
            raise ValueError("OpenAI API Key is required.")
        
        # Validate inputs
        num_questions = max(1, min(20, num_questions))
        difficulty = difficulty.lower()
        if difficulty not in ["beginner", "medium", "advanced", "intermediate"]:
            difficulty = "medium"
        
        # Chunk the content
        chunks = self.text_splitter.split_text(content)
        if not chunks:
            print("ERROR: No text chunks generated from content.")
            raise ValueError("No text content could be extracted from the PDF.")
            
        print(f"DEBUG: Content split into {len(chunks)} chunks. Using first 5 for context.")
        context = "\n\n".join(chunks[:5])  # Use up to 5 chunks
        
        prompt = f"""You are an expert quiz creator. Based on the provided content, create exactly {num_questions} multiple-choice questions.

DIFFICULTY LEVEL: {difficulty.upper()}
CONTENT:
{context}

INSTRUCTIONS:
1. Create exactly {num_questions} questions.
2. Each question must have exactly 4 answer choices (A, B, C, D).
3. Only ONE answer should be correct.
4. Output strict JSON format.

REQUIRED JSON STRUCTURE:
[
  {{
    "text": "Question text?",
    "choices": [
      {{"text": "Answer 1", "is_correct": false}},
      {{"text": "Answer 2", "is_correct": true}},
      {{"text": "Answer 3", "is_correct": false}},
      {{"text": "Answer 4", "is_correct": false}}
    ]
  }}
]
"""

        try:
            print(f"DEBUG: Requesting {num_questions} questions from OpenAI...")
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "You are a helpful assistant that generates quiz questions in JSON format. Always return a JSON object with a 'questions' key containing the list of questions."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            response_text = response.choices[0].message.content.strip()
            print(f"DEBUG: AI Raw Response: {response_text[:200]}...")
            
            # Check if wrapped in logic like {"questions": [...]} or just [...]
            # OpenAI with json_object mode usually returns what you ask, but sometimes wraps it.
            # We asked for array, but json_object mode requires object at root usually?
            # Actually, gpt-4-turbo json mode requires the output to be a JSON object, not list.
            # Let's verify the prompt instruction.
            
            # Re-parse
            try:
                data = json.loads(response_text)
                if isinstance(data, list):
                    questions = data
                elif isinstance(data, dict) and "questions" in data:
                    questions = data["questions"]
                else:
                    # Try to find a list in the dict
                    found = False
                    for key, val in data.items():
                        if isinstance(val, list):
                            questions = val
                            found = True
                            break
                    if not found:
                         questions = [data] # Fallback
            except json.JSONDecodeError:
                # Manual finding of array
                start = response_text.find('[')
                end = response_text.rfind(']') + 1
                if start != -1 and end != 0:
                     questions = json.loads(response_text[start:end])
                else:
                     raise ValueError("Could not parse JSON from response")

            # Validate
            validated_questions = []
            for q in questions:
                if "text" in q and "choices" in q:
                    choices = q["choices"][:4]
                    while len(choices) < 4:
                        choices.append({"text": "N/A", "is_correct": False})
                    
                    if not any(c.get("is_correct") for c in choices):
                        choices[0]["is_correct"] = True
                        
                    validated_questions.append({
                        "text": q.get("text", "Untitled Question"),
                        "choices": choices
                    })
            
            return validated_questions[:num_questions]
            
        except Exception as e:
            print(f"ERROR: OpenAI Generation Failed: {e}")
            raise ValueError(f"Error generating questions: {str(e)}")

# Singleton instance
_generator_instance = None

def get_question_generator(api_key: Optional[str] = None) -> QuestionGenerator:
    """Get or create a QuestionGenerator instance."""
    global _generator_instance
    if _generator_instance is None or api_key:
        _generator_instance = QuestionGenerator(api_key)
    return _generator_instance
