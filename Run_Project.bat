@echo off
setlocal enabledelayedexpansion

echo ==========================================
echo    Zedny Platform - Full System Starter
echo ==========================================
echo.

:: Get the current directory
set PROJECT_DIR=%~dp0

:: 1. Check Backend Dependencies
echo [1/4] Checking Backend Environment...
if not exist "%PROJECT_DIR%backend\venv\" (
    echo [!] Virtual environment (venv) not found. Creating it...
    cd /d "%PROJECT_DIR%backend"
    python -m venv venv
    echo [!] Installing backend dependencies...
    .\venv\Scripts\pip install -r requirements.txt
) else (
    echo [+] Backend venv found.
)

:: 2. Check Frontend Dependencies
echo [2/4] Checking Frontend Dependencies...
if not exist "%PROJECT_DIR%frontend-react\node_modules\" (
    echo [!] node_modules not found. Installing dependencies (this may take a minute)...
    cd /d "%PROJECT_DIR%frontend-react"
    call npm install
) else (
    echo [+] Frontend dependencies found.
)

:: 3. Start Backend
echo [3/4] Starting Backend Server (Port 8000)...
start "Zedny Backend" cmd /k "cd /d %PROJECT_DIR%backend && echo Starting Backend... && .\venv\Scripts\python.exe run.py"

:: Give backend a second to initialize
timeout /t 3 >nul

:: 4. Start Frontend
echo [4/4] Starting Frontend Dev Server (Port 5173)...
start "Zedny Frontend" cmd /k "cd /d %PROJECT_DIR%frontend-react && echo Starting Frontend... && npm run dev"

echo.
echo ==========================================
echo  🎉 ALL SYSTEMS GO! 
echo  - Backend: http://127.0.0.1:8000
echo  - Frontend: http://localhost:5173
echo.
echo  Note: If this is the first run, the frontend 
echo  might take a few seconds to start.
echo ==========================================
pause
