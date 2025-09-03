# Fix Windows Firewall for File Transfer App
# Run this script as Administrator

Write-Host "🔧 Fixing Windows Firewall for File Transfer App..." -ForegroundColor Yellow
Write-Host ""

# Add firewall rule for backend (port 5000)
Write-Host "📡 Adding firewall rule for backend (port 5000)..." -ForegroundColor Cyan
netsh advfirewall firewall add rule name="File Transfer Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="File Transfer Backend Out" dir=out action=allow protocol=TCP localport=5000

# Add firewall rule for frontend (port 3000)
Write-Host "🌐 Adding firewall rule for frontend (port 3000)..." -ForegroundColor Cyan
netsh advfirewall firewall add rule name="File Transfer Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="File Transfer Frontend Out" dir=out action=allow protocol=TCP localport=3000

Write-Host ""
Write-Host "✅ Firewall rules added successfully!" -ForegroundColor Green
Write-Host "📱 Your phone should now be able to connect to the backend" -ForegroundColor Green
Write-Host ""
Write-Host "🔍 To verify, check if the rules were added:" -ForegroundColor Yellow
Write-Host "   netsh advfirewall firewall show rule name='File Transfer*'" -ForegroundColor Gray
Write-Host ""
Write-Host "🚀 Restart your backend and frontend servers after this" -ForegroundColor Yellow
Write-Host "📱 Test the connection from your phone again" -ForegroundColor Yellow
