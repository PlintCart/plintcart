@echo off
REM Post-build script to ensure correct MIME types (Windows version)

echo 🔧 Fixing MIME types and headers for deployment...

REM Check if dist directory exists
if not exist "dist" (
    echo ❌ dist directory not found
    exit /b 1
)

REM Create comprehensive .htaccess file
(
echo # Force correct MIME types for JavaScript files
echo ^<FilesMatch "\.(js|mjs|tsx^)$"^>
echo   Header set Content-Type "application/javascript; charset=utf-8"
echo   Header set Cache-Control "public, max-age=31536000, immutable"
echo ^</FilesMatch^>
echo.
echo # CORS and security headers for authentication
echo ^<IfModule mod_headers.c^>
echo   Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
echo   Header always set Cross-Origin-Embedder-Policy "credentialless"
echo   Header always set X-Frame-Options "SAMEORIGIN"
echo   Header always set X-Content-Type-Options "nosniff"
echo ^</IfModule^>
) > dist\.htaccess

echo ✅ MIME type fixes applied!

REM List JavaScript files
echo 📋 Generated JavaScript files:
dir dist\assets\*.js /b 2>nul | findstr /R ".*" | head

echo 🚀 Build post-processing complete!
