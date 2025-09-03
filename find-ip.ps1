Write-Host "🔍 Finding your laptop's IP address..." -ForegroundColor Green
Write-Host ""

# Get all network adapters with IPv4 addresses
$adapters = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" }

Write-Host "📱 Available IP addresses:" -ForegroundColor Yellow
Write-Host ""

foreach ($adapter in $adapters) {
    $interface = Get-NetAdapter | Where-Object { $_.InterfaceIndex -eq $adapter.InterfaceIndex }
    Write-Host "🌐 Interface: $($interface.Name)" -ForegroundColor Cyan
    Write-Host "   IP Address: $($adapter.IPAddress)" -ForegroundColor White
    Write-Host "   Subnet Mask: $($adapter.PrefixLength)" -ForegroundColor Gray
    Write-Host ""
}

Write-Host "💡 When connected to your phone's hotspot:" -ForegroundColor Magenta
Write-Host "   - Use the IP address that starts with 192.168.x.x or 10.x.x.x" -ForegroundColor White
Write-Host "   - Open http://[IP_ADDRESS]:3000 on your phone" -ForegroundColor White
Write-Host "   - Example: http://192.168.43.1:3000" -ForegroundColor White
Write-Host ""

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
