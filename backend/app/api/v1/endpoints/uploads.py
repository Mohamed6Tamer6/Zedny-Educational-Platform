from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
import shutil
import uuid
import pathlib
import os
from app.api import deps
from app.models.user import User

router = APIRouter()

# Get the path to the uploads directory relative to this file
current_file = pathlib.Path(__file__).parent.absolute()
# backend/app/api/v1/endpoints -> backend/app/api/v1 -> backend/app/api -> backend/app -> backend
backend_dir = current_file.parent.parent.parent.parent
UPLOAD_DIR = backend_dir / "uploads"

@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(deps.get_current_active_user)
):
    """
    Upload a file (image or PDF) and return its public URL.
    """
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    # Generate unique filename
    file_extension = pathlib.Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not save file: {e}")
    
    # Return the URL
    return {"url": f"/uploads/{unique_filename}"}
