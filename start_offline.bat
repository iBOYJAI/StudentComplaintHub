@echo off
echo ========================================
echo Student Complaint Hub - Offline Mode
echo ========================================
echo.

cd backend

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo.
echo Auto-configuring database...
python auto_detect_db.py

echo.
echo Starting server...
echo.
python main.py

pause

