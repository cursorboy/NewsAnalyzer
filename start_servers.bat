@echo off
echo Starting Political Spectrum News Analyzer...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd /d %~dp0 && .\.venv\Scripts\activate.bat && python -m uvicorn backend.app.main:app --port 8000 --reload"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd /d %~dp0\frontend && npx vite"

echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo.
echo Press any key to continue...
pause > nul
