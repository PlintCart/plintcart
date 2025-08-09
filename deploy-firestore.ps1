# Deploy Firestore indexes and rules
Write-Host "Deploying Firestore configuration..." -ForegroundColor Green

# Deploy indexes first
Write-Host "Deploying indexes..." -ForegroundColor Yellow
firebase deploy --only firestore:indexes

# Then deploy rules
Write-Host "Deploying rules..." -ForegroundColor Yellow
firebase deploy --only firestore:rules

Write-Host "Firestore configuration deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Index creation may take a few minutes to complete." -ForegroundColor Cyan
Write-Host "You can monitor progress in the Firebase Console." -ForegroundColor Cyan
