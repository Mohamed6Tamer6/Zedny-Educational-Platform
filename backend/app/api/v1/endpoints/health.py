"""
=============================================================================
Health Check Endpoint Module
=============================================================================
This module provides a simple health check endpoint for monitoring the API.

Used by:
- Load balancers to check application health
- Monitoring systems for uptime tracking
- Deployment pipelines for readiness checks

Endpoint:
- GET /health: Returns API status

Author: Zedny Development Team
=============================================================================
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check():
    """Health check endpoint to verify API is running."""
    return {
        "status": "healthy",
        "message": "Zedny API is running smoothly"
    }
