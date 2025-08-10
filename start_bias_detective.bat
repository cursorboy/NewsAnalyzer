@echo off
echo Starting Bias Detective - The Bias Lab Submission
echo ================================================

echo.
echo Starting Backend Server...
start "Backend" cmd /k "cd backend && python -m uvicorn app.main:app --port 8000 --reload"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================
echo Bias Detective is starting up!
echo.
echo Backend:  http://localhost:8000
echo Frontend: http://localhost:5173
echo Game:     http://localhost:5173/game
echo.
echo Press any key to close this window...
pause >nul 