@echo off
echo 🔧 Fixing Windows Firewall for File Transfer App...
echo.
echo This script will add firewall rules for ports 5000 and 3000
echo You may need to run this as Administrator
echo.
pause

echo 📡 Adding firewall rule for backend (port 5000)...
netsh advfirewall firewall add rule name="File Transfer Backend" dir=in action=allow protocol=TCP localport=5000
netsh advfirewall firewall add rule name="File Transfer Backend Out" dir=out action=allow protocol=TCP localport=5000

echo 🌐 Adding firewall rule for frontend (port 3000)...
netsh advfirewall firewall add rule name="File Transfer Frontend" dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="File Transfer Frontend Out" dir=out action=allow protocol=TCP localport=3000

echo.
echo ✅ Firewall rules added successfully!
echo 📱 Your phone should now be able to connect to the backend
echo.
echo 🚀 Test the connection from your phone now
echo 📱 Open: http://10.226.82.107:3000
echo.
pause
