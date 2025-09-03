# 🚀 **Deploy to Vercel (Frontend) + Render (Backend) for Global Access**

This guide will help you deploy your file transfer app with MongoDB to Vercel (frontend) and Render (backend), making it accessible from anywhere in the world!

## **📋 Prerequisites**

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Render Account** - Sign up at [render.com](https://render.com)
4. **MongoDB Atlas Account** - Sign up at [mongodb.com/atlas](https://mongodb.com/atlas)
5. **Node.js 16+** - For local testing

## **🗄️ Step 1: Set Up MongoDB Atlas**

### **1.1 Create MongoDB Atlas Cluster**
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) and sign up
2. Create a new project
3. Build a new cluster (choose FREE tier)
4. Choose your preferred cloud provider and region
5. Click "Create Cluster"

### **1.2 Configure Database Access**
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Set privileges to "Read and write to any database"
6. Click "Add User"

### **1.3 Configure Network Access**
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for production)
4. Click "Confirm"

### **1.4 Get Connection String**
1. Go back to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<dbname>` with `file-transfer`

**Example:**
```
mongodb+srv://username:password@cluster.mongodb.net/file-transfer?retryWrites=true&w=majority
```

## **🔧 Step 2: Prepare Your Repository**

### **2.1 Push to GitHub**
```bash
# Initialize git if not already done
git init
git add .
git commit -m "Add MongoDB integration and deployment config"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### **2.2 Verify Files**
Make sure these files are in your repository:
- ✅ `render.yaml` (Render configuration)
- ✅ `frontend/vercel.json` (Vercel configuration)
- ✅ `backend/package.json` (with MongoDB dependencies)
- ✅ `backend/models/File.js` (MongoDB schema)
- ✅ `backend/config/database.js` (MongoDB connection)
- ✅ `backend/server.js` (updated with MongoDB)
- ✅ `frontend/src/App.js` (with delete functionality)
- ✅ `frontend/src/components/FileList.jsx` (with delete UI)

## **🌐 Step 3: Deploy Backend to Render**

### **3.1 Connect GitHub to Render**
1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your repository

### **3.2 Deploy with Blueprint**
1. Render will automatically detect `render.yaml`
2. Click **"Create New Blueprint Instance"**
3. Render will create the backend service automatically

### **3.3 Set MongoDB Environment Variable**
1. Go to your backend service in Render
2. Click "Environment" tab
3. Add environment variable:
   - **Key**: `MONGODB_URI`
   - **Value**: Your MongoDB Atlas connection string
4. Click "Save Changes"
5. Redeploy the service

## **🚀 Step 4: Deploy Frontend to Vercel**

### **4.1 Connect GitHub to Vercel**
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Select the repository

### **4.2 Configure Build Settings**
1. **Framework Preset**: Create React App
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `build`
5. Click **"Deploy"**

### **4.3 Set Environment Variable**
1. Go to your project dashboard
2. Click "Settings" → "Environment Variables"
3. Add environment variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: `https://YOUR_BACKEND_URL.onrender.com`
4. Click "Save"
5. Redeploy the project

## **🔗 Step 5: Update Frontend API URL**

After both deployments, update the frontend environment variable:

1. Go to your Vercel project
2. Go to "Settings" → "Environment Variables"
3. Update `REACT_APP_API_URL` with your Render backend URL
4. Redeploy the frontend

## **📱 Step 6: Test Your Deployed App**

### **6.1 Test Backend**
```bash
# Test health endpoint
curl https://YOUR_BACKEND_URL.onrender.com/api/health

# Test IP endpoint
curl https://YOUR_BACKEND_URL.onrender.com/api/ip
```

### **6.2 Test Frontend**
1. Open your Vercel frontend URL in browser
2. Click "Start Server"
3. Test file upload/download/delete

## **🌍 Step 7: Global Access**

Now your app is accessible from anywhere:
- **Frontend**: `https://YOUR_PROJECT.vercel.app`
- **Backend**: `https://YOUR_BACKEND_URL.onrender.com`

### **Mobile Testing:**
1. Share the frontend URL with anyone
2. They can access it from any device
3. No need for local network or hotspot!

## **🔧 Troubleshooting**

### **Common Issues:**

#### **1. MongoDB Connection Errors**
- Verify `MONGODB_URI` environment variable in Render
- Check MongoDB Atlas network access settings
- Ensure database user has correct permissions

#### **2. Build Failures**
- Check Node.js version (must be 16+)
- Verify all dependencies in package.json
- Check build logs in Vercel/Render dashboards

#### **3. API Connection Errors**
- Verify `REACT_APP_API_URL` environment variable in Vercel
- Check CORS settings in backend
- Ensure backend is running and healthy

#### **4. File Upload/Delete Issues**
- Check file size limits (100MB in current config)
- Verify MongoDB connection is working
- Check server logs for errors

### **Debug Commands:**
```bash
# Check backend logs
# Go to Render dashboard → Backend service → Logs

# Check frontend build
# Go to Vercel dashboard → Project → Deployments → Build logs
```

## **💰 Cost & Limits**

### **Vercel (Frontend):**
- **Free Tier**: Unlimited deployments, 100GB bandwidth/month
- **Pro Plan**: $20/month for more features

### **Render (Backend):**
- **Free Tier**: 750 hours/month (enough for testing)
- **Paid Plans**: Start at $7/month for always-on service

### **MongoDB Atlas:**
- **Free Tier**: 512MB storage, shared clusters
- **Paid Plans**: Start at $9/month for dedicated clusters

## **🚀 Next Steps**

1. **Custom Domain**: Add your own domain name to both services
2. **SSL Certificate**: Automatically provided by both platforms
3. **Monitoring**: Set up alerts and monitoring
4. **Scaling**: Upgrade to paid plans for production use
5. **CDN**: Vercel provides global CDN automatically

## **📞 Support**

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Render Docs**: [docs.render.com](https://docs.render.com)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**🎉 Congratulations!** Your file transfer app with MongoDB is now globally accessible on Vercel + Render!
