@echo off
title Zedny Platform Starter

echo ==========================================
echo    Zedny Platform - Full System Starter
echo ==========================================
echo.

set "BASE_DIR=%~dp0"

echo [1/3] Checking Backend...
if not exist "%BASE_DIR%backend\.env" (
    echo [!] .env file not found in backend.
    echo [!] Creating .env from .env.example...
    copy "%BASE_DIR%backend\.env.example" "%BASE_DIR%backend\.env" >nul
    echo [!] IMPORTANT: Please open backend\.env and set your database/API keys!
)

if not exist "%BASE_DIR%backend\venv" (
    echo [!] Creating virtual environment...
    cd /d "%BASE_DIR%backend"
    python -m venv venv || py -m venv venv
    venv\Scripts\pip install -r requirements.txt
    echo [!] Running database migrations...
    venv\Scripts\alembic upgrade head
)

echo [2/3] Checking Frontend...
if not exist "%BASE_DIR%frontend-react\node_modules" (
    echo [!] Installing node_modules...
    cd /d "%BASE_DIR%frontend-react"
    call npm install
)

echo [3/3] Starting Servers...

:: Kill existing processes on ports 8000 and 5173 if possible
echo Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :8000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr LISTENING ^| findstr :5173') do taskkill /f /pid %%a >nul 2>&1

:: Start Backend
echo Launching Backend...
start "Zedny Backend" /D "%BASE_DIR%backend" cmd /k "venv\Scripts\python.exe run.py"

:: Start Frontend
timeout /t 2 >nul
echo Launching Frontend...
start "Zedny Frontend" /D "%BASE_DIR%frontend-react" cmd /k "npm run dev"

echo.
echo ==========================================
echo  ALL SYSTEMS ARE STARTING!
echo  Backend: http://127.0.0.1:8000
echo  Frontend: http://localhost:5173
echo ==========================================
pause
