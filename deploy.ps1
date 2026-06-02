# Campus Connect - One-Click Firebase Deploy Script

$ProjectId = "campusconnect-afd1e"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   🚀 Deploying Campus Connect...         " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ensure Firebase CLI is installed
Write-Host "[1/4] Checking Firebase CLI..." -ForegroundColor Yellow
$firebaseExists = Get-Command firebase -ErrorAction SilentlyContinue
if ($null -eq $firebaseExists) {
    Write-Host "Firebase CLI not found. Installing globally via npm..." -ForegroundColor Cyan
    npm install -g firebase-tools
} else {
    Write-Host "Firebase CLI verified." -ForegroundColor Green
}

# 2. Build Frontend for production
Write-Host ""
Write-Host "[2/4] Compiling optimized React frontend..." -ForegroundColor Yellow
cd frontend
npm run build
cd ..

# 3. Connect to Firebase project
Write-Host ""
Write-Host "[3/4] Linking shell to project: $ProjectId..." -ForegroundColor Yellow
& firebase use --add $ProjectId --alias production

# 4. Trigger live deployment
Write-Host ""
Write-Host "[4/4] Uploading assets and policies to Firebase..." -ForegroundColor Yellow
& firebase deploy --only hosting,firestore,storage,functions

Write-Host ""
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "Your website is now LIVE on Google Cloud!" -ForegroundColor Green
Write-Host "Visit your custom URL above." -ForegroundColor Cyan
Write-Host ""
