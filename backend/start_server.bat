@echo off
REM Batch script to start the FastAPI server on Windows
cd /d "%~dp0"
call venv\Scripts\activate
python run.py

