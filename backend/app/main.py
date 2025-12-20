"""
=============================================================================
Main Application Entry Point
=============================================================================
This module serves as the main entry point for the Zedny Educational Platform
FastAPI application. It handles:

- Application initialization and configuration
- CORS middleware setup for cross-origin requests
- API router registration
- Static file serving for the React frontend (production mode)
- SPA fallback routing for client-side navigation

The application supports two modes:
1. Development: Frontend runs on Vite dev server (port 5173)
2. Production: Backend serves the built React app from /frontend-react/dist

Author: Zedny Development Team
Version: 1.0.0
=============================================================================
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import pathlib

from app.core.config import get_settings
from app.api.v1.api import api_router

settings = get_settings()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    description="Backend API for Zedny Educational Platform",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)

current_dir = pathlib.Path(__file__).parent.absolute()
backend_dir = current_dir.parent
project_dir = backend_dir.parent

react_frontend_dir = project_dir / "frontend-react"
react_dist_dir = react_frontend_dir / "dist"
react_assets_dir = react_dist_dir / "assets"

if react_assets_dir.exists():
    app.mount("/assets", StaticFiles(directory=str(react_assets_dir)), name="assets")


@app.get("/", include_in_schema=False)
async def spa_root():
    index_path = react_dist_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return JSONResponse(
        {
            "detail": "React frontend is not built yet.",
            "how_to_run_dev": "Run `npm install` then `npm run dev` in `frontend-react` and open http://localhost:5173",
            "how_to_build_prod": "Run `npm run build` in `frontend-react` to generate `frontend-react/dist`, then refresh http://127.0.0.1:8000",
        },
        status_code=200,
    )


@app.get("/{full_path:path}", include_in_schema=False)
async def spa_fallback(full_path: str):
    requested_path = react_dist_dir / full_path
    if requested_path.exists() and requested_path.is_file():
        return FileResponse(requested_path)

    index_path = react_dist_dir / "index.html"
    if index_path.exists():
        return FileResponse(index_path)

    return JSONResponse(
        {
            "detail": "React frontend is not built yet.",
            "how_to_run_dev": "Run `npm install` then `npm run dev` in `frontend-react` and open http://localhost:5173",
        },
        status_code=404,
    )
