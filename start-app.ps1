Write-Host "🚀 Starting File Transfer App..." -ForegroundColor Green
Write-Host ""

Write-Host "📡 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

Start-Sleep -Seconds 3

Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm start"

Write-Host ""
Write-Host "✅ Both servers are starting up..." -ForegroundColor Green
Write-Host "📱 Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "🎨 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Open http://localhost:3000 in your browser to use the app!" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
