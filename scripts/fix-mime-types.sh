#!/bin/bash
# Post-build script to ensure correct MIME types

echo "🔧 Fixing MIME types and headers for deployment..."

# Ensure dist directory exists
if [ ! -d "dist" ]; then
  echo "❌ dist directory not found"
  exit 1
fi

# Add explicit Content-Type meta tags to HTML
if [ -f "dist/index.html" ]; then
  echo "📝 Adding explicit JavaScript module meta tags to HTML..."
  
  # Add module preload hints
  sed -i 's|</head>|<link rel="modulepreload" href="/assets/main-*.js" as="script" type="module">\n<link rel="modulepreload" href="/assets/vendor-*.js" as="script" type="module">\n</head>|g' dist/index.html || true
fi

# Create a comprehensive .htaccess file as backup
cat > dist/.htaccess << 'EOF'
# Force correct MIME types for JavaScript files
<FilesMatch "\.(js|mjs|tsx)$">
  Header set Content-Type "application/javascript; charset=utf-8"
  Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# CORS and security headers for authentication
<IfModule mod_headers.c>
  Header always set Cross-Origin-Opener-Policy "same-origin-allow-popups"
  Header always set Cross-Origin-Embedder-Policy "credentialless"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set X-Content-Type-Options "nosniff"
</IfModule>
EOF

echo "✅ MIME type fixes applied!"

# List the generated JavaScript files for verification
echo "📋 Generated JavaScript files:"
find dist/assets -name "*.js" -type f | head -10
