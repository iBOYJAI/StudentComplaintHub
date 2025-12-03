@echo off
echo ==========================================
echo   Student Complaint Hub - Starting...
echo ==========================================
echo.

echo [1/2] Starting Backend Server (Port 5000)...
start "Backend Server" cmd /k "cd /d %~dp0backend && python wsgi.py"
timeout /t 3 /nobreak > nul

echo [2/2] Starting Frontend Server (Port 8080)...
start "Frontend Server" cmd /k "cd /d %~dp0frontend && python server.py"

echo.
echo ==========================================
echo   Application Started Successfully!
echo ==========================================
echo.
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:8080
echo.
echo   Default Login Credentials:
echo   - Admin:   admin / admin123
echo   - Student: john_student / student123
echo   - Staff:   sarah_staff / staff123
echo.
echo Press any key to stop all servers...
pause > nul

echo Stopping servers...
taskkill /FI "WindowTitle eq Backend Server*" /T /F > nul 2>&1
taskkill /FI "WindowTitle eq Frontend Server*" /T /F > nul 2>&1
echo Servers stopped.
