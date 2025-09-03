# 📱 Using Your Phone's Hotspot for File Transfer

## 🚀 Quick Setup Guide

### Step 1: Start the App on Your Laptop
1. **Run the start script:**
   ```bash
   .\start-app.ps1
   ```
   Or double-click `start-app.bat`

2. **Wait for both servers to start:**
   - Backend: http://localhost:5000
   - Frontend: http://localhost:3000

### Step 2: Set Up Your Phone's Hotspot
1. **On your phone**: Turn on mobile hotspot
2. **On your laptop**: Connect to your phone's hotspot WiFi
3. **Find your laptop's IP address:**
   ```bash
   .\find-ip.ps1
   ```
   Or run: `ipconfig` and look for the IP that starts with `192.168.x.x`

### Step 3: Access from Your Phone
1. **On your phone's browser**: Open `http://[LAPTOP_IP]:3000`
   - Example: `http://192.168.43.1:3000`
2. **Click "Start Server"** on your phone
3. **Scan the QR code** with your laptop, or copy the link
4. **On your laptop**: Open the same URL
5. **Start transferring files!**

## 🔧 Troubleshooting

### If the phone can't connect:
1. **Check firewall**: Make sure Windows Firewall allows the app
2. **Check IP address**: Make sure you're using the correct IP from the hotspot network
3. **Check both devices**: Make sure both are on the same hotspot network

### Common IP addresses for hotspots:
- **Android**: Usually `192.168.43.x` or `192.168.1.x`
- **iPhone**: Usually `172.20.10.x`

## 📱 Example Workflow

1. **Laptop**: Start app → Get IP (e.g., 192.168.43.1)
2. **Phone**: Open http://192.168.43.1:3000
3. **Phone**: Click "Start Server" → Shows QR code
4. **Laptop**: Scan QR or open the same URL
5. **Both devices**: Upload/download files seamlessly!

## 🎯 Benefits of Using Hotspot

- ✅ **No internet required** - works offline
- ✅ **Secure** - only your devices can connect
- ✅ **Fast** - direct connection between devices
- ✅ **Portable** - works anywhere with your phone
