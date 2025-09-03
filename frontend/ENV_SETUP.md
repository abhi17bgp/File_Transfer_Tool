# 🌍 Frontend Environment Setup Guide

This guide explains how to set up environment variables for your File Transfer frontend.

## **📁 Environment Files**

### **1. `env.example`**
- **Purpose**: Template file showing all available environment variables
- **Usage**: Copy this file to create your own `.env` file
- **Git**: ✅ Committed to repository (safe to share)

### **2. `env.local`**
- **Purpose**: Local development environment variables
- **Usage**: Copy to `.env` for local development
- **Git**: ❌ Not committed (contains local settings)

### **3. `env.production`**
- **Purpose**: Production environment template
- **Usage**: Reference for production deployment
- **Git**: ✅ Committed to repository (safe to share)

## **🔧 Local Development Setup**

### **Step 1: Create Local Environment File**
```bash
# In the frontend directory
cp env.local .env
```

### **Step 2: Update Values**
Edit `.env` file with your local settings:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_NAME=File Transfer
REACT_APP_VERSION=1.0.0
REACT_APP_ENABLE_ANALYTICS=false
REACT_APP_ENABLE_DEBUG_MODE=true
```

### **Step 3: Restart Development Server**
```bash
npm start
```

## **🚀 Production Deployment (Vercel)**

### **Step 1: Set Environment Variables in Vercel**
1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `REACT_APP_API_URL` | `https://your-backend.onrender.com` | Production |
| `REACT_APP_NAME` | `File Transfer` | Production |
| `REACT_APP_VERSION` | `1.0.0` | Production |

### **Step 2: Redeploy**
- Vercel will automatically rebuild with new environment variables
- Or manually trigger a new deployment

## **🔍 Environment Variable Reference**

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | ✅ Yes | `http://localhost:5000` | Backend API endpoint |
| `REACT_APP_NAME` | ❌ No | `File Transfer` | Application name |
| `REACT_APP_VERSION` | ❌ No | `1.0.0` | Application version |
| `REACT_APP_ENABLE_ANALYTICS` | ❌ No | `false` | Enable analytics features |
| `REACT_APP_ENABLE_DEBUG_MODE` | ❌ No | `true` | Enable debug features |

## **⚠️ Important Notes**

1. **REACT_APP_ Prefix**: All environment variables must start with `REACT_APP_`
2. **Build Time**: Variables are embedded at build time, not runtime
3. **Security**: Never commit `.env` files to git
4. **Restart Required**: Changes require restarting the development server
5. **Case Sensitive**: Variable names are case-sensitive

## **🔧 Troubleshooting**

### **Environment Variables Not Working?**
1. ✅ Check variable names start with `REACT_APP_`
2. ✅ Restart development server after changes
3. ✅ Verify `.env` file is in the `frontend` directory
4. ✅ Check for typos in variable names

### **Production Issues?**
1. ✅ Verify environment variables are set in Vercel
2. ✅ Check variable values are correct
3. ✅ Redeploy after environment variable changes
4. ✅ Verify backend URL is accessible

---

**💡 Tip**: Use `env.example` as a reference for all available environment variables!
