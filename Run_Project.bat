@echo off
setlocal

title Zedny Platform Starter

echo ==========================================
echo    Zedny Platform - Full System Starter
echo ==========================================
echo.

:: Get the current directory (trailing backslash included)
set "BASE_DIR=%~dp0"

:: 1. Check Backend Dependencies
echo [1/4] Checking Backend Environment...
if not exist "%BASE_DIR%backend\venv" (
    echo [!] Virtual environment (venv) not found. Creating it...
    cd /d "%BASE_DIR%backend"
    python -m venv venv || (echo ERROR: Python not found! && pause && exit /b)
    echo [!] Installing backend dependencies...
    "%BASE_DIR%backend\venv\Scripts\pip" install -r requirements.txt
) else (
    echo [+] Backend venv found.
)

:: 2. Check Frontend Dependencies
echo [2/4] Checking Frontend Dependencies...
if not exist "%BASE_DIR%frontend-react\node_modules" (
    echo [!] node_modules not found. Installing dependencies...
    cd /d "%BASE_DIR%frontend-react"
    call npm install || (echo ERROR: npm install failed! && pause && exit /b)
) else (
    echo [+] Frontend dependencies found.
)

:: 3. Start Backend
echo [3/4] Starting Backend Server (Port 8000)...
start "Zedny Backend" cmd /k "cd /d "%BASE_DIR%backend" && echo Starting Backend... && venv\Scripts\python.exe run.py"

:: Give backend a second to initialize
echo Waiting for backend...
timeout /t 5 >nul

:: 4. Start Frontend
echo [4/4] Starting Frontend Dev Server (Port 5173)...
start "Zedny Frontend" cmd /k "cd /d "%BASE_DIR%frontend-react" && echo Starting Frontend... && npm run dev"

echo.
echo ==========================================
echo  ALL SYSTEMS ARE STARTING!
echo  - Backend: http://127.0.0.1:8000
echo  - Frontend: http://localhost:5173
echo.
echo  Note: Keep these windows open while working.
echo ==========================================
echo.
pause
