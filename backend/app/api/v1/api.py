"""
=============================================================================
API V1 Router Aggregator
=============================================================================
This module aggregates all API v1 endpoint routers into a single router.
The combined router is then mounted on the main FastAPI app with /api/v1 prefix.

Included Routers:
- health: Health check endpoint (/health)
- auth: Authentication endpoints (/auth/*)
- quizzes: Quiz CRUD operations (/quizzes/*)
- generate: AI question generation (/generate/*)

Tags are used for OpenAPI documentation grouping.

Author: Zedny Development Team
=============================================================================
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, auth, quizzes, generate

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(quizzes.router, prefix="/quizzes", tags=["Quizzes"])
api_router.include_router(generate.router, prefix="/generate", tags=["Question Generation"])

