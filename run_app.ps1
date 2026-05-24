# Campus Connect - Serverless Startup Script

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   🚀 Starting Campus Connect...          " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ensure firebase-tools is installed
Write-Host "[1/3] Verifying Firebase CLI..." -ForegroundColor Yellow
$firebaseExists = Get-Command firebase -ErrorAction SilentlyContinue
if ($null -eq $firebaseExists) {
    Write-Host "Firebase CLI not found. Installing globally via npm..." -ForegroundColor Cyan
    npm install -g firebase-tools
} else {
    Write-Host "Firebase CLI is installed." -ForegroundColor Green
}

# 2. Start Firebase Local Emulators in a separate window
Write-Host "[2/3] Initializing Firebase Offline Emulators (Auth, Firestore, Storage)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { Write-Host '⚡ Starting Firebase Offline Emulators...'; firebase emulators:start; }"

# 3. Start Vite React development server in a separate window
Write-Host "[3/3] Initializing Vite React Hot-Reload Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "& { cd frontend; Write-Host '⚛️ Starting Vite Development Server...'; npm run dev; }"

# 4. Open browser URLs
Start-Sleep -Seconds 4
Write-Host "Opening local URLs in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173/"
Start-Process "http://localhost:4000/"

Write-Host ""
Write-Host "🎉 Startup complete!" -ForegroundColor Green
Write-Host "- Frontend Hub: http://localhost:5173/" -ForegroundColor Cyan
Write-Host "- Database & Auth Simulator UI: http://localhost:4000/" -ForegroundColor Cyan
Write-Host ""
