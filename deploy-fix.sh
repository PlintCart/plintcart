#!/bin/bash
# Deployment Fix Script for PlintCart

echo "🚀 Deploying with MIME type and COOP fixes..."

# Clear any cached builds
rm -rf dist/
rm -rf node_modules/.vite/

echo "📦 Building with fresh cache..."
npm run build

echo "🔍 Checking built files..."
find dist/assets -name "*.js" -type f | head -5
find dist/assets -name "*.css" -type f | head -5

echo "📋 Verifying headers configuration..."
cat public/_headers | head -15

echo "🌐 Ready for deployment!"
echo "After deploying, test: https://plintcart.io"
echo "If issues persist, clear browser cache (Ctrl+F5) and try again."
