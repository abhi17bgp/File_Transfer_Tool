# 🚀 File Transfer App - Deployment Helper Script
# This script helps prepare your app for deployment to Vercel + Render

Write-Host "🚀 Preparing File Transfer App for Deployment..." -ForegroundColor Green
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "📁 Initializing Git repository..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Git repository initialized" -ForegroundColor Green
} else {
    Write-Host "✅ Git repository already exists" -ForegroundColor Green
}

# Check current git status
Write-Host ""
Write-Host "📊 Current Git Status:" -ForegroundColor Cyan
git status --porcelain

# Add all files
Write-Host ""
Write-Host "📦 Adding all files to Git..." -ForegroundColor Yellow
git add .

# Check if there are changes to commit
$changes = git status --porcelain
if ($changes) {
    Write-Host ""
    Write-Host "💾 Committing changes..." -ForegroundColor Yellow
    git commit -m "Add MongoDB integration and deployment config for Vercel + Render"
    Write-Host "✅ Changes committed" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "ℹ️  No changes to commit" -ForegroundColor Blue
}

Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Green
Write-Host "1. Create a new repository on GitHub" -ForegroundColor White
Write-Host "2. Add your GitHub repository as remote origin:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git" -ForegroundColor Cyan
Write-Host "3. Push to GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host "4. Set up MongoDB Atlas cluster" -ForegroundColor White
Write-Host "5. Deploy backend to Render with MongoDB connection" -ForegroundColor White
Write-Host "6. Deploy frontend to Vercel" -ForegroundColor White
Write-Host ""
Write-Host "📖 See DEPLOYMENT.md for detailed instructions!" -ForegroundColor Yellow
Write-Host ""
Write-Host "🚀 Happy Deploying!" -ForegroundColor Green
