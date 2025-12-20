@echo off
echo ==========================================
echo    Zedny Platform - Full System Starter
echo ==========================================
echo.

:: Get the current directory
set PROJECT_DIR=%~dp0

:: Start Backend
echo [1/2] Starting Backend Server (Port 8000)...
start "Zedny Backend" cmd /k "cd /d %PROJECT_DIR%backend && echo Starting Backend... && .\venv\Scripts\python.exe run.py"

:: Give backend a second to initialize
timeout /t 2 >nul

:: Start Frontend
echo [2/2] Starting Frontend Dev Server (Port 5173)...
start "Zedny Frontend" cmd /k "cd /d %PROJECT_DIR%frontend-react && echo Starting Frontend... && npm run dev"

echo.
echo ==========================================
echo  DONE! 
echo  - Backend: http://127.0.0.1:8000
echo  - Frontend: http://localhost:5173
echo.
echo  Keep the other windows open while working!
echo ==========================================
pause
