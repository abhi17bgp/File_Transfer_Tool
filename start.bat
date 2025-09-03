@echo off
echo Starting File Transfer App...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm start"
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm start"
echo.
echo Both servers are starting...
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause
