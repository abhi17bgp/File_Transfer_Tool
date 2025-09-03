@echo off
echo 🔄 Switching to port 3001 for backend (usually allowed by firewall)...
echo.

echo 📝 Updating backend to use port 3001...
powershell -Command "(Get-Content 'backend\server.js') -replace 'const PORT = process\.env\.PORT \|\| 5000;', 'const PORT = process.env.PORT || 3001;' | Set-Content 'backend\server.js'"

echo 📝 Updating frontend to use port 3001...
powershell -Command "(Get-Content 'frontend\src\App.js') -replace 'http://localhost:5000', 'http://localhost:3001' | Set-Content 'frontend\src\App.js'"
powershell -Command "(Get-Content 'frontend\src\App.js') -replace 'http://\${window\.location\.hostname}:5000', 'http://${window.location.hostname}:3001' | Set-Content 'frontend\src\App.js'"

echo.
echo ✅ Configuration updated!
echo 🚀 Now restart your backend and frontend servers
echo 📱 Your phone should be able to connect to port 3001
echo.
pause
