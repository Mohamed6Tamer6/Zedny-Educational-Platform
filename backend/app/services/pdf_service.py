import io
from pypdf import PdfReader
from fastapi import UploadFile, HTTPException

async def extract_text_from_pdf(file: UploadFile) -> str:
    """
    Extracts text content from an uploaded PDF file.
    
    Args:
        file (UploadFile): The uploaded PDF file.
        
    Returns:
        str: The extracted text.
        
    Raises:
        HTTPException: If the file is not a valid PDF or text cannot be extracted.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF is allowed.")
    
    try:
        content = await file.read()
        pdf_file = io.BytesIO(content)
        reader = PdfReader(pdf_file)
        
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        return text.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
    finally:
        await file.seek(0)
