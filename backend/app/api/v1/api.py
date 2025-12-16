from fastapi import APIRouter

from app.api.v1.endpoints import health, auth, quizzes, generate

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(generate.router, prefix="/generate", tags=["Question Generation"])

