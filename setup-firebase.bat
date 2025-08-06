@echo off
echo Starting Firebase setup for CORS fix...
echo.

echo Step 1: Installing Firebase CLI...
npm install -g firebase-tools

echo.
echo Step 2: Logging into Firebase...
echo Please follow the browser login process...
firebase login

echo.
echo Step 3: Initializing Firebase project...
echo When prompted:
echo - Select "Firestore" and "Storage" 
echo - Use existing project
echo - Accept default Firestore rules file
echo - Accept default Storage rules file
echo.
firebase init

echo.
echo Step 4: Deploying rules to fix CORS...
firebase deploy --only firestore:rules,storage:rules

echo.
echo Step 5 (Alternative): If CORS still persists, configure Storage CORS manually...
echo Install Google Cloud SDK and run:
echo gsutil cors set cors.json gs://takeapp-294ca.firebasestorage.app

echo.
echo Setup complete! Try uploading an image again.
pause
